# Aurora Music - Sistema de Upload de Cobertas/Capas

## 📋 Resumo das Alterações

O sistema agora suporta upload de imagens de capa para as músicas, com exibição na lista de músicas e fallback para uma imagem padrão.

### ✅ O que foi implementado:

#### 1. **Banco de Dados** ✓
- Migração executada com sucesso via `scripts/add_cover_migration.php`
- Novas colunas adicionadas:
  - `caminho_imagem` (VARCHAR 500): Caminho relativo da imagem
  - `tipo_imagem` (ENUM): Tipo de arquivo (jpg, png, gif, webp)
- Índice criado em `caminho_imagem` para melhor performance

#### 2. **Backend (PHP)** ✓
- `controllers/upload_music.php`:
  - Processa upload opcional de imagem de capa
  - Validação de tipo MIME e tamanho (máx 5MB)
  - Cria pasta `music/covers/` automaticamente se não existir
  - Tratamento automático de permissões de pasta
  - Retorna `cover_web` na resposta JSON

- `controllers/get_music.php`:
  - Calcula e retorna o caminho `cover_web` para cada música
  - Usa caminho padrão se não haver capa customizada

#### 3. **Frontend (JavaScript)** ✓
- `assets/js/upload.js`:
  - Detecta e valida arquivo de capa (extensão, MIME, tamanho)
  - Envia capa junto com MP3 via FormData
  - Exibe capa na lista de músicas com fallback

- `assets/css/upload.css`:
  - Novo layout flexbox para .music-item
  - Estilos para .music-cover e .cover-thumbnail
  - Responsivo para mobile (imagem acima do conteúdo em telas ≤768px)

#### 4. **HTML (Formulário)** ✓
- `views/upload.php`:
  - Novo campo `<input id="coverImage">` para seleção de imagem
  - Label e informações de tamanho máximo

#### 5. **Estrutura de Diretórios** ✓
- Pasta `music/covers/` criada para armazenar imagens
- Criada via script durante o processo de upload se necessário

---

## 🚀 Como Usar

### Fazer Upload com Capa:

1. Acesse a página de upload
2. Selecione um arquivo MP3
3. (Opcional) Selecione uma imagem de capa (JPG, PNG, GIF, WebP - máx 5MB)
4. Insira um nome para a música (opcional)
5. Clique em "Enviar Música"

### Imagens Padrão:

Se uma música não tiver capa customizada, ela usará a imagem padrão:
```
assets/images/cover.png
```

---

## 📁 Arquivos Modificados

- `assets/js/upload.js` - Adicionado suporte a upload de capa
- `assets/css/upload.css` - Novos estilos para exibição de capa
- `views/upload.php` - Novo campo de seleção de imagem
- `controllers/upload_music.php` - Processamento de capa adicionado
- `controllers/get_music.php` - Cálculo de caminho de capa adicionado
- `models/Music.php` - save() atualizado para armazenar caminho_imagem e tipo_imagem
- `scripts/add_cover_migration.php` - Script de migração (novo)
- `database/migrations/add_cover_to_musicas.sql` - Migração SQL (novo)

---

## 🔧 Requisitos Técnicos

- PHP 7.4+ com extensão `fileinfo`
- MySQL 5.7+ 
- Permissões de escrita nas pastas:
  - `music/` - Para arquivos MP3
  - `music/covers/` - Para imagens de capa (criada automaticamente)

---

## 📝 Notas

- Tamanho máximo para MP3: **50MB**
- Tamanho máximo para imagem: **5MB**
- Formatos suportados: JPG, JPEG, PNG, GIF, WebP
- Limite total de armazenamento por usuário: **500MB**

---

## 🔍 Verificação de Status

Para garantir que tudo funciona:

1. ✓ Banco de dados atualizado com novas colunas
2. ✓ Pasta `music/covers/` existe e tem permissões de escrita
3. ✓ Formulário HTML contém campo de seleção de imagem
4. ✓ JavaScript valida e envia a imagem
5. ✓ Backend processa e armazena a imagem
6. ✓ Lista de músicas exibe capas com fallback

---

Última atualização: 27/02/2026
