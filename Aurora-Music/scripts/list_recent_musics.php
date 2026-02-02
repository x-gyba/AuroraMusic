<?php
require_once __DIR__ . '/../config/database.php';
use Config\Database;

try {
    $db = new Database();
    $pdo = $db->getConnection();

    $sql = "SELECT id, usuario_id, nome_arquivo, nome_exibicao, caminho_arquivo, tamanho_arquivo, data_upload
            FROM musicas ORDER BY data_upload DESC LIMIT 20";
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as $r) {
        echo "id={$r['id']} user={$r['usuario_id']} nome_arquivo=\"{$r['nome_arquivo']}\" nome_exibicao=\"{$r['nome_exibicao']}\" caminho=\"{$r['caminho_arquivo']}\" tamanho={$r['tamanho_arquivo']} data={$r['data_upload']}\n";
    }

} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}

?>
