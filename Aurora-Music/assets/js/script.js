/**
 * ============================================================
 * SCRIPT.JS - AURORA MUSIC 2026 (VERSÃO FINAL COM PROMO DINÂMICA)
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
    
    songsPlayed: 0,                
    isPromoPlaying: false,         
    promoPlaylist: [],

    // Função para excluir promo via Dashboard
    deletePromo(file) {
        if (!confirm('Excluir ' + file + '?')) return;

        const fd = new FormData();
        fd.append('filename', file);

        fetch('delete-promo.php', {
            method: 'POST',
            body: fd
        })
        .then(r => r.json())
        .then(d => {
            if (d.status === 'success') {
                console.log('[AURORA] Promo deletada:', file);
                location.reload();
            } else {
                console.warn('[AURORA] Falha ao deletar:', file);
            }
        })
        .catch(err => console.error('[AURORA] Erro ao deletar promo:', err));
    },

    async init() {
        console.log('[AURORA] Iniciando Player...');

        // ── Trava o botão Voltar na página atual ──────────────────────────
        history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', () => {
            history.pushState(null, '', window.location.href);
        });
        // ─────────────────────────────────────────────────────────────────

        // Carrega a lista de arquivos da pasta promo/ via PHP
        await this.loadPromos();

        this.cacheElements();
        this.setupPlaylist();
        
        if (this.playlist.length > 0) {
            this.loadTrack(0);
        } else {
            console.warn('[AURORA] Nenhuma música encontrada na pasta music/.');
        }

        this.setupEvents();
        this._updateRepeatBtn(); 
        this._updateShuffleBtn(); 
        this.setupSearch();
        this.setupNavigation();
        this.setupNavShortcuts();
        this.setupAllAnchorLinks();
        this.setupMobileBottomNav();
        this.setupBluetooth();
    },

    async loadPromos() {
        try {
            const response = await fetch('controllers/get_promos.php');
            this.promoPlaylist = await response.json();
            console.log('[AURORA] Lista de Promos carregada:', this.promoPlaylist);
        } catch (e) {
            console.error('[AURORA] Falha ao varrer pasta de promoções:', e);
            this.promoPlaylist = [];
        }
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
        
        this.isPromoPlaying = false; 
        this.currentIndex = index;
        const m = this.playlist[index];
        this.audio.src = m.src;
        if (this.albumCover) this.albumCover.src = m.cover;
        if (this.trackName)  this.trackName.textContent  = m.display;
        if (this.artistName) this.artistName.textContent = (m.artist === 'Artista Desconhecido') ? '' : m.artist;
        this.highlightCurrentTrack();
    },

    async playPromo() {
        if (this.promoPlaylist.length === 0) {
            console.warn('[AURORA] Nenhuma promo disponível na pasta.');
            this.isPromoPlaying = false;
            this.nextTrack();
            return;
        }

        console.log('[AURORA] Sorteando anúncio aleatório...');
        this.isPromoPlaying = true;
        
        const randomIndex = Math.floor(Math.random() * this.promoPlaylist.length);
        this.audio.src = this.promoPlaylist[randomIndex];
        
        if (this.trackName) this.trackName.textContent = "Publicidade";
        if (this.artistName) this.artistName.textContent = "Aurora Music";
        if (this.albumCover) this.albumCover.src = 'assets/images/promo-cover.png';
        
        this.play();
    },

    nextTrack() {
        if (this.isPromoPlaying) {
            this.isPromoPlaying = false;
            this.loadTrack(this.currentIndex);
            this.play();
            return;
        }

        if (this.playlist.length === 0) return;

        this.songsPlayed++;

        if (this.songsPlayed >= 3) {
            this.songsPlayed = 0; 
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
        if (!this.volumeIcon) return;
        if (vol === 0) this.volumeIcon.className = 'bx bx-volume-mute';
        else if (vol < 0.4) this.volumeIcon.className = 'bx bx-volume-low';
        else if (vol < 0.7) this.volumeIcon.className = 'bx bx-volume';
        else this.volumeIcon.className = 'bx bx-volume-full';
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

    setupBluetooth() {
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        if (!isSecure || !navigator.mediaDevices?.enumerateDevices) return;
        navigator.mediaDevices.addEventListener('devicechange', () => this._checkDevices());
        this._checkDevices();
    },

    async _checkDevices() {
        try {
            const devs = await navigator.mediaDevices.enumerateDevices();
            const ext = devs.find(d => d.kind === 'audiooutput' && d.deviceId !== 'default' && d.label !== '');
            if (ext) this._showBadge(ext.label.split('(')[0]); else this._hideBadge();
        } catch { this._hideBadge(); }
    },

    _showBadge(name) {
        if (this.btBadge) {
            this.btBadge.style.display = 'flex';
            if (this.btLabel) this.btLabel.textContent = name;
        }
    },

    _hideBadge() {
        if (this.btBadge) this.btBadge.style.display = 'none';
    },

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
        const target = (href === '#home' || href === '#') ? document.body : document.querySelector(href);
        if (!target) return;
        const headerH = this.header?.offsetHeight || 72;
        const targetTop = target === document.body ? 0 : target.getBoundingClientRect().top + window.scrollY - headerH;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
    },

    setupNavigation() {
        if (!this.menuToggle || !this.nav) return;
        this.menuToggle.addEventListener('click', e => {
            e.stopPropagation();
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
    },

    setupAllAnchorLinks() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', e => {
                const href = link.getAttribute('href');
                if (href !== '#' && (href === '#home' || document.querySelector(href))) {
                    e.preventDefault();
                    this.scrollToSection(href);
                    this.closeMenu();
                }
            });
        });
    },

    setupMobileBottomNav() {
        const mobileNav = document.querySelector('.mobile-nav-scroll');
        if (!mobileNav) return;
        const links = mobileNav.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', e => {
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => player.init());