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
