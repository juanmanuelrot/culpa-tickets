# Halloween Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two site themes, `classic` and `halloween`, switchable from the admin panel, applied to the public site, admin, validator, emails, OG image and favicon.

**Architecture:** A `Setting` row in Postgres holds the active theme name. The root layout reads it server-side, stamps `data-theme` on `<html>` (CSS variables swap under that selector) and hands the theme object to a React context for copy and icons. Server-rendered assets (emails, OG, favicon) read the same setting and take colors and copy from `src/lib/theme.ts`, the single source of truth.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (`@theme inline` over CSS variables), Prisma 7 + Postgres, `next/og` (Satori), Resend, Vitest (new).

**Spec:** `docs/superpowers/specs/2026-09-06-halloween-theme-design.md`

## Global Constraints

- Theme names are exactly `"classic"` and `"halloween"`; no setting row means `classic`.
- Hex values and copy for both themes live only in `src/lib/theme.ts`; `globals.css` repeats the hex with a comment pointing to `theme.ts`.
- Token renames: `culpa-lime→culpa-lcd`, `culpa-lime-dark→culpa-lcd-dark`, `culpa-blue→culpa-body`, `culpa-blue-dark→culpa-body-dark`. `ink`, `cream`, `night`, `yellow`, `alert` keep their names.
- Halloween palette: lcd `#f4841f`, lcdDark `#c96412`, body `#5b2a86`, bodyDark `#3a1758`, ink `#0d0d0d`, cream `#efe6cf`, night `#070409`, yellow `#ffde59`, alert `#a8101c`. Email inks: soft `#523112`, muted `#693d14`, rule `#804816`.
- Classic palette stays byte-identical to today: lcd `#c9d92c`, lcdDark `#a3b01f`, body `#2b3ad8`, bodyDark `#1d2795`, ink `#0d0d0d`, cream `#f4e3d7`, night `#080808`, yellow `#ffde59`, alert `#e23b2e`; email inks `#454a16`, `#585f19`, `#6b731c`.
- The wordmark PNG, fonts, keypad, `>` cursor and menu navigation do not change.
- Code comments in this repo are Spanish; keep that voice. Commit messages are English imperative, one line, plus the `Co-Authored-By` trailer.
- `getSiteTheme()` must never throw.
- Work on branch `halloween-theme`.

---

## File map

| File | Responsibility |
| --- | --- |
| `src/lib/theme.ts` (new) | Pure data: `ThemeName`, `Theme`, `THEMES`, `parseThemeName`, `isThemeName`. No React, no Prisma. |
| `src/lib/theme-store.ts` (new) | Server-only read/write of the `theme` setting via Prisma. |
| `src/components/theme-provider.tsx` (new) | Client context + `useTheme()`. |
| `src/app/globals.css` | Classic tokens on `:root`, Halloween override under `[data-theme="halloween"]`, theme-following glows. |
| `src/app/layout.tsx` | Reads theme, stamps `data-theme`, wraps in provider, dynamic metadata. |
| `src/lib/messages.ts` | `buildMessages(dayDot, script)`; script comes from the theme. |
| `src/lib/email.ts` | Builders take a `Theme`; senders fetch the active theme. |
| `src/components/og-card.tsx`, `opengraph-image.tsx`, `twitter-image.tsx` | Theme-aware share card. |
| `src/app/icon.tsx`, `src/app/apple-icon.tsx` (new, replace the `.svg`s) | Theme-aware favicons. |
| `src/app/api/admin/settings/theme/route.ts` (new) | GET/PUT the active theme, admin only. |
| `src/app/admin/page.tsx` | "Tema del sitio" switch. |
| `vitest.config.ts` (new), `src/lib/*.test.ts` (new) | Unit tests for the pure modules. |

---

### Task 1: Vitest + `theme.ts`

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/theme.ts`
- Test: `src/lib/theme.test.ts`
- Modify: `package.json` (scripts + devDependency)

**Interfaces:**
- Produces:
  - `type ThemeName = "classic" | "halloween"`
  - `const THEME_NAMES: readonly ThemeName[]`
  - `const DEFAULT_THEME: ThemeName` (= `"classic"`)
  - `interface PhoneMessage { from: string; time: string; body: string }`
  - `interface ThemePalette { lcd; lcdDark; body; bodyDark; ink; cream; night; yellow; alert }` (all `string`)
  - `interface ThemeEmailInks { soft: string; muted: string; rule: string }`
  - `interface ThemeCopy { tagline; ogSubtitle; welcomeSubtitle; emptyDates; loadingLabel; footerBrand: string; steps: {n,title,body}[]; messages: PhoneMessage[] }`
  - `interface Theme { name: ThemeName; label: string; palette: ThemePalette; emailInks: ThemeEmailInks; copy: ThemeCopy }`
  - `const THEMES: Record<ThemeName, Theme>`
  - `function isThemeName(value: unknown): value is ThemeName`
  - `function parseThemeName(value: unknown): ThemeName` (falls back to `DEFAULT_THEME`)

- [ ] **Step 1: Install vitest and add the script**

```bash
npm install --save-dev vitest@^3
```

Then in `package.json` add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // El mismo alias que tsconfig: `@/` es `src/`.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

- [ ] **Step 3: Write the failing test `src/lib/theme.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_NAMES,
  isThemeName,
  parseThemeName,
} from "@/lib/theme";

const PALETTE_KEYS = [
  "lcd", "lcdDark", "body", "bodyDark", "ink", "cream", "night", "yellow", "alert",
] as const;

const COPY_KEYS = [
  "tagline", "ogSubtitle", "welcomeSubtitle", "steps", "emptyDates",
  "loadingLabel", "footerBrand", "messages",
] as const;

