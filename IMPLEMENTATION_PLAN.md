# Plano de Implementação — Bolão dos Marmiteiros

## Fase 1 — Fundação (Setup)

**Objetivo:** repositório funcionando com CI, banco conectado e testes rodando.

- [ ] Inicializar repositório Next.js 16 com App Router
- [ ] Configurar Tailwind CSS v4 + PostCSS
- [ ] Configurar TypeScript strict
- [ ] Configurar Vitest + jsdom + coverage
- [ ] Configurar Prettier + ESLint
- [ ] Setup Prisma + MongoDB Atlas
- [ ] Rodar `prisma db push` + `seed.ts`
- [ ] Configurar GitHub Actions CI (lint + typecheck + test + build)
- [ ] Deploy inicial no Vercel (página de `coming soon`)
- [ ] Configurar branches: `main` (prod) e `develop` (preview)

**Critério de aceite:** CI passa, Vercel deploy verde, seed popula o banco.

---

## Fase 2 — Autenticação

**Objetivo:** usuário consegue fazer login e ser redirecionado ao dashboard.

- [ ] Instalar e configurar NextAuth v5 (`src/lib/auth.ts`)
- [ ] MongoDB Adapter para persistir sessões
- [ ] Google OAuth provider
- [ ] Dev bypass via `DEV_USER_EMAIL` (sem OAuth local)
- [ ] Middleware de proteção de rotas
- [ ] Página de login (`/login`)
- [ ] Layout autenticado `(app)/layout.tsx`
- [ ] Testes: middleware de auth, redirect sem sessão

**Critério de aceite:** login Google funciona em produção; acesso sem sessão redireciona para `/login`.

---

## Fase 3 — Bolão CRUD (Admin)

**Objetivo:** admin consegue criar e gerenciar bolões, rodadas e partidas.

- [ ] API: `POST /api/boloes` — cria bolão
- [ ] API: `POST /api/rodadas` — cria rodada com deadline
- [ ] API: `POST /api/partidas` — adiciona partida a uma rodada
- [ ] API: `PATCH /api/partidas/[id]` — registra resultado
- [ ] Guard de role `ADMIN` em todos os endpoints acima
- [ ] Página admin `/admin/boloes/new`
- [ ] Página admin `/admin/rodadas/[bolaoSlug]/new`
- [ ] Página admin `/admin/partidas/[rodadaId]/resultado`
- [ ] Testes: guard de role, criação de bolão, registro de resultado

**Critério de aceite:** admin cria bolão → rodada → partida → registra resultado via UI.

---

## Fase 4 — Palpites

**Objetivo:** participante consegue submeter e editar palpites antes do deadline.

- [ ] API: `POST /api/palpites` — upsert palpite (com deadline check)
- [ ] API: `GET /api/rodadas/[id]` — retorna partidas + palpite do usuário
- [ ] Formulário de palpite (`/boloes/[slug]/palpitar`)
  - Inputs de score (inteiro ≥ 0)
  - Indicador de prazo (countdown ou "encerrado")
  - Submissão otimista com Zustand
- [ ] Bloqueio visual e de API após deadline
- [ ] Testes: upsert antes/após deadline, placar negativo rejeitado

**Critério de aceite:** palpite salvo antes do prazo; formulário bloqueado após deadline.

---

## Fase 5 — Ranking e Prêmios

**Objetivo:** ranking calculado automaticamente e prêmios distribuídos corretamente.

- [ ] Trigger de cálculo ao registrar resultado (`src/lib/scoring.ts` já pronto)
- [ ] Atualização de `BolaoMember.totalPts` ao encerrar rodada
- [ ] API: `GET /api/ranking/[bolaoId]` — retorna ranking com prêmios
- [ ] Página de ranking `/boloes/[slug]/ranking`
  - Tabela: posição / nome / pts / prêmio
  - Destaque visual para empates (prêmio dividido)
- [ ] Testes de integração: cálculo end-to-end com seed data

**Critério de aceite:** após registrar todos os resultados da rodada, ranking exibe pontuação correta e prêmios divididos em empates.

---

## Fase 6 — Go-Live

**Objetivo:** app pronto para os marmiteiros jogarem de verdade.

- [ ] Dashboard principal `/dashboard` com bolões do usuário
- [ ] Página do bolão `/boloes/[slug]` (rodadas + estado)
- [ ] Entrar no bolão via link (`/convite/[slug]`)
- [ ] Design system final (dark theme verde/dourado)
- [ ] Responsivo mobile
- [ ] Testes E2E Cypress: fluxo completo (login → palpite → ranking)
- [ ] Smoke test em produção
- [ ] Comunicar URL para o grupo 🎉

**Critério de aceite:** fluxo completo funciona em produção no mobile.
