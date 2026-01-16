"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DirectoryTreeNode, DirectoryDocument } from "@/types";

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

    // Flatten all documents with their paths for searching
    const allDocuments = useMemo(() => {
        const docs: SearchResult[] = [];
        const traverse = (nodes: DirectoryTreeNode[], path: string[]) => {
            for (const node of nodes) {
                const currentPath = [...path, node.name];
                if (node.documents) {
                    for (const doc of node.documents) {
                        docs.push({ doc, path: currentPath });
                    }
                }
                if (node.children) {
                    traverse(node.children, currentPath);
                }
            }
        };
        traverse(tree, []);
        return docs;
    }, [tree]);

    // Filter documents based on query
    const searchResults = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return allDocuments.filter(
            ({ doc, path }) =>
                doc.name.toLowerCase().includes(lowerQuery) ||
                path.some((p) => p.toLowerCase().includes(lowerQuery))
        ).slice(0, 10);
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
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="搜索文档..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    className="pl-9 pr-9"
                />
                {query && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                        onClick={() => setQuery("")}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                    {searchResults.map(({ doc, path }) => (
                        <button
                            key={doc.id}
                            onClick={() => handleSelect(doc.id)}
                            className={cn(
                                "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                                "flex items-start gap-2"
                            )}
                        >
                            <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                                <div className="font-medium truncate">{doc.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {path.join(" / ")}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showNoResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
                    未找到相关文档
                </div>
            )}
        </div>
    );
}
