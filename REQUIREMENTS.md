# Requisitos — Bolão dos Marmiteiros

## Requisitos funcionais

### RF-01 Autenticação
- [ ] Usuário faz login via Google OAuth
- [ ] Sessão persistida via JWT (NextAuth v5)
- [ ] Primeiro login cria registro `User` no banco

### RF-02 Bolão
- [ ] Admin cria um bolão com nome, slug e prêmios por posição
- [ ] Usuário entra em um bolão via convite (link com slug)
- [ ] Cada usuário pode participar de múltiplos bolões

### RF-03 Rodadas e Partidas
- [ ] Admin cria rodadas com `deadline` (prazo para palpites)
- [ ] Admin adiciona partidas a cada rodada (mandante, visitante, data)
- [ ] Admin registra o resultado de cada partida

### RF-04 Palpites
- [ ] Usuário submete palpite (placar exato) antes do `deadline`
- [ ] Sistema bloqueia novos palpites após o `deadline`
- [ ] Usuário pode editar palpite enquanto o prazo não passou
- [ ] Palpite não pode ter placar negativo

### RF-05 Pontuação
- [ ] Sistema calcula pontos automaticamente ao registrar resultado
  - Placar exato → **10 pts**
  - Acertou empate (palpitou X × X e jogo foi X × X qualquer) → **5 pts**
  - Acertou vencedor (mas placar errado) → **5 pts**
  - Errou → **0 pts**
- [ ] `BolaoMember.totalPts` é atualizado ao encerrar cada rodada

### RF-06 Ranking
- [ ] Ranking exibe todos os membros ordenados por `totalPts` desc
- [ ] Em caso de empate, prêmios das posições são somados e divididos
- [ ] Ranking exibe posição, nome, total de pontos e prêmio

### RF-07 Painel Admin
- [ ] Admin gerencia bolões, rodadas e partidas pela interface
- [ ] Admin registra resultados individualmente por partida
- [ ] Admin visualiza o ranking em tempo real

---

## Requisitos não funcionais

### RNF-01 Performance
- Ranking calculado a partir de `totalPts` cached — sem recalcular toda vez
- RSC para páginas de leitura (sem round-trip desnecessário)

### RNF-02 Segurança
- Todas as rotas protegidas por autenticação
- Operações admin protegidas por verificação de role server-side
- Deadline verificado server-side (nunca confiado ao cliente)

### RNF-03 Qualidade de código
- Cobertura mínima de 80% nas funções de negócio (`src/lib`)
- Testes Vitest para toda lógica de scoring e distribuição de prêmios
- CI obrigatório em PRs para `main` e `develop`

### RNF-04 UX
- Interface responsiva (mobile-first)
- Feedback visual imediato ao submeter palpite
- Indicador claro de prazo encerrado
