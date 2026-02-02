<?php
/**
 * Music.php
 * Model de Música - Infogyba 2026
 */

// Carrega o Database.php com o caminho correto
require_once __DIR__ . '/../config/database.php';

use Config\Database;

class Music {
    private $conn;
    private $table = 'musicas';
    
    public $id;
    public $usuario_id;
    public $nome_arquivo;
    public $nome_exibicao;
    public $caminho_arquivo;
    public $tamanho_arquivo;
    public $data_upload;

    /**
     * Construtor
     */
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Verifica se já existe arquivo com o mesmo nome para o usuário
     */
    public function checkDuplicate($fileName, $userId) {
        try {
            $query = "SELECT COUNT(*) as total 
                      FROM {$this->table} 
                      WHERE nome_arquivo = :nome_arquivo 
                      AND usuario_id = :usuario_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':nome_arquivo', $fileName);
            $stmt->bindParam(':usuario_id', $userId);
            $stmt->execute();
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return ($row['total'] > 0);
        } catch (PDOException $e) {
            error_log("Erro ao verificar duplicidade: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Verifica limite de armazenamento do usuário
     */
    public function checkStorageLimit($userId, $maxStorage) {
        try {
            $query = "SELECT COALESCE(SUM(tamanho_arquivo), 0) as total_usado 
                      FROM {$this->table} 
                      WHERE usuario_id = :usuario_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':usuario_id', $userId);
            $stmt->execute();
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return ($row['total_usado'] < $maxStorage);
        } catch (PDOException $e) {
            error_log("Erro ao verificar limite de armazenamento: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Salva uma nova música no banco
     */
    public function save($data) {
        try {
            $query = "INSERT INTO {$this->table} 
                      (usuario_id, nome_arquivo, nome_exibicao, caminho_arquivo, tamanho_arquivo, data_upload) 
                      VALUES 
                      (:usuario_id, :nome_arquivo, :nome_exibicao, :caminho_arquivo, :tamanho_arquivo, NOW())";
            
            $stmt = $this->conn->prepare($query);
            
            // Bind dos parâmetros
            $stmt->bindParam(':usuario_id', $data['usuario_id'], PDO::PARAM_INT);
            $stmt->bindParam(':nome_arquivo', $data['nome_arquivo']);
            $stmt->bindParam(':nome_exibicao', $data['nome_exibicao']);
            // Salva o caminho RELATIVO (Web Path)
            $stmt->bindParam(':caminho_arquivo', $data['caminho_arquivo']); 
            $stmt->bindParam(':tamanho_arquivo', $data['tamanho_arquivo'], PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                return true;
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erro ao salvar música: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Lista todas as músicas de um usuário
     */
    public function getByUser($userId) {
        try {
            $query = "SELECT * FROM {$this->table} 
                      WHERE usuario_id = :usuario_id 
                      ORDER BY data_upload DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':usuario_id', $userId);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erro ao listar músicas: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Busca uma música por ID
     */
    public function getById($id, $userId) {
        try {
            $query = "SELECT * FROM {$this->table} 
                      WHERE id = :id 
                      AND usuario_id = :usuario_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':usuario_id', $userId);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erro ao buscar música: " . $e->getMessage());
            return null;
        }
    }

    /* Lista todas as músicas públicas (para a página inicial) */
    public function getAllPublic() {
        try {
            $query = "SELECT id, usuario_id, nome_arquivo, nome_exibicao, 
                             caminho_arquivo, tamanho_arquivo, data_upload 
                      FROM {$this->table} 
                      ORDER BY data_upload DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erro ao listar músicas públicas: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Deleta uma música (Revisão da exclusão do arquivo físico)
     */
    public function delete($id, $userId) {
        try {
            // 1. Busca os dados da música
            $music = $this->getById($id, $userId);
            
            if (!$music) {
                return false;
            }
            
            // --- CORREÇÃO: Reconstruir o caminho ABSOLUTO para o unlink() ---
            // O caminho no DB é relativo (ex: 'music/nome.mp3').
            // dirname(__DIR__) aponta para a raiz do projeto (Music-MVC/)
            $baseDir = dirname(__DIR__) . DIRECTORY_SEPARATOR; 
            $fullPath = $baseDir . $music['caminho_arquivo']; 
            // ------------------------------------------------------------------

            // 2. Deleta do banco
            $query = "DELETE FROM {$this->table} 
                      WHERE id = :id 
                      AND usuario_id = :usuario_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':usuario_id', $userId);
            
            if ($stmt->execute()) {
                // 3. Deleta o arquivo físico, usando o caminho ABSOLUTO
                if (file_exists($fullPath)) {
                    if (unlink($fullPath)) {
                        error_log("Arquivo deletado com sucesso: " . $fullPath);
                    } else {
                        // Isso é um erro de permissão ou falha no sistema de arquivos
                        error_log("ERRO DE PERMISSÃO/FS: Falha ao deletar arquivo: " . $fullPath);
                    }
                } else {
                    error_log("Aviso: Arquivo físico não encontrado em: " . $fullPath);
                }
                
                return true;
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erro ao deletar música do DB: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Atualiza informações de uma música
     */
    public function update($id, $userId, $data) {
        try {
            $query = "UPDATE {$this->table} 
                      SET nome_exibicao = :nome_exibicao 
                      WHERE id = :id 
                      AND usuario_id = :usuario_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':usuario_id', $userId);
            $stmt->bindParam(':nome_exibicao', $data['nome_exibicao']);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erro ao atualizar música: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtém estatísticas do usuário (CORRIGIDO)
     */
    public function getUserStats($userId) {
        try {
            $query = "SELECT 
                        COUNT(id) as total_musicas,
                        COALESCE(SUM(tamanho_arquivo), 0) as espaco_usado
                      FROM {$this->table} 
                      WHERE usuario_id = :usuario_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':usuario_id', $userId);
            
            if ($stmt->execute()) {
                // Retorna a linha associativa contendo os dois campos
                return $stmt->fetch(PDO::FETCH_ASSOC);
            }
            
            return [
                'total_musicas' => 0,
                'espaco_usado' => 0
            ];

        } catch (PDOException $e) {
            error_log("Erro ao obter estatísticas: " . $e->getMessage());
            return [
                'total_musicas' => 0,
                'espaco_usado' => 0
            ];
        }
    }
}