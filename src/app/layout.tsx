import type { Metadata } from "next";
import "./globals.css";
import { AudioProvider } from "@/context/AudioContext";
import { AmbientBackground } from "@/components/AmbientBackground";

export const metadata: Metadata = {
  title: "TERRASSES — Espace Audio & Dramaturgie",
  description: "Plateforme d'écoute, d'organisation et de validation sonore pour la pièce 'TERRASSES' de Laurent Gaudé.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen relative antialiased selection:bg-blue-500/20 selection:text-blue-900 dark:selection:text-blue-200">
        <AudioProvider>
          <AmbientBackground />
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
