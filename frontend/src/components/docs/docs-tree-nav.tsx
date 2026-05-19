"use client";

import { useRouter } from "next/navigation";
import { Button, Collapse, Icon } from "@/lib/animal-ui";
import type { DirectoryDocument, DirectoryTreeNode } from "@/types";

interface DocsTreeNavProps {
  tree: DirectoryTreeNode[];
  currentDocId?: number;
  onNavigate?: () => void;
  expandAll?: boolean;
}

export function DocsTreeNav({ tree, currentDocId, onNavigate, expandAll }: DocsTreeNavProps) {
  if (tree.length === 0) {
    return <div className="p-4 text-sm">暂无目录</div>;
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
    <span className="flex w-full items-center gap-2 text-left font-black" style={{ paddingLeft: `${level * 0.8}rem` }}>
      <Icon name="icon-diy" size={18} />
      <span className="truncate">{node.name}</span>
    </span>
  );

  if (!hasChildren) {
    return <div>{header}</div>;
  }

  return (
    <Collapse
      key={`${node.id}-${String(expandAll)}-${currentDocId || "none"}`}
      defaultExpanded={expandAll ?? isDocumentInBranch(node, currentDocId)}
      question={header}
      answer={
        <div className="grid gap-2 py-2">
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
      }
    />
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
    <Button
      type={isActive ? "primary" : "text"}
      size="small"
      block
      onClick={() => {
        router.push(`/docs/${doc.id}`);
        onNavigate?.();
      }}
    >
      <span className="flex w-full min-w-0 items-center gap-2 text-left" style={{ paddingLeft: `${level * 0.8}rem` }}>
        <Icon name="icon-critterpedia" size={16} />
        <span className="truncate">{doc.name}</span>
      </span>
    </Button>
  );
}

function isDocumentInBranch(node: DirectoryTreeNode, docId?: number): boolean {
  if (!docId) return false;
  if (node.documents?.some((doc) => doc.id === docId)) return true;
  return Boolean(node.children?.some((child) => isDocumentInBranch(child, docId)));
}
