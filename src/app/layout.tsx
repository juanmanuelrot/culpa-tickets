import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F&F Tickets",
  description: "Solo para nosotros",
  openGraph: {
    title: "F&F Tickets",
    description: "Solo para nosotros",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "F&F Tickets",
    description: "Solo para nosotros",
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
