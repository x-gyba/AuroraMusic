/**
 * visitantes.js - Aurora Music
 * Gerenciamento de Estatísticas
 */

let graficoVisitantes = null;
let paginaAtual = 1;
const registrosPorPagina = 20;

document.addEventListener('DOMContentLoaded', () => {
    // Carrega dados automáticos ao entrar na seção
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
});

async function carregarDadosVisitantes() {
    let dInicio = document.getElementById('dataInicio')?.value || '';
    let dFim = document.getElementById('dataFim')?.value || '';
    
    // Se estiver vazio, define últimos 7 dias para o gráfico não morrer
    if (!dInicio || !dFim) {
        const hoje = new Date();
        const passada = new Date();
        passada.setDate(hoje.getDate() - 7);
        dFim = hoje.toISOString().split('T')[0];
        dInicio = passada.toISOString().split('T')[0];
    }

    await Promise.all([
        carregarGrafico(dInicio, dFim),
        carregarTabelaVisitantes(dInicio, dFim, paginaAtual)
    ]);
}

async function carregarGrafico(inicio, fim) {
    try {
        const response = await fetch(`../controllers/visitantes_controller.php?action=grafico&inicio=${inicio}&fim=${fim}`);
        const data = await response.json();
        if (data.success && data.dados) {
            renderizarGrafico(data.dados);
        }
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
            labels: labels,
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

async function carregarTabelaVisitantes(dataInicio, dataFim, pagina) {
    const tbody = document.getElementById('tabelaVisitantes');
    try {
        const params = new URLSearchParams({
            action: 'listar',
            limit: registrosPorPagina,
            offset: (pagina - 1) * registrosPorPagina,
            dataInicio: dataInicio,
            dataFim: dataFim
        });

        const response = await fetch(`../controllers/visitantes_controller.php?${params}`);
        const data = await response.json();

        if (data.success) {
            renderizarTabela(data.dados);
            renderizarPaginacao(data.total, pagina);
        }
    } catch (error) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6">Erro ao carregar dados.</td></tr>';
    }
}

function renderizarTabela(visitantes) {
    const tbody = document.getElementById('tabelaVisitantes');
    if (!tbody) return;

    if (!visitantes || visitantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum registro.</td></tr>';
        return;
    }

    tbody.innerHTML = visitantes.map(v => `
        <tr>
            <td>${formatarDataHora(v.data_acesso)}</td>
            <td>${v.ip_address}</td>
            <td>${v.pagina}</td>
            <td><i class='bx ${getBrowserIcon(v.navegador)}'></i> ${v.navegador}</td>
            <td><i class='bx ${getOSIcon(v.sistema_operacional)}'></i> ${v.sistema_operacional}</td>
            <td style="text-align: center;">
                <button class="btn-delete" title="Excluir" onclick="excluirRegistro(${v.id})">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderizarPaginacao(total, pagina) {
    const totalPaginas = Math.ceil(total / registrosPorPagina);
    const container = document.getElementById('paginacaoVisitantes');
    if (!container || totalPaginas <= 1) { if(container) container.innerHTML = ''; return; }

    container.innerHTML = `
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
            ${pagina > 1 ? `<button class="btn btn-primary" onclick="mudarPagina(${pagina - 1})">Anterior</button>` : ''}
            <span style="align-self:center">Página ${pagina} de ${totalPaginas}</span>
            ${pagina < totalPaginas ? `<button class="btn btn-primary" onclick="mudarPagina(${pagina + 1})">Próxima</button>` : ''}
        </div>`;
}

function mudarPagina(p) {
    paginaAtual = p;
    carregarDadosVisitantes();
}

async function excluirRegistro(id) {
    if (!confirm("Excluir este registro?")) return;
    try {
        const response = await fetch('../controllers/visitantes_controller.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=excluir&id=${id}`
        });
        const result = await response.json();
        if (result.success) carregarDadosVisitantes();
    } catch (error) { alert('Erro ao excluir.'); }
}

// Auxiliares
function formatarData(data) {
    const p = data.split('-');
    return p.length > 2 ? `${p[2]}/${p[1]}` : data;
}

function formatarDataHora(dataHora) {
    if(!dataHora) return '--';
    const d = new Date(dataHora.replace(/-/g, "/"));
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes} ${hora}:${min}`;
}

function getBrowserIcon(ua) {
    const b = ua.toLowerCase();
    if (b.includes('firefox')) return 'bxl-firefox';
    if (b.includes('chrome')) return 'bxl-chrome';
    if (b.includes('safari')) return 'bxl-apple';
    if (b.includes('edge')) return 'bxl-edge';
    return 'bx-globe';
}

function getOSIcon(os) {
    const s = os.toLowerCase();
    if (s.includes('linux')) return 'bxl-tux';
    if (s.includes('win')) return 'bxl-windows';
    if (s.includes('android')) return 'bxl-android';
    if (s.includes('ios') || s.includes('mac')) return 'bxl-apple';
    return 'bx-desktop';
}