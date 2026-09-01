import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { directoryApi } from "@/lib/api";
import type { DirectoryTreeNode } from "@/types";
import { EmptyState, PUBLIC_CONTAINER } from "@/components/blog/public";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "技术文档",
  description: "浏览梁典典整理的技术文档、参考资料与实践笔记。",
  alternates: { canonical: absoluteUrl("/docs") },
};

function findFirstDocument(nodes: DirectoryTreeNode[]): number | null {
  for (const node of nodes) {
    if (node.documents?.length) return node.documents[0].id;
    if (node.children?.length) {
      const found = findFirstDocument(node.children);
      if (found) return found;
    }
  }
  return null;
}

export default async function DocsPage() {
  const tree = await directoryApi.getTree();
  const firstDocumentId = findFirstDocument(tree);
  if (firstDocumentId) redirect(`/docs/${firstDocumentId}`);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8 px-4")}>
      <EmptyState
        title="文档库为空"
        description="当前没有可阅读文档。"
        icon={<BookOpen className="h-6 w-6" />}
      />
    </main>
  );
}
