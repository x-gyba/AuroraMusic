<?php
/**
 * PromoController.php - Infogyba 2026
 * Retorna a lista de arquivos de áudio na pasta promo/
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$action = $_GET['action'] ?? '';

if ($action !== 'list') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Ação inválida']);
    exit;
}

$promoDir = dirname(__DIR__) . '/promo/';
$baseUrl  = 'promo/'; 

$allowed  = ['mp3', 'ogg', 'wav', 'm4a'];
$files    = [];

if (is_dir($promoDir)) {
    $dirFiles = scandir($promoDir);
    foreach ($dirFiles as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        if (in_array(strtolower($ext), $allowed)) {
            $files[] = $baseUrl . $file;
        }
    }
}

if (empty($files)) {
    if (file_exists($promoDir . 'promo.mp3')) {
        $files = ['promo/promo.mp3'];
    }
}

echo json_encode(array_values($files));
exit;