<?php
/**
 * extract_covers_from_existing.php
 * Script para extrair capas de ID3v2 de MP3s já enviados
 * Uso: php extract_covers_from_existing.php
 */

require_once __DIR__ . '/../config/database.php';

use Config\Database;

function extractEmbeddedCover(string $mp3path): ?array {
    if (!file_exists($mp3path)) return null;
    $fp = fopen($mp3path,'rb');
    if (!$fp) return null;
    $header = fread($fp, 10);
    if (substr($header,0,3) !== 'ID3') {
        fclose($fp);
        return null;
    }
    $sizeBytes = substr($header,6,4);
    $size = (ord($sizeBytes[0]) << 21) | (ord($sizeBytes[1]) << 14)
          | (ord($sizeBytes[2]) << 7)  | ord($sizeBytes[3]);
    $tagData = fread($fp, $size);
    fclose($fp);

    $pos = strpos($tagData, 'APIC');
    if ($pos === false) return null;
    $pos += 10;
    if ($pos >= strlen($tagData)) return null;
    $pos++;
    $mime = '';
    while ($pos < strlen($tagData) && $tagData[$pos] !== "\x00") {
        $mime .= $tagData[$pos++];
    }
    $pos++;
    $pos++;
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

echo "🎵 Iniciando extração de capas de ID3v2...\n\n";

try {
    $db = new Database();
    $pdo = $db->getConnection();

    // Query para buscar músicas sem capa
    $query = "SELECT id, caminho_arquivo FROM musicas WHERE caminho_imagem IS NULL ORDER BY id DESC";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $musicas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($musicas)) {
        echo "✅ Nenhuma música sem capa. Tudo em dia!\n";
        exit(0);
    }

    echo "📊 Encontradas " . count($musicas) . " música(s) sem capa.\n";
    echo "Processando...\n\n";

    // Criar diretório de covers se não existir
    $coversDir = __DIR__ . '/../music/covers/';
    if (!is_dir($coversDir)) {
        mkdir($coversDir, 0755, true);
        echo "📁 Diretório 'covers' criado.\n";
    }

    if (!is_writable($coversDir)) {
        @chmod($coversDir, 0755);
        @chmod($coversDir, 0775);
        @chmod($coversDir, 0777);
    }

    $baseDir = __DIR__ . '/../';
    $processadas = 0;
    $comCapa = 0;
    $semCapa = 0;
    $erros = 0;

    foreach ($musicas as $musica) {
        $id = $musica['id'];
        $caminhoRelativo = $musica['caminho_arquivo'];
        $caminhoCompleto = $baseDir . $caminhoRelativo;

        echo "🎵 Processando ID {$id}: {$caminhoRelativo}... ";

        if (!file_exists($caminhoCompleto)) {
            echo "❌ Arquivo não encontrado.\n";
            $erros++;
            $processadas++;
            continue;
        }

        $embedded = extractEmbeddedCover($caminhoCompleto);

        if ($embedded) {
            // Gera nome único para a capa
            $uniqueImgName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $embedded['ext'];
            $imgDestinationPath = $coversDir . $uniqueImgName;

            // Salva a imagem
            if (@file_put_contents($imgDestinationPath, $embedded['data']) !== false) {
                $caminhoImagem = 'music/covers/' . $uniqueImgName;

                // Atualiza banco de dados
                $updateQuery = "UPDATE musicas SET caminho_imagem = :caminho, tipo_imagem = :tipo WHERE id = :id";
                $updateStmt = $pdo->prepare($updateQuery);
                $updateStmt->bindValue(':caminho', $caminhoImagem, PDO::PARAM_STR);
                $updateStmt->bindValue(':tipo', $embedded['ext'], PDO::PARAM_STR);
                $updateStmt->bindValue(':id', $id, PDO::PARAM_INT);

                if ($updateStmt->execute()) {
                    echo "✅ Capa extraída e salva!\n";
                    $comCapa++;
                } else {
                    echo "⚠️  Capa extraída mas erro ao salvar no BD.\n";
                    @unlink($imgDestinationPath);
                    $erros++;
                }
            } else {
                echo "❌ Erro ao salvar imagem no disco.\n";
                $erros++;
            }
        } else {
            echo "⏭️  Sem capa ID3v2.\n";
            $semCapa++;
        }

        $processadas++;
    }

    echo "\n" . str_repeat("=", 50) . "\n";
    echo "📈 RESULTADO:\n";
    echo "   Total processado: {$processadas}\n";
    echo "   ✅ Com capa extraída: {$comCapa}\n";
    echo "   ⏭️  Sem capa ID3v2: {$semCapa}\n";
    echo "   ❌ Erros: {$erros}\n";
    echo str_repeat("=", 50) . "\n\n";

    if ($comCapa > 0) {
        echo "🎉 Sucesso! {$comCapa} capa(s) foram extraída(s) e salva(s)!\n";
    }

} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
    exit(1);
}
?>
