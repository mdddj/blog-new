"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, FileText } from "lucide-react";
import { archiveApi } from "@/lib/api";
import type { ArchiveMonth, ArchiveResponse, ArchiveYear } from "@/types";
import { cn } from "@/lib/utils";
import { EmptyState, LoadingState, PageHero, PublicCard, PUBLIC_CONTAINER, formatDate } from "@/components/blog/public";

function formatDay(input: string) {
  return formatDate(input, { month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
}

export default function ArchivePage() {
  const [data, setData] = useState<ArchiveResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setData(await archiveApi.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
      <PageHero
        eyebrow="Archive"
        title="按时间回看全部内容"
        description="所有公开文章按年份与月份整理，适合快速定位曾经发布过的内容。"
        stats={[{ label: "Posts", value: data?.total || 0, description: "归档文章" }]}
      />

      {loading ? (
        <LoadingState label="正在加载归档" />
      ) : !data || data.years.length === 0 ? (
        <EmptyState title="暂无归档内容" description="发布文章后会在这里生成时间索引。" icon={<FileText className="h-6 w-6" />} />
      ) : (
        <section className="grid min-w-0 gap-4">
          {data.years.map((yearData, index) => (
            <YearBlock key={yearData.year} yearData={yearData} defaultExpanded={index === 0} />
          ))}
        </section>
      )}
    </main>
  );
}

function YearBlock({ yearData, defaultExpanded }: { yearData: ArchiveYear; defaultExpanded: boolean }) {
  return (
    <details
      open={defaultExpanded}
      className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none"
    >
      <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-4">
        <span className="inline-flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
          <CalendarDays className="h-5 w-5 text-slate-500" />
          {yearData.year} 年
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          {yearData.count} 篇
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </span>
      </summary>
      <div className="mt-5 grid min-w-0 gap-3">
        {yearData.months.map((monthData) => (
          <MonthBlock key={monthData.month} monthData={monthData} />
        ))}
      </div>
    </details>
  );
}

function MonthBlock({ monthData }: { monthData: ArchiveMonth }) {
  const router = useRouter();

  return (
    <PublicCard className="grid min-w-0 gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-semibold text-slate-950 dark:text-white">{monthData.month} 月</div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{monthData.count} 篇</span>
      </div>
      <div className="grid gap-1">
        {monthData.blogs.map((blog) => (
          <button
            key={blog.id}
            type="button"
            className="flex min-w-0 items-center justify-between gap-4 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-900"
            onClick={() => router.push(blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`)}
          >
            <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">{blog.title}</span>
            <span className="shrink-0 text-xs text-slate-400">{formatDay(blog.created_at)}</span>
          </button>
        ))}
      </div>
    </PublicCard>
  );
}
