import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTicketEmail(params: {
  to: string;
  eventName: string;
  ticketType: string;
  date: string;
  purchaserName: string;
  qrCodeBuffer: Buffer;
  validUntil?: string | null;
}) {
  const qrCodeBase64 = params.qrCodeBuffer.toString("base64");
  const qrCodeDataUrl = `data:image/png;base64,${qrCodeBase64}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#1a1a1a;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:500px;margin:0 auto;background-color:#B54545;padding:40px 30px;text-align:center;">
        <h1 style="color:#ffffff;font-size:36px;font-weight:bold;text-transform:uppercase;letter-spacing:4px;margin:0 0 10px 0;">
          F&F
        </h1>
        <p style="color:#ffffff;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin:0 0 30px 0;">
          Tu Ticket
        </p>

        <div style="background-color:#ffffff;border-radius:12px;padding:30px;margin:0 0 30px 0;">
          <img src="${qrCodeDataUrl}" alt="QR Code" style="width:250px;height:250px;display:block;margin:0 auto 20px auto;" />
          <p style="color:#333;font-size:12px;margin:0;">
            Presentá este código QR en la entrada
          </p>
        </div>

        <div style="text-align:left;color:#ffffff;padding:0 10px;">
          <p style="font-size:14px;margin:0 0 8px 0;">
            <strong style="text-transform:uppercase;letter-spacing:1px;">Evento:</strong> ${params.eventName}
          </p>
          <p style="font-size:14px;margin:0 0 8px 0;">
            <strong style="text-transform:uppercase;letter-spacing:1px;">Fecha:</strong> ${params.date}
          </p>
          <p style="font-size:14px;margin:0 0 8px 0;">
            <strong style="text-transform:uppercase;letter-spacing:1px;">Tipo:</strong> ${params.ticketType}
          </p>
          <p style="font-size:14px;margin:0 0 8px 0;">
            <strong style="text-transform:uppercase;letter-spacing:1px;">Nombre:</strong> ${params.purchaserName}
          </p>
          ${params.validUntil ? `
          <p style="font-size:14px;margin:16px 0 0 0;padding:12px;background-color:rgba(0,0,0,0.2);border-radius:6px;">
            <strong style="text-transform:uppercase;letter-spacing:1px;">&#9200; Válido Hasta:</strong> ${params.validUntil}
            <br/><span style="font-size:12px;opacity:0.8;">Este ticket no se puede usar después de esta hora.</span>
          </p>
          ` : ""}
        </div>

        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.3);margin:30px 0;" />

        <p style="color:rgba(255,255,255,0.7);font-size:11px;margin:0;text-transform:uppercase;letter-spacing:1px;">
          No compartas este código QR con nadie.
          <br/>Cada ticket solo se puede usar una vez.
        </p>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "FYF Tickets <tickets@yourdomain.com>",
    to: params.to,
    subject: `Tu ticket para ${params.eventName}`,
    html: htmlContent,
    attachments: [
      {
        filename: "qrcode.png",
        content: params.qrCodeBuffer,
      },
    ],
  });
}
