"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  MessageCircle,
  Search,
} from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  HOME_PAGE_SIZE,
  HOME_PAGE_SIZE_OPTIONS,
  createPaginationHref,
  parsePageParam,
  parsePageSizeParam,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/site-config-context";
import { blogApi, categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { Pagination } from "@/components/blog/pagination";
import {
  Cursor,
  Card as AICard,
  Button as AIButton,
  Footer as AIFooter,
  Divider as AIDivider,
  Icon as AIIcon,
  Skeleton as AISkeleton,
  Tag as AITag,
  Title as AITitle,
  type CardColor,
  type CardType,
} from "animal-island-ui";

// Color pool for Animal Island Cards
const CARD_COLORS: CardColor[] = [
  "app-teal",
  "app-pink",
  "purple",
  "app-blue",
  "app-orange",
  "app-green",
  "app-red",
  "lime-green",
  "yellow-green",
  "brown",
  "warm-peach-pink",
];

export function getCardColor(seed: number | string): CardColor {
  let num = 0;
  if (typeof seed === "number") {
    num = seed;
  } else if (typeof seed === "string") {
    for (let i = 0; i < seed.length; i++) {
      num += seed.charCodeAt(i);
    }
  }
  const index = Math.abs(num) % CARD_COLORS.length;
  return CARD_COLORS[index];
}

export function BlogCursor({ children }: { children: ReactNode }) {
  return (
    <Cursor forceAll className="min-h-dvh">
      {children}
    </Cursor>
  );
}

export const PUBLIC_CONTAINER = "mx-auto w-[min(1120px,calc(100vw-2rem))]";

const NAV_LINKS = [
  { href: "/", label: "首页", icon: "icon-miles" as const },
  { href: "/archive", label: "归档", icon: "icon-critterpedia" as const },
  { href: "/categories", label: "分类", icon: "icon-design" as const },
  { href: "/tags", label: "标签", icon: "icon-diy" as const },
  { href: "/docs", label: "文档", icon: "icon-critterpedia" as const },
  { href: "/projects", label: "项目", icon: "icon-shopping" as const },
  { href: "/friends", label: "友链", icon: "icon-chat" as const },
];

export const PublicCard = memo(function PublicCard({
  children,
  className,
  color = "default",
  type = "default",
  hoverable = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "aside" | "header" | "footer";
  color?: CardColor;
  type?: CardType;
  hoverable?: boolean;
}) {
  return (
    <AICard color={color} type={type} hoverable={hoverable} className={cn("min-w-0", className)}>
      {children}
    </AICard>
  );
});

export function TextButton({
  children,
  className,
  variant = "ghost",
  type,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const typeMap = {
    primary: "primary" as const,
    secondary: "default" as const,
    ghost: "text" as const,
    danger: "text" as const,
  };

  return (
    <AIButton
      type={typeMap[variant]}
      danger={variant === "danger"}
      htmlType={type as ButtonHTMLAttributes<HTMLButtonElement>["type"]}
      className={cn("font-bold", className)}
      {...props}
    >
      {children}
    </AIButton>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
      aria-label={label}
    >
      {children}
    </a>
  );
}

function BrandIcon({ path, title }: { path: string; title: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <title>{title}</title>
      <path d={path} />
    </svg>
  );
}

const BRAND_ICON_PATHS = {
  github:
    "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
  twitter:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  zhihu:
    "M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.171H9.384a58.104 58.104 0 01-.112 3.797h2.712c.388.023.393 1.251.393 1.266H9.183a9.223 9.223 0 01-.408 2.102l.757-.604c.452.456 1.512 1.712 1.906 2.177.473.681.063 2.081.063 2.081l-2.794-3.382c-.653 2.518-1.845 3.607-1.845 3.607-.523.468-1.58.82-2.64.516 2.218-1.73 3.44-3.917 3.667-6.497H4.491c0-.015.197-1.243.806-1.266h2.71c.024-.32.086-3.254.086-3.797H6.598c-.136.406-.158.447-.268.753-.594 1.095-1.603 1.122-1.907 1.155.906-1.821 1.416-3.6 1.591-4.064.425-1.124 1.671-1.125 1.671-1.125zM13.078 6h6.377v11.33h-2.573l-2.184 1.373-.401-1.373h-1.219zm1.313 1.219v8.86h.623l.263.937 1.455-.938h1.456v-8.86z",
  weibo:
    "M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.601l.014-.028zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.57-.18-.405-.615.375-.977.42-1.804 0-2.404-.781-1.112-2.915-1.053-5.364-.03 0 0-.766.331-.571-.271.376-1.217.315-2.224-.27-2.809-1.338-1.337-4.869.045-7.888 3.08C1.309 10.87 0 13.273 0 15.348c0 3.981 5.099 6.395 10.086 6.395 6.536 0 10.888-3.801 10.888-6.82 0-1.822-1.547-2.854-2.915-3.284v.01zm1.908-5.092c-.766-.856-1.908-1.187-2.96-.962-.436.09-.706.511-.616.932.09.42.511.691.932.602.511-.105 1.067.044 1.442.465.376.421.466.977.316 1.473-.136.406.089.856.51.992.405.119.857-.105.992-.512.33-1.021.12-2.178-.646-3.035l.03.045zm2.418-2.195c-1.576-1.757-3.905-2.419-6.054-1.968-.496.104-.812.587-.706 1.081.104.496.586.813 1.082.707 1.532-.331 3.185.15 4.296 1.383 1.112 1.246 1.429 2.943.947 4.416-.165.48.106 1.007.586 1.157.479.165.991-.104 1.157-.586.675-2.088.241-4.478-1.338-6.235l.03.045z",
  qq: "M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673",
  wechat:
    "M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z",
};

export function PublicHeader() {
  const pathname = usePathname();
  const { config } = useSiteConfig();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--animal-border-color-light)] bg-[var(--animal-bg-color)]/90 backdrop-blur-xl">
      <div
        className={cn(PUBLIC_CONTAINER, "flex min-h-16 items-center justify-between gap-4 py-3")}
      >
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="返回首页">
          {config.owner_avatar ? (
            <Image
              src={config.owner_avatar}
              alt={config.owner_name || config.site_title || "站站点头像"}
              width={36}
              height={36}
              loading="eager"
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <AIIcon name="icon-miles" size={36} bounce />
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold text-[var(--animal-text-color)]">
              {config.site_title || "典典博客"}
            </span>
            <span className="hidden truncate text-xs font-bold text-[var(--animal-text-color-secondary)] sm:block">
              {config.site_subtitle || "Notes, projects and documents"}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex" aria-label="主导航">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              <AIButton
                type={isActive(item.href) ? "primary" : "text"}
                icon={<AIIcon name={item.icon} bounce size={20} />}
                className="flex items-center gap-1.5 font-bold"
              >
                {item.label}
              </AIButton>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search">
            <AIButton
              type="default"
              icon={<AIIcon name="icon-miles" bounce size={18} />}
              className="font-bold"
            >
              搜索
            </AIButton>
          </Link>
        </div>
      </div>

      <nav
        className={cn(PUBLIC_CONTAINER, "flex gap-1 overflow-x-auto pb-3 lg:hidden")}
        aria-label="移动端主导航"
      >
        {NAV_LINKS.map((item) => (
          <Link key={item.href} href={item.href}>
            <AIButton
              type={isActive(item.href) ? "primary" : "text"}
              size="small"
              icon={<AIIcon name={item.icon} bounce size={16} />}
              className="shrink-0 font-bold"
            >
              {item.label}
            </AIButton>
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function PublicFooter() {
  const { config } = useSiteConfig();
  const currentYear = new Date().getFullYear();
  const socialLinks = [
    {
      href: config.social_github,
      label: "GitHub",
      icon: <BrandIcon title="GitHub" path={BRAND_ICON_PATHS.github} />,
    },
    {
      href: config.social_twitter,
      label: "Twitter",
      icon: <BrandIcon title="Twitter" path={BRAND_ICON_PATHS.twitter} />,
    },
    {
      href: config.social_telegram,
      label: "Telegram",
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      href: config.social_weibo,
      label: "微博",
      icon: <BrandIcon title="Sina Weibo" path={BRAND_ICON_PATHS.weibo} />,
    },
    {
      href: config.social_zhihu,
      label: "知乎",
      icon: <BrandIcon title="Zhihu" path={BRAND_ICON_PATHS.zhihu} />,
    },
    {
      href: config.social_qq_qrcode,
      label: "QQ",
      icon: <BrandIcon title="Tencent QQ" path={BRAND_ICON_PATHS.qq} />,
    },
    {
      href: config.social_wechat_qrcode,
      label: "微信",
      icon: <BrandIcon title="WeChat" path={BRAND_ICON_PATHS.wechat} />,
    },
    {
      href: config.owner_email ? `mailto:${config.owner_email}` : "",
      label: "邮箱",
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-[var(--animal-border-color-light)] bg-[var(--animal-bg-color-secondary)] pb-0 pt-8">
      <div
        className={cn(
          PUBLIC_CONTAINER,
          "grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end z-10 relative px-4",
        )}
      >
        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-base font-extrabold text-[var(--animal-text-color)]">
            <AIIcon name="icon-miles" size={24} />
            {config.site_title || "典典博客"}
          </div>
          <div
            className="max-w-3xl text-sm font-bold leading-7 text-[var(--animal-text-color-secondary)] [&_a]:text-[var(--animal-primary-color)] [&_a]:underline hover:[&_a]:text-[var(--animal-primary-color-hover)]"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                config.footer_text ||
                  config.site_description ||
                  config.site_subtitle ||
                  "持续整理文章、项目与文档。",
              ),
            }}
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-[var(--animal-text-color-muted)]">
            <span>© {currentYear}</span>
            {config.icp_number ? (
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--animal-text-color)]"
              >
                {config.icp_number}
              </a>
            ) : null}
            {config.police_number ? (
              <a
                href="http://www.beian.gov.cn/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--animal-text-color)]"
              >
                {config.police_number}
              </a>
            ) : null}
            {config.owner_email ? (
              <a
                href={`mailto:${config.owner_email}`}
                className="hover:text-[var(--animal-text-color)]"
              >
                {config.owner_email}
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {socialLinks.map((item) => (
            <IconLink key={item.label} href={item.href || ""} label={item.label}>
              {item.icon}
            </IconLink>
          ))}
        </div>
      </div>
      <div className="mt-8 select-none pointer-events-none">
        <AIFooter type="tree" />
      </div>
    </footer>
  );
}

export const PageHero = memo(function PageHero({
  eyebrow,
  title,
  description,
  stats = [],
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  stats?: Array<{ label: string; value: ReactNode; description?: ReactNode }>;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <motion.section
      className="relative grid min-w-0 gap-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.04, ease: [0.4, 0, 0.2, 1] }}
    >
      <AICard color="app-yellow" className="grid gap-4 p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="grid min-w-0 gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow ? (
                <AITag color="brown" size="small">
                  {eyebrow}
                </AITag>
              ) : null}
              <AIIcon name="icon-map" size={20} />
            </div>
            <h1 className="max-w-3xl break-words text-2xl font-black leading-tight tracking-tight text-[var(--animal-text-color)] sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm font-medium leading-6 text-[var(--animal-text-color-secondary)]">
                {description}
              </p>
            ) : null}
            {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
            {children}
          </div>

          {stats.length ? (
            <dl className="flex max-w-full flex-wrap gap-2 md:max-w-80 md:justify-end">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-24 rounded-[var(--animal-border-radius-lg)] bg-[var(--animal-bg-color-secondary)] px-3 py-2 text-left"
                >
                  <dt className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--animal-text-color-muted)]">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 text-base font-black text-[var(--animal-text-color)]">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </AICard>
      <AIDivider type="wave-yellow" className="w-full" />
    </motion.section>
  );
});

export function LoadingState({ label = "正在加载" }: { label?: string }) {
  return (
    <AICard type="dashed" color="default" className="grid min-h-60 place-items-center gap-3 p-6">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--animal-border-color)] border-t-[var(--animal-primary-color)]"
        aria-hidden="true"
      />
      <span className="text-sm font-bold text-[var(--animal-text-color-secondary)]">{label}</span>
    </AICard>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <AICard
      type="dashed"
      color="default"
      className="grid justify-items-center gap-3 py-12 text-center"
    >
      <div>{icon || <AIIcon name="icon-critterpedia" size={32} bounce />}</div>
      <div className="text-base font-extrabold text-[var(--animal-text-color)]">{title}</div>
      {description ? (
        <p className="max-w-md text-xs font-bold leading-6 text-[var(--animal-text-color-secondary)]">
          {description}
        </p>
      ) : null}
    </AICard>
  );
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString(
    "zh-CN",
    options || { year: "numeric", month: "2-digit", day: "2-digit" },
  );
}

