"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { directoryApi, documentApi } from "@/lib/api";
import type { DirectoryTreeNode, DocumentResponse } from "@/types";
import { DocsTreeNav } from "@/components/docs/docs-tree-nav";
import { DocsSearch } from "@/components/docs/docs-search";
import {
    Calendar,
    Clock,
    Terminal,
    ChevronLeft,
    Menu,
    X,
    Folder,
    FileText,
    List,
    Search,
    Maximize2,
    Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper functions
function extractHeadings(html: string): { id: string; text: string; level: number }[] {
    if (typeof window === "undefined") return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const items: { id: string; text: string; level: number }[] = [];
    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent || "";
        const id = `heading-${index}`;
        items.push({ id, text, level });
    });
    return items;
}

function addHeadingIds(html: string): string {
    if (typeof window === "undefined") return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((heading, index) => {
        heading.id = `heading-${index}`;
    });
    return doc.body.innerHTML;
}

export default function DocDetailPage() {
    const params = useParams();
    const docId = Number(params.id);

    const [tree, setTree] = useState<DirectoryTreeNode[]>([]);
    const [docData, setDocData] = useState<DocumentResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeHeading, setActiveHeading] = useState<string>("");
    const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);

    // Extract TOC items
    const tocItems = useMemo(() => {
        if (!docData?.html) return [];
        return extractHeadings(docData.html);
    }, [docData?.html]);

    // Process HTML
    const processedHtml = useMemo(() => {
        if (!docData?.html) return "";
        return addHeadingIds(docData.html);
    }, [docData?.html]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [treeData, documentData] = await Promise.all([
                    directoryApi.getTree(),
                    documentApi.getById(docId),
                ]);
                setTree(treeData);
                setDocData(documentData);
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("FILE_NOT_FOUND");
            } finally {
                setIsLoading(false);
            }
        };

        if (docId) {
            fetchData();
        }
    }, [docId]);

    // Track active heading
    useEffect(() => {
        if (tocItems.length === 0) return;

        const handleScroll = () => {
            const headerOffset = 100;
            const headingElements = tocItems
                .map((item) => ({
                    id: item.id,
                    element: document.getElementById(item.id),
                }))
                .filter((item) => item.element !== null);

            if (headingElements.length === 0) return;

            let currentActiveId = headingElements[0].id;

            for (const item of headingElements) {
                const rect = item.element!.getBoundingClientRect();
                if (rect.top <= headerOffset + 50) {
                    currentActiveId = item.id;
                } else {
                    break;
                }
            }

            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
                currentActiveId = headingElements[headingElements.length - 1].id;
            }

            setActiveHeading(currentActiveId);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [tocItems]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).replace(/\//g, ".");
    };

    const estimateReadingTime = (content: string) => {
        const text = content.replace(/<[^>]*>/g, "");
        return Math.ceil(text.length / 200);
    };

    if (isLoading) {
        return <DocsPageSkeleton />;
    }

    if (error || !docData) {
        return (
            <div className="cf-panel max-w-2xl mx-auto">
                <div className="cf-panel-header">
                    <Terminal className="w-3.5 h-3.5" />
                    ERROR
                </div>
                <div className="p-12 text-center">
                    <div className="text-(--cf-red) font-mono text-lg mb-4">
                        {error || "FILE_NOT_FOUND"}
                    </div>
                    <Link href="/docs" className="cf-btn-primary inline-flex items-center gap-2 text-xs">
                        <ChevronLeft className="w-3 h-3" />
                        RETURN_TO_BASE
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="docs-page w-full">
            {/* Mobile Header with Toggle */}
            <div className="lg:hidden mb-6 flex items-center justify-between cf-panel p-3">
                <div className="flex items-center gap-2 text-sm font-mono text-(--cf-text-dim)">
                    <Terminal className="w-4 h-4" />
                    DOCS_READER
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="cf-btn-icon w-8 h-8"
                >
                    {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
            </div>

            <div className="grid gap-6 w-full lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_240px]">
                {/* Left Sidebar - Directory Tree */}
                <aside className={cn(
                    "hidden lg:block",
                    sidebarOpen && "fixed inset-0 z-50 block bg-(--cf-bg-deep)"
                )}>
                    <div className={cn(
                        !sidebarOpen && "sticky top-24",
                        sidebarOpen && "h-full p-6 overflow-y-auto"
                    )}>
                        {sidebarOpen && (
                            <div className="flex justify-end mb-6">
                                <button onClick={() => setSidebarOpen(false)} className="cf-btn-icon">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="cf-panel flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden">
                            <div className="cf-panel-header justify-between h-10 min-h-[2.5rem]">
                                <div className="flex items-center gap-2">
                                    <Folder className="w-3.5 h-3.5" />
                                    KNOWLEDGE_BASE
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setExpandAll(true)}
                                        className="p-1 hover:text-(--cf-amber) transition-colors"
                                        title="EXPAND_ALL"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setExpandAll(false)}
                                        className="p-1 hover:text-(--cf-amber) transition-colors"
                                        title="COLLAPSE_ALL"
                                    >
                                        <Minimize2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="mb-4">
                                    <DocsSearch tree={tree} />
                                </div>
                                <div className="text-sm">
                                    {/* We wrap DocsTreeNav to apply some theme specific overrides via CSS if needed */}
                                    <DocsTreeNav
                                        tree={tree}
                                        currentDocId={docId}
                                        onNavigate={() => setSidebarOpen(false)}
                                        expandAll={expandAll}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <article className="min-w-0 flex flex-col">
                    <div className="cf-panel overflow-hidden flex-1 min-h-[calc(100vh-8rem)]">
                        {/* Terminal Header */}
                        <div className="cf-panel-header h-10 min-h-[2.5rem]">
                            <div className="flex items-center gap-2 flex-1">
                                <div className="cf-card-dots">
                                    <span className="cf-card-dot red" />
                                    <span className="cf-card-dot amber" />
                                    <span className="cf-card-dot green" />
                                </div>
                                <span className="text-(--cf-text-muted) text-xs font-mono">
                                    DOC_READER://{docId}.md
                                </span>
                            </div>
                        </div>

                        {/* Title & Meta */}
                        <div className="p-6 border-b border-(--cf-border)">
                            <h1 className="font-(--cf-font-display) text-2xl md:text-3xl text-(--cf-text) mb-4 cf-glitch-hover leading-tight">
                                {docData.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-(--cf-text-muted)">
                                {docData.created_at && (
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(docData.created_at)}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {estimateReadingTime(docData.content)} MIN_READ
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div
                            className="p-6 md:p-8 prose dark:prose-invert max-w-none
                                prose-headings:font-(--cf-font-display) prose-headings:text-(--cf-text)
                                prose-headings:scroll-mt-24
                                prose-h1:text-xl prose-h1:sm:text-2xl prose-h1:border-b prose-h1:border-(--cf-border) prose-h1:pb-2
                                prose-h2:text-lg prose-h2:sm:text-xl prose-h2:text-(--cf-amber) prose-h2:border-l-2 prose-h2:border-(--cf-amber) prose-h2:pl-3
                                prose-h3:text-base prose-h3:sm:text-lg
                                prose-p:text-(--cf-text-dim) prose-p:leading-relaxed prose-p:text-sm prose-p:sm:text-base
                                prose-a:text-(--cf-cyan) prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-(--cf-text)
                                prose-code:text-(--cf-green) prose-code:bg-(--cf-bg-inset) prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                                prose-pre:bg-(--cf-bg-inset) prose-pre:border prose-pre:border-(--cf-border) prose-pre:rounded prose-pre:overflow-x-auto prose-pre:max-w-full
                                prose-blockquote:border-l-(--cf-amber) prose-blockquote:bg-(--cf-bg-inset) prose-blockquote:text-(--cf-text-dim) prose-blockquote:py-2 prose-blockquote:not-italic
                                prose-img:rounded prose-img:border prose-img:border-(--cf-border)
                                prose-ul:text-(--cf-text-dim) prose-ol:text-(--cf-text-dim)
                                prose-li:marker:text-(--cf-amber)
                                prose-hr:border-(--cf-border)
                                prose-table:w-full prose-table:border prose-table:border-(--cf-border) prose-table:border-collapse
                                prose-th:bg-(--cf-bg-elevated) prose-th:border prose-th:border-(--cf-border) prose-th:text-(--cf-text) prose-th:px-3 prose-th:py-2
                                prose-td:border prose-td:border-(--cf-border) prose-td:px-3 prose-td:py-2"
                            dangerouslySetInnerHTML={{ __html: processedHtml }}
                        />
                    </div>
                </article>

                {/* Right Sidebar - TOC */}
                <aside className="hidden xl:block">
                    <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2">
                        {tocItems.length > 0 ? (
                            <>
                                <div className="text-xs font-mono text-(--cf-text-muted) mb-4 flex items-center gap-2 uppercase tracking-widest opacity-60">
                                    <List className="w-3 h-3" />
                                    Index_Data
                                </div>

                                <nav className="relative border-l border-(--cf-border) ml-1.5 space-y-1">
                                    {tocItems.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                                                setActiveHeading(item.id);
                                            }}
                                            className={cn(
                                                "group flex items-center py-1 pl-4 -ml-px border-l-2 text-xs font-mono transition-all",
                                                item.level > 2 ? "pl-8" : "",
                                                activeHeading === item.id
                                                    ? "border-(--cf-amber) text-(--cf-amber)"
                                                    : "border-transparent text-(--cf-text-dim) hover:text-(--cf-text) hover:border-(--cf-text-dim)"
                                            )}
                                        >
                                            <span className={cn(
                                                "mr-2 opacity-50 text-[10px] transition-opacity",
                                                activeHeading === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                                            )}>
                                                {activeHeading === item.id ? ">" : "#"}
                                            </span>
                                            <span className="truncate">{item.text}</span>
                                        </a>
                                    ))}
                                </nav>
                            </>
                        ) : (
                            <div className="text-xs font-mono text-(--cf-text-muted) opacity-40">
                                NO_INDEX_DATA
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}

function DocsPageSkeleton() {
    return (
        <div className="grid lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_240px] gap-6">
            <div className="hidden lg:block cf-panel h-96 animate-pulse" />
            <div className="cf-panel h-[800px] animate-pulse">
                <div className="cf-panel-header h-10" />
                <div className="p-8 space-y-4">
                    <div className="h-8 w-2/3 bg-(--cf-bg-inset) rounded" />
                    <div className="h-4 w-1/3 bg-(--cf-bg-inset) rounded" />
                    <div className="space-y-2 mt-8">
                        <div className="h-4 w-full bg-(--cf-bg-inset) rounded" />
                        <div className="h-4 w-full bg-(--cf-bg-inset) rounded" />
                        <div className="h-4 w-3/4 bg-(--cf-bg-inset) rounded" />
                    </div>
                </div>
            </div>
            <div className="hidden xl:block h-64 animate-pulse bg-(--cf-bg-panel) border border-(--cf-border)" />
        </div>
    );
}
