<?php
/**
 * test_cover_setup.php
 * Script para verificar se o sistema de capas está configurado corretamente
 * Acesse: http://seu-dominio/Aurora-Music/scripts/test_cover_setup.php
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste de Configuração do Sistema de Capas</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        h1 { color: #333; margin-bottom: 20px; }
        h2 { color: #667eea; margin-top: 25px; margin-bottom: 15px; font-size: 1.3em; }
        .check-item {
            padding: 12px;
            margin: 8px 0;
            border-left: 4px solid #ddd;
            background: #f9f9f9;
            border-radius: 5px;
        }
        .check-item.ok {
            border-left-color: #10b981;
            background: #ecfdf5;
        }
        .check-item.error {
            border-left-color: #ef4444;
            background: #fef2f2;
        }
        .check-item.warning {
            border-left-color: #f59e0b;
            background: #fffbeb;
        }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 600;
            margin-left: 10px;
            font-size: 0.9em;
        }
        .status.ok { background: #10b981; color: white; }
        .status.error { background: #ef4444; color: white; }
        .status.warning { background: #f59e0b; color: white; }
        .summary {
            margin-top: 30px;
            padding: 20px;
            border-radius: 10px;
            background: #f0f9ff;
            border: 2px solid #667eea;
        }
        .success { color: #10b981; font-weight: 600; }
        .fail { color: #ef4444; font-weight: 600; }
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✓ Teste de Configuração do Sistema de Capas</h1>
        
        <?php
        $checks = [];
        $allOk = true;

        // 1. Arquivo cover.png padrão
        $coverPath = __DIR__ . '/../assets/images/cover.png';
        if (file_exists($coverPath)) {
            $checks[] = [
                'title' => 'Imagem padrão (cover.png)',
                'status' => 'ok',
                'message' => 'Arquivo encontrado: <code>' . $coverPath . '</code>'
            ];
        } else {
            $checks[] = [
                'title' => 'Imagem padrão (cover.png)',
                'status' => 'error',
                'message' => 'Arquivo NÃO encontrado em: <code>' . $coverPath . '</code>'
            ];
            $allOk = false;
        }

        // 2. Pasta music/
        $musicDir = __DIR__ . '/../music/';
        if (is_dir($musicDir)) {
            $checks[] = [
                'title' => 'Diretório music/',
                'status' => 'ok',
                'message' => 'Diretório existe'
            ];
        } else {
            $checks[] = [
                'title' => 'Diretório music/',
                'status' => 'error',
                'message' => 'Diretório não existe'
            ];
            $allOk = false;
        }

        // 3. Pasta music/covers/ (será criada no primeiro upload)
        $coversDir = __DIR__ . '/../music/covers/';
        if (is_dir($coversDir)) {
            if (is_writable($coversDir)) {
                $checks[] = [
                    'title' => 'Diretório music/covers/',
                    'status' => 'ok',
                    'message' => 'Diretório existe e tem permissão de escrita'
                ];
            } else {
                $checks[] = [
                    'title' => 'Diretório music/covers/',
                    'status' => 'warning',
                    'message' => 'Diretório existe mas SEM permissão de escrita'
                ];
                $allOk = false;
            }
        } else {
            $checks[] = [
                'title' => 'Diretório music/covers/',
                'status' => 'warning',
                'message' => 'Diretório será criado automaticamente no primeiro upload'
            ];
        }

        // 4. Banco de dados
        try {
            require_once __DIR__ . '/../config/database.php';
            $db = new \Config\Database();
            $pdo = $db->getConnection();
            
            // Verifica colunas
            $checkSql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME = 'musicas' AND COLUMN_NAME IN ('caminho_imagem', 'tipo_imagem')";
            $stmt = $pdo->query($checkSql);
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (count($columns) === 2) {
                $checks[] = [
                    'title' => 'Colunas do banco de dados',
                    'status' => 'ok',
                    'message' => 'Colunas <code>caminho_imagem</code> e <code>tipo_imagem</code> existem'
                ];
            } else {
                $checks[] = [
                    'title' => 'Colunas do banco de dados',
                    'status' => 'error',
                    'message' => 'Colunas não encontradas. Execute: <code>php scripts/add_cover_migration.php</code>'
                ];
                $allOk = false;
            }
        } catch (Exception $e) {
            $checks[] = [
                'title' => 'Conexão com banco de dados',
                'status' => 'error',
                'message' => 'Erro: ' . $e->getMessage()
            ];
            $allOk = false;
        }

        // 5. Arquivo de upload form
        $uploadFormPath = __DIR__ . '/../views/upload.php';
        $uploadFormContent = file_get_contents($uploadFormPath);
        if (strpos($uploadFormContent, 'coverImage') !== false) {
            $checks[] = [
                'title' => 'Formulário de upload',
                'status' => 'ok',
                'message' => 'Campo <code>coverImage</code> encontrado no formulário'
            ];
        } else {
            $checks[] = [
                'title' => 'Formulário de upload',
                'status' => 'error',
                'message' => 'Campo <code>coverImage</code> NÃO encontrado no formulário'
            ];
            $allOk = false;
        }

        // 6. JavaScript Upload
        $uploadJsPath = __DIR__ . '/../assets/js/upload.js';
        $uploadJsContent = file_get_contents($uploadJsPath);
        if (strpos($uploadJsContent, 'coverImageInput') !== false) {
            $checks[] = [
                'title' => 'JavaScript (upload.js)',
                'status' => 'ok',
                'message' => 'Suporte a capas encontrado no upload.js'
            ];
        } else {
            $checks[] = [
                'title' => 'JavaScript (upload.js)',
                'status' => 'error',
                'message' => 'Suporte a capas NÃO encontrado no upload.js'
            ];
            $allOk = false;
        }

        // Exibir resultados
        foreach ($checks as $check) {
            $class = 'check-item ' . $check['status'];
            $statusText = match($check['status']) {
                'ok' => '✓',
                'error' => '✗',
                'warning' => '⚠'
            };
            $statusClass = 'status ' . $check['status'];
            echo "<div class=\"$class\">";
            echo "<strong>{$check['title']}</strong>";
            echo "<span class=\"$statusClass\">{$statusText}</span>";
            echo "<br><small>{$check['message']}</small>";
            echo "</div>";
        }

        // Resumo final
        echo '<div class="summary">';
        if ($allOk) {
            echo '<p class="success">✓ Sistema de capas está totalmente configurado!</p>';
            echo '<p>Você pode fazer upload de músicas com capas sem problemas.</p>';
        } else {
            echo '<p class="fail">✗ Verifique os erros acima antes de usar o sistema</p>';
        }
        echo '</div>';
        ?>
    </div>
</body>
</html>
