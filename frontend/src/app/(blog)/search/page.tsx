"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { searchApi } from "@/lib/api";
import type { PaginatedResponse, SearchResult } from "@/types";
import { Pagination } from "@/components/blog/pagination";
import {
  EmptyState,
  LoadingState,
  PageHero,
  PublicCard,
  PUBLIC_CONTAINER,
  formatDate,
  getCardColor,
} from "@/components/blog/public";
import { Input as AIInput, Button as AIButton, Icon as AIIcon } from "animal-island-ui";
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
          <mark key={idx} className="rounded bg-amber-200 px-1 text-[#725d42] font-extrabold dark:bg-amber-300/30 dark:text-amber-100">
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
    if (keyword) {
      router.push(`/search?q=${encodeURIComponent(keyword)}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
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
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
          <div className="relative min-w-0">
            <AIInput
              size="large"
              value={input}
              placeholder="输入关键词，例如：Rust、架构、读书笔记..."
              onChange={(event) => setInput(event.target.value)}
              prefix={<AIIcon name="icon-miles" size={20} bounce />}
              allowClear
              onClear={() => setInput("")}
              className="w-full font-bold"
            />
          </div>
          <AIButton type="primary" htmlType="submit" disabled={loading} className="h-[42px] font-bold">
            {loading ? "搜索中..." : "搜索"}
          </AIButton>
        </form>
      </PageHero>

      {loading ? (
        <LoadingState label="正在全站检索中..." />
      ) : searched ? (
        results.length > 0 ? (
          <section className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Results</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#725d42]">搜索结果</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">共 {pagination.total} 条结果 · 当前第 {currentPage} 页</span>
            </div>

            <div className="grid gap-4">
              {results.map((item) => {
                const cardColor = getCardColor(item.id);
                return (
                  <PublicCard key={item.id} color={cardColor} className="grid gap-3 p-5 shadow-sm hover:shadow hover:-translate-y-0.5 transition-transform duration-300">
                    <h2 className="text-xl font-extrabold leading-snug text-inherit">
                      <button
                        type="button"
                        className="text-left hover:underline text-inherit"
                        onClick={() => router.push(item.slug ? `/blog/${item.slug}` : `/blog/${item.id}`)}
                      >
                        <HighlightText text={item.title} keyword={queryParam} />
                      </button>
                    </h2>
                    <p className="line-clamp-3 text-xs leading-6 opacity-90 font-bold text-inherit">
                      <HighlightText text={item.content_snippet || ""} keyword={queryParam} />
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-3 text-xs font-bold opacity-80">
                      <span>{formatDate(item.created_at)}</span>
                      <AIButton
                        type="text"
                        size="small"
                        className="font-bold flex items-center"
                        onClick={() => router.push(item.slug ? `/blog/${item.slug}` : `/blog/${item.id}`)}
                      >
                        阅读结果
                        <AIIcon name="icon-critterpedia" size={14} className="ml-1" />
                      </AIButton>
                    </div>
                  </PublicCard>
                );
              })}
            </div>

            {pagination.totalPages > 1 ? (
              <PublicCard color="default" className="p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => router.push(`/search?q=${encodeURIComponent(queryParam)}&page=${page}`)}
                />
              </PublicCard>
            ) : null}
          </section>
        ) : (
          <EmptyState title="没有找到相关内容" description="换个更通用的关键词再试一次。" icon={<AIIcon name="icon-camera" size={32} />} />
        )
      ) : (
        <EmptyState title="输入关键词后开始搜索" description="支持检索标题、摘要和正文片段。" icon={<AIIcon name="icon-miles" size={32} />} />
      )}
    </main>
  );
}

function SearchLoading() {
  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
      <LoadingState label="正在加载搜索服务..." />
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
