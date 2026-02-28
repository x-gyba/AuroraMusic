<?php
/**
 * delete_music.php
 * Controlador para deletar músicas - Infogyba 2026
 */

// CRÍTICO: session_start() ANTES de header()
session_start();

// Headers DEPOIS de session_start()
header('Content-Type: application/json; charset=utf-8');

// ============================================
// VERIFICAÇÃO DE AUTENTICAÇÃO
// ============================================
if (!isset($_SESSION['id']) || !isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuário não autenticado.'
    ]);
    exit;
}

// Verifica método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método não permitido.'
    ]);
    exit;
}

// Carrega dependências
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Music.php';

try {
    // Lê o corpo da requisição JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id']) || empty($input['id'])) {
        throw new Exception('ID da música não informado.');
    }
    
    $musicId = intval($input['id']);
    $userId = $_SESSION['id'];
    
    $musicModel = new \Models\Music();
    
    // Deleta a música (incluindo arquivos físicos)
    if ($musicModel->delete($musicId, $userId)) {
        echo json_encode([
            'success' => true,
            'message' => 'Música excluída com sucesso!'
        ]);
    } else {
        throw new Exception('Erro ao excluir música. Verifique se você tem permissão.');
    }
    
} catch (Exception $e) {
    error_log("Erro ao deletar música: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>