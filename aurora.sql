CREATE DATABASE IF NOT EXISTS `music` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `music`;

CREATE TABLE `clientes` (
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
  KEY `idx_nome` (`nome`),
  KEY `idx_status` (`status`),
  FULLTEXT KEY `idx_busca` (`nome`,`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_uk` (`usuario`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `clientes_historico` (
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
  KEY `idx_data` (`created_at`),
  KEY `idx_usuario_hist` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `estatisticas_diarias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data` date NOT NULL,
  `total_visitas` int(11) DEFAULT 0,
  `visitantes_unicos` int(11) DEFAULT 0,
  `paginas_vistas` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_data` (`data`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `musicas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `nome_arquivo` varchar(255) NOT NULL,
  `nome_exibicao` varchar(255) NOT NULL,
  `caminho_arquivo` varchar(500) NOT NULL,
  `tamanho_arquivo` bigint(20) NOT NULL,
  `data_upload` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_caminho` (`caminho_arquivo`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_data` (`data_upload`),
  FULLTEXT KEY `idx_busca` (`nome_exibicao`,`nome_arquivo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tentativas_login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `success` tinyint(1) DEFAULT 0,
  `attempted_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_usuario` (`usuario`),
  KEY `idx_attempted_at` (`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `visitantes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `pagina` varchar(255) DEFAULT '/',
  `referrer` varchar(500) DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `dispositivo` varchar(50) DEFAULT NULL,
  `navegador` varchar(100) DEFAULT NULL,
  `sistema_operacional` varchar(100) DEFAULT NULL,
  `data_acesso` datetime NOT NULL DEFAULT current_timestamp(),
  `session_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ip` (`ip_address`),
  KEY `idx_data` (`data_acesso`),
  KEY `idx_pagina` (`pagina`),
  KEY `idx_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`id`, `usuario`, `senha`, `email`, `created_at`, `updated_at`, `last_login`, `status`) VALUES
(5, 'admin', '$2y$12$4d1V/wek4cRjTBUWRqBTQOEtH/7CNkJuhTN8.6JzlATfnqhguPYhG', 'infogyba@devel.com', '2025-11-24 18:35:11', '2025-11-24 18:35:11', NULL, 'active'),
(6, 'infogyba', '$2y$12$RRWgaW4ZQShXtcxXIeOv9OXpuk/I/Z.0Gnv12OBt6FZZgfY3xJEXC', 'infogyba@devel.com', '2025-11-24 18:35:54', '2025-12-10 18:24:23', '2025-12-10 18:24:23', 'active');

INSERT INTO `tentativas_login` (`id`, `usuario`, `ip_address`, `success`, `attempted_at`) VALUES
(39, 'infogyba', '127.0.0.1', 0, '2025-11-24 18:33:58'),
(40, 'infogyba', '127.0.0.1', 1, '2025-11-24 18:36:22'),
(41, 'infogyba', '127.0.0.1', 1, '2025-12-06 21:13:22'),
(42, 'infogyba', '127.0.0.1', 1, '2025-12-06 21:25:32'),
(43, 'infogyba', '127.0.0.1', 1, '2025-12-06 21:40:19'),
(44, 'infogyba', '::1', 1, '2025-12-06 21:47:22'),
(45, 'infogyba', '::1', 1, '2025-12-10 17:39:54'),
(46, 'infogyba', '::1', 1, '2025-12-10 17:51:58'),
(47, 'infogyba', '::1', 1, '2025-12-10 17:54:51'),
(48, 'infogyba', '::1', 1, '2025-12-10 18:05:32'),
(49, 'infogyba', '::1', 1, '2025-12-10 18:11:03'),
(50, 'infogyba', '::1', 1, '2025-12-10 18:16:28'),
(51, 'infogyba', '::1', 1, '2025-12-10 18:24:23');

INSERT INTO `visitantes` (`id`, `ip_address`, `user_agent`, `pagina`, `referrer`, `pais`, `cidade`, `dispositivo`, `navegador`, `sistema_operacional`, `data_acesso`, `session_id`) VALUES
(7, '::1', NULL, 'dashboard', NULL, NULL, NULL, NULL, 'Firefox', 'Linux', '2025-12-10 14:54:53', NULL),
(8, '::1', NULL, 'dashboard', NULL, NULL, NULL, NULL, 'Firefox', 'Linux', '2025-12-10 15:05:34', NULL),
(9, '::1', NULL, 'dashboard', NULL, NULL, NULL, NULL, 'Firefox', 'Linux', '2025-12-10 15:11:04', NULL),
(11, '::1', NULL, 'dashboard', NULL, NULL, NULL, NULL, 'Firefox', 'Linux', '2025-12-10 15:24:25', NULL);

ALTER TABLE `clientes` ADD CONSTRAINT `clientes_fk_user` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
ALTER TABLE `clientes_historico` ADD CONSTRAINT `hist_fk_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE;
ALTER TABLE `clientes_historico` ADD CONSTRAINT `hist_fk_user` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
ALTER TABLE `musicas` ADD CONSTRAINT `musicas_fk_user` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
