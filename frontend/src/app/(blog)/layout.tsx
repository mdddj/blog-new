import { PublicFooter, PublicHeader, BlogCursor } from "@/components/blog/public";
import { SiteConfigProvider } from "@/contexts/site-config-context";
import { AnalyticsScript } from "@/components/analytics-script";
import { siteConfigApi, type PublicSiteConfig } from "@/lib/api";
import "animal-island-ui/style";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialConfig: PublicSiteConfig | undefined;
  try {
    initialConfig = await siteConfigApi.getPublic();
  } catch (error) {
    console.error("Failed to fetch site config in blog layout:", error);
  }

  return (
    <SiteConfigProvider initialConfig={initialConfig}>
      <AnalyticsScript />
      <BlogCursor>
        <div className="min-h-dvh bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
          <a
            href="#public-main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-slate-950 focus:outline-2 focus:outline-slate-400 dark:focus:bg-slate-900 dark:focus:text-white"
          >
            跳到主内容
          </a>
          <PublicHeader />
          <div id="public-main-content" className="min-h-[calc(100dvh-13rem)]">
            {children}
          </div>
          <PublicFooter />
        </div>
      </BlogCursor>
    </SiteConfigProvider>
  );
}
