"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    RefreshCw,
    FolderOpen,
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
import { Skeleton } from "@/components/ui/skeleton";
import { categoryApi } from "@/lib/api";
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/types";
import { toast } from "sonner";

export default function CategoryListPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create/Edit dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<CreateCategoryRequest>({
        name: "",
        intro: "",
        logo: "",
    });
    const [isSaving, setIsSaving] = useState(false);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await categoryApi.list();
            setCategories(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "获取分类列表失败");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);


    const openCreateDialog = () => {
        setEditingCategory(null);
        setFormData({ name: "", intro: "", logo: "" });
        setDialogOpen(true);
    };

    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            intro: category.intro || "",
            logo: category.logo || "",
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("分类名称不能为空");
            return;
        }

        setIsSaving(true);
        try {
            if (editingCategory) {
                const updateData: UpdateCategoryRequest = {
                    name: formData.name,
                    intro: formData.intro || undefined,
                    logo: formData.logo || undefined,
                };
                await categoryApi.update(editingCategory.id, updateData);
                toast.success("更新成功");
            } else {
                await categoryApi.create(formData);
                toast.success("创建成功");
            }
            setDialogOpen(false);
            fetchCategories();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteDialog = (category: Category) => {
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        setIsDeleting(true);
        try {
            await categoryApi.delete(categoryToDelete.id);
            toast.success("删除成功");
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
            fetchCategories();
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
                    <h1 className="text-2xl font-bold">分类管理</h1>
                    <p className="text-muted-foreground">管理博客分类</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchCategories}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        刷新
                    </Button>
                    <Button size="sm" onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        新建分类
                    </Button>
                </div>
            </div>

            {/* Category Table */}
            <Card>
                <CardHeader>
                    <CardTitle>分类列表</CardTitle>
                    <CardDescription>
                        共 {categories.length} 个分类
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">ID</TableHead>
                                <TableHead>名称</TableHead>
                                <TableHead>简介</TableHead>
                                <TableHead className="w-20">文章数</TableHead>
                                <TableHead className="w-28">创建时间</TableHead>
                                <TableHead className="w-24 text-right">操作</TableHead>
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
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    </TableRow>
                                ))
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        <FolderOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        暂无分类
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-mono text-xs">{category.id}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {category.logo && (
                                                    <img
                                                        src={category.logo}
                                                        alt={category.name}
                                                        className="h-6 w-6 rounded object-cover"
                                                    />
                                                )}
                                                <span className="font-medium">{category.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs truncate text-muted-foreground" title={category.intro}>
                                                {category.intro || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {category.blog_count ?? 0}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {formatDate(category.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => openEditDialog(category)}
                                                    title="编辑"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => openDeleteDialog(category)}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? "编辑分类" : "新建分类"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCategory ? "修改分类信息" : "创建一个新的博客分类"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">名称 *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="输入分类名称"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="intro">简介</Label>
                            <Textarea
                                id="intro"
                                value={formData.intro}
                                onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                                placeholder="输入分类简介"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo">图标 URL</Label>
                            <Input
                                id="logo"
                                value={formData.logo}
                                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                placeholder="输入图标 URL"
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            确定要删除分类「{categoryToDelete?.name}」吗？
                            {(categoryToDelete?.blog_count ?? 0) > 0 && (
                                <span className="block mt-2 text-destructive">
                                    该分类下有 {categoryToDelete?.blog_count} 篇文章，删除可能会失败。
                                </span>
                            )}
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
