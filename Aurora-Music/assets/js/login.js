/**
 * LOGIN.JS - AURORA MUSIC 2026
 * Versão Blindada: Não interfere em outros botões.
 */
class LoginModal {
    constructor() {
        this.cacheElements();
        this.isModalOpen = false;
        
        if (this.modal && this.form) {
            this.init();
        }
    }

    cacheElements() {
        this.modal = document.getElementById("loginModal");
        this.overlay = document.getElementById("loginOverlay");
        this.closeBtn = document.getElementById("closeModal");
        this.loginTrigger = document.getElementById("loginTrigger");
        this.footerLoginTrigger = document.getElementById("footerLoginTrigger");
        this.mobileNavTrigger = document.getElementById("loginMobileTrigger");
        this.form = document.getElementById("loginForm");
        this.message = document.getElementById("formMessage");
        this.togglePassword = document.getElementById("togglePassword");
        this.passwordInput = document.getElementById("password");
        this.usernameInput = document.getElementById("username");
        this.loginButton = document.getElementById("btnLogin");
    }

    init() {
        // ABRIR: Uso de verificação estrita de ID
        if (this.loginTrigger) {
            this.loginTrigger.addEventListener('click', (e) => {
                if (e.currentTarget.id === 'loginTrigger') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.open();
                }
            });
        }

        // ABRIR: Link de login do footer (mobile)
        if (this.footerLoginTrigger) {
            this.footerLoginTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // marca origem para deslocar o modal um pouco mais baixo
                this.open('footer');
            });
        }

        // gatilho na barra inferior mobile
        if (this.mobileNavTrigger) {
            this.mobileNavTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.open();
            });
        }

        // FECHAR: Botão X
        if (this.closeBtn) {
            this.closeBtn.onclick = (e) => {
                e.preventDefault();
                this.close();
            };
        }

        // FECHAR: Clique no Fundo
        if (this.overlay) {
            this.overlay.onclick = (e) => {
                if (e.target === this.overlay) this.close();
            };
        }

        // FECHAR: Tecla ESC
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.isModalOpen) this.close();
        });

        // Alternar Senha (Boxicons)
        if (this.togglePassword) {
            this.togglePassword.onclick = (e) => {
                e.preventDefault();
                this.togglePasswordVisibility();
            };
        }

        // Submit do Form
        if (this.form) {
            this.form.onsubmit = (e) => {
                e.preventDefault();
                this.handleLogin();
            };
        }
    }

    open(source) {
        this.isModalOpen = true;
        this.modal.classList.add("active");
        if (this.overlay) this.overlay.classList.add("active");
        
        // se veio do rodapé, deslocar para baixo
        if (source === 'footer') {
            this.modal.style.top = '65%';
        } else {
            this.modal.style.top = '';
        }

        this.modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        
        setTimeout(() => this.usernameInput?.focus(), 150);
    }

    close() {
        this.isModalOpen = false;
        this.modal.classList.remove("active");
        if (this.overlay) this.overlay.classList.remove("active");
        
        setTimeout(() => {
            if (!this.isModalOpen) {
                this.modal.style.display = "none";
                document.body.style.overflow = "";
                // remove ajuste de posição personalizado
                this.modal.style.top = '';
            }
        }, 300);

        this.clearForm();
    }

    togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === "password";
        this.passwordInput.type = isPassword ? "text" : "password";
        const icon = this.togglePassword.querySelector("i");
        if (icon) icon.className = isPassword ? 'bx bx-show' : 'bx bx-hide';
    }

    async handleLogin() {
        const usuario = this.usernameInput?.value.trim() || '';
        const senha = this.passwordInput?.value || '';

        if (!usuario || !senha) {
            this.showMessage('Preencha todos os campos.', 'error');
            return;
        }

        this.setLoading(true);
        this.showMessage('', '');

        try {
            const formData = new FormData();
            formData.append('usuario', usuario);
            formData.append('senha', senha);

            const response = await fetch('controllers/AuthController.php?auth_action=login', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('✓ Login realizado com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
            } else {
                this.showMessage(data.message || 'Erro ao fazer login.', 'error');
            }
        } catch (error) {
            this.showMessage('Erro de conexão. Tente novamente.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    showMessage(text, type) {
        if (!this.message) return;
        this.message.textContent = text;
        this.message.className = `form-message show ${type}`;
    }

    setLoading(isLoading) {
        if (!this.loginButton) return;
        this.loginButton.disabled = isLoading;
        const loader = this.loginButton.querySelector(".btn-loader");
        const text = this.loginButton.querySelector(".btn-text");
        if (loader) loader.style.display = isLoading ? "inline-block" : "none";
        if (text) text.style.display = isLoading ? "none" : "inline";
    }

    clearForm() {
        if (this.form) this.form.reset();
        if (this.message) this.message.className = "form-message";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.LoginModalInstance = new LoginModal();
});