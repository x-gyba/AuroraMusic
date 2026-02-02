<?php
/**
 * apply_display_name_update.php
 * Atualiza `nome_exibicao` para `nome_arquivo` em registros com nomes gerados ou genéricos.
 * Uso: php apply_display_name_update.php
 */

require_once __DIR__ . '/../config/database.php';
use Config\Database;

echo "Iniciando atualização de nome_exibicao a partir de nome_arquivo...\n";

try {
    $db = new Database();
    $pdo = $db->getConnection();

    // Condições para identificar registros problemáticos:
    // - nome_exibicao vazio
    // - nome_exibicao genérico ('file','arquivo','untitled','unknown')
    // - nome_exibicao parece gerado (timestamp + hex)
    // - caminho_arquivo contém '_file' (padrão observado)
    $selectSql = "SELECT id, nome_arquivo, nome_exibicao, caminho_arquivo
                  FROM musicas
                  WHERE (nome_exibicao IS NULL OR TRIM(nome_exibicao) = '')
                     OR LOWER(nome_exibicao) IN ('file','arquivo','untitled','unknown')
                     OR nome_exibicao REGEXP '^[0-9]{6,}[ _\\-]+[0-9a-fA-F]{6,}.*'
                     OR caminho_arquivo LIKE '%_file.%'";

    $stmt = $pdo->query($selectSql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $count = count($rows);

    echo "Registros identificados: {$count}\n";

    if ($count === 0) {
        echo "Nenhum registro precisa de atualização.\n";
        exit(0);
    }

    // Mostrar exemplos (até 50)
    $examples = array_slice($rows, 0, 50);
    foreach ($examples as $r) {
        echo "PRE: id={$r['id']} nome_exibicao=\"{$r['nome_exibicao']}\" nome_arquivo=\"{$r['nome_arquivo']}\" caminho=\"{$r['caminho_arquivo']}\"\n";
    }

    // Atualiza: copia nome_arquivo para nome_exibicao para os ids encontrados
    $ids = array_column($rows, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $updateSql = "UPDATE musicas SET nome_exibicao = nome_arquivo WHERE id IN ({$placeholders})";
    $updateStmt = $pdo->prepare($updateSql);
    foreach ($ids as $i => $id) {
        $updateStmt->bindValue($i+1, $id, PDO::PARAM_INT);
    }
    $updateStmt->execute();
    $affected = $updateStmt->rowCount();

    echo "Atualização aplicada. Registros afetados: {$affected}\n";

    // Mostrar alguns exemplos após atualização
    $stmt2 = $pdo->query("SELECT id, nome_arquivo, nome_exibicao, caminho_arquivo FROM musicas WHERE id IN (" . implode(',', $ids) . ")");
    $after = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    foreach ($after as $r) {
        echo "POST: id={$r['id']} nome_exibicao=\"{$r['nome_exibicao']}\" nome_arquivo=\"{$r['nome_arquivo']}\" caminho=\"{$r['caminho_arquivo']}\"\n";
    }

    echo "Concluído.\n";

} catch (Exception $e) {
    echo "Erro durante a operação: " . $e->getMessage() . "\n";
    exit(1);
}

?>
