"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    RefreshCw,
    Link2,
    ExternalLink,
    Check,
    X,
    Clock,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { friendLinkApi } from "@/lib/api";
import type { FriendLink, CreateFriendLinkRequest, UpdateFriendLinkRequest } from "@/types";
import { FriendLinkStatus } from "@/types";
import { toast } from "sonner";


const statusConfig = {
    [FriendLinkStatus.Pending]: {
        label: "待审核",
        variant: "secondary" as const,
        icon: Clock,
    },
    [FriendLinkStatus.Approved]: {
        label: "已通过",
        variant: "default" as const,
        icon: Check,
    },
    [FriendLinkStatus.Rejected]: {
        label: "已拒绝",
        variant: "destructive" as const,
        icon: X,
    },
};

export default function FriendLinkListPage() {
    const [friendLinks, setFriendLinks] = useState<FriendLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create/Edit dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<FriendLink | null>(null);
    const [formData, setFormData] = useState<CreateFriendLinkRequest>({
        name: "",
        url: "",
        logo: "",
        intro: "",
        email: "",
        status: FriendLinkStatus.Pending,
    });
    const [isSaving, setIsSaving] = useState(false);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [linkToDelete, setLinkToDelete] = useState<FriendLink | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchFriendLinks = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await friendLinkApi.listAll();
            setFriendLinks(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "获取友链列表失败");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFriendLinks();
    }, [fetchFriendLinks]);

    const openCreateDialog = () => {
        setEditingLink(null);
        setFormData({
            name: "",
            url: "",
            logo: "",
            intro: "",
            email: "",
            status: FriendLinkStatus.Pending,
        });
        setDialogOpen(true);
    };

    const openEditDialog = (link: FriendLink) => {
        setEditingLink(link);
        setFormData({
            name: link.name,
            url: link.url,
            logo: link.logo || "",
            intro: link.intro || "",
            email: link.email || "",
            status: link.status,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("友链名称不能为空");
            return;
        }
        if (!formData.url.trim()) {
            toast.error("友链 URL 不能为空");
            return;
        }

        setIsSaving(true);
        try {
            if (editingLink) {
                const updateData: UpdateFriendLinkRequest = {
                    name: formData.name,
                    url: formData.url,
                    logo: formData.logo || undefined,
                    intro: formData.intro || undefined,
                    email: formData.email || undefined,
                    status: formData.status,
                };
                await friendLinkApi.update(editingLink.id, updateData);
                toast.success("更新成功");
            } else {
                await friendLinkApi.create(formData);
                toast.success("创建成功");
            }
            setDialogOpen(false);
            fetchFriendLinks();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = async (link: FriendLink, newStatus: FriendLinkStatus) => {
        try {
            await friendLinkApi.update(link.id, { status: newStatus });
            toast.success("状态更新成功");
            fetchFriendLinks();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "状态更新失败");
        }
    };

    const openDeleteDialog = (link: FriendLink) => {
        setLinkToDelete(link);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!linkToDelete) return;
        setIsDeleting(true);
        try {
            await friendLinkApi.delete(linkToDelete.id);
            toast.success("删除成功");
            setDeleteDialogOpen(false);
            setLinkToDelete(null);
            fetchFriendLinks();
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
                    <h1 className="text-2xl font-bold">友链管理</h1>
                    <p className="text-muted-foreground">管理友情链接</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchFriendLinks}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        刷新
                    </Button>
                    <Button size="sm" onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        新建友链
                    </Button>
                </div>
            </div>

            {/* Friend Link Table */}
            <Card>
                <CardHeader>
                    <CardTitle>友链列表</CardTitle>
                    <CardDescription>
                        共 {friendLinks.length} 个友链
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">ID</TableHead>
                                <TableHead>名称</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead>简介</TableHead>
                                <TableHead className="w-24">状态</TableHead>
                                <TableHead className="w-28">创建时间</TableHead>
                                <TableHead className="w-32 text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    </TableRow>
                                ))
                            ) : friendLinks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        <Link2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        暂无友链
                                    </TableCell>
                                </TableRow>
                            ) : (
                                friendLinks.map((link) => {
                                    // Ensure status is a number and has a valid config
                                    const statusKey = typeof link.status === 'string' ? parseInt(link.status) : (link.status ?? 0);
                                    const status = statusConfig[statusKey as FriendLinkStatus] || statusConfig[FriendLinkStatus.Pending];
                                    return (
                                        <TableRow key={link.id}>
                                            <TableCell className="font-mono text-xs">{link.id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {link.logo && (
                                                        <img
                                                            src={link.logo}
                                                            alt={link.name}
                                                            className="h-6 w-6 rounded object-cover"
                                                        />
                                                    )}
                                                    <span className="font-medium">{link.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-blue-600 hover:underline max-w-[200px] truncate"
                                                >
                                                    {link.url}
                                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs truncate text-muted-foreground" title={link.intro}>
                                                    {link.intro || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={link.status.toString()}
                                                    onValueChange={(value) =>
                                                        handleStatusChange(link, parseInt(value) as FriendLinkStatus)
                                                    }
                                                >
                                                    <SelectTrigger className="w-24 h-7">
                                                        <Badge variant={status.variant} className="text-xs">
                                                            {status.label}
                                                        </Badge>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-3 w-3" />
                                                                待审核
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="1">
                                                            <div className="flex items-center gap-2">
                                                                <Check className="h-3 w-3" />
                                                                已通过
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="2">
                                                            <div className="flex items-center gap-2">
                                                                <X className="h-3 w-3" />
                                                                已拒绝
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {formatDate(link.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => openEditDialog(link)}
                                                        title="编辑"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => openDeleteDialog(link)}
                                                        title="删除"
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
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
                            {editingLink ? "编辑友链" : "新建友链"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingLink ? "修改友链信息" : "添加一个新的友情链接"}
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
                                    placeholder="输入友链名称"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">邮箱</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="输入联系邮箱"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="url">URL *</Label>
                            <Input
                                id="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://example.com"
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
                            <Label htmlFor="intro">简介</Label>
                            <Textarea
                                id="intro"
                                value={formData.intro}
                                onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                                placeholder="输入友链简介"
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">状态</Label>
                            <Select
                                value={formData.status?.toString()}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, status: parseInt(value) as FriendLinkStatus })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择状态" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">待审核</SelectItem>
                                    <SelectItem value="1">已通过</SelectItem>
                                    <SelectItem value="2">已拒绝</SelectItem>
                                </SelectContent>
                            </Select>
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
                            确定要删除友链「{linkToDelete?.name}」吗？此操作不可撤销。
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
