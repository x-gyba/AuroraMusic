#!/bin/bash
# ============================================================
# AUTOMAÇÃO DE PERMISSÕES INFOGYBA - AURORA MUSIC 2026
# FOCO: CORREÇÃO DE BLOQUEIO SELINUX (FEDORA)
# ============================================================

# Define o caminho absoluto baseado em onde o script é executado
CAMINHO_PROJETO=$(pwd)

echo "--- Iniciando configuração para Aurora Music em $CAMINHO_PROJETO ---"

# 1. Ajuste de Permissões de Sistema (Dono e Grupo)
# No Fedora/Apache, o usuário padrão do serviço costuma ser 'apache'
echo "[1/3] Ajustando permissões de grupo e escrita..."
sudo chown -R :apache "$CAMINHO_PROJETO/music" "$CAMINHO_PROJETO/promo"
sudo chmod -R 775 "$CAMINHO_PROJETO/music" "$CAMINHO_PROJETO/promo"

# 2. Gravação de Regras Permanentes no SELinux
# Isso garante que após um reboot ou relabel, as permissões persistam
echo "[2/3] Gravando regras permanentes no banco de dados do SELinux..."
sudo semanage fcontext -a -t httpd_sys_rw_content_t "$CAMINHO_PROJETO/music(/.*)?"
sudo semanage fcontext -a -t httpd_sys_rw_content_t "$CAMINHO_PROJETO/promo(/.*)?"

# 3. Aplicação Imediata dos Contextos
# O restorecon lê o banco de dados do semanage e aplica aos arquivos reais
echo "[3/3] Sincronizando contextos de segurança..."
sudo restorecon -Rv "$CAMINHO_PROJETO/music"
sudo restorecon -Rv "$CAMINHO_PROJETO/promo"

echo "------------------------------------------------------------"
echo "Pronto! Aurora Music está com permissões de escrita liberadas."
echo "Infogyba Soluções em TI - Teresópolis, RJ"
echo "------------------------------------------------------------"
