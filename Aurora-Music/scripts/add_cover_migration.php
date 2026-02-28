<?php
/**
 * add_cover_migration.php
 * Migração: Adiciona suporte a imagens/covers nas músicas
 * Uso: php add_cover_migration.php
 */

require_once __DIR__ . '/../config/database.php';

use Config\Database;

echo "Iniciando migração: Adicionar suporte a imagens/covers\n";

try {
    $db = new Database();
    $pdo = $db->getConnection();

    echo "Verificando se a coluna 'caminho_imagem' já existe...\n";
    
    // Verifica se as colunas já existem
    $checkSql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'musicas' AND COLUMN_NAME = 'caminho_imagem'";
    $stmt = $pdo->query($checkSql);
    $columnExists = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($columnExists) {
        echo "⚠️  A coluna 'caminho_imagem' já existe. Nada a fazer.\n";
        exit(0);
    }

    echo "Adicionando coluna 'caminho_imagem'...\n";
    $sql1 = "ALTER TABLE `musicas` ADD COLUMN `caminho_imagem` VARCHAR(500) DEFAULT NULL AFTER `caminho_arquivo`";
    $pdo->exec($sql1);
    echo "✓ Coluna 'caminho_imagem' adicionada com sucesso!\n";

    echo "Adicionando índice em 'caminho_imagem'...\n";
    $sql2 = "ALTER TABLE `musicas` ADD INDEX `idx_caminho_imagem` (`caminho_imagem`)";
    $pdo->exec($sql2);
    echo "✓ Índice adicionado com sucesso!\n";

    echo "Adicionando coluna 'tipo_imagem'...\n";
    $sql3 = "ALTER TABLE `musicas` ADD COLUMN `tipo_imagem` ENUM('jpg', 'png', 'gif', 'webp') DEFAULT NULL AFTER `caminho_imagem`";
    $pdo->exec($sql3);
    echo "✓ Coluna 'tipo_imagem' adicionada com sucesso!\n";

    echo "\n✅ Migração concluída com sucesso!\n";
    echo "As colunas 'caminho_imagem' e 'tipo_imagem' foram adicionadas à tabela 'musicas'.\n";

} catch (Exception $e) {
    echo "❌ Erro durante a migração: " . $e->getMessage() . "\n";
    exit(1);
}

echo "Fim.\n";

?>
