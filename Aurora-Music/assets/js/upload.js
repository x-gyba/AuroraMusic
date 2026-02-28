document.addEventListener('DOMContentLoaded', function () {
    const uploadForm = document.getElementById('uploadForm');
    const musicFileInput = document.getElementById('musicFile');
    const coverImageInput = document.getElementById('coverImage');
    const displayNameInput = document.getElementById('displayName');
    const submitBtn = document.getElementById('submitBtn');
    const progressContainer = document.getElementById('progressContainer');
    const uploadProgress = document.getElementById('uploadProgress');
    const messageContainer = document.getElementById('messageContainer');
    const musicListContainer = document.getElementById('musicListContainer');

    checkAuthentication();
    loadMusicList();

    async function checkAuthentication() {
        try {
            const resp = await fetch('../controllers/AuthController.php?auth_action=check', {
                method: 'GET', credentials: 'include'
            });
            const data = await resp.json();
            if (!data.logged_in) {
                showMessage('Sessão expirada. Redirecionando...', 'error');
                setTimeout(() => { window.location.href = '../index.php'; }, 2000);
            }
        } catch (err) {
            // Erro silencioso
        }
    }

    uploadForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const file = musicFileInput.files[0];

        if (!file) {
            showMessage('Por favor, selecione um arquivo.', 'error');
            return;
        }

        // Validação de extensão mais segura (baseada no nome)
        if (!file.name.toLowerCase().endsWith('.mp3')) {
            showMessage('Por favor, selecione apenas arquivos MP3.', 'error');
            return;
        }

        // Validação de MIME type (menos confiável no cliente, mas bom como primeira camada)
        if (!file.type.includes('audio/mpeg') && !file.type.includes('audio/mp3')) {
            showMessage('Por favor, selecione apenas arquivos MP3.', 'error');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            showMessage('O arquivo é muito grande. Máximo: 50MB', 'error');
            return;
        }

        // Validar imagem se fornecida
        let coverImageFile = null;
        if (coverImageInput && coverImageInput.files.length > 0) {
            coverImageFile = coverImageInput.files[0];
            const allowedImgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const imgExt = coverImageFile.name.split('.').pop().toLowerCase();
            
            if (!allowedImgExts.includes(imgExt)) {
                showMessage('Imagem deve ser JPG, PNG, GIF ou WebP.', 'error');
                return;
            }
            
            if (coverImageFile.size > 5 * 1024 * 1024) {
                showMessage('Imagem muito grande. Máximo: 5MB', 'error');
                return;
            }
        }

        const formData = new FormData();
        formData.append('musicFile', file);
        if (coverImageFile) {
            formData.append('coverImage', coverImageFile);
        }
        const displayName = displayNameInput.value.trim();
        if (displayName) formData.append('displayName', displayName);

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        progressContainer.style.display = 'block';
        messageContainer.innerHTML = '';

        try {
            const xhr = new XMLHttpRequest();
            xhr.withCredentials = true;

            xhr.upload.addEventListener('progress', function (e) {
                if (e.lengthComputable) {
                    const pct = Math.round((e.loaded / e.total) * 100);
                    uploadProgress.style.width = pct + '%';
                    uploadProgress.textContent = pct + '%';
                }
            });

            xhr.addEventListener('load', function () {
                let resp;
                try {
                    resp = JSON.parse(xhr.responseText);
                    if (xhr.status === 200 && resp.success) {
                        // usa mensagem proveniente do backend, caso exista
                        const msg = resp.message || 'MP3 enviado com sucesso!';
                        showMessage(msg, 'success');
                        uploadForm.reset();
                        loadMusicList();
                    } else if (resp.message && resp.message.includes('autenticado')) {
                        showMessage('Sessão expirada. Redirecionando...', 'error');
                        setTimeout(() => { window.location.href = '../index.php'; }, 2000);
                    } else {
                        const msg = resp.message || 'Falha ao enviar o MP3. Tente novamente.';
                        showMessage(msg, 'error');
                    }
                } catch (err) {
                    // Resposta do servidor não era JSON válida, trata como erro
                    console.error('Resposta do servidor inválida:', xhr.responseText);
                    showMessage('Falha ao enviar o MP3. Tente novamente.', 'error');
                }
            });

            xhr.addEventListener('loadend', resetUploadUI);
            xhr.addEventListener('error', () => { showMessage('Erro de rede.', 'error'); resetUploadUI(); });
            xhr.addEventListener('timeout', () => { showMessage('Tempo excedido.', 'error'); resetUploadUI(); });

            xhr.timeout = 300000; // 5 minutos de timeout
            xhr.open('POST', '../controllers/upload_music.php', true);
            xhr.send(formData);
        } catch (err) {
            showMessage('Erro: ' + err.message, 'error');
            resetUploadUI();
        }
    });

    function resetUploadUI() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Música';
        setTimeout(() => {
            progressContainer.style.display = 'none';
            uploadProgress.style.width = '0%';
            uploadProgress.textContent = '0%';
        }, 2000);
    }

    function showMessage(msg, type) {
        messageContainer.innerHTML = `<div class="message message-${type}">${escapeHtml(msg)}</div>`;
        setTimeout(() => messageContainer.innerHTML = '', 5000);
    }

    async function loadMusicList() {
        try {
            const resp = await fetch('../controllers/get_music.php', {
                method: 'GET', credentials: 'include'
            });
            const data = await resp.json();

            if (data.success && data.musics && data.musics.length > 0) {
                displayMusicList(data.musics);
            } else if (data.message && data.message.includes('autenticado')) {
                showMessage('Sessão expirada.', 'error');
                setTimeout(() => { window.location.href = '../index.php'; }, 2000);
            } else {
                musicListContainer.innerHTML = '<p class="no-music">Nenhuma música encontrada.</p>';
            }
        } catch (err) {
            musicListContainer.innerHTML = '<p class="error">Erro ao carregar músicas.</p>';
        }
    }

    function displayMusicList(musics) {
        const html = musics.map(m => {
            // Lógica para definir o título a ser exibido
            let titulo = m.nome_exibicao || m.display_name || '';
            if (!titulo || titulo.trim() === '') {
                // Fallback: nome_arquivo sem extensão
                titulo = (m.nome_arquivo || '').replace(/\.mp3$/i, '');
            }
            if (!titulo || titulo.trim() === '') {
                titulo = 'Música sem nome';
            }

            const nomeArq = m.nome_arquivo || '';
            // Define imagem: cover se existir, senão imagem padrão
            const coverImg = m.cover_web || '../assets/images/cover.png';

            return `
                <div class="music-item" data-id="${m.id}">
                    <div class="music-cover">
                        <img src="${escapeHtml(coverImg)}" alt="Capa da música" class="cover-thumbnail" />
                    </div>
                    <div class="music-info">
                        <h3>${escapeHtml(titulo)}</h3>
                        <p class="music-filename">Arquivo: ${escapeHtml(nomeArq)}</p>
                        <p class="music-size">${formatFileSize(m.tamanho_arquivo)}</p>
                        <p class="music-date">Enviado em: ${formatDate(m.data_upload)}</p>
                    </div>
                    <div class="music-actions">
                        <button class="btn btn-delete" onclick="deleteMusic(${m.id})">
                            🗑 Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        musicListContainer.innerHTML = html;
    }

    function escapeHtml(t) {
        if (!t) return '';
        const d = document.createElement('div');
        d.textContent = t;
        return d.innerHTML;
    }

    // Esta função não é mais estritamente necessária após a remoção do player, mas pode ser mantida
    // caso o caminho web ainda seja usado em outro lugar.
    function escJs(t) {
        if (!t) return '';
        return t.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    function formatDate(ds) {
        if (!ds) return '';
        return new Date(ds).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function formatFileSize(b) {
        if (!b) return '0 Bytes';
        const k = 1024, s = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return Math.round(b / Math.pow(k, i) * 100) / 100 + ' ' + s[i];
    }

    // FUNÇÃO window.playMusic FOI REMOVIDA AQUI

    window.deleteMusic = async function (id) {
        if (!confirm('Tem certeza que deseja EXCLUIR permanentemente esta música?')) return;
        try {
            const resp = await fetch('../controllers/delete_music.php', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await resp.json();
            if (data.success) {
                showMessage('Música excluída com sucesso!', 'success');
                loadMusicList();
            } else {
                showMessage(data.message || 'Erro ao excluir música.', 'error');
            }
        } catch (err) {
            showMessage('Erro de rede: ' + err.message, 'error');
        }
    };
});