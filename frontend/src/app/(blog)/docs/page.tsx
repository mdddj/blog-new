"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { directoryApi } from "@/lib/api";
import type { DirectoryTreeNode } from "@/types";
import { Terminal } from "lucide-react";

export default function DocsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const findFirstDocument = async () => {
            try {
                const tree = await directoryApi.getTree();
                const firstDoc = findFirstDocumentInTree(tree);
                if (firstDoc) {
                    router.replace(`/docs/${firstDoc.id}`);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Failed to fetch directory tree:", error);
                setIsLoading(false);
            }
        };

        findFirstDocument();
    }, [router]);

    if (isLoading) {
        return (
            <main className="cf-main">
                <div className="flex gap-8">
                    <div className="w-64 space-y-4 hidden lg:block">
                        <div className="cf-panel h-full min-h-[500px] animate-pulse">
                            <div className="cf-panel-header bg-(--cf-bg-inset)" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-6">
                        <div className="h-12 bg-(--cf-bg-panel) border border-(--cf-border) animate-pulse" />
                        <div className="h-96 bg-(--cf-bg-panel) border border-(--cf-border) animate-pulse" />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="cf-main flex flex-col items-center justify-center min-h-[60vh]">
            <div className="cf-panel p-12 text-center max-w-lg">
                <Terminal className="h-16 w-16 text-(--cf-text-muted) mx-auto mb-4 opacity-50" />
                <h1 className="font-(--cf-font-display) text-2xl text-(--cf-text) mb-2">
                    KNOWLEDGE_BASE
                </h1>
                <p className="font-mono text-(--cf-text-dim)">
                    {"// SYSTEM_STATUS: EMPTY"}
                    <br />
                    {"// NO_DOCUMENTS_FOUND"}
                </p>
            </div>
        </main>
    );
}

function findFirstDocumentInTree(nodes: DirectoryTreeNode[]): { id: number } | null {
    for (const node of nodes) {
        if (node.documents && node.documents.length > 0) {
            return { id: node.documents[0].id };
        }
        if (node.children && node.children.length > 0) {
            const found = findFirstDocumentInTree(node.children);
            if (found) return found;
        }
    }
    return null;
}
