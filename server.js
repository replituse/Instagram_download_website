const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const port = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function getInstagramMedia(url) {
    const sessionId = process.env.INSTAGRAM_SESSIONID;
    let command = `yt-dlp --dump-json --no-playlist "${url}"`;
    
    if (sessionId) {
        const cookiePath = path.join(os.tmpdir(), `ig_cookies_${Date.now()}.txt`);
        const cookieContent = [
            '# Netscape HTTP Cookie File',
            `.instagram.com\tTRUE\t/\tTRUE\t9999999999\tsessionid\t${sessionId}`
        ].join('\n');
        fs.writeFileSync(cookiePath, cookieContent);
        command = `yt-dlp --dump-json --no-playlist --cookies "${cookiePath}" "${url}"`;
        
        try {
            const { stdout } = await execAsync(command, { timeout: 30000 });
            if (fs.existsSync(cookiePath)) fs.unlinkSync(cookiePath);
            return JSON.parse(stdout);
        } catch (error) {
            if (fs.existsSync(cookiePath)) fs.unlinkSync(cookiePath);
            throw error;
        }
    } else {
        const { stdout } = await execAsync(command, { timeout: 30000 });
        return JSON.parse(stdout);
    }
}

app.post('/api/download', async (req, res) => {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const urlObj = new URL(url);
        const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;

        console.log('Fetching URL:', cleanUrl);

        const data = await getInstagramMedia(cleanUrl);

        const formats = data.formats || [];
        
        // Handle Multiple Media (Carousel)
        if (data.entries && data.entries.length > 0) {
            const items = data.entries.map(entry => {
                const entryFormats = entry.formats || [];
                const combined = entryFormats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url);
                const videoOnly = entryFormats.filter(f => f.vcodec !== 'none' && (f.acodec === 'none' || !f.acodec) && f.url);
                const audio = entryFormats.filter(f => f.acodec !== 'none' && (f.vcodec === 'none' || !f.vcodec) && f.url);

                combined.sort((a, b) => (b.height || 0) - (a.height || 0));
                videoOnly.sort((a, b) => (b.height || 0) - (a.height || 0));

                const hd = combined[0]?.url || videoOnly[0]?.url || entry.url;
                return {
                    url: hd,
                    thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url || hd,
                    type: (entry.vcodec && entry.vcodec !== 'none') ? 'video' : 'image',
                    author: entry.uploader || data.uploader || 'Instagram User'
                };
            });

            return res.json({
                success: true,
                isCarousel: true,
                items,
                author: data.uploader || data.channel || 'Instagram User',
                thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || items[0]?.thumbnail
            });
        }

        // Existing single media logic
        const combinedFormats = formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url);
        
        // Fallback to separate video/audio if no combined exists (rare for IG, but good for safety)
        const videoOnlyFormats = formats.filter(f => f.vcodec !== 'none' && (f.acodec === 'none' || !f.acodec) && f.url);
        const audioFormats = formats.filter(f => f.acodec !== 'none' && (f.vcodec === 'none' || !f.vcodec) && f.url);

        combinedFormats.sort((a, b) => (b.height || 0) - (a.height || 0));
        videoOnlyFormats.sort((a, b) => (b.height || 0) - (a.height || 0));
        audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));

        const hdUrl = combinedFormats[0]?.url || videoOnlyFormats[0]?.url || data.url;
        const sdUrl = combinedFormats.length > 1 ? combinedFormats[Math.floor(combinedFormats.length / 2)]?.url : (videoOnlyFormats.length > 1 ? videoOnlyFormats[Math.floor(videoOnlyFormats.length / 2)]?.url : hdUrl);
        const audioUrl = audioFormats[0]?.url || combinedFormats[0]?.url || null;

        const url_list = [hdUrl];
        if (sdUrl && sdUrl !== hdUrl) url_list.push(sdUrl);
        if (audioUrl) url_list.push(audioUrl);

        res.json({
            success: true,
            mediaUrl: hdUrl,
            url_list,
            hdUrl,
            sdUrl,
            audioUrl,
            author: data.uploader || data.channel || 'Instagram User',
            duration: data.duration_string || '0:30',
            thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || hdUrl
        });
    } catch (error) {
        console.error('Download error:', error.message);
        res.status(500).json({ error: 'Could not fetch this Instagram post. Make sure the link is public and valid.' });
    }
});

const ALLOWED_HOSTS = ['instagram.com', 'cdninstagram.com', 'fbcdn.net', 'fbsbx.com'];

function isAllowedUrl(urlStr) {
    try {
        const parsed = new URL(urlStr);
        return ALLOWED_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
    } catch {
        return false;
    }
}

app.get('/api/proxy-download', async (req, res) => {
    const { url, filename, type } = req.query;

    if (!url || !isAllowedUrl(url)) {
        return res.status(400).send('Invalid or disallowed URL');
    }

    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://www.instagram.com/'
            }
        });

        let finalFilename = filename || 'instagram-media.mp4';
        if (type === 'audio') {
            res.setHeader('Content-Type', 'audio/mpeg');
            finalFilename = finalFilename.replace('.mp4', '.mp3');
        } else if (type === 'image') {
            res.setHeader('Content-Type', 'image/jpeg');
        } else {
            res.setHeader('Content-Type', 'video/mp4');
        }

        if (type !== 'image') {
            res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
        }
        response.data.pipe(res);
    } catch (error) {
        console.error('Proxy download error:', error.message);
        res.status(500).send('Download failed');
    }
});

app.listen(port, '0.0.0.0', async () => {
    console.log(`Backend listening at http://0.0.0.0:${port}`);
    try {
        const { stdout } = await execAsync('yt-dlp --version');
        console.log(`yt-dlp version: ${stdout.trim()}`);
    } catch (error) {
        console.error('yt-dlp not found:', error.message);
    }
});
