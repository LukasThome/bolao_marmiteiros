Feature: Painel Admin

  Background:
    Given o usuário está autenticado como ADMIN

  Scenario: Criar bolão
    When o admin acessa "/admin/boloes/new"
    And preenche nome "Marmiteiros 2025", slug "marmiteiros-2025"
    And define prêmios [100, 50, 30]
    And clica em "Criar Bolão"
    Then o bolão é criado no banco
    And o admin é redirecionado para "/admin/boloes/marmiteiros-2025"

  Scenario: Slug duplicado é rejeitado
    Given já existe um bolão com slug "marmiteiros-2025"
    When o admin tenta criar outro bolão com o mesmo slug
    Then a API retorna 409
    And uma mensagem "Slug já em uso" é exibida

  Scenario: Criar rodada com deadline
    Given o bolão "marmiteiros-2025" existe
    When o admin cria a Rodada 1 com deadline "2025-06-01T12:00:00Z"
    Then a rodada é criada com status SCHEDULED
    And o deadline é salvo corretamente

  Scenario: Adicionar partida a uma rodada
    Given a Rodada 1 existe no bolão "marmiteiros-2025"
    When o admin adiciona a partida "Brasil × Argentina" para "2025-06-02T21:00:00Z"
    Then a partida aparece na lista da Rodada 1 com status SCHEDULED

  Scenario: Registrar resultado de partida
    Given a partida "Brasil × Argentina" está FINISHED
    When o admin registra o placar 2 × 1
    Then a partida é atualizada com homeScore=2, awayScore=1, status=FINISHED
    And os pontos dos palpiteiros são calculados automaticamente

  Scenario: Não-admin não pode criar bolão
    Given o usuário é MEMBER (não admin)
    When ele faz POST /api/boloes
    Then a API retorna 403

  Scenario: Não-admin não pode registrar resultado
    Given o usuário é MEMBER
    When ele faz PATCH /api/partidas/[id] com resultado
    Then a API retorna 403
