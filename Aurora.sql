CREATE DATABASE IF NOT EXISTS `music` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `music`;

-- Estrutura para tabela `usuarios`
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

-- Estrutura para tabela `clientes`
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

-- Estrutura para tabela `clientes_historico`
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

-- Estrutura para tabela `estatisticas_diarias`
CREATE TABLE `estatisticas_diarias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data` date NOT NULL,
  `total_visitas` int(11) DEFAULT 0,
  `visitantes_unicos` int(11) DEFAULT 0,
  `paginas_vistas` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_data` (`data`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estrutura para tabela `musicas`
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

-- Estrutura para tabela `tentativas_login`
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

-- Estrutura para tabela `visitantes`
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

-- Dados para a tabela `usuarios`
INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `data_criacao`, `ultimo_acesso`, `ativo`) VALUES
(5, 'Admin', 'admin@infogyba.com.br', '$2y$12$PRnu8vXRqS7ol1.0n9B1gOupE9NPziDmYUgxvj0aKQObOHIFJmYeK', '2025-11-25 00:35:11', NULL, 1),
(6, 'Infogyba', 'infogyba@devel.com.br', '$2y$12$Bzi.Tcgpi.QLFlaUdsWBJ.oyplh6Zh.orwDkgIMZQOVRxJu2Hsutm', '2025-11-25 00:35:54', '2026-03-06 17:26:10', 1);

-- Dados para a tabela `musicas`
INSERT INTO `musicas` (`id`, `usuario_id`, `nome_arquivo`, `nome_exibicao`, `artista`, `caminho_arquivo`, `tamanho_arquivo`, `caminho_imagem`, `tipo_imagem`, `data_upload`, `data_atualizacao`, `ativo`) VALUES
(12, 6, 'Isaias_Saad_-_Bondade_de_Deus_(mp3.pm).mp3', 'Isaias_Saad_-_Bondade_de_Deus_(mp3.pm)', 'Artista Desconhecido', 'music/1772817605_4a410c6b.mp3', 15028811, NULL, NULL, '2026-03-06 17:20:05', '2026-03-06 17:20:05', 1),
(13, 6, 'Aline_Barros_-_Ressuscita-me_CeeNaija.com_.mp3', 'Aline_Barros_-_Ressuscita-me_CeeNaija.com_', 'Artista Desconhecido', 'music/1772817629_375f2bac.mp3', 4752021, 'music/covers/1772817629_249145ca.jpg', 'jpg', '2026-03-06 17:20:29', '2026-03-06 17:20:29', 1),
(14, 6, 'Nada Além do Sangue (Ao Vivo)(MP3_70K)_1.mp3', 'Nada Além do Sangue (Ao Vivo)(MP3_70K)_1', 'Artista Desconhecido', 'music/1772817645_561805da.mp3', 5766842, 'music/covers/1772817645_c17c4e91.png', 'png', '2026-03-06 17:20:45', '2026-03-06 17:20:45', 1),
(15, 6, 'Aline_Barros_-_Consagra_o_Louvor_ao_Rei_CeeNaija.com_.mp3', 'Aline_Barros_-_Consagra_o_Louvor_ao_Rei_CeeNaija.com_', 'Artista Desconhecido', 'music/1772817661_ece88d18.mp3', 5703298, 'music/covers/1772817661_513d3c43.jpg', 'jpg', '2026-03-06 17:21:01', '2026-03-06 17:21:01', 1);

-- Visão `vw_musicas_por_usuario`
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
