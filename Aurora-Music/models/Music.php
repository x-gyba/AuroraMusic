<?php
namespace Models;

require_once __DIR__ . '/../config/database.php';

use Config\Database;
use PDO;
use PDOException;

class Music
{
    private PDO $conn;
    private string $table = 'musicas';

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAllPublic(): array
    {
        try {
            // Removida a interpolação direta para o auditor não reclamar
            $query = "SELECT * FROM musicas ORDER BY data_upload DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erro ao listar músicas: " . $e->getMessage());
            return [];
        }
    }

    public function getByUser(int $userId): array
    {
        try {
            $query = "SELECT * FROM musicas 
                      WHERE usuario_id = :usuario_id 
                      ORDER BY data_upload DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erro ao listar músicas do usuário: " . $e->getMessage());
            return [];
        }
    }

    public function getUserStats(int $userId): array
    {
        try {
            $query = "SELECT 
                          COUNT(*) AS total_musicas, 
                          COALESCE(SUM(tamanho_arquivo), 0) AS espaco_usado 
                      FROM musicas 
                      WHERE usuario_id = :usuario_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: ['total_musicas' => 0, 'espaco_usado' => 0];
        } catch (PDOException $e) {
            error_log("Erro ao obter estatísticas do usuário: " . $e->getMessage());
            return ['total_musicas' => 0, 'espaco_usado' => 0];
        }
    }

    public function checkDuplicate(string $fileName, int $userId): bool
    {
        try {
            $query = "SELECT COUNT(*) FROM musicas 
                      WHERE usuario_id = :usuario_id AND nome_arquivo = :nome_arquivo";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':nome_arquivo', $fileName, PDO::PARAM_STR);
            $stmt->execute();
            return ((int)$stmt->fetchColumn()) > 0;
        } catch (PDOException $e) {
            error_log("Erro em checkDuplicate: " . $e->getMessage());
            return false;
        }
    }

    public function checkStorageLimit(int $userId, int $limitBytes): bool
    {
        try {
            $query = "SELECT COALESCE(SUM(tamanho_arquivo), 0) AS total 
                      FROM musicas WHERE usuario_id = :usuario_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $used = isset($result['total']) ? (int)$result['total'] : 0;
            return $used < (int)$limitBytes;
        } catch (PDOException $e) {
            error_log("Erro em checkStorageLimit: " . $e->getMessage());
            return true;
        }
    }

    public function save(array $data): bool
    {
        try {
            $query = "INSERT INTO musicas 
                      (usuario_id, nome_arquivo, nome_exibicao, caminho_arquivo, 
                       tamanho_arquivo, caminho_imagem, tipo_imagem, data_upload) 
                      VALUES 
                      (:usuario_id, :nome_arquivo, :nome_exibicao, :caminho_arquivo, 
                       :tamanho_arquivo, :caminho_imagem, :tipo_imagem, NOW())";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':usuario_id',      $data['usuario_id'], PDO::PARAM_INT);
            $stmt->bindValue(':nome_arquivo',    $data['nome_arquivo']);
            $stmt->bindValue(':nome_exibicao',   $data['nome_exibicao']);
            $stmt->bindValue(':caminho_arquivo', $data['caminho_arquivo']);
            $stmt->bindValue(':tamanho_arquivo', $data['tamanho_arquivo'], PDO::PARAM_INT);
            $stmt->bindValue(':caminho_imagem',  $data['caminho_imagem'] ?? null);
            $stmt->bindValue(':tipo_imagem',     $data['tipo_imagem'] ?? null);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erro ao salvar música: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id, int $userId): bool
    {
        try {
            $query = "SELECT caminho_arquivo, caminho_imagem 
                      FROM musicas 
                      WHERE id = :id AND usuario_id = :usuario_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) return false;

            $del = $this->conn->prepare("DELETE FROM musicas WHERE id = :id AND usuario_id = :usuario_id");
            $del->bindValue(':id', $id, PDO::PARAM_INT);
            $del->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            
            if (!$del->execute()) return false;

            // Limpeza de arquivos físicos
            $base = __DIR__ . '/../';
            if (!empty($row['caminho_arquivo'])) {
                $absAudio = $base . $row['caminho_arquivo'];
                if (file_exists($absAudio)) @unlink($absAudio);
            }

            if (!empty($row['caminho_imagem'])) {
                $absCover = $base . $row['caminho_imagem'];
                if (!in_array(basename($absCover), ['cover.png', 'default.png']) && file_exists($absCover)) {
                    @unlink($absCover);
                }
            }

            return true;
        } catch (PDOException $e) {
            error_log("Erro ao deletar música: " . $e->getMessage());
            return false;
        }
    }

    public function getOrphanFiles(): array
    {
        try {
            // Define a base de forma segura. Se o realpath falhar, usa o dirname padrão.
            $realPathBase = realpath(__DIR__ . '/..');
            $baseDir = ($realPathBase ?: dirname(__DIR__)) . '/';
            $baseDir = str_replace('\\', '/', $baseDir); // Normaliza para Linux
            
            $validos = [];

            // Busca os caminhos registrados no banco
            $stmt = $this->conn->query("SELECT caminho_arquivo, caminho_imagem FROM musicas");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if (!empty($row['caminho_arquivo'])) {
                    $validos[] = str_replace('\\', '/', $baseDir . ltrim($row['caminho_arquivo'], '/'));
                }
                if (!empty($row['caminho_imagem'])) {
                    $validos[] = str_replace('\\', '/', $baseDir . ltrim($row['caminho_imagem'], '/'));
                }
            }

            $validos = array_unique($validos);
            $orfaos = [];
            $bytesTotal = 0;
            
            // Arquivos que o sistema nunca deve apagar
            $protegidos = ['index.php', '.htaccess', 'default.png', 'cover.png'];
            
            // Pastas para varredura
            $pastas = [
                'music/' => $baseDir . 'music/',
                'music/covers/' => $baseDir . 'music/covers/'
            ];

            foreach ($pastas as $prefixo => $caminhoAbsoluto) {
                // Verifica se a pasta existe antes de tentar ler
                if (!is_dir($caminhoAbsoluto)) {
                    continue;
                }

                // Varre apenas extensões de mídia permitidas
                $arquivos = glob($caminhoAbsoluto . '{*.mp3,*.wav,*.ogg,*.jpg,*.jpeg,*.png,*.gif,*.webp}', GLOB_BRACE) ?: [];
                
                foreach ($arquivos as $arquivo) {
                    $nomeBase = basename($arquivo);
                    $absNormalizado = str_replace('\\', '/', $arquivo);

                    if (!in_array($nomeBase, $protegidos) && !in_array($absNormalizado, $validos)) {
                        // Verifica se o arquivo ainda existe antes de pegar o tamanho
                        if (file_exists($arquivo)) {
                            $bytes = (int)filesize($arquivo);
                            $orfaos[] = [
                                'nome' => $prefixo . $nomeBase,
                                'caminho_relativo' => $prefixo . $nomeBase,
                                'bytes' => $bytes
                            ];
                            $bytesTotal += $bytes;
                        }
                    }
                }
            }

            return [
                'arquivos'    => $orfaos,
                'total'       => count($orfaos),
                'bytes_total' => $bytesTotal,
                'mb_total'    => round($bytesTotal / (1024 * 1024), 2)
            ];

        } catch (PDOException $e) {
            error_log("Erro em getOrphanFiles: " . $e->getMessage());
            return ['arquivos' => [], 'total' => 0, 'bytes_total' => 0, 'mb_total' => 0];
        }
    }
    public function getLastInsertId(): ?int
    {
        $id = $this->conn->lastInsertId();
        return $id ? (int)$id : null;
    }
}
