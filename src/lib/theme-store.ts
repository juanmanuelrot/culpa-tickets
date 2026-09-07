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
