"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { siteConfigApi, type PublicSiteConfig } from "@/lib/api";
import { Loader2 } from "lucide-react";

const defaultConfig: PublicSiteConfig = {
    site_title: "",
    site_subtitle: "",
    site_description: "",
    site_keywords: "",
    owner_name: "",
    owner_avatar: "",
    owner_bio: "",
    owner_email: "",
    social_github: "",
    social_twitter: "",
    social_weibo: "",
    social_zhihu: "",
    social_telegram: "",
    social_qq_qrcode: "",
    social_wechat_qrcode: "",
    icp_number: "",
    police_number: "",
    footer_text: "",
    analytics_code: "",
};

interface SiteConfigContextType {
    config: PublicSiteConfig;
    isLoading: boolean;
}

const SiteConfigContext = createContext<SiteConfigContextType>({
    config: defaultConfig,
    isLoading: true,
});

// 全局 Loading 组件
function GlobalLoading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--cf-bg)">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-(--cf-cyan)" />
                <div className="text-(--cf-text-muted) text-sm font-mono">
                    INITIALIZING_SYSTEM...
                </div>
            </div>
        </div>
    );
}

export function SiteConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<PublicSiteConfig>(defaultConfig);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await siteConfigApi.getPublic();
                setConfig(data);
            } catch (error) {
                console.error("Failed to fetch site config:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, []);

    // 显示全局 loading 直到配置加载完成
    if (isLoading) {
        return <GlobalLoading />;
    }

    return (
        <SiteConfigContext.Provider value={{ config, isLoading }}>
            {children}
        </SiteConfigContext.Provider>
    );
}

export function useSiteConfig() {
    return useContext(SiteConfigContext);
}
