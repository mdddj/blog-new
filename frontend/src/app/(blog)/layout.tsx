import { Cursor } from "@/lib/animal-ui";
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
      <Cursor>
      <div className="min-h-dvh bg-[#f8f8f0] text-[#794f27]">
        <a
          href="#public-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[#f7f3df] focus:px-4 focus:py-2 focus:text-[#794f27] focus:outline-2 focus:outline-[#19c8b9]"
        >
          跳到主内容
        </a>
        <IslandHeader />
        <div id="public-main-content" className="min-h-[calc(100dvh-13rem)]">
          {children}
        </div>
        <IslandFooter />
      </div>
      </Cursor>
    </SiteConfigProvider>
  );
}
