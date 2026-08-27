import { PublicFooter, PublicHeader, BlogCursor } from "@/components/blog/public";
import { SiteConfigProvider } from "@/contexts/site-config-context";
import { AnalyticsScript } from "@/components/analytics-script";
import { PageMotion } from "@/components/page-motion";
import { siteConfigApi, type PublicSiteConfig } from "@/lib/api";
import "animal-island-ui/style";

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
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
        <div className="min-h-dvh bg-[var(--animal-bg-color)] font-[var(--animal-font-family)] text-[var(--animal-text-color)]">
          <a
            href="#public-main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--animal-bg-color-secondary)] focus:px-4 focus:py-2 focus:text-[var(--animal-text-color)] focus:outline-2 focus:outline-[var(--animal-focus-yellow)]"
          >
            跳到主内容
          </a>
          <PublicHeader />
          <div id="public-main-content" className="min-h-[calc(100dvh-13rem)]">
            <PageMotion>{children}</PageMotion>
          </div>
          <PublicFooter />
        </div>
      </BlogCursor>
    </SiteConfigProvider>
  );
}
