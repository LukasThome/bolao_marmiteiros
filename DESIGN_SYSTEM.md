# Design System — Bolão dos Marmiteiros

## Paleta de cores

Dark theme com acento verde campo + dourado troféu.

```css
/* globals.css — variáveis CSS */
:root {
  /* Backgrounds */
  --bg-base:    #0d1117;   /* fundo principal (quase preto) */
  --bg-surface: #161b22;   /* cards, modais */
  --bg-raised:  #21262d;   /* inputs, dropdowns */
  --bg-overlay: #30363d;   /* hover states */

  /* Texto */
  --text-primary:   #e6edf3;
  --text-secondary: #8b949e;
  --text-muted:     #484f58;

  /* Accent — verde campo */
  --accent:         #3fb950;   /* primário */
  --accent-hover:   #2ea043;
  --accent-subtle:  #0f2d13;   /* backgrounds sutis */

  /* Destaque — dourado troféu */
  --gold:           #d4a017;
  --gold-hover:     #b8880e;
  --gold-subtle:    #2d1f00;

  /* Semântico */
  --success:  #3fb950;
  --warning:  #d29922;
  --danger:   #f85149;
  --info:     #58a6ff;

  /* Bordas */
  --border:         #30363d;
  --border-subtle:  #21262d;
}
```

## Tipografia

```css
font-family: "Inter", system-ui, -apple-system, sans-serif;

/* Escala */
--text-xs:   0.75rem;   /* 12px — labels de status */
--text-sm:   0.875rem;  /* 14px — texto secundário */
--text-base: 1rem;      /* 16px — corpo */
--text-lg:   1.125rem;  /* 18px — subtítulos */
--text-xl:   1.25rem;   /* 20px — títulos de card */
--text-2xl:  1.5rem;    /* 24px — headings */
--text-3xl:  1.875rem;  /* 30px — h1 de página */
```

## Componentes principais

### Card
```
bg-[--bg-surface] rounded-xl border border-[--border] p-4
```

### Badge de status da partida
| Status | Cor |
|--------|-----|
| SCHEDULED | `text-[--text-secondary] bg-[--bg-raised]` |
| LIVE | `text-[--warning] bg-[--gold-subtle] animate-pulse` |
| FINISHED | `text-[--success] bg-[--accent-subtle]` |
| CANCELLED | `text-[--danger]` |

### Botão primário (palpitar)
```
bg-[--accent] hover:bg-[--accent-hover] text-white
font-semibold rounded-lg px-4 py-2 transition-colors
disabled:opacity-40 disabled:cursor-not-allowed
```

### Botão admin (destrutivo)
```
bg-[--danger]/10 hover:bg-[--danger]/20 text-[--danger]
border border-[--danger]/30 rounded-lg px-4 py-2
```

### Input de placar
```
w-16 text-center text-2xl font-bold
bg-[--bg-raised] border border-[--border]
focus:border-[--accent] focus:ring-1 focus:ring-[--accent]
rounded-lg p-2 text-[--text-primary]
```

### Linha do ranking
| Posição | Estilo especial |
|---------|----------------|
| 1º | `text-[--gold]` + ícone 🏆 |
| 2º | `text-[--text-secondary]` + ícone 🥈 |
| 3º | `text-orange-400` + ícone 🥉 |
| Empate | Badge `÷` em `--gold-subtle` |

## Ícones

Usar **Lucide React** (já incluído via dependências do projeto base).

```tsx
import { Trophy, Target, Clock, Lock, ChevronRight } from "lucide-react";
```

## Responsividade

Mobile-first. Breakpoints Tailwind padrão:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px

Dashboard layout:
- Mobile: stack vertical, 1 coluna
- Desktop: sidebar fixa + conteúdo principal

## Animações

```css
/* Feedback ao salvar palpite */
@keyframes pulse-success {
  0%, 100% { box-shadow: 0 0 0 0 rgba(63, 185, 80, 0.4); }
  50%       { box-shadow: 0 0 0 8px rgba(63, 185, 80, 0); }
}

/* Indicador LIVE */
.live-dot {
  animation: pulse 1.5s ease-in-out infinite;
}
```