describe("THEMES", () => {
  it("define los dos temas y nada más", () => {
    expect(THEME_NAMES).toEqual(["classic", "halloween"]);
    expect(Object.keys(THEMES).sort()).toEqual(["classic", "halloween"]);
  });

  it.each(THEME_NAMES)("%s tiene la paleta completa en hex", (name) => {
    for (const key of PALETTE_KEYS) {
      expect(THEMES[name].palette[key]).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(THEMES[name].emailInks.soft).toMatch(/^#[0-9a-f]{6}$/);
    expect(THEMES[name].emailInks.muted).toMatch(/^#[0-9a-f]{6}$/);
    expect(THEMES[name].emailInks.rule).toMatch(/^#[0-9a-f]{6}$/);
  });

  it.each(THEME_NAMES)("%s tiene todo el copy", (name) => {
    for (const key of COPY_KEYS) {
      expect(THEMES[name].copy[key]).toBeTruthy();
    }
    expect(THEMES[name].copy.steps).toHaveLength(3);
    expect(THEMES[name].name).toBe(name);
  });

  it("los guiones del inbox comparten remitentes y horas", () => {
    const shape = (name: "classic" | "halloween") =>
      THEMES[name].copy.messages.map((m) => `${m.from}@${m.time}`);
    expect(shape("halloween")).toEqual(shape("classic"));
  });

  it("el clásico conserva los colores de siempre", () => {
    expect(THEMES.classic.palette.lcd).toBe("#c9d92c");
    expect(THEMES.classic.palette.body).toBe("#2b3ad8");
  });
});

describe("parseThemeName", () => {
  it("acepta los nombres válidos", () => {
    expect(parseThemeName("classic")).toBe("classic");
    expect(parseThemeName("halloween")).toBe("halloween");
    expect(isThemeName("halloween")).toBe(true);
  });

  it("cae al clásico con cualquier otra cosa", () => {
    expect(DEFAULT_THEME).toBe("classic");
    expect(parseThemeName(undefined)).toBe("classic");
    expect(parseThemeName("")).toBe("classic");
    expect(parseThemeName("xmas")).toBe("classic");
    expect(parseThemeName(42)).toBe("classic");
    expect(isThemeName("xmas")).toBe(false);
  });
});
```

- [ ] **Step 4: Run it to see it fail**

Run: `npm test`
Expected: FAIL, cannot resolve `@/lib/theme`.

- [ ] **Step 5: Create `src/lib/theme.ts`**

```ts
/*
 * Los temas del sitio. Data pura, sin React ni Prisma, así la importan por
 * igual el layout, los mails, la OG card y las pantallas cliente.
 *
 * Acá viven los hex y el copy de cada tema: es la única fuente de verdad.
 * globals.css los repite porque CSS no puede importarlos; si cambiás un color
 * acá, cambialo allá también.
 */

export type ThemeName = "classic" | "halloween";

export const THEME_NAMES: readonly ThemeName[] = ["classic", "halloween"];
export const DEFAULT_THEME: ThemeName = "classic";

/** Un SMS de la bandeja de entrada. `{dia}` se reemplaza por la fecha. */
export interface PhoneMessage {
  /** Cómo está guardado en la agenda. */
  from: string;
  /** Hora fija, en el formato del status bar. */
  time: string;
  body: string;
}

export interface ThemePalette {
  /** La pantalla: fondo de todo el contenido. */
  lcd: string;
  lcdDark: string;
  /** El cuerpo del celu, botones y links. */
  body: string;
  bodyDark: string;
  ink: string;
  cream: string;
  night: string;
  /** El amarillo del logo; no cambia con el tema. */
  yellow: string;
  alert: string;
}

/*
 * Tinta al 70/60/50 % ya mezclada sobre el LCD, para el mail: fuera del
 * navegador el alpha se rompe (Outlook lo ignora, los clientes en dark mode
 * recomponen contra otro fondo), así que va como color sólido.
 */
export interface ThemeEmailInks {
  soft: string;
  muted: string;
  rule: string;
}

export interface ThemeCopy {
  /** Debajo del wordmark en la home. */
  tagline: string;
  /** En la OG card, en mayúsculas. */
  ogSubtitle: string;
  /** Subtítulo del wordmark en el mail de bienvenida. */
  welcomeSubtitle: string;
  steps: { n: string; title: string; body: string }[];
  /** Cuando no hay fechas abiertas. */
  emptyDates: string;
  /** Lo que dice LcdLoading. */
  loadingLabel: string;
  /** El pie de la home. */
  footerBrand: string;
  /** El guion de la bandeja de SMS. */
  messages: PhoneMessage[];
}

export interface Theme {
  name: ThemeName;
  /** Nombre para el switch del admin. */
  label: string;
  palette: ThemePalette;
  emailInks: ThemeEmailInks;
  copy: ThemeCopy;
}

const classic: Theme = {
  name: "classic",
  label: "Clásico",
  palette: {
    lcd: "#c9d92c",
    lcdDark: "#a3b01f",
    body: "#2b3ad8",
    bodyDark: "#1d2795",
    ink: "#0d0d0d",
    cream: "#f4e3d7",
    night: "#080808",
    yellow: "#ffde59",
    alert: "#e23b2e",
  },
  emailInks: { soft: "#454a16", muted: "#585f19", rule: "#6b731c" },
  copy: {
    tagline: "reggaeton nostalgico",
    ogSubtitle: "REGGAETON NOSTALGICO",
    welcomeSubtitle: "Reggaeton nostalgico",
    steps: [
      {
        n: "01",
        title: "Elegi tu entrada",
        body: "Mirá las fechas, elegí el tipo de entrada y listo. No hay lista ni invitación: entra cualquiera.",
      },
      {
        n: "02",
        title: "Paga y confirma",
        body: "Checkout seguro con MercadoPago. Si la entrada es gratis, la reclamás y ya.",
      },
      {
        n: "03",
        title: "Te llega el QR",
        body: "Recibís tu código por mail. Mostralo en la puerta y entrás.",
      },
    ],
    emptyDates: "No hay fechas abiertas ahora. Volvé pronto.",
    loadingLabel: "Cargando",
    footerBrand: "CULPA · MVD",
    messages: [
      {
        from: "SOFI",
        time: "21:04",
        body: "vas o no vas?? ya compre la mia, no me dejes sola eh",
      },
      {
        from: "MATI",
        time: "20:51",
        body: "boludo {dia} va a estar demasiado. no me lo pierdo ni en pedo",
      },
      {
        from: "NICO (?)",
        time: "19:32",
        body: "hola! vas a ir a culpa {dia}? preguntaba por preguntar",
      },
      {
        from: "MAMA",
        time: "18:10",
        body: "hija a que hora volves? llevate abrigo",
      },
      {
        from: "CULPA",
        time: "17:00",
        body: "quedan pocas. despues no digas que no te avisamos.",
      },
    ],
  },
};

/*
 * Halloween: mismo celu, otra piel. LCD calabaza, cuerpo violeta, crema hueso.
 * El alert se oscurece a sangre porque el rojo del clásico se perdía sobre el
 * naranja. El amarillo del logo no cambia: el keyline negro lo sostiene.
 */
const halloween: Theme = {
  name: "halloween",
  label: "Halloween",
  palette: {
    lcd: "#f4841f",
    lcdDark: "#c96412",
    body: "#5b2a86",
    bodyDark: "#3a1758",
    ink: "#0d0d0d",
    cream: "#efe6cf",
    night: "#070409",
    yellow: "#ffde59",
    alert: "#a8101c",
  },
  emailInks: { soft: "#523112", muted: "#693d14", rule: "#804816" },
  copy: {
    tagline: "reggaeton de ultratumba",
    ogSubtitle: "REGGAETON DE ULTRATUMBA",
    welcomeSubtitle: "Reggaeton de ultratumba",
    steps: [
      {
        n: "01",
        title: "Elegi tu entrada",
        body: "Mirá las fechas, elegí el tipo de entrada y listo. No hay lista ni invitación: entra cualquiera, con o sin disfraz.",
      },
      {
        n: "02",
        title: "Paga y confirma",
        body: "Checkout seguro con MercadoPago. Si la entrada es gratis, la reclamás y ya. Sin truco.",
      },
      {
        n: "03",
        title: "Te llega el QR",
        body: "Recibís tu código por mail. Mostralo en la puerta. Dulce o truco, entrás igual.",
      },
    ],
    emptyDates: "No hay fechas abiertas ahora. Volvé antes de medianoche.",
    loadingLabel: "Invocando",
    footerBrand: "CULPA · NOCHE DE BRUJAS",
    messages: [
      {
        from: "SOFI",
        time: "21:04",
        body: "ya tengo el disfraz, vos?? no me dejes sola eh",
      },
      {
        from: "MATI",
        time: "20:51",
        body: "boludo {dia} va a estar demasiado. voy de vampiro, otra vez",
      },
      {
        from: "NICO (?)",
        time: "19:32",
        body: "hola! vas a culpa {dia}? de que te disfrazas? preguntaba por preguntar",
      },
      {
        from: "MAMA",
        time: "18:10",
        body: "hija a que hora volves? no comas tantos caramelos",
      },
      {
        from: "CULPA",
        time: "17:00",
        body: "quedan pocas. despues no digas que no te asustamos.",
      },
    ],
  },
};

export const THEMES: Record<ThemeName, Theme> = { classic, halloween };

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && (THEME_NAMES as readonly string[]).includes(value);
}

/** Lo que haya en la DB (o nada) convertido a un tema válido. */
export function parseThemeName(value: unknown): ThemeName {
  return isThemeName(value) ? value : DEFAULT_THEME;
}
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: PASS (7 tests).

- [ ] **Step 7: Lint and typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/theme.ts src/lib/theme.test.ts
git commit -m "Define the classic and halloween themes as data and add vitest

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Rename tokens by role and add the Halloween CSS override

**Files:**
- Modify: `src/app/globals.css` (full rewrite below)
- Modify: every file under `src/` and `README.md` that mentions `culpa-lime` or `culpa-blue` (mechanical sed)

**Interfaces:**
- Produces: Tailwind classes `bg-culpa-lcd`, `bg-culpa-lcd-dark`, `bg-culpa-body`, `bg-culpa-body-dark` (and `text-`, `border-`, `/opacity` variants); CSS vars `--culpa-lcd`, `--culpa-lcd-dark`, `--culpa-body`, `--culpa-body-dark`; email classes `.culpa-body`, `.culpa-lcd-text`; keyframe `pulse-lcd`.
- Consumers: every later task uses the new names.

- [ ] **Step 1: Rename in one pass**

```bash
cd /Users/lolo/repos/culpa-tickets
grep -rlE "culpa-(lime|blue)" src README.md | xargs sed -i '' -E \
  's/culpa-lime-dark/culpa-lcd-dark/g;
   s/culpa-lime-text/culpa-lcd-text/g;
   s/culpa-lime/culpa-lcd/g;
   s/culpa-blue-dark/culpa-body-dark/g;
   s/culpa-blue/culpa-body/g'
grep -rnE "culpa-(lime|blue)|pulse-lime" src README.md
```

Expected: the final grep prints only the `pulse-lime` lines in `globals.css` (rewritten in the next step).

- [ ] **Step 2: Rewrite `src/app/globals.css`**

```css
@import "tailwindcss";

/*
 * Culpa — nostalgia de celular viejo.
 * La pantalla LCD es el fondo de todo el contenido; el cuerpo es el celu y los
 * botones; la noche es lo que rodea al celu en desktop.
 *
 * Los hex de acá son copia de src/lib/theme.ts, que es la fuente de verdad
 * (CSS no puede importarlos). :root es el tema clásico; [data-theme] pisa las
 * mismas variables con otra piel y el resto del CSS no se entera.
 */
:root {
  --culpa-lcd: #c9d92c;
  --culpa-lcd-dark: #a3b01f;
  --culpa-body: #2b3ad8;
  --culpa-body-dark: #1d2795;
  --culpa-ink: #0d0d0d;
  --culpa-cream: #f4e3d7;
  --culpa-night: #080808;
  --culpa-yellow: #ffde59; /* el amarillo exacto del logo */
  --culpa-alert: #e23b2e;
}

/* Halloween: LCD calabaza, cuerpo violeta, crema hueso, alerta sangre. */
:root[data-theme="halloween"] {
  --culpa-lcd: #f4841f;
  --culpa-lcd-dark: #c96412;
  --culpa-body: #5b2a86;
  --culpa-body-dark: #3a1758;
  --culpa-cream: #efe6cf;
  --culpa-night: #070409;
  --culpa-alert: #a8101c;
}

@theme inline {
  --color-culpa-lcd: var(--culpa-lcd);
  --color-culpa-lcd-dark: var(--culpa-lcd-dark);
  --color-culpa-body: var(--culpa-body);
  --color-culpa-body-dark: var(--culpa-body-dark);
  --color-culpa-ink: var(--culpa-ink);
  --color-culpa-cream: var(--culpa-cream);
  --color-culpa-night: var(--culpa-night);
  --color-culpa-yellow: var(--culpa-yellow);
  --color-culpa-alert: var(--culpa-alert);

  /* La voz de la interfaz es pixelada; los párrafos y los softkeys, Tahoma,
     tal como mezclaban los teléfonos de la época. */
  --font-pixel: var(--font-silkscreen), "Courier New", monospace;
  --font-ui: Tahoma, Verdana, Geneva, sans-serif;
}

body {
  background: var(--culpa-night);
  color: var(--culpa-cream);
  font-family: Tahoma, Verdana, Geneva, sans-serif;
}

/* ── Tipografía de marca ─────────────────────────────────────────── */

.culpa-heading {
  font-family: var(--font-silkscreen), "Courier New", monospace;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.culpa-subheading {
  font-family: var(--font-silkscreen), "Courier New", monospace;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

/* Sombra dura, sin blur, para texto que necesita despegarse del fondo. La usa
   el copy destacado; el logo ya trae su extrusión dibujada. */
.culpa-shadow {
  text-shadow: 3px 3px 0 var(--culpa-ink);
}

/* ── Pantalla LCD ────────────────────────────────────────────────── */

/* Grilla de píxeles y viñeta, encima del contenido pero sin capturar clics.
   Va sobre el contenedor de la pantalla, no sobre el área que scrollea, así
   la textura queda quieta mientras el contenido se mueve debajo. */
.lcd-texture::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  background-image:
    repeating-linear-gradient(
      0deg,
      color-mix(in srgb, var(--culpa-ink) 7%, transparent) 0 1px,
      transparent 1px 3px
    ),
    repeating-linear-gradient(
      90deg,
      color-mix(in srgb, var(--culpa-ink) 5%, transparent) 0 1px,
      transparent 1px 3px
    );
  box-shadow: inset 0 0 70px color-mix(in srgb, var(--culpa-ink) 22%, transparent);
}

/* En Halloween la viñeta cierra un poco más: pantalla vieja en una noche
   más oscura. */
:root[data-theme="halloween"] .lcd-texture::after {
  box-shadow: inset 0 0 70px color-mix(in srgb, var(--culpa-ink) 32%, transparent);
}

/* Los QR y cualquier bitmap chico se ven como se veían: sin suavizar. */
.pixelated {
  image-rendering: pixelated;
}

/* ── Animaciones ─────────────────────────────────────────────────── */

.animate-in {
  animation: fadeSlideIn 0.4s ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Parpadeo del cursor de menú, como el caret de un Nokia */
.blink {
  animation: blink 1.1s steps(1, end) infinite;
}

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

.success-pulse {
  animation: successPulse 2s ease-in-out infinite;
}

@keyframes successPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--culpa-ink) 30%, transparent);
  }
  50% {
    box-shadow: 0 0 20px 8px color-mix(in srgb, var(--culpa-ink) 10%, transparent);
  }
}

/* Glow del validador: LCD para válido, alerta para inválido. Siguen al tema. */
@keyframes pulse-lcd {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--culpa-lcd) 45%, transparent);
  }
  50% {
    box-shadow: 0 0 30px 10px color-mix(in srgb, var(--culpa-lcd) 20%, transparent);
  }
}

.scan-valid {
  animation: pulse-lcd 1.5s ease-in-out infinite;
}

@keyframes pulse-alert {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--culpa-alert) 45%, transparent);
  }
  50% {
    box-shadow: 0 0 30px 10px color-mix(in srgb, var(--culpa-alert) 20%, transparent);
  }
}

.scan-invalid {
  animation: pulse-alert 1.5s ease-in-out infinite;
}
```

- [ ] **Step 3: Check nothing old is left and everything compiles**

```bash
grep -rnE "culpa-(lime|blue)|pulse-lime|rgba\(201" src README.md; echo "exit=$?"
npm run lint && npx tsc --noEmit
```

Expected: the grep prints nothing and `exit=1`; lint and tsc clean.

- [ ] **Step 4: Eyeball the classic look is unchanged**

Run `npm run dev`, open `http://localhost:3000` and `/validator`. The screen is still lime, the body still blue, the validator glow still lime. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add -A src README.md
git commit -m "Rename the color tokens by role and add the Halloween CSS override

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: `Setting` model and `theme-store`

**Files:**
- Modify: `prisma/schema.prisma` (append model)
- Create: `prisma/migrations/20260906_add_setting/migration.sql`
- Create: `src/lib/theme-store.ts`

**Interfaces:**
- Consumes: `DEFAULT_THEME`, `parseThemeName`, `ThemeName` from `@/lib/theme`.
- Produces:
  - `getSiteTheme(): Promise<ThemeName>` — never throws.
  - `setSiteTheme(theme: ThemeName): Promise<void>`.

- [ ] **Step 1: Add the model to `prisma/schema.prisma`** (append at the end)

```prisma
// Configuración global del sitio, clave/valor. Hoy solo guarda `theme`.
model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Write the migration** `prisma/migrations/20260906_add_setting/migration.sql`

```sql
-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);
```

- [ ] **Step 3: Generate the client and apply locally**

```bash
npm run db:generate && npm run db:migrate
```

Expected: `prisma generate` writes `src/generated/prisma/models/Setting.ts`; migrate applies `20260906_add_setting`.

- [ ] **Step 4: Create `src/lib/theme-store.ts`**

```ts
import { prisma } from "@/lib/db";
import { DEFAULT_THEME, parseThemeName, type ThemeName } from "@/lib/theme";

/*
 * El tema vigente vive en una fila de Setting. Sin fila, o con la DB caída,
 * el sitio se ve clásico: leer el tema nunca puede tirar el layout.
 */

const THEME_KEY = "theme";

export async function getSiteTheme(): Promise<ThemeName> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: THEME_KEY } });
    return parseThemeName(row?.value);
  } catch (error) {
    console.error("No se pudo leer el tema del sitio; se usa el clásico", error);
    return DEFAULT_THEME;
  }
}

