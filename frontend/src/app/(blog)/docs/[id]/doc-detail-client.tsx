"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, Clock3, FileText, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { directoryApi, documentApi } from "@/lib/api";
import type { DirectoryTreeNode, DocumentResponse } from "@/types";
import { DocsTreeNav } from "@/components/docs/docs-tree-nav";
import { DocsSearch } from "@/components/docs/docs-search";
import { DocumentContentRenderer } from "@/components/docs/document-content-renderer";
import { EmptyState, LoadingState, PublicCard, PUBLIC_CONTAINER, TextButton, formatDate } from "@/components/blog/public";
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

export function DocDetailClient({ docId }: { docId: number }) {
  const router = useRouter();
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
      if (!Number.isFinite(docId) || docId <= 0) {
        setDoc(null);
        setError("文档不存在或已删除");
        setLoading(false);
        return;
      }

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

    fetchData();
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
      <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
        <LoadingState label="正在加载文档" />
      </main>
    );
  }

  if (error || !doc) {
    return (
      <main className={cn(PUBLIC_CONTAINER, "grid gap-6 py-8")}>
        <EmptyState title={error || "无法访问文档"} description="返回文档首页继续浏览。" icon={<FileText className="h-6 w-6" />} />
        <div className="flex justify-center">
          <TextButton variant="primary" onClick={() => router.push("/docs")}>
            返回文档首页
          </TextButton>
        </div>
      </main>
    );
  }

  const treePanel = (
    <PublicCard className="grid gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
          <BookOpen className="h-4 w-4" />
          知识目录
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
          onClick={() => setExpandAll((value) => (value === true ? false : true))}
        >
          {expandAll ? "收起" : "展开"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition", expandAll && "rotate-180")} />
        </button>
      </div>
      <DocsSearch tree={tree} />
      <div className="max-h-[calc(100vh-21rem)] overflow-y-auto pr-1">
        <DocsTreeNav tree={tree} currentDocId={docId} onNavigate={() => setSidebarOpen(false)} expandAll={expandAll} />
      </div>
    </PublicCard>
  );

  return (
    <main className={cn(PUBLIC_CONTAINER, "grid min-w-0 gap-6 py-8")}>
      <div className="lg:hidden">
        <TextButton variant="primary" className="w-full" onClick={() => setSidebarOpen((value) => !value)}>
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          {sidebarOpen ? "收起文档目录" : "打开文档目录"}
        </TextButton>
      </div>

      {sidebarOpen ? <div className="lg:hidden">{treePanel}</div> : null}

      <section className="grid min-w-0 gap-5 lg:grid-cols-[290px_minmax(0,760px)] lg:justify-center xl:grid-cols-[290px_minmax(0,760px)_240px]">
        <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">{treePanel}</aside>

        <article className="grid min-w-0 gap-5">
          <header className="grid gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Documentation</div>
            <h1 className="break-words text-4xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white">{doc.name}</h1>
            <p className="inline-flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <span>{doc.created_at ? formatDate(doc.created_at) : "未知日期"}</span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                预计阅读 {readingTime} 分钟
              </span>
            </p>
          </header>

          <PublicCard className="min-w-0 overflow-hidden p-5 sm:p-8">
            <DocumentContentRenderer
              html={processedHtml}
              references={doc.references}
              className="prose min-w-0 max-w-none overflow-x-auto break-words prose-slate dark:prose-invert prose-headings:scroll-mt-28 prose-p:leading-8 prose-a:no-underline hover:prose-a:underline prose-code:break-words prose-code:before:content-none prose-code:after:content-none prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-blockquote:not-italic"
            />
          </PublicCard>
        </article>

        <aside className="hidden xl:block">
          {tocItems.length > 0 ? (
            <PublicCard className="sticky top-28 grid gap-3 p-4">
              <div className="text-sm font-semibold text-slate-950 dark:text-white">目录导航</div>
              <nav className="grid gap-1">
                {tocItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      "truncate rounded-lg px-2 py-1.5 text-left text-sm transition",
                      activeHeading === item.id
                        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
                    )}
                    style={{ paddingLeft: `${Math.max(0, item.level - 2) * 0.75 + 0.5}rem` }}
                    onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            </PublicCard>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
