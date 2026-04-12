#!/usr/bin/node

/**
 * AUTO.JS - Versão Universal (Fedora & VPS)
 * Descobre o caminho automaticamente e ajusta permissões.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Cabeçalho para o Apache
console.log("Content-Type: text/plain\n");

// --- CONFIGURAÇÃO DINÂMICA ---
// __dirname pega o caminho de 'assets/js'. 
// Subimos dois níveis para chegar na raiz do projeto 'Aurora-Music'
const projectRoot = path.resolve(__dirname, '../../');
const musicDir = path.join(projectRoot, 'music');

function canRun(command) {
    try {
        execSync(`command -v ${command}`, { stdio: 'ignore' });
        return true;
    } catch (e) { return false; }
}

function run() {
    try {
        if (!fs.existsSync(musicDir)) {
            console.log(`Erro: Diretorio ${musicDir} nao encontrado.`);
            return;
        }

        // 1. Identifica o usuário do Apache dinamicamente
        const currentUser = execSync('whoami').toString().trim();

        // 2. Aplica Permissões Básicas
        // Usamos aspas duplas no caminho para evitar erros com espaços
        execSync(`chmod -R 755 "${musicDir}"`);
        
        // Tenta mudar o dono. Se falhar (falta de sudo), ele continua.
        try {
            execSync(`sudo chown -R ${currentUser}:${currentUser} "${musicDir}"`);
        } catch (e) {
            console.log("Aviso: Chown ignorado (sem sudo).");
        }

        // 3. SELinux (Apenas se o comando chcon existir no sistema)
        if (canRun('chcon')) {
            try {
                // Tenta aplicar o contexto. Requer NOPASSWD no sudoers.
                execSync(`sudo chcon -R -t httpd_sys_rw_content_t "${musicDir}"`);
                console.log("Ambiente: Fedora (SELinux aplicado)");
            } catch (e) {
                console.log("Ambiente: Fedora (Falha no chcon - verifique sudoers)");
            }
        } else {
            console.log("Ambiente: VPS/Generic (Sem SELinux)");
        }

        console.log(`Sucesso: Permissoes aplicadas em ${musicDir}`);

    } catch (err) {
        console.log("Erro fatal: " + err.message);
    }
}

run();