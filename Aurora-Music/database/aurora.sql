-- ============================================================
-- Aurora Music - Banco de Dados
-- Database creation script com suporte completo a capas
-- ============================================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS aurora_music CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aurora_music;

-- ============================================================
-- Tabela: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP NULL DEFAULT NULL,
    ativo TINYINT(1) DEFAULT 1,
    INDEX idx_email (email),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabela: musicas
-- ============================================================
CREATE TABLE IF NOT EXISTS musicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    nome_exibicao VARCHAR(255) NOT NULL,
    caminho_arquivo VARCHAR(500) NOT NULL,
    tamanho_arquivo BIGINT NOT NULL,
    caminho_imagem VARCHAR(500) NULL DEFAULT NULL,
    tipo_imagem ENUM('jpg', 'png', 'gif', 'webp') NULL DEFAULT NULL,
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ativo TINYINT(1) DEFAULT 1,
    
    -- Foreign Key
    CONSTRAINT fk_musicas_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_data_upload (data_upload),
    INDEX idx_ativo (ativo),
    INDEX idx_caminho_imagem (caminho_imagem),
    
    -- Unique constraint para evitar duplicatas por usuário
    UNIQUE KEY uk_usuario_arquivo (usuario_id, nome_arquivo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabela: visitantes
-- ============================================================
CREATE TABLE IF NOT EXISTS visitantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    pagina VARCHAR(255) DEFAULT 'desconhecida',
    navegador VARCHAR(100) DEFAULT 'Desconhecido',
    sistema_operacional VARCHAR(100) DEFAULT 'Desconhecido',
    data_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para queries comuns
    INDEX idx_data_acesso (data_acesso),
    INDEX idx_ip_address (ip_address),
    INDEX idx_pagina (pagina)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Dados de exemplo (opcional)
-- ============================================================

-- Usuário de teste
INSERT INTO usuarios (nome, email, senha, ativo) 
VALUES (
    'Administrador',
    'admin@infogyba.com',
    '$2y$10$CEXAMPLE_HASH_AQUI',  -- Alterar com hash real bcrypt
    1
) ON DUPLICATE KEY UPDATE email=VALUES(email);

-- ============================================================
-- Triggers para manutenção automática
-- ============================================================

-- Atualizar data_atualizacao na tabela musicas
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS update_musicas_timestamp 
BEFORE UPDATE ON musicas
FOR EACH ROW
BEGIN
    SET NEW.data_atualizacao = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- ============================================================
-- Views úteis (opcional)
-- ============================================================

-- View: Estatísticas de músicas por usuário
CREATE OR REPLACE VIEW vw_musicas_por_usuario AS
SELECT 
    u.id,
    u.nome,
    u.email,
    COUNT(m.id) AS total_musicas,
    COALESCE(SUM(m.tamanho_arquivo), 0) AS espaco_total_bytes,
    ROUND(COALESCE(SUM(m.tamanho_arquivo) / (1024*1024), 0), 2) AS espaco_total_mb,
    MAX(m.data_upload) AS ultima_musica_enviada
FROM usuarios u
LEFT JOIN musicas m ON u.id = m.usuario_id AND m.ativo = 1
GROUP BY u.id, u.nome, u.email;

-- View: Visitantes por data
CREATE OR REPLACE VIEW vw_visitantes_por_data AS
SELECT 
    DATE(data_acesso) AS data,
    pagina,
    COUNT(*) AS total_acessos,
    COUNT(DISTINCT ip_address) AS ips_unicos
FROM visitantes
GROUP BY DATE(data_acesso), pagina
ORDER BY DATE(data_acesso) DESC;

-- ============================================================
-- Fim do script
-- ============================================================
