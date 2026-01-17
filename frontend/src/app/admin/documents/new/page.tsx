"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { directoryApi, documentApi } from "@/lib/api";
import type { DirectoryTreeNode, CreateDocumentRequest } from "@/types";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";
import type { TextAreaTextApi } from "@uiw/react-md-editor";

import {
    MarkdownEditor,
    insertTextAtCursor,
    uploadImageToServer,
} from "@/components/admin/markdown-editor";

export default function NewDocumentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const directoryIdParam = searchParams.get("directory_id");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [directories, setDirectories] = useState<DirectoryTreeNode[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [filename, setFilename] = useState("");
    const [content, setContent] = useState("");
    const [directoryId, setDirectoryId] = useState<string>(directoryIdParam || "");
    const [sortOrder, setSortOrder] = useState(0);

    // Ref to track cursor position
    const cursorPosRef = useRef<number | null>(null);

    const handleToolbarImageUpload = useCallback(async (file: File, api: TextAreaTextApi) => {
        setIsUploadingImage(true);
        try {
            const markdown = await uploadImageToServer(file);
            api.replaceSelection("\n" + markdown + "\n");
        } catch {
            // Error already handled in uploadImageToServer
        } finally {
            setIsUploadingImage(false);
        }
    }, []);

    const handleEditorPaste = useCallback(async (event: React.ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        // Get cursor position from textarea
        const textarea = (event.target as HTMLElement).closest('.w-md-editor')?.querySelector('textarea');
        const cursorPos = textarea?.selectionStart ?? cursorPosRef.current;

        for (const item of items) {
            if (item.type.startsWith("image/")) {
                event.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;
                setIsUploadingImage(true);
                try {
                    const markdown = await uploadImageToServer(file);
                    setContent((prev) => {
                        const { newContent } = insertTextAtCursor(prev, markdown, cursorPos ?? null);
                        return newContent;
                    });
                } catch {
                    // Error already handled in uploadImageToServer
                } finally {
                    setIsUploadingImage(false);
                }
                break;
            }
        }
    }, []);

    const handleEditorDrop = useCallback(async (event: React.DragEvent) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return;
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) return;
        event.preventDefault();

        // Get cursor position from textarea
        const textarea = (event.target as HTMLElement).closest('.w-md-editor')?.querySelector('textarea');
        const cursorPos = textarea?.selectionStart ?? cursorPosRef.current;

        setIsUploadingImage(true);
        try {
            const markdowns: string[] = [];
            for (const file of imageFiles) {
                const markdown = await uploadImageToServer(file);
                markdowns.push(markdown);
            }
            setContent((prev) => {
                const { newContent } = insertTextAtCursor(prev, markdowns.join("\n"), cursorPos ?? null);
                return newContent;
            });
        } catch {
            // Error already handled in uploadImageToServer
        } finally {
            setIsUploadingImage(false);
        }
    }, []);

    // Track cursor position when editor content changes
    const handleEditorChange = useCallback((val: string | undefined) => {
        setContent(val || "");
    }, []);

    // Track cursor position on click/keyup in editor
    const handleEditorInteraction = useCallback((event: React.SyntheticEvent) => {
        const textarea = (event.target as HTMLElement).closest('.w-md-editor')?.querySelector('textarea');
        if (textarea) {
            cursorPosRef.current = textarea.selectionStart;
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await directoryApi.getTree();
                setDirectories(data);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "加载目录失败");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const flattenDirectories = (dirs: DirectoryTreeNode[]): Array<DirectoryTreeNode & { level: number }> => {
        const result: Array<DirectoryTreeNode & { level: number }> = [];
        const traverse = (nodes: DirectoryTreeNode[], level = 0) => {
            nodes.forEach(node => {
                result.push({ ...node, level });
                if (node.children) {
                    traverse(node.children, level + 1);
                }
            });
        };
        traverse(dirs);
        return result;
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("请输入文档名称");
            return;
        }
        if (!content.trim()) {
            toast.error("请输入文档内容");
            return;
        }

        setIsSaving(true);
        try {
            const data: CreateDocumentRequest = {
                name: name.trim(),
                filename: filename.trim() || undefined,
                content,
                directory_id: directoryId ? parseInt(directoryId) : undefined,
                sort_order: sortOrder,
            };
            const doc = await documentApi.create(data);
            toast.success("文档创建成功");
            router.push(`/admin/documents/${doc.id}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "创建失败");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9" />
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32 mt-2" />
                    </div>
                </div>
                <div className="grid gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-[500px] w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">新建文档</h1>
                        <p className="text-muted-foreground">创建新的文档</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? "创建中..." : "创建文档"}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>文档信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">文档名称 *</Label>
                                <Input
                                    id="name"
                                    placeholder="请输入文档名称"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filename">文件名</Label>
                                <Input
                                    id="filename"
                                    placeholder="留空则自动生成"
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="directory">所属目录</Label>
                            <Select value={directoryId} onValueChange={setDirectoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择目录（可选）" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">根目录</SelectItem>
                                    {flattenDirectories(directories).map((dir) => (
                                        <SelectItem key={dir.id} value={String(dir.id)}>
                                            {"  ".repeat(dir.level || 0)}{dir.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <MarkdownEditor
                    title="文档内容"
                    content={content}
                    onContentChange={handleEditorChange}
                    onPaste={handleEditorPaste}
                    onDrop={handleEditorDrop}
                    onInteraction={handleEditorInteraction}
                    isUploadingImage={isUploadingImage}
                    onImageUpload={handleToolbarImageUpload}
                />
            </div>
        </div>
    );
}