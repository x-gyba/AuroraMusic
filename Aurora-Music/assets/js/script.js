/**
 * ============================================================
 * SCRIPT.JS - PLAYER E NAVEGAÇÃO - AURORA MUSIC 2026
 * ============================================================
 */

const player = {
    audio: document.getElementById('audioPlayer') || new Audio(),
    playlist: [],
    originalPlaylist: [],
    currentIndex: 0,
    isPlaying: false,
    isShuffle: false,
    repeatMode: 0, // 0: No Repeat, 1: Repeat Playlist, 2: Repeat Track
    _menuToggleClick: false,

    init() {
        this.cacheElements();
        this.setupPlaylist();
        if (this.playlist.length > 0) this.loadTrack(0);
        this.setupEvents();
        this.setupSearch();
        this.setupNavigation();
        this.setupMobileBottomNav();
    },

    cacheElements() {
        this.trackName     = document.getElementById('trackName');
        this.artistName    = document.getElementById('artistName');
        this.playBtn       = document.getElementById('playBtn');
        this.albumArt      = document.getElementById('albumArtContainer');
        this.albumCover    = document.getElementById('albumCover');
        this.progress      = document.getElementById('progress');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl    = document.getElementById('duration');
        this.volumeSlider  = document.getElementById('volumeSlider');
        this.shuffleBtn    = document.getElementById('shuffleBtn');
        this.repeatBtn     = document.getElementById('repeatBtn');
        this.searchInput   = document.getElementById('searchInput');
        this.playlistContainer = document.getElementById('playlistContainer');
        this.nav           = document.querySelector('.nav');
        this.menuToggle    = document.querySelector('.menu-toggle');
    },

    getHeaderHeight() {
        const h = document.querySelector('.header');
        return h ? h.getBoundingClientRect().height : 0;
    },

    scrollToElement(el) {
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, top - this.getHeaderHeight()), behavior: 'smooth' });
    },

    scrollToBottom() {
        const footer    = document.getElementById('footer');
        const mobileNav = document.querySelector('.mobile-nav-scroll');
        const navH      = mobileNav ? mobileNav.offsetHeight : 0;
        if (footer) {
            const target = footer.offsetTop + footer.offsetHeight - window.innerHeight + navH;
            window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
        } else {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        }
    },

    /* ===================== NAVEGAÇÃO ===================== */

    setupNavigation() {
        const btnOuvir = document.querySelector('.btn-primary');
        if (btnOuvir) {
            btnOuvir.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToElement(document.getElementById('music'));
            });
        }

        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => {
                this._menuToggleClick = true;
                this.nav.classList.toggle('active');
                const icon = this.menuToggle.querySelector('i');
                if (icon) icon.className = this.nav.classList.contains('active') ? 'bx bx-x' : 'bx bx-menu';
            });
        }

        document.querySelectorAll('.nav a, .footer a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.id === 'loginTrigger' || link.id === 'footerLoginTrigger') return;

                const href = link.getAttribute('href');
                if (!href || !href.startsWith('#')) return;
                e.preventDefault();
                this.closeMobileMenu();
                
                const id = href.replace('#', '');
                if (!id || id === 'home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    this.scrollToElement(document.getElementById(id));
                }
            });
        });

        document.addEventListener('click', () => {
            if (this._menuToggleClick) {
                this._menuToggleClick = false;
                return;
            }
            this.closeMobileMenu();
        });
    },

    closeMobileMenu() {
        if (this.nav?.classList.contains('active')) {
            this.nav.classList.remove('active');
            const icon = this.menuToggle?.querySelector('i');
            if (icon) icon.className = 'bx bx-menu';
        }
    },

    setupMobileBottomNav() {
        const mobileNav = document.querySelector('.mobile-nav-scroll');
        if (!mobileNav) return;

        const mobileLinks = Array.from(mobileNav.querySelectorAll('a'));
        const setActive = (id) => {
            mobileLinks.forEach(l => l.classList.remove('active'));
            const found = mobileLinks.find(l => (l.getAttribute('href') || '').replace('#', '') === id);
            if (found) found.classList.add('active');
        };

        mobileLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = link.getAttribute('href').replace('#', '');
                if (id === 'contact') this.scrollToBottom();
                else this.scrollToElement(document.getElementById(id) || document.body);
            });
        });
    },

    /* ===================== PLAYER CORE ===================== */

    setupPlaylist() {
        const items = document.querySelectorAll('.playlist-item');
        this.playlist = Array.from(items).map((item, index) => ({
            src:     item.dataset.src,
            display: item.dataset.display,
            cover:   item.dataset.cover || 'assets/images/cover.png',
            element: item,
            originalIndex: index
        }));
        this.originalPlaylist = [...this.playlist];

        this.playlist.forEach((track, index) => {
            track.element.onclick = () => { 
                const realIndex = this.playlist.findIndex(t => t.src === track.src);
                this.loadTrack(realIndex); 
                this.play(); 
            };
        });
    },

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const m = this.playlist[index];
        this.audio.src = m.src;
        
        // Capa
        if (this.albumCover) {
            this.albumCover.src = m.cover;
            this.albumCover.onerror = () => this.albumCover.src = 'assets/images/cover.png';
        }
        
        // Texto
        if (m.display.includes(' - ')) {
            const p = m.display.split(' - ');
            this.artistName.innerText = p[0].trim();
            this.trackName.innerText  = p[1].trim();
        } else {
            this.trackName.innerText  = m.display;
            this.artistName.innerText = 'Artista';
        }
        this.highlightCurrentTrack();
    },

    highlightCurrentTrack() {
        document.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('active'));
        if (this.playlist[this.currentIndex]) {
            this.playlist[this.currentIndex].element.classList.add('active');
        }
    },

    shufflePlaylist() {
        if (!this.originalPlaylist.length) this.originalPlaylist = [...this.playlist];
        
        const currentTrack = this.playlist[this.currentIndex];
        let rest = this.playlist.filter(t => t.src !== currentTrack.src);

        // Fisher-Yates
        for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
        }

        this.playlist = [currentTrack, ...rest];
        this.currentIndex = 0;
        this.renderPlaylistDOM();
    },

    restorePlaylist() {
        const currentTrack = this.playlist[this.currentIndex];
        this.playlist = [...this.originalPlaylist];
        this.currentIndex = this.playlist.findIndex(t => t.src === currentTrack.src);
        this.renderPlaylistDOM();
    },

    renderPlaylistDOM() {
        if (!this.playlistContainer) return;
        // Re-insere os elementos na nova ordem
        this.playlist.forEach(track => {
            this.playlistContainer.appendChild(track.element);
        });
    },

    setupEvents() {
        if (this.playBtn) this.playBtn.onclick = () => this.togglePlay();
        
        this.audio.volume = 0.7;

        this.audio.addEventListener('timeupdate', () => {
            const current = this.audio.currentTime || 0;
            const duration = this.audio.duration || 0;
            if (this.currentTimeEl) this.currentTimeEl.innerText = this.formatTime(current);
            if (duration > 0 && this.progress) {
                this.progress.style.width = ((current / duration) * 100) + '%';
            }
        });

        this.audio.addEventListener('loadedmetadata', () => {
            if (this.durationEl) this.durationEl.innerText = this.formatTime(this.audio.duration);
        });

        document.querySelector('.progress-bar')?.addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        });

        this.volumeSlider?.addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
        });

        // Controles
        document.getElementById('prevBtn')?.addEventListener('click', () => {
            this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadTrack(this.currentIndex);
            this.play();
        });

        document.getElementById('nextBtn')?.addEventListener('click', () => {
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
            this.loadTrack(this.currentIndex);
            this.play();
        });

        this.shuffleBtn?.addEventListener('click', () => {
            this.isShuffle = !this.isShuffle;
            this.shuffleBtn.classList.toggle('active', this.isShuffle);
            this.isShuffle ? this.shufflePlaylist() : this.restorePlaylist();
        });

        this.repeatBtn?.addEventListener('click', () => {
            this.repeatMode = (this.repeatMode + 1) % 3;
            // Estilo visual: 0 = off, 1 = repeat all (blue), 2 = repeat one (yellow/icon change)
            this.repeatBtn.classList.toggle('active', this.repeatMode > 0);
            this.repeatBtn.style.color = this.repeatMode === 2 ? 'var(--yellow)' : '';
            this.repeatBtn.title = ["Repetir: Off", "Repetir: Tudo", "Repetir: Faixa"][this.repeatMode];
        });

        this.audio.addEventListener('ended', () => {
            if (this.repeatMode === 2) {
                this.audio.currentTime = 0;
                this.play();
            } else {
                const isLast = this.currentIndex >= this.playlist.length - 1;
                if (isLast && this.repeatMode === 0) {
                    this.pause();
                } else {
                    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
                    this.loadTrack(this.currentIndex);
                    this.play();
                }
            }
        });
    },

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    },

    togglePlay() { this.isPlaying ? this.pause() : this.play(); },
    play() {
        this.audio.play().catch(() => console.log("Interação requerida"));
        this.isPlaying = true;
        if (this.playBtn) this.playBtn.innerHTML = '<i class="bx bx-pause"></i>';
    },
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        if (this.playBtn) this.playBtn.innerHTML = '<i class="bx bx-play"></i>';
    },

    setupSearch() {
        this.searchInput?.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            this.playlist.forEach(track => {
                const isVisible = track.display.toLowerCase().includes(term);
                track.element.style.display = isVisible ? 'flex' : 'none';
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => player.init());