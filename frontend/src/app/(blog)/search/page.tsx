"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileSearch, Search } from "lucide-react";
import { searchApi } from "@/lib/api";
import type { PaginatedResponse, SearchResult } from "@/types";
import { Pagination } from "@/components/blog/pagination";
import {
  EmptyState,
  LoadingState,
  PageHero,
  PublicCard,
  PUBLIC_CONTAINER,
  TextButton,
  formatDate,
} from "@/components/blog/public";
import { cn } from "@/lib/utils";

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(keyword)})`, "gi"));

  return (
    <>
      {parts.map((part, idx) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={idx} className="rounded bg-amber-100 px-1 text-slate-950 dark:bg-amber-300/20 dark:text-amber-100">
            {part}
          </mark>
        ) : (
          <span key={idx}>{part}</span>
        ),
      )}
    </>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const [input, setInput] = useState(queryParam);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (query: string, page: number) => {
    if (!query.trim()) {
      setResults([]);
      setPagination({ total: 0, totalPages: 0 });
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const data: PaginatedResponse<SearchResult> = await searchApi.search(query, page, pageSize);
      setResults(data.items);
      setPagination({ total: data.total, totalPages: data.total_pages });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setInput(queryParam);
    if (queryParam) {
      doSearch(queryParam, currentPage);
    } else {
      setResults([]);
      setPagination({ total: 0, totalPages: 0 });
      setSearched(false);
    }
  }, [queryParam, currentPage, doSearch]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const keyword = input.trim();
    if (keyword) router.push(`/search?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
      <PageHero
        eyebrow="Search"
        title={queryParam ? `搜索 “${queryParam}”` : "搜索文章与笔记"}
        description={queryParam ? "结果会按相关文章直接展开，你可以继续换词缩小范围。" : "直接检索文章标题、摘要和正文内容。"}
        stats={[
          { label: "Keyword", value: queryParam || "全站", description: queryParam ? "当前关键词" : "等待输入" },
          { label: "Results", value: pagination.total, description: "匹配内容数" },
          { label: "Page", value: `${currentPage}/${Math.max(1, pagination.totalPages)}`, description: "当前页码" },
        ]}
      >
        <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">搜索关键词</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={input}
              placeholder="输入关键词，例如：Rust、架构、读书笔记..."
              onChange={(event) => setInput(event.target.value)}
              className="h-11 w-full rounded-full border border-slate-200 bg-white px-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
            />
            {input ? (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                onClick={() => setInput("")}
              >
                清空
              </button>
            ) : null}
          </label>
          <TextButton type="submit" variant="primary" className="h-11" disabled={loading}>
            {loading ? "搜索中" : "搜索"}
          </TextButton>
        </form>
      </PageHero>

      {loading ? (
        <LoadingState label="正在搜索" />
      ) : searched ? (
        results.length > 0 ? (
          <section className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Results</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">搜索结果</h2>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">共 {pagination.total} 条结果 · 当前第 {currentPage} 页</span>
            </div>

            <div className="grid gap-4">
              {results.map((item) => (
                <PublicCard key={item.id} as="article" className="grid gap-3">
                  <h2 className="text-xl font-semibold leading-snug text-slate-950 dark:text-white">
                    <button
                      type="button"
                      className="text-left hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={() => router.push(item.slug ? `/blog/${item.slug}` : `/blog/${item.id}`)}
                    >
                      <HighlightText text={item.title} keyword={queryParam} />
                    </button>
                  </h2>
                  <p className="line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <HighlightText text={item.content_snippet || ""} keyword={queryParam} />
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(item.created_at)}</span>
                    <button
                      type="button"
                      className="text-sm font-medium text-slate-950 hover:underline dark:text-white"
                      onClick={() => router.push(item.slug ? `/blog/${item.slug}` : `/blog/${item.id}`)}
                    >
                      阅读结果
                    </button>
                  </div>
                </PublicCard>
              ))}
            </div>

            {pagination.totalPages > 1 ? (
              <PublicCard>
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => router.push(`/search?q=${encodeURIComponent(queryParam)}&page=${page}`)}
                />
              </PublicCard>
            ) : null}
          </section>
        ) : (
          <EmptyState title="没有找到相关内容" description="换个更通用的关键词再试一次。" icon={<FileSearch className="h-6 w-6" />} />
        )
      ) : (
        <EmptyState title="输入关键词后开始搜索" description="支持检索标题、摘要和正文片段。" icon={<Search className="h-6 w-6" />} />
      )}
    </main>
  );
}

function SearchLoading() {
  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
      <LoadingState label="正在加载搜索页" />
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}
