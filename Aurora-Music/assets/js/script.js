/**
 * ============================================================
 * SCRIPT.JS - AURORA MUSIC 2026 (ATUALIZADO COM SISTEMA DE PROMO)
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
    
    // --- Configurações de Promoção ---
    songsPlayed: 0,                // Contador de músicas tocadas
    isPromoPlaying: false,         // Flag para saber se o áudio atual é anúncio
    promoSrc: 'promo/promo.mp3',   // Caminho do arquivo de anúncio

    init() {
        console.log('[NAV DEBUG] player.init() START');
        history.replaceState(null, '', window.location.pathname + window.location.search);

        this.cacheElements();
        this.setupPlaylist();
        if (this.playlist.length > 0) this.loadTrack(0);
        this.setupEvents();
        
        this._updateRepeatBtn(); 
        this._updateShuffleBtn(); 

        this.setupSearch();
        console.log('[NAV DEBUG] Calling setupNavigation()');
        this.setupNavigation();
        this.setupNavShortcuts();
        this.setupAllAnchorLinks();
        this.setupMobileBottomNav();
        this.setupBluetooth();
        console.log('[NAV DEBUG] player.init() COMPLETE');
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
        this.volumeIcon    = document.querySelector('.volume-control i');
        this.shuffleBtn    = document.getElementById('shuffleBtn');
        this.repeatBtn     = document.getElementById('repeatBtn');
        this.searchInput   = document.getElementById('searchInput');
        this.nav           = document.querySelector('.nav');
        this.menuToggle    = document.querySelector('.menu-toggle');
        this.header        = document.querySelector('.header');
        this.btBadge       = document.getElementById('bluetoothBadge');
        this.btLabel       = document.getElementById('bluetoothLabel');
        this.playlistContainer = document.getElementById('playlistContainer');
    },

    formatName(text) {
        if (!text) return '';
        return text
            .replace(/\.(mp3|wav|m4a|ogg|pm)$/i, '')
            .replace(/[_-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
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
       PLAYLIST & RERENDER
    ═══════════════════════════════ */
    setupPlaylist() {
        const items = document.querySelectorAll('.playlist-item');
        this.playlist = Array.from(items).map(item => {
            const cleanName = this.formatName(item.dataset.display || '');
            const titleEl = item.querySelector('.track-title') || item.querySelector('strong');
            if (titleEl) titleEl.textContent = cleanName;

            return {
                src:     item.dataset.src,
                display: cleanName,
                artist:  item.dataset.artist || '',
                cover:   item.dataset.cover  || 'assets/images/cover.png',
                element: item
            };
        });
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
        
        // Se carregar uma música manualmente, cancela o estado de promo
        this.isPromoPlaying = false; 
        
        this.currentIndex = index;
        const m = this.playlist[index];
        this.audio.src = m.src;
        if (this.albumCover) this.albumCover.src = m.cover;
        if (this.trackName)  this.trackName.textContent  = m.display;
        if (this.artistName) this.artistName.textContent = (m.artist === 'Artista Desconhecido') ? '' : m.artist;
        this.highlightCurrentTrack();
    },

    /* Lógica para tocar a Promoção */
    playPromo() {
        console.log('[AURORA] Tocando anúncio promocional...');
        this.isPromoPlaying = true;
        this.audio.src = this.promoSrc;
        
        // Feedback visual discreto durante a promo
        if (this.trackName) this.trackName.textContent = "Publicidade";
        if (this.artistName) this.artistName.textContent = "Aurora Music";
        
        this.play();
    },

    highlightCurrentTrack() {
        document.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('active'));
        this.playlist[this.currentIndex]?.element?.classList.add('active');
    },

    rerenderPlaylist() {
        if (!this.playlistContainer) return;
        const nonPlaylistItems = Array.from(this.playlistContainer.children).filter(
            el => !el.classList.contains('playlist-item')
        );
        this.playlistContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        this.playlist.forEach(track => {
            if (track.element) {
                track.element.style.display = 'flex'; 
                fragment.appendChild(track.element);
            }
        });
        this.playlistContainer.appendChild(fragment);
        nonPlaylistItems.forEach(el => this.playlistContainer.appendChild(el));
    },

    /* ═══════════════════════════════
       EVENTOS & CONTROLES
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

        document.querySelector('.progress-bar')?.addEventListener('click', e => {
            const r = e.currentTarget.getBoundingClientRect();
            this.audio.currentTime = ((e.clientX - r.left) / r.width) * this.audio.duration;
        });

        this.volumeSlider?.addEventListener('input', e => {
            const vol = e.target.value / 100;
            this.audio.volume = vol;
            this._updateVolumeIcon(vol);
        });

        document.getElementById('prevBtn')?.addEventListener('click', () => {
            if (this.audio.currentTime > 3) {
                this.audio.currentTime = 0;
            } else {
                // Se estiver tocando promo e voltar, ele volta para a música anterior à promo
                this.isPromoPlaying = false;
                this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
                this.loadTrack(this.currentIndex);
                this.play();
            }
        });

        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextTrack());

        this.shuffleBtn?.addEventListener('click', () => {
            this.isShuffle = !this.isShuffle;
            this._updateShuffleBtn();

            if (this.isShuffle) {
                const curTrack = this.playlist[this.currentIndex];
                const rest = this.playlist.filter((_, i) => i !== this.currentIndex);
                for (let i = rest.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [rest[i], rest[j]] = [rest[j], rest[i]];
                }
                this.playlist = [curTrack, ...rest];
                this.currentIndex = 0;
            } else {
                const src = this.playlist[this.currentIndex].src;
                this.playlist = [...this.originalPlaylist];
                this.currentIndex = this.playlist.findIndex(t => t.src === src);
            }
            this.highlightCurrentTrack();
            this.rerenderPlaylist();
        });

        this.repeatBtn?.addEventListener('click', () => {
            this.repeatMode = (this.repeatMode + 1) % 3;
            this._updateRepeatBtn();
        });

        this.audio.addEventListener('ended', () => {
            if (this.repeatMode === 2 && !this.isPromoPlaying) { 
                this.audio.currentTime = 0; 
                this.play(); 
            } else {
                this.nextTrack();
            }
        });
    },

    _updateShuffleBtn() {
        if (!this.shuffleBtn) return;
        this.shuffleBtn.style.color = this.isShuffle ? '#00ff88' : 'rgba(255,255,255,0.3)';
        this.shuffleBtn.classList.toggle('active', this.isShuffle);
    },

    _updateRepeatBtn() {
        if (!this.repeatBtn) return;
        const icon = this.repeatBtn.querySelector('i');
        const modes = [
            { cls: false, color: 'rgba(255,255,255,0.3)', iconCls: 'bx bx-repeat' },
            { cls: true,  color: 'var(--yellow)',         iconCls: 'bx bx-repeat' },
            { cls: true,  color: '#00ff88',               iconCls: 'bx bx-revision' }
        ];
        const m = modes[this.repeatMode];
        this.repeatBtn.classList.toggle('active', m.cls);
        this.repeatBtn.style.color = m.color;
        if (icon) icon.className = m.iconCls;
    },

    _updateVolumeIcon(vol) {
        const icon = document.querySelector('.volume-control i');
        if (!icon) return;
        if (vol === 0) icon.className = 'bx bx-volume-mute';
        else if (vol < 0.4) icon.className = 'bx bx-volume-low';
        else if (vol < 0.7) icon.className = 'bx bx-volume';
        else icon.className = 'bx bx-volume-full';
    },

    nextTrack() {
        // Se terminou de tocar a promo, volta para a música normal que deveria seguir
        if (this.isPromoPlaying) {
            this.isPromoPlaying = false;
            // Carrega o índice atual (que não foi incrementado durante a promo)
            this.loadTrack(this.currentIndex);
            this.play();
            return;
        }

        // Incrementa contador de músicas ouvidas
        this.songsPlayed++;

        // Se tocou 3 músicas, dispara a promo
        if (this.songsPlayed >= 3) {
            this.songsPlayed = 0; 
            // Incrementa o índice da próxima música ANTES para que quando a promo acabar, saiba qual tocar
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
            this.playPromo();
            return;
        }

        const next = this.currentIndex + 1;
        if (next < this.playlist.length) { 
            this.loadTrack(next); 
            this.play(); 
        } else if (this.repeatMode === 1) { 
            this.loadTrack(0); 
            this.play(); 
        } else { 
            this.loadTrack(0); 
            this.pause(); 
        }
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
                item.style.display = ok ? 'flex' : 'none';
            });
        });
    },

    /* ═══════════════════════════════════════════
       NAVEGAÇÃO E SCROLL
    ═══════════════════════════════════════════ */
    closeMenu() {
        if (!this.nav) return;
        this.nav.classList.remove('active');
        document.body.classList.remove('nav-open');
        const icon = this.menuToggle?.querySelector('i');
        if (icon) icon.className = 'bx bx-menu';
    },

    setupNavShortcuts() {
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.nav?.classList.contains('active')) this.closeMenu();
        });
        window.addEventListener('resize', () => { if (window.innerWidth > 768) this.closeMenu(); });
    },

    scrollToSection(href) {
        if (!href || href === '#home' || href === '#') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const target = document.querySelector(href);
        if (!target) return;
        const headerH = this.header?.offsetHeight || 72;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - headerH;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    },

    setupNavigation() {
        if (!this.menuToggle || !this.nav) return;
        this.menuToggle.addEventListener('click', e => {
            e.stopPropagation();
            if (window.innerWidth > 768) return;
            const isActive = this.nav.classList.toggle('active');
            document.body.classList.toggle('nav-open', isActive);
            const icon = this.menuToggle.querySelector('i');
            if (icon) icon.className = isActive ? 'bx bx-x' : 'bx bx-menu';
        });
        document.addEventListener('click', e => {
            if (this.nav.classList.contains('active') && !this.nav.contains(e.target) && !this.menuToggle.contains(e.target)) {
                this.closeMenu();
            }
        });
        this.nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });
    },

    setupAllAnchorLinks() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            if (link.id.includes('loginTrigger')) return;
            link.addEventListener('click', e => {
                const href = link.getAttribute('href');
                if (href !== '#' && (href === '#home' || document.querySelector(href))) {
                    e.preventDefault();
                    this.scrollToSection(href);
                }
            });
        });
    },

    setupMobileBottomNav() {
        const mobileNav = document.querySelector('.mobile-nav-scroll');
        if (!mobileNav) return;
        const sections = document.querySelectorAll('section[id], .footer[id]');
        const links    = mobileNav.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                this.scrollToSection(link.getAttribute('href'));
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => player.init());a