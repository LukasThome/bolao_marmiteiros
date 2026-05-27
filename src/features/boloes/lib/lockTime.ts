const ONE_HOUR_MS = 60 * 60 * 1000;

export function getLockTime(rodada: {
  deadline: Date | string;
  partidas: Array<{ scheduledAt: Date | string | null }>;
}): Date {
  const deadline = new Date(rodada.deadline);

  const scheduled = rodada.partidas
    .map((p) => (p.scheduledAt ? new Date(p.scheduledAt) : null))
    .filter(Boolean) as Date[];

  if (scheduled.length === 0) return deadline;

  const earliest = new Date(Math.min(...scheduled.map((d) => d.getTime())));
  const oneHourBefore = new Date(earliest.getTime() - ONE_HOUR_MS);

  // Lock at whichever comes first: 1h before first match OR admin deadline
  return oneHourBefore < deadline ? oneHourBefore : deadline;
}
