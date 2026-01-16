"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { directoryApi, documentApi, fileApi } from "@/lib/api";
import type { DirectoryTreeNode, CreateDocumentRequest } from "@/types";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";
import { commands } from "@uiw/react-md-editor";
import type { ICommand, TextState, TextAreaTextApi } from "@uiw/react-md-editor";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
    ssr: false,
    loading: () => <Skeleton className="h-[500px] w-full" />,
});

async function uploadImageToServer(file: File): Promise<string> {
    const result = await fileApi.upload(file);
    return `![${file.name}](${result.url})`;
}

function createImageUploadCommand(onUpload: (file: File) => Promise<void>): ICommand {
    return {
        name: "image-upload",
        keyCommand: "image-upload",
        buttonProps: { "aria-label": "上传图片", title: "上传图片" },
        icon: (
            <svg width="13" height="13" viewBox="0 0 20 20">
                <path fill="currentColor" d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z" />
            </svg>
        ),
        execute: (_state: TextState, _api: TextAreaTextApi) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.multiple = true;
            input.onchange = async () => {
                const files = input.files;
                if (!files) return;
                for (const file of files) {
                    await onUpload(file);
                }
            };
            input.click();
        },
    };
}

// Flatten directory tree for select
function flattenDirectories(dirs: DirectoryTreeNode[], level = 0): { id: number; name: string; level: number }[] {
    const result: { id: number; name: string; level: number }[] = [];
    dirs.forEach((dir) => {
        result.push({ id: dir.id, name: dir.name, level });
        if (dir.children) {
            result.push(...flattenDirectories(dir.children, level + 1));
        }
    });
    return result;
}

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

    const handleToolbarImageUpload = useCallback(async (file: File) => {
        setIsUploadingImage(true);
        try {
            const markdown = await uploadImageToServer(file);
            setContent((prev) => prev + "\n" + markdown + "\n");
        } catch {
            // Error already handled in uploadImageToServer
        } finally {
            setIsUploadingImage(false);
        }
    }, []);

    const imageUploadCommand = createImageUploadCommand(handleToolbarImageUpload);

    const handleEditorPaste = useCallback(async (event: React.ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                event.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;
                setIsUploadingImage(true);
                try {
                    const markdown = await uploadImageToServer(file);
                    setContent((prev) => prev + "\n" + markdown + "\n");
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
        setIsUploadingImage(true);
        try {
            const markdowns: string[] = [];
            for (const file of imageFiles) {
                const markdown = await uploadImageToServer(file);
                markdowns.push(markdown);
            }
            setContent((prev) => prev + "\n" + markdowns.join("\n") + "\n");
        } catch {
            // Error already handled in uploadImageToServer
        } finally {
            setIsUploadingImage(false);
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

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("请输入文档名称");
            return;
        }
        if (!content.trim()) {
            toast.error("请输入文档内容");
            return;
        }
        if (!directoryId) {
            toast.error("请选择所属目录");
            return;
        }

        setIsSaving(true);
        try {
            const data: CreateDocumentRequest = {
                name: name.trim(),
                filename: filename.trim() || undefined,
                content,
                directory_id: parseInt(directoryId),
                sort_order: sortOrder,
            };
            await documentApi.create(data);
            toast.success("创建成功");
            router.push("/admin/directories");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "创建失败");
        } finally {
            setIsSaving(false);
        }
    };

    const flatDirs = flattenDirectories(directories);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">新建文档</h1>
                        <p className="text-muted-foreground">创建新的 Markdown 文档</p>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "保存中..." : "保存文档"}
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>基本信息</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">名称 *</Label>
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
                                        placeholder="例如: getting-started.md"
                                        value={filename}
                                        onChange={(e) => setFilename(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>文档内容</CardTitle>
                            <CardDescription>
                                使用 Markdown 格式编写，支持粘贴或拖拽图片自动上传
                                {isUploadingImage && <span className="ml-2 text-primary">图片上传中...</span>}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                data-color-mode="light"
                                className="dark:hidden"
                                onPaste={handleEditorPaste}
                                onDrop={handleEditorDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <MDEditor
                                    value={content}
                                    onChange={(val) => setContent(val || "")}
                                    height={500}
                                    preview="live"
                                    commands={[...commands.getCommands(), commands.divider, imageUploadCommand]}
                                />
                            </div>
                            <div
                                data-color-mode="dark"
                                className="hidden dark:block"
                                onPaste={handleEditorPaste}
                                onDrop={handleEditorDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <MDEditor
                                    value={content}
                                    onChange={(val) => setContent(val || "")}
                                    height={500}
                                    preview="live"
                                    commands={[...commands.getCommands(), commands.divider, imageUploadCommand]}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>所属目录 *</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-9 w-full" />
                            ) : (
                                <Select value={directoryId} onValueChange={setDirectoryId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="选择目录" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {flatDirs.map((dir) => (
                                            <SelectItem key={dir.id} value={String(dir.id)}>
                                                {"　".repeat(dir.level)}{dir.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>排序</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type="number"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                                placeholder="排序值（越小越靠前）"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
