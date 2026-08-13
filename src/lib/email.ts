import { Resend } from "resend";
import { formatDayDot, formatEventDateTime } from "@/lib/date";

const resend = new Resend(process.env.RESEND_API_KEY);

/*
 * Los mails repiten la pantalla del celular: marco azul, LCD lima, texto
 * tinta. Sin webfonts (ningún cliente de mail las garantiza): la voz pixelada
 * la hace Courier y los párrafos Tahoma, igual que en la web.
 */

const NIGHT = "#080808";
const BLUE = "#2b3ad8";
const LIME = "#c9d92c";
const INK = "#0d0d0d";
const CREAM = "#f4e3d7";

const PIXEL_FONT = '"Courier New", Courier, monospace';
const UI_FONT = "Tahoma, Verdana, Geneva, sans-serif";

/** La barra de estado del teléfono, arriba de la pantalla. */
function statusBar(): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="font-family:${PIXEL_FONT};font-size:11px;color:${INK};text-align:left;">
          .ıll &nbsp;&#9993;
        </td>
        <td style="font-family:${PIXEL_FONT};font-size:11px;color:${INK};text-align:right;">
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
function wordmark(appUrl: string, subtitle: string): string {
  return `
    <div style="background-color:${INK};padding:20px 16px;text-align:center;">
      <img src="${appUrl}/culpa-wordmark.png" alt="Culpa" width="220"
           style="width:220px;max-width:72%;height:auto;display:block;margin:0 auto;color:${CREAM};font-family:${UI_FONT};font-weight:bold;font-size:30px;" />
      <div style="font-family:${PIXEL_FONT};font-size:10px;letter-spacing:2px;color:${LIME};margin-top:12px;text-transform:uppercase;">
        ${subtitle}
      </div>
    </div>`;
}

/** Envuelve el contenido en el celular: fondo noche, cuerpo azul, LCD lima. */
function shell(inner: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:${NIGHT};font-family:${UI_FONT};">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${NIGHT};padding:24px 12px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:460px;background-color:${BLUE};border-radius:28px;padding:18px;">
              <tr>
                <td style="background-color:${LIME};border-radius:14px;padding:14px;">
                  ${statusBar()}
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

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  events: { name: string; date: Date; slug: string }[];
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const eventListHtml =
    params.events.length > 0
      ? params.events
          .map(
            (e) => `
          <a href="${appUrl}/event/${e.slug}" style="display:block;text-decoration:none;border:2px solid ${INK};padding:12px;margin:0 0 8px 0;">
            <span style="font-family:${PIXEL_FONT};font-size:12px;font-weight:bold;color:${INK};text-transform:uppercase;">
              ${formatDayDot(e.date)} &nbsp;&gt;&nbsp; ${e.name}
            </span>
            <br/>
            <span style="font-family:${UI_FONT};font-size:11px;color:${INK};opacity:0.7;">
              ${formatEventDateTime(e.date)}
            </span>
          </a>`
          )
          .join("")
      : `<p style="font-family:${UI_FONT};font-size:13px;color:${INK};opacity:0.7;margin:0;">
           Te avisamos cuando abramos la próxima fecha.
         </p>`;

  const inner = `
    ${wordmark(appUrl, "Reggaeton nostalgico")}

    <div style="padding:16px 4px 4px 4px;">
      <p style="font-family:${PIXEL_FONT};font-size:12px;color:${INK};margin:0 0 10px 0;text-transform:uppercase;">
        Hola ${params.name}
      </p>
      <p style="font-family:${UI_FONT};font-size:14px;color:${INK};margin:0;line-height:1.6;">
        Te agregamos a la lista de Culpa. Ya podés sacar tu entrada para estas fechas:
      </p>
    </div>

    <div style="padding:14px 4px;">
      ${eventListHtml}
    </div>

    <div style="padding:6px 4px 16px 4px;text-align:center;">
      <a href="${appUrl}" style="display:inline-block;background-color:${BLUE};color:${CREAM};border:2px solid ${INK};font-family:${PIXEL_FONT};font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;padding:14px 28px;text-decoration:none;">
        Ver fechas
      </a>
    </div>

    <div style="border-top:2px solid ${INK};opacity:0.5;margin:6px 4px;"></div>

    <p style="font-family:${PIXEL_FONT};font-size:10px;color:${INK};opacity:0.7;margin:10px 4px 4px 4px;text-transform:uppercase;text-align:center;">
      Cualquier duda, escribinos por Instagram
    </p>`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Culpa <tickets@yourdomain.com>",
    to: params.to,
    subject: "Estás en la lista de Culpa",
    html: shell(inner),
  });
}

export async function sendTicketEmail(params: {
  to: string;
  eventName: string;
  ticketType: string;
  date: string;
  purchaserName: string;
  qrCodeBuffer: Buffer;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qrCodeBase64 = params.qrCodeBuffer.toString("base64");
  const qrCodeDataUrl = `data:image/png;base64,${qrCodeBase64}`;

  const inner = `
    ${wordmark(appUrl, "Tu entrada")}

    <div style="background-color:#ffffff;border:2px solid ${INK};padding:20px;margin:14px 0;text-align:center;">
      <img src="${qrCodeDataUrl}" alt="Código QR de tu entrada" width="240" height="240" style="width:240px;height:240px;display:block;margin:0 auto 14px auto;image-rendering:pixelated;" />
      <p style="font-family:${PIXEL_FONT};font-size:11px;color:${INK};margin:0;text-transform:uppercase;">
        Mostra este QR en la puerta
      </p>
    </div>

    <div style="padding:0 4px;">
      <div style="font-family:${PIXEL_FONT};font-size:11px;color:${INK};text-transform:uppercase;line-height:2;">
        <div><span style="opacity:0.6;">Evento:</span> ${params.eventName}</div>
        <div><span style="opacity:0.6;">Fecha:</span> ${params.date}</div>
        <div><span style="opacity:0.6;">Tipo:</span> ${params.ticketType}</div>
        <div><span style="opacity:0.6;">Nombre:</span> ${params.purchaserName}</div>
      </div>
    </div>

    <div style="border-top:2px solid ${INK};opacity:0.5;margin:16px 4px;"></div>

    <p style="font-family:${PIXEL_FONT};font-size:10px;color:${INK};opacity:0.7;margin:0 4px 4px 4px;text-transform:uppercase;text-align:center;line-height:1.8;">
      No compartas este QR con nadie.<br/>Cada entrada se usa una sola vez.
    </p>`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Culpa <tickets@yourdomain.com>",
    to: params.to,
    subject: `Tu entrada para ${params.eventName}`,
    html: shell(inner),
    attachments: [
      {
        filename: "qrcode.png",
        content: params.qrCodeBuffer,
      },
    ],
  });
}
