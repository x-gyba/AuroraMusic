<?php
session_start();

// Impede cache — força reload ao clicar no botão Voltar
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");

require_once __DIR__ . '/../models/Visitantes.php';
require_once __DIR__ . '/../models/Music.php';

try {
    $visitantesTracker = new \Models\Visitantes();
    $paginaAtual = basename($_SERVER['PHP_SELF'], '.php');
    $visitantesTracker->registrarVisita($paginaAtual);
    $visitantesTracker = null;
} catch (Exception $e) {
    error_log("Erro ao registrar visita: " . $e->getMessage());
}

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header("Location: /Aurora-Music/");
    exit;
}

$nomeUsuario  = $_SESSION['nome']  ?? $_SESSION['usuario'] ?? 'Usuário';
$emailUsuario = $_SESSION['email'] ?? '';
$idUsuario    = $_SESSION['id']    ?? 0;
$loginTime    = $_SESSION['login_time'] ?? time();
$dataLogin    = date('d/m/Y H:i', $loginTime);

$musicsCount  = 0;
$musicsUsedMb = 0;
try {
    $musicModel   = new \Models\Music();
    $stats        = $musicModel->getUserStats($idUsuario);
    $musicsCount  = isset($stats['total_musicas']) ? (int)$stats['total_musicas'] : 0;
    $musicsUsedMb = isset($stats['espaco_usado'])  ? round($stats['espaco_usado'] / (1024*1024), 2) : 0;
} catch (Exception $e) {
    error_log("Erro ao carregar estatísticas de músicas: " . $e->getMessage());
}

$visitantesHoje  = 0;
$visitantesMes   = 0;
$visitantesTotal = 0;
try {
    $visitantesModel = new \Models\Visitantes();
    $visitantesHoje  = $visitantesModel->countHoje();
    $visitantesMes   = $visitantesModel->countMes();
    $visitantesTotal = $visitantesModel->countTotal();
} catch (Exception $e) {
    error_log("Erro ao carregar estatísticas de visitantes: " . $e->getMessage());
}

