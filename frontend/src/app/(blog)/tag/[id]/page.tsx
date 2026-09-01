import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryApi, tagApi } from "@/lib/api";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  createPaginationHref,
  parsePageParam,
  parsePageSizeParam,
} from "@/lib/pagination";
import type { Tag } from "@/types";
import { absoluteUrl, tagMetadata } from "@/lib/seo";
import { TagPageClient, type TagPageInitialData } from "./tag-page-client";

const getTag = cache(async (tagId: number): Promise<Tag | null> => {
  const tags = await tagApi.list();
  return tags.find((tag) => tag.id === tagId) || null;
});

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const tag = await getTag(Number((await params).id));
  if (!tag) notFound();

  const query = await searchParams;
  const page = parsePageParam(query.page);
  const pageSize = parsePageSizeParam(query.pageSize, DEFAULT_PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE);
  const baseMetadata = tagMetadata(tag);
  return {
    ...baseMetadata,
    title: page === 1 ? baseMetadata.title : `${tag.name} 相关文章 - 第 ${page} 页`,
    alternates: {
      canonical: absoluteUrl(
        createPaginationHref(`/tag/${tag.id}`, "", page, pageSize, DEFAULT_PAGE_SIZE),
      ),
    },
  };
}

export default async function TagDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const tagId = Number((await params).id);
  const tag = await getTag(tagId);
  if (!tag) notFound();

  const query = await searchParams;
  const page = parsePageParam(query.page);
  const pageSize = parsePageSizeParam(query.pageSize, DEFAULT_PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE);
  const [blogs, categories, tags] = await Promise.all([
    tagApi.getBlogs(tagId, page, pageSize),
    categoryApi.list(),
    tagApi.list(),
  ]);

  const initialData: TagPageInitialData = {
    blogs: blogs.items,
    categories,
    tags,
    currentTag: tag,
    pagination: { total: blogs.total, totalPages: blogs.total_pages },
  };

  return <TagPageClient initialData={initialData} />;
}
