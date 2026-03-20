"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { siteConfigApi, type PublicSiteConfig } from "@/lib/api";

export const defaultConfig: PublicSiteConfig = {
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
    isLoading: false,
});

export function SiteConfigProvider({
    children,
    initialConfig,
}: {
    children: ReactNode;
    initialConfig?: PublicSiteConfig;
}) {
    const [config, setConfig] = useState<PublicSiteConfig>(initialConfig || defaultConfig);
    const [isLoading, setIsLoading] = useState(!initialConfig);

    useEffect(() => {
        if (initialConfig) {
            setIsLoading(false);
            return;
        }

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
    }, [initialConfig]);

    return (
        <SiteConfigContext.Provider value={{ config, isLoading }}>
            {children}
        </SiteConfigContext.Provider>
    );
}

export function useSiteConfig() {
    return useContext(SiteConfigContext);
}
