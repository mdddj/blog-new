"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { directoryApi } from "@/lib/api";
import type { DirectoryTreeNode } from "@/types";
import { EmptyState, LoadingState, PUBLIC_CONTAINER } from "@/components/blog/public";
import { cn } from "@/lib/utils";

function findFirstDocument(nodes: DirectoryTreeNode[]): { id: number } | null {
  for (const node of nodes) {
    if (node.documents?.length) return { id: node.documents[0].id };
    if (node.children?.length) {
      const found = findFirstDocument(node.children);
      if (found) return found;
    }
  }
  return null;
}

export default function DocsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function boot() {
      try {
        const tree = await directoryApi.getTree();
        const first = findFirstDocument(tree);
        if (first) {
          router.replace(`/docs/${first.id}`);
          return;
        }
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, [router]);

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
      {loading ? (
        <LoadingState label="正在加载文档库" />
      ) : (
        <EmptyState title="文档库为空" description="当前没有可阅读文档。" icon={<BookOpen className="h-6 w-6" />} />
      )}
    </main>
  );
}
