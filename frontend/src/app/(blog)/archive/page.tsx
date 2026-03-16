"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Archive, ChevronDown, ChevronRight } from "lucide-react";
import { archiveApi } from "@/lib/api";
import type { ArchiveMonth, ArchiveResponse, ArchiveYear } from "@/types";

export default function ArchivePage() {
    const [data, setData] = useState<ArchiveResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await archiveApi.list();
            setData(result);
            if (result.years.length > 0) {
                setExpandedYears(new Set([result.years[0].year]));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleYear = (year: number) => {
        setExpandedYears((prev) => {
            const next = new Set(prev);
            if (next.has(year)) next.delete(year);
            else next.add(year);
            return next;
        });
    };

    const toggleMonth = (year: number, month: number) => {
        const key = `${year}-${month}`;
        setExpandedMonths((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const formatMonth = (month: number) => `${month} 月`;
    const formatDate = (input: string) =>
        new Date(input).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }).replace(/\//g, "-");

    return (
        <main className="island-main">
            <div className="island-container island-page">
                <section className="island-panel px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="island-section-title">时间归档</h1>
                            <p className="island-subtle mt-2">按年份与月份回看全部内容。</p>
                        </div>
                        <span className="island-chip">{data?.total || 0} 篇文章</span>
                    </div>
                </section>

                {loading ? (
                    <div className="island-grid">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="island-panel island-skeleton h-28" />
                        ))}
                    </div>
                ) : !data || data.years.length === 0 ? (
                    <section className="island-panel p-10 text-center">
                        <Archive className="mx-auto h-10 w-10 text-[var(--is-text-faint)]" />
                        <p className="mt-3 text-sm text-[var(--is-text-muted)]">暂无归档内容</p>
                    </section>
                ) : (
                    <section className="island-grid">
                        {data.years.map((yearData) => (
                            <YearBlock
                                key={yearData.year}
                                yearData={yearData}
                                isExpanded={expandedYears.has(yearData.year)}
                                expandedMonths={expandedMonths}
                                onToggleYear={() => toggleYear(yearData.year)}
                                onToggleMonth={(month) => toggleMonth(yearData.year, month)}
                                formatMonth={formatMonth}
                                formatDate={formatDate}
                            />
                        ))}
                    </section>
                )}
            </div>
        </main>
    );
}

function YearBlock({
    yearData,
    isExpanded,
    expandedMonths,
    onToggleYear,
    onToggleMonth,
    formatMonth,
    formatDate,
}: {
    yearData: ArchiveYear;
    isExpanded: boolean;
    expandedMonths: Set<string>;
    onToggleYear: () => void;
    onToggleMonth: (month: number) => void;
    formatMonth: (month: number) => string;
    formatDate: (input: string) => string;
}) {
    return (
        <div className="island-panel overflow-hidden">
            <button
                className="flex w-full items-center justify-between px-5 py-4 text-left island-focus-ring"
                onClick={onToggleYear}
                type="button"
            >
                <span className="flex items-center gap-2 text-[var(--is-text)]">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <strong>{yearData.year} 年</strong>
                </span>
                <span className="island-chip">{yearData.count} 篇</span>
            </button>
            {isExpanded && (
                <div className="border-t border-[var(--is-border)] px-4 py-3">
                    <div className="grid gap-3">
                        {yearData.months.map((monthData) => (
                            <MonthBlock
                                key={monthData.month}
                                monthData={monthData}
                                isExpanded={expandedMonths.has(`${yearData.year}-${monthData.month}`)}
                                onToggle={() => onToggleMonth(monthData.month)}
                                formatMonth={formatMonth}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MonthBlock({
    monthData,
    isExpanded,
    onToggle,
    formatMonth,
    formatDate,
}: {
    monthData: ArchiveMonth;
    isExpanded: boolean;
    onToggle: () => void;
    formatMonth: (month: number) => string;
    formatDate: (input: string) => string;
}) {
    return (
        <div className="rounded-xl border border-[var(--is-border)] bg-[var(--is-surface-soft)]">
            <button
                className="flex w-full items-center justify-between px-4 py-3 text-left island-focus-ring"
                onClick={onToggle}
                type="button"
            >
                <span className="flex items-center gap-2 text-sm text-[var(--is-text-muted)]">
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {formatMonth(monthData.month)}
                </span>
                <span className="text-xs text-[var(--is-text-faint)]">{monthData.count} 篇</span>
            </button>

            {isExpanded && (
                <ul className="grid gap-1 border-t border-[var(--is-border)] p-2">
                    {monthData.blogs.map((blog) => (
                        <li key={blog.id}>
                            <Link
                                href={blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`}
                                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-[var(--is-text-muted)] transition hover:bg-[var(--is-surface)] hover:text-[var(--is-text)] island-focus-ring"
                            >
                                <span className="text-xs text-[var(--is-text-faint)]">{formatDate(blog.created_at)}</span>
                                <span className="truncate">{blog.title}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
