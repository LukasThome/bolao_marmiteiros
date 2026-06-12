Feature: Regras de Pontuação
  Como participante de um bolão
  Quero que meus palpites sejam pontuados de forma justa e previsível
  Para que o ranking reflita corretamente meus acertos

  # Regra de pontuação:
  #   - Acertou o placar exato (mandante e visitante)        → 10 pontos
  #   - Acertou apenas o resultado (vencedor OU empate)      → 5 pontos
  #   - Errou o resultado                                    → 0 pontos
  # Os pontos só são atribuídos quando a partida está FINISHED.

  Background:
    Given a partida "Brasil × Argentina" está FINISHED

  Scenario Outline: Pontuação de um palpite conforme o resultado
    Given o resultado oficial foi <res_casa> × <res_fora>
    When o palpiteiro havia palpitado <pal_casa> × <pal_fora>
    Then o palpite recebe <pontos> pontos

    Examples: Placar exato → 10 pontos
      | pal_casa | pal_fora | res_casa | res_fora | pontos |
      | 2        | 1        | 2        | 1        | 10     |
      | 0        | 0        | 0        | 0        | 10     |
      | 1        | 3        | 1        | 3        | 10     |
      | 5        | 0        | 5        | 0        | 10     |

    Examples: Acertou só o vencedor → 5 pontos
      | pal_casa | pal_fora | res_casa | res_fora | pontos |
      | 1        | 0        | 3        | 1        | 5      |
      | 0        | 2        | 1        | 3        | 5      |

    Examples: Acertou só o empate → 5 pontos
      | pal_casa | pal_fora | res_casa | res_fora | pontos |
      | 0        | 0        | 2        | 2        | 5      |
      | 1        | 1        | 3        | 3        | 5      |

    Examples: Errou o resultado → 0 pontos
      | pal_casa | pal_fora | res_casa | res_fora | pontos |
      | 2        | 0        | 0        | 1        | 0      |
      | 1        | 1        | 2        | 0        | 0      |
      | 0        | 1        | 1        | 1        | 0      |
      | 0        | 1        | 1        | 0        | 0      |

  Scenario: Total do bolão soma os pontos de todos os palpites do membro
    Given o palpiteiro acertou o placar exato de uma partida (10 pontos)
    And acertou apenas o vencedor de outra partida (5 pontos)
    When ambas as partidas são finalizadas
    Then o totalPts do membro no bolão é 15

  Scenario: Re-sincronizar uma partida já pontuada não altera o total
    Given a partida "Brasil × Argentina" já foi pontuada e deu 10 pontos ao palpiteiro
    When o admin sincroniza a mesma partida novamente com o mesmo placar
    Then o palpite continua com 10 pontos
    And o totalPts do membro não é alterado

  Scenario: Correção de placar reajusta os pontos pela diferença
    Given o palpiteiro havia recebido 5 pontos pela partida "Brasil × Argentina"
    When o admin corrige o resultado e o palpite passa a valer 10 pontos
    Then o palpite é atualizado para 10 pontos
    And o totalPts do membro aumenta em 5 (apenas a diferença)
