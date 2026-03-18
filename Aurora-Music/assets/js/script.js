/**
 * ============================================================
 * SCRIPT.JS - AURORA MUSIC 2026
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

    init() {
        /* Remove hash residual da URL sem recarregar nem rolar a página.
           O browser não fará scroll automático para nenhuma âncora. */
        history.replaceState(null, '', window.location.pathname + window.location.search);

        this.cacheElements();
        this.setupPlaylist();
        if (this.playlist.length > 0) this.loadTrack(0);
        this.setupEvents();
        this.setupSearch();
        this.setupAllAnchorLinks(); /* intercepta TODOS os links âncora da página */
        this.setupNavigation();
        this.setupMobileBottomNav();
        this.setupBluetooth();
    },

    cacheElements() {
        this.trackName     = document.getElementById('trackName');
        this.artistName    = document.getElementById('artistName');
        this.playBtn       = document.getElementById('playBtn');
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
        this.btBadge       = document.getElementById('bluetoothBadge');
        this.btLabel       = document.getElementById('bluetoothLabel');
    },

    /* ═══════════════════════════════════════════
       BLUETOOTH BADGE
       ═══════════════════════════════════════════ */
    setupBluetooth() {
        const isSecure = window.location.protocol === 'https:' ||
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

        if (!isSecure || !navigator.mediaDevices?.enumerateDevices) {
            this._hideBadge();
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => { stream.getTracks().forEach(t => t.stop()); this._checkDevices(); })
            .catch(() => { this._checkDevices(); });

        navigator.mediaDevices.addEventListener('devicechange', () => this._checkDevices());
    },

    async _checkDevices() {
        try {
            const devs    = await navigator.mediaDevices.enumerateDevices();
            const outputs = devs.filter(d => d.kind === 'audiooutput');
            const ext     = outputs.find(d =>
                d.deviceId !== 'default' &&
                d.deviceId !== 'communications' &&
                d.deviceId !== ''
            );
            if (ext) {
                const name = ext.label.replace(/\s*\(.*?\)\s*$/, '').trim();
                if (name) this._showBadge(name); else this._hideBadge();
            } else {
                this._hideBadge();
            }
        } catch { this._hideBadge(); }
    },

    _showBadge(name) {
        if (!this.btBadge) return;
        if (this.btLabel) this.btLabel.textContent = name;
        this.btBadge.style.display = 'flex';
    },

    _hideBadge() {
        if (!this.btBadge) return;
        this.btBadge.style.display = 'none';
    },

    /* ═══════════════════════════════
       PLAYLIST
       ═══════════════════════════════ */
    setupPlaylist() {
        const items = document.querySelectorAll('.playlist-item');
        this.playlist = Array.from(items).map(item => ({
            src:     item.dataset.src,
            display: item.dataset.display,
            artist:  item.dataset.artist || '',
            cover:   item.dataset.cover  || 'assets/images/cover.png',
            element: item
        }));
        this.originalPlaylist = [...this.playlist];
        this.playlist.forEach(track => {
            track.element?.addEventListener('click', () => {
                this.loadTrack(this.playlist.indexOf(track));
                this.play();
            });
        });
    },

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const m = this.playlist[index];
        this.audio.src = m.src;
        if (this.albumCover) this.albumCover.src = m.cover;
        if (this.trackName)  this.trackName.textContent  = m.display;
        if (this.artistName) this.artistName.textContent = (m.artist === 'Artista Desconhecido') ? '' : m.artist;
        this.highlightCurrentTrack();
    },

    highlightCurrentTrack() {
        document.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('active'));
        this.playlist[this.currentIndex]?.element?.classList.add('active');
    },

    /* ═══════════════════════════════
       EVENTOS
       ═══════════════════════════════ */
    setupEvents() {
        if (this.playBtn) this.playBtn.onclick = () => this.togglePlay();

        this.audio.addEventListener('timeupdate', () => {
            const cur = this.audio.currentTime || 0;
            const dur = this.audio.duration    || 0;
            if (this.currentTimeEl) this.currentTimeEl.textContent = this.formatTime(cur);
            if (dur > 0 && this.progress) this.progress.style.width = (cur / dur * 100) + '%';
        });

        this.audio.addEventListener('loadedmetadata', () => {
            if (this.durationEl) this.durationEl.textContent = this.formatTime(this.audio.duration);
        });

        this.audio.addEventListener('play', () => {
            const isSecure = window.location.protocol === 'https:' ||
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';
            if (isSecure) this._checkDevices();
        });

        document.querySelector('.progress-bar')?.addEventListener('click', e => {
            const r = e.currentTarget.getBoundingClientRect();
            this.audio.currentTime = ((e.clientX - r.left) / r.width) * this.audio.duration;
        });

        this.volumeSlider?.addEventListener('input', e => {
            this.audio.volume = e.target.value / 100;
        });

        document.getElementById('prevBtn')?.addEventListener('click', () => {
            if (this.audio.currentTime > 3) {
                this.audio.currentTime = 0;
            } else {
                this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
                this.loadTrack(this.currentIndex);
                this.play();
            }
        });

        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextTrack());

        this.shuffleBtn?.addEventListener('click', () => {
            this.isShuffle = !this.isShuffle;
            this.shuffleBtn.classList.toggle('active', this.isShuffle);
            if (this.isShuffle) {
                const cur  = this.playlist[this.currentIndex];
                const rest = this.playlist.filter((_, i) => i !== this.currentIndex);
                for (let i = rest.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [rest[i], rest[j]] = [rest[j], rest[i]];
                }
                this.playlist = [cur, ...rest];
                this.currentIndex = 0;
            } else {
                const src = this.playlist[this.currentIndex].src;
                this.playlist = [...this.originalPlaylist];
                this.currentIndex = this.playlist.findIndex(t => t.src === src);
            }
            this.highlightCurrentTrack();
        });

        this.repeatBtn?.addEventListener('click', () => {
            this.repeatMode = (this.repeatMode + 1) % 3;
            const icon = this.repeatBtn.querySelector('i');
            const modes = [
                { cls: false, color: '',              iconCls: 'bx bx-repeat'   },
                { cls: true,  color: 'var(--yellow)', iconCls: 'bx bx-repeat'   },
                { cls: true,  color: '#00ff88',       iconCls: 'bx bx-revision' }
            ];
            const m = modes[this.repeatMode];
            this.repeatBtn.classList.toggle('active', m.cls);
            this.repeatBtn.style.color = m.color;
            if (icon) icon.className = m.iconCls;
        });

        this.audio.addEventListener('ended', () => {
            if (this.repeatMode === 2) { this.audio.currentTime = 0; this.play(); }
            else this.nextTrack();
        });
    },

    nextTrack() {
        const next = this.currentIndex + 1;
        if (next < this.playlist.length) { this.loadTrack(next); this.play(); }
        else if (this.repeatMode === 1)  { this.loadTrack(0);    this.play(); }
        else                             { this.loadTrack(0);    this.pause(); }
    },

    formatTime(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    },

    togglePlay() { this.isPlaying ? this.pause() : this.play(); },

    play() {
        this.audio.play().catch(() => {});
        this.isPlaying = true;
        if (this.playBtn) this.playBtn.innerHTML = '<i class="bx bx-pause"></i>';
        if (this.albumCover) this.albumCover.style.animationPlayState = 'running';
    },

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        if (this.playBtn) this.playBtn.innerHTML = '<i class="bx bx-play"></i>';
        if (this.albumCover) this.albumCover.style.animationPlayState = 'paused';
    },

    setupSearch() {
        if (!this.searchInput) return;
        this.searchInput.addEventListener('input', () => {
            const q = this.searchInput.value.toLowerCase();
            document.querySelectorAll('.playlist-item').forEach(item => {
                const ok = (item.dataset.display || '').toLowerCase().includes(q) ||
                           (item.dataset.artist  || '').toLowerCase().includes(q);
                item.style.display = ok ? '' : 'none';
            });
        });
    },

    /* ═══════════════════════════════════════════════════════
       SCROLL UNIFICADO — usado pela nav superior e bottom nav
       Resolve seções no final da página (ex: #contact) que
       não chegam ao topo porque não há conteúdo suficiente
       abaixo. Calcula o offset real e limita ao maxScroll.
       ═══════════════════════════════════════════════════════ */
    scrollToSection(href) {
        if (!href || href === '#home' || href === '#') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const target = document.querySelector(href);
        if (!target) return;

        const headerH   = document.querySelector('.header')?.offsetHeight || 72;
        const rect      = target.getBoundingClientRect();
        const targetTop = Math.round(rect.top + window.scrollY - headerH);
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

        window.scrollTo({ top: Math.max(0, Math.min(targetTop, maxScroll)), behavior: 'smooth' });
    },

    /* ═══════════════════════════════════════════════════════════
       TODOS OS LINKS ÂNCORA DA PÁGINA
       Intercepta qualquer <a href="#secao"> fora da nav e da
       bottom nav: footer, btn "Ouvir Agora", social links, etc.
       Exclui links que não apontam para seções (href="#" puro,
       href="" ou links com id de modal/login que são tratados
       por outro script).
       ═══════════════════════════════════════════════════════════ */
    setupAllAnchorLinks() {
        /* IDs de links que NÃO devem ser interceptados pelo scroll */
        const skipIds = new Set([
            'loginTrigger', 'loginMobileTrigger', 'footerLoginTrigger'
        ]);

        document.querySelectorAll('a[href^="#"]').forEach(link => {
            /* Pula links já gerenciados por outros setups ou por modal */
            if (skipIds.has(link.id)) return;

            const href = link.getAttribute('href');

            /* Pula href="#" puro (sem seção alvo) */
            if (href === '#') return;

            link.addEventListener('click', e => {
                /* Verifica se o alvo existe na página como seção */
                if (href === '#home' || document.querySelector(href)) {
                    e.preventDefault();
                    this.scrollToSection(href);
                }
                /* Se não existir, deixa o browser tratar normalmente */
            });
        });
    },

    setupNavigation() {
        if (!this.menuToggle || !this.nav) return;

        /* ── Abre/fecha menu hambúrguer ─────────────── */
        this.menuToggle.addEventListener('click', e => {
            e.stopPropagation();
            this.nav.classList.toggle('active');
            const icon = this.menuToggle.querySelector('i');
            if (icon) icon.className = this.nav.classList.contains('active') ? 'bx bx-x' : 'bx bx-menu';
        });

        /* ── Fecha ao clicar fora ───────────────────── */
        document.addEventListener('click', e => {
            if (this.nav.classList.contains('active') &&
                !this.nav.contains(e.target) &&
                !this.menuToggle.contains(e.target)) {
                this.nav.classList.remove('active');
                const icon = this.menuToggle.querySelector('i');
                if (icon) icon.className = 'bx bx-menu';
            }
        });

        /* ── Fecha ao clicar em qualquer link da nav ──
              (o scroll é feito pelo setupAllAnchorLinks) */
        this.nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                this.nav.classList.remove('active');
                const icon = this.menuToggle.querySelector('i');
                if (icon) icon.className = 'bx bx-menu';
            });
        });
    },

    setupMobileBottomNav() {
        const mobileNav = document.querySelector('.mobile-nav-scroll');
        if (!mobileNav) return;

        const sections = document.querySelectorAll('section[id], .footer[id]');
        const links    = mobileNav.querySelectorAll('a[href^="#"]');

        /* ── Estado inicial ─────────────────────────── */
        const initialHash = window.location.hash;
        links.forEach(l => l.classList.remove('active'));
        if (!initialHash || initialHash === '#' || initialHash === '#home') {
            const homeLink = mobileNav.querySelector('a[href="#home"]');
            if (homeLink) homeLink.classList.add('active');
        } else {
            const targetLink = mobileNav.querySelector(`a[href="${initialHash}"]`);
            if (targetLink) targetLink.classList.add('active');
        }

        /* ── Clique: usa scroll unificado (resolve #contact travado) */
        links.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                this.scrollToSection(link.getAttribute('href'));
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        /* ── IntersectionObserver: destaca link conforme scroll ── */
        let ticking = false;
        const updateActiveFromScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const hh   = document.querySelector('.header')?.offsetHeight || 72;
                const bnh  = mobileNav.offsetHeight || 64;
                const viewH = window.innerHeight - hh - bnh;

                let bestId   = null;
                let bestArea = 0;

                sections.forEach(section => {
                    const rect   = section.getBoundingClientRect();
                    const top    = Math.max(rect.top - hh, 0);
                    const bottom = Math.min(rect.bottom - hh, viewH);
                    const area   = Math.max(0, bottom - top);
                    if (area > bestArea) {
                        bestArea = area;
                        bestId   = section.id;
                    }
                });

                if (bestId) {
                    links.forEach(l => l.classList.remove('active'));
                    const active = mobileNav.querySelector(`a[href="#${bestId}"]`);
                    if (active) active.classList.add('active');
                }
                ticking = false;
            });
        };

        window.addEventListener('scroll', updateActiveFromScroll, { passive: true });
        updateActiveFromScroll();
    }
};

document.addEventListener('DOMContentLoaded', () => player.init());