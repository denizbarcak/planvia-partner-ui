import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PlanVia - Modern Rezervasyon ve İşletme Yönetim Platformu",
  description:
    "İşletmenizi dijitalleştirin, rezervasyonlarınızı kolayca yönetin. PlanVia ile modern çözümler.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
