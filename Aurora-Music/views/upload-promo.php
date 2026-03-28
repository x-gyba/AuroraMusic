<?php
session_start();

// Proteção de acesso - Infogyba Soluções em TI
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header("Location: ../index.php");
    exit;
}

$mensagem = "";
$tipo = "";

// Processa o Upload
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['arquivo_promo'])) {
    $diretorioPromo = __DIR__ . '/../promo/';
    
    // Cria a pasta se não existir (O SELinux exige contexto correto aqui)
    if (!is_dir($diretorioPromo)) {
        mkdir($diretorioPromo, 0755, true);
    }

    $arquivo = $_FILES['arquivo_promo'];
    $nomeOriginal = basename($arquivo['name']);
    $extensao = strtolower(pathinfo($nomeOriginal, PATHINFO_EXTENSION));
    
    // Validação rigorosa: apenas MP3
    if ($extensao !== 'mp3') {
        $mensagem = "Erro: Apenas arquivos MP3 são permitidos para publicidade.";
        $tipo = "danger";
    } elseif ($arquivo['error'] !== UPLOAD_ERR_OK) {
        $mensagem = "Erro no envio do arquivo (Código: " . $arquivo['error'] . ")";
        $tipo = "danger";
    } else {
        // Move o arquivo
        if (move_uploaded_file($arquivo['tmp_name'], $diretorioPromo . $nomeOriginal)) {
            // REDIRECIONAMENTO AUTOMÁTICO COM PARÂMETRO DE SEÇÃO
            header("Location: dashboard.php?section=publicidade&upload=success&file=" . urlencode($nomeOriginal));
            exit;
        } else {
            $mensagem = "Erro ao mover o arquivo. Verifique as permissões do SELinux no Fedora.";
            $tipo = "danger";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload de Publicidade - Infogyba</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/dashboard.css">
    <style>
        .upload-promo-container { max-width: 500px; margin: 80px auto; padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .alert { padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 14px; }
        .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #34d399; }
        .alert-danger { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
        .btn-back { background: #6b7280; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; display: inline-block; font-size: 14px; transition: 0.3s; }
        .btn-back:hover { background: #4b5563; }
    </style>
</head>
<body style="background: #f3f4f6;">

    <div class="upload-promo-container">
        <div style="margin-bottom: 20px;">
            <a href="dashboard.php?section=publicidade" class="btn-back">
                <i class="fas fa-chevron-left"></i> Voltar para Publicidade
            </a>
        </div>

        <h2 style="margin-bottom: 10px;"><i class="fas fa-bullhorn"></i> Upload de Áudio</h2>
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 25px;">
            Envie arquivos MP3 para a pasta <code>/promo</code>. 
            <br>Dica: O arquivo <b>promo.mp3</b> sempre será o primeiro da lista.
        </p>

        <?php if ($mensagem): ?>
            <div class="alert alert-<?php echo $tipo; ?>">
                <?php echo $mensagem; ?>
            </div>
        <?php endif; ?>

        <form action="upload-promo.php" method="POST" enctype="multipart/form-data">
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">Selecionar MP3:</label>
                <input type="file" name="arquivo_promo" accept=".mp3" class="form-control" required style="padding: 10px; width: 100%; border: 1px solid #d1d5db; border-radius: 5px;">
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; height: 45px; font-size: 16px; background: #2563eb; border: none; color: white; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-upload"></i> Enviar Agora
            </button>
        </form>
    </div>

</body>
</html>