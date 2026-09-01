import type { Metadata } from "next";
import { categoryApi, tagApi } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";
import { TagsClient } from "./tags-client";

export const metadata: Metadata = {
  title: "文章标签",
  description: "按关键词浏览梁典典博客中的相关文章与实践记录。",
  alternates: { canonical: absoluteUrl("/tags") },
};

export default async function TagsPage() {
  const [tags, categories] = await Promise.all([tagApi.list(), categoryApi.list()]);
  return <TagsClient tags={tags} categories={categories} />;
}
