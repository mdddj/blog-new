"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Button, Card, Divider, Icon, Input, Loading, Modal } from "@/lib/animal-ui";
import type { DocumentReference } from "@/types";
import { getReferencePreview, sanitizeReferenceRecord } from "@/lib/reference-utils";
import { toast } from "sonner";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <Card type="dashed">
      <div className="flex min-h-52 items-center justify-center">
        <Loading active />
      </div>
    </Card>
  ),
});

interface DocumentReferenceManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  references: Record<string, DocumentReference>;
  onReferencesChange: (refs: Record<string, DocumentReference>) => void;
  onInsertReference: (refId: string) => void;
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

  return (
    <Modal
      open={open}
      title={
        <span className="inline-flex items-center gap-2">
          <Icon name="icon-chat" size={22} bounce />
          引用管理
        </span>
      }
      width="min(980px, calc(100vw - 2rem))"
      onClose={() => onOpenChange(false)}
      footer={
        isCreating || editingRef ? null : (
          <>
            <Button type="default" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
            <Button type="primary" icon={<Icon name="icon-diy" size={16} />} onClick={handleCreate}>
              添加引用
            </Button>
          </>
        )
      }
      typewriter={false}
    >
      <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
        <p className="text-sm">管理文档中的引用内容。引用会以卡片形式展示，点击可查看完整内容。</p>

        {isCreating || editingRef ? (
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-black">引用标题</span>
              <Input
                placeholder="输入引用标题..."
                value={titleValue}
                onChange={(event) =>
                  editingRef ? setEditingRef({ ...editingRef, title: event.target.value }) : setNewTitle(event.target.value)
                }
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-black">引用内容 (支持 Markdown)</span>
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
              <Button type="default" onClick={resetEditor}>
                取消
              </Button>
              <Button type="primary" onClick={editingRef ? handleSaveEdit : handleSaveNew}>
                保存
              </Button>
            </div>
          </div>
        ) : refList.length === 0 ? (
          <Card type="dashed">
            <div className="grid justify-items-center gap-3 py-12 text-center">
              <Icon name="icon-chat" size={54} bounce />
              <p className="font-black">暂无引用</p>
              <p className="text-sm">点击下方按钮添加第一个引用</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3">
            {refList.map((ref) => (
              <Card key={ref.id}>
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon name="icon-chat" size={18} />
                        <h3 className="font-black">{ref.title}</h3>
                        <code className="rounded bg-[#f0e8d8] px-2 py-1 text-xs">{ref.id}</code>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6">{getReferencePreview(ref.content)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="text" size="small" onClick={() => handleCopyId(ref.id)} title="复制引用标记">
                        {copiedId === ref.id ? "已复制" : "复制"}
                      </Button>
                      <Button type="text" size="small" onClick={() => handleInsert(ref.id)} title="插入到正文">
                        插入
                      </Button>
                      <Button type="text" size="small" onClick={() => setEditingRef({ ...ref })} title="编辑">
                        编辑
                      </Button>
                      <Button type="text" size="small" danger onClick={() => handleDelete(ref.id)} title="删除">
                        删除
                      </Button>
                    </div>
                  </div>
                  <Divider type="line-teal" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
