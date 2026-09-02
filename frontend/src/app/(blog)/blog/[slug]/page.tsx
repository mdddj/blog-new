import { cache } from "react";
import { permanentRedirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { adApi, blogApi } from "@/lib/api";
import { ARTICLE_END_SLOT } from "@/lib/ads";
import type { Ad, Blog } from "@/types";
import { BlogDetailClient } from "./blog-detail-client";
import {
  blogMetadata,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  jsonLdScript,
} from "@/lib/seo";

const getBlog = cache(async (slug: string): Promise<Blog | null> => {
  try {
    return Number.isNaN(Number(slug))
      ? await blogApi.getBySlug(slug)
      : await blogApi.getById(Number(slug));
  } catch (error) {
    console.error("Failed to fetch blog:", error);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) notFound();
  return blogMetadata(blog);
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) notFound();
  if (!Number.isNaN(Number(slug)) && blog.slug) permanentRedirect(`/blog/${encodeURIComponent(blog.slug)}`);

  let previous: Blog | null = null;
  let next: Blog | null = null;
  try {
    const adjacent = await blogApi.getPrevNext(blog.id);
    previous = adjacent.prev;
    next = adjacent.next;
  } catch (error) {
    console.error("Failed to fetch adjacent blogs:", error);
  }

  let ads: Ad[] = [];
  try {
    ads = await adApi.list(ARTICLE_END_SLOT);
  } catch (error) {
    console.error("Failed to fetch ads:", error);
  }

  const breadcrumb = breadcrumbJsonLd([
    { name: "首页", path: "/" },
    ...(blog.category
      ? [{ name: blog.category.name, path: `/category/${blog.category.id}` }]
      : []),
    { name: blog.title },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(blogPostingJsonLd(blog))}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumb)} />
      <BlogDetailClient
        slug={slug}
        initialBlog={blog}
        previousBlog={previous}
        nextBlog={next}
        ads={ads}
      />
    </>
  );
}
