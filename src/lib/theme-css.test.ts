import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THEMES } from "@/lib/theme";

// globals.css repite a mano los hex de theme.ts porque CSS no puede
// importarlos (ver el comentario del archivo). Este test evita que se
// desincronicen: si cambiás un color en un lado y te olvidás del otro, algo
// tiene que fallar acá.

const css = readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf-8"
);

// Mapeo de nombre de variable CSS a clave de ThemePalette.
const cssVarToKey: Record<string, string> = {
  lcd: "lcd",
  "lcd-dark": "lcdDark",
  body: "body",
  "body-dark": "bodyDark",
  ink: "ink",
  cream: "cream",
  night: "night",
  yellow: "yellow",
  alert: "alert",
};

function extractBlock(selector: string): Record<string, string> {
  const match = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`No se encontró el bloque ${selector} en globals.css`);
  const vars: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const decl = line.match(/--culpa-([a-z-]+):\s*(#[0-9a-fA-F]+);/);
    if (decl) vars[cssVarToKey[decl[1]]] = decl[2];
  }
  return vars;
}

const classicBlock = extractBlock(":root");
const halloweenBlock = extractBlock(':root\\[data-theme="halloween"\\]');

describe("hex duplicados entre globals.css y theme.ts", () => {
  it("el bloque :root coincide con la paleta clásica", () => {
    for (const [key, value] of Object.entries(classicBlock)) {
      expect(THEMES.classic.palette[key as keyof typeof THEMES.classic.palette]).toBe(value);
    }
  });

  it("el bloque halloween coincide con la paleta de halloween", () => {
    for (const [key, value] of Object.entries(halloweenBlock)) {
      expect(THEMES.halloween.palette[key as keyof typeof THEMES.halloween.palette]).toBe(value);
    }
  });

  it("toda clave que cambia entre temas está pisada en el bloque halloween", () => {
    for (const key of Object.keys(THEMES.classic.palette) as (keyof typeof THEMES.classic.palette)[]) {
      if (THEMES.classic.palette[key] !== THEMES.halloween.palette[key]) {
        expect(halloweenBlock).toHaveProperty(key);
      }
    }
  });
});
