"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { searchApi } from "@/lib/api";
import type { PaginatedResponse, SearchResult } from "@/types";
import { IslandPageHeader } from "@/components/blog/island";
import { Pagination } from "@/components/blog/pagination";

function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
    if (!keyword.trim()) return <>{text}</>;
    const escaped = escapeRegex(keyword);
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return (
        <>
            {parts.map((part, idx) =>
                part.toLowerCase() === keyword.toLowerCase() ? (
                    <mark key={idx} className="rounded bg-[var(--is-primary-soft)] px-0.5 text-[var(--is-primary)]">
                        {part}
                    </mark>
                ) : (
                    <span key={idx}>{part}</span>
                )
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            router.push(`/search?q=${encodeURIComponent(input.trim())}`);
        }
    };

    const headerStats = queryParam
        ? [
            {
                label: "Keyword",
                value: <span className="line-clamp-1 text-xl sm:text-2xl">{queryParam}</span>,
                description: "当前关键词",
            },
            {
                label: "Results",
                value: pagination.total,
                description: "匹配内容数",
            },
            {
                label: "Page",
                value: (
                    <>
                        {currentPage}
                        <span className="text-base text-[var(--is-text-faint)]">
                            /{Math.max(1, pagination.totalPages)}
                        </span>
                    </>
                ),
                description: "当前页码",
            },
        ]
        : [
            {
                label: "Search",
                value: "全站",
                description: "标题与正文均参与匹配",
            },
            {
                label: "Status",
                value: "待输入",
                description: "提交关键词后显示结果",
            },
        ];

    return (
        <main className="island-main">
            <div className="island-container island-page">
                <IslandPageHeader
                    eyebrow="内容搜索"
                    chips={[queryParam ? "已提交关键词" : "输入关键词后开始"]}
                    title={queryParam ? `搜索 “${queryParam}”` : "搜索文章与笔记"}
                    description={
                        queryParam
                            ? "结果会按相关文章直接展开，你可以继续换词缩小范围。"
                            : "直接检索文章标题、摘要和正文内容。"
                    }
                    stats={headerStats}
                >
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--is-text-faint)]" />
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="输入关键词，例如：Rust、架构、读书笔记..."
                                className="island-focus-ring h-11 w-full rounded-xl border border-[var(--is-border)] bg-[var(--is-surface)] pl-10 pr-3 text-sm text-[var(--is-text)] placeholder:text-[var(--is-text-faint)]"
                            />
                        </div>
                        <button
                            type="submit"
                            className="island-focus-ring inline-flex h-11 items-center justify-center rounded-xl border border-[var(--is-border-strong)] bg-[var(--is-primary-soft)] px-5 text-sm text-[var(--is-primary)] transition hover:opacity-85"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "搜索"}
                        </button>
                    </form>
                </IslandPageHeader>

                {loading ? (
                    <div className="grid gap-3">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="island-panel island-skeleton h-28" />
                        ))}
                    </div>
                ) : searched ? (
                    results.length > 0 ? (
                        <section className="island-grid">
                            <div className="island-panel-soft px-5 py-4 sm:px-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--is-text-faint)]">
                                            Search Results
                                        </p>
                                        <h2 className="mt-2 island-section-title">搜索结果</h2>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="island-chip">共 {pagination.total} 条结果</span>
                                        <span className="island-chip">当前第 {currentPage} 页</span>
                                    </div>
                                </div>
                            </div>

                            <div className="island-grid">
                                {results.map((item) => (
                                    <article key={item.id} className="island-card p-4 sm:p-5">
                                        <h2 className="font-[var(--is-font-title)] text-lg text-[var(--is-text)]">
                                            <Link href={item.slug ? `/blog/${item.slug}` : `/blog/${item.id}`} className="island-focus-ring">
                                                <HighlightText text={item.title} keyword={queryParam} />
                                            </Link>
                                        </h2>
                                        <p className="mt-2 text-sm leading-7 text-[var(--is-text-muted)] line-clamp-3">
                                            <HighlightText text={item.content_snippet || ""} keyword={queryParam} />
                                        </p>
                                        <p className="mt-3 text-xs text-[var(--is-text-faint)]">
                                            {new Date(item.created_at).toLocaleDateString("zh-CN")}
                                        </p>
                                    </article>
                                ))}
                            </div>

                            {pagination.totalPages > 1 && (
                                <div className="island-panel px-4 py-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={pagination.totalPages}
                                        onPageChange={(page) => router.push(`/search?q=${encodeURIComponent(queryParam)}&page=${page}`)}
                                    />
                                </div>
                            )}
                        </section>
                    ) : (
                        <div className="island-panel p-10 text-center text-sm text-[var(--is-text-muted)]">
                            没有找到相关内容，换个更通用的关键词再试一次。
                        </div>
                    )
                ) : (
                    <div className="island-panel p-10 text-center text-sm text-[var(--is-text-muted)]">
                        输入关键词后开始搜索。
                    </div>
                )}
            </div>
        </main>
    );
}

function Loading() {
    return (
        <main className="island-main">
            <div className="island-container island-page">
                <div className="island-panel island-skeleton h-[220px]" />
                <div className="grid gap-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="island-panel island-skeleton h-28" />
                    ))}
                </div>
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<Loading />}>
            <SearchContent />
        </Suspense>
    );
}
