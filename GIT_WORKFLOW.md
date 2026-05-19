# Git Workflow — Bolão dos Marmiteiros

## Branches

| Branch | Propósito | Deploy |
|--------|-----------|--------|
| `main` | Produção estável | Vercel → produção automática |
| `develop` | Integração contínua | Vercel → preview automático |
| `feature/*` | Novas funcionalidades | Nenhum (PR para `develop`) |
| `fix/*` | Correções | Nenhum (PR para `develop`) |
| `hotfix/*` | Correções urgentes em prod | PR direto para `main` + `develop` |

## Fluxo padrão

```
feature/palpites
       │
       │  PR + CI pass
       ▼
   develop ──────────────── preview Vercel
       │
       │  PR + aprovação + CI pass
       ▼
     main ─────────────────── produção Vercel
```

## Convenção de commits (Conventional Commits)

```
<tipo>(<escopo>): <descrição curta>

[corpo opcional]

[rodapé opcional]
```

### Tipos

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `test` | Adicionar ou corrigir testes |
| `refactor` | Refatoração sem mudança de comportamento |
| `docs` | Documentação |
| `chore` | Configs, deps, scripts |
| `style` | Formatação, sem mudança lógica |

### Exemplos

```
feat(palpites): bloquear envio após deadline da rodada
fix(ranking): corrigir divisão de prêmios em empate triplo
test(scoring): adicionar casos para placar 0x0
docs(architecture): adicionar fluxo de apuração
chore(deps): atualizar prisma para 6.1.0
```

## Regras de PR

1. **CI deve passar** (lint + typecheck + testes) antes do merge.
2. **Branch atualizada** com `develop` antes de abrir PR.
3. **Descrição do PR** deve incluir:
   - O que foi feito
   - Como testar
   - Screenshots se houver mudança visual
4. **Squash merge** para `develop` (histórico limpo).
5. **Merge commit** de `develop` para `main` (mantém rastreabilidade).

## Proteção de branches

- `main`: requer PR + CI passing + 1 aprovação
- `develop`: requer CI passing
