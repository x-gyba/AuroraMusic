<?php
/**
 * upload_music.php
 * Script de processamento de upload de músicas.
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

// Autenticação
if (!isset($_SESSION['id']) || !isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Usuário não autenticado.']);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Music.php';

try {
    if (!isset($_FILES['musicFile']) || $_FILES['musicFile']['error'] === UPLOAD_ERR_NO_FILE) {
        throw new Exception('Nenhum arquivo foi enviado.');
    }

    $file = $_FILES['musicFile'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Erro no upload: código ' . $file['error']);
    }

    // Preparação dos dados do arquivo
    $nomeOriginal = $file['name'];
    $fileName = trim(basename($nomeOriginal));
    $fileSize = $file['size'];
    $fileTmpPath = $file['tmp_name'];

    // Validações
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    if ($fileExtension !== 'mp3') {
        throw new Exception('Apenas arquivos MP3 são permitidos.');
    }

    // Validação do MIME type (melhorada)
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $fileTmpPath);
    finfo_close($finfo);
    
    if (!in_array($mimeType, ['audio/mpeg', 'audio/mp3', 'audio/vnd.mp3'])) {
        throw new Exception('Tipo de arquivo inválido. (MIME: ' . $mimeType . ')');
    }

    $maxFileSize = 50 * 1024 * 1024;
    if ($fileSize > $maxFileSize) {
        throw new Exception('Arquivo muito grande. Máximo: 50MB');
    }

    $musicModel = new Music();
    $userId = $_SESSION['id'];

    if ($musicModel->checkDuplicate($fileName, $userId)) {
        throw new Exception('Você já possui um arquivo com este nome.');
    }

    $storageLimit = 500 * 1024 * 1024;
    if (!$musicModel->checkStorageLimit($userId, $storageLimit)) {
        throw new Exception('Limite de armazenamento atingido (500MB).');
    }

    // 1. Diretório de destino
    // Caminho ABSOLUTO para o servidor (para move_uploaded_file)
    $uploadDir = __DIR__ . '/../music/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // 2. Gera nome único e move o arquivo
    $uniqueName = time() . '_' . bin2hex(random_bytes(4)) . '.mp3';
    $destinationAbsolutePath = $uploadDir . $uniqueName; // Caminho ABSOLUTO
    
    // Caminho RELATIVO para o banco de dados e frontend
    // Este é o caminho acessível via web, que deve ser salvo no DB.
    $webPathForDB = 'music/' . $uniqueName; 

    if (!move_uploaded_file($fileTmpPath, $destinationAbsolutePath)) {
        // Loga erro de permissão ou caminho
        error_log("Falha no move_uploaded_file para: " . $destinationAbsolutePath);
        throw new Exception('Erro ao mover arquivo. Verifique as permissões da pasta "music/".');
    }

    // 3. Nome de Exibição
    $displayNameFromPost = isset($_POST['displayName']) ? trim($_POST['displayName']) : '';
    
    if (!empty($displayNameFromPost)) {
        $nomeExibicao = $displayNameFromPost;
    } else {
        // Remove a extensão .mp3 do nome original
        $nomeExibicao = pathinfo($fileName, PATHINFO_FILENAME);
    }
    
    // 4. Inserção no Banco de Dados
    $musicData = [
        'usuario_id' => $userId,
        'nome_arquivo' => $fileName,
        'nome_exibicao' => $nomeExibicao,
        'caminho_arquivo' => $webPathForDB, // << CORRIGIDO: Salva o caminho RELATIVO/WEB
        'tamanho_arquivo' => $fileSize
    ];

    if (!$musicModel->save($musicData)) {
        // Se a inserção falhar, apaga o arquivo físico para evitar lixo
        if (file_exists($destinationAbsolutePath)) {
            unlink($destinationAbsolutePath);
        }
        throw new Exception('Erro ao salvar no banco de dados.');
    }

    // 5. Resposta de Sucesso
    echo json_encode([
        'success' => true,
        'message' => 'Música enviada com sucesso!',
        'data' => [
            'id' => $musicModel->id,
            'nome_exibicao' => $nomeExibicao,
            'nome_arquivo' => $fileName,
            'tamanho' => $fileSize,
            // Retorna o caminho correto para o JS (que está na pasta music/)
            'web_path' => '../' . $webPathForDB
        ]
    ]);

} catch (Exception $e) {
    // Tratamento de erro
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>