"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { directoryApi, documentApi } from "@/lib/api";
import type {
    DirectoryTreeNode,
    DirectoryDocument,
    CreateDirectoryRequest,
    UpdateDirectoryRequest,
} from "@/types";
import { toast } from "sonner";

import { DirectoryTreeItem } from "./directory-tree-item";
import { DirectoryDialog, DeleteConfirmDialog } from "./directory-dialogs";

export default function DirectoryManagementPage() {
    const router = useRouter();
    const [directories, setDirectories] = useState<DirectoryTreeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    // Directory dialog state
    const [dirDialogOpen, setDirDialogOpen] = useState(false);
    const [editingDirectory, setEditingDirectory] = useState<DirectoryTreeNode | null>(null);
    const [parentIdForNew, setParentIdForNew] = useState<number | null>(null);
    const [dirFormData, setDirFormData] = useState<CreateDirectoryRequest>({
        name: "",
        intro: "",
        parent_id: undefined,
        sort_order: 0,
    });
    const [isSavingDir, setIsSavingDir] = useState(false);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: "directory" | "document"; item: DirectoryTreeNode | DirectoryDocument } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDirectories = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await directoryApi.getTree();
            setDirectories(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "获取目录列表失败");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDirectories();
    }, [fetchDirectories]);

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const expandAll = () => {
        const allIds = new Set<number>();
        const collectIds = (dirs: DirectoryTreeNode[]) => {
            dirs.forEach((dir) => {
                allIds.add(dir.id);
                if (dir.children) collectIds(dir.children);
            });
        };
        collectIds(directories);
        setExpandedIds(allIds);
    };

    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    // Directory handlers
    const openCreateDirDialog = (parentId?: number) => {
        setEditingDirectory(null);
        setParentIdForNew(parentId ?? null);
        setDirFormData({
            name: "",
            intro: "",
            parent_id: parentId,
            sort_order: 0,
        });
        setDirDialogOpen(true);
    };

    const openEditDirDialog = (dir: DirectoryTreeNode) => {
        setEditingDirectory(dir);
        setParentIdForNew(null);
        setDirFormData({
            name: dir.name,
            intro: dir.intro || "",
            parent_id: dir.parent_id,
            sort_order: dir.sort_order,
        });
        setDirDialogOpen(true);
    };

    const handleSaveDirectory = async () => {
        if (!dirFormData.name.trim()) {
            toast.error("目录名称不能为空");
            return;
        }

        setIsSavingDir(true);
        try {
            if (editingDirectory) {
                const updateData: UpdateDirectoryRequest = {
                    name: dirFormData.name,
                    intro: dirFormData.intro || undefined,
                    sort_order: dirFormData.sort_order,
                };
                await directoryApi.update(editingDirectory.id, updateData);
                toast.success("更新成功");
            } else {
                await directoryApi.create(dirFormData);
                toast.success("创建成功");
            }
            setDirDialogOpen(false);
            fetchDirectories();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "保存失败");
        } finally {
            setIsSavingDir(false);
        }
    };

    // Document handlers - navigate to separate pages
    const openCreateDocPage = (directoryId: number) => {
        router.push(`/admin/documents/new?directory_id=${directoryId}`);
    };

    const openEditDocPage = (doc: DirectoryDocument) => {
        router.push(`/admin/documents/${doc.id}`);
    };

    // Delete handlers
    const openDeleteDialog = (type: "directory" | "document", item: DirectoryTreeNode | DirectoryDocument) => {
        setItemToDelete({ type, item });
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            if (itemToDelete.type === "directory") {
                await directoryApi.delete(itemToDelete.item.id);
            } else {
                await documentApi.delete(itemToDelete.item.id);
            }
            toast.success("删除成功");
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            fetchDirectories();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "删除失败");
        } finally {
            setIsDeleting(false);
        }
    };

    const countItems = (dirs: DirectoryTreeNode[]): { directories: number; documents: number } => {
        let directories = 0;
        let documents = 0;
        const count = (items: DirectoryTreeNode[]) => {
            items.forEach((dir) => {
                directories++;
                documents += dir.documents?.length || 0;
                if (dir.children) count(dir.children);
            });
        };
        count(dirs);
        return { directories, documents };
    };

    const counts = countItems(directories);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">目录管理</h1>
                    <p className="text-muted-foreground">管理文档目录结构</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={collapseAll}>
                        全部折叠
                    </Button>
                    <Button variant="outline" size="sm" onClick={expandAll}>
                        全部展开
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchDirectories}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        刷新
                    </Button>
                    <Button size="sm" onClick={() => openCreateDirDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        新建目录
                    </Button>
                </div>
            </div>

            {/* Directory Tree */}
            <Card>
                <CardHeader>
                    <CardTitle>目录树</CardTitle>
                    <CardDescription>
                        共 {counts.directories} 个目录，{counts.documents} 个文档
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full" />
                            ))}
                        </div>
                    ) : directories.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <FolderOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            暂无目录
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            {directories.map((dir) => (
                                <DirectoryTreeItem
                                    key={dir.id}
                                    directory={dir}
                                    level={0}
                                    expandedIds={expandedIds}
                                    onToggle={toggleExpand}
                                    onEditDirectory={openEditDirDialog}
                                    onDeleteDirectory={(d) => openDeleteDialog("directory", d)}
                                    onAddSubDirectory={openCreateDirDialog}
                                    onAddDocument={openCreateDocPage}
                                    onEditDocument={openEditDocPage}
                                    onDeleteDocument={(d) => openDeleteDialog("document", d)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Directory Dialog */}
            <DirectoryDialog
                open={dirDialogOpen}
                onOpenChange={setDirDialogOpen}
                editingDirectory={editingDirectory}
                parentIdForNew={parentIdForNew}
                formData={dirFormData}
                onFormDataChange={setDirFormData}
                onSave={handleSaveDirectory}
                isSaving={isSavingDir}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                itemType={itemToDelete?.type}
                itemName={itemToDelete?.item.name}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}
