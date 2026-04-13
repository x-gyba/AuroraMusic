<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Verificação de login
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Não autorizado'
    ]);
    exit;
}

// Só aceita POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método não permitido'
    ]);
    exit;
}

// Verifica se veio filename
if (!isset($_POST['filename']) || empty($_POST['filename'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Arquivo não informado'
    ]);
    exit;
}

// Sanitização
$file = basename($_POST['filename']);
$file = str_replace(['..', '/', '\\'], '', $file);

// Caminho absoluto
$promoDir = realpath(__DIR__ . '/../promo/');
$filePath = realpath($promoDir . DIRECTORY_SEPARATOR . $file);

// Garante que está dentro da pasta promo
if (!$filePath || strpos($filePath, $promoDir) !== 0) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Acesso inválido ao arquivo'
    ]);
    exit;
}

// Bloqueio do arquivo principal
if ($file === 'promo.mp3') {
    echo json_encode([
        'status' => 'error',
        'message' => 'O arquivo principal (promo.mp3) não pode ser deletado.'
    ]);
    exit;
}

// Só permite mp3
if (strtolower(pathinfo($file, PATHINFO_EXTENSION)) !== 'mp3') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Tipo de arquivo não permitido'
    ]);
    exit;
}

// Arquivo não existe
if (!file_exists($filePath)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Arquivo não encontrado'
    ]);
    exit;
}

// Permissão
if (!is_writable($filePath)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Sem permissão para deletar'
    ]);
    exit;
}

// Deletar
if (unlink($filePath)) {
    echo json_encode([
        'status' => 'success',
        'file' => $file
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Falha ao deletar arquivo no servidor'
    ]);
}