<?php
session_start();

// 1. Redirecionamento de sessão
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    header("Location: views/dashboard.php");
    exit;
}

// 2. Dependências
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/Music.php';

$todasMusicas = [];
try {
    $musicModel = new Music();
    $todasMusicas = $musicModel->getAllPublic();
} catch (Exception $e) {
    $todasMusicas = [];
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurora Music</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/whatsapp.css">
    <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
</head>
<body>

<header class="header">
    <div class="container">
        <div class="header-left">
            <div class="logo-area">
                <div class="brand-container">
                    <img src="assets/images/logo.png" alt="Aurora Music Logo" class="main-logo">
                    <div class="brand-text">
                        <h2>Aurora Music</h2>
                    </div>
                </div>
                <div class="container-inline">
                    <h2>
                        Mas Deus escolheu as coisas loucas deste mundo para confundir as sábias.
                        <span>1Co 1:27</span>
                    </h2>
                </div>
            </div>
        </div>
        
        <button class="menu-toggle" aria-label="Menu de navegação">
            <i class="bx bx-menu"></i>
        </button>

        <nav class="nav">
            <a href="#home">Início</a>
            <a href="#music">Músicas</a>
            <a href="#about">Sobre</a>
            <a href="#precos">Preços</a>
            <a href="#" id="loginTrigger">Login</a>
            <a href="#contact">Contato</a>
        </nav>
    </div>
</header>

<section class="hero" id="home">
    <div class="container">
        <div class="hero-content">
            <h2>Bem-vindo ao seu universo musical</h2>
            <p>Explore nossa biblioteca e deixe a música tocar sua alma</p>
            <a href="#music" id="btnScrollToMusic" class="btn-primary btn-ouvir-agora">Ouvir Agora</a>
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
                    <div class="progress-bar">
                        <div id="progress" class="progress"></div>
                    </div>
                    <span id="duration" class="time">0:00</span>
                </div>

                <div class="controls">
                    <button id="shuffleBtn" class="control-btn" title="Aleatório">
                        <i class="bx bx-shuffle"></i>
                    </button>
                    <button id="prevBtn" class="control-btn" title="Anterior">
                        <i class="bx bx-skip-previous"></i>
                    </button>
                    <button id="playBtn" class="control-btn play-btn" title="Play/Pause">
                        <i class="bx bx-play"></i>
                    </button>
                    <button id="nextBtn" class="control-btn" title="Próxima">
                        <i class="bx bx-skip-next"></i>
                    </button>
                    <button id="repeatBtn" class="control-btn" title="Repetir">
                        <i class="bx bx-repeat"></i>
                    </button>
                </div>

                <div class="volume-control">
                    <i class="bx bx-volume-full"></i>
                    <input type="range" id="volumeSlider" min="0" max="100" value="70">
                </div>
            </div>

            <h2 class="section-title-playlist">Minha Biblioteca</h2>

            <div class="search-container">
                <i class='bx bx-search search-icon'></i>
                <input type="text" id="searchInput" placeholder="Buscar música ou artista...">
            </div>

            <ul class="playlist" id="playlistContainer">
                <?php 
                $temMusica = false;
                if (!empty($todasMusicas)): 
                    foreach ($todasMusicas as $musica): 
                        $arquivo = basename($musica['caminho_arquivo']);
                        $caminhoCompleto = __DIR__ . '/music/' . $arquivo;
                        
                        if (file_exists($caminhoCompleto)): 
                            $temMusica = true;
                ?>
                            <li class="playlist-item" 
                                data-src="music/<?= htmlspecialchars($arquivo) ?>" 
                                data-display="<?= htmlspecialchars($musica['nome_exibicao']) ?>">
                                <div class="item-icon">
                                    <i class="bx bx-play-circle"></i>
                                </div>
                                <div class="item-text">
                                    <span><?= htmlspecialchars($musica['nome_exibicao']) ?></span>
                                </div>
                            </li>
                <?php 
                        endif;
                    endforeach; 
                endif;
                
                if (!$temMusica): 
                ?>
                    <li class="no-music-item">
                        <i class="bx bx-music"></i>
                        Nenhuma música disponível.
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
                    <div class="about-icon">
                        <i class="bx bx-music"></i>
                    </div>
                    <h3>Nossa Missão</h3>
                    <p>Proporcionar uma experiência musical única e acessível, conectando pessoas através da música e inspirando corações com mensagens de fé.</p>
                </div>
                <div class="about-card">
                    <div class="about-icon">
                        <i class="bx bx-heart"></i>
                    </div>
                    <h3>Nossos Valores</h3>
                    <p>Guiados pela fé e compromisso com a excelência, oferecemos uma plataforma que celebra a diversidade musical e cultural.</p>
                </div>
                <div class="about-card">
                    <div class="about-icon">
                        <i class="bx bx-trophy"></i>
                    </div>
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
                    <i class="bx bx-music"></i>
                    <h3>Gratuito</h3>
                    <div class="price">
                        <span class="currency">R$</span><span class="amount">0</span><span class="period">/mês</span>
                    </div>
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
                    <i class="bx bx-crown"></i>
                    <h3>Premium</h3>
                    <div class="price">
                        <span class="currency">R$</span><span class="amount">19,90</span><span class="period">/mês</span>
                    </div>
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
                    <i class="bx bx-group"></i>
                    <h3>Família</h3>
                    <div class="price">
                        <span class="currency">R$</span><span class="amount">29,90</span><span class="period">/mês</span>
                    </div>
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

<footer class="footer" id="contact">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <div class="footer-logo">
                    <img src="assets/images/logo.png" alt="Aurora Music Logo">
                    <h3>Aurora Music</h3>
                </div>
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
                </ul>
            </div>

            <div class="footer-section">
                <h4>Contato</h4>
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

<!-- BOTÃO FLUTUANTE WHATSAPP -->
<a href="https://wa.me/5521999999999?text=Olá!%20Vim%20do%20site%20Aurora%20Music%20e%20gostaria%20de%20mais%20informações." 
   class="whatsapp-float" 
   target="_blank" 
   rel="noopener noreferrer"
   aria-label="Fale conosco no WhatsApp">
    <span class="whatsapp-icon">
        <i class="bx bxl-whatsapp"></i>
    </span>
</a>

<?php include __DIR__ . '/views/login.php'; ?>

<script src="assets/js/script.js"></script>
<script src="assets/js/login.js"></script>

</body>
</html>