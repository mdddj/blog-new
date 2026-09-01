import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicHome, PUBLIC_CONTAINER, LoadingState } from "@/components/blog/public";
import { blogApi, categoryApi, tagApi } from "@/lib/api";
import {
  HOME_PAGE_SIZE,
  HOME_PAGE_SIZE_OPTIONS,
  createPaginationHref,
  parsePageParam,
  parsePageSizeParam,
} from "@/lib/pagination";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

function LoadingSkeleton() {
  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-4 py-8")}>
      <LoadingState label="正在加载首页内容…" />
    </main>
  );
}
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const query = await searchParams;
  const page = parsePageParam(query.page);
  const pageSize = parsePageSizeParam(query.pageSize, HOME_PAGE_SIZE_OPTIONS, HOME_PAGE_SIZE);
  const canonicalPath = createPaginationHref("/", "", page, pageSize, HOME_PAGE_SIZE);

  return {
    title: page === 1 ? "AI 工具链、Rust、UE5 与 SwiftUI 实战记录" : `第 ${page} 页文章`,
    description: "记录 AI 工具链、Rust、UE5、Flutter 与 SwiftUI 的实战经验。",
    alternates: { canonical: absoluteUrl(canonicalPath) },
  };
}

export default async function HomePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = parsePageParam(searchParams?.page);
  const pageSize = parsePageSizeParam(
    searchParams?.pageSize,
    HOME_PAGE_SIZE_OPTIONS,
    HOME_PAGE_SIZE,
  );

  let initialData = undefined;
  try {
    const [blogsRes, categoriesRes, tagsRes] = await Promise.all([
      blogApi.list(page, pageSize),
      categoryApi.list(),
      tagApi.list(),
    ]);
    initialData = {
      blogs: blogsRes.items,
      pagination: {
        total: blogsRes.total,
        totalPages: blogsRes.total_pages,
      },
      categories: categoriesRes,
      tags: tagsRes,
    };
  } catch (error) {
    console.error("Failed to fetch initial data server-side:", error);
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PublicHome initialData={initialData} />
    </Suspense>
  );
}
