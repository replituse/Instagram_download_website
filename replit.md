# FastVideoSave

## Project Overview
An Instagram Reel downloader web app called **FastVideoSave**. Users paste an Instagram Reel URL and can download it in HD, SD, or audio-only format.

## Tech Stack
- **Runtime:** Node.js 20
- **Backend:** Express.js (server.js)
- **Frontend:** HTML, Tailwind CSS (CDN), Lucide Icons (CDN), vanilla JavaScript
- **Key packages:** `instagram-url-direct`, `axios`, `fluent-ffmpeg`

## Project Structure
```
/
├── server.js         # Express backend - API routes for download & proxy
├── package.json      # npm dependencies and start script
├── public/
│   ├── index.html    # Main frontend page
│   ├── css/styles.css
│   └── js/script.js
└── attached_assets/  # Reference images
```

## Running the App
- **Command:** `node server.js`
- **Port:** 5000
- **Host:** 0.0.0.0

## API Endpoints
- `POST /api/download` — Fetches Instagram Reel media URLs from a given Instagram URL
- `GET /api/proxy-download` — Proxies the download of media files (restricted to instagram/fbcdn domains)

## Security Notes
- Proxy endpoint validates URLs against an allowlist (`instagram.com`, `cdninstagram.com`, `fbcdn.net`, `fbsbx.com`)
- No sensitive credentials required — uses public Instagram media CDN links

## Deployment
- **Type:** Autoscale (Node.js server)
