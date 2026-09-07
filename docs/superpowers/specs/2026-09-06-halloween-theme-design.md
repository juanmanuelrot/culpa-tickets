# Tema Halloween con switch en el admin

**Fecha:** 2026-09-06
**Estado:** Diseño aprobado

## Problema

La próxima edición de Culpa es de Halloween. El sitio tiene que cambiar de
temática (paleta, detalles gráficos y copy) manteniendo el look retro de
celular de los 2000 que ya define la marca. El cambio tiene que poder
prenderse y apagarse desde el admin, sin deploy: hoy todo el color está
fijo en 9 tokens de `globals.css` y en hex hardcodeados en el mail, la
OG card y los favicons, y el copy está inline en las pantallas.

## Objetivos

- Dos temas, `classic` y `halloween`, elegibles desde el Panel del admin.
- El tema vigente se aplica a: sitio público (home, evento, mensajes,
  invitación, éxito), admin, validador, mails, imagen OG/Twitter y favicon.
- Mismo lenguaje visual: cuerpo de celu, LCD, texto pixelado, softkeys,
  bordes duros, cero gradientes. Cambia la piel y el guion, no la
  estructura.
- Sin fila de configuración en la DB el sitio se ve exactamente como hoy.

## No objetivos

- No hay tema por evento. El tema es global.
- No cambia el wordmark (`public/culpa-wordmark.png`): sigue amarillo con
  keyline negro, apoyado en ese keyline para leerse sobre cualquier LCD.
- No se tocan tipografías, keypad, cursor `>` ni la navegación del menú.
- No se agrega un editor de temas: los dos temas son código.

## Diseño

### 1. Persistencia — modelo `Setting`

```prisma
model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

Migración `prisma/migrations/20260906_add_setting/`. Una sola fila usa
esta tabla por ahora: `key = "theme"`, `value = "classic" | "halloween"`.

`src/lib/theme-store.ts` (server only):

- `getSiteTheme(): Promise<ThemeName>` — lee la fila `theme`. Si no
  existe, si el valor no es un `ThemeName` válido o si la consulta falla,
  devuelve `"classic"`. Nunca lanza: un problema de DB no puede tirar el
  layout de todo el sitio.
- `setSiteTheme(name: ThemeName): Promise<void>` — upsert.
- `parseThemeName(value: unknown): ThemeName` — la validación pura,
  separada para testearla sin DB.

### 2. Definición de los temas — `src/lib/theme.ts`

Data pura, sin imports de Prisma ni de React, importable desde server y
client.

```ts
export type ThemeName = "classic" | "halloween";
export const THEME_NAMES: ThemeName[] = ["classic", "halloween"];

export interface ThemePalette {
  lcd: string; lcdDark: string;
  body: string; bodyDark: string;
  ink: string; cream: string; night: string; yellow: string; alert: string;
}

/* Tinta premezclada sobre el LCD, para el mail (ver email.ts: el alpha se
   rompe fuera del navegador). */
export interface ThemeEmailInks { soft: string; muted: string; rule: string }

export interface ThemeCopy {
  tagline: string;          // debajo del wordmark en la home
  ogSubtitle: string;       // en la OG card, mayúsculas
  welcomeSubtitle: string;  // subtítulo del wordmark en el mail de bienvenida
  steps: { n: string; title: string; body: string }[];
  emptyDates: string;       // sin fechas abiertas
  loadingLabel: string;     // LcdLoading por defecto
  footerBrand: string;      // "CULPA · MVD"
  messages: { from: string; time: string; body: string }[];
}

export interface Theme {
  name: ThemeName;
  label: string;            // "Clásico" / "Halloween", para el switch
  palette: ThemePalette;
  emailInks: ThemeEmailInks;
  copy: ThemeCopy;
}

export const THEMES: Record<ThemeName, Theme>;
export const DEFAULT_THEME: ThemeName = "classic";
```

#### Paletas

| Token | Clásico | Halloween |
| --- | --- | --- |
| lcd | `#c9d92c` | `#f4841f` |
| lcdDark | `#a3b01f` | `#c96412` |
| body | `#2b3ad8` | `#5b2a86` |
| bodyDark | `#1d2795` | `#3a1758` |
| ink | `#0d0d0d` | `#0d0d0d` |
| cream | `#f4e3d7` | `#efe6cf` |
| night | `#080808` | `#070409` |
| yellow | `#ffde59` | `#ffde59` |
| alert | `#e23b2e` | `#a8101c` |

Tintas del mail, tinta al 70 / 60 / 50 % mezclada sobre el LCD de cada
tema y escrita como hex fijo:

| | soft (70 %) | muted (60 %) | rule (50 %) |
| --- | --- | --- | --- |
| Clásico | `#454a16` | `#585f19` | `#6b731c` |
| Halloween | `#523112` | `#693d14` | `#804816` |

