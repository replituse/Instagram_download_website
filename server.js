const express = require('express');
const ig = require('instagram-url-direct');
const instagramGetUrl = ig.instagramGetUrl;
const axios = require('axios');
const path = require('path');
const app = express();
const port = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/download', async (req, res) => {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        // Clean the URL - remove query params that might interfere
        const urlObj = new URL(url);
        const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;
        
        console.log('Fetching URL:', cleanUrl);
        const results = await instagramGetUrl(cleanUrl);

        if (!results || !results.url_list || results.url_list.length === 0) {
            throw new Error('No download links found. The post might be private, deleted, or the link is invalid.');
        }
        
        const mediaUrl = results.url_list[0];
        
        res.json({
            success: true,
            mediaUrl: mediaUrl,
            url_list: results.url_list,
            author: 'Instagram User',
            duration: '0:30',
            thumbnail: mediaUrl // This will be proxied by the frontend
        });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Instagram restricted this request or the link is invalid. Please try again later or check if the post is public.' });
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

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend listening at http://0.0.0.0:${port}`);
});
