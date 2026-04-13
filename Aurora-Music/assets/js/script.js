/* ═══════════════════════════════════════════════════════════════
   Aurora Music — script.js (Versão Final Otimizada v3)
   Correções: bloqueio Voltar iOS/Android, artista, responsividade
 ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  /* ── Seleção de Elementos ────────────────────────────────── */
  const audio         = document.getElementById("audioPlayer");
  const playBtn       = document.getElementById("playBtn");
  const prevBtn       = document.getElementById("prevBtn");
  const nextBtn       = document.getElementById("nextBtn");
  const shuffleBtn    = document.getElementById("shuffleBtn");
  const repeatBtn     = document.getElementById("repeatBtn");
  const progress      = document.getElementById("progress");
  const progressBar   = document.querySelector(".progress-bar");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl    = document.getElementById("duration");
  const volumeSlider  = document.getElementById("volumeSlider");
  const volumeIcon    = document.querySelector(".volume-control i");
  const trackName     = document.getElementById("trackName");
  const artistName    = document.getElementById("artistName");
  const albumCover    = document.getElementById("albumCover");
  const searchInput   = document.getElementById("searchInput");
  const playlistEl    = document.getElementById("playlistContainer");

  /* ── Constantes e Estados ────────────────────────────────── */
  const ACTIVE_GREEN = "#00ff00";
  const AD_INTERVAL  = 3;

  const setViewportHeight = () => {
    document.documentElement.style.setProperty(
      "--vh",
      `${window.innerHeight * 0.01}px`
    );
  };

  let allItems            = Array.from(document.querySelectorAll(".playlist-item"));
  let playlist            = [...allItems];
  let currentIdx          = 0;
  let isPlaying           = false;
  let isShuffle           = false;
  let isRepeat            = false;
  let isPlayingAd         = false;
  let tracksPlayedSinceAd = 0;
  let promoFiles          = [];

  /* ── Menu Mobile & Navegação ─────────────────────────────── */
  const menuToggleBtn = document.querySelector(".menu-toggle");
  const nav           = document.querySelector(".nav");

  if (menuToggleBtn && nav) {
    const menuIcon = menuToggleBtn.querySelector("i");

    const toggleMenu = (forceClose = false) => {
      const active = forceClose ? false : nav.classList.toggle("active");
      if (forceClose) nav.classList.remove("active");
      document.body.classList.toggle("nav-open", active);
      if (menuIcon) menuIcon.className = active ? "bx bx-x" : "bx bx-menu";
    };

    menuToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !menuToggleBtn.contains(e.target))
        toggleMenu(true);
    });
  }

  window.addEventListener("resize", setViewportHeight);

  /* ── Bloqueio do Botão Voltar ────────────────────────────────
   *
   * Estratégia multi-camada para iOS Safari e Android Chrome:
   *
   * Camada 1: replaceState + pushState duplo
   *   Cria um estado "buffer" no histórico. O 1º toque em Voltar
   *   desfaz apenas o pushState, mantendo a URL/página atual.
   *
   * Camada 2: popstate loop
   *   Toda vez que o browser tenta navegar para trás, re-empurra
   *   um novo estado. Funciona em desktop e Android Chrome.
   *
   * Camada 3: pageshow + persisted (bfcache)
   *   O bfcache é o mecanismo de iOS Safari / Android Chrome que
   *   restaura a página instantaneamente ao pressionar Voltar.
   *   Quando persisted === true, detectamos essa restauração e
   *   re-empurramos o estado para "prender" o usuário.
   *
   * Camada 4: visibilitychange (iOS Safari extra)
   *   iOS Safari às vezes usa visibilitychange ao invés de
   *   pageshow para bfcache. Detectamos o retorno à página
   *   (document.visibilityState === 'visible') e re-empurramos.
   *
   * NOTA: beforeunload foi removido — iOS Safari e Android Chrome
   *   ignoram esse evento por spec desde 2019.
   *
   * NOTA SERVIDOR: Cache-Control: no-store no PHP desativa o
   *   bfcache via HTTP, reforçando as camadas acima.
   * ── */
  const path = window.location.pathname;
  const isIndexPage =
    /\/Aurora-Music\/?$/.test(path)           ||
    /\/Aurora-Music\/index\.php$/.test(path)  ||
    /\/Aurora-Music\/index\.html$/.test(path) ||
    path === "/"                              ||
    path === "/index.php"                     ||
    path === "/index.html";

  if (isIndexPage) {
    // Desativa restauração de scroll automática do browser
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Camada 1: dois estados no histórico
    history.replaceState({ page: "aurora-index", ts: Date.now() }, "", window.location.href);
    history.pushState(  { page: "aurora-index", ts: Date.now() }, "", window.location.href);

    sessionStorage.setItem("aurora_on_index", "1");

    // Camada 2: re-push no popstate
    window.addEventListener("popstate", (e) => {
      history.pushState({ page: "aurora-index", ts: Date.now() }, "", window.location.href);
    });

    // Camada 3: pageshow cobre bfcache (iOS Safari, Android Chrome)
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        // Página veio do bfcache — re-empurra o estado
        history.pushState({ page: "aurora-index", ts: Date.now() }, "", window.location.href);
      }
    });

    // Camada 4: visibilitychange — extra para iOS Safari
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        // Verifica se o estado atual ainda é o nosso
        if (!history.state || history.state.page !== "aurora-index") {
          history.pushState({ page: "aurora-index", ts: Date.now() }, "", window.location.href);
        }
      }
    });
  }

  /* ── Lógica de Scroll Suave ──────────────────────────────── */
  function getHeaderHeight() {
    const headerEl = document.querySelector(".header");
    return headerEl ? headerEl.getBoundingClientRect().height : 64;
  }

  function scrollToSection(hash) {
    const targetEl = document.querySelector(hash);
    if (!targetEl) return;
    const top =
      targetEl.getBoundingClientRect().top +
      window.scrollY -
      getHeaderHeight() - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    history.replaceState(null, "", window.location.pathname);
  }

  // Monitor de Scroll para Bottom Nav
  const bottomNavLinks = document.querySelectorAll('.mobile-nav-scroll a[href^="#"]');
  const sections       = document.querySelectorAll("section[id], .footer[id]");

  window.addEventListener("scroll", () => {
    const scrollMid = window.scrollY + window.innerHeight * 0.4;
    let currentId = "";
    sections.forEach((sec) => {
      if (sec.offsetTop <= scrollMid) currentId = sec.id;
    });
    bottomNavLinks.forEach((link) =>
      link.classList.toggle("active", link.getAttribute("href") === "#" + currentId)
    );
  }, { passive: true });

  /* ── Player: Core Functions ──────────────────────────────── */
  async function fetchPromos() {
    try {
      const response = await fetch("controllers/get_promos.php");
      promoFiles = await response.json();
    } catch (err) {
      console.error("Erro promos:", err);
    }
  }

  function loadTrack(idx, autoplay) {
    if (!playlist.length) return;
    currentIdx = idx;
    const item = playlist[idx];

    let cleanName = item.dataset.display || "Sem Título";
    cleanName = cleanName
      .replace(/\.(mp3|wav|ogg|pm).*$/i, "")
      .replace(/[_-]/g, " ")
      .trim();
    trackName.textContent = cleanName;

    // Artista: usa data-artist do elemento (já resolvido no PHP)
    const artist = (item.dataset.artist || "").trim();
    if (artist !== "" && artist.toLowerCase() !== "artista desconhecido") {
      artistName.textContent = artist;
      artistName.style.display = "";
    } else {
      artistName.textContent = "";
      artistName.style.display = "none";
    }

    albumCover.src = item.dataset.cover || "assets/images/cover.png";
    audio.src      = item.dataset.src;
    audio.load();

    allItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    if (autoplay) playAudio();
  }

  function playAudio() {
    audio.play()
      .then(() => {
        isPlaying = true;
        playBtn.querySelector("i").className = "bx bx-pause";
        albumCover.style.animationPlayState  = "running";
      })
      .catch((e) => console.log("Autoplay bloqueado ou erro:", e));
  }

  function pauseAudio() {
    if (isPlayingAd) return;
    audio.pause();
    isPlaying = false;
    playBtn.querySelector("i").className = "bx bx-play";
    albumCover.style.animationPlayState  = "paused";
  }

  function nextTrack() {
    if (isPlayingAd) return;
    tracksPlayedSinceAd++;
    const nextIdx = (currentIdx + 1) % playlist.length;
    if (tracksPlayedSinceAd >= AD_INTERVAL && promoFiles.length > 0) {
      tracksPlayedSinceAd = 0;
      playPromo(nextIdx);
    } else {
      loadTrack(nextIdx, true);
    }
  }

  function playPromo(resumeIdx) {
    if (promoFiles.length === 0) {
      loadTrack(resumeIdx, true);
      return;
    }

    isPlayingAd = true;
    const randomPromo = promoFiles[Math.floor(Math.random() * promoFiles.length)];

    trackName.textContent  = "📢 Publicidade";
    artistName.textContent = "Aurora Music";
    artistName.style.display = "";
    albumCover.src         = "assets/images/promo-cover.png";

    playBtn.style.opacity      = "0.5";
    playBtn.style.pointerEvents = "none";

    audio.src = randomPromo + "?t=" + new Date().getTime();
    audio.play();

    const onAdEnd = () => {
      audio.removeEventListener("ended", onAdEnd);
      isPlayingAd = false;
      playBtn.style.opacity       = "1";
      playBtn.style.pointerEvents = "auto";
      loadTrack(resumeIdx, true);
    };
    audio.removeEventListener("ended", onAdEnd);
    audio.addEventListener("ended", onAdEnd);
  }

  /* ── Handlers de Interface ───────────────────────────────── */
  playBtn.addEventListener("click", () => {
    if (isPlayingAd) return;
    isPlaying ? pauseAudio() : playAudio();
  });

  nextBtn.addEventListener("click", nextTrack);

  prevBtn.addEventListener("click", () => {
    if (isPlayingAd) return;
    loadTrack((currentIdx - 1 + playlist.length) % playlist.length, true);
  });

  shuffleBtn.addEventListener("click", () => {
    isShuffle = !isShuffle;
    shuffleBtn.querySelector("i").style.color = isShuffle ? ACTIVE_GREEN : "";
    if (isShuffle) {
      playlist.sort(() => Math.random() - 0.5);
    } else {
      playlist = [...allItems];
    }
    playlistEl.innerHTML = "";
    playlist.forEach((item) => playlistEl.appendChild(item));
  });

  repeatBtn.addEventListener("click", () => {
    isRepeat = !isRepeat;
    repeatBtn.querySelector("i").style.color = isRepeat ? ACTIVE_GREEN : "";
    repeatBtn.querySelector("i").className   = isRepeat ? "bx bx-sync" : "bx bx-repeat";
  });

  /* ── Progresso e Eventos de Áudio ────────────────────────── */
  audio.addEventListener("timeupdate", () => {
    if (isNaN(audio.duration)) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progress.style.width = `${pct}%`;
    const fmtTime = (s) =>
      Math.floor(s / 60) + ":" + ("0" + Math.floor(s % 60)).slice(-2);
    currentTimeEl.textContent = fmtTime(audio.currentTime);
    durationEl.textContent    = fmtTime(audio.duration);
  });

  progressBar.addEventListener("click", (e) => {
    audio.currentTime = (e.offsetX / progressBar.offsetWidth) * audio.duration;
  });

  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value / 100;
    volumeIcon.className =
      audio.volume === 0 ? "bx bx-volume-mute" :
      audio.volume < 0.5 ? "bx bx-volume"      :
                           "bx bx-volume-full";
  });

  audio.addEventListener("ended", () => {
    if (isPlayingAd) return;
    if (isRepeat) {
      audio.currentTime = 0;
      playAudio();
    } else {
      nextTrack();
    }
  });

  /* ── Busca e Playlist ───────────────────────────────────── */
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    allItems.forEach((item) => {
      item.style.display = item.innerText.toLowerCase().includes(q) ? "flex" : "none";
    });
  });

  playlistEl.addEventListener("click", (e) => {
    const item = e.target.closest(".playlist-item");
    if (item) {
      tracksPlayedSinceAd = 0;
      loadTrack(playlist.indexOf(item), true);
    }
  });

  /* ── Links Internos ──────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href !== "#") {
        e.preventDefault();
        scrollToSection(href);
        if (nav && nav.classList.contains("active")) {
          nav.classList.remove("active");
          document.body.classList.remove("nav-open");
          const menuIcon = menuToggleBtn?.querySelector("i");
          if (menuIcon) menuIcon.className = "bx bx-menu";
        }
      }
    });
  });

  /* ── Inicialização ───────────────────────────────────────── */
  setViewportHeight();
  fetchPromos();
  if (playlist.length) loadTrack(0, false);
  initBluetoothSupport();
});

/* ── Web Bluetooth API ───────────────────────────────────── */
async function initBluetoothSupport() {
  const btStatus = document.getElementById("btStatus");
  if (!btStatus || !navigator.bluetooth) return;

  btStatus.style.display = "flex";
  btStatus.innerHTML = `
    <button id="btnConnectBT" style="background:none; border:none; color:#00ff00; cursor:pointer;">
      <i class="bx bx-bluetooth" title="Parear Fone"></i>
    </button>`;

  document.getElementById("btnConnectBT").addEventListener("click", async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      btStatus.innerHTML = `<i class="bx bx-headset"></i> <span style="font-size:12px;">${(device.name || "Conectado").substring(0, 10)}</span>`;
      device.addEventListener("gattserverdisconnected", () => initBluetoothSupport());
    } catch (err) {
      /* Usuário cancelou */
    }
  });
}