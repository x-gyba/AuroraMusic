<?php
session_start();
header('Content-Type: application/json');

// Verifica se está logado
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit; // Termina imediatamente
}

// ATENÇÃO: Verifique o caminho para a sua classe Visitantes
require_once __DIR__ . '/../models/Visitantes.php';

$visitantes = new Visitantes();
$action = $_GET['action'] ?? '';

// Captura a ação, priorizando POST para o caso de exclusão
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
}


try {
    switch ($action) {
        case 'listar':
            listarVisitantes($visitantes);
            break;
            
        case 'grafico':
            gerarGrafico($visitantes);
            break;

        case 'excluir':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                echo json_encode(['success' => false, 'message' => 'Método não permitido. Use POST para excluir.']);
                exit; // Termina se o método for incorreto
            }
            excluirRegistro($visitantes);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Ação inválida']);
            exit; // Termina se a ação for inválida
    }
} catch (Exception $e) {
    // Retorna erro se houver falha de conexão ou no Model
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor: ' . $e->getMessage()]);
    exit; // Termina em caso de exceção
}

// ----------------------------------------------------------------------
// FUNÇÕES DE MANIPULAÇÃO
// ----------------------------------------------------------------------

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
    exit; // Termina após a resposta
}

function gerarGrafico($visitantes) {
    $inicio = $_GET['inicio'] ?? null;
    $fim = $_GET['fim'] ?? null;
    
    // Se não fornecido, últimos 30 dias
    if (!$inicio || !$fim) {
        $fim = date('Y-m-d');
        $inicio = date('Y-m-d', strtotime('-30 days'));
    }
    
    $dados = $visitantes->graficoPorData($inicio, $fim);
    
    echo json_encode([
        'success' => true,
        'dados' => $dados
    ]);
    exit; // Termina após a resposta
}

/**
 * @param Visitantes $visitantes 
 * Trata a requisição de exclusão do registro de acesso
 */
function excluirRegistro($visitantes) {
    $id = $_POST['id'] ?? null;
    
    if (!$id || !is_numeric($id)) {
        echo json_encode(['success' => false, 'message' => 'ID de registro inválido.']);
        exit; // Termina se o ID for inválido
    }
    
    try {
        $resultado = $visitantes->excluir($id);
        
        if ($resultado) {
            echo json_encode(['success' => true, 'message' => 'Registro excluído com sucesso.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Falha na exclusão. Registro não encontrado.']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erro ao executar exclusão no banco: ' . $e->getMessage()]);
    }
    exit; // Termina após a resposta (sucesso ou falha)
}

// Fim do arquivo PHP