-- Migration: Adicionar suporte a imagens/covers nas músicas
-- Data: 2026-02-27
-- Descrição: Adiciona coluna de caminho de imagem na tabela musicas

ALTER TABLE `musicas` ADD COLUMN `caminho_imagem` VARCHAR(500) DEFAULT NULL AFTER `caminho_arquivo`;
ALTER TABLE `musicas` ADD INDEX `idx_caminho_imagem` (`caminho_imagem`);

-- Opcional: Adiciona coluna tipo_imagem para rastrear formato
ALTER TABLE `musicas` ADD COLUMN `tipo_imagem` ENUM('jpg', 'png', 'gif', 'webp') DEFAULT NULL AFTER `caminho_imagem`;
