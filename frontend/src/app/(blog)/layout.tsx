import "@/app/cassette.css";
import { CassetteHeader } from "@/components/blog/cassette/cassette-header";
import { CassetteFooter } from "@/components/blog/cassette/cassette-footer";
import { CassetteBackground } from "@/components/blog/cassette/cassette-background";
import { SiteConfigProvider } from "@/contexts/site-config-context";
import { AnalyticsScript } from "@/components/analytics-script";

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SiteConfigProvider>
            <AnalyticsScript />
            <div className="cassette-theme flex flex-col min-h-screen">
                <CassetteBackground />
                <CassetteHeader />
                <div className="flex-1 cf-main">{children}</div>
                <CassetteFooter />
            </div>
        </SiteConfigProvider>
    );
}