export async function setSiteTheme(theme: ThemeName): Promise<void> {
  await prisma.setting.upsert({
    where: { key: THEME_KEY },
    update: { value: theme },
    create: { key: THEME_KEY, value: theme },
  });
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean (proves `prisma.setting` exists on the generated client).

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260906_add_setting src/lib/theme-store.ts src/generated
git commit -m "Store the active site theme in a Setting row

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

(If `src/generated` is gitignored, `git add` simply skips it.)

---

### Task 4: ThemeProvider and root layout

**Files:**
- Create: `src/components/theme-provider.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `getSiteTheme` (Task 3), `THEMES`, `Theme` (Task 1).
- Produces:
  - `ThemeProvider({ theme: Theme; children })` client component.
  - `useTheme(): Theme` hook, defaults to `THEMES.classic` outside a provider.
  - `<html data-theme={themeName}>`.

- [ ] **Step 1: Create `src/components/theme-provider.tsx`**

```tsx
"use client";

import { createContext, useContext } from "react";
import { THEMES, type Theme } from "@/lib/theme";

/*
 * El tema baja del root layout (que lo lee de la DB) a las pantallas cliente,
 * que sacan de acá el copy y deciden qué íconos dibujar. Los colores no pasan
 * por acá: los resuelve CSS con data-theme en <html>.
 */

const ThemeContext = createContext<Theme>(THEMES.classic);

export function ThemeProvider({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
```

- [ ] **Step 2: Rewrite `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Silkscreen } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { THEMES } from "@/lib/theme";
import { getSiteTheme } from "@/lib/theme-store";
import "./globals.css";

// El tema sale de la DB en cada request, así que nada se prerenderiza en el
// build (que corre sin base de datos).
export const dynamic = "force-dynamic";

// La voz de la interfaz: pixelada, como el bitmap de un teléfono viejo.
const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-silkscreen",
  display: "swap",
});

