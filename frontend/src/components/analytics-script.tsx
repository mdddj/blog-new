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

    const injectScript = () => {
      if (analyticsInjected) return;
      analyticsInjected = true;
      const container = document.createElement("div");
      container.innerHTML = config.analytics_code;

      for (const script of container.querySelectorAll("script")) {
        const newScript = document.createElement("script");
        newScript.defer = true;
        for (const attr of Array.from(script.attributes)) {
          newScript.setAttribute(attr.name, attr.value);
        }
        if (script.textContent) newScript.textContent = script.textContent;
        document.head.appendChild(newScript);
      }
    };

    const timer = window.setTimeout(injectScript, 10000);
    return () => window.clearTimeout(timer);
  }, [config.analytics_code, isLoading]);

  return null;
}