export function readingMinutes(
  item: Pick<Blog, "content" | "html"> | { content?: string; html?: string },
) {
  return Math.max(1, Math.ceil((item.content || item.html || "").length / 700));
}

export function buildExcerpt(blog: Blog, length = 140) {
  return (blog.excerpt || blog.summary || blog.html || blog.content || "")
    .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, "")
    .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
}

export function blogHref(blog: Pick<Blog, "id" | "slug">) {
  return blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;
}

export const PostCard = memo(function PostCard({
  blog,
  compact = false,
  eager = false,
}: {
  blog: Blog;
  compact?: boolean;
  eager?: boolean;
}) {
  const excerpt = buildExcerpt(blog, compact ? 96 : 150);
  const readTime = readingMinutes(blog);
  const cardColor = getCardColor(blog.id);

  return (
    <motion.div
      data-post-card-motion
      className="h-full transform-gpu"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.006 }}
      whileTap={{ y: -1, scale: 0.998 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
    >
      <AICard color={cardColor} className="group flex h-full flex-col justify-between p-4">
        <div>
          {blog.thumbnail ? (
            <Link
              href={blogHref(blog)}
              className="relative mb-3 block aspect-[16/9] w-full overflow-hidden rounded-[var(--animal-border-radius-lg)] bg-[var(--animal-bg-color-secondary)]"
              aria-label={`阅读 ${blog.title}`}
            >
              <Image
                src={blog.thumbnail}
                loading={eager ? "eager" : "lazy"}
                alt={blog.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.02]"
              />
            </Link>
          ) : null}

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <AITag color="default" size="small">
              {blog.category?.name || "未分类"}
            </AITag>
            <AITag color="app-teal" size="small">
              {blog.view_count || 0} 次阅读
            </AITag>
          </div>

          <h3 className="mb-2 line-clamp-2 text-lg font-extrabold leading-snug tracking-tight text-inherit">
            <Link href={blogHref(blog)} className="font-extrabold text-inherit hover:underline">
              {blog.title}
            </Link>
          </h3>

          {!compact && excerpt ? (
            <p className="mb-4 line-clamp-3 text-xs leading-6 opacity-90">{excerpt}</p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--animal-border-color-light)] pt-3 text-xs font-bold opacity-80">
          <span>{formatDate(blog.created_at)}</span>
          <span>{readTime} 分钟</span>
        </div>
      </AICard>
    </motion.div>
  );
});

