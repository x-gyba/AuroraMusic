-- ============================================================
-- Aurora Music - Banco de Dados
-- ============================================================

CREATE DATABASE IF NOT EXISTS `aurora_music` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `aurora_music`;

-- ============================================================
-- Tabela: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_acesso` timestamp NULL DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabela: musicas
-- ============================================================
CREATE TABLE IF NOT EXISTS `musicas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `nome_arquivo` varchar(255) NOT NULL,
  `nome_exibicao` varchar(255) NOT NULL,
  `caminho_arquivo` varchar(500) NOT NULL,
  `tamanho_arquivo` bigint(20) NOT NULL,
  `caminho_imagem` varchar(500) DEFAULT NULL,
  `tipo_imagem` enum('jpg','png','gif','webp') DEFAULT NULL,
  `data_upload` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_arquivo` (`usuario_id`,`nome_arquivo`),
  KEY `fk_musicas_usuario` (`usuario_id`),
  KEY `idx_data_upload` (`data_upload`),
  KEY `idx_ativo` (`ativo`),
  CONSTRAINT `fk_musicas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabela: visitantes
-- ============================================================
CREATE TABLE IF NOT EXISTS `visitantes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `pagina` varchar(255) DEFAULT 'desconhecida',
  `navegador` varchar(100) DEFAULT 'Desconhecido',
  `sistema_operacional` varchar(100) DEFAULT 'Desconhecido',
  `data_acesso` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_data_acesso` (`data_acesso`),
  KEY `idx_ip_address` (`ip_address`),
  KEY `idx_pagina` (`pagina`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabela: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `status` enum('ativo','inativo') DEFAULT 'ativo',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_clientes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabela: clientes_historico
-- ============================================================
CREATE TABLE IF NOT EXISTS `clientes_historico` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `acao` enum('criacao','edicao','exclusao','reativacao') NOT NULL,
  `dados_anteriores` longtext DEFAULT NULL CHECK (json_valid(`dados_anteriores`)),
  `dados_novos` longtext DEFAULT NULL CHECK (json_valid(`dados_novos`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cliente` (`cliente_id`),
  KEY `idx_usuario_hist` (`usuario_id`),
  CONSTRAINT `fk_historico_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_historico_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabela: tentativas_login
-- ============================================================
CREATE TABLE IF NOT EXISTS `tentativas_login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `success` tinyint(1) DEFAULT 0,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_usuario` (`usuario`),
  KEY `idx_attempted_at` (`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabela: estatisticas_diarias
-- ============================================================
CREATE TABLE IF NOT EXISTS `estatisticas_diarias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data` date NOT NULL,
  `total_visitas` int(11) DEFAULT 0,
  `visitantes_unicos` int(11) DEFAULT 0,
  `paginas_vistas` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_data` (`data`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Dados de Exemplo
-- ============================================================
INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `data_criacao`, `ultimo_acesso`, `ativo`) VALUES
(5, 'Admin', 'infogyba@devel.com', '$2y$12$4d1V/wek4cRjTBUWRqBTQOEtH/7CNkJuhTN8.6JzlATfnqhguPYhG', '2025-11-24 18:35:11', NULL, 1),
(6, 'Infogyba', 'infogyba@devel.com', '$2y$12$RRWgaW4ZQShXtcxXIeOv9OXpuk/I/Z.0Gnv12OBt6FZZgfY3xJEXC', '2025-11-24 18:35:54', '2025-12-10 18:24:23', 1);

-- Ajustar AUTO_INCREMENT
ALTER TABLE `usuarios` AUTO_INCREMENT = 7;

INSERT INTO `tentativas_login` (`usuario`, `ip_address`, `success`, `attempted_at`) VALUES
('infogyba', '127.0.0.1', 0, '2025-11-24 18:33:58'),
('infogyba', '127.0.0.1', 1, '2025-11-24 18:36:22'),
('infogyba', '127.0.0.1', 1, '2025-12-06 21:13:22'),
('infogyba', '127.0.0.1', 1, '2025-12-06 21:25:32'),
('infogyba', '127.0.0.1', 1, '2025-12-06 21:40:19'),
('infogyba', '::1', 1, '2025-12-06 21:47:22'),
('infogyba', '::1', 1, '2025-12-10 17:39:54'),
('infogyba', '::1', 1, '2025-12-10 17:51:58'),
('infogyba', '::1', 1, '2025-12-10 17:54:51'),
('infogyba', '::1', 1, '2025-12-10 18:05:32'),
('infogyba', '::1', 1, '2025-12-10 18:11:03'),
('infogyba', '::1', 1, '2025-12-10 18:16:28'),
('infogyba', '::1', 1, '2025-12-10 18:24:23');

-- ============================================================
-- Views úteis
-- ============================================================

-- View: Estatísticas de músicas por usuário
CREATE OR REPLACE VIEW `vw_musicas_por_usuario` AS
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
CREATE OR REPLACE VIEW `vw_visitantes_por_data` AS
SELECT 
    DATE(data_acesso) AS data,
    pagina,
    COUNT(*) AS total_acessos,
    COUNT(DISTINCT ip_address) AS ips_unicos
FROM visitantes
GROUP BY DATE(data_acesso), pagina
ORDER BY DATE(data_acesso) DESC;
