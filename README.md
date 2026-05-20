# Bolão dos Marmiteiros 🏆

Plataforma de bolão esportivo com palpites, ranking automático e distribuição de prêmios.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **NextAuth v5** (Google OAuth + JWT)
- **Prisma 6** + **MongoDB Atlas**
- **Tailwind CSS v4**
- **Zustand** (estado client-side)
- **Vitest** (unit/integration) + **Cypress** (E2E/CT)

---

## Regras de Pontuação

| Acerto | Pontos |
|--------|--------|
| Placar exato | **10 pts** |
| Acertou o empate (placar foi empate e chutou empate) | **5 pts** |
| Acertou o vencedor (mas não o placar) | **5 pts** |
| Errou | **0 pts** |

> **Empate no ranking:** quando dois ou mais participantes terminam com a mesma pontuação, os prêmios das posições empatadas são somados e divididos igualmente entre eles.

---

## Setup local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` conforme necessário (veja abaixo).

### 3. Rodar em modo desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Variáveis de ambiente

### Rodar localmente SEM Google OAuth e SEM MongoDB

```env
DEV_USER_EMAIL="dev@bolao.local"
DEV_USER_NAME="Dev User"
NEXTAUTH_SECRET="qualquer-string-longa-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### Rodar com banco de dados real (MongoDB Atlas)

```env
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
```

Para popular o banco com dados iniciais:

```bash
npm run db:push    # sincroniza o schema
npm run db:seed    # insere bolão e partidas de exemplo
```

### Login com Google OAuth (opcional em dev)

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## Scripts disponíveis

| Comando                 | Descrição                               |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento (Turbopack) |
| `npm run build`         | Build de produção                       |
| `npm run test`          | Testes unitários (Vitest)               |
| `npm run test:coverage` | Cobertura de testes                     |
| `npm run db:generate`   | Regenera o Prisma Client                |
| `npm run db:push`       | Sincroniza schema com o banco           |
| `npm run db:seed`       | Popula o banco com dados iniciais       |
| `npm run cypress:open`  | Cypress interativo (E2E + CT)           |
| `npm run lint`          | ESLint                                  |
| `npm run typecheck`     | TypeScript sem emitir                   |

---

## Estrutura do projeto

```
src/
  app/
    (app)/          # Layout autenticado
      dashboard/
      boloes/
      ranking/
      palpites/
    api/            # Route handlers
  components/       # Componentes reutilizáveis
  lib/              # Auth, Prisma, utilitários, scoring
  stores/           # Zustand stores
  types/            # Tipos globais
prisma/
  schema.prisma     # Schema MongoDB
  seed.ts           # Dados iniciais
cypress/
  e2e/              # Testes E2E (Gherkin + Cypress)
  component/        # Testes de componente
```
