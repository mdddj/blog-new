"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Archive, Calendar, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { archiveApi } from "@/lib/api";
import type { ArchiveResponse, ArchiveYear, ArchiveMonth, ArchiveBlog } from "@/types";

export default function ArchivePage() {
    const [archiveData, setArchiveData] = useState<ArchiveResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

    const fetchArchives = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await archiveApi.list();
            setArchiveData(data);
            // Expand the first year by default
            if (data.years.length > 0) {
                setExpandedYears(new Set([data.years[0].year]));
                // Expand the first month of the first year
                if (data.years[0].months.length > 0) {
                    setExpandedMonths(new Set([`${data.years[0].year}-${data.years[0].months[0].month}`]));
                }
            }
        } catch (error) {
            console.error("Failed to fetch archives:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchArchives();
    }, [fetchArchives]);

    const toggleYear = (year: number) => {
        setExpandedYears((prev) => {
            const next = new Set(prev);
            if (next.has(year)) {
                next.delete(year);
            } else {
                next.add(year);
            }
            return next;
        });
    };

    const toggleMonth = (year: number, month: number) => {
        const key = `${year}-${month}`;
        setExpandedMonths((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const getMonthName = (month: number): string => {
        const monthNames = [
            "一月", "二月", "三月", "四月", "五月", "六月",
            "七月", "八月", "九月", "十月", "十一月", "十二月"
        ];
        return monthNames[month - 1] || `${month}月`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    };

    return (
        <main className="cf-main">
            <div className="cf-section-header">
                <h1 className="cf-section-title">
                    ARCHIVES
                </h1>
                <span className="cf-section-badge">
                    {archiveData?.total || 0} RECS
                </span>
            </div>

            {isLoading ? (
                <ArchiveSkeleton />
            ) : !archiveData || archiveData.years.length === 0 ? (
                <EmptyArchive />
            ) : (
                <div className="space-y-4">
                    {archiveData.years.map((yearData) => (
                        <YearGroup
                            key={yearData.year}
                            yearData={yearData}
                            isExpanded={expandedYears.has(yearData.year)}
                            expandedMonths={expandedMonths}
                            onToggleYear={() => toggleYear(yearData.year)}
                            onToggleMonth={(month) => toggleMonth(yearData.year, month)}
                            getMonthName={getMonthName}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}


interface YearGroupProps {
    yearData: ArchiveYear;
    isExpanded: boolean;
    expandedMonths: Set<string>;
    onToggleYear: () => void;
    onToggleMonth: (month: number) => void;
    getMonthName: (month: number) => string;
    formatDate: (dateStr: string) => string;
}

function YearGroup({
    yearData,
    isExpanded,
    expandedMonths,
    onToggleYear,
    onToggleMonth,
    getMonthName,
    formatDate,
}: YearGroupProps) {
    return (
        <div className="cf-panel bg-(--cf-bg-panel) border border-(--cf-border)">
            <div 
                className="cf-panel-header cursor-pointer hover:bg-(--cf-bg-inset) transition-colors p-3 flex justify-between items-center"
                onClick={onToggleYear}
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-(--cf-amber)" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-(--cf-text-dim)" />
                    )}
                    <Calendar className="h-4 w-4 text-(--cf-amber)" />
                    <span className="font-(--cf-font-display) text-lg font-bold tracking-widest text-(--cf-text)">
                        {yearData.year}
                    </span>
                </div>
                <div className="cf-tag">
                    {yearData.count} POSTS
                </div>
            </div>
            {isExpanded && (
                <div className="p-4 border-t border-(--cf-border)">
                    <div className="space-y-4">
                        {yearData.months.map((monthData) => (
                            <MonthGroup
                                key={monthData.month}
                                monthData={monthData}
                                isExpanded={expandedMonths.has(`${yearData.year}-${monthData.month}`)}
                                onToggle={() => onToggleMonth(monthData.month)}
                                getMonthName={getMonthName}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface MonthGroupProps {
    monthData: ArchiveMonth;
    isExpanded: boolean;
    onToggle: () => void;
    getMonthName: (month: number) => string;
    formatDate: (dateStr: string) => string;
}

function MonthGroup({
    monthData,
    isExpanded,
    onToggle,
    getMonthName,
    formatDate,
}: MonthGroupProps) {
    return (
        <div className="border border-(--cf-border) bg-(--cf-bg-inset)">
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-(--cf-bg-elevated) transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-(--cf-text-dim)" />
                    ) : (
                        <ChevronRight className="h-3 w-3 text-(--cf-text-dim)" />
                    )}
                    <span className="font-mono text-sm text-(--cf-text) uppercase tracking-wide">
                        {getMonthName(monthData.month)}
                    </span>
                </div>
                <span className="text-xs font-mono text-(--cf-text-muted)">
                    {monthData.count} ITEMS
                </span>
            </div>
            {isExpanded && monthData.blogs.length > 0 && (
                <div className="border-t border-(--cf-border) p-2">
                    <ul className="space-y-1">
                        {monthData.blogs.map((blog) => (
                            <BlogItem key={blog.id} blog={blog} formatDate={formatDate} />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

interface BlogItemProps {
    blog: ArchiveBlog;
    formatDate: (dateStr: string) => string;
}

function BlogItem({ blog, formatDate }: BlogItemProps) {
    const href = blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`;

    return (
        <li className="group">
            <Link
                href={href}
                className="flex items-center gap-3 p-2 hover:bg-(--cf-bg-elevated) transition-colors"
            >
                <span className="text-xs font-mono text-(--cf-text-muted) whitespace-nowrap border-r border-(--cf-border) pr-3">
                    {formatDate(blog.created_at)}
                </span>
                <span className="text-sm font-mono text-(--cf-text-dim) group-hover:text-(--cf-amber) transition-colors truncate">
                    {blog.title}
                </span>
            </Link>
        </li>
    );
}

function EmptyArchive() {
    return (
        <div className="cf-panel p-12 text-center">
            <Archive className="h-16 w-16 text-(--cf-text-muted) mx-auto mb-4 opacity-50" />
            <p className="font-mono text-(--cf-text-dim)">NO_DATA_FOUND</p>
        </div>
    );
}

function ArchiveSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="cf-panel border border-(--cf-border) bg-(--cf-bg-panel)">
                    <div className="cf-panel-header p-3 flex justify-between">
                        <div className="h-6 w-32 bg-(--cf-bg-elevated) animate-pulse rounded" />
                        <div className="h-5 w-16 bg-(--cf-bg-elevated) animate-pulse rounded" />
                    </div>
                    <div className="p-4 border-t border-(--cf-border)">
                        <div className="space-y-3">
                            <div className="h-10 w-full bg-(--cf-bg-inset) animate-pulse rounded" />
                            <div className="h-10 w-full bg-(--cf-bg-inset) animate-pulse rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
