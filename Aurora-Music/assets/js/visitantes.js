/**
 * visitantes.js - Aurora Music
 * Gerenciamento de Estatísticas com Cards em Grid
 */

let graficoVisitantes = null;
let paginaAtual = 1;
const registrosPorPagina = 20;

document.addEventListener('DOMContentLoaded', () => {
    const linkVisitantes = document.querySelector('[data-section="visitantes"]');
    if (linkVisitantes) {
        linkVisitantes.addEventListener('click', () => carregarDadosVisitantes());
    }

    const formFiltro = document.getElementById('formFiltroVisitantes');
    if (formFiltro) {
        formFiltro.addEventListener('submit', (e) => {
            e.preventDefault();
            paginaAtual = 1;
            carregarDadosVisitantes();
        });
    }

    // Botão limpar todos
    const btnLimparTodos = document.getElementById('btnLimparTodosVisitantes');
    if (btnLimparTodos) {
        btnLimparTodos.addEventListener('click', limparTodosRegistros);
    }
});

async function carregarDadosVisitantes() {
    let dInicio = document.getElementById('dataInicio')?.value || '';
    let dFim    = document.getElementById('dataFim')?.value   || '';

    if (!dInicio || !dFim) {
        const hoje   = new Date();
        const passada = new Date();
        passada.setDate(hoje.getDate() - 7);
        dFim   = hoje.toISOString().split('T')[0];
        dInicio = passada.toISOString().split('T')[0];
    }

    await Promise.all([
        carregarGrafico(dInicio, dFim),
        carregarCards(dInicio, dFim, paginaAtual)
    ]);
}

/* ── Gráfico ──────────────────────────────────────────────── */
async function carregarGrafico(inicio, fim) {
    try {
        const response = await fetch(`../controllers/visitantes_controller.php?action=grafico&inicio=${inicio}&fim=${fim}`);
        const data = await response.json();
        if (data.success && data.dados) renderizarGrafico(data.dados);
    } catch (error) {
        console.error("Erro no gráfico:", error);
    }
}