export function FeaturedPost({ blog }: { blog: Blog }) {
  const excerpt = buildExcerpt(blog, 220);

  return (
    <AICard
      color="app-yellow"
      className="grid gap-6 overflow-hidden p-5 lg:grid-cols-[minmax(0,1fr)_0.9fr] lg:items-center"
    >
      <div className="grid gap-4">
        <AITag color="brown" size="small">
          精选文章
        </AITag>
        <div>
          <AITitle size="large" color="brown">
            {blog.title}
          </AITitle>
        </div>
        {excerpt ? (
          <p className="text-sm font-bold leading-6 text-[var(--animal-text-color-secondary)]">
            {excerpt}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <AITag color="default" size="small">
            {formatDate(blog.created_at)}
          </AITag>
          {blog.category ? (
            <AITag color="app-teal" size="small">
              {blog.category.name}
            </AITag>
          ) : null}
          <AITag color="app-blue" size="small">
            {readingMinutes(blog)} 分钟阅读
          </AITag>
        </div>
        <div>
          <Link href={blogHref(blog)}>
            <AIButton type="primary" icon={<AIIcon name="icon-critterpedia" bounce size={16} />}>
              开始阅读
            </AIButton>
          </Link>
        </div>
      </div>

      {blog.thumbnail ? (
        <Link
          href={blogHref(blog)}
          className="relative aspect-[4/3] overflow-hidden rounded-[var(--animal-border-radius-lg)] bg-[var(--animal-bg-color-secondary)]"
          aria-label={`阅读 ${blog.title}`}
        >
          <Image
            src={blog.thumbnail}
            alt={blog.title}
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover"
            priority
          />
        </Link>
      ) : (
        <div className="flex min-h-64 items-center justify-center">
          <AIIcon name="icon-critterpedia" size={64} bounce />
        </div>
      )}
    </AICard>
  );
}

export function BlogSidebar({
  categories,
  tags,
  title = "内容索引",
}: {
  categories: Category[];
  tags: Tag[];
  title?: string;
}) {
  const router = useRouter();
  const { config } = useSiteConfig();

  return (
    <aside className="grid content-start self-start gap-4">
      <AICard color="brown" className="grid gap-4 p-5">
        <div className="flex items-center gap-4">
          {config.owner_avatar ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
              <Image
                src={config.owner_avatar}
                alt={config.owner_name || "作者头像"}
                fill
                sizes="56px"
                loading="eager"
                className="object-cover"
              />
            </div>
          ) : (
            <AIIcon name="icon-miles" size={48} bounce />
          )}
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold">{config.owner_name || "岛主"}</div>
            <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 opacity-80">
              {config.owner_bio || "记录技术、项目和长期积累的内容。"}
            </p>
          </div>
        </div>
      </AICard>

      <AICard color="default" className="grid content-start gap-3 p-5">
        <div className="flex justify-center">
          <AITitle size="small" color="app-teal">
            {title}
          </AITitle>
        </div>
        <div className="grid content-start gap-1">
          {categories.slice(0, 10).map((category) => (
            <AIButton
              key={category.id}
              type="text"
              size="small"
              block
              onClick={() => router.push(`/category/${category.id}`)}
            >
              <span className="flex w-full min-w-0 items-center justify-between gap-3 text-left">
                <span className="truncate">{category.name}</span>
                <AITag color="default" size="small">
                  {category.blog_count || 0}
                </AITag>
              </span>
            </AIButton>
          ))}
          {categories.length === 0 ? (
            <p className="text-xs font-bold text-[var(--animal-text-color-muted)]">暂无分类</p>
          ) : null}
        </div>
      </AICard>

      <AICard color="default" className="grid content-start gap-3 p-5">
        <div className="flex justify-center">
          <AITitle size="small" color="app-yellow">
            热门标签
          </AITitle>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 20).map((tag) => (
            <AITag
              key={tag.id}
              color={getCardColor(tag.id)}
              size="small"
              onClick={() => router.push(`/tag/${tag.id}`)}
            >
              #{tag.name}
            </AITag>
          ))}
          {tags.length === 0 ? (
            <p className="text-xs font-bold text-[var(--animal-text-color-muted)]">暂无标签</p>
          ) : null}
        </div>
      </AICard>
    </aside>
  );
}

