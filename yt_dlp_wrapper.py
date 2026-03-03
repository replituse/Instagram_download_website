import sys
import json
import yt_dlp
import os
import tempfile

def get_info(url, session_id=None):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
        'ignoreerrors': True,
        'no_check_certificate': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    }
    
    cookie_path = None
    if session_id and session_id.strip():
        cookie_content = f".instagram.com\tTRUE\t/\tTRUE\t9999999999\tsessionid\t{session_id}\n"
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("# Netscape HTTP Cookie File\n")
            f.write(cookie_content)
            cookie_path = f.name
        ydl_opts['cookiefile'] = cookie_path
        
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return json.dumps(info)
    except Exception as e:
        return json.dumps({"error": str(e)})
    finally:
        if cookie_path and os.path.exists(cookie_path):
            os.remove(cookie_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "URL required"}))
        sys.exit(1)
    url = sys.argv[1]
    session_id = sys.argv[2] if len(sys.argv) > 2 else None
    print(get_info(url, session_id))
