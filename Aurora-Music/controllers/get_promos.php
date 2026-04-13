<?php
header('Content-Type: application/json');

// Caminho da pasta de promoções
$dir = '../promo/';
$promos = [];

if (is_dir($dir)) {
    // Escaneia a pasta ignorando os pontos (.) e (..)
    $files = array_diff(scandir($dir), array('.', '..'));

    foreach ($files as $file) {
        // Filtra apenas arquivos MP3
        if (pathinfo($file, PATHINFO_EXTENSION) === 'mp3') {
            // Retorna o caminho relativo que o index.php (onde o player roda) entende
            $promos[] = 'promo/' . $file;
        }
    }
}

// Retorna a lista como JSON
echo json_encode($promos);