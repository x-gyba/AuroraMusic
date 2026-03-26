<?php
/**
 * delete_music.php
 * Controlador para deletar músicas e limpar arquivos órfãos - Infogyba 2026
 *
 * Ações disponíveis (campo 'action' no JSON do POST):
 *   delete        — deleta uma música pelo ID (comportamento original)
 *   scan_orphans  — lista arquivos órfãos sem deletar nada (dry-run)
 *   clean_orphans — deleta fisicamente todos os arquivos órfãos
 */

// CRÍTICO: session_start() ANTES de qualquer header()
session_start();
header('Content-Type: application/json; charset=utf-8');

// ── Autenticação ──────────────────────────────────────────────────────────────
if (!isset($_SESSION['id']) || !isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Usuário não autenticado.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Music.php';

try {
    $input      = json_decode(file_get_contents('php://input'), true);
    $action     = $input['action'] ?? 'delete';
    $userId     = $_SESSION['id'];
    $musicModel = new \Models\Music();

    // ── AÇÃO: listar órfãos sem deletar (dry-run) ─────────────────────────────
    if ($action === 'scan_orphans') {
        $result = $musicModel->getOrphanFiles();
        echo json_encode([
            'success'  => true,
            'total'    => $result['total'],
            'mb'       => $result['mb_total'],
            'bytes'    => $result['bytes_total'],
            'arquivos' => array_column($result['arquivos'], 'nome'),
            'message'  => $result['total'] === 0
                ? 'Nenhum arquivo órfão encontrado. Tudo limpo!'
                : $result['total'] . ' arquivo(s) órfão(s) encontrado(s). ' . $result['mb_total'] . ' MB a liberar.',
        ]);
        exit;
    }

    // ── AÇÃO: deletar arquivos órfãos fisicamente ─────────────────────────────
    if ($action === 'clean_orphans') {
        $result = $musicModel->deleteOrphanFiles();
        echo json_encode([
            'success'   => true,
            'total'     => $result['total'],
            'mb'        => $result['mb'],
            'bytes'     => $result['bytes'],
            'deletados' => $result['deletados'],
            'erros'     => $result['erros'],
            'message'   => $result['total'] === 0
                ? 'Nenhum arquivo órfão para remover.'
                : $result['total'] . ' arquivo(s) removido(s). ' . $result['mb'] . ' MB liberados.',
        ]);
        exit;
    }

    // ── AÇÃO: deletar música por ID (padrão) ──────────────────────────────────
    if (!isset($input['id']) || empty($input['id'])) {
        throw new Exception('ID da música não informado.');
    }

    $musicId = intval($input['id']);

    if ($musicModel->delete($musicId, $userId)) {
        echo json_encode(['success' => true, 'message' => 'Música excluída com sucesso!']);
    } else {
        throw new Exception('Erro ao excluir música. Verifique se você tem permissão.');
    }

} catch (Exception $e) {
    error_log("Erro em delete_music.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>