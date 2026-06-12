import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Bolão dos Marmiteiros",
  description: "O bolão do grupo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
