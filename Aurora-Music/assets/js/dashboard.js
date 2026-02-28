document.addEventListener('DOMContentLoaded', function() {
    // --- O código só é executado após o HTML estar completamente carregado ---

    // Toggle do Menu
    const menuToggle = document.getElementById('menuToggle');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // É importante verificar se os elementos existem antes de adicionar listeners
    if (menuToggle && dashboardContainer && sidebarOverlay) {
        menuToggle.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                dashboardContainer.classList.toggle('sidebar-open');
                sidebarOverlay.classList.toggle('active');
            } else {
                dashboardContainer.classList.toggle('sidebar-closed');
            }
        });

        // Fechar sidebar ao clicar no overlay
        sidebarOverlay.addEventListener('click', function() {
            dashboardContainer.classList.remove('sidebar-open');
            sidebarOverlay.classList.remove('active');
        });

        // Responsividade - ajusta comportamento do menu
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                dashboardContainer.classList.remove('sidebar-open');
                sidebarOverlay.classList.remove('active');
            }
        });
    }

    // Navegação entre seções
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.content-section');

    if (navLinks.length > 0 && sections.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                const targetSection = this.getAttribute('data-section');

                // Remove active de todos os links
                navLinks.forEach(l => l.classList.remove('active'));

                // Adiciona active ao link clicado
                this.classList.add('active');

                // Esconde todas as seções
                sections.forEach(section => section.classList.remove('active'));

                // Mostra a seção alvo
                const targetElement = document.getElementById(targetSection);
                if (targetElement) {
                    targetElement.classList.add('active');
                }

                // Fecha sidebar no mobile
                if (window.innerWidth <= 768 && dashboardContainer) {
                    dashboardContainer.classList.remove('sidebar-open');
                    sidebarOverlay.classList.remove('active');
                }
            });
        });
    }

    // Abrir cadastro de músicas - navegação segura
    window.abrirCadastroMusicas = function(e) {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        // Garante que apenas uma janela seja aberta
        window.location.replace('upload.php');
        return false;
    };

    // Função de Logout - com confirmação
    // Não precisa de verificação de elemento, é uma função.
    window.realizarLogout = function(e) {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        if (confirm('Deseja realmente sair do sistema?')) {
            // Usa replace para evitar múltiplas abas
            window.location.replace('logout.php');
        }
        return false;
    };

    // Form de Clientes
    const formClientes = document.getElementById('formClientes');
    if (formClientes) {
        formClientes.addEventListener('submit', function(e) {
            e.preventDefault();

            const nome = document.getElementById('nomeCliente').value;
            const email = document.getElementById('emailCliente').value;
            const telefone = document.getElementById('telefoneCliente').value;
            const endereco = document.getElementById('enderecoCliente').value;

            // Lógica de salvamento (simulação)
            // Dados capturados para salvamento
            alert(`Cliente cadastrado com sucesso!\n\nNome: ${nome}\nE-mail: ${email}\nTelefone: ${telefone}`);

            // Limpa o formulário
            this.reset();
        });
    }

});
