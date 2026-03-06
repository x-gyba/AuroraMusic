/**
 * ============================================================
 * SCRIPT.JS - PLAYER E NAVEGAÇÃO - AURORA MUSIC 2026
 * + Saída de áudio Bluetooth via setSinkId()
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

    // Bluetooth / saída de áudio
    currentSinkId: 'default',
    currentDeviceName: '',

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
        this.trackName         = document.getElementById('trackName');
        this.artistName        = document.getElementById('artistName');
        this.playBtn           = document.getElementById('playBtn');
        this.albumArt          = document.getElementById('albumArtContainer');
        this.albumCover        = document.getElementById('albumCover');
        this.progress          = document.getElementById('progress');
        this.currentTimeEl     = document.getElementById('currentTime');
        this.durationEl        = document.getElementById('duration');
        this.volumeSlider      = document.getElementById('volumeSlider');
        this.shuffleBtn        = document.getElementById('shuffleBtn');
        this.repeatBtn         = document.getElementById('repeatBtn');
        this.searchInput       = document.getElementById('searchInput');
        this.playlistContainer = document.getElementById('playlistContainer');
        this.nav               = document.querySelector('.nav');
        this.menuToggle        = document.querySelector('.menu-toggle');
        // Bluetooth
        this.bluetoothBtn      = document.getElementById('bluetoothBtn');
        this.bluetoothStatus   = document.getElementById('bluetoothStatus');
    },

    /* ===================== BLUETOOTH / SAÍDA DE ÁUDIO ===================== */

    setupBluetooth() {
        if (!this.bluetoothBtn) return;

        // Verifica suporte ao setSinkId
        if (!('setSinkId' in HTMLMediaElement.prototype)) {
            this.bluetoothBtn.title = 'Seu navegador não suporta seleção de saída de áudio.\nUse Chrome ou Edge.';
            this.bluetoothBtn.style.opacity = '0.4';
            this.bluetoothBtn.style.cursor = 'not-allowed';
            return;
        }

        this.bluetoothBtn.addEventListener('click', () => this.selectAudioOutput());

        // Monitora mudanças de dispositivos (ex: headset desconectado)
        navigator.mediaDevices.addEventListener('devicechange', () => this.onDeviceChange());
    },

    async selectAudioOutput() {
        try {
            // Solicita permissão e lista dispositivos de saída
            const devices = await navigator.mediaDevices.enumerateDevices();
            const outputs = devices.filter(d => d.kind === 'audiooutput');

            if (outputs.length === 0) {
                this.showBluetoothMsg('Nenhum dispositivo de saída encontrado.', 'error');
                return;
            }

            // Monta um seletor dinâmico
            this.showDevicePicker(outputs);

        } catch (err) {
            if (err.name === 'NotAllowedError') {
                this.showBluetoothMsg('Permissão negada para acessar dispositivos de áudio.', 'error');
            } else {
                this.showBluetoothMsg('Erro ao listar dispositivos: ' + err.message, 'error');
            }
        }
    },

    showDevicePicker(outputs) {
        // Remove picker anterior se existir
        document.getElementById('devicePickerOverlay')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'devicePickerOverlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.6);
            z-index: 9999; display: flex; align-items: center; justify-content: center;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: linear-gradient(145deg, #070136, #0d0550);
            border: 1px solid rgba(39,94,245,0.45);
            border-radius: 16px; padding: 28px; width: 90%; max-width: 380px;
            color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.7);
        `;

        box.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                <i class="bx bx-headphone" style="font-size:1.8rem; color:#ffff00;"></i>
                <h3 style="font-size:1.1rem; color:#ffff00; margin:0;">Selecionar Saída de Áudio</h3>
                <button id="closeDevicePicker" style="margin-left:auto; background:none; border:none;
                    color:#fff; font-size:1.4rem; cursor:pointer; line-height:1;">&times;</button>
            </div>
            <ul style="list-style:none; padding:0; margin:0; max-height:260px; overflow-y:auto;">
                ${outputs.map(d => `
                    <li>
                        <button class="device-option"
                            data-sink="${d.deviceId}"
                            data-name="${d.label || 'Dispositivo ' + d.deviceId.slice(0,6)}"
                            style="width:100%; background:${d.deviceId === this.currentSinkId ? 'rgba(39,94,245,0.35)' : 'rgba(255,255,255,0.05)'};
                                border:1px solid rgba(255,255,255,0.12); border-radius:10px;
                                color:#fff; padding:12px 14px; margin-bottom:8px; cursor:pointer;
                                display:flex; align-items:center; gap:10px; font-size:0.9rem;
                                transition: background 0.2s;">
                            <i class="bx ${d.deviceId === this.currentSinkId ? 'bx-headphone' : 'bx-speaker'}"
                               style="font-size:1.3rem; color:${d.deviceId === this.currentSinkId ? '#ffff00' : '#aaa'};"></i>
                            <span>${d.label || 'Dispositivo ' + d.deviceId.slice(0,6)}</span>
                            ${d.deviceId === this.currentSinkId ? '<i class="bx bx-check" style="margin-left:auto; color:#10b981; font-size:1.2rem;"></i>' : ''}
                        </button>
                    </li>
                `).join('')}
            </ul>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // Fechar
        document.getElementById('closeDevicePicker').onclick = () => overlay.remove();
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        // Selecionar dispositivo
        box.querySelectorAll('.device-option').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (btn.dataset.sink !== this.currentSinkId)
                    btn.style.background = 'rgba(39,94,245,0.2)';
            });
            btn.addEventListener('mouseleave', () => {
                if (btn.dataset.sink !== this.currentSinkId)
                    btn.style.background = 'rgba(255,255,255,0.05)';
            });
            btn.addEventListener('click', () => {
                this.setAudioOutput(btn.dataset.sink, btn.dataset.name);
                overlay.remove();
            });
        });
    },

    async setAudioOutput(sinkId, deviceName) {
        try {
            await this.audio.setSinkId(sinkId);
            this.currentSinkId    = sinkId;
            this.currentDeviceName = deviceName;
            this.updateBluetoothUI(true, deviceName);
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                this.showBluetoothMsg('Permissão negada para usar este dispositivo.', 'error');
            } else {
                this.showBluetoothMsg('Falha ao conectar: ' + err.message, 'error');
            }
        }
    },

    updateBluetoothUI(connected, deviceName) {
        if (!this.bluetoothBtn || !this.bluetoothStatus) return;

        const icon = this.bluetoothBtn.querySelector('i');

        if (connected && deviceName && this.currentSinkId !== 'default') {
            // Ícone aceso amarelo
            if (icon) icon.style.color = '#ffff00';
            this.bluetoothBtn.title = 'Conectado: ' + deviceName;
            this.bluetoothStatus.textContent = deviceName;
            this.bluetoothStatus.style.display = 'inline-flex';
        } else {
            // Ícone padrão
            if (icon) icon.style.color = '';
            this.bluetoothBtn.title = 'Selecionar dispositivo de saída de áudio';
            this.bluetoothStatus.textContent = '';
            this.bluetoothStatus.style.display = 'none';
        }
    },

    async onDeviceChange() {
        if (this.currentSinkId === 'default') return;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const still = devices.find(d => d.deviceId === this.currentSinkId);

        if (!still) {
            // Dispositivo desconectado — volta para padrão
            await this.audio.setSinkId('default').catch(() => {});
            this.currentSinkId     = 'default';
            this.currentDeviceName = '';
            this.updateBluetoothUI(false, '');
            this.showBluetoothMsg('Dispositivo desconectado. Voltando para saída padrão.', 'error');
        }
    },

    showBluetoothMsg(text, type) {
        if (!this.bluetoothStatus) return;
        this.bluetoothStatus.textContent = text;
        this.bluetoothStatus.style.display = 'inline-flex';
        this.bluetoothStatus.style.color   = type === 'error' ? '#ff7070' : '#34d399';
        clearTimeout(this._btMsgTimer);
        this._btMsgTimer = setTimeout(() => {
            if (this.currentSinkId === 'default') {
                this.bluetoothStatus.textContent = '';
                this.bluetoothStatus.style.display = 'none';
            }
        }, 4000);
    },

    /* ===================== NAVEGAÇÃO ===================== */

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

    setupNavigation() {
        const btnOuvir = document.querySelector('.btn-primary');
        if (btnOuvir) {
            btnOuvir.addEventListener('click', (e) => {
                e.preventDefault();
                const musicSection = document.getElementById('music');
                if (musicSection) this.scrollToElement(musicSection);
            });
        }

        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => {
                this._menuToggleClick = true;
                this.nav?.classList.toggle('active');
                const icon = this.menuToggle.querySelector('i');
                if (icon) icon.className = this.nav?.classList.contains('active') ? 'bx bx-x' : 'bx bx-menu';
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
                    const el = document.getElementById(id);
                    this.scrollToElement(el || document.body);
                }
            });
        });

        document.addEventListener('click', () => {
            if (this._menuToggleClick) { this._menuToggleClick = false; return; }
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
        Array.from(mobileNav.querySelectorAll('a')).forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = (link.getAttribute('href') || '').replace('#', '');
                if (id === 'contact') this.scrollToBottom();
                else this.scrollToElement(document.getElementById(id) || document.body);
            });
        });
    },

    /* ===================== PLAYER CORE ===================== */

    setupPlaylist() {
        const items = document.querySelectorAll('.playlist-item');
        this.playlist = Array.from(items).map((item, index) => ({
            src:           item.dataset.src,
            display:       item.dataset.display,
            artist:        item.dataset.artist || '',
            cover:         item.dataset.cover  || 'assets/images/cover.png',
            element:       item,
            originalIndex: index
        }));
        this.originalPlaylist = [...this.playlist];

        this.playlist.forEach(track => {
            track.element?.addEventListener('click', () => {
                const realIndex = this.playlist.findIndex(t => t.src === track.src);
                this.loadTrack(realIndex);
                this.play();
            });
        });
    },

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const m = this.playlist[index];
        this.audio.src = m.src;
        if (this.albumCover) this.albumCover.src = m.cover || 'assets/images/cover.png';
        if (this.trackName) this.trackName.innerText = m.display || 'Sem título';
        if (this.artistName) {
            this.artistName.innerText = m.artist || '';
            this.artistName.style.display = m.artist ? '' : 'none';
        }
        this.highlightCurrentTrack();
    },

    highlightCurrentTrack() {
        document.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('active'));
        if (this.playlist[this.currentIndex]?.element) {
            this.playlist[this.currentIndex].element.classList.add('active');
        }
    },

    shufflePlaylist() {
        if (!this.originalPlaylist.length) this.originalPlaylist = [...this.playlist];
        const currentTrack = this.playlist[this.currentIndex];
        let rest = this.playlist.filter(t => t.src !== currentTrack.src);
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
        this.playlist.forEach(track => this.playlistContainer.appendChild(track.element));
    },

    setupEvents() {
        if (this.playBtn) this.playBtn.onclick = () => this.togglePlay();

        this.audio.volume = 0.7;

        this.audio.addEventListener('timeupdate', () => {
            const current  = this.audio.currentTime || 0;
            const duration = this.audio.duration    || 0;
            if (this.currentTimeEl) this.currentTimeEl.innerText = this.formatTime(current);
            if (duration > 0 && this.progress) this.progress.style.width = ((current / duration) * 100) + '%';
        });

        this.audio.addEventListener('loadedmetadata', () => {
            if (this.durationEl) this.durationEl.innerText = this.formatTime(this.audio.duration);
        });

        document.querySelector('.progress-bar')?.addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        });

        this.volumeSlider?.addEventListener('input', (e) => this.audio.volume = e.target.value / 100);

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
            this.repeatBtn.classList.toggle('active', this.repeatMode > 0);
            this.repeatBtn.style.color = this.repeatMode === 2 ? 'var(--yellow)' : '';
            this.repeatBtn.title = ["Repetir: Off", "Repetir: Tudo", "Repetir: Faixa"][this.repeatMode];
        });

        this.audio.addEventListener('ended', () => {
            if (this.repeatMode === 2) {
                this.audio.currentTime = 0;
                this.play();
            } else {
                this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
                this.loadTrack(this.currentIndex);
                this.play();
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
                const matchTitle  = track.display.toLowerCase().includes(term);
                const matchArtist = track.artist.toLowerCase().includes(term);
                track.element.style.display = (matchTitle || matchArtist) ? 'flex' : 'none';
            });
        });
    },

    /* ===================== LOGIN MODAL ===================== */
    setupLoginModal() {
        const loginModal     = document.getElementById('loginModal');
        const loginTrigger   = document.getElementById('loginTrigger');
        const footerTrigger  = document.getElementById('footerLoginTrigger');
        const loginCloseBtns = loginModal?.querySelectorAll('.close-modal');

        const openModal  = () => loginModal?.classList.add('active');
        const closeModal = () => loginModal?.classList.remove('active');

        loginTrigger?.addEventListener('click',  (e) => { e.preventDefault(); openModal(); });
        footerTrigger?.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
        loginCloseBtns?.forEach(btn => btn.addEventListener('click', closeModal));
        window.addEventListener('click', (e) => { if (e.target === loginModal) closeModal(); });
    }
};

document.addEventListener('DOMContentLoaded', () => player.init());