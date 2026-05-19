"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Loading } from "@/lib/animal-ui";
import { categoryApi, tagApi } from "@/lib/api";
import type { Category, Tag } from "@/types";
import { IslandPageHeader, IslandSidebar } from "@/components/blog/island";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoryData, tagData] = await Promise.all([categoryApi.list(), tagApi.list()]);
      setCategories(categoryData);
      setTags(tagData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalBlogs = categories.reduce((sum, item) => sum + (item.blog_count || 0), 0);

  return (
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
      <IslandPageHeader
        eyebrow="分类索引"
        chips={["按主题浏览", "直接进入文章"]}
        title="按主题查看全部分类。"
        description="每个分类都直接对应一组文章入口，适合从主题而不是时间开始浏览。"
        stats={[
          { label: "Categories", value: categories.length, description: "当前分类数量" },
          { label: "Posts", value: totalBlogs, description: "已收录文章" },
          { label: "Tags", value: tags.length, description: "可交叉浏览标签" },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <Card type="title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black">全部分类</h2>
              <span className="font-bold">共 {categories.length} 个分类 · 累计 {totalBlogs} 篇文章</span>
            </div>
          </Card>

          {loading ? (
            <Card type="dashed"><div className="flex min-h-72 items-center justify-center"><Loading active /></div></Card>
          ) : categories.length === 0 ? (
            <Card type="dashed"><div className="grid justify-items-center gap-3 py-10"><Icon name="icon-map" size={54} bounce /><p>还没有可展示的分类。</p></div></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id}>
                  <article className="grid gap-3">
                    <div className="flex items-center gap-3">
                      {category.logo ? (
                        <div className="relative h-14 w-14 overflow-hidden rounded-[20px] bg-[#f0e8d8]">
                          <Image src={category.logo} alt={category.name} fill sizes="56px" className="object-contain p-2" />
                        </div>
                      ) : (
                        <Icon name="icon-map" size={54} bounce />
                      )}
                      <div>
                        <h3 className="text-lg font-black">{category.name}</h3>
                        <p className="text-sm">{category.blog_count || 0} 篇文章</p>
                      </div>
                    </div>
                    {category.intro ? <p className="line-clamp-3 text-sm leading-7">{category.intro}</p> : null}
                    <Button type="primary" size="small" onClick={() => router.push(`/category/${category.id}`)}>
                      查看分类
                    </Button>
                  </article>
                </Card>
              ))}
            </div>
          )}
        </div>

        <IslandSidebar categories={categories} tags={tags} title="分类导航" />
      </section>
    </main>
  );
}
