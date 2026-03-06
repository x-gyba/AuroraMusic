/**
 * ============================================================
 * SCRIPT.JS - PLAYER E NAVEGAÇÃO - AURORA MUSIC 2026
 * Corrigido: Repetição e Visibilidade do Ícone Bluetooth
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
        this.bluetoothBtn      = document.getElementById('bluetoothBtn');
        this.bluetoothStatus   = document.getElementById('bluetoothStatus');
    },

    /* ===================== MONITORAMENTO DE ÁUDIO / BLUETOOTH ===================== */

    setupBluetooth() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

        // Atualiza ao carregar e sempre que houver mudança de hardware
        this.updateDeviceStatus();
        navigator.mediaDevices.addEventListener('devicechange', () => this.updateDeviceStatus());

        // Força atualização no primeiro clique (necessário para permissão de áudio no browser)
        document.addEventListener('click', () => this.updateDeviceStatus(), { once: true });
    },

    async updateDeviceStatus() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            // Filtra por saídas de áudio que não sejam as padrão do sistema (geralmente Bluetooth/Externas)
            const externalDisplay = devices.find(d => 
                d.kind === 'audiooutput' && 
                d.deviceId !== 'default' && 
                d.deviceId !== 'communications'
            );

            if (externalDisplay) {
                // Se o label estiver vazio (privacidade), mostramos um nome genérico
                const name = externalDisplay.label || "Dispositivo Externo";
                this.updateBluetoothUI(true, name);
            } else {
                this.updateBluetoothUI(false, '');
            }
        } catch (err) {
            console.error("Erro ao detectar dispositivos:", err);
            this.updateBluetoothUI(false, '');
        }
    },

    updateBluetoothUI(connected, deviceName) {
        if (!this.bluetoothBtn) return;

        if (connected) {
            this.bluetoothBtn.style.display = 'inline-flex';
            if (this.bluetoothStatus) {
                this.bluetoothStatus.style.display = 'inline-flex';
                this.bluetoothStatus.textContent = deviceName;
            }
            
            // Garante que o ícone interno exista e tenha a classe correta
            let icon = this.bluetoothBtn.querySelector('i');
            if (!icon) {
                icon = document.createElement('i');
                this.bluetoothBtn.prepend(icon);
            }
            icon.className = 'bx bx-headphone'; 
            icon.style.color = '#ffff00'; // Amarelo Neon
            icon.style.marginRight = '8px';
        } else {
            this.bluetoothBtn.style.display = 'none';
            if (this.bluetoothStatus) this.bluetoothStatus.style.display = 'none';
        }
    },
    
    /* ===================== PLAYER CORE ===================== */

    setupPlaylist() {
        const items = document.querySelectorAll('.playlist-item');
        this.playlist = Array.from(items).map((item, index) => ({
            src: item.dataset.src,
            display: item.dataset.display,
            artist: item.dataset.artist || '',
            cover: item.dataset.cover || 'assets/images/cover.png',
            element: item
        }));
        this.originalPlaylist = [...this.playlist];

        this.playlist.forEach((track) => {
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
        if (this.trackName) this.trackName.innerText = m.display;
        if (this.artistName) this.artistName.innerText = m.artist === 'Artista Desconhecido' ? '' : m.artist;
        this.highlightCurrentTrack();
    },

    highlightCurrentTrack() {
        document.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('active'));
        this.playlist[this.currentIndex]?.element?.classList.add('active');
    },

    setupEvents() {
        if (this.playBtn) this.playBtn.onclick = () => this.togglePlay();
        
        this.audio.addEventListener('timeupdate', () => {
            const current = this.audio.currentTime || 0;
            const duration = this.audio.duration || 0;
            if (this.currentTimeEl) this.currentTimeEl.innerText = this.formatTime(current);
            if (duration > 0 && this.progress) this.progress.style.width = ((current / duration) * 100) + '%';
        });

        this.audio.addEventListener('loadedmetadata', () => {
            if (this.durationEl) this.durationEl.innerText = this.formatTime(this.audio.duration);
        });

        document.querySelector('.progress-bar')?.addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            this.audio.currentTime = ((e.clientX - rect.left) / rect.width) * this.audio.duration;
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
        });

        // BOTÃO REPETIR - CORREÇÃO DE LOGICA
        this.repeatBtn?.addEventListener('click', () => {
            this.repeatMode = (this.repeatMode + 1) % 3;
            this.repeatBtn.classList.toggle('active', this.repeatMode > 0);
            
            const icon = this.repeatBtn.querySelector('i');
            if (this.repeatMode === 2) {
                this.repeatBtn.style.color = '#00ff00'; // Verde para repetir uma
                if (icon) icon.className = 'bx bx-revision'; 
            } else {
                this.repeatBtn.style.color = this.repeatMode === 1 ? 'var(--yellow)' : '';
                if (icon) icon.className = 'bx bx-repeat';
            }
        });

        // EVENTO ENDED - CORREÇÃO PRIORITÁRIA
        this.audio.addEventListener('ended', () => {
            if (this.repeatMode === 2) {
                this.audio.currentTime = 0;
                this.play();
            } else {
                // Se for modo 1 (repetir playlist) ou modo 0 (sem repetir)
                let nextIndex = (this.currentIndex + 1);
                
                if (nextIndex < this.playlist.length) {
                    this.loadTrack(nextIndex);
                    this.play();
                } else if (this.repeatMode === 1) {
                    // Se for a última e repetir playlist estiver ON, volta pra primeira
                    this.loadTrack(0);
                    this.play();
                } else {
                    this.pause();
                }
            }
        });
    },

    formatTime(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    },

    togglePlay() { this.isPlaying ? this.pause() : this.play(); },
    play() {
        this.audio.play().catch(() => {});
        this.isPlaying = true;
        if (this.playBtn) this.playBtn.innerHTML = '<i class="bx bx-pause"></i>';
    },
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        if (this.playBtn) this.playBtn.innerHTML = '<i class="bx bx-play"></i>';
    },

    /* NAVEGAÇÃO E OUTROS MÉTODOS (Omitidos para brevidade, mantenha os seus originais) */
    setupNavigation() { /* ... seu código original ... */ },
    setupMobileBottomNav() { /* ... seu código original ... */ },
    setupSearch() { /* ... seu código original ... */ },
    setupLoginModal() { /* ... seu código original ... */ }
};

document.addEventListener('DOMContentLoaded', () => player.init());