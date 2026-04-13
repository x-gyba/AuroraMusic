<?php
/**
 * delete-promo.php  (via rota /Aurora-Music/delete-promo)
 *
 * Deleta um arquivo de promo da pasta promo/.
 * Regras:
 *   - Só aceita requisições POST
 *   - Requer sessão autenticada
 *   - Nunca apaga promo.mp3 (arquivo padrão protegido)
 *   - Valida que o arquivo está DENTRO de promo/ (path traversal protection)
 *   - Aceita parâmetro via JSON body OU via FormData (multipart)
 */

session_start();

header('Content-Type: application/json; charset=utf-8');

// ── Autenticação ──────────────────────────────────────────────────────────────
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Acesso não autorizado.']);
    exit;
}

// ── Método ────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método não permitido.']);
    exit;
}

// ── Lê o nome do arquivo (JSON ou FormData) ───────────────────────────────────
$filename = null;

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (str_contains($contentType, 'application/json')) {
    // Corpo JSON: {"filename": "foo.mp3"}
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    $filename = $data['filename'] ?? null;
} else {
    // FormData / x-www-form-urlencoded
    $filename = $_POST['filename'] ?? null;
}

if (empty($filename)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Nome de arquivo não informado.']);
    exit;
}

// ── Sanitização: apenas o basename, sem diretórios ────────────────────────────
$filename = basename($filename);

// ── Proteção: nunca apagar o arquivo padrão ──────────────────────────────────
if ($filename === 'promo.mp3') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'O arquivo padrão promo.mp3 não pode ser excluído.']);
    exit;
}

// ── Resolve o caminho absoluto da pasta promo/ ────────────────────────────────
// __DIR__ aponta para views/ (onde este arquivo está fisicamente)
// Sobe um nível para a raiz do projeto
$promoDir = realpath(__DIR__ . '/../promo');

if ($promoDir === false || !is_dir($promoDir)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Pasta promo/ não encontrada.']);
    exit;
}

$promoDir = rtrim($promoDir, '/\\') . DIRECTORY_SEPARATOR;
$targetPath = $promoDir . $filename;

// ── Verifica que o arquivo resolvido está DENTRO de promo/ ────────────────────
// Evita path traversal (e.g. filename = "../../config/database.php")
$realTarget = realpath($targetPath);

if ($realTarget === false) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Arquivo não encontrado: ' . htmlspecialchars($filename)]);
    exit;
}

// realpath resolve symlinks e '..' — garante que está dentro de promoDir
if (strpos($realTarget, $promoDir) !== 0) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Acesso inválido ao arquivo.']);
    exit;
}

// ── Verifica extensão permitida (só áudio) ────────────────────────────────────
$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
if (!in_array($ext, ['mp3', 'wav', 'ogg', 'm4a'], true)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Tipo de arquivo não permitido.']);
    exit;
}

// ── Deleta ────────────────────────────────────────────────────────────────────
if (!is_file($realTarget)) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Arquivo não existe no disco.']);
    exit;
}

if (@unlink($realTarget)) {
    echo json_encode([
        'status'  => 'success',
        'message' => 'Arquivo "' . htmlspecialchars($filename) . '" excluído com sucesso.',
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Não foi possível excluir o arquivo. Verifique as permissões da pasta.',
    ]);
}