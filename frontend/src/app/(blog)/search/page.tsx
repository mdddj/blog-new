"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Calendar, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/blog";
import { searchApi } from "@/lib/api";
import type { SearchResult, PaginatedResponse } from "@/types";

// Escape special regex characters
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Highlight matching keywords in text
function HighlightText({ text, keyword }: { text: string; keyword: string }) {
    if (!text) {
        return <span></span>;
    }

    if (!keyword.trim()) {
        return <span>{text}</span>;
    }

    const escaped = escapeRegex(keyword);
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));

    return (
        <span>
            {parts.map((part, index) =>
                part.toLowerCase() === keyword.toLowerCase() ? (
                    <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
                        {part}
                    </mark>
                ) : (
                    <span key={index}>{part}</span>
                )
            )}
        </span>
    );
}

interface SearchResultCardProps {
    result: SearchResult;
    keyword: string;
}

function SearchResultCard({ result, keyword }: SearchResultCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <Card className="transition-all hover:shadow-md">
            <CardHeader className="pb-2">
                <Link
                    href={result.slug ? `/blog/${result.slug}` : `/blog/${result.id}`}
                    className="text-lg font-semibold transition-colors hover:text-primary line-clamp-2"
                >
                    <HighlightText text={result.title} keyword={keyword} />
                </Link>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    <HighlightText text={result.content_snippet || ""} keyword={keyword} />
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(result.created_at)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const queryParam = searchParams.get("q") || "";
    const currentPage = Number(searchParams.get("page")) || 1;
    const pageSize = 10;

    const [searchQuery, setSearchQuery] = useState(queryParam);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const performSearch = useCallback(async (query: string, page: number) => {
        if (!query.trim()) {
            setResults([]);
            setPagination({ total: 0, totalPages: 0 });
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        try {
            const response: PaginatedResponse<SearchResult> = await searchApi.search(
                query,
                page,
                pageSize
            );
            setResults(response.items);
            setPagination({
                total: response.total,
                totalPages: response.total_pages,
            });
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
            setPagination({ total: 0, totalPages: 0 });
        } finally {
            setIsLoading(false);
        }
    }, [pageSize]);

    // Perform search when URL params change
    useEffect(() => {
        setSearchQuery(queryParam);
        if (queryParam) {
            performSearch(queryParam, currentPage);
        } else {
            setResults([]);
            setPagination({ total: 0, totalPages: 0 });
            setHasSearched(false);
        }
    }, [queryParam, currentPage, performSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handlePageChange = (page: number) => {
        router.push(`/search?q=${encodeURIComponent(queryParam)}&page=${page}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Search Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold">搜索文章</h1>
                    <p className="text-muted-foreground">
                        在博客文章中搜索您感兴趣的内容
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="输入关键词搜索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "搜索"
                        )}
                    </Button>
                </form>

                {/* Search Results */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-6 w-3/4" />
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-24" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : hasSearched ? (
                    results.length > 0 ? (
                        <div className="space-y-6">
                            {/* Results Count */}
                            <p className="text-sm text-muted-foreground">
                                找到 <span className="font-medium text-foreground">{pagination.total}</span> 篇相关文章
                            </p>

                            {/* Results List */}
                            <div className="space-y-4">
                                {results.map((result) => (
                                    <SearchResultCard
                                        key={result.id}
                                        result={result}
                                        keyword={queryParam}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center pt-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={pagination.totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 space-y-4">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                            <div className="space-y-2">
                                <p className="text-lg font-medium">未找到相关文章</p>
                                <p className="text-sm text-muted-foreground">
                                    尝试使用其他关键词搜索
                                </p>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="text-center py-12 space-y-4">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div className="space-y-2">
                            <p className="text-lg font-medium">开始搜索</p>
                            <p className="text-sm text-muted-foreground">
                                输入关键词搜索博客文章
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SearchPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <Skeleton className="h-9 w-32 mx-auto" />
                    <Skeleton className="h-5 w-48 mx-auto" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-20" />
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchPageSkeleton />}>
            <SearchPageContent />
        </Suspense>
    );
}
