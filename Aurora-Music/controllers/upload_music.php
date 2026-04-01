<?php
/**
 * upload_music.php
 * Script de processamento de upload de músicas - Infogyba 2026
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['id']) || !isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Usuário não autenticado.']);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Music.php';

function extractEmbeddedCover(string $mp3path): ?array {
    if (!file_exists($mp3path) || !is_readable($mp3path)) return null;
    $fp = fopen($mp3path, 'rb');
    if (!$fp) return null;
    $header = fread($fp, 10);
    if (strlen($header) < 10 || substr($header, 0, 3) !== 'ID3') {
        fclose($fp); return null;
    }
    $majorVersion = ord($header[3]);
    $flags        = ord($header[5]);
    $hasExtHeader = ($flags & 0x40) !== 0;
    $tagSize = ((ord($header[6]) & 0x7F) << 21) | ((ord($header[7]) & 0x7F) << 14) | ((ord($header[8]) & 0x7F) <<  7) | (ord($header[9]) & 0x7F);
    $tagData = fread($fp, $tagSize);
    fclose($fp);
    if (strlen($tagData) < 10) return null;
    $pos = 0;
    if ($hasExtHeader && $majorVersion >= 3) {
        if ($majorVersion === 4) {
            $es = ((ord($tagData[0]) & 0x7F) << 21) | ((ord($tagData[1]) & 0x7F) << 14) | ((ord($tagData[2]) & 0x7F) <<  7) | ((ord($tagData[3]) & 0x7F));
        } else {
            $es = (ord($tagData[0]) << 24) | (ord($tagData[1]) << 16) | (ord($tagData[2]) << 8) | ord($tagData[3]);
        }
        $pos += $es;
    }
    $len = strlen($tagData);
    while ($pos < $len - 10) {
        if ($majorVersion === 2) {
            $frameId   = substr($tagData, $pos, 3);
            $frameSize = (ord($tagData[$pos+3]) << 16) | (ord($tagData[$pos+4]) << 8) | ord($tagData[$pos+5]);
            $pos += 6;
            $apicTag = 'PIC';
        } else {
            $frameId = substr($tagData, $pos, 4);
            if ($majorVersion === 4) {
                $frameSize = ((ord($tagData[$pos+4]) & 0x7F) << 21) | ((ord($tagData[$pos+5]) & 0x7F) << 14) | ((ord($tagData[$pos+6]) & 0x7F) <<  7) | (ord($tagData[$pos+7]) & 0x7F);
            } else {
                $frameSize = (ord($tagData[$pos+4]) << 24) | (ord($tagData[$pos+5]) << 16) | (ord($tagData[$pos+6]) << 8) | ord($tagData[$pos+7]);
            }
            $pos += 10;
            $apicTag = 'APIC';
        }
        if ($frameSize <= 0 || $pos + $frameSize > $len) break;
        $frameData = substr($tagData, $pos, $frameSize);
        $pos += $frameSize;
        if ($frameId !== $apicTag) continue;
        $fpos = 0;
        $encoding = ord($frameData[$fpos++]);
        if ($frameId === 'PIC') {
            $fmt = strtolower(substr($frameData, $fpos, 3)); $fpos += 3;
            $ext = ($fmt === 'jpg' || $fmt === 'jpeg') ? 'jpg' : ($fmt === 'png' ? 'png' : ($fmt === 'gif' ? 'gif' : ($fmt === 'webp' ? 'webp' : null)));
            if (!$ext) continue;
            $fpos++;
            $fpos = _id3SkipNull($frameData, $fpos, $encoding);
        } else {
            $mime = '';
            while ($fpos < strlen($frameData) && $frameData[$fpos] !== "\x00") { $mime .= $frameData[$fpos++]; }
            $fpos++;
            $mime = strtolower(trim($mime));
            $ext = null;
            if (strpos($mime, 'jpeg') !== false || strpos($mime, 'jpg') !== false) $ext = 'jpg';
            elseif (strpos($mime, 'png') !== false) $ext = 'png';
            elseif (strpos($mime, 'gif') !== false) $ext = 'gif';
            elseif (strpos($mime, 'webp') !== false) $ext = 'webp';
            if (!$ext) continue;
            $fpos++;
            $fpos = _id3SkipNull($frameData, $fpos, $encoding);
        }
        if ($fpos >= strlen($frameData)) continue;
        $imageData = substr($frameData, $fpos);
        if (!_id3ValidMagic($imageData, $ext)) continue;
        return ['data' => $imageData, 'ext' => $ext];
    }
    return null;
}

function _id3SkipNull(string $data, int $pos, int $encoding): int {
    $len = strlen($data);
    if ($encoding === 1 || $encoding === 2) {
        if ($pos % 2 !== 0) $pos++;
        while ($pos + 1 < $len) {
            if ($data[$pos] === "\x00" && $data[$pos+1] === "\x00") { $pos += 2; break; }
            $pos += 2;
        }
    } else {
        while ($pos < $len && $data[$pos] !== "\x00") $pos++;
        $pos++;
    }
    return $pos;
}

function _id3ValidMagic(string $data, string $ext): bool {
    if (strlen($data) < 4) return false;
    switch ($ext) {
        case 'jpg':  return substr($data, 0, 2) === "\xFF\xD8";
        case 'png':  return substr($data, 0, 4) === "\x89PNG";
        case 'gif':  return substr($data, 0, 3) === 'GIF';
        case 'webp': return strlen($data) > 12 && substr($data, 8, 4) === 'WEBP';
    }
    return false;
}

try {
    if (!isset($_FILES['musicFile']) || $_FILES['musicFile']['error'] === UPLOAD_ERR_NO_FILE) {
        throw new Exception('Nenhum arquivo foi enviado.');
    }
    $file = $_FILES['musicFile'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Erro no upload: código ' . $file['error']);
    }
    $nomeOriginal = $file['name'];
    $fileName     = trim(basename($nomeOriginal));
    $fileSize     = $file['size'];
    $fileTmpPath  = $file['tmp_name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    if ($fileExtension !== 'mp3') {
        throw new Exception('Apenas arquivos MP3 são permitidos.');
    }
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $fileTmpPath);
    finfo_close($finfo);
    if (!in_array($mimeType, ['audio/mpeg', 'audio/mp3', 'audio/vnd.mp3'])) {
        throw new Exception('Tipo de arquivo inválido.');
    }
    $musicModel = new \Models\Music();
    $userId     = $_SESSION['id'];
    if ($musicModel->checkDuplicate($fileName, $userId)) {
        throw new Exception('Você já possui um arquivo com este nome.');
    }
    $uploadDir = __DIR__ . '/../music/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $uniqueName              = time() . '_' . bin2hex(random_bytes(4)) . '.mp3';
    $destinationAbsolutePath = $uploadDir . $uniqueName;
    $webPathForDB            = 'music/' . $uniqueName;
    if (!@move_uploaded_file($fileTmpPath, $destinationAbsolutePath)) {
        throw new Exception('Erro ao mover arquivo.');
    }
    $displayNameFromPost = isset($_POST['displayName']) ? trim($_POST['displayName']) : '';
    $nomeExibicao = !empty($displayNameFromPost) ? $displayNameFromPost : pathinfo($fileName, PATHINFO_FILENAME);
    $caminhoImagem = null;
    $tipoImagem    = null;
    $coverSource   = null;
    $imgDir = __DIR__ . '/../music/covers/';
    if (!is_dir($imgDir)) mkdir($imgDir, 0755, true);
    if (isset($_FILES['coverImage']) && $_FILES['coverImage']['error'] === UPLOAD_ERR_OK) {
        $imgFile      = $_FILES['coverImage'];
        $imgExtension = strtolower(pathinfo($imgFile['name'], PATHINFO_EXTENSION));
        $allowedExts  = ['jpg','jpeg','png','gif','webp'];
        if (in_array($imgExtension, $allowedExts)) {
            $uniqueImgName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $imgExtension;
            if (@move_uploaded_file($imgFile['tmp_name'], $imgDir . $uniqueImgName)) {
                $caminhoImagem = 'music/covers/' . $uniqueImgName;
                $tipoImagem    = ($imgExtension === 'jpeg') ? 'jpg' : $imgExtension;
                $coverSource   = 'uploaded';
            }
        }
    }
    if ($caminhoImagem === null) {
        $embedded = extractEmbeddedCover($destinationAbsolutePath);
        if ($embedded !== null) {
            $uniqueImgName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $embedded['ext'];
            if (@file_put_contents($imgDir . $uniqueImgName, $embedded['data']) !== false) {
                $caminhoImagem = 'music/covers/' . $uniqueImgName;
                $tipoImagem    = $embedded['ext'];
                $coverSource   = 'embedded';
            }
        }
    }
    $musicData = [
        'usuario_id'      => $userId,
        'nome_arquivo'    => $fileName,
        'nome_exibicao'   => $nomeExibicao,
        'caminho_arquivo' => $webPathForDB,
        'tamanho_arquivo' => $fileSize,
        'caminho_imagem'  => $caminhoImagem,
        'tipo_imagem'     => $tipoImagem,
    ];
    if (!$musicModel->save($musicData)) {
        throw new Exception('Erro ao salvar no banco.');
    }
    echo json_encode([
        'success' => true,
        'message' => 'Upload concluído!',
        'data'    => [
            'nome_exibicao' => $nomeExibicao,
            'caminho_imagem' => $caminhoImagem // Retorna o caminho relativo para o JS
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}