<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['status' => 'error', 'message' => 'Não autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['filename'])) {
    $file = basename($_POST['filename']);
    $path = __DIR__ . '/../promo/' . $file;

    // Bloqueio de segurança para o arquivo principal
    if ($file === 'promo.mp3') {
        echo json_encode(['status' => 'error', 'message' => 'O arquivo principal (promo.mp3) não pode ser deletado.']);
        exit;
    }

    if (file_exists($path)) {
        if (unlink($path)) {
            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Falha ao deletar arquivo no servidor.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Arquivo não encontrado.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Requisição inválida.']);
}