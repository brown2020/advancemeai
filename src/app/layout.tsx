import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { STORAGE_KEYS, THEMES } from "@/constants/appConstants";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | Advance.me",
    default: "Advance.me - Your Learning Platform",
  },
  description: "Advanced learning platform for test preparation and study",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Runs before React hydration; avoids theme flash.
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var key = ${JSON.stringify(STORAGE_KEYS.THEME)};
                  var theme = localStorage.getItem(key);
                  if (!theme) return;
                  theme = JSON.parse(theme);
                  var html = document.documentElement;
                  if (theme === ${JSON.stringify(THEMES.SYSTEM)}) {
                    html.removeAttribute('data-theme');
                    return;
                  }
                  html.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-svh">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
