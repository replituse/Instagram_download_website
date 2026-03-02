document.addEventListener('DOMContentLoaded', function() {
    const downloadForm = document.getElementById('downloadForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const downloadBtn = document.getElementById('downloadBtn');
    const resultsSection = document.getElementById('resultsSection');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoAuthor = document.getElementById('videoAuthor');
    const videoDuration = document.getElementById('videoDuration');

    let currentMediaData = null;

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('translate-x-full');
        });
    }

    downloadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const url = videoUrlInput.value.trim();
        if (!url) return;

        // Reset state
        errorMessage.classList.add('hidden');
        resultsSection.classList.add('hidden');
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<span>Processing...</span><i data-lucide="loader" class="w-5 h-5 animate-spin"></i>';
        lucide.createIcons();

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch video details');
            }

            currentMediaData = data;
            
            // Update UI
            // Use proxy for thumbnail to avoid CORS/403 issues
            videoThumbnail.src = `/api/proxy-download?url=${encodeURIComponent(data.thumbnail)}&type=image`;
            videoAuthor.textContent = data.author || '@instagram_user';
            videoDuration.textContent = data.duration || '0:30';
            
            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error:', error);
            errorText.textContent = error.message || 'An error occurred. Please try again.';
            errorMessage.classList.remove('hidden');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<span>Download</span><i data-lucide="arrow-right" class="w-5 h-5"></i>';
            lucide.createIcons();
        }
    });

    window.downloadVideo = function(quality) {
        if (!currentMediaData) return;
        
        let url;
        let type;
        let filename;

        if (quality === 'audio') {
            url = currentMediaData.audioUrl || currentMediaData.hdUrl;
            type = 'audio';
            filename = `instagram-audio-${Date.now()}.mp3`;
        } else if (quality === 'hd') {
            url = currentMediaData.hdUrl;
            type = 'video';
            filename = `instagram-video-hd-${Date.now()}.mp4`;
        } else {
            url = currentMediaData.sdUrl || currentMediaData.hdUrl;
            type = 'video';
            filename = `instagram-video-sd-${Date.now()}.mp4`;
        }

        if (!url) return;
        
        window.location.href = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&type=${type}`;
    };

    window.resetForm = function() {
        resultsSection.classList.add('hidden');
        videoUrlInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
});
