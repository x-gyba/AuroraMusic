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
    repeatMode: 0, // 0: off, 1: repeat all, 2: repeat one
    
    init() {
        this.cacheElements();
        this.setupPlaylist();
        
        if (this.playlist.length > 0) {
            this.loadTrack(0);
        } else {
            if(this.trackName) this.trackName.innerText = "Nenhuma música disponível";
            if(this.artistName) this.artistName.innerText = "";
        }
        
        this.setupEvents();
        this.setupSearch();
        this.setupNavigation(); 
    },

    cacheElements() {
        this.trackName = document.getElementById('trackName');
        this.artistName = document.getElementById('artistName');
        this.playBtn = document.getElementById('playBtn');
        this.albumArt = document.getElementById('albumArtContainer');
        this.albumCover = document.getElementById('albumCover');
        this.progress = document.getElementById('progress');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.searchInput = document.getElementById('searchInput');
        this.nav = document.querySelector('.nav');
        this.menuToggle = document.querySelector('.menu-toggle');
    },
    
    setupPlaylist() {
        const items = document.querySelectorAll('.playlist-item');
        this.playlist = Array.from(items).map(item => ({
            src: item.dataset.src,
            display: item.dataset.display,
            element: item
        }));
        this.originalPlaylist = [...this.playlist];
        
        items.forEach((item, index) => {
            item.onclick = (e) => {
                e.stopPropagation();
                this.loadTrack(index);
                this.play();
                this.closeMobileMenu();
            };
        });
    },

    /**
     * Lógica de Navegação Otimizada para Mobile
     * Scroll suave e fechamento automático do menu
     */
    setupNavigation() {
        // 1. Botão "Ouvir Agora" - Scroll Forçado
        const btnOuvir = document.querySelector('.btn-primary');
        if (btnOuvir) {
            btnOuvir.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();

                const target = document.querySelector('#music');
                if (target) {
                    const headerOffset = document.querySelector('.header')?.offsetHeight || 106;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    console.log('[Nav] Scroll para Player executado.');
                }
            }, true);
        }

        // 2. Toggle Menu Mobile
        if (this.menuToggle) {
            this.menuToggle.onclick = (e) => {
                e.stopPropagation();
                this.nav.classList.toggle('active');
                document.body.classList.toggle('menu-open');
                
                const icon = this.menuToggle.querySelector('i');
                if (icon) {
                    icon.className = this.nav.classList.contains('active') ? 'bx bx-x' : 'bx bx-menu';
                }
            };
        }

        // 3. Links da Nav - Fechamento de menu e scroll suave
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Se for link interno (começa com #) e não for o login
                if (href && href.startsWith('#') && link.id !== 'loginTrigger') {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Fecha menu mobile primeiro
                    this.closeMobileMenu();
                    
                    // Aguarda animação do menu fechar
                    setTimeout(() => {
                        const target = document.querySelector(href);
                        if (target) {
                            const headerOffset = document.querySelector('.header')?.offsetHeight || 106;
                            const elementPosition = target.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                            window.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                            });
                        }
                    }, 300);
                } else if (link.id === 'loginTrigger') {
                    this.closeMobileMenu();
                }
            });
        });

        // 4. Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (this.nav && this.nav.classList.contains('active')) {
                if (!this.nav.contains(e.target) && !this.menuToggle.contains(e.target)) {
                    this.closeMobileMenu();
                }
            }
        });

        // 5. Fechar menu ao rolar a página
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (Math.abs(scrollTop - lastScrollTop) > 50) {
                this.closeMobileMenu();
                lastScrollTop = scrollTop;
            }
        }, { passive: true });
    },

    closeMobileMenu() {
        if (this.nav && this.nav.classList.contains('active')) {
            this.nav.classList.remove('active');
            document.body.classList.remove('menu-open');
            const icon = this.menuToggle.querySelector('i');
            if (icon) icon.className = 'bx bx-menu';
        }
    },
    
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentIndex = index;
        const musica = this.playlist[index];
        this.audio.src = musica.src;
        
        if (musica.display.includes(' - ')) {
            const partes = musica.display.split(' - ');
            if(this.artistName) this.artistName.innerText = partes[0].trim();
            if(this.trackName) this.trackName.innerText = partes[1].trim();
        } else {
            if(this.trackName) this.trackName.innerText = musica.display;
            if(this.artistName) this.artistName.innerText = "Artista Desconhecido";
        }
        
        const capaUrl = musica.src.replace('.mp3', '.jpg');
        if(this.albumCover) {
            this.albumCover.src = capaUrl;
            this.albumCover.onerror = () => { this.albumCover.src = 'assets/images/cover.png'; };
        }
        
        this.highlightCurrentTrack();
    },
    
    highlightCurrentTrack() {
        document.querySelectorAll('.playlist-item').forEach(item => item.classList.remove('active'));
        if (this.playlist[this.currentIndex]) {
            this.playlist[this.currentIndex].element.classList.add('active');
        }
    },
    
    setupEvents() {
        if (this.playBtn) this.playBtn.onclick = () => this.togglePlay();
        
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        if (nextBtn) nextBtn.onclick = () => this.next();
        if (prevBtn) prevBtn.onclick = () => this.prev();
        
        if (this.shuffleBtn) this.shuffleBtn.onclick = () => this.toggleShuffle();
        if (this.repeatBtn) this.repeatBtn.onclick = () => this.toggleRepeat();
        
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.onclick = (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.currentTime = percent * this.audio.duration;
            };
        }
        
        this.audio.ontimeupdate = () => {
            if (!this.audio.duration) return;
            const pct = (this.audio.currentTime / this.audio.duration) * 100;
            if (this.progress) this.progress.style.width = pct + '%';
            if (this.currentTimeEl) this.currentTimeEl.innerText = this.formatTime(this.audio.currentTime);
        };
        
        this.audio.onloadedmetadata = () => {
            if (this.durationEl) this.durationEl.innerText = this.formatTime(this.audio.duration);
        };
        
        this.audio.onended = () => {
            this.repeatMode === 2 ? (this.audio.currentTime = 0, this.play()) : this.next();
        };
        
        if (this.volumeSlider) {
            this.volumeSlider.oninput = (e) => { this.audio.volume = e.target.value / 100; };
            this.audio.volume = 0.7;
        }
    },
    
    setupSearch() {
        if (!this.searchInput) return;
        this.searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const items = document.querySelectorAll('.playlist-item');
            items.forEach(item => {
                const display = item.dataset.display.toLowerCase();
                item.style.display = display.includes(searchTerm) ? 'flex' : 'none';
            });
        });
    },
    
    togglePlay() {
        if (this.playlist.length === 0) return;
        this.isPlaying ? this.pause() : this.play();
    },
    
    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            if (this.playBtn) this.playBtn.innerHTML = '<i class="bx bx-pause"></i>';
            if (this.albumArt) this.albumArt.classList.add('playing');
        }).catch(e => console.warn("Interação do usuário necessária para áudio."));
    },
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        if (this.playBtn) this.playBtn.innerHTML = '<i class="bx bx-play"></i>';
        if (this.albumArt) this.albumArt.classList.remove('playing');
    },
    
    next() {
        if (this.playlist.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.loadTrack(this.currentIndex);
        if (this.isPlaying) this.play();
    },
    
    prev() {
        if (this.playlist.length === 0) return;
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
        } else {
            this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadTrack(this.currentIndex);
            if (this.isPlaying) this.play();
        }
    },
    
    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        if(this.shuffleBtn) this.shuffleBtn.classList.toggle('active', this.isShuffle);
        if (this.isShuffle) {
            this.playlist.sort(() => Math.random() - 0.5);
        } else {
            this.playlist = [...this.originalPlaylist];
        }
        this.highlightCurrentTrack();
    },
    
    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        if(this.repeatBtn) {
            this.repeatBtn.classList.toggle('active', this.repeatMode > 0);
            this.repeatBtn.innerHTML = this.repeatMode === 2 
                ? '<i class="bx bx-repeat"></i><span class="repeat-one">1</span>' 
                : '<i class="bx bx-repeat"></i>';
        }
    },
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

document.addEventListener('DOMContentLoaded', () => player.init());