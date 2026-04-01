/* ═══════════════════════════════════════════════════════════════
   Aurora Music — script.js
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
    menuToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nav.classList.toggle('active');
      document.body.classList.toggle('nav-open');
    });

    // Fecha ao clicar em qualquer link do nav
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        document.body.classList.remove('nav-open');
      });
    });

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menuToggleBtn.contains(e.target)) {
        nav.classList.remove('active');
        document.body.classList.remove('nav-open');
      }
    });
  }

  /* ── Bottom Nav: destaque do item ativo por scroll ────────── */
  const bottomNavLinks = document.querySelectorAll('.mobile-nav-scroll a[href^="#"]');
  const sections       = document.querySelectorAll('section[id], .footer[id]');

  function updateActiveBottomNav() {
    let currentSection = '';
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= window.innerHeight * 0.5) {
        currentSection = sec.id;
      }
    });
    bottomNavLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + currentSection) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveBottomNav, { passive: true });
  updateActiveBottomNav();

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

  const ACTIVE_GREEN   = '#00ff00';

  /* ── Estados ─────────────────────────────────────────────── */
  let allItems   = Array.from(document.querySelectorAll('.playlist-item'));
  let playlist   = [...allItems];
  let currentIdx = 0;
  let isPlaying  = false;
  let isShuffle  = false;
  let isRepeat   = false;

  /* Lista para armazenar os arquivos encontrados em promo */
  let promoFiles = [];

  /* ── Publicidade ── */
  let tracksPlayedSinceAd = 0;
  const AD_INTERVAL = 3;
  let isPlayingAd = false;

  /* Busca a lista de arquivos do controller PHP */
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
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true
      });

      btStatus.innerHTML = `
        <i class="bx bx-headset"></i>
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 75px;">
          ${device.name || 'Fone Conectado'}
        </span>
      `;

      device.addEventListener('gattserverdisconnected', () => {
        initBluetoothSupport();
      });

    } catch (error) {
      // Cancelado pelo usuário ou erro silencioso
    }
  });
}

initBluetoothSupport();
