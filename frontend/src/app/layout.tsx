import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfigApi } from "@/lib/api";
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  cleanText,
  jsonLdScript,
} from "@/lib/seo";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await siteConfigApi.getPublic();
    const siteTitle = config.site_title || SITE_NAME;
    const description = cleanText(
      config.blog_global_summary || config.site_description || config.site_subtitle || "技术实践与长期积累。",
    );

    return {
      metadataBase: new URL(SITE_URL),
      title: {
        default: siteTitle,
        template: `%s | ${siteTitle}`,
      },
      description,
      keywords: config.site_keywords || undefined,
      alternates: { canonical: SITE_URL },
      openGraph: {
        type: "website",
        url: SITE_URL,
        title: siteTitle,
        description,
        siteName: siteTitle,
        images: [{ url: DEFAULT_OG_IMAGE, alt: siteTitle }],
      },
      twitter: {
        card: "summary_large_image",
        title: siteTitle,
        description,
        images: [absoluteUrl("/og-default.svg")],
      },
      icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
      },
    };
  } catch (error) {
    console.error("Failed to fetch site config for metadata:", error);
    return {
      metadataBase: new URL(SITE_URL),
      title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`,
      },
      description: "记录 AI 工具链、Rust、UE5、Flutter 与 SwiftUI 的实战经验。",
      alternates: { canonical: SITE_URL },
      openGraph: {
        type: "website",
        url: SITE_URL,
        title: SITE_NAME,
        description: "记录 AI 工具链、Rust、UE5、Flutter 与 SwiftUI 的实战经验。",
        siteName: SITE_NAME,
        images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
      },
      twitter: {
        card: "summary_large_image",
        title: SITE_NAME,
        description: "记录 AI 工具链、Rust、UE5、Flutter 与 SwiftUI 的实战经验。",
        images: [DEFAULT_OG_IMAGE],
      },
      icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
      },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: "AI 工具链、Rust、UE5、Flutter 与 SwiftUI 的实战记录。",
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}#person`,
        name: SITE_NAME,
        url: SITE_URL,
      },
    ],
  };

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(siteJsonLd)} />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
