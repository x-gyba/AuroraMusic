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
     * Retorna estatísticas básicas de um usuário:
     * total de músicas e espaço ocupado em bytes.
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
     */
    public function checkDuplicate(string $fileName, int $userId): bool
    {
        try {
            $query = "SELECT COUNT(*) FROM {$this->table}
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

    /**
     * Verifica se o usuário ainda possui espaço disponível.
     */
    public function checkStorageLimit(int $userId, int $limitBytes): bool
    {
        try {
            $query = "SELECT COALESCE(SUM(tamanho_arquivo),0) AS total
                      FROM {$this->table} WHERE usuario_id = :usuario_id";
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
            $query = "INSERT INTO {$this->table}
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
            $query = "DELETE FROM {$this->table} WHERE id = :id AND usuario_id = :usuario_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erro ao deletar música: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Varre music/ e music/covers/ e retorna arquivos sem registro no banco (órfãos).
     *
     * Retorna:
     *   'arquivos'    => [ ['nome' => string, 'caminho_relativo' => string, 'bytes' => int], ... ]
     *   'total'       => int
     *   'bytes_total' => int
     *   'mb_total'    => float
     */
    public function getOrphanFiles(): array
    {
        try {
            $stmt = $this->conn->query(
                "SELECT caminho_arquivo, caminho_imagem FROM {$this->table}"
            );
            $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Monta conjunto de realpath válidos registrados no banco
            $validos = [];
            foreach ($registros as $row) {
                foreach (['caminho_arquivo', 'caminho_imagem'] as $campo) {
                    if (!empty($row[$campo])) {
                        $rp = realpath(__DIR__ . '/../' . $row[$campo]);
                        if ($rp) $validos[] = $rp;
                    }
                }
            }

            $orfaos     = [];
            $bytesTotal = 0;

            // Varre MP3s
            foreach (glob(__DIR__ . '/../music/*.mp3') ?: [] as $arquivo) {
                $rp = realpath($arquivo);
                if ($rp && !in_array($rp, $validos)) {
                    $bytes       = (int)filesize($arquivo);
                    $orfaos[]    = [
                        'nome'             => basename($arquivo),
                        'caminho_relativo' => 'music/' . basename($arquivo),
                        'bytes'            => $bytes,
                    ];
                    $bytesTotal += $bytes;
                }
            }

            // Varre capas
            $pastaCovers = __DIR__ . '/../music/covers/';
            if (is_dir($pastaCovers)) {
                foreach (glob($pastaCovers . '*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE) ?: [] as $arquivo) {
                    $rp = realpath($arquivo);
                    if ($rp && !in_array($rp, $validos)) {
                        $bytes       = (int)filesize($arquivo);
                        $orfaos[]    = [
                            'nome'             => 'covers/' . basename($arquivo),
                            'caminho_relativo' => 'music/covers/' . basename($arquivo),
                            'bytes'            => $bytes,
                        ];
                        $bytesTotal += $bytes;
                    }
                }
            }

            return [
                'arquivos'    => $orfaos,
                'total'       => count($orfaos),
                'bytes_total' => $bytesTotal,
                'mb_total'    => round($bytesTotal / (1024 * 1024), 2),
            ];

        } catch (PDOException $e) {
            error_log("Erro em getOrphanFiles: " . $e->getMessage());
            return ['arquivos' => [], 'total' => 0, 'bytes_total' => 0, 'mb_total' => 0];
        }
    }

    /**
     * Deleta fisicamente todos os arquivos órfãos encontrados por getOrphanFiles().
     *
     * Retorna:
     *   'deletados' => lista de nomes removidos com sucesso
     *   'erros'     => lista de nomes que falharam ao remover
     *   'total'     => int
     *   'bytes'     => int
     *   'mb'        => float
     */
    public function deleteOrphanFiles(): array
    {
        $scan           = $this->getOrphanFiles();
        $deletados      = [];
        $erros          = [];
        $bytesLiberados = 0;

        foreach ($scan['arquivos'] as $orfao) {
            $abs = __DIR__ . '/../' . $orfao['caminho_relativo'];
            if (file_exists($abs)) {
                if (@unlink($abs)) {
                    $deletados[]     = $orfao['nome'];
                    $bytesLiberados += $orfao['bytes'];
                } else {
                    $erros[] = $orfao['nome'];
                    error_log("Falha ao deletar órfão: " . $abs);
                }
            }
        }

        return [
            'deletados' => $deletados,
            'erros'     => $erros,
            'total'     => count($deletados),
            'bytes'     => $bytesLiberados,
            'mb'        => round($bytesLiberados / (1024 * 1024), 2),
        ];
    }

    /**
     * Retorna o último ID inserido na conexão PDO atual.
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