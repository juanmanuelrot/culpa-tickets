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
