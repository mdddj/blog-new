"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Divider, Icon, Input, Loading } from "@/lib/animal-ui";
import { searchApi } from "@/lib/api";
import type { PaginatedResponse, SearchResult } from "@/types";
import { IslandPageHeader } from "@/components/blog/island";
import { Pagination } from "@/components/blog/pagination";

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
          <mark key={idx} className="rounded bg-[#f7cd67] px-1 text-[#725d42]">
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
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
      <IslandPageHeader
        eyebrow="内容搜索"
        chips={[queryParam ? "已提交关键词" : "输入关键词后开始"]}
        title={queryParam ? `搜索 “${queryParam}”` : "搜索文章与笔记"}
        description={queryParam ? "结果会按相关文章直接展开，你可以继续换词缩小范围。" : "直接检索文章标题、摘要和正文内容。"}
        stats={[
          { label: "Keyword", value: queryParam || "全站", description: queryParam ? "当前关键词" : "等待输入" },
          { label: "Results", value: pagination.total, description: "匹配内容数" },
          { label: "Page", value: `${currentPage}/${Math.max(1, pagination.totalPages)}`, description: "当前页码" },
        ]}
      >
        <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            size="large"
            allowClear
            value={input}
            prefix={<Icon name="icon-camera" size={18} />}
            placeholder="输入关键词，例如：Rust、架构、读书笔记..."
            onChange={(event) => setInput(event.target.value)}
            onClear={() => setInput("")}
          />
          <Button htmlType="submit" type="primary" size="large" loading={loading} icon={<Icon name="icon-map" size={18} />}>
            搜索
          </Button>
        </form>
      </IslandPageHeader>

      {loading ? (
        <Card type="dashed">
          <div className="flex min-h-72 items-center justify-center">
            <Loading active />
          </div>
        </Card>
      ) : searched ? (
        results.length > 0 ? (
          <section className="grid gap-4">
            <Card type="title">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black">搜索结果</h2>
                <span className="font-bold">共 {pagination.total} 条结果 · 当前第 {currentPage} 页</span>
              </div>
            </Card>

            <div className="grid gap-4">
              {results.map((item) => (
                <Card key={item.id}>
                  <article className="grid gap-3">
                    <h2 className="text-xl font-black leading-snug">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => router.push(item.slug ? `/blog/${item.slug}` : `/blog/${item.id}`)}
                      >
                        <HighlightText text={item.title} keyword={queryParam} />
                      </button>
                    </h2>
                    <p className="line-clamp-3 text-sm leading-7">
                      <HighlightText text={item.content_snippet || ""} keyword={queryParam} />
                    </p>
                    <Divider type="line-teal" />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm">{new Date(item.created_at).toLocaleDateString("zh-CN")}</span>
                      <Button type="text" size="small" onClick={() => router.push(item.slug ? `/blog/${item.slug}` : `/blog/${item.id}`)}>
                        阅读结果
                      </Button>
                    </div>
                  </article>
                </Card>
              ))}
            </div>

            {pagination.totalPages > 1 ? (
              <Card>
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => router.push(`/search?q=${encodeURIComponent(queryParam)}&page=${page}`)}
                />
              </Card>
            ) : null}
          </section>
        ) : (
          <Card type="dashed">
            <div className="grid justify-items-center gap-3 py-10 text-center">
              <Icon name="icon-chat" size={54} bounce />
              <p>没有找到相关内容，换个更通用的关键词再试一次。</p>
            </div>
          </Card>
        )
      ) : (
        <Card type="dashed">
          <div className="grid justify-items-center gap-3 py-10 text-center">
            <Icon name="icon-camera" size={54} bounce />
            <p>输入关键词后开始搜索。</p>
          </div>
        </Card>
      )}
    </main>
  );
}

function SearchLoading() {
  return (
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
      <Card type="dashed">
        <div className="flex min-h-72 items-center justify-center">
          <Loading active />
        </div>
      </Card>
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