// El wordmark no es una fuente: es la gráfica de la marca, en
// public/culpa-wordmark.png.

const TITLE = "Culpa";

export async function generateMetadata(): Promise<Metadata> {
  const theme = THEMES[await getSiteTheme()];
  const description = theme.copy.tagline;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ),
    title: TITLE,
    description,
    openGraph: {
      title: TITLE,
      description,
      type: "website",
      url: "/",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          type: "image/png",
          alt: TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description,
      images: [
        {
          url: "/twitter-image",
          width: 1200,
          height: 630,
          alt: TITLE,
        },
      ],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeName = await getSiteTheme();

  return (
    <html lang="es" data-theme={themeName} className={silkscreen.variable}>
      {/* dvh y no vh: en mobile el 100vh incluye la barra del navegador, y el
          sobrante quedaba como una franja negra scrolleable bajo la pantalla. */}
      <body className="antialiased min-h-[100dvh] bg-culpa-night text-culpa-cream">
        <ThemeProvider theme={THEMES[themeName]}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the switch works end to end by hand**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000 | grep -o 'data-theme="[a-z]*"'
```

Expected: `data-theme="classic"`. Then flip the row directly:

```bash
npx prisma db execute --stdin <<'SQL'
INSERT INTO "Setting" ("key","value","updatedAt") VALUES ('theme','halloween',now())
ON CONFLICT ("key") DO UPDATE SET "value"='halloween', "updatedAt"=now();
SQL
curl -s http://localhost:3000 | grep -o 'data-theme="[a-z]*"'
```

Expected: `data-theme="halloween"`, and the browser shows an orange screen on a purple phone. Put it back:

```bash
npx prisma db execute --stdin <<'SQL'
UPDATE "Setting" SET "value"='classic' WHERE "key"='theme';
SQL
```

Stop the dev server.

- [ ] **Step 4: Lint, typecheck, tests**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/theme-provider.tsx src/app/layout.tsx
git commit -m "Read the active theme in the root layout and expose it to the client

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Theme-driven copy and the bat icon

**Files:**
- Modify: `src/lib/messages.ts`
- Test: `src/lib/messages.test.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/mensajes/page.tsx`
- Modify: `src/components/nokia/ui.tsx`
- Modify: `src/components/nokia/phone-shell.tsx`

**Interfaces:**
- Consumes: `useTheme()` (Task 4), `PhoneMessage`, `THEMES` (Task 1).
- Produces: `buildMessages(dayDot: string | null, script: PhoneMessage[]): PhoneMessage[]`; `previewOf` unchanged; `LcdLoading({ label?: string })` defaults to the theme's `loadingLabel`.

- [ ] **Step 1: Write the failing test `src/lib/messages.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { buildMessages, previewOf } from "@/lib/messages";
import { THEMES } from "@/lib/theme";

describe("buildMessages", () => {
  it("mete la fecha real en el guion", () => {
    const messages = buildMessages("31.10", THEMES.classic.copy.messages);
    expect(messages.find((m) => m.from === "MATI")?.body).toContain("el 31.10");
    expect(messages.some((m) => m.body.includes("{dia}"))).toBe(false);
  });

  it("sin fecha habla del finde", () => {
    const messages = buildMessages(null, THEMES.halloween.copy.messages);
    expect(messages.find((m) => m.from === "MATI")?.body).toContain("el finde");
  });

  it("usa el guion que le pasan", () => {
    const halloween = buildMessages("31.10", THEMES.halloween.copy.messages);
    expect(halloween.find((m) => m.from === "SOFI")?.body).toContain("disfraz");
  });

  it("no muta el guion original", () => {
    const script = THEMES.classic.copy.messages;
    const before = JSON.stringify(script);
    buildMessages("31.10", script);
    expect(JSON.stringify(script)).toBe(before);
  });
});

describe("previewOf", () => {
  it("corta con puntos suspensivos", () => {
    expect(previewOf("a".repeat(50), 10)).toBe("aaaaaaaaaa...");
    expect(previewOf("corto")).toBe("corto");
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test`
Expected: FAIL, `buildMessages` ignores the second argument (SOFI test fails: classic script has no "disfraz").

- [ ] **Step 3: Rewrite `src/lib/messages.ts`**

```ts
import type { PhoneMessage } from "@/lib/theme";

/*
 * La bandeja de SMS: los mensajes que te llegan preguntando si de verdad te
 * vas a perder la fecha. El guion vive en el tema (src/lib/theme.ts); acá
 * solo se le mete la fecha y se recorta para la lista.
 *
 * Las horas van escritas a mano, no calculadas: el reloj del servidor y el del
 * navegador nunca coinciden al minuto y romperían la hidratación.
 */

export type { PhoneMessage };

/**
 * El guion con la fecha real adentro. Sin fecha abierta los mensajes quedan
 * en genérico ("el finde") en vez de mostrar un hueco.
 */
export function buildMessages(
  dayDot: string | null,
  script: PhoneMessage[]
): PhoneMessage[] {
  const day = dayDot ? `el ${dayDot}` : "el finde";
  return script.map((m) => ({ ...m, body: m.body.replace("{dia}", day) }));
}

/** El renglón que se ve en la bandeja, cortado como en la pantalla del Nokia. */
export function previewOf(body: string, max = 38): string {
  if (body.length <= max) return body;
  return `${body.slice(0, max).trimEnd()}...`;
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS. `npx tsc --noEmit` now fails in `mensajes/page.tsx` (missing argument) — fixed next.

- [ ] **Step 5: Update `src/app/mensajes/page.tsx`**

Add the import and use the theme's script. Replace:

```ts
import { buildMessages, previewOf, type PhoneMessage } from "@/lib/messages";
```

with:

```ts
import { buildMessages, previewOf, type PhoneMessage } from "@/lib/messages";
import { useTheme } from "@/components/theme-provider";
```

Inside `MessagesPage`, right after the `useState` declarations add:

```ts
  const { copy } = useTheme();
```

and replace:

```ts
  const messages = buildMessages(
    nextEvent ? formatDayDot(nextEvent.date) : null
  );
```

with:

```ts
  const messages = buildMessages(
    nextEvent ? formatDayDot(nextEvent.date) : null,
    copy.messages
  );
```

- [ ] **Step 6: Update `src/app/page.tsx`**

Add the import:

```ts
import { useTheme } from "@/components/theme-provider";
```

Delete the whole `const STEPS = [ … ];` block. Inside `HomePage`, after the two `useState` lines add:

```ts
  const { copy } = useTheme();
```

Then make these four replacements:

1. Tagline:
```tsx
        <p className="font-pixel text-[0.7rem] tracking-[0.1em] text-culpa-ink mt-3">
          {copy.tagline}
        </p>
```

2. Empty state:
```tsx
            <p className="font-ui text-sm text-culpa-ink/60">
              {copy.emptyDates}
            </p>
```

3. Steps: `{STEPS.map((step) => (` → `{copy.steps.map((step) => (`

4. Footer brand:
```tsx
          <span className="font-pixel text-[0.6rem] tracking-[0.15em] text-culpa-ink/60">
            {copy.footerBrand}
          </span>
```

- [ ] **Step 7: Make `LcdLoading` read the theme in `src/components/nokia/ui.tsx`**

Add `"use client";` as the first line of the file (it now uses a hook), and the import:

```ts
import { useTheme } from "@/components/theme-provider";
```

Replace the `LcdLoading` component:

```tsx
/** «CARGANDO» con el bloque parpadeando, como un teléfono pensando. El texto
    por defecto lo pone el tema. */
export function LcdLoading({ label }: { label?: string }) {
  const { copy } = useTheme();
  return (
    <p className="font-pixel text-xs uppercase tracking-[0.15em] text-culpa-ink/70 flex items-center gap-1">
      {label ?? copy.loadingLabel}
      <span className="blink" aria-hidden="true">
        _
      </span>
    </p>
  );
}
```

Check no server component imports `ui.tsx`:

```bash
grep -rl "nokia/ui" src | xargs grep -L '"use client"'
```

Expected: no output (every importer is already a client component).

- [ ] **Step 8: Bat icon in `src/components/nokia/phone-shell.tsx`**

Add the import:

```ts
import { useTheme } from "@/components/theme-provider";
```

After `EnvelopeIcon`, add:

```tsx
/* Murciélago de píxeles, 14×10 como el sobre. Solo sale en Halloween. */
function BatIcon() {
  return (
    <svg
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="2" y="1" width="1" height="1" />
      <rect x="11" y="1" width="1" height="1" />
      <rect x="1" y="2" width="2" height="1" />
      <rect x="11" y="2" width="2" height="1" />
      <rect x="1" y="3" width="3" height="1" />
      <rect x="10" y="3" width="3" height="1" />
      <rect x="1" y="4" width="4" height="1" />
      <rect x="6" y="4" width="2" height="1" />
      <rect x="9" y="4" width="4" height="1" />
      <rect x="1" y="5" width="12" height="1" />
      <rect x="2" y="6" width="10" height="1" />
      <rect x="3" y="7" width="3" height="1" />
      <rect x="8" y="7" width="3" height="1" />
      <rect x="4" y="8" width="1" height="1" />
      <rect x="9" y="8" width="1" height="1" />
    </svg>
  );
}
```

In `StatusBar`, add `const theme = useTheme();` next to the `clock` state, and replace `<EnvelopeIcon />` with:

```tsx
        {theme.name === "halloween" ? <BatIcon /> : <EnvelopeIcon />}
```

- [ ] **Step 9: Lint, typecheck, tests**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: clean.

- [ ] **Step 10: Check both themes in the browser**

`npm run dev`; with the DB row on `classic` open `/` and `/mensajes`: same copy as before. Set the row to `halloween` (SQL from Task 4 step 3), reload: tagline "reggaeton de ultratumba", footer "CULPA · NOCHE DE BRUJAS", bat in the status bar, inbox mentions disfraz. Set the row back to `classic`. Stop the server.

- [ ] **Step 11: Commit**

```bash
git add src/lib/messages.ts src/lib/messages.test.ts src/app/page.tsx src/app/mensajes/page.tsx src/components/nokia/ui.tsx src/components/nokia/phone-shell.tsx
git commit -m "Take the home, inbox and loading copy from the active theme

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Theme-aware emails

**Files:**
- Modify: `src/lib/email.ts` (full rewrite below)
- Test: `src/lib/email.test.ts`

**Interfaces:**
- Consumes: `Theme`, `THEMES` (Task 1), `getSiteTheme` (Task 3).
- Produces:
  - `buildWelcomeEmail(params: WelcomeEmailParams, theme: Theme = THEMES.classic): { subject; html }`
  - `buildTicketEmail(params: TicketEmailParams, theme: Theme = THEMES.classic): { subject; html; attachments }`
  - `sendWelcomeEmail`, `sendTicketEmail` unchanged signatures; they fetch the theme.

- [ ] **Step 1: Write the failing test `src/lib/email.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

// El módulo instancia Resend al cargar y Resend exige API key; y el store del
// tema arrastra Prisma. Ninguno de los dos hace falta para armar HTML.
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn() };
  },
}));
vi.mock("@/lib/theme-store", () => ({
  getSiteTheme: vi.fn(async () => "classic"),
}));

import { buildTicketEmail, buildWelcomeEmail } from "@/lib/email";
import { THEMES } from "@/lib/theme";

const ticketParams = {
  to: "a@b.c",
  eventName: "Culpa Halloween",
  ticketType: "General",
  date: "31 de octubre",
  purchaserName: "Sofi",
  qrCodeBuffer: Buffer.from("qr"),
};

describe("buildTicketEmail", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://culpa.test";
  });

  it("sin tema pinta el clásico", () => {
    const { html } = buildTicketEmail(ticketParams);
    expect(html).toContain("#c9d92c");
    expect(html).toContain("#2b3ad8");
    expect(html).not.toContain("#f4841f");
  });

  it("con Halloween pinta calabaza y violeta, y nada de lima ni azul", () => {
    const { html } = buildTicketEmail(ticketParams, THEMES.halloween);
    expect(html).toContain("#f4841f");
    expect(html).toContain("#5b2a86");
    expect(html).toContain("#523112");
    expect(html).not.toContain("#c9d92c");
    expect(html).not.toContain("#2b3ad8");
    expect(html).not.toContain("#454a16");
  });

  it("el QR viaja inline por content-id", () => {
    const { html, attachments } = buildTicketEmail(ticketParams);
    expect(attachments[0].contentId).toBe("culpa-qr");
    expect(html).toContain("cid:culpa-qr");
  });
});

