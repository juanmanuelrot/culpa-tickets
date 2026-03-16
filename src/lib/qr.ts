import QRCode from "qrcode";
import { SignJWT, jwtVerify } from "jose";

const QR_SECRET = new TextEncoder().encode(process.env.QR_SIGNING_SECRET!);

interface QRPayload {
  ticketId: string;
  qrCodeToken: string;
  eventId: string;
}

export async function createQRSignedToken(payload: QRPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(QR_SECRET);
}

export async function verifyQRToken(token: string): Promise<QRPayload | null> {
  try {
    const { payload } = await jwtVerify(token, QR_SECRET);
    return payload as unknown as QRPayload;
  } catch {
    return null;
  }
}

export async function generateQRCodeDataURL(
  signedJwt: string
): Promise<string> {
  return QRCode.toDataURL(signedJwt, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