export interface PublicHomeInitialData {
  blogs: Blog[];
  pagination: { total: number; totalPages: number };
  categories: Category[];
  tags: Tag[];
}

function LoadingCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <AICard key={index} color={getCardColor(index)} className="grid gap-4 p-5">
          <AISkeleton variant="rect" widthValue="100%" heightValue={150} />
          <AISkeleton variant="text" width="75%" />
          <AISkeleton variant="paragraph" rows={3} />
        </AICard>
      ))}
    </div>
  );
}

export function PublicHome({ initialData }: { initialData?: PublicHomeInitialData }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parsePageParam(searchParams.get("page"));
  const pageSize = parsePageSizeParam(
    searchParams.get("pageSize"),
    HOME_PAGE_SIZE_OPTIONS,
    HOME_PAGE_SIZE,
  );

  const [blogs, setBlogs] = useState<Blog[]>(initialData?.blogs || []);
  const [categories, setCategories] = useState<Category[]>(initialData?.categories || []);
  const [tags, setTags] = useState<Tag[]>(initialData?.tags || []);
  const [pagination, setPagination] = useState(
    initialData?.pagination || { total: 0, totalPages: 0 },
  );
  const [loadingPosts, setLoadingPosts] = useState(!initialData);
  const [loadingSide, setLoadingSide] = useState(!initialData);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const data: PaginatedResponse<Blog> = await blogApi.list(currentPage, pageSize);
      setBlogs(data.items);
      setPagination({ total: data.total, totalPages: data.total_pages });
    } finally {
      setLoadingPosts(false);
    }
  }, [currentPage, pageSize]);

  const fetchSidebar = useCallback(async () => {
    setLoadingSide(true);
    try {
      const [categoryData, tagData] = await Promise.all([categoryApi.list(), tagApi.list()]);
      setCategories(categoryData);
      setTags(tagData);
    } finally {
      setLoadingSide(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) return;

    setBlogs(initialData.blogs);
    setPagination(initialData.pagination);
    setCategories(initialData.categories);
    setTags(initialData.tags);
    setLoadingPosts(false);
    setLoadingSide(false);
  }, [initialData]);

  useEffect(() => {
    if (!initialData) {
      fetchPosts();
    }
  }, [fetchPosts, initialData]);

  useEffect(() => {
    if (!initialData) {
      fetchSidebar();
    }
  }, [fetchSidebar, initialData]);

  const feedBlogs = blogs;
  const pageTitle = currentPage === 1 ? "最新文章" : `第 ${currentPage} 页文章`;

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-8 py-8 px-4")}>
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Latest
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#725d42]">
                {pageTitle}
              </h2>
            </div>
            <p className="text-xs font-bold text-slate-400">
              共 {pagination.total} 篇 · {categories.length} 个分类 · {tags.length} 个标签
            </p>
          </div>

          {loadingPosts ? (
            <LoadingCards count={9} />
          ) : blogs.length === 0 ? (
            <EmptyState
              title="还没有可展示的文章"
              description="发布文章后会在这里展示。"
              icon={<FileText className="h-6 w-6" />}
            />
          ) : feedBlogs.length === 0 ? (
            <EmptyState
              title="当前封面文章已经是唯一公开内容"
              description="翻页或新增文章后会展示更多内容。"
              icon={<BookOpen className="h-6 w-6" />}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {feedBlogs.map((blog, index) => (
                <PostCard key={blog.id} blog={blog} eager={index === 0} />
              ))}
            </div>
          )}

          {pagination.total > 0 ? (
            <Pagination
              total={pagination.total}
              currentPage={currentPage}
              pageSize={pageSize}
              pageSizeOptions={[...HOME_PAGE_SIZE_OPTIONS]}
              disabled={loadingPosts}
              onChange={(page, nextPageSize) =>
                router.push(
                  createPaginationHref(
                    "/",
                    searchParams.toString(),
                    page,
                    nextPageSize,
                    HOME_PAGE_SIZE,
                  ),
                )
              }
            />
          ) : null}
        </div>

        {loadingSide ? (
          <LoadingState label="正在加载索引" />
        ) : (
          <BlogSidebar categories={categories} tags={tags} />
        )}
      </section>
    </main>
  );
}

export function SearchInputIcon() {
  return (
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  );
}

export function PaginationButton({
  direction,
  disabled,
  onClick,
  children,
}: {
  direction: "prev" | "next";
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <AIButton type="default" disabled={disabled} onClick={onClick} className="font-bold">
      {direction === "prev" ? <ChevronLeft className="h-4 w-4 mr-1 inline" /> : null}
      {children}
      {direction === "next" ? <ChevronRight className="h-4 w-4 ml-1 inline" /> : null}
    </AIButton>
  );
}
