"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    RefreshCw,
    FileCode,
    Lock,
    Unlock,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { textApi } from "@/lib/api";
import type { Text, CreateTextRequest, UpdateTextRequest } from "@/types";
import { toast } from "sonner";

export default function TextListPage() {
    const [texts, setTexts] = useState<Text[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create/Edit dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingText, setEditingText] = useState<Text | null>(null);
    const [formData, setFormData] = useState<CreateTextRequest>({
        name: "",
        intro: "",
        content: "",
        is_encrypted: false,
        view_password: "",
    });
    const [isSaving, setIsSaving] = useState(false);


    // View dialog state
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewingText, setViewingText] = useState<Text | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [textToDelete, setTextToDelete] = useState<Text | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTexts = useCallback(async () => {
        setIsLoading(true);
        try {
            // Note: We need to fetch all texts for admin
            // The API might need adjustment to return all texts for admin
            const data = await textApi.list();
            setTexts(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "获取字典文本列表失败");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTexts();
    }, [fetchTexts]);

    const openCreateDialog = () => {
        setEditingText(null);
        setFormData({
            name: "",
            intro: "",
            content: "",
            is_encrypted: false,
            view_password: "",
        });
        setDialogOpen(true);
    };

    const openEditDialog = async (text: Text) => {
        try {
            // Fetch full text content
            const fullText = await textApi.getById(text.id);
            setEditingText(fullText);
            setFormData({
                name: fullText.name,
                intro: fullText.intro || "",
                content: fullText.content,
                is_encrypted: fullText.is_encrypted,
                view_password: "", // Don't show existing password
            });
            setDialogOpen(true);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "获取文本详情失败");
        }
    };

    const openViewDialog = async (text: Text) => {
        try {
            const fullText = await textApi.getById(text.id);
            setViewingText(fullText);
            setViewDialogOpen(true);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "获取文本详情失败");
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("文本名称不能为空");
            return;
        }
        if (!formData.content.trim()) {
            toast.error("文本内容不能为空");
            return;
        }
        if (formData.is_encrypted && !editingText && !formData.view_password?.trim()) {
            toast.error("加密文本需要设置查看密码");
            return;
        }

        setIsSaving(true);
        try {
            if (editingText) {
                const updateData: UpdateTextRequest = {
                    name: formData.name,
                    intro: formData.intro || undefined,
                    content: formData.content,
                    is_encrypted: formData.is_encrypted,
                };
                // Only update password if provided
                if (formData.view_password?.trim()) {
                    updateData.view_password = formData.view_password;
                }
                await textApi.update(editingText.id, updateData);
                toast.success("更新成功");
            } else {
                await textApi.create(formData);
                toast.success("创建成功");
            }
            setDialogOpen(false);
            fetchTexts();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteDialog = (text: Text) => {
        setTextToDelete(text);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!textToDelete) return;
        setIsDeleting(true);
        try {
            await textApi.delete(textToDelete.id);
            toast.success("删除成功");
            setDeleteDialogOpen(false);
            setTextToDelete(null);
            fetchTexts();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "删除失败");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };


    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">字典文本</h1>
                    <p className="text-muted-foreground">管理字典文本片段</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTexts}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        刷新
                    </Button>
                    <Button size="sm" onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        新建文本
                    </Button>
                </div>
            </div>

            {/* Text Table */}
            <Card>
                <CardHeader>
                    <CardTitle>文本列表</CardTitle>
                    <CardDescription>
                        共 {texts.length} 个文本
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">ID</TableHead>
                                <TableHead>名称</TableHead>
                                <TableHead>简介</TableHead>
                                <TableHead className="w-20">加密</TableHead>
                                <TableHead className="w-28">创建时间</TableHead>
                                <TableHead className="w-28">更新时间</TableHead>
                                <TableHead className="w-32 text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    </TableRow>
                                ))
                            ) : texts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        <FileCode className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        暂无文本
                                    </TableCell>
                                </TableRow>
                            ) : (
                                texts.map((text) => (
                                    <TableRow key={text.id}>
                                        <TableCell className="font-mono text-xs">{text.id}</TableCell>
                                        <TableCell>
                                            <span className="font-medium">{text.name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs truncate text-muted-foreground" title={text.intro}>
                                                {text.intro || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {text.is_encrypted ? (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Lock className="h-3 w-3" />
                                                    加密
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="gap-1">
                                                    <Unlock className="h-3 w-3" />
                                                    公开
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {formatDate(text.created_at)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {formatDate(text.updated_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => openViewDialog(text)}
                                                    title="查看"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => openEditDialog(text)}
                                                    title="编辑"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => openDeleteDialog(text)}
                                                    title="删除"
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingText ? "编辑文本" : "新建文本"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingText ? "修改字典文本" : "创建一个新的字典文本"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">名称 *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="输入文本名称"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="is_encrypted">加密设置</Label>
                                <div className="flex items-center gap-4 h-10">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_encrypted}
                                            onChange={(e) =>
                                                setFormData({ ...formData, is_encrypted: e.target.checked })
                                            }
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">需要密码查看</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        {formData.is_encrypted && (
                            <div className="space-y-2">
                                <Label htmlFor="view_password">
                                    查看密码 {!editingText && "*"}
                                </Label>
                                <Input
                                    id="view_password"
                                    type="password"
                                    value={formData.view_password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, view_password: e.target.value })
                                    }
                                    placeholder={editingText ? "留空保持原密码" : "输入查看密码"}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="intro">简介</Label>
                            <Input
                                id="intro"
                                value={formData.intro}
                                onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                                placeholder="输入文本简介"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">内容 *</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="输入文本内容"
                                rows={12}
                                className="font-mono text-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={isSaving}
                        >
                            取消
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "保存中..." : "保存"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>查看文本</DialogTitle>
                        <DialogDescription>
                            {viewingText?.name}
                            {viewingText?.is_encrypted && (
                                <Badge variant="secondary" className="ml-2 gap-1">
                                    <Lock className="h-3 w-3" />
                                    加密
                                </Badge>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {viewingText?.intro && (
                            <p className="text-sm text-muted-foreground mb-4">
                                {viewingText.intro}
                            </p>
                        )}
                        <div className="bg-muted rounded-md p-4 max-h-96 overflow-auto">
                            <pre className="text-sm whitespace-pre-wrap font-mono">
                                {viewingText?.content}
                            </pre>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                            关闭
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            确定要删除文本「{textToDelete?.name}」吗？此操作不可撤销。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            取消
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "删除中..." : "删除"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
