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
