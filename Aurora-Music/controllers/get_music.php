<?php
/**
 * get_music.php
 * Controlador para listar músicas - Infogyba 2026
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

// Verificação de autenticação
if (!isset($_SESSION['id']) || !isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuário não autenticado.'
    ]);
    exit;
}

// Carrega dependências
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Music.php';

try {
    $musicModel = new Music();
    $userId = $_SESSION['id'];

    // Busca todas as músicas do usuário
    $musics = $musicModel->getByUser($userId);

    // Processa cada música
    foreach ($musics as &$m) {
        // Ajusta caminho web
        if (isset($m['caminho_arquivo']) && !empty($m['caminho_arquivo'])) {
            if (strpos($m['caminho_arquivo'], '../') === 0 || strpos($m['caminho_arquivo'], '/') === 0) {
                $m['caminho_web'] = '../music/' . basename($m['caminho_arquivo']);
            } else {
                $m['caminho_web'] = '../music/' . basename($m['caminho_arquivo']);
            }
        } else {
            $m['caminho_web'] = '';
        }

        // ============================================
        // CORREÇÃO: Garante nome de exibição correto
        // Prioridade: nome_exibicao > nome_arquivo (sem ext) > basename
        // ============================================
        $nomeExibicao = isset($m['nome_exibicao']) ? trim($m['nome_exibicao']) : '';
        $nomeArquivo = isset($m['nome_arquivo']) ? trim($m['nome_arquivo']) : '';
        
        if (!empty($nomeExibicao)) {
            // Remove extensão se o nome_exibicao tiver .mp3
            $m['display_name'] = preg_replace('/\.mp3$/i', '', $nomeExibicao);
        } elseif (!empty($nomeArquivo)) {
            // Usa nome do arquivo sem extensão
            $m['display_name'] = pathinfo($nomeArquivo, PATHINFO_FILENAME);
        } else {
            // Fallback: basename do caminho sem extensão
            $m['display_name'] = pathinfo(basename($m['caminho_arquivo']), PATHINFO_FILENAME);
        }
        
        // Garante que nome_exibicao também está limpo para o frontend
        $m['nome_exibicao'] = $m['display_name'];
    }
    unset($m); // Libera referência

    // Obtém estatísticas
    $stats = $musicModel->getUserStats($userId);

    echo json_encode([
        'success' => true,
        'musics' => $musics,
        'stats' => [
            'total' => $stats['total_musicas'],
            'espaco_usado' => $stats['espaco_usado'],
            'espaco_usado_mb' => round($stats['espaco_usado'] / (1024 * 1024), 2)
        ]
    ]);

} catch (Exception $e) {
    error_log("Erro ao listar músicas: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao carregar músicas.'
    ]);
}
?>