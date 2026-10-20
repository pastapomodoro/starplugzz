# StarPlugzz

Negozio demo di plugin VST per Mac e Windows. Next.js 16 (App Router) · TypeScript · Tailwind 4 · GSAP · Motion · Lenis.
Niente backend: prodotti in `data/products.ts`, carrello in `localStorage`, checkout finto.

## Avvio

```bash
npm install
npm run dev
```

Poi apri http://localhost:3000.

## Immagini (FLUX.2 Pro / Nano Banana)

1. Copia `.env.local.example` in `.env.local` e inserisci `OPENROUTER_API_KEY` (oppure `GEMINI_API_KEY`; se ci sono entrambe vince OpenRouter).
2. `npm run images` genera ciò che manca in `public/generated/` con FLUX.2 Pro (`black-forest-labs/flux.2-pro` su OpenRouter) oppure Nano Banana 2.1 sulla Gemini API. Il modello OpenRouter si cambia in `openrouter_model`.
   - `npm run images:dry` elenca cosa verrebbe generato
   - `npm run images -- --only=mascot,backgrounds` solo alcuni gruppi
   - `npm run images -- --force` rigenera anche i file esistenti

I prompt sono in `scripts/image-prompts.json` (prefisso di stile comune + prefisso per gruppo + prompt per immagine).
Stile: Y2K Frutiger Aero "Softsoap aquarium". Gruppi:

| Gruppo | Cosa | Dove nel sito |
| --- | --- | --- |
| `backgrounds` | home, Mac, Windows (desktop 16:9 + mobile 9:16) | sfondo, cambia con la sezione |
| `frames` | card, poster, panel, pill, orb (scontornati) | cornici di card, locandina, drawer, chip/bottoni, carrello e bolle della splash |
| `icons` | synth, effetti, drum, bundle, carrello, stella, Mac, Windows | al posto delle icone SVG |
| `sprites` | bolla | bolle che fluttuano sullo sfondo |
| `mascot` | 4 pose (la prima fa da riferimento alle altre) | splash, pagina prodotto, carrello vuoto |
| `decor` | scolopendra a inchiostro | dietro i dati della pagina prodotto |

Ogni immagine sostituisce la sua versione CSS solo quando esiste (registro in `lib/asset-names.ts`).
In dev compaiono al refresh; con `next build` serve un nuovo build.

## Immagini dei prodotti

Le locandine non vengono generate: metti il file in `public/products/` e indicalo in `data/products.ts`,
per esempio `image: "/products/serum.png"`. Senza `image` la locandina resta uno slot di vetro vuoto.

## Dove mettere le mani

| Cosa | File |
| --- | --- |
| Prodotti, prezzi, piattaforme | `data/products.ts` |
| Colori, vetro liquido (ripiego CSS) | `app/globals.css`, `components/LiquidGlassDefs.tsx` |
| Cornici, icone e bolla generate | `components/Frame.tsx`, `lib/asset-names.ts` |
| Vetrine a marquee (GSAP Draggable + Inertia) | `components/Shelf.tsx` |
| Entrata a cascata, parallax (ScrollTrigger) | `components/Shelves.tsx`, `components/Background.tsx` |
| Volo nel carrello (Flip) | `lib/fly.ts` |
| Lenis ↔ ScrollTrigger | `components/SmoothScroll.tsx` |
| Switch Mac/Windows, transizioni, drawer (Motion) | `components/PlatformSwitch.tsx`, `components/PageTransition.tsx`, `components/CartDrawer.tsx` |
