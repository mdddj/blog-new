"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectoryDocument, DirectoryTreeNode } from "@/types";

interface DocsTreeNavProps {
  tree: DirectoryTreeNode[];
  currentDocId?: number;
  onNavigate?: () => void;
  expandAll?: boolean;
}

export function DocsTreeNav({ tree, currentDocId, onNavigate, expandAll }: DocsTreeNavProps) {
  if (tree.length === 0) {
    return <div className="p-4 text-sm text-slate-500 dark:text-slate-400">暂无目录</div>;
  }

  return (
    <nav className="grid gap-2 text-sm">
      {tree.map((node) => (
        <TreeNode
          key={`${node.id}-${String(expandAll)}-${currentDocId || "none"}`}
          node={node}
          currentDocId={currentDocId}
          onNavigate={onNavigate}
          level={0}
          expandAll={expandAll}
        />
      ))}
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
  const hasChildren = Boolean(node.children?.length || node.documents?.length);
  const header = (
    <span className="flex w-full min-w-0 items-center gap-2 text-left" style={{ paddingLeft: `${level * 0.8}rem` }}>
      <Folder className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="truncate font-medium text-slate-700 dark:text-slate-200">{node.name}</span>
    </span>
  );

  if (!hasChildren) {
    return <div>{header}</div>;
  }

  return (
    <details
      key={`${node.id}-${String(expandAll)}-${currentDocId || "none"}`}
      open={expandAll ?? isDocumentInBranch(node, currentDocId)}
      className="group"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-2 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-900">
        {header}
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="grid gap-1 py-1">
        {node.documents?.map((doc) => (
          <DocumentItem key={doc.id} doc={doc} isActive={doc.id === currentDocId} onNavigate={onNavigate} level={level + 1} />
        ))}
        {node.children?.map((child) => (
          <TreeNode
            key={`${child.id}-${String(expandAll)}-${currentDocId || "none"}`}
            node={child}
            currentDocId={currentDocId}
            onNavigate={onNavigate}
            level={level + 1}
            expandAll={expandAll}
          />
        ))}
      </div>
    </details>
  );
}

interface DocumentItemProps {
  doc: DirectoryDocument;
  isActive: boolean;
  onNavigate?: () => void;
  level: number;
}

function DocumentItem({ doc, isActive, onNavigate, level }: DocumentItemProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition",
        isActive
          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
      )}
      style={{ paddingLeft: `${level * 0.8 + 0.5}rem` }}
      onClick={() => {
        router.push(`/docs/${doc.id}`);
        onNavigate?.();
      }}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{doc.name}</span>
    </button>
  );
}

function isDocumentInBranch(node: DirectoryTreeNode, docId?: number): boolean {
  if (!docId) return false;
  if (node.documents?.some((doc) => doc.id === docId)) return true;
  return Boolean(node.children?.some((child) => isDocumentInBranch(child, docId)));
}
