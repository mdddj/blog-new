"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
    Trash2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Grid3X3,
    List,
    Upload,
    Image as ImageIcon,
    FileText,
    File,
    Copy,
    Check,
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
import { Skeleton } from "@/components/ui/skeleton";
import { fileApi } from "@/lib/api";
import type { FileInfo, PaginatedResponse } from "@/types";
import { toast } from "sonner";

type ViewMode = "grid" | "list";

export default function FileListPage() {
    const [files, setFiles] = useState<PaginatedResponse<FileInfo> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pageSize = 20;


    const fetchFiles = useCallback(async (page: number, fileType?: string) => {
        setIsLoading(true);
        try {
            const type = fileType === "all" ? undefined : fileType;
            const data = await fileApi.list(page, pageSize, type);
            setFiles(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "获取文件列表失败");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles(currentPage, fileTypeFilter);
    }, [currentPage, fileTypeFilter, fetchFiles]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        setIsUploading(true);
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
            try {
                await fileApi.upload(selectedFiles[i]);
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`Failed to upload ${selectedFiles[i].name}:`, err);
            }
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setIsUploading(false);

        if (successCount > 0) {
            toast.success(`成功上传 ${successCount} 个文件`);
            fetchFiles(currentPage, fileTypeFilter);
        }
        if (failCount > 0) {
            toast.error(`${failCount} 个文件上传失败`);
        }
    };

    const handleDelete = async () => {
        if (!fileToDelete) return;
        setIsDeleting(true);
        try {
            await fileApi.delete(fileToDelete.id);
            toast.success("删除成功");
            setDeleteDialogOpen(false);
            setFileToDelete(null);
            fetchFiles(currentPage, fileTypeFilter);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "删除失败");
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteDialog = (file: FileInfo) => {
        setFileToDelete(file);
        setDeleteDialogOpen(true);
    };

    const copyToClipboard = async (url: string, fileId: number) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(fileId);
            toast.success("链接已复制");
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error("复制失败");
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "-";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const getFileIcon = (fileType?: string) => {
        if (fileType === "image") return <ImageIcon className="h-5 w-5" />;
        if (fileType === "text") return <FileText className="h-5 w-5" />;
        return <File className="h-5 w-5" />;
    };

    const isImage = (file: FileInfo) => file.file_type === "image";


    return (
        <div className="space-y-6">
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                multiple
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt,.md"
            />

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">文件管理</h1>
                    <p className="text-muted-foreground">管理上传的文件和图片</p>
                </div>
                <div className="flex gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex border rounded-md">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className="rounded-r-none"
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className="rounded-l-none"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* File Type Filter */}
                    <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="文件类型" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="image">图片</SelectItem>
                            <SelectItem value="application">文档</SelectItem>
                            <SelectItem value="text">文本</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchFiles(currentPage, fileTypeFilter)}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        刷新
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                上传中...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                上传文件
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* File Content */}
            <Card>
                <CardHeader>
                    <CardTitle>文件列表</CardTitle>
                    <CardDescription>
                        共 {files?.total ?? 0} 个文件
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {viewMode === "grid" ? (
                        /* Grid View */
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {isLoading ? (
                                Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="aspect-square">
                                        <Skeleton className="w-full h-full rounded-lg" />
                                    </div>
                                ))
                            ) : files?.items.length === 0 ? (
                                <div className="col-span-full text-center text-muted-foreground py-12">
                                    暂无文件
                                </div>
                            ) : (
                                files?.items.map((file) => (
                                    <div
                                        key={file.id}
                                        className="group relative aspect-square border rounded-lg overflow-hidden bg-muted/30 hover:border-primary transition-colors"
                                    >
                                        {/* File Preview */}
                                        {isImage(file) ? (
                                            <img
                                                src={file.url}
                                                alt={file.original_filename || file.filename}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                                                {getFileIcon(file.file_type)}
                                                <span className="text-xs text-center text-muted-foreground truncate w-full px-2">
                                                    {file.original_filename || file.filename}
                                                </span>
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="secondary"
                                                    size="icon-sm"
                                                    onClick={() => copyToClipboard(file.url, file.id)}
                                                    title="复制链接"
                                                >
                                                    {copiedId === file.id ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon-sm"
                                                    onClick={() => openDeleteDialog(file)}
                                                    title="删除"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <span className="text-xs text-white/80 px-2 text-center truncate w-full">
                                                {formatFileSize(file.file_size)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* List View */
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">ID</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>文件名</TableHead>
                                    <TableHead className="w-24">类型</TableHead>
                                    <TableHead className="w-24">大小</TableHead>
                                    <TableHead className="w-28">上传时间</TableHead>
                                    <TableHead className="w-32 text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : files?.items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            暂无文件
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    files?.items.map((file) => (
                                        <TableRow key={file.id}>
                                            <TableCell className="font-mono text-xs">{file.id}</TableCell>
                                            <TableCell>
                                                {isImage(file) ? (
                                                    <img
                                                        src={file.url}
                                                        alt={file.original_filename || file.filename}
                                                        className="h-8 w-8 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="h-8 w-8 flex items-center justify-center bg-muted rounded">
                                                        {getFileIcon(file.file_type)}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs truncate" title={file.original_filename || file.filename}>
                                                    {file.original_filename || file.filename}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {file.file_type || "-"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatFileSize(file.file_size)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {formatDate(file.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => copyToClipboard(file.url, file.id)}
                                                        title="复制链接"
                                                    >
                                                        {copiedId === file.id ? (
                                                            <Check className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => openDeleteDialog(file)}
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
                    )}


                    {/* Pagination */}
                    {files && files.total_pages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                第 {currentPage} / {files.total_pages} 页
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    上一页
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(files.total_pages, p + 1))}
                                    disabled={currentPage === files.total_pages || isLoading}
                                >
                                    下一页
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            确定要删除文件「{fileToDelete?.original_filename || fileToDelete?.filename}」吗？此操作不可撤销。
                        </DialogDescription>
                    </DialogHeader>
                    {fileToDelete && isImage(fileToDelete) && (
                        <div className="flex justify-center">
                            <img
                                src={fileToDelete.url}
                                alt={fileToDelete.original_filename || fileToDelete.filename}
                                className="max-h-48 rounded-lg object-contain"
                            />
                        </div>
                    )}
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
