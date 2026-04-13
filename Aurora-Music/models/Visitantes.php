<?php

declare(strict_types=1);

namespace Models;

require_once __DIR__ . '/../config/database.php';

use Config\Database;
use PDO;
use PDOException;

class Visitantes
{
    private PDO $db;
    private string $tabela = 'visitantes';

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    /* ============================================================
       REGISTRO DE VISITA
    ============================================================ */
    public function registrarVisita(string $pagina = "desconhecida"): bool
    {
        $sql = "INSERT INTO {$this->tabela} 
                (ip_address, pagina, navegador, sistema_operacional, data_acesso)
                VALUES (:ip, :pagina, :nav, :so, NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':ip', $this->getIpAddress(), PDO::PARAM_STR);
        $stmt->bindValue(':pagina', $pagina, PDO::PARAM_STR);
        $stmt->bindValue(':nav', $this->getBrowser(), PDO::PARAM_STR);
        $stmt->bindValue(':so', $this->getOS(), PDO::PARAM_STR);

        return $stmt->execute();
    }

    /* ============================================================
       CONTADORES (Dashboard)
    ============================================================ */
    public function countHoje(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->tabela} WHERE DATE(data_acesso) = CURDATE()";
        return (int)$this->db->query($sql)->fetchColumn();
    }

    public function countMes(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->tabela}
                WHERE MONTH(data_acesso) = MONTH(CURRENT_DATE())
                  AND YEAR(data_acesso) = YEAR(CURRENT_DATE())";
        return (int)$this->db->query($sql)->fetchColumn();
    }

    public function countTotal(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->tabela}";
        return (int)$this->db->query($sql)->fetchColumn();
    }

    /* ============================================================
       FILTROS + LISTAGEM (Paginado)
    ============================================================ */
    public function filtrar(?string $dataInicio = null, ?string $dataFim = null, int $limit = 50, int $offset = 0): array
    {
        $where = " WHERE 1=1 ";
        $params = [];

        if ($dataInicio) {
            $where .= " AND data_acesso >= :dataInicio ";
            $params[':dataInicio'] = $dataInicio . ' 00:00:00';
        }
        if ($dataFim) {
            $where .= " AND data_acesso <= :dataFim ";
            $params[':dataFim'] = $dataFim . ' 23:59:59';
        }

        $sql = "SELECT * FROM {$this->tabela} 
                $where
                ORDER BY data_acesso DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
        
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function totalFiltrado(?string $dataInicio = null, ?string $dataFim = null): int
    {
        $where = " WHERE 1=1 ";
        $params = [];

        if ($dataInicio) {
            $where .= " AND data_acesso >= :dataInicio ";
            $params[':dataInicio'] = $dataInicio . ' 00:00:00';
        }
        if ($dataFim) {
            $where .= " AND data_acesso <= :dataFim ";
            $params[':dataFim'] = $dataFim . ' 23:59:59';
        }

        $sql = "SELECT COUNT(*) FROM {$this->tabela} $where";
        $stmt = $this->db->prepare($sql);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
        
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    }

    /* ============================================================
       GRÁFICOS
    ============================================================ */
    public function graficoPorData(string $inicio, string $fim): array
    {
        $sql = "
            SELECT DATE(data_acesso) as dia, COUNT(*) AS total
            FROM {$this->tabela}
            WHERE DATE(data_acesso) BETWEEN :ini AND :fim
            GROUP BY dia
            ORDER BY dia ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':ini', $inicio, PDO::PARAM_STR);
        $stmt->bindValue(':fim', $fim, PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /* ============================================================
       MANUTENÇÃO / AÇÕES (AQUI AS CORREÇÕES)
    ============================================================ */

    /**
     * Exclui um registro individual
     */
    public function excluir(int $id): bool
    {
        try {
            $sql = "DELETE FROM {$this->tabela} WHERE id = :id"; 
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erro ao excluir visitante: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Limpa toda a tabela de visitantes (Botão Limpar Tudo)
     */
    public function limparTodos(): bool
    {
        try {
            // Tenta o TRUNCATE primeiro (mais rápido e reseta IDs)
            $sql = "TRUNCATE TABLE {$this->tabela}"; 
            return $this->db->exec($sql) !== false;
        } catch (PDOException $e) {
            // Fallback para DELETE caso o banco não aceite TRUNCATE (ex: chaves estrangeiras)
            try {
                $sql = "DELETE FROM {$this->tabela}";
                return $this->db->exec($sql) !== false;
            } catch (PDOException $ex) {
                error_log("Erro crítico ao limpar visitantes: " . $ex->getMessage());
                return false;
            }
        }
    }

    /* ============================================================
       DETECÇÃO DE IP / NAVEGADOR / SO
    ============================================================ */
    private function getIpAddress(): string
    {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        if (strpos($ip, ',') !== false) {
            $ip = trim(explode(',', $ip)[0]);
        }
        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
    }

    private function getBrowser(): string
    {
        $ua = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');
        if (strpos($ua, 'edg') !== false) return 'Edge';
        if (strpos($ua, 'chrome') !== false) return 'Chrome';
        if (strpos($ua, 'firefox') !== false) return 'Firefox';
        if (strpos($ua, 'safari') !== false) return 'Safari';
        if (strpos($ua, 'opera') !== false || strpos($ua, 'opr') !== false) return 'Opera';
        return 'Outros';
    }

    private function getOS(): string
    {
        $ua = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');
        if (strpos($ua, 'android') !== false) return 'Android';
        if (strpos($ua, 'iphone') !== false || strpos($ua, 'ipad') !== false) return 'iOS';
        if (strpos($ua, 'win') !== false) return 'Windows';
        if (strpos($ua, 'mac') !== false) return 'MacOS';
        if (strpos($ua, 'linux') !== false) return 'Linux';
        return 'Outros';
    }
}