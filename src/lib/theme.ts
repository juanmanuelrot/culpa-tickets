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
