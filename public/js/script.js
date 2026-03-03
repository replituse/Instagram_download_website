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
            if (data.isCarousel) {
                renderCarousel(data.items);
            } else {
                renderSingleMedia(data);
            }
            
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

    function renderSingleMedia(data) {
        const container = document.getElementById('resultsGrid');
        container.innerHTML = `
            <!-- Video Preview Card -->
            <div class="bg-neutral-50 rounded-large p-4 sm:p-6 border border-neutral-200">
                <div class="aspect-[9/16] max-h-[400px] sm:max-h-none bg-neutral-200 rounded-large mb-4 overflow-hidden relative mx-auto">
                    <img id="videoThumbnail" src="/api/proxy-download?url=${encodeURIComponent(data.thumbnail)}&type=image" alt="Video thumbnail" class="w-full h-full object-cover">
                    <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <div class="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center">
                            <i data-lucide="play" class="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 ml-1"></i>
                        </div>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
                        <i data-lucide="user" class="w-3 h-3 sm:w-4 sm:h-4"></i>
                        <span id="videoAuthor">${data.author || '@username'}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
                        <i data-lucide="clock" class="w-3 h-3 sm:w-4 sm:h-4"></i>
                        <span id="videoDuration">${data.duration || '0:30'}</span>
                    </div>
                </div>
            </div>

            <!-- Download Options Card -->
            <div class="space-y-3 sm:space-y-4">
                <div class="bg-white rounded-large p-4 sm:p-6 border border-neutral-200 shadow-sm hover:shadow-custom transition-shadow">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2 sm:gap-3">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 bg-primary-50 rounded-small flex items-center justify-center flex-shrink-0">
                                <i data-lucide="video" class="w-4 h-4 sm:w-5 sm:h-5 text-primary-600"></i>
                            </div>
                            <div>
                                <h3 class="font-heading font-bold text-neutral-900 text-sm sm:text-base">HD Quality</h3>
                                <p class="text-xs sm:text-sm text-neutral-500">1080p • MP4</p>
                            </div>
                        </div>
                    </div>
                    <button onclick="downloadVideo('hd')" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-small transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px]">
                        <i data-lucide="download" class="w-4 h-4 sm:w-5 sm:h-5"></i>
                        <span>Download HD</span>
                    </button>
                </div>

                <div class="bg-white rounded-large p-4 sm:p-6 border border-neutral-200 shadow-sm hover:shadow-custom transition-shadow">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2 sm:gap-3">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 bg-secondary-50 rounded-small flex items-center justify-center flex-shrink-0">
                                <i data-lucide="video" class="w-4 h-4 sm:w-5 sm:h-5 text-secondary-600"></i>
                            </div>
                            <div>
                                <h3 class="font-heading font-bold text-neutral-900 text-sm sm:text-base">Standard Quality</h3>
                                <p class="text-xs sm:text-sm text-neutral-500">720p • MP4</p>
                            </div>
                        </div>
                    </div>
                    <button onclick="downloadVideo('sd')" class="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 px-4 rounded-small transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px]">
                        <i data-lucide="download" class="w-4 h-4 sm:w-5 sm:h-5"></i>
                        <span>Download SD</span>
                    </button>
                </div>

                <div class="bg-white rounded-large p-4 sm:p-6 border border-neutral-200 shadow-sm hover:shadow-custom transition-shadow">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2 sm:gap-3">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 bg-green-50 rounded-small flex items-center justify-center flex-shrink-0">
                                <i data-lucide="music" class="w-4 h-4 sm:w-5 sm:h-5 text-green-600"></i>
                            </div>
                            <div>
                                <h3 class="font-heading font-bold text-neutral-900 text-sm sm:text-base">Audio Only</h3>
                                <p class="text-xs sm:text-sm text-neutral-500">MP3 • 320kbps</p>
                            </div>
                        </div>
                    </div>
                    <button onclick="downloadVideo('audio')" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-small transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px]">
                        <i data-lucide="download" class="w-4 h-4 sm:w-5 sm:h-5"></i>
                        <span>Download Audio</span>
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    function renderCarousel(items) {
        const container = document.getElementById('resultsGrid');
        container.classList.remove('grid-cols-1', 'lg:grid-cols-2');
        container.classList.add('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'gap-4');
        
        container.innerHTML = items.map((item, index) => `
            <div class="bg-white rounded-large p-4 border border-neutral-200 shadow-sm">
                <div class="aspect-square bg-neutral-100 rounded-small mb-3 overflow-hidden">
                    <img src="/api/proxy-download?url=${encodeURIComponent(item.thumbnail)}&type=image" class="w-full h-full object-cover">
                </div>
                <button onclick="downloadCarouselItem(${index})" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-small transition-colors flex items-center justify-center gap-2 text-sm">
                    <i data-lucide="download" class="w-4 h-4"></i>
                    <span>Download ${item.type === 'video' ? 'Video' : 'Image'}</span>
                </button>
            </div>
        `).join('');
        lucide.createIcons();
    }

    window.downloadCarouselItem = function(index) {
        if (!currentMediaData || !currentMediaData.items[index]) return;
        const item = currentMediaData.items[index];
        const filename = `instagram-${item.type}-${Date.now()}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
        window.location.href = `/api/proxy-download?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(filename)}&type=${item.type}`;
    };

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
