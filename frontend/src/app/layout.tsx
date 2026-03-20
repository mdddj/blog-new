import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfigApi } from "@/lib/api";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await siteConfigApi.getPublic();
    return {
      title: config.site_title || "Blog System",
      description: config.site_description || "A modern blog platform",
      keywords: config.site_keywords,
    };
  } catch (error) {
    console.error("Failed to fetch site config for metadata:", error);
    return {
      title: "Blog System",
      description: "A modern blog platform",
    };
  }
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head />
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
