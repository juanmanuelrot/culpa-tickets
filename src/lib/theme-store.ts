import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { DEFAULT_THEME, parseThemeName, type ThemeName } from "@/lib/theme";

/*
 * El tema vigente vive en una fila de Setting. Sin fila, o con la DB caída,
 * el sitio se ve clásico: leer el tema nunca puede tirar el layout.
 *
 * Lo lee cada render, así que se cachea: setSiteTheme lo invalida al toque en
 * esta instancia, y el revalidate cubre a las demás si hay más de una.
 */

const THEME_KEY = "theme";
const THEME_TAG = "site-theme";

// Solo el valor crudo se cachea; un error de DB tira y no queda guardado.
const readStoredTheme = unstable_cache(
  async () => {
    const row = await prisma.setting.findUnique({ where: { key: THEME_KEY } });
    return row?.value ?? null;
  },
  [THEME_TAG],
  { tags: [THEME_TAG], revalidate: 60 }
);

export async function getSiteTheme(): Promise<ThemeName> {
  try {
    return parseThemeName(await readStoredTheme());
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
  revalidateTag(THEME_TAG, { expire: 0 });
}
