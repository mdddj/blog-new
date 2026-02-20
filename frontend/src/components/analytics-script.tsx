"use client";

import { useSiteConfig } from "@/contexts/site-config-context";
import { useEffect } from "react";

let analyticsInjected = false;

export function AnalyticsScript() {
    const { config, isLoading } = useSiteConfig();

    useEffect(() => {
        if (isLoading || !config.analytics_code || analyticsInjected) {
            return;
        }

        analyticsInjected = true;

        const injectScript = () => {
            const container = document.createElement("div");
            container.innerHTML = config.analytics_code;

            const scripts = container.querySelectorAll("script");
            scripts.forEach((script) => {
                const newScript = document.createElement("script");
                newScript.defer = true;

                Array.from(script.attributes).forEach((attr) => {
                    newScript.setAttribute(attr.name, attr.value);
                });

                if (script.textContent) {
                    newScript.textContent = script.textContent;
                }

                document.head.appendChild(newScript);
            });
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(injectScript);
        } else {
            setTimeout(injectScript, 200);
        }
    }, [config.analytics_code, isLoading]);

    return null;
}
