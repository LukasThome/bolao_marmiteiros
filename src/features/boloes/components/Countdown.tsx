"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function formatRemaining(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

export default function Countdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState(() => new Date(deadline).getTime() - Date.now());

  useEffect(() => {
    const tick = () => setRemaining(new Date(deadline).getTime() - Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (remaining <= 0) return null;

  const isUrgent = remaining < ONE_HOUR_MS;

  return (
    <span
      className="flex items-center gap-1 text-xs font-semibold tabular-nums"
      style={{ color: isUrgent ? "var(--danger)" : "var(--accent)" }}
    >
      <Clock size={11} />
      Fecha em {formatRemaining(remaining)}
    </span>
  );
}

const ONE_HOUR_MS = 60 * 60 * 1000;
