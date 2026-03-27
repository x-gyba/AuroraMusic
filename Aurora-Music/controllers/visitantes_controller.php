<?php
session_start();
header('Content-Type: application/json');

// Verificação de Autenticação
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

// 1. Importa o Model
require_once __DIR__ . '/../models/Visitantes.php';

// 2. Namespace
use Models\Visitantes;

try {
    $visitantes = new Visitantes(); 

    // Captura a ação independente se for GET ou POST
    $action = $_GET['action'] ?? '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
        $action = $_POST['action'];
    }

    switch ($action) {
        case 'listar':
            listarVisitantes($visitantes);
            break;
        case 'grafico':
            gerarGrafico($visitantes);
            break;
        case 'excluir':
            excluirRegistro($visitantes);
            break;
        case 'excluir_todos': // <-- Adicionado para corrigir o erro "Ação Inválida"
            limparTodosRegistros($visitantes);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Ação inválida: ' . $action]);
            break;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno: ' . $e->getMessage()]);
}

// --- FUNÇÕES AUXILIARES ---

function listarVisitantes($visitantes) {
    $dataInicio = $_GET['dataInicio'] ?? null;
    $dataFim = $_GET['dataFim'] ?? null;
    $limit = (int)($_GET['limit'] ?? 20);
    $offset = (int)($_GET['offset'] ?? 0);
    
    $dados = $visitantes->filtrar($dataInicio, $dataFim, $limit, $offset);
    $total = $visitantes->totalFiltrado($dataInicio, $dataFim);
    
    echo json_encode([
        'success' => true, 
        'dados' => $dados, 
        'total' => $total
    ]);
}

function gerarGrafico($visitantes) {
    $inicio = $_GET['inicio'] ?? date('Y-m-d', strtotime('-30 days'));
    $fim = $_GET['fim'] ?? date('Y-m-d');
    $dados = $visitantes->graficoPorData($inicio, $fim);
    echo json_encode(['success' => true, 'dados' => $dados]);
}

function excluirRegistro($visitantes) {
    $id = (int)($_POST['id'] ?? 0);
    if ($id > 0 && $visitantes->excluir($id)) {
        echo json_encode(['success' => true, 'message' => 'Registro excluído com sucesso.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao excluir o registro.']);
    }
}

/**
 * Nova função para limpar a tabela inteira
 */
function limparTodosRegistros($visitantes) {
    // Nota: O método limparTodos() deve estar definido na sua classe Models\Visitantes
    if ($visitantes->limparTodos()) {
        echo json_encode(['success' => true, 'message' => 'Todos os registros foram removidos.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao tentar limpar os registros.']);
    }
}