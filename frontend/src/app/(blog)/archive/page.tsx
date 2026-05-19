"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Collapse, Divider, Icon, Loading } from "@/lib/animal-ui";
import { archiveApi } from "@/lib/api";
import type { ArchiveMonth, ArchiveResponse, ArchiveYear } from "@/types";

function formatDate(input: string) {
  return new Date(input).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
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
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
      <Card color="app-yellow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm font-black">
              <Icon name="icon-map" size={24} bounce />
              时间归档
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">按年份与月份回看全部内容。</h1>
            <p className="max-w-3xl leading-8">所有公开文章保持原有时间线，只把折叠浏览换成 Animal Island 的温暖卡片。</p>
          </div>
          <Card>
            <div className="text-sm font-black uppercase tracking-wide">Posts</div>
            <div className="mt-1 text-3xl font-black">{data?.total || 0}</div>
            <div className="mt-1 text-sm">篇文章</div>
          </Card>
        </div>
      </Card>

      {loading ? (
        <Card type="dashed">
          <div className="flex min-h-72 items-center justify-center">
            <Loading active />
          </div>
        </Card>
      ) : !data || data.years.length === 0 ? (
        <Card type="dashed">
          <div className="grid justify-items-center gap-3 py-10">
            <Icon name="icon-chat" size={54} bounce />
            <p>暂无归档内容</p>
          </div>
        </Card>
      ) : (
        <section className="grid gap-4">
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
    <Collapse
      defaultExpanded={defaultExpanded}
      question={
        <span className="flex w-full flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-black">
            <Icon name="icon-critterpedia" size={22} bounce />
            {yearData.year} 年
          </span>
          <span className="text-sm font-bold">{yearData.count} 篇</span>
        </span>
      }
      answer={
        <div className="grid gap-3 py-2">
          {yearData.months.map((monthData) => (
            <MonthBlock key={monthData.month} monthData={monthData} />
          ))}
        </div>
      }
    />
  );
}

function MonthBlock({ monthData }: { monthData: ArchiveMonth }) {
  const router = useRouter();

  return (
    <Card>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-black">
            <Icon name="icon-camera" size={20} />
            {monthData.month} 月
          </div>
          <span className="text-sm">{monthData.count} 篇</span>
        </div>
        <Divider type="line-teal" />
        <div className="grid gap-2">
          {monthData.blogs.map((blog) => (
            <Button
              key={blog.id}
              type="text"
              block
              onClick={() => router.push(blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`)}
            >
              <span className="flex w-full items-center justify-between gap-3 text-left">
                <span className="truncate">{blog.title}</span>
                <span className="shrink-0 text-xs">{formatDate(blog.created_at)}</span>
              </span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
