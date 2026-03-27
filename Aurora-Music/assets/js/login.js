/**
 * LOGIN.JS - AURORA MUSIC 2026
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
        this.modal         = document.getElementById("loginModal");
        this.closeBtn      = document.querySelector(".close-modal");
        this.loginTrigger  = document.getElementById("loginTrigger");
        this.footerTrigger = document.getElementById("footerLoginTrigger");
        this.mobileTrigger = document.getElementById("loginMobileTrigger");
        this.form          = document.getElementById("loginForm");
        this.message       = document.getElementById("loginMessage");
        this.usuarioInput  = document.getElementById("email_login");
        this.passwordInput = document.getElementById("password_login");
    }

    init() {
        [this.loginTrigger, this.footerTrigger, this.mobileTrigger].forEach(btn => {
            if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); this.open(); });
        });

        if (this.closeBtn) this.closeBtn.addEventListener("click", (e) => { e.preventDefault(); this.close(); });

        this.modal.addEventListener("click", (e) => { if (e.target === this.modal) this.close(); });

        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && this.isModalOpen) this.close(); });

        this.form.addEventListener("submit", (e) => { e.preventDefault(); this.handleLogin(); });
    }

    open() {
        this.isModalOpen = true;
        this.modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        void this.modal.offsetWidth;
        this.modal.classList.add("active");
        setTimeout(() => this.usuarioInput?.focus(), 150);
    }

    close() {
        this.isModalOpen = false;
        this.modal.classList.remove("active");
        setTimeout(() => {
            if (!this.isModalOpen) {
                this.modal.style.display = "none";
                document.body.style.overflow = "";
            }
        }, 350);
        this.clearForm();
    }

    async handleLogin() {
        const usuario = this.usuarioInput?.value.trim() || "";
        const senha   = this.passwordInput?.value || "";

        if (!usuario || !senha) {
            this.showMessage("Preencha todos os campos.", "error");
            return;
        }

        this.showMessage("Entrando...", "info");

        try {
            // FormData usa os name="usuario" e name="senha" do HTML — direto e correto
            const formData = new FormData(this.form);

            const response = await fetch(this.form.action, {
                method: "POST",
                body: formData,
                credentials: "same-origin"
            });

            const text = await response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                this.showMessage("Erro inesperado do servidor.", "error");
                return;
            }

            if (data.success) {
                this.showMessage("✓ " + data.message, "success");
                setTimeout(() => {
                    window.location.href = data.redirect || "views/dashboard.php";
                }, 1200);
            } else {
                this.showMessage(data.message || "Usuário ou senha incorretos.", "error");
            }

        } catch (err) {
            this.showMessage("Erro de conexão. Tente novamente.", "error");
        }
    }

    showMessage(text, type) {
        if (!this.message) return;
        this.message.textContent = text;
        this.message.className = "login-message show " + type;
    }

    clearForm() {
        if (this.form) this.form.reset();
        if (this.message) this.message.className = "login-message";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.LoginModalInstance = new LoginModal();
});