"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Dispara a sincronização de resultados em background ao montar a tela.
 * Fire-and-forget: não bloqueia a renderização. Se algo for sincronizado,
 * atualiza a página para refletir os novos placares/pontos.
 *
 * O throttle fica no servidor (sincronizarComThrottle), então acessos
 * frequentes não estouram o rate limit da API.
 */
export default function AutoSyncResultados() {
  const router = useRouter();
  const jaDisparou = useRef(false);

  useEffect(() => {
    if (jaDisparou.current) return;
    jaDisparou.current = true;

    fetch("/api/resultados/auto-sync")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.totalSynced > 0) router.refresh();
      })
      .catch(() => {
        // Silencioso: auto-sync é best-effort; o cron é a rede de segurança
      });
  }, [router]);

  return null;
}