describe("buildWelcomeEmail", () => {
  it("usa el subtítulo del tema", () => {
    const params = { to: "a@b.c", name: "Sofi", events: [] };
    expect(buildWelcomeEmail(params).html).toContain("Reggaeton nostalgico");
    expect(buildWelcomeEmail(params, THEMES.halloween).html).toContain(
      "Reggaeton de ultratumba"
    );
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test`
Expected: FAIL on the Halloween cases (the builder ignores the second argument today).

- [ ] **Step 3: Rewrite `src/lib/email.ts`**

```ts
import { Resend } from "resend";
import { formatDayDot, formatEventDateTime } from "@/lib/date";
import { THEMES, type Theme } from "@/lib/theme";
import { getSiteTheme } from "@/lib/theme-store";

const resend = new Resend(process.env.RESEND_API_KEY);

/*
 * Los mails repiten la pantalla del celular: marco del cuerpo, LCD, texto
 * tinta, con la paleta del tema vigente. Sin webfonts (ningún cliente de mail
 * las garantiza): la voz pixelada la hace Courier y los párrafos Tahoma, igual
 * que en la web.
 *
 * Los builders reciben el tema como parámetro (por defecto el clásico) para
 * poder inspeccionar el HTML sin DB; los send* lo leen del store.
 */

const PAPER = "#ffffff";

const PIXEL_FONT = '"Courier New", Courier, monospace';
const UI_FONT = "Tahoma, Verdana, Geneva, sans-serif";

/* El identificador con el que el HTML referencia al QR adjunto. Los clientes de
   mail descartan los data: URI en <img>, así que la imagen viaja como adjunto
   inline y se enlaza por Content-ID. */
const QR_CONTENT_ID = "culpa-qr";

/** La barra de estado del teléfono, arriba de la pantalla. */
function statusBar(theme: Theme): string {
  const { ink } = theme.palette;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td class="culpa-ink" style="font-family:${PIXEL_FONT};font-size:11px;color:${ink};text-align:left;">
          .ıll &nbsp;&#9993;
        </td>
        <td class="culpa-ink" style="font-family:${PIXEL_FONT};font-size:11px;color:${ink};text-align:right;">
          11:11 &nbsp;&#9636;
        </td>
      </tr>
    </table>`;
}

/*
 * El logo sobre una franja tinta. Va como imagen alojada, así que si el cliente
 * bloquea imágenes queda el texto alternativo — con color y peso propios, para
 * que se lea contra el negro en vez de desaparecer.
 */
function wordmark(theme: Theme, appUrl: string, subtitle: string): string {
  const { ink, cream, lcd } = theme.palette;
  return `
    <div class="culpa-band" style="background-color:${ink};padding:20px 16px;text-align:center;">
      <img src="${appUrl}/culpa-wordmark.png" alt="Culpa" width="220" class="culpa-cream"
           style="width:220px;max-width:72%;height:auto;display:block;margin:0 auto;color:${cream};font-family:${UI_FONT};font-weight:bold;font-size:30px;" />
      <div class="culpa-lcd-text" style="font-family:${PIXEL_FONT};font-size:10px;letter-spacing:2px;color:${lcd};margin-top:12px;text-transform:uppercase;">
        ${subtitle}
      </div>
    </div>`;
}

/*
 * La paleta, repetida como CSS. El mail ya es oscuro por diseño, así que lo que
 * necesitamos de los clientes en dark mode es que no toquen nada:
 *
 *  - `color-scheme` / `supported-color-schemes` le avisan a Apple Mail, iOS Mail
 *    y Outlook que el mensaje se hace cargo de los dos esquemas. Sin esa
 *    declaración inviertan por su cuenta, y como acá conviven un panel LCD
 *    claro y un marco negro, terminan dando vuelta una mitad sola.
 *  - El bloque `prefers-color-scheme` vuelve a fijar los mismos colores para los
 *    clientes que sí respetan media queries.
 *  - Gmail en Android/iOS no respeta media queries: reescribe los colores en
 *    línea y marca lo que tocó con data-ogsc (texto) y data-ogsb (fondo). Ahí
 *    los volvemos a poner a mano.
 */
function palette(theme: Theme): string {
  const { night, body, lcd, ink, cream } = theme.palette;
  const { soft, muted } = theme.emailInks;
  const rules = [
    [".culpa-night", `background-color:${night}`],
    [".culpa-body", `background-color:${body}`],
    [".culpa-lcd", `background-color:${lcd}`],
    [".culpa-band", `background-color:${ink}`],
    [".culpa-paper", `background-color:${PAPER}`],
    [".culpa-ink", `color:${ink}`],
    [".culpa-ink-soft", `color:${soft}`],
    [".culpa-ink-muted", `color:${muted}`],
    [".culpa-cream", `color:${cream}`],
    [".culpa-lcd-text", `color:${lcd}`],
  ];

  const force = (prefix: string) =>
    rules
      .map(([cls, decl]) => `${prefix}${cls}{${decl} !important;}`)
      .join("");

  return [
    ":root{color-scheme:light dark;supported-color-schemes:light dark;}",
    `@media (prefers-color-scheme: dark){${force("")}}`,
    force("[data-ogsc] "),
    force("[data-ogsb] "),
  ].join("");
}

/** Envuelve el contenido en el celular: fondo noche, cuerpo, LCD. */
function shell(theme: Theme, inner: string): string {
  const { night, body, lcd } = theme.palette;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <style>${palette(theme)}</style>
    </head>
    <body class="culpa-night" style="margin:0;padding:0;background-color:${night};font-family:${UI_FONT};">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="culpa-night" style="background-color:${night};padding:24px 12px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="culpa-body" style="max-width:460px;background-color:${body};border-radius:28px;padding:18px;">
              <tr>
                <td class="culpa-lcd" style="background-color:${lcd};border-radius:14px;padding:14px;">
                  ${statusBar(theme)}
                  ${inner}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
}

export interface WelcomeEmailParams {
  to: string;
  name: string;
  events: { name: string; date: Date; slug: string }[];
}

/* El armado del mail va separado del envío: así se puede inspeccionar el HTML
   resultante sin llamar a Resend ni a la DB. */
export function buildWelcomeEmail(
  params: WelcomeEmailParams,
  theme: Theme = THEMES.classic
): {
  subject: string;
  html: string;
} {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { ink, body, cream } = theme.palette;
  const { soft, rule } = theme.emailInks;

  const eventListHtml =
    params.events.length > 0
      ? params.events
          .map(
            (e) => `
          <a href="${appUrl}/event/${e.slug}" style="display:block;text-decoration:none;border:2px solid ${ink};padding:12px;margin:0 0 8px 0;">
            <span class="culpa-ink" style="font-family:${PIXEL_FONT};font-size:12px;font-weight:bold;color:${ink};text-transform:uppercase;">
              ${formatDayDot(e.date)} &nbsp;&gt;&nbsp; ${e.name}
            </span>
            <br/>
            <span class="culpa-ink-soft" style="font-family:${UI_FONT};font-size:11px;color:${soft};">
              ${formatEventDateTime(e.date)}
            </span>
          </a>`
          )
          .join("")
      : `<p class="culpa-ink-soft" style="font-family:${UI_FONT};font-size:13px;color:${soft};margin:0;">
           Te avisamos cuando abramos la próxima fecha.
         </p>`;

  const inner = `
    ${wordmark(theme, appUrl, theme.copy.welcomeSubtitle)}

    <div style="padding:16px 4px 4px 4px;">
      <p class="culpa-ink" style="font-family:${PIXEL_FONT};font-size:12px;color:${ink};margin:0 0 10px 0;text-transform:uppercase;">
        Hola ${params.name}
      </p>
      <p class="culpa-ink" style="font-family:${UI_FONT};font-size:14px;color:${ink};margin:0;line-height:1.6;">
        Te agregamos a la lista de Culpa. Ya podés sacar tu entrada para estas fechas:
      </p>
    </div>

    <div style="padding:14px 4px;">
      ${eventListHtml}
    </div>

    <div style="padding:6px 4px 16px 4px;text-align:center;">
      <a href="${appUrl}" class="culpa-body culpa-cream" style="display:inline-block;background-color:${body};color:${cream};border:2px solid ${ink};font-family:${PIXEL_FONT};font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;padding:14px 28px;text-decoration:none;">
        Ver fechas
      </a>
    </div>

    <div style="border-top:2px solid ${rule};margin:6px 4px;"></div>

    <p class="culpa-ink-soft" style="font-family:${PIXEL_FONT};font-size:10px;color:${soft};margin:10px 4px 4px 4px;text-transform:uppercase;text-align:center;">
      Cualquier duda, escribinos por Instagram
    </p>`;

  return { subject: "Estás en la lista de Culpa", html: shell(theme, inner) };
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const theme = THEMES[await getSiteTheme()];
  const { subject, html } = buildWelcomeEmail(params, theme);

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Culpa <tickets@yourdomain.com>",
    to: params.to,
    subject,
    html,
  });
}

export interface TicketEmailParams {
  to: string;
  eventName: string;
  ticketType: string;
  date: string;
  purchaserName: string;
  qrCodeBuffer: Buffer;
}

export function buildTicketEmail(
  params: TicketEmailParams,
  theme: Theme = THEMES.classic
): {
  subject: string;
  html: string;
  attachments: { filename: string; content: Buffer; contentId?: string }[];
} {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { ink } = theme.palette;
  const { soft, muted, rule } = theme.emailInks;

  const label = (text: string) =>
    `<span class="culpa-ink-muted" style="color:${muted};">${text}</span>`;

  const inner = `
    ${wordmark(theme, appUrl, "Tu entrada")}

    <div class="culpa-paper" style="background-color:${PAPER};border:2px solid ${ink};padding:20px;margin:14px 0;text-align:center;">
      <img src="cid:${QR_CONTENT_ID}" alt="Código QR de tu entrada" width="240" height="240" style="width:240px;height:240px;display:block;margin:0 auto 14px auto;image-rendering:pixelated;" />
      <p class="culpa-ink" style="font-family:${PIXEL_FONT};font-size:11px;color:${ink};margin:0;text-transform:uppercase;">
        Mostra este QR en la puerta
      </p>
    </div>

    <div style="padding:0 4px;">
      <div class="culpa-ink" style="font-family:${PIXEL_FONT};font-size:11px;color:${ink};text-transform:uppercase;line-height:2;">
        <div>${label("Evento:")} ${params.eventName}</div>
        <div>${label("Fecha:")} ${params.date}</div>
        <div>${label("Tipo:")} ${params.ticketType}</div>
        <div>${label("Nombre:")} ${params.purchaserName}</div>
      </div>
    </div>

    <div style="border-top:2px solid ${rule};margin:16px 4px;"></div>

    <p class="culpa-ink-soft" style="font-family:${PIXEL_FONT};font-size:10px;color:${soft};margin:0 4px 4px 4px;text-transform:uppercase;text-align:center;line-height:1.8;">
      No compartas este QR con nadie.<br/>Cada entrada se usa una sola vez.
    </p>`;

  return {
    subject: `Tu entrada para ${params.eventName}`,
    html: shell(theme, inner),
    attachments: [
      {
        filename: "qrcode.png",
        content: params.qrCodeBuffer,
        /* Con contentId el PNG viaja como adjunto inline y el <img src="cid:…">
           lo encuentra. Sin esto el cliente lo lista como archivo para bajar. */
        contentId: QR_CONTENT_ID,
      },
    ],
  };
}

export async function sendTicketEmail(params: TicketEmailParams) {
  const theme = THEMES[await getSiteTheme()];
  const { subject, html, attachments } = buildTicketEmail(params, theme);

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Culpa <tickets@yourdomain.com>",
    to: params.to,
    subject,
    html,
    attachments,
  });
}
```

- [ ] **Step 4: Run tests, lint, typecheck**

Run: `npm test && npm run lint && npx tsc --noEmit`
Expected: all pass. Callers of `buildTicketEmail`/`buildWelcomeEmail` elsewhere (grep `build.*Email\(` in `src/app/api`) keep compiling because the theme parameter has a default; callers of `send*Email` are untouched.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email.ts src/lib/email.test.ts
git commit -m "Paint the emails with the active theme

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Theme-aware OG card and favicons

**Files:**
- Modify: `src/components/og-card.tsx`
- Modify: `src/app/opengraph-image.tsx`
- Modify: `src/app/twitter-image.tsx`
- Create: `src/app/icon.tsx`
- Create: `src/app/apple-icon.tsx`
- Delete: `src/app/icon.svg`, `src/app/apple-icon.svg`

**Interfaces:**
- Consumes: `THEMES`, `Theme` (Task 1), `getSiteTheme` (Task 3).
- Produces: `OgCard({ wordmarkSrc: string; theme: Theme })`.

- [ ] **Step 1: Make `OgCard` take a theme** — in `src/components/og-card.tsx` delete the four color constants and change the component head and every color reference:

```tsx
import type { Theme } from "@/lib/theme";

export const OG_SIZE = { width: 1200, height: 630 };

export function OgCard({
  wordmarkSrc,
  theme,
}: {
  wordmarkSrc: string;
  theme: Theme;
}) {
  const { night: NIGHT, body: BLUE, lcd: LIME, ink: INK } = theme.palette;
  return (
```

Keep the JSX as is (it already uses `NIGHT`, `BLUE`, `LIME`, `INK`), except the subtitle text:

```tsx
              {theme.copy.ogSubtitle}
```

replacing the literal `REGGAETON NOSTALGICO`. Update the header comment's first line to "pantalla LCD con la marca adentro, en la paleta del tema vigente".

- [ ] **Step 2: Update `src/app/opengraph-image.tsx`**

```tsx
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE } from "@/components/og-card";
import { THEMES } from "@/lib/theme";
import { getSiteTheme } from "@/lib/theme-store";

// Runtime de Node (no edge) para poder leer el logo del disco e incrustarlo:
// Satori no resuelve rutas relativas y no queremos que la imagen dependa de
// que el sitio se pueda pedir a sí mismo.
export const runtime = "nodejs";
// La paleta sale de la DB, así que la imagen se genera por request.
export const dynamic = "force-dynamic";

export const alt = "Culpa";
export const size = OG_SIZE;
export const contentType = "image/png";

async function wordmarkDataUri() {
  const file = await readFile(
    path.join(process.cwd(), "public", "culpa-wordmark.png")
  );
  return `data:image/png;base64,${file.toString("base64")}`;
}

export default async function Image() {
  const theme = THEMES[await getSiteTheme()];
  return new ImageResponse(
    <OgCard wordmarkSrc={await wordmarkDataUri()} theme={theme} />,
    { ...size }
  );
}
```

- [ ] **Step 3: Update `src/app/twitter-image.tsx`** identically (same imports, `dynamic = "force-dynamic"`, same `Image` body; keep its own comment "Ver la nota en opengraph-image.tsx sobre por qué corre en Node.").

- [ ] **Step 4: Create `src/app/icon.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { THEMES } from "@/lib/theme";
import { getSiteTheme } from "@/lib/theme-store";

/*
 * El favicon: el celu visto de frente, cuerpo redondeado, LCD y una «c» en
 * tinta. Se dibuja por request para seguir al tema vigente.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const { palette } = THEMES[await getSiteTheme()];
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: palette.body,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 26,
            height: 23,
            background: palette.lcd,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: palette.ink,
            fontSize: 21,
            fontWeight: 700,
            fontStyle: "italic",
            lineHeight: 1,
          }}
        >
          c
        </div>
      </div>
    ),
    size
  );
}
```

- [ ] **Step 5: Create `src/app/apple-icon.tsx`** — same file with these numbers: `size = { width: 180, height: 180 }`, outer `width/height: 180`, `borderRadius: 38`; inner `width: 144, height: 128, borderRadius: 18, fontSize: 118`. Header comment: "El ícono de home screen en iOS, el mismo dibujo que icon.tsx a 180 px."

- [ ] **Step 6: Delete the static icons**

```bash
git rm src/app/icon.svg src/app/apple-icon.svg
```

- [ ] **Step 7: Check in the browser**

`npm run dev`; open `http://localhost:3000/opengraph-image`, `/twitter-image`, `/icon`, `/apple-icon`. Classic: blue/lime. Flip the DB row to `halloween` (SQL from Task 4), hard-reload each: purple/orange and "REGGAETON DE ULTRATUMBA" on the card. Set the row back to `classic`. Stop the server.

- [ ] **Step 8: Lint, typecheck, tests**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add -A src/app/icon.tsx src/app/apple-icon.tsx src/app/icon.svg src/app/apple-icon.svg src/app/opengraph-image.tsx src/app/twitter-image.tsx src/components/og-card.tsx
git commit -m "Draw the share card and favicons in the active theme

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Admin API and theme switch

**Files:**
- Create: `src/app/api/admin/settings/theme/route.ts`
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (`@/lib/auth`), `getSiteTheme`/`setSiteTheme` (Task 3), `isThemeName`, `THEMES`, `THEME_NAMES` (Task 1), `useTheme` (Task 4).
- Produces: `GET /api/admin/settings/theme → { theme: ThemeName }`; `PUT` with `{ theme: ThemeName }` → `{ theme }`, `400 { error }` on bad input, `403` when not admin.

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isThemeName } from "@/lib/theme";
import { getSiteTheme, setSiteTheme } from "@/lib/theme-store";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ theme: await getSiteTheme() });
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const theme = body?.theme;
  if (!isThemeName(theme)) {
    return NextResponse.json(
      { error: "theme debe ser 'classic' o 'halloween'" },
      { status: 400 }
    );
  }

  try {
    await setSiteTheme(theme);
    return NextResponse.json({ theme });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Add the switch to `src/app/admin/page.tsx`**

Add imports at the top:

```ts
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { THEMES, THEME_NAMES, type ThemeName } from "@/lib/theme";
```

Add this component above `AdminDashboard`:

```tsx
/*
 * El switch de tema. Cambia el sitio público, los mails y el link compartido,
 * y también este admin: tras guardar se refresca el árbol para que el root
 * layout vuelva a leer la DB y la piel cambie al instante.
 */
function ThemeSwitch() {
  const router = useRouter();
  const current = useTheme().name;
  const [saving, setSaving] = useState<ThemeName | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(theme: ThemeName) {
    if (theme === current || saving) return;
    setSaving(theme);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo cambiar el tema");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el tema");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="culpa-heading text-sm text-culpa-cream mb-3">
        Tema del sitio
      </h2>
      <div className="flex flex-wrap gap-3">
        {THEME_NAMES.map((name) => {
          const active = name === current;
          return (
            <button
              key={name}
              type="button"
              onClick={() => choose(name)}
              disabled={saving !== null}
              aria-pressed={active}
              className={`font-pixel text-[0.7rem] uppercase tracking-[0.12em] px-5 py-3 border-2 border-culpa-ink transition-opacity disabled:opacity-60 ${
                active
                  ? "bg-culpa-lcd text-culpa-ink"
                  : "bg-culpa-body-dark text-culpa-cream hover:opacity-80"
              }`}
            >
              {saving === name ? "Guardando..." : THEMES[name].label}
              {active && saving === null ? " ✓" : ""}
            </button>
          );
        })}
      </div>
      <p className="font-ui text-xs text-culpa-cream/60 mt-3">
        Cambia el sitio público, los mails que salen desde ahora y la imagen
        del link compartido.
      </p>
      {error && (
        <p className="font-ui text-xs text-culpa-alert mt-2">{error}</p>
      )}
    </section>
  );
}
```

Then render it at the end of `AdminDashboard`'s returned `<div>`, after the metric grid:

```tsx
      <ThemeSwitch />
```

- [ ] **Step 3: Try it**

`npm run dev`, log in at `/login` (seed: `admin@culpa.uy` / `admin123`), open `/admin`. Click "Halloween": the button shows "Guardando...", then the admin nav turns purple and the button gets the ✓. Open `/` in another tab: orange screen, bat, new copy. Click "Clásico": back to blue/lime everywhere. Also check the API rejects junk:

```bash
curl -s -X PUT http://localhost:3000/api/admin/settings/theme -H 'Content-Type: application/json' -d '{"theme":"xmas"}'
```

Expected: `{"error":"Forbidden"}` without the session cookie (403); with the browser's `culpa-session` cookie passed via `-b`, a 400 with the Spanish error. Stop the server.

- [ ] **Step 4: Lint, typecheck, tests**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/settings/theme/route.ts src/app/admin/page.tsx
git commit -m "Let admins switch the site theme from the panel

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: README and final verification

**Files:**
- Modify: `README.md` (section "Identidad")

- [ ] **Step 1: Rewrite the "Identidad" section of `README.md`**

Replace everything from the `## Identidad` heading up to (not including) `## Correr en local` with:

```markdown
## Identidad

La web es un teléfono de los 2000: cuerpo de color, pantalla LCD, texto
pixelado en tinta, softkeys *Menu* y *Back*. En desktop se dibuja el celular
completo y el contenido scrollea dentro de la pantalla; en mobile el cuerpo
desaparece y el LCD ocupa el viewport entero — el celular del usuario es el
Nokia.

Hay dos pieles, **Clásico** (cuerpo azul, LCD lima) y **Halloween** (cuerpo
violeta, LCD calabaza, murciélago en la barra de estado, otro guion en el
inbox). Se eligen desde el Panel de `/admin` y el cambio alcanza al sitio,
los mails, la imagen del link compartido y el favicon. Sin elegir nada, el
sitio es Clásico. La fuente de verdad de hex y copy es `src/lib/theme.ts`;
`globals.css` repite los hex porque CSS no puede importarlos.

Los tokens llevan nombre de rol, no de color, porque cambian con el tema:

| Token | Clásico | Halloween | Uso |
| --- | --- | --- | --- |
| `culpa-lcd` | `#C9D92C` | `#F4841F` | pantalla LCD, fondo del contenido |
| `culpa-body` | `#2B3AD8` | `#5B2A86` | cuerpo del teléfono, botones, links |
| `culpa-ink` | `#0D0D0D` | `#0D0D0D` | texto pixelado, bordes |
| `culpa-cream` | `#F4E3D7` | `#EFE6CF` | texto sobre el cuerpo y sobre noche |
| `culpa-night` | `#080808` | `#070409` | fondo alrededor del celu |
| `culpa-yellow` | `#FFDE59` | `#FFDE59` | el amarillo del logo, destacados |
| `culpa-alert` | `#E23B2E` | `#A8101C` | errores, escaneo inválido |

El wordmark es la gráfica de la marca, no una fuente: vive en
`public/culpa-wordmark.png` (amarillo con extrusión negra, fondo transparente)
y se usa con el componente `Wordmark`, que se dimensiona por ancho. El keyline
negro es lo que lo hace legible contra cualquier LCD, así que no se recolorea
ni se le agrega sombra, y no cambia con el tema.

Dos voces tipográficas: **Silkscreen** (`font-pixel`) para datos, labels y
menús, y **Tahoma/Verdana** (`font-ui`) para párrafos y softkeys, como
mezclaban los teléfonos de la época. Las piezas reutilizables del LCD están en
`src/components/nokia/`.

El admin y el validador comparten paleta y tipografía pero no el marco del
teléfono: son herramientas, van sobre fondo noche con el LCD como acento.

```

Also, in the "Correr en local" section, add after the `npm run dev` line of the code block nothing, but add a line to the prose list below it: "Los tests unitarios corren con `npm test`."

- [ ] **Step 2: Full verification**

```bash
npm test && npm run lint && npx tsc --noEmit && npm run build
```

Expected: all green. `next build` must not try to reach the DB (no "Can't reach database" during "Generating static pages"); if it does, some route lost `force-dynamic`.

- [ ] **Step 3: Final visual pass in both themes**

`npm run dev`, log in, and for each theme (switch in `/admin`) check: `/`, `/event/<slug>` (the seed event), `/mensajes`, `/event/<slug>/checkout/success?free=true`, `/validator`, `/admin`, `/opengraph-image`, `/icon`. Leave the DB on `classic`. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Document the two themes and the admin switch

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-review notes

- Spec §1 → Task 3. §2 → Task 1 (`parseThemeName` moved from `theme-store` to `theme.ts` so it can be tested without loading Prisma; `theme-store` consumes it). §3 → Task 2. §4 → Tasks 4, 5, 6, 7. §5 → Task 8. §6 → Tasks 3, 8. §7 → Tasks 1, 5, 6 plus manual passes. §8 → Task 9.
- `LcdLoading` callers never pass `label` today, so the signature change is source-compatible.
- `buildMessages` gains a required second argument; its only caller (`mensajes/page.tsx`) is updated in the same task.
