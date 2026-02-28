<?php
/**
 * upload.php
 * Página de Upload de Músicas - Infogyba 2026
 */

// Inicia sessão
session_start();

// Verifica autenticação
if (!isset($_SESSION['id']) || !isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: ../index.php');
    exit;
}

// Dados do usuário
$usuario = $_SESSION['usuario'] ?? 'Usuário';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload de Músicas - Infogyba</title>
    <link rel="stylesheet" href="../assets/css/upload.css"> 
</head>
<body>
    <div class="header">
        <div class="user-info">
            <div class="user-avatar"><?php echo strtoupper(substr($usuario, 0, 1)); ?></div>
            <div>
                <div style="font-size: 12px; color: #999;">Bem-vindo,</div>
                <div class="user-name"><?php echo htmlspecialchars($usuario); ?></div>
            </div>
        </div>
        <a href="logout.php" class="logout-btn">Sair</a>
    </div>

    <div class="container">
        <div class="card">
            <h1>Enviar Nova Música</h1>

            <form id="uploadForm" method="POST" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="musicFile">Selecione o arquivo MP3</label>
                    <input 
                        type="file" 
                        id="musicFile" 
                        name="musicFile" 
                        accept=".mp3,audio/mpeg,audio/mp3"
                        required
                    >
                    <p class="file-info">Tamanho máximo: 50MB</p>
                </div>

                <div class="form-group">
                    <label for="displayName">Nome da Música (opcional)</label>
                    <input 
                        type="text" 
                        id="displayName" 
                        name="displayName" 
                        placeholder="Ex: Minha Música Favorita"
                        maxlength="100"
                    >
                    <p class="file-info">Se deixar vazio, usaremos o nome do arquivo</p>
                </div>

                <div class="form-group">
                    <label for="coverImage">Capa da Música (opcional)</label>
                    <input 
                        type="file" 
                        id="coverImage" 
                        name="coverImage" 
                        accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                    >
                    <p class="file-info">Tamanho máximo: 5MB (JPG, PNG, GIF, WebP)</p>
                </div>

                <div id="progressContainer" class="progress-container">
                    <div class="progress-bar">
                        <div id="uploadProgress" class="progress-fill">0%</div>
                    </div>
                </div>

                <button type="submit" id="submitBtn" class="btn btn-primary">
                    Enviar Música
                </button>

                <div id="messageContainer"></div>
            </form>
        </div>

        <div class="card">
            <h2>Minhas Músicas</h2>
            <div id="musicListContainer">
                <p class="no-music">Carregando músicas...</p>
            </div>
        </div>
    </div>

    <script src="../assets/js/upload.js"></script>
</body>
</html>