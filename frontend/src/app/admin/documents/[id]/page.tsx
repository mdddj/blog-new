"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Save, FolderOpen, FileText, ChevronRight, ChevronDown } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { directoryApi, documentApi, fileApi } from "@/lib/api";
import type { DirectoryTreeNode, DirectoryDocument } from "@/types";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";
import { commands } from "@uiw/react-md-editor";
import type { ICommand, TextState, TextAreaTextApi } from "@uiw/react-md-editor";
import { cn } from "@/lib/utils";

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

// Tree node component for sidebar
interface TreeNodeProps {
    directory: DirectoryTreeNode;
    level: number;
    expandedIds: Set<number>;
    selectedDocId: number;
    onToggle: (id: number) => void;
    onSelectDoc: (doc: DirectoryDocument) => void;
}

function TreeNode({ directory, level, expandedIds, selectedDocId, onToggle, onSelectDoc }: TreeNodeProps) {
    const isExpanded = expandedIds.has(directory.id);
    const hasChildren = (directory.children && directory.children.length > 0) ||
        (directory.documents && directory.documents.length > 0);

    return (
        <div>
            <div
                className="flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm"
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onToggle(directory.id)}
            >
                {hasChildren ? (
                    isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : <span className="w-3.5" />}
                <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{directory.name}</span>
            </div>

            {isExpanded && (
                <>
                    {directory.documents?.map((doc) => (
                        <div
                            key={`doc-${doc.id}`}
                            className={cn(
                                "flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer text-sm",
                                selectedDocId === doc.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted/50"
                            )}
                            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
                            onClick={() => onSelectDoc(doc)}
                        >
                            <span className="w-3.5" />
                            <FileText className={cn("h-3.5 w-3.5 shrink-0", selectedDocId === doc.id ? "text-primary-foreground" : "text-blue-500")} />
                            <span className="truncate">{doc.name}</span>
                        </div>
                    ))}
                    {directory.children?.map((child) => (
                        <TreeNode
                            key={child.id}
                            directory={child}
                            level={level + 1}
                            expandedIds={expandedIds}
                            selectedDocId={selectedDocId}
                            onToggle={onToggle}
                            onSelectDoc={onSelectDoc}
                        />
                    ))}
                </>
            )}
        </div>
    );
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditDocumentPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [directories, setDirectories] = useState<DirectoryTreeNode[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Current document state
    const [currentDocId, setCurrentDocId] = useState<number>(parseInt(id));
    const [name, setName] = useState("");
    const [filename, setFilename] = useState("");
    const [content, setContent] = useState("");
    const [sortOrder, setSortOrder] = useState(0);

    const handleToolbarImageUpload = useCallback(async (file: File) => {
        setIsUploadingImage(true);
        try {
            const markdown = await uploadImageToServer(file);
            setContent((prev) => prev + "\n" + markdown + "\n");
            setHasUnsavedChanges(true);
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
                    setHasUnsavedChanges(true);
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
            setHasUnsavedChanges(true);
        } catch {
            // Error already handled in uploadImageToServer
        } finally {
            setIsUploadingImage(false);
        }
    }, []);

    // Load document content
    const loadDocument = useCallback(async (docId: number) => {
        try {
            const docData = await documentApi.getById(docId);
            setName(docData.name);
            setFilename(docData.filename || "");
            setContent(docData.content);
            setSortOrder(docData.sort_order);
            setCurrentDocId(docId);
            setHasUnsavedChanges(false);
            // Update URL without navigation
            window.history.replaceState(null, "", `/admin/documents/${docId}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "加载文档失败");
        }
    }, []);

    // Initial load
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [docData, dirsData] = await Promise.all([
                    documentApi.getById(parseInt(id)),
                    directoryApi.getTree(),
                ]);
                setDirectories(dirsData);
                setName(docData.name);
                setFilename(docData.filename || "");
                setContent(docData.content);
                setSortOrder(docData.sort_order);

                // Auto expand all directories
                const allIds = new Set<number>();
                const collectIds = (dirs: DirectoryTreeNode[]) => {
                    dirs.forEach((dir) => {
                        allIds.add(dir.id);
                        if (dir.children) collectIds(dir.children);
                    });
                };
                collectIds(dirsData);
                setExpandedIds(allIds);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "加载文档失败");
                router.push("/admin/directories");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, router]);

    const toggleExpand = (dirId: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(dirId)) {
                next.delete(dirId);
            } else {
                next.add(dirId);
            }
            return next;
        });
    };

    const handleSelectDoc = async (doc: DirectoryDocument) => {
        if (doc.id === currentDocId) return;

        if (hasUnsavedChanges) {
            const confirmed = window.confirm("当前文档有未保存的更改，是否放弃更改并切换？");
            if (!confirmed) return;
        }

        await loadDocument(doc.id);
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
            await documentApi.update(currentDocId, {
                name: name.trim(),
                filename: filename.trim() || undefined,
                content,
                sort_order: sortOrder,
            });
            setHasUnsavedChanges(false);
            toast.success("保存成功");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    const handleContentChange = (val: string | undefined) => {
        setContent(val || "");
        setHasUnsavedChanges(true);
    };

    const handleNameChange = (val: string) => {
        setName(val);
        setHasUnsavedChanges(true);
    };

    const handleFilenameChange = (val: string) => {
        setFilename(val);
        setHasUnsavedChanges(true);
    };

    const handleSortOrderChange = (val: number) => {
        setSortOrder(val);
        setHasUnsavedChanges(true);
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
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    <Skeleton className="h-[600px] w-full" />
                    <Skeleton className="h-[600px] w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/admin/directories")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">编辑文档</h1>
                        <p className="text-muted-foreground">
                            {hasUnsavedChanges && <span className="text-amber-500">● 未保存 </span>}
                            {name || "选择文档进行编辑"}
                        </p>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "保存中..." : "保存文档"}
                </Button>
            </div>

            <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-200px)] rounded-lg border">
                {/* Sidebar - Directory Tree */}
                <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                    <div className="h-full flex flex-col">
                        <div className="p-3 border-b">
                            <h3 className="text-sm font-medium">目录结构</h3>
                            <p className="text-xs text-muted-foreground">点击文档切换编辑</p>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2">
                                {directories.map((dir) => (
                                    <TreeNode
                                        key={dir.id}
                                        directory={dir}
                                        level={0}
                                        expandedIds={expandedIds}
                                        selectedDocId={currentDocId}
                                        onToggle={toggleExpand}
                                        onSelectDoc={handleSelectDoc}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Main Content */}
                <ResizablePanel defaultSize={80}>
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-4">
                            <Card>
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm">基本信息</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">名称 *</Label>
                                            <Input
                                                id="name"
                                                placeholder="请输入文档名称"
                                                value={name}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="filename">文件名</Label>
                                            <Input
                                                id="filename"
                                                placeholder="例如: getting-started.md"
                                                value={filename}
                                                onChange={(e) => handleFilenameChange(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sort">排序</Label>
                                            <Input
                                                id="sort"
                                                type="number"
                                                value={sortOrder}
                                                onChange={(e) => handleSortOrderChange(parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm">文档内容</CardTitle>
                                    <CardDescription className="text-xs">
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
                                            onChange={handleContentChange}
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
                                            onChange={handleContentChange}
                                            height={500}
                                            preview="live"
                                            commands={[...commands.getCommands(), commands.divider, imageUploadCommand]}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </ScrollArea>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
