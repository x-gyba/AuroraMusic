<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    header("Location: views/dashboard.php");
    exit;
}
$configPath     = __DIR__ . '/config/database.php';
$musicModelPath = __DIR__ . '/models/Music.php';
if (!file_exists($configPath))     die("ERRO CRÍTICO: config/database.php não encontrado.");
require_once $configPath;
if (!class_exists('Config\Database')) die("ERRO CRÍTICO: Classe Config\\Database não definida.");
if (!file_exists($musicModelPath)) die("ERRO CRÍTICO: models/Music.php não encontrado.");
require_once $musicModelPath;
if (!class_exists('\Models\Music')) die("ERRO CRÍTICO: Classe Models\\Music não definida.");

use Models\Music;
$todasMusicas = [];
$erroMusicas  = null;

try {
    $musicModel   = new Music();
    $todasMusicas = $musicModel->getAllPublic();
} catch (\Throwable $e) {
    $erroMusicas  = $e->getMessage();
    $todasMusicas = [];
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aurora Music - Sua Plataforma Musical</title>
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/login.css">
<link rel="stylesheet" href="assets/css/whatsapp.css">
<link rel="stylesheet" href="assets/css/bluetooth.css">
<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
</head>
<body>

<?php if (isset($_GET['debug'])): ?>
<div style="background:#f0f0f0;border:2px solid #333;padding:15px;margin:20px;color:#000">
  <h3>Debug</h3>
  <p>PHP: <?= PHP_VERSION ?> | Músicas: <?= count($todasMusicas) ?></p>
  <?php if ($erroMusicas): ?><p style="color:red">Erro: <?= htmlspecialchars($erroMusicas) ?></p><?php endif; ?>
</div>
<?php endif; ?>

<header class="header">
  <div class="container">

    <!-- Lado esquerdo: logo + título + versículo -->
    <div class="header-left">
      <div class="logo-area">
        <div class="brand-container">
          <img src="assets/images/logo.png" alt="Aurora Music Logo" class="main-logo">
          <div class="brand-text"><h2>Aurora Music</h2></div>
        </div>
        <div class="container-inline">
          <h2>Mas Deus escolheu as coisas loucas deste mundo para confundir as sábias. <span>1Co 1:27</span></h2>
        </div>
      </div>
    </div>

    <!-- Lado direito: botão menu (mobile) + nav (desktop) -->
    <div class="header-right">
      <button class="menu-toggle" aria-label="Menu"><i class="bx bx-menu"></i></button>
      <nav class="nav">
        <a href="#home">Início</a>
        <a href="#music">Músicas</a>
        <a href="#about">Sobre</a>
        <a href="#precos">Preços</a>
        <a href="#" id="loginTrigger">Login</a>
        <a href="#contact">Contato</a>
      </nav>
    </div>

  </div>
</header>

<section class="hero" id="home">
  <div class="container">
    <div class="hero-content">
      <h2>Bem-vindo ao seu universo musical</h2>
      <p>Explore nossa biblioteca e deixe a música tocar sua alma</p>
      <a href="#music" class="btn-primary">Ouvir Agora</a>
    </div>
  </div>
</section>

<section class="player-section" id="music">
  <div class="container">
    <div class="player-container">

      <div class="player-info">
        <div class="album-art" id="albumArtContainer">
          <img id="albumCover" src="assets/images/cover.png" alt="Capa do Álbum">
        </div>
        <div class="track-info">
          <h3 id="trackName">Nenhuma música disponível</h3>
          <p id="artistName">Faça upload de músicas no painel</p>
        </div>
      </div>

      <div class="player-controls">
        <audio id="audioPlayer"></audio>

        <div class="progress-container">
          <span id="currentTime" class="time">0:00</span>
          <div class="progress-bar"><div id="progress" class="progress"></div></div>
          <span id="duration" class="time">0:00</span>
        </div>

        <div class="controls">
          <button id="shuffleBtn" class="control-btn" title="Aleatório"><i class="bx bx-shuffle" style="font-size:1.6rem"></i></button>
          <button id="prevBtn"    class="control-btn" title="Anterior"><i class="bx bx-skip-previous" style="font-size:2.5rem"></i></button>
          <button id="playBtn"    class="control-btn play-btn" title="Play/Pause"><i class="bx bx-play"></i></button>
          <button id="nextBtn"    class="control-btn" title="Próxima"><i class="bx bx-skip-next" style="font-size:2.5rem"></i></button>
          <button id="repeatBtn"  class="control-btn" title="Repetir"><i class="bx bx-repeat" style="font-size:1.6rem"></i></button>
        </div>

        <div class="volume-control">
          <i class="bx bx-volume-full" style="font-size:1.6rem"></i>
          <input type="range" id="volumeSlider" min="0" max="100" value="70">
        </div>

        <div id="bluetoothBadge" class="bluetooth-badge">
          <i class="bx bx-headphone"></i>
          <span id="bluetoothLabel">Fone Conectado</span>
        </div>

      </div>

      <h2 class="section-title-playlist">Minha Biblioteca</h2>
      <div class="search-container">
        <i class="bx bx-search search-icon"></i>
        <input type="text" id="searchInput" placeholder="Buscar música ou artista...">
      </div>

      <ul class="playlist" id="playlistContainer">
<?php
$temMusica = false;
if (!empty($todasMusicas)):
    foreach ($todasMusicas as $musica):
        $arquivo  = basename($musica['caminho_arquivo']);
        $caminho  = __DIR__ . '/music/' . $arquivo;
        if (!file_exists($caminho)) continue;
        $temMusica = true;
        $artista   = '';
        if (!empty($musica['artista'])) {
            $artista = $musica['artista'];
        } elseif (strpos($musica['nome_exibicao'], ' - ') !== false) {
            $partes  = explode(' - ', $musica['nome_exibicao'], 2);
            $artista = trim($partes[0]);
        }
        $cover = $musica['caminho_imagem'] ?? '';
?>
        <li class="playlist-item"
            data-src="music/<?= htmlspecialchars($arquivo) ?>"
            data-display="<?= htmlspecialchars($musica['nome_exibicao']) ?>"
            data-artist="<?= htmlspecialchars($artista) ?>"
            data-cover="<?= htmlspecialchars($cover) ?>">
          <div class="item-icon"><i class="bx bx-play-circle"></i></div>
          <div class="item-text">
            <span class="item-title"><?= htmlspecialchars($musica['nome_exibicao']) ?></span>
            <small class="item-artist"><?= htmlspecialchars($artista) ?></small>
          </div>
        </li>
<?php endforeach; endif; ?>
<?php if (!$temMusica): ?>
        <li class="no-music-item">
          <i class="bx bx-music"></i>
          Nenhuma música encontrada. Consulte o seu Administrador.
        </li>
<?php endif; ?>
      </ul>

    </div>
  </div>
</section>

<section class="about-section" id="about">
  <div class="container">
    <div class="about-content">
      <h2 class="section-title">Sobre o Aurora Music</h2>
      <div class="about-grid">
        <div class="about-card">
          <div class="about-icon"><i class="bx bx-music"></i></div>
          <h3>Nossa Missão</h3>
          <p>Proporcionar uma experiência musical única e acessível, conectando pessoas através da música e inspirando corações com mensagens de fé.</p>
        </div>
        <div class="about-card">
          <div class="about-icon"><i class="bx bx-heart"></i></div>
          <h3>Nossos Valores</h3>
          <p>Guiados pela fé e compromisso com a excelência, oferecemos uma plataforma que celebra a diversidade musical e cultural.</p>
        </div>
        <div class="about-card">
          <div class="about-icon"><i class="bx bx-trophy"></i></div>
          <h3>Nossa Visão</h3>
          <p>Ser referência em streaming de música, combinando tecnologia de ponta com conteúdo de qualidade para todos os públicos.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="pricing-section" id="precos">
  <div class="container">
    <h2 class="section-title">Escolha Seu Plano</h2>
    <div class="pricing-grid">
      <div class="pricing-card">
        <div class="pricing-header">
          <i class="bx bx-music"></i><h3>Gratuito</h3>
          <div class="price"><span class="currency">R$</span><span class="amount">0</span><span class="period">/mês</span></div>
        </div>
        <ul class="pricing-features">
          <li><i class="bx bx-check"></i> Acesso à biblioteca pública</li>
          <li><i class="bx bx-check"></i> Qualidade padrão de áudio</li>
          <li><i class="bx bx-check"></i> Anúncios ocasionais</li>
        </ul>
        <a href="#" class="pricing-btn">Começar Grátis</a>
      </div>
      <div class="pricing-card featured">
        <div class="featured-badge">Mais Popular</div>
        <div class="pricing-header">
          <i class="bx bx-crown"></i><h3>Premium</h3>
          <div class="price"><span class="currency">R$</span><span class="amount">19,90</span><span class="period">/mês</span></div>
        </div>
        <ul class="pricing-features">
          <li><i class="bx bx-check"></i> Acesso total sem anúncios</li>
          <li><i class="bx bx-check"></i> Qualidade de áudio HD</li>
          <li><i class="bx bx-check"></i> Downloads ilimitados</li>
        </ul>
        <a href="#" class="pricing-btn">Assinar Premium</a>
      </div>
      <div class="pricing-card">
        <div class="pricing-header">
          <i class="bx bx-group"></i><h3>Família</h3>
          <div class="price"><span class="currency">R$</span><span class="amount">29,90</span><span class="period">/mês</span></div>
        </div>
        <ul class="pricing-features">
          <li><i class="bx bx-check"></i> Até 6 contas Premium</li>
          <li><i class="bx bx-check"></i> Todos os benefícios Premium</li>
          <li><i class="bx bx-check"></i> Melhor custo-benefício</li>
        </ul>
        <a href="#" class="pricing-btn">Assinar Família</a>
      </div>
    </div>
  </div>
</section>

<section class="contact-section" id="contact">
  <div class="container">
    <h2 class="section-title">Entre em Contato</h2>
    <div class="contact-wrapper">
      <div class="contact-info-cards">
        <div class="contact-card">
          <div class="contact-icon"><i class="bx bx-envelope"></i></div>
          <h3>Email</h3><p>contato@auroramusic.com</p>
          <a href="mailto:contato@auroramusic.com" class="contact-link">Enviar Email</a>
        </div>
        <div class="contact-card">
          <div class="contact-icon"><i class="bx bx-phone"></i></div>
          <h3>Telefone</h3><p>(21) 99999-9999</p>
          <a href="tel:+5521999999999" class="contact-link">Ligar Agora</a>
        </div>
        <div class="contact-card">
          <div class="contact-icon"><i class="bx bxl-whatsapp"></i></div>
          <h3>WhatsApp</h3><p>Atendimento Rápido</p>
          <a href="https://wa.me/5521999999999?text=Olá!%20Vim%20do%20site%20Aurora%20Music" class="contact-link" target="_blank">Chamar no WhatsApp</a>
        </div>
        <div class="contact-card">
          <div class="contact-icon"><i class="bx bx-map"></i></div>
          <h3>Localização</h3><p>Teresópolis, RJ - Brasil</p>
          <a href="#" class="contact-link">Ver no Mapa</a>
        </div>
      </div>
      <div class="contact-form-container">
        <form class="contact-form" id="contactForm" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
          <div class="form-group"><label for="name">Nome Completo</label><input type="text" id="name" name="name" placeholder="Seu nome" required></div>
          <div class="form-group"><label for="email">Email</label><input type="email" id="email" name="email" placeholder="seu@email.com" required></div>
          <div class="form-group"><label for="subject">Assunto</label><input type="text" id="subject" name="subject" placeholder="Assunto da mensagem" required></div>
          <div class="form-group"><label for="message">Mensagem</label><textarea id="message" name="message" rows="5" placeholder="Escreva sua mensagem..." required></textarea></div>
          <button type="submit" class="contact-submit-btn"><i class="bx bx-send"></i> Enviar Mensagem</button>
        </form>
      </div>
    </div>
  </div>
</section>

<div id="loginModal" class="modal-login">
  <div class="modal-login-content">
    <button class="close-modal" aria-label="Fechar">&times;</button>
    <div class="login-header">
      <img src="assets/images/logo.png" alt="Logo Aurora Music">
      <h3>Painel Administrativo</h3>
    </div>
    <form id="loginForm" action="controllers/AuthController.php?auth_action=login" method="POST">
      <div class="form-group">
        <label for="email_login">Usuário</label>
        <div class="input-with-icon">
          <i class="bx bx-user"></i>
          <input type="text" id="email_login" name="usuario" placeholder="Seu usuário ou email" required autocomplete="username">
        </div>
      </div>
      <div class="form-group">
        <label for="password_login">Senha</label>
        <div class="input-with-icon">
          <i class="bx bx-lock-alt"></i>
          <input type="password" id="password_login" name="senha" placeholder="Sua senha" required autocomplete="current-password">
        </div>
      </div>
      <div id="loginMessage" class="login-message"></div>
      <button type="submit" class="btn-login-submit">Entrar <i class="bx bx-right-arrow-alt"></i></button>
    </form>
  </div>
</div>

<footer class="footer" id="footer">
  <div class="container">
    <div class="footer-content">
      <div class="footer-section">
        <div class="footer-logo"><img src="assets/images/logo.png" alt="Aurora Music Logo"><h3>Aurora Music</h3></div>
        <p>Sua plataforma de música com propósito e qualidade.</p>
        <div class="social-links">
          <a href="#" title="Facebook"><i class="bx bxl-facebook"></i></a>
          <a href="#" title="Instagram"><i class="bx bxl-instagram"></i></a>
          <a href="#" title="Twitter"><i class="bx bxl-twitter"></i></a>
        </div>
      </div>
      <div class="footer-section">
        <h4>Links Rápidos</h4>
        <ul>
          <li><a href="#home">Início</a></li>
          <li><a href="#music">Músicas</a></li>
          <li><a href="#about">Sobre</a></li>
          <li><a href="#precos">Preços</a></li>
          <li><a href="#contact">Contato</a></li>
          <li class="mobile-only"><a href="#" id="footerLoginTrigger" style="color:#ff6b9d;font-weight:bold;"><i class="bx bx-lock-alt"></i> Login</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4>Contato Rápido</h4>
        <ul class="contact-info">
          <li><i class="bx bx-envelope"></i> contato@auroramusic.com</li>
          <li><i class="bx bx-map"></i> Teresópolis, RJ - Brasil</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Aurora Music - Infogyba Soluções em TI. Todos os direitos reservados.</p>
    </div>
  </div>
</footer>

<a href="https://wa.me/5521999999999?text=Olá!%20Vim%20do%20site%20Aurora%20Music" class="whatsapp-float" target="_blank" rel="noopener noreferrer">
  <span class="whatsapp-icon"><i class="bx bxl-whatsapp"></i></span>
</a>

<nav class="mobile-nav-scroll">
  <div class="nav-scroll-container">
    <a href="#home" class="active"><i class="bx bx-home"></i><span>Início</span></a>
    <a href="#music"><i class="bx bxs-music"></i><span>Músicas</span></a>
    <a href="#about"><i class="bx bx-info-circle"></i><span>Sobre</span></a>
    <a href="#precos"><i class="bx bx-dollar-circle"></i><span>Preços</span></a>
    <a href="#" id="loginMobileTrigger"><i class="bx bx-user"></i><span>Login</span></a>
    <a href="#contact"><i class="bx bx-message-rounded"></i><span>Contato</span></a>
  </div>
</nav>

<script src="assets/js/script.js"></script>
<script src="assets/js/login.js"></script>
<script>fetch('assets/js/auto.js').catch(() => {});</script>
</body>
</html>