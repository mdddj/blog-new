"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Icon, Loading } from "@/lib/animal-ui";
import { directoryApi } from "@/lib/api";
import type { DirectoryTreeNode } from "@/types";

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
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
      {loading ? (
        <Card type="dashed">
          <div className="flex min-h-72 items-center justify-center">
            <Loading active />
          </div>
        </Card>
      ) : (
        <Card type="dashed">
          <div className="grid justify-items-center gap-3 py-12 text-center">
            <Icon name="icon-critterpedia" size={58} bounce />
            <h1 className="text-2xl font-black">文档库为空</h1>
            <p>当前没有可阅读文档。</p>
          </div>
        </Card>
      )}
    </main>
  );
}
