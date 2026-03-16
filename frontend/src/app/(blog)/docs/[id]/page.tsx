"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { directoryApi, documentApi } from "@/lib/api";
import type { DirectoryTreeNode, DocumentResponse } from "@/types";
import { DocsTreeNav } from "@/components/docs/docs-tree-nav";
import { DocsSearch } from "@/components/docs/docs-search";
import { DocumentContentRenderer } from "@/components/docs/document-content-renderer";
import { cn } from "@/lib/utils";

function extractHeadings(html: string): { id: string; text: string; level: number }[] {
    if (typeof window === "undefined") return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((node, idx) => ({
        id: `heading-${idx}`,
        text: node.textContent || "",
        level: Number(node.tagName.slice(1)),
    }));
}

function addHeadingIds(html: string): string {
    if (typeof window === "undefined") return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((node, idx) => {
        node.id = `heading-${idx}`;
    });
    return doc.body.innerHTML;
}

export default function DocDetailPage() {
    const params = useParams();
    const docId = Number(params.id);

    const [tree, setTree] = useState<DirectoryTreeNode[]>([]);
    const [doc, setDoc] = useState<DocumentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeHeading, setActiveHeading] = useState("");
    const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);

    const tocItems = useMemo(() => (doc?.html ? extractHeadings(doc.html) : []), [doc?.html]);
    const processedHtml = useMemo(() => (doc?.html ? addHeadingIds(doc.html) : ""), [doc?.html]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const [treeData, docData] = await Promise.all([directoryApi.getTree(), documentApi.getById(docId)]);
                setTree(treeData);
                setDoc(docData);
            } catch {
                setError("文档不存在或已删除");
            } finally {
                setLoading(false);
            }
        }
        if (docId) fetchData();
    }, [docId]);

    useEffect(() => {
        if (tocItems.length === 0) return;
        const onScroll = () => {
            const items = tocItems
                .map((item) => ({ id: item.id, el: document.getElementById(item.id) }))
                .filter((item) => Boolean(item.el)) as { id: string; el: HTMLElement }[];
            if (items.length === 0) return;
            let current = items[0].id;
            for (const item of items) {
                if (item.el.getBoundingClientRect().top <= 150) current = item.id;
                else break;
            }
            setActiveHeading(current);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [tocItems]);

    const readingTime = doc ? Math.max(1, Math.ceil(doc.content.length / 700)) : 0;

    if (loading) {
        return (
            <main className="island-main">
                <div className="island-container island-page">
                    <div className="island-panel island-skeleton h-[70vh]" />
                </div>
            </main>
        );
    }

    if (error || !doc) {
        return (
            <main className="island-main">
                <div className="island-container island-page">
                    <section className="island-panel p-10 text-center">
                        <h1 className="font-[var(--is-font-title)] text-xl text-[var(--is-text)]">{error || "无法访问文档"}</h1>
                        <Link href="/docs" className="island-link mt-3 inline-block">
                            返回文档首页
                        </Link>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="island-main">
            <div className="island-container island-page">
                <div className="lg:hidden">
                    <button
                        type="button"
                        className="island-focus-ring island-panel flex w-full items-center justify-between px-4 py-3 text-sm text-[var(--is-text-muted)]"
                        onClick={() => setSidebarOpen((v) => !v)}
                    >
                        文档目录
                        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>

                <section className="grid gap-4 lg:grid-cols-[290px_1fr] xl:grid-cols-[290px_1fr_250px]">
                    <aside
                        className={cn(
                            "hidden lg:block",
                            sidebarOpen &&
                                "fixed inset-0 z-50 block overflow-y-auto bg-[var(--is-bg)] p-4 lg:static lg:p-0"
                        )}
                    >
                        <div className="island-panel max-h-[calc(100vh-8rem)] overflow-hidden">
                            <div className="border-b border-[var(--is-border)] p-4">
                                <h2 className="text-sm font-medium text-[var(--is-text-muted)]">知识目录</h2>
                                <div className="mt-3">
                                    <DocsSearch tree={tree} />
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button type="button" className="island-chip island-focus-ring" onClick={() => setExpandAll(true)}>展开</button>
                                    <button type="button" className="island-chip island-focus-ring" onClick={() => setExpandAll(false)}>收起</button>
                                </div>
                            </div>
                            <div className="max-h-[calc(100vh-18rem)] overflow-y-auto p-3">
                                <DocsTreeNav tree={tree} currentDocId={docId} onNavigate={() => setSidebarOpen(false)} expandAll={expandAll} />
                            </div>
                        </div>
                    </aside>

                    <article className="island-panel overflow-hidden">
                        <header className="border-b border-[var(--is-border)] px-5 py-5 sm:px-8">
                            <h1 className="font-[var(--is-font-title)] text-2xl leading-tight text-[var(--is-text)] sm:text-3xl">
                                {doc.name}
                            </h1>
                            <p className="mt-2 text-xs text-[var(--is-text-faint)]">
                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString("zh-CN") : "未知日期"} · 预计阅读 {readingTime} 分钟
                            </p>
                        </header>

                        <DocumentContentRenderer
                            html={processedHtml}
                            references={doc.references}
                            className="island-content p-5 sm:p-8 prose max-w-none
                                prose-headings:scroll-mt-28 prose-headings:text-[var(--is-text)] prose-headings:font-[var(--is-font-title)]
                                prose-p:text-[var(--is-text-muted)] prose-p:leading-8
                                prose-a:text-[var(--is-primary)] prose-a:no-underline hover:prose-a:underline
                                prose-code:text-[var(--is-accent)] prose-code:before:content-none prose-code:after:content-none
                                prose-pre:rounded-xl prose-pre:border prose-pre:border-[var(--is-border)] prose-pre:bg-[var(--is-surface-soft)]
                                prose-blockquote:border-l-[var(--is-primary)] prose-blockquote:text-[var(--is-text-muted)]
                                prose-th:border prose-th:border-[var(--is-border)] prose-th:bg-[var(--is-surface-soft)] prose-th:px-3 prose-th:py-2
                                prose-td:border prose-td:border-[var(--is-border)] prose-td:px-3 prose-td:py-2"
                        />
                    </article>

                    <aside className="hidden xl:block">
                        {tocItems.length > 0 && (
                            <div className="island-panel island-toc p-4">
                                <h3 className="mb-2 text-sm font-medium text-[var(--is-text-muted)]">目录导航</h3>
                                <nav className="grid gap-1">
                                    {tocItems.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            className={cn("island-toc-link", activeHeading === item.id && "active")}
                                            style={{ paddingLeft: `${0.7 + Math.max(0, item.level - 2) * 0.8}rem` }}
                                        >
                                            {item.text}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        )}
                    </aside>
                </section>
            </div>
        </main>
    );
}
