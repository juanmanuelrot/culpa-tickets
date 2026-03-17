import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "F&F Tickets",
  description: "Solo para nosotros",
  openGraph: {
    title: "F&F Tickets",
    description: "Solo para nosotros",
    type: "website",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "F&F Tickets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "F&F Tickets",
    description: "Solo para nosotros",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "F&F Tickets",
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
    <html lang="es">
      <body className="antialiased min-h-screen bg-fyf-black text-fyf-white">
        {children}
      </body>
    </html>
  );
}
