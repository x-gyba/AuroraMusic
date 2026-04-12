document.addEventListener('DOMContentLoaded', function () {

    // ─── Toggle do Menu ───────────────────────────────────────────
    const menuToggle = document.getElementById('menuToggle');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuToggle && dashboardContainer && sidebarOverlay) {
        menuToggle.addEventListener('click', function () {
            if (window.innerWidth <= 768) {
                dashboardContainer.classList.toggle('sidebar-open');
                sidebarOverlay.classList.toggle('active');
            } else {
                dashboardContainer.classList.toggle('sidebar-closed');
            }
        });

        sidebarOverlay.addEventListener('click', function () {
            dashboardContainer.classList.remove('sidebar-open');
            sidebarOverlay.classList.remove('active');
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) {
                dashboardContainer.classList.remove('sidebar-open');
                sidebarOverlay.classList.remove('active');
            }
        });
    }

    // ─── Navegação entre seções ───────────────────────────────────
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.content-section');

    if (navLinks.length > 0 && sections.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetSection = this.getAttribute('data-section');

                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                sections.forEach(s => s.classList.remove('active'));

                const targetElement = document.getElementById(targetSection);
                if (targetElement) targetElement.classList.add('active');

                if (window.innerWidth <= 768 && dashboardContainer) {
                    dashboardContainer.classList.remove('sidebar-open');
                    sidebarOverlay.classList.remove('active');
                }
            });
        });
    }

    // ─── Logout ───────────────────────────────────────────────────
    window.realizarLogout = function (e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (confirm('Deseja realmente sair do sistema?')) {
            window.location.replace('logout.php');
        }
        return false;
    };

    // ─── Form de Clientes ─────────────────────────────────────────
    const formClientes = document.getElementById('formClientes');
    if (formClientes) {
        formClientes.addEventListener('submit', function (e) {
            e.preventDefault();
            const nome = document.getElementById('nomeCliente').value;
            const email = document.getElementById('emailCliente').value;
            const telefone = document.getElementById('telefoneCliente').value;
            alert(`Cliente cadastrado com sucesso!\n\nNome: ${nome}\nE-mail: ${email}\nTelefone: ${telefone}`);
            this.reset();
        });
    }

    // ═══════════════════════════════════════════════════════════════
    //  GESTÃO DE PUBLICIDADE (UPLOAD E DELETE)
    // ═══════════════════════════════════════════════════════════════
    const formUploadPromo = document.getElementById('formUploadPromo');
    if (formUploadPromo) {
        formUploadPromo.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = document.getElementById('btnSubirPromo');
            const status = document.getElementById('statusUploadPromo');
            const formData = new FormData(this);

            btn.disabled = true;
            status.style.color = '#2563eb';
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando áudio...';

            fetch('/Aurora-Music/upload-promo', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                btn.disabled = false;
                if (data.status === 'success') {
                    status.style.color = 'green';
                    status.innerHTML = '<i class="fas fa-check"></i> Upload concluído!';
                    formUploadPromo.reset();
                    setTimeout(() => location.reload(), 800);
                } else {
                    status.style.color = 'red';
                    status.innerHTML = 'Erro: ' + (data.message || 'Falha no upload.');
                }
            })
            .catch(err => {
                console.error('Erro no upload:', err);
                status.style.color = 'red';
                status.innerHTML = 'Erro ao enviar arquivo.';
                btn.disabled = false;
            });
        });
    }

    // Deleção de Promos via Event Delegation (Lixeira Boxicons)
    document.addEventListener('click', function (e) {
        const btnDelete = e.target.closest('.btn-delete-promo');
        if (btnDelete) {
            const filename = btnDelete.getAttribute('data-filename');

            if (confirm(`Deseja excluir permanentemente o áudio: ${filename}?`)) {
                const formData = new FormData();
                formData.append('filename', filename);

                fetch('/Aurora-Music/delete-promo', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        location.reload();
                    } else {
                        alert('Erro: ' + data.message);
                    }
                })
                .catch(err => {
                    console.error('Erro na requisição de deleção:', err);
                    alert('Erro ao processar a exclusão.');
                });
            }
        }
    });

    // ═══════════════════════════════════════════════════════════════
    //  LIMPEZA DE ARQUIVOS ÓRFÃOS
    // ═══════════════════════════════════════════════════════════════
    const btnVerificar = document.getElementById('btnVerificarOrfaos');
    const btnLimpar = document.getElementById('btnLimparOrfaos');
    const statusCard = document.getElementById('orphanStatusCard');
    const resultDiv = document.getElementById('orphanResult');
    const resultTitle = document.getElementById('orphanResultTitle');
    const statsDiv = document.getElementById('orphanStats');
    const fileList = document.getElementById('orphanFileList');
    const errorList = document.getElementById('orphanErrorList');

    let dadosOrfaos = null;

    function setStatus(tipo, titulo, subtitulo) {
        const icons = {
            idle: 'fa-search',
            loading: 'fa-spinner fa-spin',
            found: 'fa-exclamation-triangle',
            clean: 'fa-check-circle',
            success: 'fa-check-circle',
            error: 'fa-times-circle',
        };
        const cores = {
            idle: '',
            loading: 'status-loading',
            found: 'status-warning',
            clean: 'status-success',
            success: 'status-success',
            error: 'status-error',
        };

        if (statusCard) {
            statusCard.className = 'orphan-status-card ' + (cores[tipo] || '');
            statusCard.querySelector('.orphan-status-icon').innerHTML =
                `<i class="fas ${icons[tipo] || 'fa-search'}"></i>`;
            statusCard.querySelector('strong').textContent = titulo;
            statusCard.querySelector('span').textContent = subtitulo;
        }
    }

    function renderResult(data, modo) {
        if (!resultDiv) return;
        resultDiv.style.display = 'block';
        fileList.innerHTML = '';
        errorList.innerHTML = '';
        statsDiv.innerHTML = '';

        if (modo === 'verificar') {
            resultTitle.textContent = data.total_deletados === 0
                ? '✅ Nenhum arquivo órfão encontrado'
                : `⚠️ ${data.total_deletados} arquivo(s) órfão(s) encontrado(s)`;

            if (data.total_deletados > 0) {
                statsDiv.innerHTML = `
                    <div class="orphan-stat-item">
                        <i class="fas fa-file-audio"></i>
                        <span><strong>${data.total_deletados}</strong> arquivo(s) órfão(s)</span>
                    </div>
                    <div class="orphan-stat-item">
                        <i class="fas fa-weight-hanging"></i>
                        <span><strong>${data.mb_liberados} MB</strong> a liberar</span>
                    </div>`;

                data.deletados.forEach(f => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="fas fa-file"></i> ${f}`;
                    fileList.appendChild(li);
                });
            }
        } else {
            resultTitle.textContent = data.total_deletados === 0
                ? '✅ Nenhum arquivo para remover'
                : `🗑️ ${data.total_deletados} arquivo(s) removido(s)`;

            if (data.total_deletados > 0) {
                statsDiv.innerHTML = `
                    <div class="orphan-stat-item orphan-stat-success">
                        <i class="fas fa-trash-alt"></i>
                        <span><strong>${data.total_deletados}</strong> arquivo(s) deletado(s)</span>
                    </div>
                    <div class="orphan-stat-item orphan-stat-success">
                        <i class="fas fa-hdd"></i>
                        <span><strong>${data.mb_liberados} MB</strong> liberados</span>
                    </div>`;

                data.deletados.forEach(f => {
                    const li = document.createElement('li');
                    li.className = 'deleted';
                    li.innerHTML = `<i class="fas fa-check"></i> ${f}`;
                    fileList.appendChild(li);
                });
            }

            if (data.erros && data.erros.length > 0) {
                const titulo = document.createElement('li');
                titulo.innerHTML = `<strong style="color:#ef4444">Erros ao deletar:</strong>`;
                errorList.appendChild(titulo);
                data.erros.forEach(f => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="fas fa-times"></i> ${f}`;
                    errorList.appendChild(li);
                });
            }
        }
    }

    if (btnVerificar) {
        btnVerificar.addEventListener('click', async function () {
            setStatus('loading', 'Varrendo arquivos...', 'Aguarde enquanto comparamos disco e banco de dados.');
            btnVerificar.disabled = true;
            btnLimpar.disabled = true;
            resultDiv.style.display = 'none';
            dadosOrfaos = null;

            try {
                const resp = await fetch('/Aurora-Music/controllers/delete_music.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'scan_orphans' })
                });

                const text = await resp.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (parseErr) {
                    throw new Error('Resposta inválida do servidor: ' + text.substring(0, 200));
                }

                if (!data.success) throw new Error(data.message);

                const adapted = {
                    total_deletados: data.total,
                    mb_liberados: data.mb,
                    deletados: data.arquivos || [],
                };
                dadosOrfaos = adapted;

                if (adapted.total_deletados === 0) {
                    setStatus('clean', 'Tudo limpo!', 'Nenhum arquivo órfão encontrado na pasta music/.');
                } else {
                    setStatus('found',
                        `${adapted.total_deletados} arquivo(s) órfão(s) encontrado(s)`,
                        `${adapted.mb_liberados} MB podem ser liberados. Clique em "Limpar Órfãos" para remover.`
                    );
                    btnLimpar.disabled = false;
                }
                renderResult(adapted, 'verificar');
            } catch (err) {
                setStatus('error', 'Erro na verificação', err.message);
            } finally {
                btnVerificar.disabled = false;
            }
        });
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', async function () {
            if (!dadosOrfaos || dadosOrfaos.total_deletados === 0) return;

            const confirmado = confirm(
                `Você está prestes a remover permanentemente ${dadosOrfaos.total_deletados} arquivo(s) ` +
                `(${dadosOrfaos.mb_liberados} MB).\n\nEsta ação não pode ser desfeita. Continuar?`
            );
            if (!confirmado) return;

            setStatus('loading', 'Removendo arquivos...', 'Aguarde enquanto os arquivos órfãos são deletados.');
            btnLimpar.disabled = true;
            btnVerificar.disabled = true;

            try {
                const resp = await fetch('/Aurora-Music/controllers/delete_music.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'clean_orphans' })
                });

                const text = await resp.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (parseErr) {
                    throw new Error('Resposta inválida do servidor: ' + text.substring(0, 200));
                }

                if (!data.success) throw new Error(data.message);

                const adapted = {
                    total_deletados: data.total,
                    mb_liberados: data.mb,
                    deletados: data.deletados || [],
                    erros: data.erros || [],
                };

                setStatus('success',
                    'Limpeza concluída!',
                    `${adapted.total_deletados} arquivo(s) removido(s). ${adapted.mb_liberados} MB liberados.`
                );

                renderResult(adapted, 'limpar');
                dadosOrfaos = null;
            } catch (err) {
                setStatus('error', 'Erro na limpeza', err.message);
                btnLimpar.disabled = false;
            } finally {
                btnVerificar.disabled = false;
            }
        });
    }
});