# Telea

O Telea é um teleprompter minimalista e moderno desenvolvido com Tauri, focado em produtividade e experiência do usuário.

## 🚀 Começando

Estas instruções permitirão que você obtenha uma cópia do projeto em execução em sua máquina local para desenvolvimento e teste.

### 📋 Pré-requisitos

O que você precisa para instalar o software?

```
Node.js - Runtime JavaScript
NPM - Gerenciador de pacotes
Rust - Linguagem de programação (para Tauri)
```

### 🔧 Instalação

Para instalar, siga os passos abaixo:

1. Faça uma cópia do repositório em sua máquina:

```bash
git clone https://github.com/matheusbguedes/telea.git
cd telea
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o ambiente de desenvolvimento:

```bash
npm run tauri:dev
```

O projeto estará pronto e em execução no modo de desenvolvimento.

## 📦 Sistema de Auto-Update

O Telea possui um sistema de auto-update automático que verifica e instala atualizações toda vez que o app é iniciado.

### 🔐 Configuração Inicial (Apenas uma vez)

#### 1. Backup da Chave de Assinatura

A chave privada já foi gerada em `~/.tauri/telea.key`. **Faça backup desta chave:**

```bash
cp ~/.tauri/telea.key ~/Backups/telea-signing-key.backup
```

⚠️ **IMPORTANTE:** Se perder esta chave, não será possível gerar novos updates!

#### 2. Configurar GitHub Secret

1. Vá em: https://github.com/matheusbguedes/telea/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Nome: `TAURI_SIGNING_PRIVATE_KEY`
4. Valor: Cole o conteúdo do arquivo `~/.tauri/telea.key`

Para obter o conteúdo:

```bash
cat ~/.tauri/telea.key
```

#### 3. Habilitar Permissões do GitHub Actions

1. Vá em: https://github.com/matheusbguedes/telea/settings/actions
2. Em "Workflow permissions", selecione: **"Read and write permissions"**
3. Marque: **"Allow GitHub Actions to create and approve pull requests"**
4. Clique em **"Save"**

### 🚀 Como Criar uma Nova Release

#### Passo 1: Atualizar Versão

Use o script auxiliar para atualizar a versão em todos os arquivos:

```bash
./bump-version.sh 1.1.0
```

Ou manualmente, atualize a versão em:

- `package.json` → `"version": "1.1.0"`
- `src-tauri/tauri.conf.json` → `"version": "1.1.0"`
- `src-tauri/Cargo.toml` → `version = "1.1.0"`

#### Passo 2: Commit e Tag

```bash
git add .
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
git push && git push --tags
```

#### Passo 3: Aguardar GitHub Actions

O GitHub Actions vai automaticamente:

1. ✅ Detectar a nova tag `v1.1.0`
2. ✅ Fazer build do app para macOS
3. ✅ Assinar os binários com a chave privada
4. ✅ Criar uma release no GitHub
5. ✅ Fazer upload dos arquivos

Você pode acompanhar o progresso em:
https://github.com/matheusbguedes/telea/actions

#### Passo 4: Tornar Release Pública

Como o repositório é privado, você precisa tornar a release pública para o updater funcionar:

1. Aguarde o GitHub Actions concluir (aparecerá um ✅ verde)
2. Vá em: https://github.com/matheusbguedes/telea/releases
3. Clique nos **3 pontos** da release criada
4. Selecione **"Edit release"**
5. **Desmarque** a opção "Private release"
6. Clique em **"Save"**

#### Passo 5: Pronto! ✅

Agora, toda vez que um usuário abrir o app:

- O app verifica se há uma versão mais recente
- Se houver, faz download automaticamente
- Instala silenciosamente em background
- Reinicia o app com a nova versão

### 🧪 Testar Update Localmente

1. Instale a versão antiga do app
2. Crie uma release com versão maior (seguindo passos acima)
3. Abra o app instalado
4. Pressione `CMD + Option + I` para abrir o console
5. Verifique os logs:
   - `"Update available: X.X.X"` - Update detectado
   - `"Started downloading..."` - Download iniciado
   - `"Download finished"` - Download completo
   - `"Update installed, relaunching..."` - Instalando

### 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia ambiente de desenvolvimento
npm run build        # Build completo com assinatura
npm run tauri        # CLI do Tauri
```

## 🛠️ Construído com

- [Tauri](https://tauri.app/) - Framework para aplicações desktop
- [React](https://react.dev/) - Biblioteca JavaScript para UI
- [TypeScript](https://www.typescriptlang.org/) - Superset tipado do JavaScript
- [Vite](https://vitejs.dev/) - Build tool e dev server
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utility-first
- [Framer Motion](https://www.framer.com/motion/) - Biblioteca de animações
- [Rust](https://www.rust-lang.org/) - Linguagem de programação do backend

### Erro ao fazer build

```bash
# Certifique-se de ter definido a variável de ambiente
export TAURI_SIGNING_PRIVATE_KEY_PATH=~/.tauri/telea.key
npm run tauri:build
```

### GitHub Actions falhou

1. Verifique se o secret `TAURI_SIGNING_PRIVATE_KEY` está configurado
2. Confirme que as permissões do Actions estão habilitadas
3. Veja os logs detalhados na página de Actions

## ✒️ Autores

- **Matheus Borges** - [LinkedIn](https://www.linkedin.com/in/matheus-borges-4a7469239/)

⌨️ com ❤️ por [matheusbguedes](https://github.com/matheusbguedes) 😊
