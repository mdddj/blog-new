"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Folder,
  Github,
  Hash,
  Loader2,
  Mail,
  Moon,
  Search,
  Sun,
  Twitter,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/site-config-context";
import { blogApi, categoryApi, tagApi } from "@/lib/api";
import type { Blog, Category, PaginatedResponse, Tag } from "@/types";
import { Pagination } from "@/components/blog/pagination";

export const PUBLIC_CONTAINER = "mx-auto w-[min(1120px,calc(100vw-2rem))]";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/archive", label: "归档" },
  { href: "/categories", label: "分类" },
  { href: "/tags", label: "标签" },
  { href: "/docs", label: "文档" },
  { href: "/projects", label: "项目" },
  { href: "/friends", label: "友链" },
];

export function PublicCard({
  children,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "aside" | "header" | "footer";
}) {
  return (
    <Component
      className={cn(
        "min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:shadow-none",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function TextButton({
  children,
  className,
  variant = "ghost",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
    secondary:
      "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900",
    ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
    danger: "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
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

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <span className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-800" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-white"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const { config } = useSiteConfig();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
      <div className={cn(PUBLIC_CONTAINER, "flex min-h-16 items-center justify-between gap-4 py-3")}>
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="返回首页">
          {config.owner_avatar ? (
            <Image
              src={config.owner_avatar}
              alt={config.owner_name || config.site_title || "站点头像"}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
              {(config.site_title || "B").slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">
              {config.site_title || "典典博客"}
            </span>
            <span className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
              {config.site_subtitle || "Notes, projects and documents"}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                isActive(item.href) && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white dark:bg-white dark:text-slate-950 dark:hover:bg-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">搜索</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <nav className={cn(PUBLIC_CONTAINER, "flex gap-1 overflow-x-auto pb-3 lg:hidden")} aria-label="移动端主导航">
        {NAV_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
              isActive(item.href) && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white dark:bg-white dark:text-slate-950 dark:hover:bg-white",
            )}
          >
            {item.label}
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
    { href: config.social_github, label: "GitHub", icon: <Github className="h-4 w-4" /> },
    { href: config.social_twitter, label: "Twitter", icon: <Twitter className="h-4 w-4" /> },
    { href: config.social_telegram, label: "Telegram", icon: <Mail className="h-4 w-4" /> },
  ];

  return (
    <footer className="mt-12 border-t border-slate-200/80 bg-white/80 py-8 dark:border-slate-800 dark:bg-slate-950/70">
      <div className={cn(PUBLIC_CONTAINER, "grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end")}>
        <div className="grid gap-3">
          <div className="text-base font-semibold text-slate-950 dark:text-white">{config.site_title || "典典博客"}</div>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            {config.footer_text || config.site_description || config.site_subtitle || "持续整理文章、项目与文档。"}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span>© {currentYear}</span>
            {config.icp_number ? (
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer" className="hover:text-slate-950 dark:hover:text-white">
                {config.icp_number}
              </a>
            ) : null}
            {config.police_number ? (
              <a href="http://www.beian.gov.cn/" target="_blank" rel="noreferrer" className="hover:text-slate-950 dark:hover:text-white">
                {config.police_number}
              </a>
            ) : null}
            {config.owner_email ? (
              <a href={`mailto:${config.owner_email}`} className="hover:text-slate-950 dark:hover:text-white">
                {config.owner_email}
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {socialLinks.map((item) => (
            <IconLink key={item.label} href={item.href} label={item.label}>
              {item.icon}
            </IconLink>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function PageHero({
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
    <section className="grid min-w-0 gap-6 rounded-3xl border border-slate-200/80 bg-white px-5 py-8 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none sm:px-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid min-w-0 gap-3">
          {eyebrow ? (
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="max-w-4xl break-words text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">{description}</p>
          ) : null}
          {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
          {children}
        </div>

        {stats.length ? (
          <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:min-w-64 lg:grid-cols-1">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{stat.label}</div>
                <div className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{stat.value}</div>
                {stat.description ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.description}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function LoadingState({ label = "正在加载" }: { label?: string }) {
  return (
    <PublicCard className="flex min-h-72 items-center justify-center">
      <div className="inline-flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </PublicCard>
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
    <PublicCard className="grid justify-items-center gap-3 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        {icon || <FileText className="h-6 w-6" />}
      </div>
      <div className="font-semibold text-slate-950 dark:text-white">{title}</div>
      {description ? <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
    </PublicCard>
  );
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("zh-CN", options || { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function readingMinutes(item: Pick<Blog, "content" | "html"> | { content?: string; html?: string }) {
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

export function PostCard({ blog, compact = false }: { blog: Blog; compact?: boolean }) {
  const router = useRouter();
  const excerpt = buildExcerpt(blog, compact ? 96 : 150);
  const readTime = readingMinutes(blog);

  return (
    <PublicCard as="article" className="group grid h-full gap-4 p-4">
      {blog.thumbnail ? (
        <button
          type="button"
          className="relative aspect-[16/9] overflow-hidden rounded-xl bg-slate-100 text-left dark:bg-slate-900"
          onClick={() => router.push(blogHref(blog))}
          aria-label={`阅读 ${blog.title}`}
        >
          <Image
            src={blog.thumbnail}
            alt={blog.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </button>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Folder className="h-3.5 w-3.5" />
          {blog.category?.name || "未分类"}
        </span>
        <span>·</span>
        <span>{blog.view_count || 0} 次阅读</span>
      </div>

      <h3 className="line-clamp-2 text-xl font-semibold leading-snug tracking-tight text-slate-950 dark:text-white">
        <button type="button" className="text-left hover:text-slate-700 dark:hover:text-slate-200" onClick={() => router.push(blogHref(blog))}>
          {blog.title}
        </button>
      </h3>

      {!compact && excerpt ? <p className="line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{excerpt}</p> : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {formatDate(blog.created_at)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          {readTime} 分钟
        </span>
      </div>
    </PublicCard>
  );
}

export function FeaturedPost({ blog }: { blog: Blog }) {
  const router = useRouter();
  const excerpt = buildExcerpt(blog, 220);

  return (
    <PublicCard as="article" className="grid gap-6 overflow-hidden p-5 lg:grid-cols-[minmax(0,1fr)_0.9fr] lg:items-center">
      <div className="grid gap-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <BookOpen className="h-3.5 w-3.5" />
          精选文章
        </div>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl">{blog.title}</h2>
        {excerpt ? <p className="text-base leading-8 text-slate-600 dark:text-slate-300">{excerpt}</p> : null}
        <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>{formatDate(blog.created_at)}</span>
          {blog.category ? <span>· {blog.category.name}</span> : null}
          <span>· {readingMinutes(blog)} 分钟阅读</span>
        </div>
        <div>
          <TextButton variant="primary" onClick={() => router.push(blogHref(blog))}>
            开始阅读
            <ArrowRight className="h-4 w-4" />
          </TextButton>
        </div>
      </div>

      {blog.thumbnail ? (
        <button
          type="button"
          className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900"
          onClick={() => router.push(blogHref(blog))}
          aria-label={`阅读 ${blog.title}`}
        >
          <Image src={blog.thumbnail} alt={blog.title} fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" priority />
        </button>
      ) : (
        <div className="flex min-h-64 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-900">
          <BookOpen className="h-16 w-16" />
        </div>
      )}
    </PublicCard>
  );
}

export function BlogSidebar({ categories, tags, title = "内容索引" }: { categories: Category[]; tags: Tag[]; title?: string }) {
  const router = useRouter();
  const { config } = useSiteConfig();

  return (
    <aside className="grid gap-4">
      <PublicCard className="grid gap-4">
        <div className="flex items-center gap-4">
          {config.owner_avatar ? (
            <Image src={config.owner_avatar} alt={config.owner_name || "作者头像"} width={52} height={52} className="rounded-full object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <UserRound className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-950 dark:text-white">{config.owner_name || "作者"}</div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {config.owner_bio || "记录技术、项目和长期积累的内容。"}
            </p>
          </div>
        </div>
      </PublicCard>

      <PublicCard className="grid gap-3">
        <div className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
          <Folder className="h-4 w-4" />
          {title}
        </div>
        <div className="grid gap-1.5">
          {categories.slice(0, 10).map((category) => (
            <button
              key={category.id}
              type="button"
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              onClick={() => router.push(`/category/${category.id}`)}
            >
              <span className="truncate">{category.name}</span>
              <span className="shrink-0 text-xs text-slate-400">{category.blog_count || 0}</span>
            </button>
          ))}
          {categories.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">暂无分类</p> : null}
        </div>
      </PublicCard>

      <PublicCard className="grid gap-3">
        <div className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
          <Hash className="h-4 w-4" />
          热门标签
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 20).map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => router.push(`/tag/${tag.id}`)}
            >
              #{tag.name}
            </button>
          ))}
          {tags.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">暂无标签</p> : null}
        </div>
      </PublicCard>
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
      {Array.from({ length: count }).map((_, idx) => (
        <PublicCard key={idx} className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </PublicCard>
      ))}
    </div>
  );
}

export function PublicHome({ initialData }: { initialData?: PublicHomeInitialData }) {
  const { config } = useSiteConfig();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = 9;

  const [blogs, setBlogs] = useState<Blog[]>(initialData?.blogs || []);
  const [categories, setCategories] = useState<Category[]>(initialData?.categories || []);
  const [tags, setTags] = useState<Tag[]>(initialData?.tags || []);
  const [pagination, setPagination] = useState(initialData?.pagination || { total: 0, totalPages: 0 });
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
  }, [currentPage]);

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
    if (!initialData || currentPage > 1) {
      fetchPosts();
    }
  }, [fetchPosts, initialData, currentPage]);

  useEffect(() => {
    if (!initialData) {
      fetchSidebar();
    }
  }, [fetchSidebar, initialData]);

  const featuredBlog = currentPage === 1 ? blogs[0] : undefined;
  const feedBlogs = featuredBlog ? blogs.slice(1) : blogs;
  const pageTitle = currentPage === 1 ? "最新文章" : `第 ${currentPage} 页文章`;
  const description =
    config.site_description || config.site_subtitle || "这里收录博客、项目、文档与长期积累下来的技术线索。";

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-8 py-8")}>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(320px,1fr)] lg:items-stretch">
        <PageHero
          eyebrow="Editorial Desk"
          title={config.site_title || "典典博客"}
          description={description}
          stats={[
            { label: "Posts", value: pagination.total, description: "公开文章" },
            { label: "Categories", value: categories.length, description: "内容分类" },
            { label: "Tags", value: tags.length, description: "关键词" },
          ]}
          actions={
            <>
              <TextButton variant="primary" onClick={() => router.push("/search")}>
                搜索内容
                <Search className="h-4 w-4" />
              </TextButton>
              <TextButton variant="secondary" onClick={() => router.push("/docs")}>
                浏览文档
              </TextButton>
            </>
          }
        >
          {config.blog_global_summary ? (
            <p className="max-w-3xl border-l-2 border-slate-200 pl-4 text-sm leading-7 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {config.blog_global_summary}
            </p>
          ) : null}
        </PageHero>

        {featuredBlog ? <FeaturedPost blog={featuredBlog} /> : <LoadingState label="正在加载精选内容" />}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Latest</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{pageTitle}</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              共 {pagination.total} 篇 · {categories.length} 个分类 · {tags.length} 个标签
            </p>
          </div>

          {loadingPosts ? (
            <LoadingCards count={9} />
          ) : blogs.length === 0 ? (
            <EmptyState title="还没有可展示的文章" description="发布文章后会在这里展示。" icon={<FileText className="h-6 w-6" />} />
          ) : feedBlogs.length === 0 ? (
            <EmptyState title="当前封面文章已经是唯一公开内容" description="翻页或新增文章后会展示更多内容。" icon={<BookOpen className="h-6 w-6" />} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {feedBlogs.map((blog) => (
                <PostCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 ? (
            <PublicCard>
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => router.push(page === 1 ? "/" : `/?page=${page}`)}
              />
            </PublicCard>
          ) : null}
        </div>

        {loadingSide ? <LoadingState label="正在加载索引" /> : <BlogSidebar categories={categories} tags={tags} />}
      </section>
    </main>
  );
}

export function SearchInputIcon() {
  return <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />;
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
    <TextButton variant="secondary" disabled={disabled} onClick={onClick}>
      {direction === "prev" ? <ChevronLeft className="h-4 w-4" /> : null}
      {children}
      {direction === "next" ? <ChevronRight className="h-4 w-4" /> : null}
    </TextButton>
  );
}
