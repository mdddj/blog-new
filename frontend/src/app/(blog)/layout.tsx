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
                <div className="island-wave" />
                <IslandHeader />
                <div className="flex-1">{children}</div>
                <IslandFooter />
            </div>
        </SiteConfigProvider>
    );
}
