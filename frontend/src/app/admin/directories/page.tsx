"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Pencil,
    Trash2,
    RefreshCw,
    FolderOpen,
    FileText,
    ChevronRight,
    ChevronDown,
    FolderPlus,
    FilePlus,
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
import { directoryApi, documentApi } from "@/lib/api";
import type {
    DirectoryTreeNode,
    DirectoryDocument,
    CreateDirectoryRequest,
    UpdateDirectoryRequest,
} from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TreeNodeProps {
    directory: DirectoryTreeNode;
    level: number;
    expandedIds: Set<number>;
    onToggle: (id: number) => void;
    onEditDirectory: (dir: DirectoryTreeNode) => void;
    onDeleteDirectory: (dir: DirectoryTreeNode) => void;
    onAddSubDirectory: (parentId: number) => void;
    onAddDocument: (directoryId: number) => void;
    onEditDocument: (doc: DirectoryDocument) => void;
    onDeleteDocument: (doc: DirectoryDocument) => void;
}

function TreeNode({
    directory,
    level,
    expandedIds,
    onToggle,
    onEditDirectory,
    onDeleteDirectory,
    onAddSubDirectory,
    onAddDocument,
    onEditDocument,
    onDeleteDocument,
}: TreeNodeProps) {
    const isExpanded = expandedIds.has(directory.id);
    const hasChildren = (directory.children && directory.children.length > 0) ||
        (directory.documents && directory.documents.length > 0);


    return (
        <div>
            {/* Directory Row */}
            <div
                className={cn(
                    "flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 group",
                    "cursor-pointer"
                )}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
            >
                <button
                    onClick={() => onToggle(directory.id)}
                    className="p-0.5 hover:bg-muted rounded"
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )
                    ) : (
                        <span className="w-4" />
                    )}
                </button>
                <FolderOpen className="h-4 w-4 text-amber-500" />
                <span className="flex-1 text-sm font-medium">{directory.name}</span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddSubDirectory(directory.id);
                        }}
                        title="添加子目录"
                    >
                        <FolderPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddDocument(directory.id);
                        }}
                        title="添加文档"
                    >
                        <FilePlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditDirectory(directory);
                        }}
                        title="编辑"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDirectory(directory);
                        }}
                        title="删除"
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Children */}
            {isExpanded && (
                <>
                    {/* Documents */}
                    {directory.documents?.map((doc) => (
                        <div
                            key={`doc-${doc.id}`}
                            className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 group"
                            style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}
                        >
                            <span className="w-4" />
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="flex-1 text-sm">{doc.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => onEditDocument(doc)}
                                    title="编辑"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => onDeleteDocument(doc)}
                                    title="删除"
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Sub-directories */}
                    {directory.children?.map((child) => (
                        <TreeNode
                            key={child.id}
                            directory={child}
                            level={level + 1}
                            expandedIds={expandedIds}
                            onToggle={onToggle}
                            onEditDirectory={onEditDirectory}
                            onDeleteDirectory={onDeleteDirectory}
                            onAddSubDirectory={onAddSubDirectory}
                            onAddDocument={onAddDocument}
                            onEditDocument={onEditDocument}
                            onDeleteDocument={onDeleteDocument}
                        />
                    ))}
                </>
            )}
        </div>
    );
}


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
                                <TreeNode
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
            <Dialog open={dirDialogOpen} onOpenChange={setDirDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingDirectory ? "编辑目录" : "新建目录"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingDirectory
                                ? "修改目录信息"
                                : parentIdForNew
                                    ? "在当前目录下创建子目录"
                                    : "创建一个新的根目录"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="dir-name">名称 *</Label>
                            <Input
                                id="dir-name"
                                value={dirFormData.name}
                                onChange={(e) =>
                                    setDirFormData({ ...dirFormData, name: e.target.value })
                                }
                                placeholder="输入目录名称"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dir-intro">简介</Label>
                            <Textarea
                                id="dir-intro"
                                value={dirFormData.intro}
                                onChange={(e) =>
                                    setDirFormData({ ...dirFormData, intro: e.target.value })
                                }
                                placeholder="输入目录简介"
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dir-sort">排序</Label>
                            <Input
                                id="dir-sort"
                                type="number"
                                value={dirFormData.sort_order}
                                onChange={(e) =>
                                    setDirFormData({
                                        ...dirFormData,
                                        sort_order: parseInt(e.target.value) || 0,
                                    })
                                }
                                placeholder="排序值（越小越靠前）"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDirDialogOpen(false)}
                            disabled={isSavingDir}
                        >
                            取消
                        </Button>
                        <Button onClick={handleSaveDirectory} disabled={isSavingDir}>
                            {isSavingDir ? "保存中..." : "保存"}
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
                            确定要删除{itemToDelete?.type === "directory" ? "目录" : "文档"}
                            「{itemToDelete?.item.name}」吗？
                            {itemToDelete?.type === "directory" && (
                                <span className="block mt-2 text-destructive">
                                    删除目录将同时删除其下所有子目录和文档！
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
