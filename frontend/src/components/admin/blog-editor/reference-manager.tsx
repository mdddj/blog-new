"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote, Plus, Trash2, Edit2, Copy, Check } from "lucide-react";
import type { BlogReference } from "@/types";
import { toast } from "sonner";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] w-full" />,
});

interface ReferenceManagerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    references: Record<string, BlogReference>;
    onReferencesChange: (refs: Record<string, BlogReference>) => void;
    onInsertReference: (refId: string) => void;
}

export function ReferenceManager({
    open,
    onOpenChange,
    references,
    onReferencesChange,
    onInsertReference,
}: ReferenceManagerProps) {
    const [editingRef, setEditingRef] = useState<BlogReference | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const generateRefId = useCallback(() => {
        const existingIds = Object.keys(references);
        let counter = 1;
        while (existingIds.includes(`ref-${counter}`)) {
            counter++;
        }
        return `ref-${counter}`;
    }, [references]);

    const handleCreate = () => {
        setIsCreating(true);
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
        const newRef: BlogReference = {
            id: refId,
            title: newTitle.trim(),
            content: newContent,
        };

        onReferencesChange({
            ...references,
            [refId]: newRef,
        });

        setIsCreating(false);
        setNewTitle("");
        setNewContent("");
        toast.success("引用创建成功");
    };

    const handleEdit = (ref: BlogReference) => {
        setEditingRef({ ...ref });
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

        setEditingRef(null);
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

    const refList = Object.values(references);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Quote className="h-5 w-5" />
                        引用管理
                    </DialogTitle>
                    <DialogDescription>
                        管理文章中的引用内容。引用会以卡片形式展示，点击可查看完整内容。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {isCreating || editingRef ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>引用标题</Label>
                                <Input
                                    placeholder="输入引用标题..."
                                    value={editingRef ? editingRef.title : newTitle}
                                    onChange={(e) =>
                                        editingRef
                                            ? setEditingRef({ ...editingRef, title: e.target.value })
                                            : setNewTitle(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>引用内容 (支持 Markdown)</Label>
                                <div data-color-mode="light" className="dark:hidden">
                                    <MDEditor
                                        value={editingRef ? editingRef.content : newContent}
                                        onChange={(val) =>
                                            editingRef
                                                ? setEditingRef({ ...editingRef, content: val || "" })
                                                : setNewContent(val || "")
                                        }
                                        height={300}
                                        preview="edit"
                                    />
                                </div>
                                <div data-color-mode="dark" className="hidden dark:block">
                                    <MDEditor
                                        value={editingRef ? editingRef.content : newContent}
                                        onChange={(val) =>
                                            editingRef
                                                ? setEditingRef({ ...editingRef, content: val || "" })
                                                : setNewContent(val || "")
                                        }
                                        height={300}
                                        preview="edit"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setEditingRef(null);
                                    }}
                                >
                                    取消
                                </Button>
                                <Button onClick={editingRef ? handleSaveEdit : handleSaveNew}>
                                    保存
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px] pr-4">
                            {refList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                                    <Quote className="h-12 w-12 mb-4 opacity-50" />
                                    <p>暂无引用</p>
                                    <p className="text-sm">点击下方按钮添加第一个引用</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {refList.map((ref) => (
                                        <Card key={ref.id} className="group">
                                            <CardHeader className="py-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Quote className="h-4 w-4 text-muted-foreground" />
                                                        {ref.title}
                                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                            {ref.id}
                                                        </code>
                                                    </CardTitle>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleCopyId(ref.id)}
                                                            title="复制引用标记"
                                                        >
                                                            {copiedId === ref.id ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleInsert(ref.id)}
                                                            title="插入到正文"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleEdit(ref)}
                                                            title="编辑"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(ref.id)}
                                                            title="删除"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="py-2">
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {ref.content.replace(/[#*`>\-\[\]]/g, "").slice(0, 150)}
                                                    {ref.content.length > 150 && "..."}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>

                {!isCreating && !editingRef && (
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            关闭
                        </Button>
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            添加引用
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
