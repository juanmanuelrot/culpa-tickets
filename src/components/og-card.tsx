/*
 * La tarjeta que se ve cuando alguien comparte el link: el celular de Culpa,
 * pantalla lima con la marca adentro.
 *
 * Ojo: esto lo renderiza Satori (next/og), que solo dibuja con las fuentes que
 * se le pasan. Como no cargamos ninguna, el texto va en la fuente por defecto
 * y en tinta sobre lima, el par de mayor contraste de la paleta. El logo entra
 * como imagen, así que no depende de fuentes.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const NIGHT = "#080808";
const BLUE = "#2b3ad8";
const LIME = "#c9d92c";
const INK = "#0d0d0d";

export function OgCard({ wordmarkSrc }: { wordmarkSrc: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: NIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Cuerpo del teléfono */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: BLUE,
          borderRadius: 56,
          padding: 36,
        }}
      >
        {/* Pantalla */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 760,
            height: 470,
            background: LIME,
            borderRadius: 28,
            padding: "24px 32px",
          }}
        >
          {/* Barra de estado. Señal y batería van dibujadas con divs: los
              glifos ▭ y ▮ no existen en la fuente por defecto de Satori y
              saldrían como cajas vacías. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: INK,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
              {[10, 17, 24, 31].map((h) => (
                <div
                  key={h}
                  style={{ display: "flex", width: 7, height: h, background: INK }}
                />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", fontSize: 26 }}>11:11</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  border: `3px solid ${INK}`,
                  padding: 4,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{ display: "flex", width: 7, height: 18, background: INK }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Marca */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori
                solo entiende <img>, no next/image */}
            <img src={wordmarkSrc} alt="Culpa" width={600} height={213} />
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: INK,
                letterSpacing: "0.28em",
                marginTop: 14,
              }}
            >
              REGGAETON NOSTALGICO
            </div>
          </div>

          {/* Softkeys */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: `3px solid ${INK}`,
              paddingTop: 16,
              fontSize: 30,
              fontWeight: 700,
              color: INK,
            }}
          >
            <div style={{ display: "flex" }}>Menu</div>
            <div style={{ display: "flex" }}>Back</div>
          </div>
        </div>
      </div>
    </div>
  );
}