#### Copy

Clásico: el copy que está hoy inline en `page.tsx`, `messages.ts`,
`og-card.tsx`, `email.ts` y `ui.tsx`, movido tal cual.

Halloween:

- `tagline`: "reggaeton de ultratumba"
- `ogSubtitle`: "REGGAETON DE ULTRATUMBA"
- `welcomeSubtitle`: "Reggaeton de ultratumba"
- `steps`:
  - 01 "Elegi tu entrada" — "Mirá las fechas, elegí el tipo de entrada y
    listo. No hay lista ni invitación: entra cualquiera, con o sin
    disfraz."
  - 02 "Paga y confirma" — "Checkout seguro con MercadoPago. Si la
    entrada es gratis, la reclamás y ya. Sin truco."
  - 03 "Te llega el QR" — "Recibís tu código por mail. Mostralo en la
    puerta. Dulce o truco, entrás igual."
- `emptyDates`: "No hay fechas abiertas ahora. Volvé antes de medianoche."
- `loadingLabel`: "Invocando"
- `footerBrand`: "CULPA · NOCHE DE BRUJAS"
- `messages` (mismas horas que el clásico; MATI y NICO ceden su lugar a
  dos personajes de terror):
  - SOFI 21:04 — "ya tengo el disfraz, vos?? no me dejes sola eh"
  - FREDDY K. 20:51 — "uno, dos, culpa viene por vos. {dia} no te duermas
    que te lo perdés"
  - GHOSTFACE 19:32 — "hola. que estas haciendo {dia}? ... no cortes. vas
    a culpa o te cuelgo yo?"
  - MAMA 18:10 — "hija a que hora volves? no comas tantos caramelos"
  - CULPA 17:00 — "quedan pocas. despues no digas que no te asustamos."

El mail de entrada mantiene "Tu entrada" como subtítulo en ambos temas.

### 3. Tokens CSS renombrados por rol

`culpa-lime` pintando naranja miente. Se renombran los tokens que
dependen del tema:

| Antes | Después |
| --- | --- |
| `culpa-lime` | `culpa-lcd` |
| `culpa-lime-dark` | `culpa-lcd-dark` |
| `culpa-blue` | `culpa-body` |
| `culpa-blue-dark` | `culpa-body-dark` |

`ink`, `cream`, `night`, `yellow`, `alert` conservan el nombre. El
renombre es un reemplazo mecánico en `src/**` (23 archivos) y en el
README, incluyendo las variables `--culpa-lime`, `--culpa-blue` y las
clases del mail (`.culpa-lcd` ya existe ahí; `.culpa-blue` pasa a
`.culpa-body`, `.culpa-lime-text` a `.culpa-lcd-text`).

En `globals.css`:

- `:root` define las variables con la paleta clásica.
- `[data-theme="halloween"]` redefine las mismas variables con la paleta
  Halloween. `@theme inline` no cambia: las clases de Tailwind siguen
  apuntando a las variables, así el swap es automático.
- Los `rgba(201, 217, 44, …)` de `pulse-lime` y los `rgba(13,13,13,…)`
  de la textura pasan a `color-mix(in srgb, var(--culpa-lcd) 45%,
  transparent)` y equivalentes, para seguir al tema. `pulse-lime` se
  renombra `pulse-lcd`.
- Bajo `[data-theme="halloween"]` la viñeta del `.lcd-texture` es más
  cálida y un poco más cerrada (sombra interior de tinta al 0.32 en vez
  de 0.22).

Los hex de los dos temas viven **solo** en `theme.ts`; `globals.css`
los repite porque CSS no puede importarlos, con un comentario que remita
a `theme.ts` como fuente de verdad.

### 4. Aplicación en runtime

**Root layout** (`src/app/layout.tsx`, server component):

- `export const dynamic = "force-dynamic"` para que ninguna ruta se
  prerenderice en build sin DB.
- `const theme = await getSiteTheme()`.
- `<html lang="es" data-theme={theme} …>`.
- Envuelve `children` en `<ThemeProvider theme={THEMES[theme]}>`.
- `metadata` pasa a `generateMetadata()` que usa `copy.tagline` como
  `description`.

**ThemeProvider / useTheme** (`src/components/theme-provider.tsx`,
client): un `createContext<Theme>` con `THEMES.classic` por defecto y un
hook `useTheme()`. Las páginas cliente leen copy de ahí:

- `page.tsx`: tagline, pasos, vacío, pie.
- `mensajes/page.tsx`: `buildMessages(dayDot, theme.copy.messages)`.
- `ui.tsx` `LcdLoading`: `label` por defecto = `copy.loadingLabel`.
- `phone-shell.tsx` `StatusBar`: con `halloween` el sobre se reemplaza por
  un murciélago pixelado (SVG de rects, 14×10, mismo `currentColor`).

