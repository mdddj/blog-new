"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button, Card, Divider, Footer, Icon, Switch } from "@/lib/animal-ui";
import { useSiteConfig } from "@/contexts/site-config-context";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/archive", label: "归档" },
  { href: "/categories", label: "分类" },
  { href: "/tags", label: "标签" },
  { href: "/docs", label: "文档" },
  { href: "/projects", label: "项目" },
  { href: "/friends", label: "友链" },
];

function useActivePath() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <span className="inline-block h-6 w-11" aria-hidden="true" />;
  }

  return (
    <Switch
      size="small"
      checked={resolvedTheme === "dark"}
      onChange={(checked) => setTheme(checked ? "dark" : "light")}
    />
  );
}

export function IslandHeader() {
  const router = useRouter();
  const { config } = useSiteConfig();
  const isActive = useActivePath();

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8dcc8] bg-[#f8f8f0]/95 backdrop-blur">
      <div className="mx-auto flex w-[min(1180px,calc(100vw-2rem))] flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-left"
            aria-label="返回首页"
          >
            <Card type="title">
              <span className="inline-flex items-center gap-2 text-lg font-black">
                <Icon name="icon-critterpedia" size={24} bounce />
                {config.site_title || "典典博客"}
              </span>
            </Card>
          </button>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" aria-label="主导航">
          {NAV_LINKS.map((item) => (
            <Button
              key={item.href}
              type={isActive(item.href) ? "primary" : "default"}
              size="small"
              onClick={() => router.push(item.href)}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="dashed"
            size="small"
            icon={<Icon name="icon-camera" size={18} />}
            onClick={() => router.push("/search")}
          >
            搜索
          </Button>
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            夜间
            <ThemeSwitch />
          </span>
        </div>
      </div>
      <Divider type="line-yellow" />
    </header>
  );
}

export function IslandFooter() {
  const { config } = useSiteConfig();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-10">
      <div className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-4 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <Card>
          <div className="grid gap-3">
            <div className="text-xl font-black">{config.site_title || "典典博客"}</div>
            <p className="max-w-3xl leading-7">
              {config.footer_text ||
                config.site_subtitle ||
                "文章、项目、文档与友链共同组成的动森风格阅读岛。"}
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span>© {currentYear}</span>
              {config.icp_number ? (
                <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
                  {config.icp_number}
                </a>
              ) : null}
              {config.police_number ? (
                <a href="http://www.beian.gov.cn/" target="_blank" rel="noreferrer">
                  {config.police_number}
                </a>
              ) : null}
            </div>
          </div>
        </Card>

        <Card color="app-teal">
          <div className="flex flex-wrap items-center gap-2">
            {config.owner_avatar ? (
              <Image
                src={config.owner_avatar}
                alt={config.owner_name || "作者头像"}
                width={44}
                height={44}
                className="rounded-full object-cover"
              />
            ) : (
              <Icon name="icon-critterpedia" size={44} bounce />
            )}
            <div>
              <div className="font-black">{config.owner_name || "作者"}</div>
              <div className="text-sm">{config.owner_email || "欢迎来访"}</div>
            </div>
          </div>
        </Card>
      </div>
      <Footer type="sea" />
    </footer>
  );
}
