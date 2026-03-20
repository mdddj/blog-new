"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Moon,
  Sun,
  Search,
  Github,
  Twitter,
  Send,
  MessageCircle,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSiteConfig } from "@/contexts/site-config-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/archive", label: "归档" },
  { href: "/categories", label: "分类" },
  { href: "/tags", label: "标签" },
  { href: "/docs", label: "文档" },
  { href: "/projects", label: "项目" },
  { href: "/friends", label: "友链" },
];

function SocialIcons() {
  const { config } = useSiteConfig();

  return (
    <div className="flex items-center gap-2">
      {config.social_github && (
        <Link
          href={config.social_github}
          className="island-action-btn island-focus-ring"
          target="_blank"
          aria-label="GitHub"
        >
          <Github className="h-4 w-4" />
        </Link>
      )}
      {config.social_twitter && (
        <Link
          href={config.social_twitter}
          className="island-action-btn island-focus-ring"
          target="_blank"
          aria-label="Twitter"
        >
          <Twitter className="h-4 w-4" />
        </Link>
      )}
      {config.social_telegram && (
        <Link
          href={config.social_telegram}
          className="island-action-btn island-focus-ring"
          target="_blank"
          aria-label="Telegram"
        >
          <Send className="h-4 w-4" />
        </Link>
      )}
      {config.social_wechat_qrcode && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="island-action-btn island-focus-ring"
              aria-label="微信二维码"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <Image
              src={config.social_wechat_qrcode}
              alt="微信二维码"
              width={140}
              height={140}
              className="rounded-md"
            />
          </PopoverContent>
        </Popover>
      )}
      {config.social_qq_qrcode && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="island-action-btn island-focus-ring"
              aria-label="QQ二维码"
            >
              <span className="text-xs font-semibold">Q</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <Image
              src={config.social_qq_qrcode}
              alt="QQ二维码"
              width={140}
              height={140}
              className="rounded-md"
            />
          </PopoverContent>
        </Popover>
      )}
      {config.owner_email && (
        <Link
          href={`mailto:${config.owner_email}`}
          className="island-action-btn island-focus-ring"
          aria-label="Email"
        >
          <Mail className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function IslandHeader() {
  const { config } = useSiteConfig();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  return (
    <header className="island-header">
      <div className="island-container">
        <div className="island-header-row">
          <Link
            href="/"
            className="island-brand island-focus-ring"
            onClick={() => setMobileNavOpen(false)}
          >
            {config.site_title || "海岛博客"}
            <small>{config.site_subtitle || "Notes, essays, projects and field reports"}</small>
          </Link>

          <nav
            className={cn("island-nav", mobileNavOpen && "is-open")}
            aria-label="主导航"
            id="island-main-nav"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="island-nav-link island-focus-ring"
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() => setMobileNavOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="island-action-btn island-focus-ring"
              aria-label="搜索"
              onClick={() => setMobileNavOpen(false)}
            >
              <Search className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="island-action-btn island-focus-ring"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="切换主题"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
            <button
              type="button"
              className="island-action-btn island-mobile-nav-toggle island-focus-ring"
              onClick={() => setMobileNavOpen((value) => !value)}
              aria-controls="island-main-nav"
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? "收起导航菜单" : "展开导航菜单"}
            >
              {mobileNavOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function IslandFooter() {
  const { config } = useSiteConfig();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="island-footer">
      <div className="island-container island-footer-inner">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="grid gap-2 text-sm">
            <div className="font-[var(--is-font-title)] text-lg text-[var(--is-text)]">
              {config.site_title || "海岛博客"}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[var(--is-text-muted)]">
              <span>© {currentYear}</span>
              <span>{config.site_subtitle || "Editorial archive for ideas in motion"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[var(--is-text-muted)]">
              <span>由文章、项目、文档与友链共同组成</span>
            {config.icp_number && (
              <Link
                href="https://beian.miit.gov.cn/"
                target="_blank"
                className="island-link"
              >
                {config.icp_number}
              </Link>
            )}
            {config.police_number && (
              <Link
                href="http://www.beian.gov.cn/"
                target="_blank"
                className="island-link"
              >
                {config.police_number}
              </Link>
            )}
          </div>
          </div>

          <SocialIcons />
        </div>

        {config.footer_text && (
          <div
            className="text-sm text-[var(--is-text-muted)] [&_a]:text-[var(--is-primary)] [&_a]:underline-offset-2 [&_a:hover]:underline"
            dangerouslySetInnerHTML={{ __html: config.footer_text }}
          />
        )}
      </div>
    </footer>
  );
}
