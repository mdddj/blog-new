import type { Metadata } from "next";
import { categoryApi, tagApi } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";
import { CategoriesClient } from "./categories-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "文章分类",
  description: "按主题浏览梁典典博客中的技术文章与实践记录。",
  alternates: { canonical: absoluteUrl("/categories") },
};

export default async function CategoriesPage() {
  const [categories, tags] = await Promise.all([categoryApi.list(), tagApi.list()]);
  return <CategoriesClient categories={categories} tags={tags} />;
}
