// visitantes.js - Gerenciamento da seção de visitantes

let graficoVisitantes = null;
let paginaAtual = 1;
const registrosPorPagina = 20;

// Carrega os dados quando a seção de visitantes é aberta
document.addEventListener('DOMContentLoaded', function() {
    const linkVisitantes = document.querySelector('[data-section="visitantes"]');
    if (linkVisitantes) {
        linkVisitantes.addEventListener('click', function() {
            carregarDadosVisitantes();
        });
    }

    // Formulário de filtro
    const formFiltro = document.getElementById('formFiltroVisitantes');
    if (formFiltro) {
        formFiltro.addEventListener('submit', function(e) {
            e.preventDefault();
            paginaAtual = 1;
            carregarDadosVisitantes();
        });
    }
});

// Carrega todos os dados da seção de visitantes
async function carregarDadosVisitantes() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    await Promise.all([
        carregarGrafico(dataInicio, dataFim),
        carregarTabelaVisitantes(dataInicio, dataFim, paginaAtual)
    ]);
}

// Carrega o gráfico de visitantes
async function carregarGrafico(dataInicio, dataFim) {
    try {
        // Define período padrão (últimos 30 dias)
        if (!dataInicio || !dataFim) {
            const hoje = new Date();
            const trintaDiasAtras = new Date(hoje);
            trintaDiasAtras.setDate(hoje.getDate() - 30);
            
            dataFim = hoje.toISOString().split('T')[0];
            dataInicio = trintaDiasAtras.toISOString().split('T')[0];
        }

        const params = new URLSearchParams({
            inicio: dataInicio,
            fim: dataFim
        });

        const response = await fetch(`../controllers/visitantes_controller.php?action=grafico&${params}`);
        const data = await response.json();

        if (data.success) {
            renderizarGrafico(data.dados);
        } else {
            console.error('Erro ao carregar gráfico:', data.message);
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Renderiza o gráfico usando Chart.js
function renderizarGrafico(dados) {
    const ctx = document.getElementById('graficoVisitantes');
    
    if (!ctx) return;

    // Destrói o gráfico anterior se existir
    if (graficoVisitantes) {
        graficoVisitantes.destroy();
    }

    const labels = dados.map(d => formatarData(d.dia));
    const valores = dados.map(d => parseInt(d.total));

    graficoVisitantes = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Visitas por Dia',
                data: valores,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Carrega a tabela de visitantes
async function carregarTabelaVisitantes(dataInicio, dataFim, pagina) {
    try {
        const offset = (pagina - 1) * registrosPorPagina;
        
        const params = new URLSearchParams({
            action: 'listar',
            limit: registrosPorPagina,
            offset: offset
        });

        if (dataInicio) params.append('dataInicio', dataInicio);
        if (dataFim) params.append('dataFim', dataFim);

        const response = await fetch(`../controllers/visitantes_controller.php?${params}`);
        const data = await response.json();

        if (data.success) {
            renderizarTabela(data.dados);
            renderizarPaginacao(data.total, pagina);
        } else {
            document.getElementById('tabelaVisitantes').innerHTML = 
                '<tr><td colspan="6" style="text-align: center;">Erro ao carregar dados</td></tr>'; // Alterado colspan para 6
        }
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('tabelaVisitantes').innerHTML = 
            '<tr><td colspan="6" style="text-align: center;">Erro ao carregar dados</td></tr>'; // Alterado colspan para 6
    }
}

// Renderiza a tabela de visitantes (CORRIGIDA)
function renderizarTabela(visitantes) {
    const tbody = document.getElementById('tabelaVisitantes');
    
    if (visitantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum registro encontrado</td></tr>'; // Alterado colspan para 6
        return;
    }

    tbody.innerHTML = visitantes.map(v => `
        <tr>
            <td>${formatarDataHora(v.data_acesso)}</td>
            <td>${v.ip_address}</td>
            <td>${v.pagina}</td>
            <td><i class="fas fa-${getBrowserIcon(v.navegador)}"></i> ${v.navegador}</td>
            <td><i class="fas fa-${getOSIcon(v.sistema_operacional)}"></i> ${v.sistema_operacional}</td>
            
            <td style="text-align: center;">
                <button class="btn-delete" title="Excluir Registro" onclick="excluirRegistro(${v.id || 0})">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
            </tr>
    `).join('');
}

// Renderiza a paginação
function renderizarPaginacao(total, paginaAtual) {
    const totalPaginas = Math.ceil(total / registrosPorPagina);
    const container = document.getElementById('paginacaoVisitantes');
    
    if (totalPaginas <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div style="display: flex; gap: 10px; justify-content: center; align-items: center;">';
    
    // Botão Anterior
    if (paginaAtual > 1) {
        html += `<button class="btn btn-primary" onclick="mudarPagina(${paginaAtual - 1})">
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>`;
    }
    
    // Páginas
    html += `<span style="padding: 0 15px;">Página ${paginaAtual} de ${totalPaginas}</span>`;
    
    // Botão Próximo
    if (paginaAtual < totalPaginas) {
        html += `<button class="btn btn-primary" onclick="mudarPagina(${paginaAtual + 1})">
                    Próxima <i class="fas fa-chevron-right"></i>
                </button>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Muda a página da tabela
function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    carregarTabelaVisitantes(dataInicio, dataFim, paginaAtual);
}

/**
 * FUNÇÃO PARA EXCLUIR O REGISTRO (NOVA)
 * Esta função deve fazer uma chamada ao seu backend (controller)
 * para remover o registro do banco de dados.
 * @param {number} id - O ID do registro de visita a ser excluído.
 */
async function excluirRegistro(id) {
    if (id === 0 || !confirm("Tem certeza que deseja excluir este registro de acesso? Esta ação é irreversível.")) {
        return;
    }

    try {
        const response = await fetch('../controllers/visitantes_controller.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=excluir&id=${id}`
        });

        const result = await response.json();

        if (result.success) {
            alert('Registro excluído com sucesso!');
            // Recarregar a tabela após a exclusão
            carregarTabelaVisitantes(document.getElementById('dataInicio').value, document.getElementById('dataFim').value, paginaAtual);
        } else {
            alert(`Erro ao excluir registro: ${result.message}`);
        }
    } catch (error) {
        console.error('Erro de rede/servidor:', error);
        alert('Erro de conexão ao tentar excluir o registro.');
    }
}


// Funções auxiliares de formatação
function formatarData(data) {
    const partes = data.split('-');
    return `${partes[2]}/${partes[1]}`;
}

function formatarDataHora(dataHora) {
    const d = new Date(dataHora);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function getBrowserIcon(browser) {
    const icons = {
        'Chrome': 'chrome',
        'Firefox': 'firefox-browser',
        'Safari': 'safari',
        'Edge': 'edge',
        'IE': 'internet-explorer',
        'Opera': 'opera'
    };
    return icons[browser] || 'globe';
}

function getOSIcon(os) {
    const icons = {
        'Windows': 'windows',
        'MacOS': 'apple',
        'Linux': 'linux',
        'Android': 'android',
        'iOS': 'apple'
    };
    return icons[os] || 'desktop';
}