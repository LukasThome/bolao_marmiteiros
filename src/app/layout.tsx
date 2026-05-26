import type { Metadata } from "next";
import "./globals.css";
import BetaBanner from "@/components/BetaBanner";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Bolão dos Marmiteiros",
  description: "O bolão do grupo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <BetaBanner />
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
