"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText } from "lucide-react";
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
        <main className="island-main">
            <div className="island-container island-page">
                {loading ? (
                    <div className="island-panel island-skeleton h-64" />
                ) : (
                    <section className="island-panel p-10 text-center">
                        <BookOpenText className="mx-auto h-10 w-10 text-[var(--is-text-faint)]" />
                        <h1 className="mt-3 font-[var(--is-font-title)] text-xl text-[var(--is-text)]">文档库为空</h1>
                        <p className="mt-2 text-sm text-[var(--is-text-muted)]">当前没有可阅读文档。</p>
                    </section>
                )}
            </div>
        </main>
    );
}
