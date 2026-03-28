<?php
session_start();
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

require_once __DIR__ . '/../config/database.php';

use Config\Database;

header('Content-Type: application/json');

$db  = (new Database())->getConnection();
$action = $_REQUEST['action'] ?? '';

switch ($action) {

    case 'listar':
        $limit  = max(1, min(100, (int)($_GET['limit']  ?? 20)));
        $offset = max(0, (int)($_GET['offset'] ?? 0));

        $stmt = $db->prepare(
            "SELECT * FROM login_historico ORDER BY data_login DESC LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $dados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $total = (int)$db->query("SELECT COUNT(*) FROM login_historico")->fetchColumn();

        echo json_encode(['success' => true, 'dados' => $dados, 'total' => $total]);
        break;

    case 'excluir':
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) { echo json_encode(['success' => false, 'message' => 'ID inválido']); break; }
        $stmt = $db->prepare("DELETE FROM login_historico WHERE id = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        echo json_encode(['success' => $stmt->execute()]);
        break;

    case 'excluir_todos':
        try {
            $db->exec("TRUNCATE TABLE login_historico");
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $db->exec("DELETE FROM login_historico");
            echo json_encode(['success' => true]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}