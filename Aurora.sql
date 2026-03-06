-- phpMyAdmin SQL Dump
-- version 5.2.3-1.fc43
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Tempo de geração: 06/03/2026 às 18:14
-- Versão do servidor: 10.11.16-MariaDB
-- Versão do PHP: 8.4.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `music`
--
CREATE DATABASE IF NOT EXISTS `music` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `music`;

-- --------------------------------------------------------

--
-- Estrutura para tabela `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `status` enum('ativo','inativo') DEFAULT 'ativo',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `clientes_historico`
--

CREATE TABLE `clientes_historico` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `acao` enum('criacao','edicao','exclusao','reativacao') NOT NULL,
  `dados_anteriores` longtext DEFAULT NULL CHECK (json_valid(`dados_anteriores`)),
  `dados_novos` longtext DEFAULT NULL CHECK (json_valid(`dados_novos`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estatisticas_diarias`
--

CREATE TABLE `estatisticas_diarias` (
  `id` int(11) NOT NULL,
  `data` date NOT NULL,
  `total_visitas` int(11) DEFAULT 0,
  `visitantes_unicos` int(11) DEFAULT 0,
  `paginas_vistas` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `musicas`
--

CREATE TABLE `musicas` (
  `id` int(11) NOT NULL,
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
  `ativo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `musicas`
--

INSERT INTO `musicas` (`id`, `usuario_id`, `nome_arquivo`, `nome_exibicao`, `artista`, `caminho_arquivo`, `tamanho_arquivo`, `caminho_imagem`, `tipo_imagem`, `data_upload`, `data_atualizacao`, `ativo`) VALUES
(12, 6, 'Isaias_Saad_-_Bondade_de_Deus_(mp3.pm).mp3', 'Isaias_Saad_-_Bondade_de_Deus_(mp3.pm)', 'Artista Desconhecido', 'music/1772817605_4a410c6b.mp3', 15028811, NULL, NULL, '2026-03-06 17:20:05', '2026-03-06 17:20:05', 1),
(13, 6, 'Aline_Barros_-_Ressuscita-me_CeeNaija.com_.mp3', 'Aline_Barros_-_Ressuscita-me_CeeNaija.com_', 'Artista Desconhecido', 'music/1772817629_375f2bac.mp3', 4752021, 'music/covers/1772817629_249145ca.jpg', 'jpg', '2026-03-06 17:20:29', '2026-03-06 17:20:29', 1),
(14, 6, 'Nada Além do Sangue (Ao Vivo)(MP3_70K)_1.mp3', 'Nada Além do Sangue (Ao Vivo)(MP3_70K)_1', 'Artista Desconhecido', 'music/1772817645_561805da.mp3', 5766842, 'music/covers/1772817645_c17c4e91.png', 'png', '2026-03-06 17:20:45', '2026-03-06 17:20:45', 1),
(15, 6, 'Aline_Barros_-_Consagra_o_Louvor_ao_Rei_CeeNaija.com_.mp3', 'Aline_Barros_-_Consagra_o_Louvor_ao_Rei_CeeNaija.com_', 'Artista Desconhecido', 'music/1772817661_ece88d18.mp3', 5703298, 'music/covers/1772817661_513d3c43.jpg', 'jpg', '2026-03-06 17:21:01', '2026-03-06 17:21:01', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `tentativas_login`
--

CREATE TABLE `tentativas_login` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `success` tinyint(1) DEFAULT 0,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `tentativas_login`
--

INSERT INTO `tentativas_login` (`id`, `usuario`, `ip_address`, `success`, `attempted_at`) VALUES
(1, 'infogyba', '127.0.0.1', 0, '2025-11-25 00:33:58'),
(2, 'infogyba', '127.0.0.1', 1, '2025-11-25 00:36:22'),
(3, 'infogyba', '::1', 1, '2025-12-11 00:24:23'),
(4, 'infogyba', '127.0.0.1', 1, '2026-02-28 18:39:02'),
(5, 'infogyba', '127.0.0.1', 1, '2026-02-28 18:53:17'),
(6, 'infogyba', '127.0.0.1', 1, '2026-02-28 19:32:26'),
(7, 'infogyba', '127.0.0.1', 1, '2026-02-28 19:37:06'),
(8, 'infogyba', '::1', 1, '2026-03-02 21:48:28'),
(9, 'infogyba', '::1', 1, '2026-03-02 21:51:55'),
(10, 'infogyba', '::1', 1, '2026-03-02 22:12:29'),
(11, 'infogyba', '::1', 1, '2026-03-03 14:24:09'),
(12, 'infogyba', '::1', 1, '2026-03-03 14:29:15'),
(13, 'infogyba', '::1', 1, '2026-03-03 14:47:57'),
(14, 'infogyba', '::1', 1, '2026-03-03 14:51:08'),
(15, 'infogyba', '::1', 1, '2026-03-03 14:53:06'),
(16, 'infogyba', '::1', 1, '2026-03-03 16:11:23'),
(17, 'infogyba', '::1', 1, '2026-03-03 16:32:29'),
(18, 'infogyba', '::1', 1, '2026-03-03 16:44:40'),
(19, 'infogy', '::1', 0, '2026-03-06 16:08:25'),
(20, 'infogyba@devel.com.br', '::1', 0, '2026-03-06 16:11:02'),
(21, 'infogyba', '::1', 1, '2026-03-06 16:16:58'),
(22, 'infogyba', '::1', 1, '2026-03-06 16:24:38'),
(23, 'infogyba', '::1', 1, '2026-03-06 16:29:35'),
(24, 'infogyba', '::1', 1, '2026-03-06 16:33:09'),
(25, 'infogyba', '::1', 1, '2026-03-06 17:17:49'),
(26, 'infogyba', '::1', 1, '2026-03-06 17:19:28'),
(27, 'infogyba', '::1', 1, '2026-03-06 17:26:10');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_acesso` timestamp NULL DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `data_criacao`, `ultimo_acesso`, `ativo`) VALUES
(5, 'Admin', 'admin@infogyba.com.br', '$2y$12$PRnu8vXRqS7ol1.0n9B1gOupE9NPziDmYUgxvj0aKQObOHIFJmYeK', '2025-11-25 00:35:11', NULL, 1),
(6, 'Infogyba', 'infogyba@devel.com.br', '$2y$12$Bzi.Tcgpi.QLFlaUdsWBJ.oyplh6Zh.orwDkgIMZQOVRxJu2Hsutm', '2025-11-25 00:35:54', '2026-03-06 17:26:10', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `visitantes`
--

CREATE TABLE `visitantes` (
  `id` int(11) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `pagina` varchar(255) DEFAULT 'desconhecida',
  `navegador` varchar(100) DEFAULT 'Desconhecido',
  `sistema_operacional` varchar(100) DEFAULT 'Desconhecido',
  `data_acesso` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `visitantes`
--

INSERT INTO `visitantes` (`id`, `ip_address`, `pagina`, `navegador`, `sistema_operacional`, `data_acesso`) VALUES
(1, '127.0.0.1', 'dashboard', 'Firefox', 'Linux', '2026-02-28 18:39:04'),
(2, '127.0.0.1', 'dashboard', 'Firefox', 'Linux', '2026-02-28 18:41:26'),
(3, '127.0.0.1', 'dashboard', 'Firefox', 'Linux', '2026-02-28 18:53:18'),
(4, '127.0.0.1', 'dashboard', 'Chrome', 'Android', '2026-02-28 19:32:28'),
(5, '127.0.0.1', 'dashboard', 'Firefox', 'Linux', '2026-02-28 19:37:08'),
(6, '::1', 'dashboard', 'Safari', 'iOS', '2026-03-02 21:48:30'),
(7, '::1', 'dashboard', 'Firefox', 'Linux', '2026-03-02 21:51:57'),
(8, '::1', 'dashboard', 'Firefox', 'Linux', '2026-03-02 22:12:31'),
(9, '::1', 'dashboard', 'Firefox', 'Linux', '2026-03-03 14:24:10'),
(10, '::1', 'dashboard', 'Firefox', 'Linux', '2026-03-03 14:29:17'),
(11, '::1', 'dashboard', 'Firefox', 'Linux', '2026-03-03 14:47:58'),
(12, '::1', 'dashboard', 'Firefox', 'Linux', '2026-03-03 14:51:10'),
(13, '::1', 'dashboard', 'Firefox', 'Linux', '2026-03-03 14:53:07'),
(14, '::1', 'dashboard', 'Safari', 'iOS', '2026-03-03 16:11:25'),
(15, '::1', 'dashboard', 'Safari', 'iOS', '2026-03-03 16:32:32'),
(16, '::1', 'dashboard', 'Safari', 'iOS', '2026-03-03 16:33:51'),
(17, '::1', 'dashboard', 'Firefox', 'Linux', '2026-03-03 16:33:55'),
(18, '::1', 'dashboard', 'Safari', 'iOS', '2026-03-03 16:34:34'),
(19, '::1', 'dashboard', 'Safari', 'iOS', '2026-03-03 16:44:42'),
(20, '::1', 'dashboard', 'Firefox', 'Linux', '2026-03-06 16:17:00'),
(21, '::1', 'dashboard', 'Firefox', 'Linux', '2026-03-06 16:24:40'),
(22, '::1', 'dashboard', 'Chrome', 'Android', '2026-03-06 16:29:37'),
(23, '::1', 'dashboard', 'Chrome', 'Android', '2026-03-06 16:33:10'),
(24, '::1', 'dashboard', 'Safari', 'iOS', '2026-03-06 17:17:50'),
(25, '::1', 'dashboard', 'Safari', 'iOS', '2026-03-06 17:19:29'),
(26, '::1', 'dashboard', 'Safari', 'iOS', '2026-03-06 17:26:11');

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `vw_musicas_por_usuario`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `vw_musicas_por_usuario` (
`id` int(11)
,`nome` varchar(255)
,`email` varchar(255)
,`total_musicas` bigint(21)
,`espaco_total_bytes` decimal(41,0)
);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_status` (`status`);

--
-- Índices de tabela `clientes_historico`
--
ALTER TABLE `clientes_historico`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cliente` (`cliente_id`),
  ADD KEY `idx_usuario_hist` (`usuario_id`);

--
-- Índices de tabela `estatisticas_diarias`
--
ALTER TABLE `estatisticas_diarias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_data` (`data`);

--
-- Índices de tabela `musicas`
--
ALTER TABLE `musicas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_usuario_arquivo` (`usuario_id`,`nome_arquivo`),
  ADD KEY `fk_musicas_usuario` (`usuario_id`),
  ADD KEY `idx_data_upload` (`data_upload`),
  ADD KEY `idx_ativo` (`ativo`);

--
-- Índices de tabela `tentativas_login`
--
ALTER TABLE `tentativas_login`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario` (`usuario`),
  ADD KEY `idx_attempted_at` (`attempted_at`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_ativo` (`ativo`);

--
-- Índices de tabela `visitantes`
--
ALTER TABLE `visitantes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_data_acesso` (`data_acesso`),
  ADD KEY `idx_ip_address` (`ip_address`),
  ADD KEY `idx_pagina` (`pagina`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `clientes_historico`
--
ALTER TABLE `clientes_historico`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estatisticas_diarias`
--
ALTER TABLE `estatisticas_diarias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `musicas`
--
ALTER TABLE `musicas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de tabela `tentativas_login`
--
ALTER TABLE `tentativas_login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `visitantes`
--
ALTER TABLE `visitantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

-- --------------------------------------------------------

--
-- Estrutura para view `vw_musicas_por_usuario`
--
DROP TABLE IF EXISTS `vw_musicas_por_usuario`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_musicas_por_usuario`  AS SELECT `u`.`id` AS `id`, `u`.`nome` AS `nome`, `u`.`email` AS `email`, count(`m`.`id`) AS `total_musicas`, coalesce(sum(`m`.`tamanho_arquivo`),0) AS `espaco_total_bytes` FROM (`usuarios` `u` left join `musicas` `m` on(`u`.`id` = `m`.`usuario_id` and `m`.`ativo` = 1)) GROUP BY `u`.`id`, `u`.`nome`, `u`.`email` ;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `fk_clientes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `clientes_historico`
--
ALTER TABLE `clientes_historico`
  ADD CONSTRAINT `fk_historico_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_historico_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `musicas`
--
ALTER TABLE `musicas`
  ADD CONSTRAINT `fk_musicas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Banco de dados: `phpmyadmin`
--
CREATE DATABASE IF NOT EXISTS `phpmyadmin` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `phpmyadmin`;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__bookmark`
--

CREATE TABLE `pma__bookmark` (
  `id` int(10) UNSIGNED NOT NULL,
  `dbase` varchar(255) NOT NULL DEFAULT '',
  `user` varchar(255) NOT NULL DEFAULT '',
  `label` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `query` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Bookmarks';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__central_columns`
--

CREATE TABLE `pma__central_columns` (
  `db_name` varchar(64) NOT NULL,
  `col_name` varchar(64) NOT NULL,
  `col_type` varchar(64) NOT NULL,
  `col_length` text DEFAULT NULL,
  `col_collation` varchar(64) NOT NULL,
  `col_isNull` tinyint(1) NOT NULL,
  `col_extra` varchar(255) DEFAULT '',
  `col_default` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Central list of columns';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__column_info`
--

CREATE TABLE `pma__column_info` (
  `id` int(5) UNSIGNED NOT NULL,
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `column_name` varchar(64) NOT NULL DEFAULT '',
  `comment` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `mimetype` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `transformation` varchar(255) NOT NULL DEFAULT '',
  `transformation_options` varchar(255) NOT NULL DEFAULT '',
  `input_transformation` varchar(255) NOT NULL DEFAULT '',
  `input_transformation_options` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Column information for phpMyAdmin';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__designer_settings`
--

CREATE TABLE `pma__designer_settings` (
  `username` varchar(64) NOT NULL,
  `settings_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Settings related to Designer';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__export_templates`
--

CREATE TABLE `pma__export_templates` (
  `id` int(5) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL,
  `export_type` varchar(10) NOT NULL,
  `template_name` varchar(64) NOT NULL,
  `template_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Saved export templates';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__favorite`
--

CREATE TABLE `pma__favorite` (
  `username` varchar(64) NOT NULL,
  `tables` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Favorite tables';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__history`
--

CREATE TABLE `pma__history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL DEFAULT '',
  `db` varchar(64) NOT NULL DEFAULT '',
  `table` varchar(64) NOT NULL DEFAULT '',
  `timevalue` timestamp NOT NULL DEFAULT current_timestamp(),
  `sqlquery` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='SQL history for phpMyAdmin';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__navigationhiding`
--

CREATE TABLE `pma__navigationhiding` (
  `username` varchar(64) NOT NULL,
  `item_name` varchar(64) NOT NULL,
  `item_type` varchar(64) NOT NULL,
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Hidden items of navigation tree';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__pdf_pages`
--

CREATE TABLE `pma__pdf_pages` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `page_nr` int(10) UNSIGNED NOT NULL,
  `page_descr` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='PDF relation pages for phpMyAdmin';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__recent`
--

CREATE TABLE `pma__recent` (
  `username` varchar(64) NOT NULL,
  `tables` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Recently accessed tables';

--
-- Despejando dados para a tabela `pma__recent`
--

INSERT INTO `pma__recent` (`username`, `tables`) VALUES
('root', '[{\"db\":\"music\",\"table\":\"usuarios\"}]');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__relation`
--

CREATE TABLE `pma__relation` (
  `master_db` varchar(64) NOT NULL DEFAULT '',
  `master_table` varchar(64) NOT NULL DEFAULT '',
  `master_field` varchar(64) NOT NULL DEFAULT '',
  `foreign_db` varchar(64) NOT NULL DEFAULT '',
  `foreign_table` varchar(64) NOT NULL DEFAULT '',
  `foreign_field` varchar(64) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Relation table';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__savedsearches`
--

CREATE TABLE `pma__savedsearches` (
  `id` int(5) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL DEFAULT '',
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `search_name` varchar(64) NOT NULL DEFAULT '',
  `search_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Saved searches';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__table_coords`
--

CREATE TABLE `pma__table_coords` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `pdf_page_number` int(11) NOT NULL DEFAULT 0,
  `x` float UNSIGNED NOT NULL DEFAULT 0,
  `y` float UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Table coordinates for phpMyAdmin PDF output';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__table_info`
--

CREATE TABLE `pma__table_info` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `display_field` varchar(64) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Table information for phpMyAdmin';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__table_uiprefs`
--

CREATE TABLE `pma__table_uiprefs` (
  `username` varchar(64) NOT NULL,
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL,
  `prefs` text NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Tables'' UI preferences';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__tracking`
--

CREATE TABLE `pma__tracking` (
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL,
  `version` int(10) UNSIGNED NOT NULL,
  `date_created` datetime NOT NULL,
  `date_updated` datetime NOT NULL,
  `schema_snapshot` text NOT NULL,
  `schema_sql` text DEFAULT NULL,
  `data_sql` longtext DEFAULT NULL,
  `tracking` set('UPDATE','REPLACE','INSERT','DELETE','TRUNCATE','CREATE DATABASE','ALTER DATABASE','DROP DATABASE','CREATE TABLE','ALTER TABLE','RENAME TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','ALTER VIEW','DROP VIEW') DEFAULT NULL,
  `tracking_active` int(1) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Database changes tracking for phpMyAdmin';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__userconfig`
--

CREATE TABLE `pma__userconfig` (
  `username` varchar(64) NOT NULL,
  `timevalue` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `config_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='User preferences storage for phpMyAdmin';

--
-- Despejando dados para a tabela `pma__userconfig`
--

INSERT INTO `pma__userconfig` (`username`, `timevalue`, `config_data`) VALUES
('root', '2026-03-06 18:14:14', '{\"Console\\/Mode\":\"collapse\",\"lang\":\"pt_BR\"}');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__usergroups`
--

CREATE TABLE `pma__usergroups` (
  `usergroup` varchar(64) NOT NULL,
  `tab` varchar(64) NOT NULL,
  `allowed` enum('Y','N') NOT NULL DEFAULT 'N'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='User groups with configured menu items';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__users`
--

CREATE TABLE `pma__users` (
  `username` varchar(64) NOT NULL,
  `usergroup` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='Users and their assignments to user groups';

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `pma__bookmark`
--
ALTER TABLE `pma__bookmark`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `pma__central_columns`
--
ALTER TABLE `pma__central_columns`
  ADD PRIMARY KEY (`db_name`,`col_name`);

--
-- Índices de tabela `pma__column_info`
--
ALTER TABLE `pma__column_info`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `db_name` (`db_name`,`table_name`,`column_name`);

--
-- Índices de tabela `pma__designer_settings`
--
ALTER TABLE `pma__designer_settings`
  ADD PRIMARY KEY (`username`);

--
-- Índices de tabela `pma__export_templates`
--
ALTER TABLE `pma__export_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_user_type_template` (`username`,`export_type`,`template_name`);

--
-- Índices de tabela `pma__favorite`
--
ALTER TABLE `pma__favorite`
  ADD PRIMARY KEY (`username`);

--
-- Índices de tabela `pma__history`
--
ALTER TABLE `pma__history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `username` (`username`,`db`,`table`,`timevalue`);

--
-- Índices de tabela `pma__navigationhiding`
--
ALTER TABLE `pma__navigationhiding`
  ADD PRIMARY KEY (`username`,`item_name`,`item_type`,`db_name`,`table_name`);

--
-- Índices de tabela `pma__pdf_pages`
--
ALTER TABLE `pma__pdf_pages`
  ADD PRIMARY KEY (`page_nr`),
  ADD KEY `db_name` (`db_name`);

--
-- Índices de tabela `pma__recent`
--
ALTER TABLE `pma__recent`
  ADD PRIMARY KEY (`username`);

--
-- Índices de tabela `pma__relation`
--
ALTER TABLE `pma__relation`
  ADD PRIMARY KEY (`master_db`,`master_table`,`master_field`),
  ADD KEY `foreign_field` (`foreign_db`,`foreign_table`);

--
-- Índices de tabela `pma__savedsearches`
--
ALTER TABLE `pma__savedsearches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_savedsearches_username_dbname` (`username`,`db_name`,`search_name`);

--
-- Índices de tabela `pma__table_coords`
--
ALTER TABLE `pma__table_coords`
  ADD PRIMARY KEY (`db_name`,`table_name`,`pdf_page_number`);

--
-- Índices de tabela `pma__table_info`
--
ALTER TABLE `pma__table_info`
  ADD PRIMARY KEY (`db_name`,`table_name`);

--
-- Índices de tabela `pma__table_uiprefs`
--
ALTER TABLE `pma__table_uiprefs`
  ADD PRIMARY KEY (`username`,`db_name`,`table_name`);

--
-- Índices de tabela `pma__tracking`
--
ALTER TABLE `pma__tracking`
  ADD PRIMARY KEY (`db_name`,`table_name`,`version`);

--
-- Índices de tabela `pma__userconfig`
--
ALTER TABLE `pma__userconfig`
  ADD PRIMARY KEY (`username`);

--
-- Índices de tabela `pma__usergroups`
--
ALTER TABLE `pma__usergroups`
  ADD PRIMARY KEY (`usergroup`,`tab`,`allowed`);

--
-- Índices de tabela `pma__users`
--
ALTER TABLE `pma__users`
  ADD PRIMARY KEY (`username`,`usergroup`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `pma__bookmark`
--
ALTER TABLE `pma__bookmark`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pma__column_info`
--
ALTER TABLE `pma__column_info`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pma__export_templates`
--
ALTER TABLE `pma__export_templates`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pma__history`
--
ALTER TABLE `pma__history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pma__pdf_pages`
--
ALTER TABLE `pma__pdf_pages`
  MODIFY `page_nr` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pma__savedsearches`
--
ALTER TABLE `pma__savedsearches`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
