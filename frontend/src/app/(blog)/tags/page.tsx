"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Loading, Table } from "@/lib/animal-ui";
import { categoryApi, tagApi } from "@/lib/api";
import type { Category, Tag } from "@/types";
import { IslandPageHeader, IslandSidebar } from "@/components/blog/island";

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tagData, categoryData] = await Promise.all([tagApi.list(), categoryApi.list()]);
      setTags(tagData);
      setCategories(categoryData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedTags = useMemo(
    () => tags.slice().sort((a, b) => (b.blog_count || 0) - (a.blog_count || 0)),
    [tags],
  );
  const totalBlogRefs = tags.reduce((sum, item) => sum + (item.blog_count || 0), 0);

  return (
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
      <IslandPageHeader
        eyebrow="标签索引"
        chips={["按关键词浏览", "保留频率排序"]}
        title="按关键词查看全部标签。"
        description="标签按文章关联次数整理，适合从关键词快速进入相关内容。"
        stats={[
          { label: "Tags", value: tags.length, description: "当前标签数量" },
          { label: "Matches", value: totalBlogRefs, description: "文章关联次数" },
          { label: "Categories", value: categories.length, description: "可切换浏览分类" },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          {loading ? (
            <Card type="dashed"><div className="flex min-h-72 items-center justify-center"><Loading active /></div></Card>
          ) : tags.length === 0 ? (
            <Card type="dashed"><div className="grid justify-items-center gap-3 py-10"><Icon name="icon-chat" size={54} bounce /><p>暂无标签</p></div></Card>
          ) : (
            <>
              <Card type="title">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-black">标签概览</h2>
                  <span className="font-bold">共 {tags.length} 个标签 · 累计 {totalBlogRefs} 次关联</span>
                </div>
              </Card>

              <Card>
                <div className="flex flex-wrap gap-2">
                  {sortedTags.map((tag) => (
                    <Button key={tag.id} type="dashed" size="small" onClick={() => router.push(`/tag/${tag.id}`)}>
                      #{tag.name} ({tag.blog_count || 0})
                    </Button>
                  ))}
                </div>
              </Card>

              <Table
                striped
                rowKey="id"
                dataSource={sortedTags as unknown as Record<string, unknown>[]}
                columns={[
                  {
                    title: "标签",
                    dataIndex: "name",
                    render: (value, record) => (
                      <Button type="text" size="small" onClick={() => router.push(`/tag/${record.id}`)}>
                        #{String(value)}
                      </Button>
                    ),
                  },
                  { title: "文章数量", dataIndex: "blog_count", align: "right" },
                ]}
              />
            </>
          )}
        </div>

        <IslandSidebar categories={categories} tags={tags} title="分类导航" />
      </section>
    </main>
  );
}
