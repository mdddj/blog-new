import "@/app/island.css";
import { IslandHeader, IslandFooter } from "@/components/blog/island";
import { SiteConfigProvider } from "@/contexts/site-config-context";
import { AnalyticsScript } from "@/components/analytics-script";
import { siteConfigApi, type PublicSiteConfig } from "@/lib/api";

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
      <div className="island-root island-shell">
        <a
          href="#island-main-content"
          className="island-skip-link island-focus-ring"
        >
          跳到主内容
        </a>
        <div className="island-wave" />
        <IslandHeader />
        <div id="island-main-content" className="flex-1">
          {children}
        </div>
        <IslandFooter />
      </div>
    </SiteConfigProvider>
  );
}
