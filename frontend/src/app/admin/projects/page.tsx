"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    RefreshCw,
    Briefcase,
    ExternalLink,
    Github,
    Download,
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
import { projectApi } from "@/lib/api";
import type { Project, CreateProjectRequest, UpdateProjectRequest } from "@/types";
import { toast } from "sonner";

export default function ProjectListPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create/Edit dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState<CreateProjectRequest>({
        name: "",
        description: "",
        logo: "",
        github_url: "",
        preview_url: "",
        download_url: "",
        sort_order: 0,
    });
    const [isSaving, setIsSaving] = useState(false);


    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await projectApi.list();
            setProjects(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "获取项目列表失败");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const openCreateDialog = () => {
        setEditingProject(null);
        setFormData({
            name: "",
            description: "",
            logo: "",
            github_url: "",
            preview_url: "",
            download_url: "",
            sort_order: 0,
        });
        setDialogOpen(true);
    };

    const openEditDialog = (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description || "",
            logo: project.logo || "",
            github_url: project.github_url || "",
            preview_url: project.preview_url || "",
            download_url: project.download_url || "",
            sort_order: project.sort_order,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("项目名称不能为空");
            return;
        }

        setIsSaving(true);
        try {
            if (editingProject) {
                const updateData: UpdateProjectRequest = {
                    name: formData.name,
                    description: formData.description || undefined,
                    logo: formData.logo || undefined,
                    github_url: formData.github_url || undefined,
                    preview_url: formData.preview_url || undefined,
                    download_url: formData.download_url || undefined,
                    sort_order: formData.sort_order,
                };
                await projectApi.update(editingProject.id, updateData);
                toast.success("更新成功");
            } else {
                await projectApi.create(formData);
                toast.success("创建成功");
            }
            setDialogOpen(false);
            fetchProjects();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteDialog = (project: Project) => {
        setProjectToDelete(project);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        try {
            await projectApi.delete(projectToDelete.id);
            toast.success("删除成功");
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
            fetchProjects();
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
                    <h1 className="text-2xl font-bold">项目管理</h1>
                    <p className="text-muted-foreground">管理项目展示</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchProjects}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        刷新
                    </Button>
                    <Button size="sm" onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        新建项目
                    </Button>
                </div>
            </div>

            {/* Project Table */}
            <Card>
                <CardHeader>
                    <CardTitle>项目列表</CardTitle>
                    <CardDescription>
                        共 {projects.length} 个项目
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">ID</TableHead>
                                <TableHead>名称</TableHead>
                                <TableHead>描述</TableHead>
                                <TableHead className="w-32">链接</TableHead>
                                <TableHead className="w-16">排序</TableHead>
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
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    </TableRow>
                                ))
                            ) : projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        <Briefcase className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        暂无项目
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-mono text-xs">{project.id}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {project.logo && (
                                                    <img
                                                        src={project.logo}
                                                        alt={project.name}
                                                        className="h-6 w-6 rounded object-cover"
                                                    />
                                                )}
                                                <span className="font-medium">{project.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs truncate text-muted-foreground" title={project.description}>
                                                {project.description || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {project.github_url && (
                                                    <a
                                                        href={project.github_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-foreground"
                                                        title="GitHub"
                                                    >
                                                        <Github className="h-4 w-4" />
                                                    </a>
                                                )}
                                                {project.preview_url && (
                                                    <a
                                                        href={project.preview_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-foreground"
                                                        title="预览"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                )}
                                                {project.download_url && (
                                                    <a
                                                        href={project.download_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-foreground"
                                                        title="下载"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {project.sort_order}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {formatDate(project.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => openEditDialog(project)}
                                                    title="编辑"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => openDeleteDialog(project)}
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
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProject ? "编辑项目" : "新建项目"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingProject ? "修改项目信息" : "添加一个新的项目展示"}
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
                                    placeholder="输入项目名称"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sort_order">排序</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={(e) =>
                                        setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                                    }
                                    placeholder="排序值"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">描述</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="输入项目描述"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo URL</Label>
                            <Input
                                id="logo"
                                value={formData.logo}
                                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                placeholder="输入 Logo 图片 URL"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="github_url">GitHub URL</Label>
                            <Input
                                id="github_url"
                                value={formData.github_url}
                                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                                placeholder="https://github.com/username/repo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preview_url">预览 URL</Label>
                            <Input
                                id="preview_url"
                                value={formData.preview_url}
                                onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="download_url">下载 URL</Label>
                            <Input
                                id="download_url"
                                value={formData.download_url}
                                onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                                placeholder="https://example.com/download"
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
                            确定要删除项目「{projectToDelete?.name}」吗？此操作不可撤销。
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
