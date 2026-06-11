export function calcularPontos(
  palpite: { homeScore: number; awayScore: number },
  resultado: { homeScore: number; awayScore: number }
): number {
  if (
    palpite.homeScore === resultado.homeScore &&
    palpite.awayScore === resultado.awayScore
  ) {
    return 10;
  }

  const resultado_outcome = Math.sign(resultado.homeScore - resultado.awayScore);
  const palpite_outcome = Math.sign(palpite.homeScore - palpite.awayScore);

  return resultado_outcome === palpite_outcome ? 5 : 0;
}
