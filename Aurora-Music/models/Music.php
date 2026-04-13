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

    /**
     * Deleta o registro do banco E os arquivos físicos (mp3 + capa).
     */
    public function delete(int $id, int $userId): bool
    {
        try {
            // 1. Busca os caminhos físicos ANTES de deletar do banco
            $query = "SELECT caminho_arquivo, caminho_imagem
                      FROM {$this->table}
                      WHERE id = :id AND usuario_id = :usuario_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                return false;
            }

            // 2. Deleta do banco
            $del = $this->conn->prepare(
                "DELETE FROM {$this->table} WHERE id = :id AND usuario_id = :usuario_id"
            );
            $del->bindValue(':id', $id, PDO::PARAM_INT);
            $del->bindValue(':usuario_id', $userId, PDO::PARAM_INT);
            $ok = $del->execute();

            if (!$ok) {
                return false;
            }

            // 3. Apaga o arquivo de áudio físico
            if (!empty($row['caminho_arquivo'])) {
                $absAudio = __DIR__ . '/../' . $row['caminho_arquivo'];
                if (file_exists($absAudio)) {
                    @unlink($absAudio);
                }
            }

            // 4. Apaga a capa física (somente se for da pasta covers/,
            //    nunca apaga imagens padrão como cover.png)
            if (!empty($row['caminho_imagem'])) {
                $absCover = __DIR__ . '/../' . $row['caminho_imagem'];
                $isDefaultCover = in_array(basename($absCover), ['cover.png', 'default.png']);
                if (!$isDefaultCover && file_exists($absCover)) {
                    @unlink($absCover);
                }
            }

            return true;

        } catch (PDOException $e) {
            error_log("Erro ao deletar música: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Varre music/ e music/covers/ e retorna arquivos sem registro no banco.
     *
     * IMPORTANTE: A pasta promo/ é COMPLETAMENTE IGNORADA por este método.
     * Os arquivos de promo são gerenciados exclusivamente pela seção Publicidade
     * (upload/delete via lixeira no dashboard). Nunca devem aparecer como órfãos.
     *
     * Também ignora arquivos .encrypted / arquivos que não sejam de mídia reconhecida.
     */
    public function getOrphanFiles(): array
    {
        try {
            $baseDir = rtrim(realpath(__DIR__ . '/..'), '/') . '/';
            $validos = [];

            // Normaliza um caminho relativo do banco em caminho absoluto sem realpath()
            $normalize = function (string $relativo) use ($baseDir): string {
                $abs = $baseDir . ltrim($relativo, '/');
                $parts = explode('/', str_replace('\\', '/', $abs));
                $resolved = [];
                foreach ($parts as $part) {
                    if ($part === '..') {
                        array_pop($resolved);
                    } elseif ($part !== '.') {
                        $resolved[] = $part;
                    }
                }
                return implode('/', $resolved);
            };

            // Caminhos válidos da tabela musicas
            $stmt = $this->conn->query(
                "SELECT caminho_arquivo, caminho_imagem FROM {$this->table}"
            );
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if (!empty($row['caminho_arquivo'])) {
                    $validos[] = $normalize($row['caminho_arquivo']);
                }
                if (!empty($row['caminho_imagem'])) {
                    $validos[] = $normalize($row['caminho_imagem']);
                }
            }

            $validos    = array_unique($validos);
            $orfaos     = [];
            $bytesTotal = 0;

            // Arquivos que nunca devem ser apagados
            $protegidos = ['index.php', '.htaccess', 'default.png', 'cover.png'];

            // ATENÇÃO: promo/ foi REMOVIDA desta lista intencionalmente.
            // Os arquivos de promo são gerenciados pelo módulo Publicidade.
            $pastas = [
                'music/'        => $baseDir . 'music/',
                'music/covers/' => $baseDir . 'music/covers/',
            ];

            foreach ($pastas as $prefixo => $caminhoAbsoluto) {
                if (!is_dir($caminhoAbsoluto)) continue;

                // Busca apenas extensões de mídia reconhecidas (não pega .encrypted etc.)
                $arquivos = glob(
                    $caminhoAbsoluto . '{*.mp3,*.wav,*.ogg,*.jpg,*.jpeg,*.png,*.gif,*.webp}',
                    GLOB_BRACE
                ) ?: [];

                foreach ($arquivos as $arquivo) {
                    $nomeBase = basename($arquivo);

                    $absNormalizado = rtrim(
                        str_replace('\\', '/', $arquivo),
                        '/'
                    );

                    if (
                        !in_array($nomeBase, $protegidos, true) &&
                        !in_array($absNormalizado, $validos, true)
                    ) {
                        $bytes = (int)filesize($arquivo);
                        $orfaos[] = [
                            'nome'             => $prefixo . $nomeBase,
                            'caminho_relativo' => $prefixo . $nomeBase,
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
     * Deleta fisicamente os arquivos órfãos encontrados.
     */
    public function deleteOrphanFiles(): array
    {
        $scan           = $this->getOrphanFiles();
        $deletados      = [];
        $erros          = [];
        $bytesLiberados = 0;
        $baseDir        = rtrim(realpath(__DIR__ . '/..'), '/') . '/';

        foreach ($scan['arquivos'] as $orfao) {
            $abs = $baseDir . $orfao['caminho_relativo'];
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