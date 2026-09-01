import type { Metadata } from "next";
import type { Blog, Category, Tag } from "@/types";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
export const SITE_URL = (
  configuredSiteUrl ||
  (process.env.NODE_ENV === "production" ? "https://itbug.shop" : "http://localhost:3000")
).replace(/\/+$/, "");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "梁典典的博客";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.svg`;
export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function blogPath(blog: Pick<Blog, "id" | "slug">) {
  return blog.slug ? `/blog/${encodeURIComponent(blog.slug)}` : `/blog/${blog.id}`;
}

export function cleanText(value: string | undefined | null, maxLength = 160) {
  return (value || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~>#]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function blogDescription(blog: Pick<Blog, "title" | "summary" | "excerpt" | "content" | "html">) {
  return cleanText(blog.summary || blog.excerpt || blog.content || blog.html || blog.title, 160);
}

export function blogMetadata(blog: Blog): Metadata {
  const description = blogDescription(blog);
  const url = absoluteUrl(blogPath(blog));
  const image = blog.thumbnail ? absoluteUrl(blog.thumbnail) : DEFAULT_OG_IMAGE;
  const author = blog.author || SITE_NAME;

  return {
    title: blog.title,
    description,
    authors: [{ name: author }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: blog.title,
      description,
      siteName: SITE_NAME,
      images: [{ url: image, alt: blog.title }],
      publishedTime: blog.created_at,
      modifiedTime: blog.updated_at || blog.created_at,
      authors: [author],
      tags: blog.tags?.map((tag) => tag.name),
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description,
      images: [image],
    },
  };
}

export function blogPostingJsonLd(blog: Blog) {
  const url = absoluteUrl(blogPath(blog));
  const image = blog.thumbnail ? absoluteUrl(blog.thumbnail) : DEFAULT_OG_IMAGE;
  const author = blog.author || SITE_NAME;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: blog.title,
    description: blogDescription(blog),
    image: [image],
    author: { "@type": "Person", name: author },
    publisher: { "@type": "Person", name: SITE_NAME },
    datePublished: blog.created_at,
    dateModified: blog.updated_at || blog.created_at,
    url,
    articleSection: blog.category?.name,
    keywords: blog.tags?.map((tag) => tag.name),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path ? absoluteUrl(item.path) : undefined,
    })),
  };
}

export function categoryMetadata(category: Category): Metadata {
  const description = cleanText(
    category.intro || `${category.name} 分类下的技术文章、实践记录与相关资料。`,
  );
  const path = `/category/${category.id}`;
  const isThin = (category.blog_count || 0) < 2;
  return {
    title: `${category.name} 技术文章`,
    description,
    robots: isThin ? { index: false, follow: true } : undefined,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      title: `${category.name} 技术文章`,
      description,
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, alt: `${category.name} 技术文章` }],
    },
  };
}

export function tagMetadata(tag: Tag): Metadata {
  const description = `${tag.name} 相关文章与实践记录，整理可复用的技术经验与解决方案。`;
  const path = `/tag/${tag.id}`;
  const isThin = (tag.blog_count || 0) < 3;
  return {
    title: `${tag.name} 相关文章`,
    description,
    robots: isThin ? { index: false, follow: true } : undefined,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      title: `${tag.name} 相关文章`,
      description,
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, alt: `${tag.name} 相关文章` }],
    },
  };
}
// Taxonomy pages with too few entries stay crawlable through links but out of the index.

export function jsonLdScript(data: unknown) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}
