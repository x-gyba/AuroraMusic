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
            $query = "SELECT * FROM {$this->table} ORDER BY data_upload DESC";
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
            $query = "SELECT * FROM {$this->table}
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

    /**
     * Retorna uma música específica pelo ID.
     * Útil para recuperar informações antes de deletar (caminhos dos arquivos).
     *
     * @param int $id
     * @param int $userId
     * @return array|null
     */
    public function getById(int $id, int $userId): ?array
    {
        try {
            $query = "SELECT * FROM {$this->table}
                      WHERE id = :id
                      AND usuario_id = :usuario_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;

        } catch (PDOException $e) {
            error_log("Erro ao obter música por ID: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Retorna estatísticas básicas de um usuário:
     * total de músicas e espaço ocupado em bytes.
     *
     * @param int $userId
     * @return array ['total_musicas' => int, 'espaco_usado' => int]
     */
    public function getUserStats(int $userId): array
    {
        try {
            $query = "SELECT
                          COUNT(*) AS total_musicas,
                          COALESCE(SUM(tamanho_arquivo),0) AS espaco_usado
                      FROM {$this->table}
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

    /**
     * Verifica se o usuário já possui um arquivo com o mesmo nome.
     * Retorna true se existir duplicado (mesmo nome de arquivo para o usuário).
     *
     * @param string $fileName
     * @param int $userId
     * @return bool
     */
    public function checkDuplicate(string $fileName, int $userId): bool
    {
        try {
            $query = "SELECT COUNT(*) FROM {$this->table} WHERE usuario_id = :usuario_id AND nome_arquivo = :nome_arquivo";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':nome_arquivo', $fileName, PDO::PARAM_STR);
            $stmt->execute();

            return ((int)$stmt->fetchColumn()) > 0;
        } catch (PDOException $e) {
            error_log("Erro em checkDuplicate: " . $e->getMessage());
            // Em caso de erro, assume-se que não há duplicado para não bloquear o upload
            return false;
        }
    }

    /**
     * Verifica se o usuário ainda possui espaço disponível.
     * Retorna true se o total atual for menor que $limitBytes.
     *
     * @param int $userId
     * @param int $limitBytes
     * @return bool
     */
    public function checkStorageLimit(int $userId, int $limitBytes): bool
    {
        try {
            $query = "SELECT COALESCE(SUM(tamanho_arquivo),0) AS total FROM {$this->table} WHERE usuario_id = :usuario_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $used = isset($result['total']) ? (int)$result['total'] : 0;

            return $used < (int)$limitBytes;
        } catch (PDOException $e) {
            error_log("Erro em checkStorageLimit: " . $e->getMessage());
            // Em caso de erro, não bloquear por segurança
            return true;
        }
    }

    public function save(array $data): bool
    {
        try {
            $query = "INSERT INTO {$this->table}
                      (usuario_id, nome_arquivo, nome_exibicao, caminho_arquivo, tamanho_arquivo, caminho_imagem, tipo_imagem, data_upload)
                      VALUES
                      (:usuario_id, :nome_arquivo, :nome_exibicao, :caminho_arquivo, :tamanho_arquivo, :caminho_imagem, :tipo_imagem, NOW())";

            $stmt = $this->conn->prepare($query);

            $stmt->bindValue(':usuario_id', $data['usuario_id'], PDO::PARAM_INT);
            $stmt->bindValue(':nome_arquivo', $data['nome_arquivo']);
            $stmt->bindValue(':nome_exibicao', $data['nome_exibicao']);
            $stmt->bindValue(':caminho_arquivo', $data['caminho_arquivo']);
            $stmt->bindValue(':tamanho_arquivo', $data['tamanho_arquivo'], PDO::PARAM_INT);
            $stmt->bindValue(':caminho_imagem', $data['caminho_imagem'] ?? null);
            $stmt->bindValue(':tipo_imagem', $data['tipo_imagem'] ?? null);

            return $stmt->execute();

        } catch (PDOException $e) {
            error_log("Erro ao salvar música: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id, int $userId): bool
    {
        try {
            // Primeiro, recupera o registro para pegar os caminhos dos arquivos
            $query = "SELECT caminho_arquivo, caminho_imagem FROM {$this->table}
                      WHERE id = :id
                      AND usuario_id = :usuario_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            $music = $stmt->fetch(PDO::FETCH_ASSOC);

            // Deleta o registro do banco de dados
            $deleteQuery = "DELETE FROM {$this->table}
                          WHERE id = :id
                          AND usuario_id = :usuario_id";

            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindValue(':id', $id, PDO::PARAM_INT);
            $deleteStmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $success = $deleteStmt->execute();

            // Se deletou do banco, tenta deletar os arquivos físicos
            if ($success && $music) {
                // Obtém o basename do arquivo
                $arquivo = basename($music['caminho_arquivo']);
                $caminhoMp3 = __DIR__ . '/../music/' . $arquivo;

                // Tenta deletar o arquivo MP3
                if (file_exists($caminhoMp3)) {
                    @unlink($caminhoMp3);
                }

                // Tenta deletar a imagem de capa se existir
                if (!empty($music['caminho_imagem'])) {
                    $caminhoImagem = __DIR__ . '/../' . $music['caminho_imagem'];
                    if (file_exists($caminhoImagem)) {
                        @unlink($caminhoImagem);
                    }
                }
            }

            return $success;

        } catch (PDOException $e) {
            error_log("Erro ao deletar música: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Retorna o último ID inserido na conexão PDO atual.
     * Útil após uma chamada a save() para obter o id do registro recém-criado.
     *
     * @return int|null
     */
    public function getLastInsertId(): ?int
    {
        try {
            $id = $this->conn->lastInsertId();
            return $id !== null && $id !== false ? (int)$id : null;
        } catch (PDOException $e) {
            error_log("Erro ao obter lastInsertId: " . $e->getMessage());
            return null;
        }
    }
}