`messages.ts`: `buildMessages(dayDot, script)` recibe el guion; deja de
tener el `SCRIPT` propio.

**OG y Twitter** (`opengraph-image.tsx`, `twitter-image.tsx`): agregan
`dynamic = "force-dynamic"`, leen `getSiteTheme()` y pasan `theme` a
`OgCard`, que toma `palette` y `copy.ogSubtitle` del tema en lugar de las
constantes.

**Favicon**: `icon.svg` y `apple-icon.svg` se reemplazan por `icon.tsx` y
`apple-icon.tsx` con `ImageResponse`, `dynamic = "force-dynamic"`, que
dibujan el mismo ícono (cuerpo redondeado, LCD, "c" itálica en tinta) con
la paleta del tema.

**Mails** (`email.ts`): `buildWelcomeEmail(params, theme = THEMES.classic)`
y `buildTicketEmail(params, theme = THEMES.classic)` toman paleta,
`emailInks` y `welcomeSubtitle` del tema. `sendWelcomeEmail` y
`sendTicketEmail` hacen `THEMES[await getSiteTheme()]` antes de armar el
HTML. Las constantes de color del módulo desaparecen salvo `PAPER`.

**Admin y validador**: usan tokens, así que cambian solos. El `router.
refresh()` tras guardar el switch re-renderiza el root layout y el admin
cambia de piel al instante.

### 5. Switch en el admin

- `GET /api/admin/settings/theme` → `{ theme: ThemeName }`.
- `PUT /api/admin/settings/theme` con body `{ theme }`; valida con
  `parseThemeName` (400 si no es válido), `requireAdmin` (403), responde
  `{ theme }`.
- En `src/app/admin/page.tsx`, debajo de las cards de métricas, una
  sección "Tema del sitio" con un botón por tema (`THEME_NAMES` con su
  `label`), el vigente resaltado en `bg-culpa-lcd text-culpa-ink` y los
  demás en `bg-culpa-body-dark text-culpa-cream`. Al elegir: `PUT`,
  estado de guardado, `router.refresh()`. Un texto chico aclara que
  cambia el sitio público, los mails y el link compartido.

### 6. Manejo de errores

- DB caída o sin fila → `classic`, silencioso (log en server).
- `PUT` con valor desconocido → 400 con `{ error }`.
- Si el `PUT` falla en el admin, el botón vuelve al estado anterior y se
  muestra el error inline, siguiendo el patrón de las otras pantallas.

### 7. Testing

El repo no tiene test runner. Se agrega `vitest` como dev dependency con
`npm test`, para los módulos puros:

- `theme.test.ts`: cada tema tiene todas las claves de `ThemePalette` y
  de `ThemeCopy`; los `messages` de ambos temas tienen los mismos `from`
  y `time`.
- `theme-store.test.ts`: `parseThemeName` acepta los dos nombres y cae a
  `classic` con `undefined`, `""`, `"xmas"`.
- `messages.test.ts`: `buildMessages` reemplaza `{dia}` y usa "el finde"
  sin fecha, con el guion de cada tema.
- `email.test.ts`: `buildTicketEmail(…, THEMES.halloween)` contiene
  `#f4841f` y `#5b2a86` y no contiene `#c9d92c` ni `#2b3ad8`; con el
  default es al revés.

Verificación manual con `npm run dev` en ambos temas: `/`, `/event/…`,
`/mensajes`, `/validator`, `/admin`, `/opengraph-image`, `/icon`, y el
HTML de los dos mails inspeccionado con los builders. `npm run lint` y
`npm run build` limpios.

### 8. Documentación

README: sección "Identidad" pasa a describir los dos temas con la tabla
de tokens renombrados y el switch en `/admin`. Se nota que `theme.ts` es
la fuente de verdad de hex y copy.

## Archivos

Nuevos: `prisma/migrations/20260906_add_setting/migration.sql`,
`src/lib/theme.ts`, `src/lib/theme-store.ts`,
`src/components/theme-provider.tsx`,
`src/app/api/admin/settings/theme/route.ts`,
`src/app/icon.tsx`, `src/app/apple-icon.tsx`, tests, `vitest.config.ts`.

Modificados: `prisma/schema.prisma`, `src/app/globals.css`,
`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/mensajes/page.tsx`,
`src/app/admin/page.tsx`, `src/app/opengraph-image.tsx`,
`src/app/twitter-image.tsx`, `src/components/og-card.tsx`,
`src/components/nokia/{phone-shell,ui,menu-list}.tsx`, `src/lib/email.ts`,
`src/lib/messages.ts`, README, y los 23 archivos del renombre de tokens.

Eliminados: `src/app/icon.svg`, `src/app/apple-icon.svg`.
