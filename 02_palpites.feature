Feature: Palpites

  Background:
    Given o usuário está autenticado como membro do bolão "marmiteiros-2025"

  Scenario: Submeter palpite antes do deadline
    Given a rodada 1 tem deadline em "2099-12-31T23:59:59Z"
    And a partida "Brasil x Argentina" está SCHEDULED
    When o usuário palpita 2 × 1
    Then o palpite é salvo com sucesso
    And uma mensagem de confirmação é exibida

  Scenario: Editar palpite antes do deadline
    Given o usuário já palpitou 1 × 0 para "Brasil x Argentina"
    And o deadline ainda não passou
    When ele altera o palpite para 2 × 1
    Then o palpite é atualizado (upsert)
    And o placar exibido muda para "2 × 1"

  Scenario: Bloquear palpite após deadline
    Given a rodada 1 tem deadline em "2000-01-01T00:00:00Z" (já passou)
    When o usuário tenta submeter um palpite
    Then a API retorna 403
    And o formulário exibe "Prazo encerrado"
    And o botão de envio está desabilitado

  Scenario: Rejeitar placar negativo
    Given o deadline ainda não passou
    When o usuário tenta palpitar -1 × 0
    Then a validação rejeita o palpite
    And uma mensagem de erro "Placar inválido" é exibida

  Scenario: Rejeitar placar não numérico
    Given o deadline ainda não passou
    When o usuário deixa o campo de placar em branco
    Then o botão "Salvar" permanece desabilitado

  Scenario: Palpite salvo é exibido ao recarregar a página
    Given o usuário palpitou 3 × 2 para "Brasil x Argentina"
    When ele recarrega a página de palpites
    Then o placar "3 × 2" aparece pré-preenchido no formulário
