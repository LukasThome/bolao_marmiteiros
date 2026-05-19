Feature: Ranking e Prêmios

  Background:
    Given o bolão "marmiteiros-2025" tem prêmios [R$100, R$50, R$30]
    And a rodada 1 foi encerrada com todos os resultados registrados

  Scenario: Ranking exibe membros ordenados por pontuação
    Given os membros têm pontuações [Alice: 25, Bob: 18, Carol: 10]
    When o usuário acessa o ranking
    Then a ordem é Alice (1º), Bob (2º), Carol (3º)

  Scenario: Sem empate — prêmios atribuídos normalmente
    Given as pontuações são distintas: Alice 25, Bob 18, Carol 10
    Then Alice recebe R$100
    And Bob recebe R$50
    And Carol recebe R$30

  Scenario: Empate simples — 2 membros empatados no 1º lugar
    Given Alice e Bob têm 25 pts; Carol tem 10 pts
    Then Alice e Bob dividem (R$100 + R$50) / 2 = R$75 cada
    And Carol recebe R$30

  Scenario: Empate duplo — 1º e 3º empatados mas não entre si
    Given Alice 25, Bob 18, Carol 18, David 10
    Then Alice recebe R$100
    And Bob e Carol dividem (R$50 + R$30) / 2 = R$40 cada
    And David não recebe prêmio (4ª posição)

  Scenario: Empate triplo no 1º lugar
    Given Alice, Bob e Carol têm 25 pts cada; David tem 5 pts
    Then cada um dos três divide (R$100 + R$50 + R$30) / 3 = R$60
    And David não recebe prêmio

  Scenario: Posição sem prêmio não afeta empate
    Given Alice 25, Bob 10, Carol 10, David 10
    And os prêmios são apenas [R$100, R$50]
    Then Alice recebe R$100
    And Bob, Carol e David dividem R$50 / 3 ≈ R$16,67 cada

  Scenario: Pontuação é calculada corretamente ao encerrar rodada
    Given "Brasil x Argentina" terminou 2 × 1
    And Alice palpitou 2 × 1 (placar exato)
    And Bob palpitou 1 × 0 (acertou vencedor)
    And Carol palpitou 0 × 1 (errou)
    When a rodada é encerrada
    Then Alice recebe 10 pts
    And Bob recebe 5 pts
    And Carol recebe 0 pts
    And os totalPts de BolaoMember são atualizados
