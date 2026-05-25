"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";
import type { DirectoryDocument, DirectoryTreeNode } from "@/types";

interface DocsSearchProps {
  tree: DirectoryTreeNode[];
}

interface SearchResult {
  doc: DirectoryDocument;
  path: string[];
}

export function DocsSearch({ tree }: DocsSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const allDocuments = useMemo(() => {
    const docs: SearchResult[] = [];
    const traverse = (nodes: DirectoryTreeNode[], path: string[]) => {
      for (const node of nodes) {
        const currentPath = [...path, node.name];
        for (const doc of node.documents || []) docs.push({ doc, path: currentPath });
        if (node.children?.length) traverse(node.children, currentPath);
      }
    };
    traverse(tree, []);
    return docs;
  }, [tree]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return allDocuments
      .filter(({ doc, path }) => doc.name.toLowerCase().includes(lowerQuery) || path.some((item) => item.toLowerCase().includes(lowerQuery)))
      .slice(0, 10);
  }, [query, allDocuments]);

  const handleSelect = (docId: number) => {
    router.push(`/docs/${docId}`);
    setQuery("");
    setIsFocused(false);
  };

  const showResults = isFocused && query.trim() && searchResults.length > 0;
  const showNoResults = isFocused && query.trim() && searchResults.length === 0;

  return (
    <div className="relative">
      <label className="relative block">
        <span className="sr-only">搜索文档</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="搜索文档..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="h-10 w-full rounded-full border border-slate-200 bg-white px-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
        />
        {query ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={() => setQuery("")}
          >
            清空
          </button>
        ) : null}
      </label>

      {showResults ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="grid max-h-64 gap-1 overflow-y-auto">
            {searchResults.map(({ doc, path }) => (
              <button
                key={doc.id}
                type="button"
                className="flex min-w-0 items-start gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-900"
                onClick={() => handleSelect(doc.id)}
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-950 dark:text-white">{doc.name}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{path.join(" / ")}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showNoResults ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          未找到相关文档
        </div>
      ) : null}
    </div>
  );
}
