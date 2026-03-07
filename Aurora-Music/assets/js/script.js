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
        this.cacheElements();
        this.setupPlaylist();
        if (this.playlist.length > 0) this.loadTrack(0);
        this.setupEvents();
        this.setupSearch();
        this.setupNavigation();
        this.setupMobileBottomNav();
        this.setupLoginModal();
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
       Requer HTTPS — funciona em produção.
       ═══════════════════════════════════════════ */
    setupBluetooth() {
        if (!navigator.mediaDevices?.enumerateDevices) return;

        this._checkDevices();

        navigator.mediaDevices.addEventListener('devicechange', () => {
            this._checkDevices();
        });

        document.addEventListener('click', () => this._checkDevices(), { once: true });
    },

    async _checkDevices() {
        try {
            const devs    = await navigator.mediaDevices.enumerateDevices();
            const outputs = devs.filter(d => d.kind === 'audiooutput');

            const ext = outputs.find(d =>
                d.deviceId !== 'default' &&
                d.deviceId !== 'communications' &&
                d.deviceId !== ''
            );

            if (ext) {
                let name = ext.label || '';
                name = name.replace(/\s*\(.*?\)\s*$/, '').trim() || 'Fone Conectado';
                this._showBadge(name);
            } else if (outputs.length > 1) {
                this._showBadge('Fone Conectado');
            } else {
                this._hideBadge();
            }
        } catch {
            this._hideBadge();
        }
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

        this.audio.addEventListener('play', () => this._checkDevices());

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

    setupNavigation() {
        if (!this.menuToggle || !this.nav) return;
        this.menuToggle.addEventListener('click', e => {
            e.stopPropagation();
            this.nav.classList.toggle('active');
            const icon = this.menuToggle.querySelector('i');
            if (icon) icon.className = this.nav.classList.contains('active') ? 'bx bx-x' : 'bx bx-menu';
        });
        document.addEventListener('click', e => {
            if (this.nav.classList.contains('active') &&
                !this.nav.contains(e.target) &&
                !this.menuToggle.contains(e.target)) {
                this.nav.classList.remove('active');
                const icon = this.menuToggle.querySelector('i');
                if (icon) icon.className = 'bx bx-menu';
            }
        });
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
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    links.forEach(l => l.classList.remove('active'));
                    const a = mobileNav.querySelector(`a[href="#${e.target.id}"]`);
                    if (a) a.classList.add('active');
                }
            });
        }, { threshold: 0.4 });
        sections.forEach(s => obs.observe(s));
    },

    setupLoginModal() {
        const modal    = document.getElementById('loginModal');
        const triggers = [
            document.getElementById('loginTrigger'),
            document.getElementById('loginMobileTrigger'),
            document.getElementById('footerLoginTrigger')
        ];
        const closeBtn = modal?.querySelector('.close-modal');
        const form     = document.getElementById('loginForm');
        const msg      = document.getElementById('loginMessage');
        if (!modal) return;
        const open  = e => { e?.preventDefault(); modal.classList.add('active'); };
        const close = ()  => modal.classList.remove('active');
        triggers.forEach(t => t?.addEventListener('click', open));
        closeBtn?.addEventListener('click', close);
        modal.addEventListener('click', e => { if (e.target === modal) close(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
        form?.addEventListener('submit', async e => {
            e.preventDefault();
            if (msg) { msg.textContent = 'Verificando...'; msg.className = 'login-message info'; }
            try {
                const res  = await fetch(form.action, { method: 'POST', body: new FormData(form) });
                const text = await res.text();
                if (res.redirected || text.includes('dashboard')) {
                    window.location.href = res.url || 'views/dashboard.php';
                } else if (res.status === 401 || text.includes('erro') || text.includes('inválid')) {
                    if (msg) { msg.textContent = 'Usuário ou senha incorretos.'; msg.className = 'login-message error'; }
                } else {
                    window.location.reload();
                }
            } catch {
                if (msg) { msg.textContent = 'Erro de conexão.'; msg.className = 'login-message error'; }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => player.init());