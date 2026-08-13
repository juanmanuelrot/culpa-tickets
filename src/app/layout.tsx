import type { Metadata } from "next";
import { Silkscreen } from "next/font/google";
import "./globals.css";

// La voz de la interfaz: pixelada, como el bitmap de un teléfono viejo.
const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-silkscreen",
  display: "swap",
});

// El wordmark no es una fuente: es la gráfica de la marca, en
// public/culpa-wordmark.png.

const TITLE = "Culpa";
const DESCRIPTION = "Reggaeton nostalgico";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={silkscreen.variable}>
      <body className="antialiased min-h-screen bg-culpa-night text-culpa-cream">
        {children}
      </body>
    </html>
  );
}
