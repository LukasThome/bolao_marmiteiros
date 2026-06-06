"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Loader2, X } from "lucide-react";

export default function EditarFotoPerfil({ currentImage }: { currentImage: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(currentImage ?? "");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function salvar(novaUrl: string | null) {
    setState("saving");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: novaUrl }),
      });

      if (res.ok) {
        setState("idle");
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Erro ao salvar");
        setState("error");
      }
    } catch {
      setErrorMsg("Erro de conexão");
      setState("error");
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-75 mt-2"
        style={{ backgroundColor: "var(--bg-raised)", color: "var(--text-secondary)" }}
      >
        <Camera size={13} />
        {currentImage ? "Alterar foto" : "Adicionar foto"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-3">
      <input
        type="url"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setState("idle");
        }}
        placeholder="https://exemplo.com/minha-foto.jpg"
        className="text-sm rounded-lg px-3 py-2 outline-none w-full"
        style={{
          backgroundColor: "var(--bg-raised)",
          border: state === "error" ? "1px solid var(--danger)" : "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
      />

      {errorMsg && (
        <span className="text-xs" style={{ color: "var(--danger)" }}>
          {errorMsg}
        </span>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => salvar(url)}
          disabled={state === "saving"}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ backgroundColor: "var(--accent)", color: "#fff", opacity: state === "saving" ? 0.7 : 1 }}
        >
          {state === "saving" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Salvar
        </button>

        {currentImage && (
          <button
            onClick={() => salvar(null)}
            disabled={state === "saving"}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ backgroundColor: "var(--bg-raised)", color: "var(--danger)" }}
          >
            Remover
          </button>
        )}

        <button
          onClick={() => {
            setEditing(false);
            setUrl(currentImage ?? "");
            setState("idle");
            setErrorMsg(null);
          }}
          disabled={state === "saving"}
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={13} />
          Cancelar
        </button>
      </div>
    </div>
  );
}
