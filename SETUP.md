# Setup — Bolão dos Marmiteiros

Stack: Next.js 16 · NextAuth v5 · Prisma 6 · MongoDB Atlas · Tailwind v4

---

## Pré-requisitos

- Node.js >= 20
- npm >= 10
- Conta no [MongoDB Atlas](https://cloud.mongodb.com)
- Conta no [Google Cloud Console](https://console.cloud.google.com)

---

## 1. Clonar e instalar dependências

```bash
git clone https://github.com/LukasThome/bolao_marmiteiros.git
cd bolao_marmiteiros
npm install
```

---

## 2. Criar o arquivo `.env.local`

Copie o exemplo e preencha cada variável:

```bash
cp .env.example .env.local
```

O arquivo deve ter esta estrutura:

```env
# Banco de dados
DATABASE_URL="mongodb+srv://<user>:<senha>@<cluster>.mongodb.net/bolao_marmiteiros?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_SECRET="<chave-longa-gerada>"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="<seu-client-id>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<seu-client-secret>"

# Dev bypass (só em desenvolvimento — ignora OAuth)
DEV_USER_EMAIL="seu@email.com"
DEV_USER_NAME="Seu Nome"
```

---

## 3. MongoDB Atlas — configurar o banco

### 3.1 Criar cluster

1. Acesse [cloud.mongodb.com](https://cloud.mongodb.com) e faça login.
2. Clique em **"Build a Database"** → escolha **M0 Free Tier**.
3. Escolha o provedor/região mais próximo (ex.: AWS São Paulo).
4. Nomeie o cluster (ex.: `bolao-cluster`) e clique em **Create**.

### 3.2 Criar usuário do banco

1. No menu lateral: **Security → Database Access → Add New Database User**.
2. Método de autenticação: **Password**.
3. Defina usuário e senha — **guarde a senha**, ela vai na `DATABASE_URL`.
4. Permissão: **"Read and write to any database"**.

### 3.3 Liberar IPs

1. No menu lateral: **Security → Network Access → Add IP Address**.
2. Para desenvolvimento local: adicione seu IP atual clicando em **"Add Current IP Address"**.
3. Para produção (Vercel): adicione `0.0.0.0/0` (Vercel usa IPs dinâmicos).

### 3.4 Obter a connection string

1. Na tela do cluster, clique em **"Connect" → "Drivers"**.
2. Selecione **Node.js** e copie a string no formato:
   ```
   mongodb+srv://<user>:<senha>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
3. Substitua `<user>` e `<senha>` pelos dados do passo 3.2.
4. Adicione o nome do banco antes do `?`:
   ```
   mongodb+srv://user:senha@cluster.mongodb.net/bolao_marmiteiros?retryWrites=true&w=majority
   ```
5. Cole em `DATABASE_URL` no `.env.local`.

---

## 4. Gerar o NEXTAUTH_SECRET

O NextAuth exige uma chave aleatória longa (mínimo 32 bytes) para assinar os JWTs.

**Opção 1 — terminal (recomendado):**

```bash
openssl rand -base64 32
```

**Opção 2 — Node.js:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Opção 3 — online:**

```bash
# Gera diretamente pelo CLI do NextAuth
npx auth secret
```

Copie a saída e cole em `NEXTAUTH_SECRET` no `.env.local`.

---

## 5. Google OAuth — credenciais

### 5.1 Criar projeto no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com).
2. Clique em **"Select a project" → "New Project"**.
3. Nomeie (ex.: `bolao-marmiteiros`) e clique em **Create**.

### 5.2 Ativar a API

1. Com o projeto selecionado, vá em **"APIs & Services" → "Library"**.
2. Pesquise **"Google+ API"** (ou "Identity") e clique em **Enable**.

### 5.3 Criar credenciais OAuth

1. Vá em **"APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID"**.
2. Se solicitado, configure a **"OAuth consent screen"** primeiro:
   - User Type: **External**
   - Preencha nome do app e e-mail de suporte
   - Adicione seu e-mail em "Test users" (enquanto em desenvolvimento)
3. De volta em **"Create OAuth client ID"**:
   - Application type: **Web application**
   - Nome: `bolao-marmiteiros`
4. Em **"Authorized redirect URIs"**, adicione:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   (em produção, adicione também a URL da Vercel)
5. Clique em **Create** e copie o **Client ID** e o **Client Secret**.
6. Cole em `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env.local`.

---

## 6. Configurar o Prisma

Com `DATABASE_URL` preenchida no `.env.local`:

```bash
# Gerar o Prisma Client (sempre necessário após npm install)
npm run db:generate

# Sincronizar o schema com o banco (cria as collections no MongoDB)
npm run db:push

# Popular com dados iniciais (opcional, apenas uma vez)
npm run db:seed
```

Para abrir o Prisma Studio (interface visual do banco):

```bash
npm run db:studio
```

---

## 7. Rodar o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

**Login sem OAuth (dev bypass):**  
Com `DEV_USER_EMAIL` preenchido no `.env.local`, aparece a opção "Dev Bypass" na tela de login — entra direto como ADMIN sem precisar do Google.

---

## 8. Rodar os testes

```bash
# Testes unitários (Vitest)
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de código
npm run test:coverage

# Testes E2E (Cypress) — necessita do servidor rodando
npm run dev &
npm run cypress:open   # interativo
npm run cypress:run    # headless
```

---

## 9. Comandos úteis

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run lint` | Lint ESLint |
| `npm run typecheck` | Checagem de tipos TypeScript |
| `npm run db:studio` | Interface visual do banco |
| `npm run db:push` | Sincroniza schema → banco |
| `npm run db:seed` | Popula dados iniciais |

---

## 10. Deploy na Vercel

1. Importe o repositório em [vercel.com/new](https://vercel.com/new).
2. Configure as variáveis de ambiente no painel da Vercel:

   | Variável | Ambiente |
   |----------|----------|
   | `DATABASE_URL` | Production + Preview |
   | `NEXTAUTH_SECRET` | Production + Preview |
   | `NEXTAUTH_URL` | Production (URL definitiva) |
   | `GOOGLE_CLIENT_ID` | Production + Preview |
   | `GOOGLE_CLIENT_SECRET` | Production + Preview |

3. Adicione a URL de callback do Google para produção:
   ```
   https://<seu-dominio>.vercel.app/api/auth/callback/google
   ```

4. Faça o deploy — o Prisma Client é gerado automaticamente pelo `postinstall`.

> Após o primeiro deploy, rode `npm run db:push` apontando para o banco de produção para criar as collections.