$promosCount = 0;
$promoDir = __DIR__ . '/../promo/';
if (is_dir($promoDir)) {
    $filesPromo = array_diff(scandir($promoDir), array('.', '..'));
    foreach ($filesPromo as $f) {
        if (pathinfo($f, PATHINFO_EXTENSION) === 'mp3') $promosCount++;
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Infogyba 2026</title>
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/Aurora-Music/assets/css/dashboard.css">

    <style>
        #sidebarOverlay {
            display: none;
            position: fixed;
            inset: 0;
            background: transparent;
            z-index: 999;
        }
        #sidebarOverlay.active { display: block; }

        @media (max-width: 768px) {
            .welcome-card  { padding: 1rem 1.25rem; margin-bottom: 0.75rem; }
            .cards-grid    { gap: 0.75rem; margin-top: 0.75rem; }
            .stat-card     { padding: 0.85rem 1rem; }
        }

        /* ── Visitantes ── */
        .visitantes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .visitantes-loading {
            grid-column: 1 / -1;
            text-align: center;
            color: #94a3b8;
            padding: 2rem 0;
            font-size: 0.9rem;
            margin: 0;
        }

        .visitor-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 1rem 1.1rem 0.85rem;
            display: flex;
            flex-direction: column;
            gap: 0.55rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: box-shadow 0.2s, transform 0.2s;
        }

        .visitor-card:hover {
            box-shadow: 0 6px 20px rgba(0,0,0,0.10);
            transform: translateY(-2px);
        }

        .visitor-card-row {
            display: flex;
            align-items: flex-start;
            gap: 0.65rem;
        }

        .visitor-card-icon-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            border-radius: 7px;
            background: #f1f5f9;
            flex-shrink: 0;
        }

        .visitor-card-icon-wrap i {
            font-size: 1.05rem;
            color: #3b82f6;
        }

        .visitor-card-text {
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        .visitor-card-label {
            font-size: 0.7rem;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            line-height: 1.2;
        }

        .visitor-card-value {
            font-size: 0.88rem;
            font-weight: 500;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
        }

        .visitor-card-footer {
            display: flex;
            justify-content: center;
            padding-top: 0.65rem;
            margin-top: 0.2rem;
            border-top: 1px solid #f1f5f9;
        }

        .visitor-btn-delete {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.4rem 1.4rem;
            background: transparent;
            color: #ef4444;
            border: 1.5px solid #ef4444;
            border-radius: 8px;
            font-size: 1.25rem;
            cursor: pointer;
            transition: background 0.2s, color 0.2s, transform 0.15s, box-shadow 0.15s;
        }

        .visitor-btn-delete:hover {
            background: #ef4444;
            color: #ffffff;
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(239, 68, 68, 0.3);
        }

        .btn-limpar-todos {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.45rem 1rem;
            background: transparent;
            color: #ef4444;
            border: 1.5px solid #ef4444;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            transition: background 0.2s, color 0.2s, transform 0.15s, box-shadow 0.15s;
            white-space: nowrap;
        }

        .btn-limpar-todos i { font-size: 1.1rem; }

        .btn-limpar-todos:hover {
            background: #ef4444;
            color: #ffffff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 480px) {
            .visitantes-grid    { grid-template-columns: 1fr; }
            .visitor-card-value { max-width: 180px; }
        }
    </style>
</head>
<body>
    <div id="sidebarOverlay"></div>

    <div class="dashboard-container" id="dashboardContainer">

        <aside class="sidebar">
            <div class="sidebar-header">
                <h2><i class="fas fa-music"></i> Infogyba</h2>
                <p>Sistema de Gerenciamento</p>
            </div>

            <nav>
                <ul class="nav-menu">
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link active" data-section="home">
                            <i class="fas fa-home"></i> <span>Início</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="clientes">
                            <i class="fas fa-users"></i> <span>Cadastro de Clientes</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/Aurora-Music/upload" class="nav-link">
                            <i class="fas fa-compact-disc"></i> <span>Cadastro de Músicas</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="publicidade">
                            <i class="fas fa-bullhorn"></i> <span>Publicidade</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="pagamentos">
                            <i class="fas fa-dollar-sign"></i> <span>Pagamentos</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="visitantes">
                            <i class="fas fa-chart-line"></i> <span>Estatísticas de Visitantes</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="orfaos">
                            <i class="fas fa-broom"></i> <span>Limpar Arquivos Órfãos</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="login-info">
                            <i class="fas fa-info-circle"></i> <span>Informações de Login</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/Aurora-Music/logout" class="nav-link danger">
                            <i class="fas fa-sign-out-alt"></i> <span>Sair</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>

        <header class="header">
            <button class="menu-toggle" id="menuToggle">
                <i class="fas fa-bars"></i> <span>Menu</span>
            </button>
            <div class="user-info">
                <div class="user-avatar"><?php echo strtoupper(substr($nomeUsuario, 0, 1)); ?></div>
                <div class="user-details">
                    <h3><?php echo htmlspecialchars($nomeUsuario); ?></h3>
                    <p><?php echo htmlspecialchars($emailUsuario); ?></p>
                </div>
            </div>
        </header>

        <main class="main-content">

            <!-- ── Home ── -->
            <section class="content-section active" id="home">
                <div class="welcome-card">
                    <h1>Olá, <?php echo htmlspecialchars($nomeUsuario); ?>! 👋</h1>
                    <p>Painel de controle Infogyba Soluções em TI.</p>
                </div>

                <div class="cards-grid">
                    <div class="stat-card">
                        <div class="stat-icon orange"><i class="fas fa-bullhorn"></i></div>
                        <div class="stat-info">
                            <h3>Promoções</h3>
                            <p><?php echo $promosCount; ?></p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon green"><i class="fas fa-music"></i></div>
                        <div class="stat-info">
                            <h3>Músicas</h3>
                            <p><?php echo $musicsCount; ?></p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon blue"><i class="fas fa-eye"></i></div>
                        <div class="stat-info">
                            <h3>Visitas Hoje</h3>
                            <p><?php echo $visitantesHoje; ?></p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon purple"><i class="fas fa-chart-line"></i></div>
                        <div class="stat-info">
                            <h3>Acessos Total</h3>
                            <p><?php echo $visitantesTotal; ?></p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon red"><i class="fas fa-clock"></i></div>
                        <div class="stat-info">
                            <h3>Último Login</h3>
                            <p><?php echo date('d/m/Y', $loginTime); ?></p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── Publicidade ── -->
            <section class="content-section" id="publicidade">
                <div class="content-card">
                    <h2><i class="fas fa-bullhorn"></i> Gestão de Publicidade</h2>
                    <form id="formUploadPromo" enctype="multipart/form-data" style="margin: 20px 0;">
                        <input type="file" name="arquivo_promo" accept=".mp3" class="form-control" required style="margin-bottom:10px;">
                        <button type="submit" id="btnSubirPromo" class="btn btn-primary">
                            <i class="fas fa-upload"></i> Enviar Propaganda
                        </button>
                        <span id="statusUploadPromo" style="margin-left:10px; font-size:.9rem;"></span>
                    </form>
                    <ul id="listaPromos" class="orphan-file-list" style="display:block;">
                        <?php
                        if (is_dir($promoDir)) {
                            $files = array_diff(scandir($promoDir), ['.', '..']);
                            foreach ($files as $file) {
                                if (pathinfo($file, PATHINFO_EXTENSION) === 'mp3') {
                                    $isPromo = ($file === 'promo.mp3');
                                    $style   = $isPromo ? 'background:#fff9db;' : '';
                                    $icon    = $isPromo
                                        ? "fa-star' style='color:#f59e0b"
                                        : 'fa-file-audio';
                                    $btn = !$isPromo
                                        ? "<button class='btn-delete-promo' data-filename='" . htmlspecialchars($file) . "' style='background:none; border:none; color:#ef4444; cursor:pointer;'><i class='bx bx-trash' style='font-size:1.3rem;'></i></button>"
                                        : '';
                                    echo "<li style='display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee; $style'>
                                            <span><i class='fas $icon'></i> " . htmlspecialchars($file) . "</span>
                                            $btn
                                          </li>";
                                }
                            }
                        }
                        ?>
                    </ul>
                </div>
            </section>

            <!-- ── Clientes ── -->
            <section class="content-section" id="clientes">
                <div class="content-card">
                    <h2><i class="fas fa-users"></i> Cadastro de Clientes</h2>
                    <form id="formClientes">
                        <div class="form-group">
                            <label for="nomeCliente">Nome Completo</label>
                            <input type="text" id="nomeCliente" class="form-control" required>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Cadastrar Cliente
                        </button>
                    </form>
                </div>
            </section>

            <!-- ── Visitantes ── -->
            <section class="content-section" id="visitantes">
                <div class="content-card">
                    <h2><i class="fas fa-chart-line"></i> Estatísticas de Visitantes</h2>

                    <div class="cards-grid" style="margin-bottom: 20px;">
                        <div class="stat-card">
                            <div class="stat-info"><h3>Visitas Hoje</h3><p><?php echo $visitantesHoje; ?></p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-info"><h3>Total</h3><p><?php echo $visitantesTotal; ?></p></div>
                        </div>
                    </div>

                    <form id="formFiltroVisitantes" style="margin-bottom: 16px;">
                        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
                            <div>
                                <label style="font-size:0.8rem; color:#64748b; display:block; margin-bottom:4px;">De</label>
                                <input type="date" id="dataInicio" class="form-control" style="width:auto; padding:0.5rem 0.75rem;">
                            </div>
                            <div>
                                <label style="font-size:0.8rem; color:#64748b; display:block; margin-bottom:4px;">Até</label>
                                <input type="date" id="dataFim" class="form-control" style="width:auto; padding:0.5rem 0.75rem;">
                            </div>
                            <button type="submit" class="btn btn-primary" style="padding:0.5rem 1rem;">
                                <i class="fas fa-search"></i> Filtrar
                            </button>
                        </div>
                    </form>

                    <div style="background:#f8f9fa; padding:16px; border-radius:8px; margin-bottom:20px; height:220px;">
                        <canvas id="graficoVisitantes"></canvas>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
                        <h3 style="margin:0; font-size:1rem; color:#1e293b;">Registros</h3>
                        <button id="btnLimparTodosVisitantes" class="btn-limpar-todos">
                            <i class='bx bx-trash-alt'></i> Limpar Todos
                        </button>
                    </div>

                    <div id="visitantesGrid" class="visitantes-grid">
                        <p class="visitantes-loading">Carregando...</p>
                    </div>

                    <div id="paginacaoVisitantes"></div>
                </div>
            </section>

            <!-- ── Órfãos ── -->
            <section class="content-section" id="orfaos">
                <div class="content-card">
                    <h2><i class="fas fa-broom"></i> Limpar Arquivos Órfãos</h2>
                    <div class="orphan-status-card" id="orphanStatusCard">
                        <div class="orphan-status-icon"><i class="fas fa-search"></i></div>
                        <div>
                            <strong>Pronto para verificar</strong>
                            <span>Clique em "Verificar" para escanear arquivos sem registro no banco de dados.</span>
                        </div>
                    </div>
                    <div class="orphan-actions">
                        <button class="btn btn-primary" id="btnVerificarOrfaos">
                            <i class="fas fa-search"></i> Verificar
                        </button>
                        <button class="btn btn-danger" id="btnLimparOrfaos" disabled>
                            <i class="fas fa-trash-alt"></i> Limpar Órfãos
                        </button>
                    </div>
                    <div class="orphan-result" id="orphanResult" style="display:none;">
                        <h3 id="orphanResultTitle"></h3>
                        <div class="orphan-stats" id="orphanStats"></div>
                        <ul class="orphan-file-list" id="orphanFileList"></ul>
                        <ul class="orphan-file-list orphan-error-list" id="orphanErrorList"></ul>
                    </div>
                </div>
            </section>

            <!-- ── Login Info ── -->
            <section class="content-section" id="login-info">
                <div class="content-card">
                    <h2><i class="fas fa-info-circle"></i> Histórico de Logins</h2>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
                        <h3 style="margin:0; font-size:1rem; color:#1e293b;">Registros</h3>
                        <button id="btnLimparTodosLogins" class="btn-limpar-todos">
                            <i class='bx bx-trash-alt'></i> Limpar Todos
                        </button>
                    </div>

                    <div id="loginHistoricoGrid" class="visitantes-grid">
                        <p class="visitantes-loading">Carregando...</p>
                    </div>

                    <div id="paginacaoLoginHistorico"></div>
                </div>
            </section>

        </main>
    </div>

    <script src="/Aurora-Music/assets/js/dashboard.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="/Aurora-Music/assets/js/visitantes.js"></script>
    <script src="/Aurora-Music/assets/js/login_historico.js"></script>
    <script>
        function deletarPromo(file) {
            if (!confirm('Excluir ' + file + '?')) return;
            fetch('/Aurora-Music/delete-promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file })
            })
            .then(r => r.json())
            .then(d => {
                if (d.status === 'success') location.reload();
                else alert(d.message || 'Erro');
            })
            .catch(() => alert('Erro na requisição'));
        }
    </script>
</body>
</html>