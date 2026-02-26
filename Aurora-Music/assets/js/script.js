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
    repeatMode: 0,
    _menuToggleClick: false,

    init() {
        this.cacheElements();
        this.setupPlaylist();
        if (this.playlist.length > 0) this.loadTrack(0);
        this.setupEvents();
        this.setupSearch();
        this.setupNavigation();
        this.setupMobileBottomNav();
        this.setupContactForm();
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

    /* ===================== NAVEGAÇÃO SUPERIOR ===================== */

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
                if (icon) icon.className = this.nav.classList.contains('active')
                    ? 'bx bx-x' : 'bx bx-menu';
            });
        }

        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (!href || !href.startsWith('#')) return;
                e.preventDefault();
                this.closeMobileMenu();
                const id = href.replace('#', '');
                setTimeout(() => {
                    if (!id || id === 'home') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        this.scrollToElement(document.getElementById(id));
                    }
                }, 50);
            });
        });

        document.querySelectorAll('.footer a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (!href || !href.startsWith('#')) return;
                e.preventDefault();
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

    /* ===================== MENU MOBILE INFERIOR ===================== */

    setupMobileBottomNav() {
        const mobileNav = document.querySelector('.mobile-nav-scroll');
        if (!mobileNav) return;

        const mobileLinks = Array.from(mobileNav.querySelectorAll('a'));

        const getId = (link) => {
            const href = (link.getAttribute('href') || '').replace('#', '').trim();
            const ds   = (link.getAttribute('data-section') || '').trim();
            return href || ds || '';
        };

        const setActive = (id) => {
            mobileLinks.forEach(l => l.classList.remove('active'));
            const found = mobileLinks.find(l => getId(l) === id);
            if (found) found.classList.add('active');
        };

            mobileLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const id = getId(link);
                    mobileLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    if (!id || id === 'home') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else if (id === 'contact') {
                        this.scrollToBottom();
                    } else {
                        const el = document.getElementById(id);
                        if (el) this.scrollToElement(el);
                    }
                });
            });

            const buildObserver = () => {
                const headerH = this.getHeaderHeight();
                const ORDER   = ['home', 'music', 'about', 'precos', 'contact'];
                const visible  = new Set();

                const obs = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        entry.isIntersecting
                        ? visible.add(entry.target.id)
                        : visible.delete(entry.target.id);
                    });
                    for (const id of ORDER) {
                        if (visible.has(id)) { setActive(id); return; }
                    }
                    setActive('contact');
                }, {
                    rootMargin: `-${headerH}px 0px -50% 0px`,
                    threshold: 0
                });

                ORDER.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) obs.observe(el);
                });

                    const footer = document.getElementById('footer');
                    if (footer) {
                        new IntersectionObserver((entries) => {
                            if (entries[0].isIntersecting) setActive('contact');
                        }, { threshold: 0.05 }).observe(footer);
                    }
            };

            requestAnimationFrame(() => requestAnimationFrame(buildObserver));
    },

    /* ===================== PLAYER ===================== */

    setupPlaylist() {
        const items = document.querySelectorAll('.playlist-item');
        this.playlist = Array.from(items).map(item => ({
            src:     item.dataset.src,
            display: item.dataset.display,
            element: item
        }));
        this.originalPlaylist = [...this.playlist];
        items.forEach((item, index) => {
            item.onclick = () => { this.loadTrack(index); this.play(); };
        });
    },

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const m = this.playlist[index];
        this.audio.src = m.src;
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
        if (this.playlist[this.currentIndex])
            this.playlist[this.currentIndex].element.classList.add('active');
    },

    setupEvents() {
        if (this.playBtn) this.playBtn.onclick = () => this.togglePlay();
        this.audio.volume = 0.7;
    },

    togglePlay() { this.isPlaying ? this.pause() : this.play(); },

    play() {
        this.audio.play();
        this.isPlaying = true;
        if (this.playBtn) this.playBtn.innerHTML = '<i class="bx bx-pause"></i>';
    },

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        if (this.playBtn) this.playBtn.innerHTML = '<i class="bx bx-play"></i>';
    },

    setupSearch() {
        if (!this.searchInput) return;
        this.searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.playlist-item').forEach(item => {
                item.style.display = item.dataset.display.toLowerCase().includes(term)
                ? 'flex' : 'none';
            });
        });
    },

    setupContactForm() { }
};

document.addEventListener('DOMContentLoaded', () => player.init());
