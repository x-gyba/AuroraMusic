<?php
// views/login.php
?>
<div class="login-modal-overlay" id="loginOverlay"></div>

<div class="login-modal" id="loginModal">
    <div class="login-modal-content">
        <button class="login-close" id="closeModal" type="button" aria-label="Fechar modal">
            <i class="bx bx-x"></i>
        </button>

        <div class="login-header">
            <i class="bx bx-shield-quarter"></i>
            <h2>Login</h2>
            <p>Painel Administrativo</p>
        </div>

        <form id="loginForm" class="login-form-modal" method="post" autocomplete="off">
            <div class="form-group">
                <label for="username">
                    <i class="bx bx-user"></i>
                    Usuário
                </label>
                <input
                    type="text"
                    id="username"
                    name="usuario"
                    placeholder="Digite seu usuário"
                    required
                    autocomplete="username"
                >
            </div>

            <div class="form-group">
                <label for="password">
                    <i class="bx bx-lock-alt"></i>
                    Senha
                </label>
                <div class="password-field"> 
                    <input
                        type="password"
                        id="password"
                        name="senha"
                        placeholder="Digite sua senha"
                        required
                        autocomplete="current-password"
                    >
                    <button type="button" id="togglePassword" aria-label="Mostrar senha">
                        <i class="bx bx-show"></i>
                    </button>
                </div>
            </div>

            <div class="form-message" id="formMessage"></div>

            <button type="submit" id="btnLogin">
                <span class="btn-text">Entrar</span>
                <span class="btn-loader" style="display: none;">
                    <i class="bx bx-loader-alt bx-spin"></i>
                </span>
            </button>
        </form>
    </div>
</div>