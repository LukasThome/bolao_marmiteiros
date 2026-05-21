import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolão dos Marmiteiros",
  description: "O bolão do grupo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
