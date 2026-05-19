"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Icon, Input } from "@/lib/animal-ui";
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
      <Input
        type="text"
        placeholder="搜索文档..."
        value={query}
        allowClear
        prefix={<Icon name="icon-camera" size={18} />}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      />

      {showResults ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2">
          <Card>
            <div className="grid max-h-64 gap-2 overflow-y-auto">
              {searchResults.map(({ doc, path }) => (
                <Button key={doc.id} type="text" block onClick={() => handleSelect(doc.id)}>
                  <span className="flex min-w-0 items-start gap-2 text-left">
                    <Icon name="icon-critterpedia" size={16} />
                    <span className="min-w-0">
                      <span className="block truncate font-black">{doc.name}</span>
                      <span className="block truncate text-xs">{path.join(" / ")}</span>
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {showNoResults ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2">
          <Card type="dashed">
            <div className="py-4 text-center text-sm">未找到相关文档</div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
