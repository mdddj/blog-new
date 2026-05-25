"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Quote, X } from "lucide-react";
import type { DocumentReference } from "@/types";
import { getReferencePreview, sanitizeReferenceRecord } from "@/lib/reference-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-52 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      正在加载编辑器
    </div>
  ),
});

interface DocumentReferenceManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  references: Record<string, DocumentReference>;
  onReferencesChange: (refs: Record<string, DocumentReference>) => void;
  onInsertReference: (refId: string) => void;
}

function ActionButton({
  children,
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const variants = {
    primary: "bg-slate-950 text-white hover:bg-slate-800",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
    danger: "text-red-600 hover:bg-red-50",
    ghost: "text-slate-600 hover:bg-slate-100",
  };

  return (
    <button
      type="button"
      className={cn("inline-flex min-h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition disabled:opacity-50", variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DocumentReferenceManager({
  open,
  onOpenChange,
  references,
  onReferencesChange,
  onInsertReference,
}: DocumentReferenceManagerProps) {
  const [editingRef, setEditingRef] = useState<DocumentReference | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateRefId = useCallback(() => {
    const existingIds = Object.keys(references);
    let counter = 1;
    while (existingIds.includes(`ref-${counter}`)) counter++;
    return `ref-${counter}`;
  }, [references]);

  const resetEditor = () => {
    setIsCreating(false);
    setEditingRef(null);
    setNewTitle("");
    setNewContent("");
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingRef(null);
    setNewTitle("");
    setNewContent("");
  };

  const handleSaveNew = () => {
    if (!newTitle.trim()) {
      toast.error("请输入引用标题");
      return;
    }
    if (!newContent.trim()) {
      toast.error("请输入引用内容");
      return;
    }

    const refId = generateRefId();
    onReferencesChange({
      ...references,
      [refId]: {
        id: refId,
        title: newTitle.trim(),
        content: newContent,
      },
    });

    resetEditor();
    toast.success("引用创建成功");
  };

  const handleSaveEdit = () => {
    if (!editingRef) return;
    if (!editingRef.title.trim()) {
      toast.error("请输入引用标题");
      return;
    }
    if (!editingRef.content.trim()) {
      toast.error("请输入引用内容");
      return;
    }

    onReferencesChange({
      ...references,
      [editingRef.id]: editingRef,
    });

    resetEditor();
    toast.success("引用更新成功");
  };

  const handleDelete = (refId: string) => {
    const newRefs = { ...references };
    delete newRefs[refId];
    onReferencesChange(newRefs);
    toast.success("引用已删除");
  };

  const handleInsert = (refId: string) => {
    onInsertReference(refId);
    onOpenChange(false);
    toast.success("引用已插入到正文");
  };

  const handleCopyId = (refId: string) => {
    navigator.clipboard.writeText(`:::ref[${refId}]`);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("引用标记已复制");
  };

  const refList = Object.values(sanitizeReferenceRecord<DocumentReference>(references));
  const titleValue = editingRef ? editingRef.title : newTitle;
  const contentValue = editingRef ? editingRef.content : newContent;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true">
      <div className="grid max-h-[86vh] w-[min(980px,100%)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 className="inline-flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-950">
            <Quote className="h-5 w-5" />
            引用管理
          </h2>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            onClick={() => onOpenChange(false)}
            aria-label="关闭引用管理"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-5">
          <p className="text-sm text-slate-500">管理文档中的引用内容。引用会以按钮形式展示，点击可查看完整内容。</p>

          {isCreating || editingRef ? (
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">引用标题</span>
                <input
                  placeholder="输入引用标题..."
                  value={titleValue}
                  onChange={(event) =>
                    editingRef ? setEditingRef({ ...editingRef, title: event.target.value }) : setNewTitle(event.target.value)
                  }
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">引用内容 (支持 Markdown)</span>
                <div data-color-mode="light">
                  <MDEditor
                    value={contentValue}
                    onChange={(value) =>
                      editingRef ? setEditingRef({ ...editingRef, content: value || "" }) : setNewContent(value || "")
                    }
                    height={300}
                    preview="edit"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={resetEditor}>取消</ActionButton>
                <ActionButton variant="primary" onClick={editingRef ? handleSaveEdit : handleSaveNew}>
                  保存
                </ActionButton>
              </div>
            </div>
          ) : refList.length === 0 ? (
            <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <Quote className="h-8 w-8 text-slate-400" />
              <p className="font-semibold text-slate-950">暂无引用</p>
              <p className="text-sm text-slate-500">点击下方按钮添加第一个引用</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {refList.map((ref) => (
                <div key={ref.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Quote className="h-4 w-4 text-slate-400" />
                        <h3 className="font-semibold text-slate-950">{ref.title}</h3>
                        <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{ref.id}</code>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{getReferencePreview(ref.content)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionButton variant="ghost" onClick={() => handleCopyId(ref.id)} title="复制引用标记">
                        {copiedId === ref.id ? "已复制" : "复制"}
                      </ActionButton>
                      <ActionButton variant="ghost" onClick={() => handleInsert(ref.id)} title="插入到正文">
                        插入
                      </ActionButton>
                      <ActionButton variant="ghost" onClick={() => setEditingRef({ ...ref })} title="编辑">
                        编辑
                      </ActionButton>
                      <ActionButton variant="danger" onClick={() => handleDelete(ref.id)} title="删除">
                        删除
                      </ActionButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isCreating && !editingRef ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <ActionButton onClick={() => onOpenChange(false)}>关闭</ActionButton>
            <ActionButton variant="primary" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              添加引用
            </ActionButton>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
