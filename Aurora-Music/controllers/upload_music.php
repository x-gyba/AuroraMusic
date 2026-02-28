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

/**
 * Tenta extrair a imagem de capa embutida num arquivo MP3 (ID3v2 APIC).
 * Retorna array ['data'=>binary, 'ext'=>ext] ou null se não houver.
 */
function extractEmbeddedCover(string $mp3path): ?array {
    if (!file_exists($mp3path)) return null;
    $fp = fopen($mp3path,'rb');
    if (!$fp) return null;
    $header = fread($fp, 10);
    if (substr($header,0,3) !== 'ID3') {
        fclose($fp);
        return null;
    }
    // tamanho sincsafe nos bytes 6-9
    $sizeBytes = substr($header,6,4);
    $size = (ord($sizeBytes[0]) << 21) | (ord($sizeBytes[1]) << 14)
          | (ord($sizeBytes[2]) << 7)  | ord($sizeBytes[3]);
    $tagData = fread($fp, $size);
    fclose($fp);

    $pos = strpos($tagData, 'APIC');
    if ($pos === false) return null;
    // pula "APIC" + tamanho de frame (4 bytes) + flags (2 bytes)
    $pos += 10;
    if ($pos >= strlen($tagData)) return null;
    // encoding byte
    $pos++;
    // lê mime até 0
    $mime = '';
    while ($pos < strlen($tagData) && $tagData[$pos] !== "\x00") {
        $mime .= $tagData[$pos++];
    }
    $pos++;
    // pula picture type
    $pos++;
    // pula descrição até 0
    while ($pos < strlen($tagData) && $tagData[$pos] !== "\x00") {
        $pos++;
    }
    $pos++;
    if ($pos >= strlen($tagData)) return null;
    $imageData = substr($tagData, $pos);
    $ext = null;
    switch (strtolower($mime)) {
        case 'image/jpeg':
        case 'image/jpg':
            $ext = 'jpg'; break;
        case 'image/png':
            $ext = 'png'; break;
        case 'image/gif':
            $ext = 'gif'; break;
        case 'image/webp':
            $ext = 'webp'; break;
        default:
            return null;
    }
    return ['data' => $imageData, 'ext' => $ext];
}


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

    // precisa referenciar o namespace correto
    $musicModel = new \Models\Music();
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

    // Verifica permissões e tentativas de correção automática
    if (!is_writable($uploadDir)) {
        // Tenta ajustar permissões (pode falhar dependendo do usuário do processo)
        @chmod($uploadDir, 0755);
        clearstatcache(true, $uploadDir);
    }

    // Se ainda não está gravável, tenta permissões mais liberais
    if (!is_writable($uploadDir)) {
        @chmod($uploadDir, 0775);
        clearstatcache(true, $uploadDir);
    }

    // Tentativa final: permissões abertas (menos seguro, porém automático)
    if (!is_writable($uploadDir)) {
        @chmod($uploadDir, 0777);
        clearstatcache(true, $uploadDir);
    }

    // Testa criação de um arquivo temporário para verificar se a pasta realmente aceita escrita
    $tempTest = $uploadDir . '.upload_test_' . bin2hex(random_bytes(4));
    $canWrite = false;
    try {
        $fp = @fopen($tempTest, 'w');
        if ($fp) {
            fwrite($fp, "test");
            fclose($fp);
            @unlink($tempTest);
            $canWrite = true;
        }
    } catch (Exception $e) {
        $canWrite = false;
    }

    if (!$canWrite && !is_writable($uploadDir)) {
        // Coleta informações do processo para diagnóstico
        $procInfo = [];
        if (function_exists('posix_geteuid')) {
            $euid = posix_geteuid();
            if (function_exists('posix_getpwuid')) {
                $pw = posix_getpwuid($euid);
                $procInfo['process_user'] = $pw['name'] ?? $euid;
            } else {
                $procInfo['process_euid'] = $euid;
            }
        }

        error_log("Diretório de upload não gravável após tentativas: {$uploadDir} - procInfo=" . json_encode($procInfo));
        throw new Exception('Diretório de upload não gravável. Ajuste permissões da pasta "music/" (ex: chown/chmod).');
    }

    // Usa @ para suprimir warning (já tratamos permissões previamente) e checa retorno
    $moved = @move_uploaded_file($fileTmpPath, $destinationAbsolutePath);
    if (!$moved) {
        // Log detalhado para diagnóstico
        error_log("Falha no move_uploaded_file de {$fileTmpPath} para: {$destinationAbsolutePath}. is_writable(uploadDir): " . (is_writable($uploadDir) ? '1' : '0'));
        // Remove arquivo temporário se necessário
        if (file_exists($fileTmpPath)) {
            @unlink($fileTmpPath);
        }
        throw new Exception('Erro ao mover arquivo. Verifique as permissões e espaço em disco.');
    }

    // 3. Nome de Exibição
    $displayNameFromPost = isset($_POST['displayName']) ? trim($_POST['displayName']) : '';
    
    if (!empty($displayNameFromPost)) {
        $nomeExibicao = $displayNameFromPost;
    } else {
        // Remove a extensão .mp3 do nome original
        $nomeExibicao = pathinfo($fileName, PATHINFO_FILENAME);
    }
    
    // 3.5 Processar upload opcional de imagem/cover
    $caminhoImagem = null;
    $tipoImagem = null;
    $coverSource = null; // 'uploaded' ou 'embedded'
    
    if (isset($_FILES['coverImage']) && $_FILES['coverImage']['error'] !== UPLOAD_ERR_NO_FILE) {
        // usuário enviou uma imagem explicitamente
        $coverSource = 'uploaded';
        $imgFile = $_FILES['coverImage'];
        
        if ($imgFile['error'] === UPLOAD_ERR_OK) {
            // Validação de tipo de imagem
            $imgExtension = strtolower(pathinfo($imgFile['name'], PATHINFO_EXTENSION));
            $allowedImgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            
            if (in_array($imgExtension, $allowedImgExts)) {
                // Validação de MIME type para imagem
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $imgMimeType = finfo_file($finfo, $imgFile['tmp_name']);
                finfo_close($finfo);
                
                $allowedImgMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (in_array($imgMimeType, $allowedImgMimes)) {
                    $maxImgSize = 5 * 1024 * 1024; // 5MB para imagens
                    if ($imgFile['size'] <= $maxImgSize) {
                        // Gera nome único para a imagem
                        $imgDir = __DIR__ . '/../music/covers/';
                        if (!is_dir($imgDir)) {
                            mkdir($imgDir, 0755, true);
                        }
                        
                        // Tenta ajustar permissões se necessário
                        if (!is_writable($imgDir)) {
                            @chmod($imgDir, 0755);
                            @chmod($imgDir, 0775);
                            @chmod($imgDir, 0777);
                        }
                        
                        $uniqueImgName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $imgExtension;
                        $imgDestinationPath = $imgDir . $uniqueImgName;
                        
                        if (@move_uploaded_file($imgFile['tmp_name'], $imgDestinationPath)) {
                            $caminhoImagem = 'music/covers/' . $uniqueImgName;
                            $tipoImagem = ($imgExtension === 'jpeg') ? 'jpg' : $imgExtension;
                        }
                    }
                }
            }
        }
    } else {
        // não houve envio explícito; tentar extrair do próprio MP3
        $embedded = extractEmbeddedCover($destinationAbsolutePath);
        if ($embedded) {
            $coverSource = 'embedded';
            $imgDir = __DIR__ . '/../music/covers/';
            if (!is_dir($imgDir)) {
                mkdir($imgDir, 0755, true);
            }
            if (!is_writable($imgDir)) {
                @chmod($imgDir, 0755);
                @chmod($imgDir, 0775);
                @chmod($imgDir, 0777);
            }
            $uniqueImgName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $embedded['ext'];
            $imgDestinationPath = $imgDir . $uniqueImgName;
            // grava os bytes extraídos
            if (@file_put_contents($imgDestinationPath, $embedded['data']) !== false) {
                $caminhoImagem = 'music/covers/' . $uniqueImgName;
                $tipoImagem = $embedded['ext'];
            }
        }
    }

    // 4. Inserção no Banco de Dados
    $musicData = [
        'usuario_id' => $userId,
        'nome_arquivo' => $fileName,
        'nome_exibicao' => $nomeExibicao,
        'caminho_arquivo' => $webPathForDB, // << CORRIGIDO: Salva o caminho RELATIVO/WEB
        'tamanho_arquivo' => $fileSize,
        'caminho_imagem' => $caminhoImagem,
        'tipo_imagem' => $tipoImagem
    ];

    if (!$musicModel->save($musicData)) {
        // Se a inserção falhar, apaga o arquivo físico para evitar lixo
        if (file_exists($destinationAbsolutePath)) {
            unlink($destinationAbsolutePath);
        }
        throw new Exception('Erro ao salvar no banco de dados.');
    }

    // 5. Resposta de Sucesso
    $msg = 'Música enviada com sucesso!';
    if (isset($coverSource) && $coverSource === 'embedded') {
        $msg .= ' (capa extraída do MP3)';
    }
    echo json_encode([
        'success' => true,
        'message' => $msg,
        'data' => [
            'id' => $musicModel->getLastInsertId(),
            'nome_exibicao' => $nomeExibicao,
            'nome_arquivo' => $fileName,
            'tamanho' => $fileSize,
            // Retorna o caminho correto para o JS (que está na pasta music/)
            'web_path' => '../' . $webPathForDB,
            'cover_web' => $caminhoImagem ? '../' . $caminhoImagem : null,
            'cover_source' => $coverSource
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