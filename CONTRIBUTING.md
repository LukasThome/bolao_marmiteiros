# Contribuindo com o Bolão dos Marmiteiros

## Modelo de branches

| Branch | Propósito | Vercel |
|--------|-----------|--------|
| `main` | Produção. Todo merge aqui dispara um deploy de produção. | Deploy de produção |
| `develop` | Integração de desenvolvimento. PRs de feature vão aqui. | Preview deployment |
| `feat/xxx` | Feature isolada. Criada a partir de `develop`. | Preview deployment |

> **Regra:** o fluxo é sempre `feat/*` → `develop` → `main`. Nunca direto para `main`.

---

## Fluxo de trabalho

### 1. Criar uma branch de feature

Sempre a partir de `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feat/nome-da-feature
```

Convenção de nomes:

| Prefixo | Uso |
|---------|-----|
| `feat/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `chore/` | Tarefas de manutenção, deps, config |
| `refactor/` | Refatoração sem mudança de comportamento |

### 2. Desenvolver e commitar

```bash
git add src/caminho/do/arquivo.ts   # prefira arquivos específicos
git commit -m "feat: descrição objetiva no presente"
```

Exemplos de mensagens de commit:
- `feat: adiciona validação de prazo no palpite`
- `fix: corrige cálculo de pontos em caso de empate`
- `chore: atualiza dependências do Prisma`

### 3. Abrir Pull Request para `develop`

```bash
git push origin feat/nome-da-feature
```

No GitHub, abra um PR de `feat/nome-da-feature` → `develop`.  
A Vercel cria automaticamente um **preview deployment** para o PR.

**Checklist antes de abrir o PR:**
- [ ] `npm run typecheck` sem erros
- [ ] `npm run test` passando
- [ ] `npm run lint` sem warnings novos
- [ ] Variáveis de ambiente novas documentadas no `.env.example`

### 4. Deploy para produção

Quando `develop` estiver estável, abra um PR de `develop` → `main`.  
O merge dispara o **deploy de produção** automático na Vercel.

---

## Setup local

```bash
npm install
cp .env.example .env
# edite .env com as variáveis necessárias
npm run db:push    # sincroniza o schema com o MongoDB
npm run dev        # inicia em http://localhost:3000
```

### Variáveis mínimas para rodar sem serviços externos

```env
DEV_USER_EMAIL="dev@bolao.local"
DEV_USER_NAME="Dev User"
NEXTAUTH_SECRET="qualquer-string-longa-aqui"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="mongodb+srv://..."
```

O botão "Entrar como Dev" aparece automaticamente em `NODE_ENV=development` quando `DEV_USER_EMAIL` está definido.

---

## Configuração da Vercel

### 1. Conectar o repositório (primeira vez)

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório `bolao_marmiteiros`
2. Framework: **Next.js** (detectado automaticamente)
3. Clique em **Deploy**

### 2. Confirmar que a branch de produção é `main`

1. No painel do projeto (`bolao-copa`), vá em **Settings → Git**
2. Confirme que **Production Branch** está como `main`

A partir daí:
- Merge em `main` → deploy de **produção**
- Push em `develop` ou branches de feature → **preview deployment** automático

### 3. Variáveis de ambiente na Vercel

Em **Settings → Environment Variables**, adicione as variáveis abaixo.

Marque **Production** + **Preview** para cada uma:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL do MongoDB Atlas |
| `NEXTAUTH_SECRET` | String longa aleatória (gere com `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL de produção, ex: `https://bolao-copa-iota.vercel.app` |
| `RESEND_API_KEY` | Chave da Resend (re_...) |
| `RESEND_FROM` | Opcional: `Bolão dos Marmiteiros <noreply@seu-dominio.com>` |

> **NEXTAUTH_URL em preview:** para preview deployments, defina como variável de ambiente do tipo "Automatically" e use `VERCEL_URL` — ou deixe em branco (NextAuth detecta automaticamente em produção/preview na Vercel).

### 4. Desenvolvimento local com banco real

```bash
cp .env.example .env
# Preencha DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL=http://localhost:3000
npm run db:push
npm run dev
```

Para logar sem configurar senha, defina também:

```env
DEV_USER_EMAIL="dev@bolao.local"
DEV_USER_NAME="Dev User"
```

