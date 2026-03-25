<?php
/**
 * AuthController.php
 * Controlador de Autenticação - Aurora Music 2026
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';
use Config\Database;

/**
 * Registra tentativa de login
 */
function registrarTentativa($conn, $usuario, $ip, $success) {
    try {
        $stmt = $conn->prepare("
            INSERT INTO tentativas_login (usuario, ip_address, success, attempted_at) 
            VALUES (:usuario, :ip, :success, NOW())
        ");
        $stmt->execute([
            ':usuario' => $usuario,
            ':ip'      => $ip,
            ':success' => $success ? 1 : 0
        ]);
    } catch (\Exception $e) {
        error_log("Erro ao registrar tentativa: " . $e->getMessage());
    }
}

/**
 * Verifica bloqueio por excesso de tentativas (5 em 15 min)
 */
function verificarBloqueio($conn, $usuario) {
    try {
        $stmt = $conn->prepare("
            SELECT COUNT(*) as tentativas 
            FROM tentativas_login 
            WHERE usuario = :usuario 
            AND success = 0 
            AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        ");
        $stmt->execute([':usuario' => $usuario]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return ($result['tentativas'] >= 5);
    } catch (\Exception $e) {
        return false;
    }
}

// ══════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_GET['auth_action'] ?? '') === 'login') {

    $usuario = trim($_POST['usuario'] ?? '');
    $senha   = $_POST['senha'] ?? '';
    $ip      = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

    if (empty($usuario) || empty($senha)) {
        echo json_encode(['success' => false, 'message' => 'Usuário e senha são obrigatórios.']);
        exit;
    }

    try {
        $db   = new Database();
        $conn = $db->getConnection();

        // Verifica bloqueio
        if (verificarBloqueio($conn, $usuario)) {
            registrarTentativa($conn, $usuario, $ip, false);
            echo json_encode(['success' => false, 'message' => 'Conta bloqueada temporariamente. Aguarde 15 minutos.']);
            exit;
        }

        // ── Busca por EMAIL ou NOME ──
        // A tabela `usuarios` tem: id, nome, email, senha, ativo, ultimo_acesso
        $stmt = $conn->prepare("
            SELECT id, nome, email, senha, ativo
            FROM usuarios
            WHERE (email = :usuario OR nome = :usuario2)
            AND ativo = 1
            LIMIT 1
        ");
        $stmt->execute([
            ':usuario'  => $usuario,
            ':usuario2' => $usuario
        ]);
        $user = $stmt->fetch(\PDO::FETCH_OBJ);

        // Usuário não encontrado
        if (!$user) {
            registrarTentativa($conn, $usuario, $ip, false);
            echo json_encode(['success' => false, 'message' => 'Usuário ou senha incorretos.']);
            exit;
        }

        // Conta inativa
        if ((int)$user->ativo !== 1) {
            registrarTentativa($conn, $usuario, $ip, false);
            echo json_encode(['success' => false, 'message' => 'Conta desativada. Contate o administrador.']);
            exit;
        }

        // Senha incorreta
        if (!password_verify($senha, $user->senha)) {
            registrarTentativa($conn, $usuario, $ip, false);
            echo json_encode(['success' => false, 'message' => 'Usuário ou senha incorretos.']);
            exit;
        }

        // ── Login bem-sucedido ──
        registrarTentativa($conn, $usuario, $ip, true);

        // Atualiza ultimo_acesso (campo correto da tabela)
        $upd = $conn->prepare("UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = :id");
        $upd->execute([':id' => $user->id]);

        // Configura sessão
        session_regenerate_id(true);
        $_SESSION['logged_in']  = true;
        $_SESSION['id']         = $user->id;
        $_SESSION['nome']       = $user->nome;
        $_SESSION['email']      = $user->email;
        $_SESSION['login_time'] = time();

        echo json_encode([
            'success'  => true,
            'message'  => 'Login realizado com sucesso!',
            'redirect' => 'views/dashboard.php',
            'user'     => [
                'id'    => $user->id,
                'nome'  => $user->nome,
                'email' => $user->email
            ]
        ]);
        exit;

    } catch (\Exception $e) {
        error_log("Erro no AuthController: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Erro ao processar login. Tente novamente.']);
        exit;
    }
}

// ══════════════════════════════════════════════
// LOGOUT
// ══════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['auth_action'] ?? '') === 'logout') {
    session_destroy();
    echo json_encode([
        'success'  => true,
        'message'  => 'Logout realizado com sucesso.',
        'redirect' => '../index.php'
    ]);
    exit;
}

// ══════════════════════════════════════════════
// VERIFICAR SESSÃO
// ══════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['auth_action'] ?? '') === 'check') {
    if (!empty($_SESSION['logged_in'])) {
        echo json_encode([
            'success'   => true,
            'logged_in' => true,
            'user'      => [
                'id'    => $_SESSION['id']    ?? null,
                'nome'  => $_SESSION['nome']  ?? null,
                'email' => $_SESSION['email'] ?? null
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'logged_in' => false]);
    }
    exit;
}

// Requisição inválida
echo json_encode(['success' => false, 'message' => 'Requisição inválida.']);
exit;