function renderizarGrafico(dados) {
    const canvas = document.getElementById('graficoVisitantes');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (graficoVisitantes) graficoVisitantes.destroy();

    const labels = dados.length > 0 ? dados.map(d => formatarData(d.dia)) : ['Sem dados'];
    const valores = dados.length > 0 ? dados.map(d => parseInt(d.total)) : [0];

    graficoVisitantes = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Visitas',
                data: valores,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

/* ── Cards ────────────────────────────────────────────────── */
async function carregarCards(dataInicio, dataFim, pagina) {
    const grid = document.getElementById('visitantesGrid');
    if (grid) grid.innerHTML = '<p class="visitantes-loading">Carregando...</p>';

    try {
        const params = new URLSearchParams({
            action: 'listar',
            limit: registrosPorPagina,
            offset: (pagina - 1) * registrosPorPagina,
            dataInicio,
            dataFim
        });

        const response = await fetch(`../controllers/visitantes_controller.php?${params}`);
        const data = await response.json();

        if (data.success) {
            renderizarCards(data.dados);
            renderizarPaginacao(data.total, pagina);
        }
    } catch (error) {
        if (grid) grid.innerHTML = '<p class="visitantes-loading">Erro ao carregar dados.</p>';
        console.error("Erro ao listar:", error);
    }
}

function renderizarCards(visitantes) {
    const grid = document.getElementById('visitantesGrid');
    if (!grid) return;

    if (!visitantes || visitantes.length === 0) {
        grid.innerHTML = '<p class="visitantes-loading">Nenhum registro encontrado.</p>';
        return;
    }

    grid.innerHTML = visitantes.map(v => `
        <div class="visitor-card" id="visitor-card-${v.id}">

            <div class="visitor-card-row">
                <div class="visitor-card-icon-wrap">
                    <i class='bx bx-calendar-alt'></i>
                </div>
                <div class="visitor-card-text">
                    <span class="visitor-card-label">Data / Hora</span>
                    <span class="visitor-card-value">${formatarDataHora(v.data_acesso)}</span>
                </div>
            </div>

            <div class="visitor-card-row">
                <div class="visitor-card-icon-wrap">
                    <i class='bx bx-wifi'></i>
                </div>
                <div class="visitor-card-text">
                    <span class="visitor-card-label">IP</span>
                    <span class="visitor-card-value">${escHtml(v.ip_address)}</span>
                </div>
            </div>

            <div class="visitor-card-row">
                <div class="visitor-card-icon-wrap">
                    <i class='bx bx-file-blank'></i>
                </div>
                <div class="visitor-card-text">
                    <span class="visitor-card-label">Página</span>
                    <span class="visitor-card-value">${escHtml(v.pagina)}</span>
                </div>
            </div>

            <div class="visitor-card-row">
                <div class="visitor-card-icon-wrap">
                    <i class='bx ${getBrowserIcon(v.navegador)}'></i>
                </div>
                <div class="visitor-card-text">
                    <span class="visitor-card-label">Navegador</span>
                    <span class="visitor-card-value">${escHtml(v.navegador)}</span>
                </div>
            </div>

            <div class="visitor-card-row">
                <div class="visitor-card-icon-wrap">
                    <i class='bx ${getOSIcon(v.sistema_operacional)}'></i>
                </div>
                <div class="visitor-card-text">
                    <span class="visitor-card-label">Sistema</span>
                    <span class="visitor-card-value">${escHtml(v.sistema_operacional)}</span>
                </div>
            </div>

            <div class="visitor-card-footer">
                <button class="visitor-btn-delete" title="Excluir registro" onclick="excluirRegistro(${v.id})">
                    <i class='bx bx-trash'></i>
                </button>
            </div>

        </div>
    `).join('');
}

/* ── Paginação ────────────────────────────────────────────── */
function renderizarPaginacao(total, pagina) {
    const totalPaginas = Math.ceil(total / registrosPorPagina);
    const container = document.getElementById('paginacaoVisitantes');
    if (!container || totalPaginas <= 1) { if (container) container.innerHTML = ''; return; }

    container.innerHTML = `
        <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;padding-bottom:20px;">
            ${pagina > 1 ? `<button class="btn btn-primary" onclick="mudarPagina(${pagina - 1})">Anterior</button>` : ''}
            <span style="align-self:center">Página ${pagina} de ${totalPaginas}</span>
            ${pagina < totalPaginas ? `<button class="btn btn-primary" onclick="mudarPagina(${pagina + 1})">Próxima</button>` : ''}
        </div>`;
}

function mudarPagina(p) {
    paginaAtual = p;
    carregarDadosVisitantes();
}

/* ── Excluir um registro ──────────────────────────────────── */
async function excluirRegistro(id) {
    if (!confirm("Excluir este registro?")) return;
    try {
        const response = await fetch('../controllers/visitantes_controller.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=excluir&id=${id}`
        });
        const result = await response.json();
        if (result.success) {
            // Remove o card com animação suave
            const card = document.getElementById(`visitor-card-${id}`);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.92)';
                setTimeout(() => carregarDadosVisitantes(), 320);
            } else {
                carregarDadosVisitantes();
            }
        }
    } catch (error) { alert('Erro ao excluir.'); }
}

/* ── Limpar todos os registros ────────────────────────────── */
async function limparTodosRegistros() {
    if (!confirm("Tem certeza que deseja excluir TODOS os registros de visitantes? Esta ação não pode ser desfeita.")) return;
    try {
        const response = await fetch('../controllers/visitantes_controller.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=excluir_todos'
        });
        const result = await response.json();
        if (result.success) {
            carregarDadosVisitantes();
        } else {
            alert(result.message || 'Erro ao limpar registros.');
        }
    } catch (error) { alert('Erro na requisição.'); }
}

/* ── Auxiliares ───────────────────────────────────────────── */
function formatarData(data) {
    const p = data.split('-');
    return p.length > 2 ? `${p[2]}/${p[1]}` : data;
}

function formatarDataHora(dataHora) {
    if (!dataHora) return '--';
    const d = new Date(dataHora.replace(/-/g, "/"));
    const dia  = String(d.getDate()).padStart(2, '0');
    const mes  = String(d.getMonth() + 1).padStart(2, '0');
    const hora = String(d.getHours()).padStart(2, '0');
    const min  = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes} ${hora}:${min}`;
}

function escHtml(str) {
    if (str == null) return '—';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getBrowserIcon(ua) {
    const b = ua ? ua.toLowerCase() : '';
    if (b.includes('firefox')) return 'bxl-firefox';
    if (b.includes('chrome'))  return 'bxl-chrome';
    if (b.includes('safari'))  return 'bxl-apple';
    if (b.includes('edge'))    return 'bxl-edge';
    return 'bx-globe';
}

function getOSIcon(os) {
    const s = os ? os.toLowerCase() : '';
    if (s.includes('linux'))   return 'bxl-tux';
    if (s.includes('win'))     return 'bxl-windows';
    if (s.includes('android')) return 'bxl-android';
    if (s.includes('ios') || s.includes('mac')) return 'bxl-apple';
    return 'bx-desktop';
}