<?php
session_start();

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
    header("Location: ../index.php");
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
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Infogyba 2026</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
    <link rel="stylesheet" href="../assets/css/dashboard.css">
</head>
<body>
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
                            <i class="fas fa-home"></i>
                            <span>Início</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="clientes">
                            <i class="fas fa-users"></i>
                            <span>Cadastro de Clientes</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="upload.php" class="nav-link">
                            <i class="fas fa-compact-disc"></i>
                            <span>Cadastro de Músicas</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="pagamentos">
                            <i class="fas fa-dollar-sign"></i>
                            <span>Pagamentos</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="visitantes">
                            <i class="fas fa-chart-line"></i>
                            <span>Estatísticas de Visitantes</span>
                        </a>
                    </li>
                    <!-- NOVO: Limpeza de Órfãos -->
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="orfaos">
                            <i class="fas fa-broom"></i>
                            <span>Limpar Arquivos Órfãos</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="javascript:void(0)" class="nav-link" data-section="login-info">
                            <i class="fas fa-info-circle"></i>
                            <span>Informações de Login</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="logout.php" class="nav-link danger">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Sair</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>

        <header class="header">
            <button class="menu-toggle" id="menuToggle">
                <i class="fas fa-bars"></i>
                <span>Menu</span>
            </button>

            <div class="user-info">
                <div class="user-avatar">
                    <?php echo strtoupper(substr($nomeUsuario, 0, 1)); ?>
                </div>
                <div class="user-details">
                    <h3><?php echo htmlspecialchars($nomeUsuario); ?></h3>
                    <p><?php echo htmlspecialchars($emailUsuario); ?></p>
                </div>
            </div>
        </header>

        <main class="main-content">

            <!-- HOME -->
            <section class="content-section active" id="home">
                <div class="welcome-card">
                    <h1>Olá, <?php echo htmlspecialchars($nomeUsuario); ?>! 👋</h1>
                    <p>Bem-vindo ao seu painel de controle. Gerencie seus clientes, músicas e pagamentos de forma simples e eficiente.</p>
                </div>

                <div class="cards-grid">
                    <div class="stat-card">
                        <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                        <div class="stat-info">
                            <h3>Total de Clientes</h3>
                            <p>0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon green"><i class="fas fa-music"></i></div>
                        <div class="stat-info">
                            <h3>Músicas Cadastradas</h3>
                            <p><?php echo $musicsCount; ?></p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon purple"><i class="fas fa-chart-line"></i></div>
                        <div class="stat-info">
                            <h3>Número de Acessos</h3>
                            <p><?php echo $visitantesTotal; ?></p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon orange"><i class="fas fa-dollar-sign"></i></div>
                        <div class="stat-info">
                            <h3>Pagamentos Pendentes</h3>
                            <p>0</p>
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

            <!-- CLIENTES -->
            <section class="content-section" id="clientes">
                <div class="content-card">
                    <h2><i class="fas fa-users"></i> Cadastro de Clientes</h2>
                    <form id="formClientes">
                        <div class="form-group">
                            <label for="nomeCliente">Nome Completo</label>
                            <input type="text" id="nomeCliente" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="emailCliente">E-mail</label>
                            <input type="email" id="emailCliente" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="telefoneCliente">Telefone</label>
                            <input type="tel" id="telefoneCliente" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="enderecoCliente">Endereço</label>
                            <input type="text" id="enderecoCliente" class="form-control">
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Cadastrar Cliente
                        </button>
                    </form>
                </div>
            </section>

            <!-- PAGAMENTOS -->
            <section class="content-section" id="pagamentos">
                <div class="content-card">
                    <h2><i class="fas fa-dollar-sign"></i> Gerenciamento de Pagamentos</h2>
                    <p>Esta seção será implementada em breve com integração ao sistema de pagamentos.</p>
                    <button class="btn btn-success" onclick="alert('Em desenvolvimento')">
                        <i class="fas fa-plus"></i> Novo Pagamento
                    </button>
                </div>
            </section>

            <!-- VISITANTES -->
            <section class="content-section" id="visitantes">
                <div class="content-card">
                    <h2><i class="fas fa-chart-line"></i> Estatísticas de Visitantes</h2>

                    <div class="cards-grid" style="margin-bottom: 30px;">
                        <div class="stat-card">
                            <div class="stat-icon blue"><i class="fas fa-calendar-day"></i></div>
                            <div class="stat-info">
                                <h3>Visitas Hoje</h3>
                                <p><?php echo $visitantesHoje; ?></p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon green"><i class="fas fa-calendar-alt"></i></div>
                            <div class="stat-info">
                                <h3>Visitas Este Mês</h3>
                                <p><?php echo $visitantesMes; ?></p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon purple"><i class="fas fa-chart-bar"></i></div>
                            <div class="stat-info">
                                <h3>Total de Visitas</h3>
                                <p><?php echo $visitantesTotal; ?></p>
                            </div>
                        </div>
                    </div>

                    <form id="formFiltroVisitantes" style="margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 15px; align-items: end;">
                            <div class="form-group">
                                <label for="dataInicio">Data Início</label>
                                <input type="date" id="dataInicio" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="dataFim">Data Fim</label>
                                <input type="date" id="dataFim" class="form-control">
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-filter"></i> Filtrar
                            </button>
                        </div>
                    </form>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <canvas id="graficoVisitantes" style="max-height: 300px;"></canvas>
                    </div>

                    <div style="overflow-x: auto;">
                        <table class="info-table">
                            <thead>
                                <tr>
                                    <th>Data/Hora</th>
                                    <th>IP</th>
                                    <th>Página</th>
                                    <th>Navegador</th>
                                    <th>Sistema</th>
                                    <th style="text-align: center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabelaVisitantes">
                                <tr>
                                    <td colspan="6" style="text-align: center;">Carregando...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div id="paginacaoVisitantes" style="margin-top: 20px; text-align: center;"></div>
                </div>
            </section>

            <!-- ================================================
                 NOVA SEÇÃO: LIMPAR ARQUIVOS ÓRFÃOS
                 ================================================ -->
            <section class="content-section" id="orfaos">
                <div class="content-card">
                    <h2><i class="fas fa-broom"></i> Limpar Arquivos Órfãos</h2>
                    <p class="orphan-desc">
                        Arquivos órfãos são arquivos físicos que existem na pasta <code>music/</code>
                        mas não possuem registro no banco de dados — geralmente restos de uploads
                        deletados incorretamente. Esta operação os remove permanentemente.
                    </p>

                    <!-- Card de status / prévia -->
                    <div class="orphan-status-card" id="orphanStatusCard">
                        <div class="orphan-status-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <div class="orphan-status-text">
                            <strong>Pronto para varredura</strong>
                            <span>Clique em "Verificar" para escanear os arquivos órfãos antes de remover.</span>
                        </div>
                    </div>

                    <!-- Botões de ação -->
                    <div class="orphan-actions">
                        <button class="btn btn-primary" id="btnVerificarOrfaos">
                            <i class="fas fa-search"></i> Verificar
                        </button>
                        <button class="btn btn-danger" id="btnLimparOrfaos" disabled>
                            <i class="fas fa-trash-alt"></i> Limpar Órfãos
                        </button>
                    </div>

                    <!-- Resultado / log -->
                    <div class="orphan-result" id="orphanResult" style="display:none;">
                        <h3 id="orphanResultTitle"></h3>
                        <div class="orphan-stats" id="orphanStats"></div>
                        <ul class="orphan-file-list" id="orphanFileList"></ul>
                        <ul class="orphan-error-list" id="orphanErrorList"></ul>
                    </div>
                </div>
            </section>

            <!-- LOGIN INFO -->
            <section class="content-section" id="login-info">
                <div class="content-card">
                    <h2><i class="fas fa-info-circle"></i> Informações de Login</h2>
                    <table class="info-table">
                        <thead>
                            <tr>
                                <th>Informação</th>
                                <th>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Usuário</td><td><?php echo htmlspecialchars($nomeUsuario); ?></td></tr>
                            <tr><td>E-mail</td><td><?php echo htmlspecialchars($emailUsuario); ?></td></tr>
                            <tr><td>Data/Hora do Login</td><td><?php echo $dataLogin; ?></td></tr>
                            <tr><td>ID do Usuário</td><td>#<?php echo $idUsuario; ?></td></tr>
                            <tr><td>Status da Sessão</td><td><span style="color: #10b981; font-weight: bold;">✓ Ativa</span></td></tr>
                        </tbody>
                    </table>
                </div>
            </section>

        </main>
    </div>

    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <script src="../assets/js/dashboard.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="../assets/js/visitantes.js"></script>

</body>
</html>