/* ═══════════════════════════════════════════════════════════════
   Aurora Music — script.js (Versão Corrigida: Scroll + Menu + Player)
 ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Elementos ──────────────────────────────────────────── */
  const audio          = document.getElementById('audioPlayer');
  const playBtn        = document.getElementById('playBtn');
  const prevBtn        = document.getElementById('prevBtn');
  const nextBtn        = document.getElementById('nextBtn');
  const shuffleBtn     = document.getElementById('shuffleBtn');
  const repeatBtn      = document.getElementById('repeatBtn');
  const progress       = document.getElementById('progress');
  const progressBar    = document.querySelector('.progress-bar');
  const currentTimeEl  = document.getElementById('currentTime');
  const durationEl     = document.getElementById('duration');
  const volumeSlider   = document.getElementById('volumeSlider');
  const volumeIcon     = document.querySelector('.volume-control i');
  const trackName      = document.getElementById('trackName');
  const artistName     = document.getElementById('artistName');
  const albumCover     = document.getElementById('albumCover');
  const searchInput    = document.getElementById('searchInput');
  const playlistEl     = document.getElementById('playlistContainer');

  /* ── Menu Mobile ─────────────────────────────────────────── */
  const menuToggleBtn  = document.querySelector('.menu-toggle');
  const nav            = document.querySelector('.nav');

  if (menuToggleBtn && nav) {
    const menuIcon = menuToggleBtn.querySelector('i');

    menuToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = nav.classList.toggle('active');
      document.body.classList.toggle('nav-open');
      if (menuIcon) {
        menuIcon.className = isActive ? 'bx bx-x' : 'bx bx-menu';
      }
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        document.body.classList.remove('nav-open');
        if (menuIcon) menuIcon.className = 'bx bx-menu';
      });
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menuToggleBtn.contains(e.target)) {
        nav.classList.remove('active');
        document.body.classList.remove('nav-open');
        if (menuIcon) menuIcon.className = 'bx bx-menu';
      }
    });
  }

  /* ── Scroll Helpers ──────────────────────────────────────── */

  /**
   * Retorna a altura real do header fixo em pixels.
   * Usa getComputedStyle para pegar o valor atual da CSS var,
   * e converte para número.
   */
  function getHeaderHeight() {
    const headerEl = document.querySelector('.header');
    if (headerEl) return headerEl.getBoundingClientRect().height;
    // fallback: lê a CSS var
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--header-height').trim();
    return parseFloat(raw) * 16 || 64;
  }

  /**
   * Rola suavemente até o elemento, compensando o header fixo.
   * No mobile existe também a bottom nav, mas ela não interfere
   * no topo do scroll — apenas no padding inferior.
   */
  function scrollToSection(hash) {
    if (!hash) return;
    const targetEl = document.querySelector(hash);
    if (!targetEl) return;

    const headerH  = getHeaderHeight();
    const extraGap = 8; // pequena folga visual
    const top      = targetEl.getBoundingClientRect().top
                   + window.scrollY
                   - headerH
                   - extraGap;

    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    history.pushState(null, '', window.location.pathname);
  }

  /* ── Bottom Nav: destaque do item ativo por scroll ────────── */
  const bottomNavLinks = document.querySelectorAll('.mobile-nav-scroll a[href^="#"]');
  const sections       = document.querySelectorAll('section[id], .footer[id]');

  function updateActiveBottomNav() {
    const scrollMid = window.scrollY + window.innerHeight * 0.4;
    let currentSection = '';

    sections.forEach(sec => {
      if (sec.offsetTop <= scrollMid) {
        currentSection = sec.id;
      }
    });

    bottomNavLinks.forEach(link => {
      link.classList.toggle(
        'active',
        link.getAttribute('href') === '#' + currentSection
      );
    });
  }

  /* ── Inicializa navegação sem hash na URL ────────────────── */
  function initNavigation() {
    const allLinks = document.querySelectorAll(
      'nav a[href^="#"], .mobile-nav-scroll a[href^="#"], .footer a[href^="#"], a.btn-primary[href^="#"]'
    );

    allLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection(href);
      });
    });

    // Se página abriu com hash na URL, rola corretamente
    if (window.location.hash) {
      const hash = window.location.hash;
      // Pequeno delay para garantir que o layout já renderizou
      setTimeout(() => {
        scrollToSection(hash);
        history.replaceState(null, '', window.location.pathname);
      }, 100);
    }

    window.addEventListener('hashchange', () => {
      if (window.location.hash) {
        scrollToSection(window.location.hash);
        history.replaceState(null, '', window.location.pathname);
      }
    });

    window.addEventListener('popstate', () => {
      history.replaceState(null, '', window.location.pathname);
    });
  }

  window.addEventListener('scroll', updateActiveBottomNav, { passive: true });
  updateActiveBottomNav();
  initNavigation();

  /* ── Album Art Rotation ───────────────────────────────────── */
  const albumArtImg = document.getElementById('albumCover');

  function setRotation(playing) {
    if (albumArtImg) {
      albumArtImg.style.animationPlayState = playing ? 'running' : 'paused';
    }
  }

  /* ── Duration display ────────────────────────────────────── */
  audio.addEventListener('loadedmetadata', () => {
    if (durationEl && !isNaN(audio.duration)) {
      durationEl.textContent = Math.floor(audio.duration / 60) + ":" +
        ("0" + Math.floor(audio.duration % 60)).slice(-2);
    }
  });

  const ACTIVE_GREEN = '#00ff00';

  /* ── Estados ─────────────────────────────────────────────── */
  let allItems   = Array.from(document.querySelectorAll('.playlist-item'));
  let playlist   = [...allItems];
  let currentIdx = 0;
  let isPlaying  = false;
  let isShuffle  = false;
  let isRepeat   = false;

  let promoFiles = [];

  /* ── Publicidade ── */
  let tracksPlayedSinceAd = 0;
  const AD_INTERVAL = 3;
  let isPlayingAd = false;

  async function fetchPromos() {
    try {
      const response = await fetch('controllers/get_promos.php');
      promoFiles = await response.json();
    } catch (err) {
      console.error("Erro ao carregar lista de promos:", err);
    }
  }

  function playPromo(resumeIdx) {
    if (promoFiles.length === 0) {
      loadTrack(resumeIdx, true);
      return;
    }

    isPlayingAd = true;

    const randomPromo = promoFiles[Math.floor(Math.random() * promoFiles.length)];

    trackName.textContent  = '📢 Publicidade';
    artistName.textContent = 'Aurora Music';
    albumCover.src         = 'assets/images/promo-cover.png';

    allItems.forEach(i => i.classList.remove('active'));

    audio.src = randomPromo;
    audio.load();
    audio.play().catch(() => {});

    const onAdEnd = () => {
      audio.removeEventListener('ended', onAdEnd);
      isPlayingAd = false;
      loadTrack(resumeIdx, true);
    };
    audio.addEventListener('ended', onAdEnd);
  }

  /* ── Funções Core ───────────────────────────────────────── */
  function loadTrack(idx, autoplay) {
    if (!playlist.length) return;
    currentIdx = idx;
    const item = playlist[idx];

    let cleanName = item.dataset.display;
    cleanName = cleanName.replace(/\s*\(.*?\)\s*/g, ' ');
    cleanName = cleanName.replace(/\.[^/.]+$/, "");
    cleanName = cleanName.replace(/[_-]/g, ' ');
    cleanName = cleanName.replace(/\s+/g, ' ').trim();

    trackName.textContent  = cleanName;
    artistName.textContent = item.dataset.artist;
    albumCover.src         = item.dataset.cover || 'assets/images/cover.png';

    audio.src = item.dataset.src;
    audio.load();

    allItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    if (autoplay) playAudio();
  }

  function playAudio() {
    audio.play();
    isPlaying = true;
    playBtn.querySelector('i').className = 'bx bx-pause';
    setRotation(true);
  }

  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    playBtn.querySelector('i').className = 'bx bx-play';
    setRotation(false);
  }

  function nextTrack() {
    if (isPlayingAd) return;
    tracksPlayedSinceAd++;
    if (tracksPlayedSinceAd >= AD_INTERVAL) {
      tracksPlayedSinceAd = 0;
      const nextIdx = (currentIdx + 1) % playlist.length;
      playPromo(nextIdx);
    } else {
      loadTrack((currentIdx + 1) % playlist.length, true);
    }
  }

  /* ── Eventos de Clique ── */
  playBtn.addEventListener('click', () => isPlaying ? pauseAudio() : playAudio());
  nextBtn.addEventListener('click', nextTrack);
  prevBtn.addEventListener('click', () => {
    if (isPlayingAd) return;
    loadTrack((currentIdx - 1 + playlist.length) % playlist.length, true);
  });

  shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.style.color = isShuffle ? ACTIVE_GREEN : '';
    if (isShuffle) {
      playlist.sort(() => Math.random() - 0.5);
    } else {
      playlist = [...allItems];
    }
    playlistEl.innerHTML = '';
    playlist.forEach(item => playlistEl.appendChild(item));
  });

  repeatBtn.addEventListener('click', () => {
    isRepeat = !isRepeat;
    repeatBtn.style.color = isRepeat ? ACTIVE_GREEN : '';
    repeatBtn.querySelector('i').className = isRepeat ? 'bx bx-sync' : 'bx bx-repeat';
  });

  /* ── Barra de Progresso e Volume ── */
  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    progress.style.width = `${pct}%`;
    currentTimeEl.textContent = Math.floor(audio.currentTime / 60) + ":" +
      ("0" + Math.floor(audio.currentTime % 60)).slice(-2);
  });

  progressBar.addEventListener('click', (e) => {
    const pct = e.offsetX / progressBar.offsetWidth;
    audio.currentTime = pct * audio.duration;
  });

  volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value / 100;
    volumeIcon.className = audio.volume === 0 ? 'bx bx-volume-mute' : 'bx bx-volume-full';
  });

  audio.addEventListener('ended', () => {
    setRotation(false);
    if (isRepeat && !isPlayingAd) {
      audio.currentTime = 0;
      playAudio();
    } else {
      nextTrack();
    }
  });

  /* ── Busca ── */
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    allItems.forEach(item => {
      const match = item.innerText.toLowerCase().includes(q);
      item.style.display = match ? 'flex' : 'none';
    });
  });

  playlistEl.addEventListener('click', (e) => {
    const item = e.target.closest('.playlist-item');
    if (item) {
      tracksPlayedSinceAd = 0;
      loadTrack(playlist.indexOf(item), true);
    }
  });

  // Inicializa
  fetchPromos();
  if (playlist.length) loadTrack(0, false);
});

