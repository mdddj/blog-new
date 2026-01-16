"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Plus,
    Trash2,
    RefreshCw,
    Tag,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { tagApi } from "@/lib/api";
import type { Tag as TagType, CreateTagRequest } from "@/types";
import { toast } from "sonner";

export default function TagListPage() {
    const [tags, setTags] = useState<TagType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create dialog state
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<TagType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTags = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await tagApi.list();
            setTags(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "获取标签列表失败");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);


    const openCreateDialog = () => {
        setNewTagName("");
        setCreateDialogOpen(true);
    };

    const handleCreate = async () => {
        if (!newTagName.trim()) {
            toast.error("标签名称不能为空");
            return;
        }

        setIsCreating(true);
        try {
            const data: CreateTagRequest = { name: newTagName.trim() };
            await tagApi.create(data);
            toast.success("创建成功");
            setCreateDialogOpen(false);
            setNewTagName("");
            fetchTags();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "创建失败");
        } finally {
            setIsCreating(false);
        }
    };

    const openDeleteDialog = (tag: TagType) => {
        setTagToDelete(tag);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!tagToDelete) return;
        setIsDeleting(true);
        try {
            await tagApi.delete(tagToDelete.id);
            toast.success("删除成功");
            setDeleteDialogOpen(false);
            setTagToDelete(null);
            fetchTags();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "删除失败");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">标签管理</h1>
                    <p className="text-muted-foreground">管理博客标签</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTags}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        刷新
                    </Button>
                    <Button size="sm" onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        新建标签
                    </Button>
                </div>
            </div>

            {/* Tag Table */}
            <Card>
                <CardHeader>
                    <CardTitle>标签列表</CardTitle>
                    <CardDescription>
                        共 {tags.length} 个标签
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">ID</TableHead>
                                <TableHead>名称</TableHead>
                                <TableHead className="w-24">文章数</TableHead>
                                <TableHead className="w-24 text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    </TableRow>
                                ))
                            ) : tags.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        <Tag className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        暂无标签
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tags.map((tag) => (
                                    <TableRow key={tag.id}>
                                        <TableCell className="font-mono text-xs">{tag.id}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{tag.name}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {tag.blog_count ?? 0}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => openDeleteDialog(tag)}
                                                title="删除"
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新建标签</DialogTitle>
                        <DialogDescription>
                            创建一个新的博客标签
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">名称 *</Label>
                            <Input
                                id="name"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="输入标签名称"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isCreating) {
                                        handleCreate();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                            disabled={isCreating}
                        >
                            取消
                        </Button>
                        <Button onClick={handleCreate} disabled={isCreating}>
                            {isCreating ? "创建中..." : "创建"}
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
                            确定要删除标签「{tagToDelete?.name}」吗？
                            {(tagToDelete?.blog_count ?? 0) > 0 && (
                                <span className="block mt-2 text-amber-600">
                                    该标签关联了 {tagToDelete?.blog_count} 篇文章，删除后将移除所有关联。
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
