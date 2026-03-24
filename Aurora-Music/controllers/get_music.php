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
    $musicModel = new \Models\Music();
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

        // Ajusta caminho web da imagem/cover (se existir)
        if (isset($m['caminho_imagem']) && !empty($m['caminho_imagem'])) {
            $m['cover_web'] = '../' . $m['caminho_imagem'];
        } else {
            $m['cover_web'] = null;
        }

        // Verifica se o arquivo físico ainda existe; se não existir, remove registro do DB
        $possiblePath = __DIR__ . '/../' . ltrim($m['caminho_arquivo'] ?? '', './');
        if (empty($m['caminho_arquivo']) || !file_exists($possiblePath)) {
            // remove do banco para evitar registros órfãos
            if (isset($m['id'])) {
                try {
                    $musicModel->delete((int)$m['id'], $userId);
                } catch (Exception $e) {
                    error_log('Erro ao remover registro órfão: ' . $e->getMessage());
                }
            }
            continue; // pula para próxima música
        }

        // ============================================
        // CORREÇÃO: Garante nome de exibição correto
        // Prioridade: nome_exibicao > nome_arquivo (sem ext) > basename
        // ============================================
        $nomeExibicao = isset($m['nome_exibicao']) ? trim($m['nome_exibicao']) : '';
        $nomeArquivo = isset($m['nome_arquivo']) ? trim($m['nome_arquivo']) : '';
        
            if (!empty($nomeExibicao)) {
                // Se houver um nome de exibição definido pelo usuário, usa ele (mantendo extensão)
                $m['display_name'] = $nomeExibicao;
            } elseif (!empty($nomeArquivo)) {
                // Mostra o nome original do arquivo conforme enviado (com extensão)
                $m['display_name'] = $nomeArquivo;
            } else {
                // Fallback: mostra o basename do caminho armazenado (pode ser o nome criptografado)
                $m['display_name'] = basename($m['caminho_arquivo']);
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