/* ── Suporte Web Bluetooth API ────────────────────────────── */
async function initBluetoothSupport() {
  const btStatus = document.getElementById('btStatus');
  if (!btStatus) return;

  if (window.location.protocol !== 'https:' || !navigator.bluetooth) {
    btStatus.innerHTML = '';
    return;
  }

  btStatus.style.display    = "flex";
  btStatus.style.alignItems = "center";
  btStatus.style.gap        = "5px";
  btStatus.style.fontSize   = "0.8em";
  btStatus.style.color      = "#00ff00";
  btStatus.style.padding    = "0 10px";

  btStatus.innerHTML = `
    <button id="btnConnectBT" style="background:none; border:none; color:#00ff00; cursor:pointer; display:flex; align-items:center; padding:0;">
      <i class="bx bx-bluetooth" title="Parear Fone"></i>
    </button>
  `;

  document.getElementById('btnConnectBT').addEventListener('click', async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });

      btStatus.innerHTML = `
        <i class="bx bx-headset"></i>
        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:75px;">
          ${device.name || 'Fone Conectado'}
        </span>
      `;

      device.addEventListener('gattserverdisconnected', () => {
        initBluetoothSupport();
      });

    } catch (error) {
      // Cancelado pelo usuário — silencioso
    }
  });
}

initBluetoothSupport();