import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Toaster } from "@/components/ui/sonner";
import { VersionDisplay } from "@/components/VersionDisplay";
import { ThemeProvider } from "@/components/theme-provider";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "MaintenanceApp",
  description: "Track your assets and maintenance schedules",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MaintenanceApp",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  let themeLight = "default";
  let themeDark = "default";

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    });
    if (user?.preferences) {
      try {
        const prefs = JSON.parse(user.preferences);
        if (prefs.themeLight) themeLight = prefs.themeLight;
        if (prefs.themeDark) themeDark = prefs.themeDark;
      } catch (e) {}
    }
  }

  return (
    <html lang="en" suppressHydrationWarning data-light-theme={themeLight} data-dark-theme={themeDark}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
          <VersionDisplay />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
