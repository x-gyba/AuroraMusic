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
            const resp = await fetch('/Aurora-Music/controllers/AuthController.php?auth_action=check', {
                method: 'GET', 
                credentials: 'include'
            });
            const data = await resp.json();
            if (!data.logged_in) {
                showMessage('Sessão expirada. Redirecionando...', 'error');
                setTimeout(() => { window.location.href = '../index.php'; }, 2000);
            }
        } catch (err) {
            console.warn('Auth check failed:', err);
        }
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const file = musicFileInput.files[0];

            if (!file) {
                showMessage('Por favor, selecione um arquivo.', 'error');
                return;
            }

            if (!file.name.toLowerCase().endsWith('.mp3')) {
                showMessage('Por favor, selecione apenas arquivos MP3.', 'error');
                return;
            }

            let coverImageFile = null;
            if (coverImageInput && coverImageInput.files.length > 0) {
                coverImageFile = coverImageInput.files[0];
            }

            const formData = new FormData();
            formData.append('musicFile', file);
            if (coverImageFile) formData.append('coverImage', coverImageFile);
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
                    try {
                        const resp = JSON.parse(xhr.responseText);
                        if (xhr.status === 200 && resp.success) {
                            showMessage(resp.message || 'MP3 enviado com sucesso!', 'success');
                            uploadForm.reset();
                            loadMusicList();
                        } else {
                            showMessage(resp.message || 'Falha ao enviar.', 'error');
                        }
                    } catch (err) {
                        showMessage('Erro no servidor (não retornou JSON).', 'error');
                    }
                });

                xhr.addEventListener('loadend', resetUploadUI);
                xhr.open('POST', '/Aurora-Music/controllers/upload_music.php', true);
                xhr.send(formData);

            } catch (err) {
                showMessage('Erro: ' + err.message, 'error');
                resetUploadUI();
            }
        });
    }

    function resetUploadUI() {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Música';
        setTimeout(() => {
            progressContainer.style.display = 'none';
            uploadProgress.style.width = '0%';
        }, 2000);
    }

    function showMessage(msg, type) {
        messageContainer.innerHTML = `<div class="message message-${type}">${escapeHtml(msg)}</div>`;
        setTimeout(() => messageContainer.innerHTML = '', 5000);
    }

    async function loadMusicList() {
        try {
            const resp = await fetch('/Aurora-Music/controllers/get_music.php', {
                method: 'GET', credentials: 'include'
            });
            const data = await resp.json();

            if (data.success && data.musics) {
                displayMusicList(data.musics);
            } else {
                musicListContainer.innerHTML = '<p class="no-music">Nenhuma música encontrada.</p>';
            }
        } catch (err) {
            musicListContainer.innerHTML = '<p class="error">Erro ao carregar músicas.</p>';
        }
    }

    function displayMusicList(musics) {
        if (!musics || musics.length === 0) {
            musicListContainer.innerHTML = '<p class="no-music">Nenhuma música encontrada.</p>';
            return;
        }

        const html = musics.map(m => {
            let titulo = m.nome_exibicao || m.nome_arquivo.replace(/\.mp3$/i, '');
            
            // CORREÇÃO DA CAPA: Usa o caminho do banco + prefixo do projeto
            const coverPath = m.caminho_imagem 
                ? `/Aurora-Music/${m.caminho_imagem}` 
                : '/Aurora-Music/assets/images/cover.png';

            return `
                <div class="music-item" data-id="${m.id}">
                    <div class="music-cover">
                        <img src="${escapeHtml(coverPath)}" 
                             alt="Capa" 
                             class="cover-thumbnail" 
                             onerror="this.src='/Aurora-Music/assets/images/cover.png';">
                    </div>
                    <div class="music-info">
                        <h3>${escapeHtml(titulo)}</h3>
                        <p class="music-filename">Arquivo: ${escapeHtml(m.nome_arquivo)}</p>
                        <p class="music-size">${formatFileSize(m.tamanho_arquivo)}</p>
                    </div>
                    <div class="music-actions">
                        <button class="btn btn-delete" onclick="deleteMusic(${m.id})" title="Excluir">
                            <i class='bx bx-trash'></i>
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

    function formatFileSize(b) {
        if (!b) return '0 Bytes';
        const k = 1024, s = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return (b / Math.pow(k, i)).toFixed(2) + ' ' + s[i];
    }

    window.deleteMusic = async function (id) {
        if (!confirm('Tem certeza que deseja EXCLUIR esta música?')) return;
        try {
            const resp = await fetch('/Aurora-Music/controllers/delete_music.php', {
                method: 'POST', 
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const data = await resp.json();
            if (data.success) {
                showMessage('Música excluída!', 'success');
                loadMusicList();
            } else {
                showMessage(data.message || 'Erro ao excluir.', 'error');
            }
        } catch (err) {
            showMessage('Erro de rede ao excluir.', 'error');
        }
    };
});