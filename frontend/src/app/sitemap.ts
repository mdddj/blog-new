import type { MetadataRoute } from "next";
import { blogApi, categoryApi, directoryApi, tagApi } from "@/lib/api";
import { absoluteUrl, blogPath, SITE_URL } from "@/lib/seo";
import type { DirectoryTreeNode } from "@/types";

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: "daily", priority: 1 },
  { url: absoluteUrl("/archive"), changeFrequency: "weekly", priority: 0.6 },
  { url: absoluteUrl("/categories"), changeFrequency: "weekly", priority: 0.6 },
  { url: absoluteUrl("/tags"), changeFrequency: "weekly", priority: 0.5 },
  { url: absoluteUrl("/docs"), changeFrequency: "weekly", priority: 0.6 },
  { url: absoluteUrl("/projects"), changeFrequency: "monthly", priority: 0.4 },
  { url: absoluteUrl("/friends"), changeFrequency: "monthly", priority: 0.3 },
];

async function getAllBlogs() {
  const firstPage = await blogApi.list(1, 100);
  const remainingPages = Array.from(
    { length: Math.max(0, firstPage.total_pages - 1) },
    (_, index) => blogApi.list(index + 2, 100),
  );
  const remaining = await Promise.all(remainingPages);
  return [firstPage, ...remaining].flatMap((page) => page.items);
}

function collectDocumentIds(nodes: DirectoryTreeNode[], ids: number[] = []) {
  for (const node of nodes) {
    ids.push(...(node.documents || []).map((document) => document.id));
    collectDocumentIds(node.children || [], ids);
  }
  return ids;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [blogs, categories, tags, documents] = await Promise.all([
      getAllBlogs(),
      categoryApi.list(),
      tagApi.list(),
      directoryApi.getTree(),
    ]);

    const blogPages = blogs.map((blog) => ({
      url: absoluteUrl(blogPath(blog)),
      lastModified: blog.updated_at || blog.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    const categoryPages = categories
      .filter((category) => (category.blog_count || 0) >= 2)
      .map((category) => ({
        url: absoluteUrl(`/category/${category.id}`),
        lastModified: category.created_at,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }));
    const tagPages = tags
      .filter((tag) => (tag.blog_count || 0) >= 3)
      .map((tag) => ({
        url: absoluteUrl(`/tag/${tag.id}`),
        changeFrequency: "weekly" as const,
        priority: 0.4,
      }));
    const documentPages = collectDocumentIds(documents).map((id) => ({
      url: absoluteUrl(`/docs/${id}`),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    return [...STATIC_PAGES, ...blogPages, ...categoryPages, ...tagPages, ...documentPages];
  } catch (error) {
    console.error("Failed to build sitemap:", error);
    return STATIC_PAGES;
  }
}
