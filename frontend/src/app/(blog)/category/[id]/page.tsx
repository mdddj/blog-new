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
import type { Category } from "@/types";
import { absoluteUrl, categoryMetadata } from "@/lib/seo";
import { CategoryPageClient, type CategoryPageInitialData } from "./category-page-client";

const getCategory = cache(async (categoryId: number): Promise<Category | null> => {
  const categories = await categoryApi.list();
  return categories.find((category) => category.id === categoryId) || null;
});

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const category = await getCategory(Number((await params).id));
  if (!category) notFound();

  const query = await searchParams;
  const page = parsePageParam(query.page);
  const pageSize = parsePageSizeParam(query.pageSize, DEFAULT_PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE);
  const baseMetadata = categoryMetadata(category);
  return {
    ...baseMetadata,
    title: page === 1 ? baseMetadata.title : `${category.name} 技术文章 - 第 ${page} 页`,
    alternates: {
      canonical: absoluteUrl(
        createPaginationHref(`/category/${category.id}`, "", page, pageSize, DEFAULT_PAGE_SIZE),
      ),
    },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const categoryId = Number((await params).id);
  const category = await getCategory(categoryId);
  if (!category) notFound();

  const query = await searchParams;
  const page = parsePageParam(query.page);
  const pageSize = parsePageSizeParam(query.pageSize, DEFAULT_PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE);
  const [blogs, categories, tags] = await Promise.all([
    categoryApi.getBlogs(categoryId, page, pageSize),
    categoryApi.list(),
    tagApi.list(),
  ]);

  const initialData: CategoryPageInitialData = {
    blogs: blogs.items,
    categories,
    tags,
    currentCategory: category,
    pagination: { total: blogs.total, totalPages: blogs.total_pages },
  };

  return <CategoryPageClient initialData={initialData} />;
}
