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
