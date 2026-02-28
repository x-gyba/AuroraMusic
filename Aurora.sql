CREATE DATABASE IF NOT EXISTS `music` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `music`;

-- TABELA: usuarios
CREATE TABLE `usuarios` (
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

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `data_criacao`, `ultimo_acesso`, `ativo`) VALUES
(5, 'Admin', 'admin@infogyba.com.br', '$2y$12$PRnu8vXRqS7ol1.0n9B1gOupE9NPziDmYUgxvj0aKQObOHIFJmYeK', '2025-11-25 00:35:11', NULL, 1),
(6, 'Infogyba', 'infogyba@devel.com.br', '$2y$12$Bzi.Tcgpi.QLFlaUdsWBJ.oyplh6Zh.orwDkgIMZQOVRxJu2Hsutm', '2025-11-25 00:35:54', '2026-02-28 18:53:17', 1);

-- TABELA: clientes
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
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_clientes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABELA: clientes_historico
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
  KEY `idx_usuario_hist` (`usuario_id`),
  CONSTRAINT `fk_historico_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_historico_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABELA: musicas
CREATE TABLE `musicas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `nome_arquivo` varchar(255) NOT NULL,
  `nome_exibicao` varchar(255) NOT NULL,
  `artista` varchar(255) NOT NULL DEFAULT 'Artista Desconhecido',
  `caminho_arquivo` varchar(500) NOT NULL,
  `tamanho_arquivo` bigint(20) NOT NULL,
  `caminho_imagem` varchar(500) DEFAULT NULL,
  `tipo_imagem` enum('jpg','png','gif','webp') DEFAULT NULL,
  `data_upload` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_arquivo` (`usuario_id`,`nome_arquivo`),
  KEY `idx_data_upload` (`data_upload`),
  KEY `idx_ativo` (`ativo`),
  CONSTRAINT `fk_musicas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `musicas` (`id`, `usuario_id`, `nome_arquivo`, `nome_exibicao`, `artista`, `caminho_arquivo`, `tamanho_arquivo`, `caminho_imagem`, `tipo_imagem`, `data_upload`, `data_atualizacao`, `ativo`) VALUES
(1, 6, 'Depeche Mode, Daniel Miller, Phil Legg - Enjoy the Silence.mp3', 'Depeche Mode, Daniel Miller, Phil Legg - Enjoy the Silence', 'Artista Desconhecido', 'music/1772304053_d4d6649a.mp3', 6181353, 'music/covers/1772304053_8281e23c.jpg', 'jpg', '2026-02-28 18:40:53', '2026-02-28 18:40:53', 1),
(3, 6, 'Scorpions-Still Loving You.mp3', 'Scorpions-Still Loving You', 'Artista Desconhecido', 'music/1772304886_39d86a70.mp3', 7215836, 'music/covers/1772304886_87208658.jpg', 'jpg', '2026-02-28 18:54:46', '2026-02-28 18:54:46', 1);

-- TABELA: estatisticas_diarias
CREATE TABLE `estatisticas_diarias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data` date NOT NULL,
  `total_visitas` int(11) DEFAULT 0,
  `visitantes_unicos` int(11) DEFAULT 0,
  `paginas_vistas` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_data` (`data`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABELA: tentativas_login
CREATE TABLE `tentativas_login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `success` tinyint(1) DEFAULT 0,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_usuario` (`usuario`),
  KEY `idx_attempted_at` (`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tentativas_login` (`id`, `usuario`, `ip_address`, `success`, `attempted_at`) VALUES
(1, 'infogyba', '127.0.0.1', 0, '2025-11-25 00:33:58'),
(2, 'infogyba', '127.0.0.1', 1, '2025-11-25 00:36:22'),
(3, 'infogyba', '::1', 1, '2025-12-11 00:24:23'),
(4, 'infogyba', '127.0.0.1', 1, '2026-02-28 18:39:02'),
(5, 'infogyba', '127.0.0.1', 1, '2026-02-28 18:53:17');

-- TABELA: visitantes
CREATE TABLE `visitantes` (
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

INSERT INTO `visitantes` (`id`, `ip_address`, `pagina`, `navegador`, `sistema_operacional`, `data_acesso`) VALUES
(1, '127.0.0.1', 'dashboard', 'Firefox', 'Linux', '2026-02-28 18:39:04'),
(2, '127.0.0.1', 'dashboard', 'Firefox', 'Linux', '2026-02-28 18:41:26'),
(3, '127.0.0.1', 'dashboard', 'Firefox', 'Linux', '2026-02-28 18:53:18');

-- VIEW: vw_musicas_por_usuario
CREATE OR REPLACE VIEW `vw_musicas_por_usuario` AS 
SELECT 
    `u`.`id` AS `id`, 
    `u`.`nome` AS `nome`, 
    `u`.`email` AS `email`, 
    count(`m`.`id`) AS `total_musicas`, 
    coalesce(sum(`m`.`tamanho_arquivo`),0) AS `espaco_total_bytes` 
FROM `usuarios` `u` 
LEFT JOIN `musicas` `m` ON `u`.`id` = `m`.`usuario_id` AND `m`.`ativo` = 1
GROUP BY `u`.`id`, `u`.`nome`, `u`.`email`;
