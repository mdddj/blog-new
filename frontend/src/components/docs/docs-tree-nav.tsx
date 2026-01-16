"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Folder, FolderOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectoryTreeNode, DirectoryDocument } from "@/types";

interface DocsTreeNavProps {
    tree: DirectoryTreeNode[];
    currentDocId?: number;
    onNavigate?: () => void;
    expandAll?: boolean;
}

export function DocsTreeNav({ tree, currentDocId, onNavigate, expandAll }: DocsTreeNavProps) {
    if (tree.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-4">
                暂无目录
            </div>
        );
    }

    return (
        <nav className="text-sm">
            <ul className="space-y-1">
                {tree.map((node) => (
                    <TreeNode
                        key={node.id}
                        node={node}
                        currentDocId={currentDocId}
                        onNavigate={onNavigate}
                        level={0}
                        expandAll={expandAll}
                    />
                ))}
            </ul>
        </nav>
    );
}

interface TreeNodeProps {
    node: DirectoryTreeNode;
    currentDocId?: number;
    onNavigate?: () => void;
    level: number;
    expandAll?: boolean;
}

function TreeNode({ node, currentDocId, onNavigate, level, expandAll }: TreeNodeProps) {
    const hasChildren = (node.children && node.children.length > 0) || (node.documents && node.documents.length > 0);
    
    // Generate a unique key for this node to store in localStorage
    const storageKey = `docs-tree-node-${node.id}`;

    const [isExpanded, setIsExpanded] = useState(() => {
        // Priority 1: Check if current document is in this branch (always auto-expand path to current doc)
        if (hasChildren && isDocumentInBranch(node, currentDocId)) {
            return true;
        }
        
        // Priority 2: Check localStorage
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(storageKey);
            if (saved !== null) {
                return saved === "true";
            }
        }
        
        return false;
    });

    // Effect to handle "Expand All" / "Collapse All" global override
    useEffect(() => {
        if (expandAll !== undefined) {
            setTimeout(() => setIsExpanded(expandAll), 0);
            // Update localStorage when global action is taken
            if (typeof window !== "undefined") {
                localStorage.setItem(storageKey, String(expandAll));
            }
        } else if (currentDocId && hasChildren) {
            // Re-check auto-expand logic when currentDocId changes and no global expandAll is set
            if (isDocumentInBranch(node, currentDocId)) {
                setTimeout(() => setIsExpanded(true), 0);
                // We don't necessarily want to save this auto-expansion to localStorage 
                // as it's transient navigation state, but for consistency let's save it
                if (typeof window !== "undefined") {
                    localStorage.setItem(storageKey, "true");
                }
            }
        }
    }, [expandAll, currentDocId, node, hasChildren, storageKey]);

    const toggleExpand = () => {
        if (hasChildren) {
            const newState = !isExpanded;
            setIsExpanded(newState);
            if (typeof window !== "undefined") {
                localStorage.setItem(storageKey, String(newState));
            }
        }
    };

    return (
        <li>
            <div
                className={cn(
                    "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
                    "hover:bg-accent",
                    level > 0 && "ml-4"
                )}
                onClick={toggleExpand}
            >
                {hasChildren ? (
                    <ChevronRight
                        className={cn(
                            "h-4 w-4 shrink-0 transition-transform",
                            isExpanded && "rotate-90"
                        )}
                    />
                ) : (
                    <span className="w-4" />
                )}
                {isExpanded ? (
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                    <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate font-medium">{node.name}</span>
            </div>

            {isExpanded && hasChildren && (
                <ul className="mt-1 space-y-1">
                    {/* Render documents first */}
                    {node.documents?.map((doc) => (
                        <DocumentItem
                            key={doc.id}
                            doc={doc}
                            isActive={doc.id === currentDocId}
                            onNavigate={onNavigate}
                        level={level + 1}
                    />
                ))}

                {/* Then render sub-directories */}
                {node.children?.map((child) => (
                    <TreeNode
                        key={child.id}
                        node={child}
                        currentDocId={currentDocId}
                        onNavigate={onNavigate}
                        level={level + 1}
                        expandAll={expandAll}
                    />
                ))}
            </ul>
        )}
    </li>
);
}

interface DocumentItemProps {
    doc: DirectoryDocument;
    isActive: boolean;
    onNavigate?: () => void;
    level: number;
}

function DocumentItem({ doc, isActive, onNavigate, level }: DocumentItemProps) {
    const itemRef = (element: HTMLLIElement | null) => {
        if (element && isActive) {
            // Use setTimeout to ensure the DOM is fully rendered and layout is stable
            setTimeout(() => {
                // Find the scrollable container (parent with overflow-y: auto/scroll)
                let parent = element.parentElement;
                while (parent) {
                    const style = window.getComputedStyle(parent);
                    const overflowY = style.overflowY;
                    if (overflowY === 'auto' || overflowY === 'scroll') {
                        // Calculate position to scroll to
                        const parentRect = parent.getBoundingClientRect();
                        const elementRect = element.getBoundingClientRect();
                        
                        // Calculate the relative position of the element within the scrollable container
                        const relativeTop = elementRect.top - parentRect.top;
                        const scrollTop = parent.scrollTop + relativeTop - (parentRect.height / 2) + (elementRect.height / 2);
                        
                        parent.scrollTo({
                            top: scrollTop,
                            behavior: 'smooth'
                        });
                        break;
                    }
                    parent = parent.parentElement;
                }
            }, 100);
        }
    };

    return (
        <li ref={itemRef}>
            <Link
                href={`/docs/${doc.id}`}
                onClick={onNavigate}
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors",
                    "hover:bg-accent",
                    isActive && "bg-primary/10 text-primary font-medium",
                    level > 0 && "ml-4"
                )}
                style={{ marginLeft: `${(level + 1) * 16}px` }}
            >
                <FileText className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{doc.name}</span>
            </Link>
        </li>
    );
}

// Helper function to check if a document is in a branch
function isDocumentInBranch(node: DirectoryTreeNode, docId?: number): boolean {
    if (!docId) return false;

    // Check documents in this node
    if (node.documents?.some((doc) => doc.id === docId)) {
        return true;
    }

    // Check children recursively
    if (node.children) {
        for (const child of node.children) {
            if (isDocumentInBranch(child, docId)) {
                return true;
            }
        }
    }

    return false;
}
