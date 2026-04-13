/**
 * login_historico.js - Aurora Music
 * Histórico de Logins com Cards em Grid
 */

let paginaLoginAtual = 1;
const loginRegistrosPorPagina = 20;

document.addEventListener('DOMContentLoaded', () => {
    const linkLoginInfo = document.querySelector('[data-section="login-info"]');
    if (linkLoginInfo) {
        linkLoginInfo.addEventListener('click', () => carregarLoginHistorico());
    }

    const btnLimpar = document.getElementById('btnLimparTodosLogins');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparTodosLogins);
    }
});

async function carregarLoginHistorico() {
    const grid = document.getElementById('loginHistoricoGrid');
    if (grid) grid.innerHTML = '<p class="visitantes-loading">Carregando...</p>';

    try {
        const params = new URLSearchParams({
            action: 'listar',
            limit:  loginRegistrosPorPagina,
            offset: (paginaLoginAtual - 1) * loginRegistrosPorPagina
        });

        const response = await fetch(`/Aurora-Music/controllers/login_historico_controller.php?${params}`);
        const data = await response.json();

        if (data.success) {
            renderizarLoginCards(data.dados);
            renderizarLoginPaginacao(data.total, paginaLoginAtual);
        }
    } catch (error) {
        const grid = document.getElementById('loginHistoricoGrid');
        if (grid) grid.innerHTML = '<p class="visitantes-loading">Erro ao carregar dados.</p>';
        console.error("Erro ao listar logins:", error);
    }
}

function renderizarLoginCards(registros) {
    const grid = document.getElementById('loginHistoricoGrid');
    if (!grid) return;

    if (!registros || registros.length === 0) {
        grid.innerHTML = '<p class="visitantes-loading">Nenhum registro encontrado.</p>';
        return;
    }

    grid.innerHTML = registros.map(r => `
        <div class="visitor-card" id="login-card-${r.id}">

            <div class="visitor-card-row">
                <div class="visitor-card-icon-wrap">
                    <i class='bx bx-user'></i>
                </div>
                <div class="visitor-card-text">
                    <span class="visitor-card-label">Usuário</span>
                    <span class="visitor-card-value">${escHtmlLogin(r.nome)}</span>
                </div>
            </div>

            <div class="visitor-card-row">
                <div class="visitor-card-icon-wrap">
                    <i class='bx bx-envelope'></i>
                </div>
                <div class="visitor-card-text">
                    <span class="visitor-card-label">Email</span>
                    <span class="visitor-card-value">${escHtmlLogin(r.email)}</span>
                </div>
            </div>

            <div class="visitor-card-row">
                <div class="visitor-card-icon-wrap">
                    <i class='bx bx-calendar-alt'></i>
                </div>
                <div class="visitor-card-text">
                    <span class="visitor-card-label">Data / Hora</span>
                    <span class="visitor-card-value">${formatarLoginDataHora(r.data_login)}</span>
                </div>
            </div>

            <div class="visitor-card-row">
                <div class="visitor-card-icon-wrap">
                    <i class='bx bx-wifi'></i>
                </div>
                <div class="visitor-card-text">
                    <span class="visitor-card-label">IP</span>
                    <span class="visitor-card-value">${escHtmlLogin(r.ip_address)}</span>
                </div>
            </div>

            <div class="visitor-card-footer">
                <button class="visitor-btn-delete" title="Excluir registro" onclick="excluirLoginRegistro(${r.id})">
                    <i class='bx bx-trash'></i>
                </button>
            </div>

        </div>
    `).join('');
}

function renderizarLoginPaginacao(total, pagina) {
    const totalPaginas = Math.ceil(total / loginRegistrosPorPagina);
    const container = document.getElementById('paginacaoLoginHistorico');
    if (!container || totalPaginas <= 1) { if (container) container.innerHTML = ''; return; }

    container.innerHTML = `
        <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;padding-bottom:20px;">
            ${pagina > 1 ? `<button class="btn btn-primary" onclick="mudarLoginPagina(${pagina - 1})">Anterior</button>` : ''}
            <span style="align-self:center">Página ${pagina} de ${totalPaginas}</span>
            ${pagina < totalPaginas ? `<button class="btn btn-primary" onclick="mudarLoginPagina(${pagina + 1})">Próxima</button>` : ''}
        </div>`;
}

function mudarLoginPagina(p) {
    paginaLoginAtual = p;
    carregarLoginHistorico();
}

async function excluirLoginRegistro(id) {
    if (!confirm("Excluir este registro?")) return;
    try {
        const response = await fetch('/Aurora-Music/controllers/login_historico_controller.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=excluir&id=${id}`
        });
        const result = await response.json();
        if (result.success) {
            const card = document.getElementById(`login-card-${id}`);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.92)';
                setTimeout(() => carregarLoginHistorico(), 320);
            } else {
                carregarLoginHistorico();
            }
        }
    } catch (error) { alert('Erro ao excluir.'); }
}

async function limparTodosLogins() {
    if (!confirm("Tem certeza que deseja excluir TODO o histórico de logins? Esta ação não pode ser desfeita.")) return;
    try {
        const response = await fetch('/Aurora-Music/controllers/login_historico_controller.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=excluir_todos'
        });
        const result = await response.json();
        if (result.success) {
            carregarLoginHistorico();
        } else {
            alert(result.message || 'Erro ao limpar registros.');
        }
    } catch (error) { alert('Erro na requisição.'); }
}

function formatarLoginDataHora(dataHora) {
    if (!dataHora) return '--';
    const d = new Date(dataHora.replace(/-/g, "/"));
    const dia  = String(d.getDate()).padStart(2, '0');
    const mes  = String(d.getMonth() + 1).padStart(2, '0');
    const ano  = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min  = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function escHtmlLogin(str) {
    if (str == null) return '—';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}