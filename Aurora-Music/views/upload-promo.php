<?php
session_start();
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header("Location: /Aurora-Music/");
    exit;
}

$mensagem = '';
$erro     = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $promoDir = __DIR__ . '/../promo/';

    if (!isset($_FILES['arquivo_promo']) || $_FILES['arquivo_promo']['error'] !== UPLOAD_ERR_OK) {
        $erro = 'Nenhum arquivo enviado ou erro no upload.';
    } else {
        $file     = $_FILES['arquivo_promo'];
        $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $mimeOk   = in_array($file['type'], ['audio/mpeg', 'audio/mp3', 'audio/x-mpeg']);
        $extOk    = ($ext === 'mp3');

        if (!$extOk || !$mimeOk) {
            $erro = 'Apenas arquivos MP3 são permitidos.';
        } elseif ($file['size'] > 20 * 1024 * 1024) {
            $erro = 'Arquivo muito grande. Limite: 20 MB.';
        } else {
            if (!is_dir($promoDir)) {
                mkdir($promoDir, 0755, true);
            }

            // Nome seguro: remove caracteres perigosos
            $nomeSeguro = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', basename($file['name']));
            $destino    = $promoDir . $nomeSeguro;

            if (move_uploaded_file($file['tmp_name'], $destino)) {
                $mensagem = "Arquivo <strong>" . htmlspecialchars($nomeSeguro) . "</strong> enviado com sucesso!";
            } else {
                $erro = 'Falha ao mover o arquivo para o servidor. Verifique as permissões da pasta promo/.';
            }
        }
    }

    // Resposta JSON para chamadas AJAX
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        header('Content-Type: application/json');
        if ($erro) {
            echo json_encode(['status' => 'error', 'message' => $erro]);
        } else {
            echo json_encode(['status' => 'success', 'message' => strip_tags($mensagem)]);
        }
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Upload de Promo - Aurora Music</title>
<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
<link rel="stylesheet" href="/Aurora-Music/assets/css/dashboard.css">
<style>
    body { display:flex; align-items:center; justify-content:center; min-height:100vh; background:var(--bg, #f1f5f9); }
    .upload-card { background:#fff; border-radius:16px; padding:2rem; max-width:440px; width:100%; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .upload-card h2 { margin:0 0 1.5rem; font-size:1.2rem; color:#1e293b; display:flex; align-items:center; gap:.5rem; }
    .msg-ok  { background:#dcfce7; color:#166534; padding:.75rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:.9rem; }
    .msg-err { background:#fee2e2; color:#991b1b; padding:.75rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:.9rem; }
    .form-control { width:100%; padding:.6rem .75rem; border:1px solid #e2e8f0; border-radius:8px; font-size:.9rem; box-sizing:border-box; margin-bottom:1rem; }
    .btn-primary { background:#3b82f6; color:#fff; border:none; padding:.65rem 1.4rem; border-radius:8px; cursor:pointer; font-size:.9rem; display:inline-flex; align-items:center; gap:.4rem; }
    .btn-primary:hover { background:#2563eb; }
    .btn-back { background:transparent; color:#64748b; border:1px solid #e2e8f0; padding:.6rem 1.2rem; border-radius:8px; cursor:pointer; font-size:.85rem; text-decoration:none; display:inline-flex; align-items:center; gap:.4rem; margin-right:.75rem; }
    .btn-back:hover { background:#f8fafc; }
</style>
</head>
<body>
<div class="upload-card">
    <h2><i class="bx bx-bullhorn"></i> Enviar Propaganda (MP3)</h2>

    <?php if ($mensagem): ?>
        <div class="msg-ok"><?= $mensagem ?></div>
    <?php endif; ?>
    <?php if ($erro): ?>
        <div class="msg-err"><?= htmlspecialchars($erro) ?></div>
    <?php endif; ?>

    <form method="POST" enctype="multipart/form-data" action="/Aurora-Music/upload-promo">
        <input type="file" name="arquivo_promo" accept=".mp3,audio/mpeg" class="form-control" required>
        <div>
            <a href="/Aurora-Music/dashboard" class="btn-back"><i class="bx bx-arrow-back"></i> Voltar</a>
            <button type="submit" class="btn-primary"><i class="bx bx-upload"></i> Enviar</button>
        </div>
    </form>
</div>
</body>
</html>
