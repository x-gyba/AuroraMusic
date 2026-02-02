<?php
/**
 * fix_generated_display_names.php
 * Localiza registros com `nome_exibicao` gerado (ex: "1763664972_05e80f4d_file")
 * ou genéricos (file, arquivo, untitled) e atualiza para o `nome_arquivo` original.
 * Uso: php fix_generated_display_names.php
 */

require_once __DIR__ . '/../config/database.php';
use Config\Database;

echo "Procurando registros com nomes gerados...\n";

try {
    $db = new Database();
    $pdo = $db->getConnection();

    // Padrão para detectar nomes gerados: começa com dígitos seguido por espaço/underscore/hífen e um bloco hex
    $regex = "^[0-9]+[ _\\-]+[0-9a-fA-F]{6,}.*";

    // Busca registros onde nome_exibicao parece gerado ou é genérico
    $sql = "SELECT id, nome_arquivo, nome_exibicao, caminho_arquivo FROM musicas
            WHERE (nome_exibicao REGEXP :regex)
               OR (LOWER(nome_exibicao) IN ('file','arquivo','untitled','unknown'))";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':regex', $regex);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $count = count($rows);
    echo "Registros encontrados: {$count}\n";

    if ($count === 0) {
        echo "Nenhum registro com nome gerado encontrado.\n";
        exit(0);
    }

    // Lista exemplos (até 50)
    $limit = 50;
    foreach (array_slice($rows, 0, $limit) as $r) {
        echo "id={$r['id']} nome_exibicao=\"{$r['nome_exibicao']}\" nome_arquivo=\"{$r['nome_arquivo']}\" caminho=\"{$r['caminho_arquivo']}\"\n";
    }

    // Confirmar execução automática: atualiza todos para usar nome_arquivo
    echo "\nAtualizando todos os registros encontrados para usar 'nome_arquivo' como 'nome_exibicao'...\n";

    // Coleta ids
    $ids = array_column($rows, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    $updateSql = "UPDATE musicas SET nome_exibicao = nome_arquivo WHERE id IN ({$placeholders})";
    $updateStmt = $pdo->prepare($updateSql);
    foreach ($ids as $i => $id) {
        // bindParam index starts at 1
        $updateStmt->bindValue($i+1, $id, PDO::PARAM_INT);
    }

    $updateStmt->execute();
    $affected = $updateStmt->rowCount();

    echo "Atualização completa. Registros afetados: {$affected}\n";

} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
    exit(1);
}

echo "Fim.\n";

?>
