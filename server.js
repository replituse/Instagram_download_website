const express = require('express');
const instagramGetUrl = require('instagram-url-direct');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'New Frame')));

app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const results = await instagramGetUrl(url);
        if (!results || !results.url_list || results.url_list.length === 0) {
            throw new Error('No download links found');
        }
        
        // Return the first found media link
        res.json({
            success: true,
            mediaUrl: results.url_list[0],
            author: 'Instagram User',
            duration: '0:30',
            thumbnail: results.url_list[0]
        });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to fetch Instagram media. Please check the URL.' });
    }
});

app.get('/api/proxy-download', async (req, res) => {
    const { url, filename } = req.query;
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'instagram-media.mp4'}"`);
        response.data.pipe(res);
    } catch (error) {
        console.error('Proxy download error:', error.message);
        res.status(500).send('Download failed');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend listening at http://0.0.0.0:${port}`);
});
