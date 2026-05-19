# Arquitetura — Bolão dos Marmiteiros

## Visão geral

```
┌─────────────────────────────────────────────────────┐
│                   Next.js 16 App                    │
│  ┌──────────────┐   ┌──────────────────────────┐   │
│  │  App Router  │   │     Route Handlers (API)  │   │
│  │  (RSC + CC)  │   │  /api/boloes              │   │
│  └──────┬───────┘   │  /api/rodadas             │   │
│         │           │  /api/partidas            │   │
│  ┌──────▼───────┐   │  /api/palpites            │   │
│  │  Zustand     │   │  /api/ranking             │   │
│  │  (client)    │   └──────────┬───────────────┘   │
│  └──────────────┘              │                    │
│                         ┌──────▼────────┐           │
│                         │  NextAuth v5  │           │
│                         └──────┬────────┘           │
│                                │                    │
│                         ┌──────▼────────┐           │
│                         │  Prisma 6     │           │
│                         └──────┬────────┘           │
└────────────────────────────────┼────────────────────┘
                                 │
                      ┌──────────▼──────────┐
                      │   MongoDB Atlas     │
                      └─────────────────────┘
```

## Camadas

### 1. Apresentação (`src/app`)

- **Server Components (RSC):** busca de dados diretamente via Prisma, sem API round-trip.
- **Client Components (CC):** formulários interativos (palpites), modais, tabs.
- **Layouts:** `(app)/layout.tsx` protege todas as rotas autenticadas via `auth()`.

### 2. API (`src/app/api`)

Cada route handler segue o padrão:

```
GET  /api/boloes              → lista bolões do usuário
POST /api/boloes              → cria novo bolão (ADMIN)
GET  /api/boloes/[slug]       → detalhes + membros
GET  /api/rodadas/[id]        → partidas + palpites do usuário
POST /api/palpites            → submete palpite (deadline check)
GET  /api/ranking/[bolaoId]   → ranking com distribuição de prêmios
```

### 3. Lógica de negócio (`src/lib`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `auth.ts` | Config NextAuth (Google + JWT) |
| `prisma.ts` | Singleton Prisma Client |
| `scoring.ts` | Cálculo de pontos e distribuição de prêmios |
| `plan-guard.ts` | Verificação de roles (ADMIN/MEMBER) |

### 4. Estado client-side (`src/stores`)

Zustand stores para:
- `usePalpiteStore` — rascunho de palpites antes do envio
- `useRodadaStore` — rodada selecionada no dashboard

## Fluxo de palpite

```
Usuário preenche palpite
        │
        ▼
Client: valida formulário (score ≥ 0)
        │
        ▼
POST /api/palpites
        │
        ├─ deadline passou? → 403 Forbidden
        │
        ├─ palpite já existe?
        │     ├─ SIM → upsert (atualiza)
        │     └─ NÃO → cria novo
        │
        ▼
Prisma upsert Palpite { userId, partidaId }
```

## Fluxo de apuração (admin)

```
Admin registra resultado da partida
        │
        ▼
PATCH /api/partidas/[id] { homeScore, awayScore, status: FINISHED }
        │
        ▼
Trigger: recalcular pontos de todos os palpites da partida
        │
        ▼
Para cada Palpite:
  pts = calcularPontos(palpite, resultado)
  update Palpite.pontos
        │
        ▼
Verificar se todos os jogos da Rodada estão FINISHED
  └─ SIM → update BolaoMember.totalPts (soma acumulada)
```

## Segurança

- Todas as API routes verificam `auth()` — 401 se não autenticado.
- Operações de admin verificam `session.user.role === "ADMIN"` — 403 se não autorizado.
- `deadline` da Rodada é verificado server-side — nunca confiado ao cliente.
- Sem dados sensíveis no JWT além de `id`, `email`, `name`, `role`.

## Deploy (Vercel)

- **Branch `main`** → produção automática.
- **Branch `develop`** → preview automático.
- Variáveis de ambiente configuradas no painel da Vercel.
- `prisma generate` executado no build via `postinstall`.
