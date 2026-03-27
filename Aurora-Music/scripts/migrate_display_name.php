<?php
/**
 * migrate_display_name.php
 * Migração: preenche `nome_exibicao` com `nome_arquivo` quando estiver vazio.
 * Uso: php migrate_display_name.php
 */

require_once __DIR__ . '/../config/database.php';

use Config\Database;

echo "Iniciando migração: preencher nome_exibicao a partir de nome_arquivo\n";

try {
    $db = new Database();
    $pdo = $db->getConnection();

    // Conta quantos registros serão afetados
    $countSql = "SELECT COUNT(*) as total FROM musicas WHERE (nome_exibicao IS NULL OR TRIM(nome_exibicao) = '') AND nome_arquivo IS NOT NULL AND TRIM(nome_arquivo) <> ''";
    $stmt = $pdo->query($countSql);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $toUpdate = (int) ($row['total'] ?? 0);

    if ($toUpdate === 0) {
        echo "Nenhum registro para atualizar.\n";
        exit(0);
    }

    echo "Registros a atualizar: {$toUpdate}\n";

    // Executa a atualização
    $updateSql = "UPDATE musicas SET nome_exibicao = nome_arquivo WHERE (nome_exibicao IS NULL OR TRIM(nome_exibicao) = '') AND nome_arquivo IS NOT NULL AND TRIM(nome_arquivo) <> ''";
    $affected = $pdo->exec($updateSql);

    echo "Atualização completada. Registros afetados: {$affected}\n";

} catch (Exception $e) {
    echo "Erro durante a migração: " . $e->getMessage() . "\n";
    exit(1);
}

echo "Fim.\n";

?>
