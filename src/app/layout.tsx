import type { Metadata } from "next";
import { Silkscreen } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { THEMES } from "@/lib/theme";
import { getSiteTheme } from "@/lib/theme-store";
import "./globals.css";

// El tema sale de la DB en cada request, así que nada se prerenderiza en el
// build (que corre sin base de datos).
export const dynamic = "force-dynamic";

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

export async function generateMetadata(): Promise<Metadata> {
  const theme = THEMES[await getSiteTheme()];
  const description = theme.copy.tagline;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ),
    title: TITLE,
    description,
    openGraph: {
      title: TITLE,
      description,
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
      description,
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeName = await getSiteTheme();

  return (
    <html lang="es" data-theme={themeName} className={silkscreen.variable}>
      {/* dvh y no vh: en mobile el 100vh incluye la barra del navegador, y el
          sobrante quedaba como una franja negra scrolleable bajo la pantalla. */}
      <body className="antialiased min-h-[100dvh] bg-culpa-night text-culpa-cream">
        <ThemeProvider theme={THEMES[themeName]}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
