"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { searchApi } from "@/lib/api";
import type { PaginatedResponse, SearchResult } from "@/types";
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

    return (
        <main className="island-main">
            <div className="island-container island-page">
                <section className="island-panel px-6 py-5">
                    <h1 className="island-section-title">站内搜索</h1>
                    <p className="island-subtle mt-2">输入关键词，在整座博客群岛内快速定位内容。</p>

                    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
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
                </section>

                {loading ? (
                    <div className="grid gap-3">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="island-panel island-skeleton h-28" />
                        ))}
                    </div>
                ) : searched ? (
                    results.length > 0 ? (
                        <section className="island-grid">
                            <div className="island-panel px-5 py-4">
                                <p className="text-sm text-[var(--is-text-muted)]">
                                    找到 <strong className="text-[var(--is-text)]">{pagination.total}</strong> 条结果
                                </p>
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
                            没有匹配内容，试试更通用的关键词。
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
                <div className="island-panel island-skeleton h-36" />
                <div className="island-panel island-skeleton h-56" />
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
