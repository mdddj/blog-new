import type { Metadata } from "next";
import { archiveApi } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";
import { ArchiveClient } from "./archive-client";
export const metadata: Metadata = {
  title: "文章归档",
  description: "按年份和月份浏览梁典典博客中的全部公开文章。",
  alternates: { canonical: absoluteUrl("/archive") },
};

export default async function ArchivePage() {
  let data = null;
  try {
    data = await archiveApi.list();
  } catch (error) {
    console.error("Failed to fetch archive data:", error);
  }

  return <ArchiveClient data={data} />;
}
