"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Divider, Icon, Loading } from "@/lib/animal-ui";
import { directoryApi, documentApi } from "@/lib/api";
import type { DirectoryTreeNode, DocumentResponse } from "@/types";
import { DocsTreeNav } from "@/components/docs/docs-tree-nav";
import { DocsSearch } from "@/components/docs/docs-search";
import { DocumentContentRenderer } from "@/components/docs/document-content-renderer";

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
      <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
        <Card type="dashed">
          <div className="flex min-h-[70vh] items-center justify-center">
            <Loading active />
          </div>
        </Card>
      </main>
    );
  }

  if (error || !doc) {
    return (
      <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-6 py-6">
        <Card type="dashed">
          <div className="grid justify-items-center gap-3 py-12 text-center">
            <Icon name="icon-chat" size={58} bounce />
            <h1 className="text-2xl font-black">{error || "无法访问文档"}</h1>
            <Button type="primary" onClick={() => router.push("/docs")}>
              返回文档首页
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const treePanel = (
    <Card>
      <div className="grid gap-4">
        <div className="flex items-center gap-2 font-black">
          <Icon name="icon-critterpedia" size={22} bounce />
          知识目录
        </div>
        <DocsSearch tree={tree} />
        <div className="flex flex-wrap gap-2">
          <Button type="dashed" size="small" onClick={() => setExpandAll(true)}>
            展开
          </Button>
          <Button type="dashed" size="small" onClick={() => setExpandAll(false)}>
            收起
          </Button>
        </div>
        <Divider type="line-brown" />
        <div className="max-h-[calc(100vh-21rem)] overflow-y-auto pr-1">
          <DocsTreeNav tree={tree} currentDocId={docId} onNavigate={() => setSidebarOpen(false)} expandAll={expandAll} />
        </div>
      </div>
    </Card>
  );

  return (
    <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] min-w-0 gap-6 py-6">
      <div className="lg:hidden">
        <Button block type="primary" icon={<Icon name="icon-map" size={18} />} onClick={() => setSidebarOpen((value) => !value)}>
          {sidebarOpen ? "收起文档目录" : "打开文档目录"}
        </Button>
      </div>

      {sidebarOpen ? <div className="lg:hidden">{treePanel}</div> : null}

      <section className="grid min-w-0 gap-4 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_250px]">
        <aside className="hidden lg:sticky lg:top-[6.6rem] lg:block lg:self-start">{treePanel}</aside>

        <article className="grid min-w-0 gap-4">
          <Card color="app-yellow" className="min-w-0 overflow-hidden">
            <header className="grid gap-3">
              <div className="flex items-center gap-2 text-sm font-black">
                <Icon name="icon-critterpedia" size={22} bounce />
                文档阅读
              </div>
              <h1 className="break-words text-3xl font-black leading-tight sm:text-4xl">{doc.name}</h1>
              <p className="text-sm">
                {doc.created_at ? new Date(doc.created_at).toLocaleDateString("zh-CN") : "未知日期"} · 预计阅读 {readingTime} 分钟
              </p>
            </header>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <DocumentContentRenderer
              html={processedHtml}
              references={doc.references}
              className="prose min-w-0 max-w-none overflow-x-auto break-words p-1 prose-headings:scroll-mt-28 prose-p:leading-8 prose-a:no-underline hover:prose-a:underline prose-code:break-words prose-code:before:content-none prose-code:after:content-none prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-blockquote:not-italic"
            />
          </Card>
        </article>

        <aside className="hidden xl:block">
          {tocItems.length > 0 ? (
            <Card>
              <div className="grid gap-3">
                <div className="flex items-center gap-2 font-black">
                  <Icon name="icon-map" size={22} bounce />
                  目录导航
                </div>
                <Divider type="line-teal" />
                <nav className="grid gap-1">
                  {tocItems.map((item) => (
                    <Button
                      key={item.id}
                      type={activeHeading === item.id ? "primary" : "text"}
                      size="small"
                      block
                      onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                      <span className="block truncate text-left" style={{ paddingLeft: `${Math.max(0, item.level - 2) * 0.7}rem` }}>
                        {item.text}
                      </span>
                    </Button>
                  ))}
                </nav>
              </div>
            </Card>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
