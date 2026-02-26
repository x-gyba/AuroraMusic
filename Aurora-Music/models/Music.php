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

    public function save(array $data): bool
    {
        try {
            $query = "INSERT INTO {$this->table}
                      (usuario_id, nome_arquivo, nome_exibicao, caminho_arquivo, tamanho_arquivo, data_upload)
                      VALUES
                      (:usuario_id, :nome_arquivo, :nome_exibicao, :caminho_arquivo, :tamanho_arquivo, NOW())";

            $stmt = $this->conn->prepare($query);

            $stmt->bindValue(':usuario_id', $data['usuario_id'], PDO::PARAM_INT);
            $stmt->bindValue(':nome_arquivo', $data['nome_arquivo']);
            $stmt->bindValue(':nome_exibicao', $data['nome_exibicao']);
            $stmt->bindValue(':caminho_arquivo', $data['caminho_arquivo']);
            $stmt->bindValue(':tamanho_arquivo', $data['tamanho_arquivo'], PDO::PARAM_INT);

            return $stmt->execute();

        } catch (PDOException $e) {
            error_log("Erro ao salvar música: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id, int $userId): bool
    {
        try {
            $query = "DELETE FROM {$this->table}
                      WHERE id = :id
                      AND usuario_id = :usuario_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);

            return $stmt->execute();

        } catch (PDOException $e) {
            error_log("Erro ao deletar música: " . $e->getMessage());
            return false;
        }
    }
}
