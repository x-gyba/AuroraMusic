<?php
/**
 * AuthController.php
 * Controlador de Autenticação - Infogyba 2026
 */

// CRÍTICO: session_start() ANTES de header()
session_start();

// Headers DEPOIS de session_start()
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';
use Config\Database;

/**
 * Função auxiliar para registrar tentativas de login
 */
function registrarTentativa($conn, $usuario, $ip, $success) {
    try {
        $log = $conn->prepare("
            INSERT INTO tentativas_login (usuario, ip_address, success, attempted_at) 
            VALUES (:usuario, :ip, :success, NOW())
        ");
        $log->execute([
            ':usuario' => $usuario,
            ':ip' => $ip,
            ':success' => $success ? 1 : 0
        ]);
    } catch (PDOException $e) {
        error_log("Erro ao registrar tentativa: " . $e->getMessage());
    }
}

/**
 * Função para verificar bloqueio por múltiplas tentativas
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
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return ($result['tentativas'] >= 5);
    } catch (PDOException $e) {
        return false;
    }
}

// ============================================
// PROCESSAMENTO DO LOGIN
// ============================================

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['auth_action']) && $_GET['auth_action'] === 'login') {
    
    // Captura credenciais
    $usuario = trim($_POST['usuario'] ?? '');
    $senha = $_POST['senha'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    
    // Validação inicial
    if (empty($usuario) || empty($senha)) {
        echo json_encode([
            'success' => false,
            'message' => 'Usuário e senha são obrigatórios.'
        ]);
        exit;
    }
    
    try {
        // Conexão com banco
        $db = new Database();
        $conn = $db->getConnection();
        
        // Verifica bloqueio por múltiplas tentativas
        if (verificarBloqueio($conn, $usuario)) {
            registrarTentativa($conn, $usuario, $ip, false);
            echo json_encode([
                'success' => false,
                'message' => 'Conta temporariamente bloqueada. Aguarde 15 minutos.'
            ]);
            exit;
        }
        
        // Busca usuário no banco
        $stmt = $conn->prepare("
            SELECT id, usuario, senha, email, status 
            FROM usuarios 
            WHERE usuario = :usuario
        ");
        $stmt->bindParam(':usuario', $usuario, PDO::PARAM_STR);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_OBJ);
        
        // Verifica se usuário existe
        if (!$user) {
            registrarTentativa($conn, $usuario, $ip, false);
            echo json_encode([
                'success' => false,
                'message' => 'Usuário ou senha incorretos.'
            ]);
            exit;
        }
        
        // Verifica se conta está ativa
        if ($user->status !== 'active') {
            registrarTentativa($conn, $usuario, $ip, false);
            echo json_encode([
                'success' => false,
                'message' => 'Conta desativada. Contate o administrador.'
            ]);
            exit;
        }
        
        // ============================================
        // VERIFICAÇÃO CRÍTICA DA SENHA
        // ============================================
        if (!password_verify($senha, $user->senha)) {
            registrarTentativa($conn, $usuario, $ip, false);
            echo json_encode([
                'success' => false,
                'message' => 'Usuário ou senha incorretos.'
            ]);
            exit;
        }
        
        // ============================================
        // LOGIN BEM-SUCEDIDO
        // ============================================
        
        // Registra tentativa bem-sucedida
        registrarTentativa($conn, $usuario, $ip, true);
        
        // Atualiza last_login
        $updateStmt = $conn->prepare("
            UPDATE usuarios 
            SET last_login = NOW() 
            WHERE id = :id
        ");
        $updateStmt->execute([':id' => $user->id]);
        
        // ============================================
        // CONFIGURA SESSÃO - PADRONIZADO
        // ============================================
        $_SESSION['usuario'] = $user->usuario;
        $_SESSION['id'] = $user->id;
        $_SESSION['email'] = $user->email ?? '';
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
        
        // Regenera ID da sessão por segurança
        session_regenerate_id(true);
        
        // Resposta de sucesso
        echo json_encode([
            'success' => true,
            'message' => 'Login realizado com sucesso!',
            'redirect' => 'views/dashboard.php',
            'user' => [
                'id' => $user->id,
                'usuario' => $user->usuario,
                'email' => $user->email ?? ''
            ]
        ]);
        exit;
        
    } catch (PDOException $e) {
        // Log do erro (não expor detalhes ao usuário)
        error_log("Erro no AuthController: " . $e->getMessage());
        
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao processar login. Tente novamente.'
        ]);
        exit;
    }
}

// ============================================
// LOGOUT
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['auth_action']) && $_GET['auth_action'] === 'logout') {
    session_destroy();
    echo json_encode([
        'success' => true,
        'message' => 'Logout realizado com sucesso.',
        'redirect' => '../index.php'
    ]);
    exit;
}

// ============================================
// VERIFICAR SESSÃO
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['auth_action']) && $_GET['auth_action'] === 'check') {
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
        echo json_encode([
            'success' => true,
            'logged_in' => true,
            'user' => [
                'id' => $_SESSION['id'] ?? null,
                'usuario' => $_SESSION['usuario'] ?? null,
                'email' => $_SESSION['email'] ?? null
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'logged_in' => false
        ]);
    }
    exit;
}

// Requisição inválida
echo json_encode([
    'success' => false,
    'message' => 'Requisição inválida.'
]);
exit;
?>