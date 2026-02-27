import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { AuthProvider } from "@/lib/auth-context";
import { GradientBackground } from "@/components/shared/GradientBackground";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Echoes | Design & Thinking",
  description:
    "探索极简主义设计、前端技术与数字生活的交汇点。记录灵感，分享知识，保持思考。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased font-sans bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text`}
      >
        <ThemeScript />
        <GradientBackground />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
