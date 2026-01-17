"use client";

import { useState, useEffect, use, useCallback, useRef, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
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
import { directoryApi, documentApi } from "@/lib/api";
import type { DirectoryTreeNode, UpdateDocumentRequest, TreeNode } from "@/types";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";
import type { TextAreaTextApi } from "@uiw/react-md-editor";
import { cn } from "@/lib/utils";

import {
    MarkdownEditor,
    insertTextAtCursor,
    uploadImageToServer,
    useAutoSave,
} from "@/components/admin/markdown-editor";

interface PageProps {
    params: Promise<{ id: string }>;
}

// Memoized editor component to prevent unnecessary re-renders
const DocumentEditor = memo(function DocumentEditor({
    content,
    name,
    filename,
    onContentChange,
    onNameChange,
    onFilenameChange,
    onPaste,
    onDrop,
    onInteraction,
    autoSaveEnabled,
    isAutoSaving,
    showAutoSaveSuccess,
    onToggleAutoSave,
    isUploadingImage,
    onImageUpload,
}: {
    content: string;
    name: string;
    filename: string;
    onContentChange: (val: string | undefined) => void;
    onNameChange: (val: string) => void;
    onFilenameChange: (val: string) => void;
    onPaste: (event: React.ClipboardEvent) => void;
    onDrop: (event: React.DragEvent) => void;
    onInteraction: (event: React.SyntheticEvent) => void;
    autoSaveEnabled: boolean;
    isAutoSaving: boolean;
    showAutoSaveSuccess: boolean;
    onToggleAutoSave: () => void;
    isUploadingImage: boolean;
    onImageUpload: (file: File, api: TextAreaTextApi) => Promise<void>;
}) {
    return (
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
                                onChange={(e) => onNameChange(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="filename">文件名</Label>
                            <Input
                                id="filename"
                                placeholder="留空则自动生成"
                                value={filename}
                                onChange={(e) => onFilenameChange(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <MarkdownEditor
                title="文档内容"
                content={content}
                onContentChange={onContentChange}
                onPaste={onPaste}
                onDrop={onDrop}
                onInteraction={onInteraction}
                autoSaveEnabled={autoSaveEnabled}
                isAutoSaving={isAutoSaving}
                showAutoSaveSuccess={showAutoSaveSuccess}
                onToggleAutoSave={onToggleAutoSave}
                isUploadingImage={isUploadingImage}
                onImageUpload={onImageUpload}
            />
        </div>
    );
});

export default function EditDocumentPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [directories, setDirectories] = useState<DirectoryTreeNode[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Current document state
    const [currentDocId, setCurrentDocId] = useState<number>(parseInt(id));
    const [name, setName] = useState("");
    const [filename, setFilename] = useState("");
    const [content, setContent] = useState("");
    const [sortOrder, setSortOrder] = useState(0);

    // Auto-save functions - memoized to prevent re-creation
    const saveFunction = useCallback(async (data: UpdateDocumentRequest) => {
        await documentApi.update(currentDocId, data);
    }, [currentDocId]);

    const buildSaveData = useCallback(() => ({
        name: name.trim(),
        filename: filename.trim() || undefined,
        content,
        sort_order: sortOrder,
    }), [name, filename, content, sortOrder]);

    // Auto-save hook
    const {
        autoSaveEnabled,
        isAutoSaving,
        showAutoSaveSuccess,
        toggleAutoSave,
        resetLastSavedContent,
    } = useAutoSave({
        content,
        title: name,
        enabled: false,
        saveFunction,
        buildSaveData,
    });

    // Ref to track cursor position
    const cursorPosRef = useRef<number | null>(null);

    // Stable event handlers - memoized to prevent re-creation
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

    // Load document content - stable function
    const loadDocument = useCallback(async (docId: number) => {
        try {
            const doc = await documentApi.getById(docId);
            setName(doc.name);
            setFilename(doc.filename || "");
            setContent(doc.content || "");
            setSortOrder(doc.sort_order || 0);
            setCurrentDocId(docId);
            // Reset last saved content after loading
            setTimeout(() => resetLastSavedContent(), 0);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "加载文档失败");
        }
    }, [resetLastSavedContent]);

    // Convert DirectoryTreeNode to TreeNode - stable function
    const convertToTreeNodes = useCallback((nodes: DirectoryTreeNode[]): TreeNode[] => {
        const result: TreeNode[] = [];

        const processNode = (node: DirectoryTreeNode): TreeNode[] => {
            const treeNodes: TreeNode[] = [];

            // Add directory node
            const dirNode: TreeNode = {
                id: node.id,
                name: node.name,
                type: "directory",
                children: [],
            };

            // Add child directories
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    dirNode.children!.push(...processNode(child));
                });
            }

            // Add documents
            if (node.documents && node.documents.length > 0) {
                node.documents.forEach(doc => {
                    dirNode.children!.push({
                        id: doc.id,
                        name: doc.name,
                        type: "document",
                    });
                });
            }

            treeNodes.push(dirNode);
            return treeNodes;
        };

        nodes.forEach(node => {
            result.push(...processNode(node));
        });

        return result;
    }, []);

    // Tree nodes - computed from directories
    const treeNodes = useMemo(() => convertToTreeNodes(directories), [directories, convertToTreeNodes]);

    // Toggle expanded state - stable function
    const toggleExpanded = useCallback((id: number) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    // Load directories and initial document
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [dirData] = await Promise.all([
                    directoryApi.getTree(),
                    loadDocument(parseInt(id)),
                ]);
                setDirectories(dirData);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "加载数据失败");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, loadDocument]);

    // Save function - stable
    const handleSave = useCallback(async () => {
        if (!name.trim()) {
            toast.error("请输入文档名称");
            return;
        }

        setIsSaving(true);
        try {
            const data: UpdateDocumentRequest = {
                name: name.trim(),
                filename: filename.trim() || undefined,
                content,
                sort_order: sortOrder,
            };
            await documentApi.update(currentDocId, data);
            resetLastSavedContent();
            toast.success("保存成功");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    }, [name, filename, content, sortOrder, currentDocId, resetLastSavedContent]);

    // Tree rendering - memoized to prevent re-creation
    const renderTreeNode = useCallback((node: TreeNode, level = 0) => (
        <div key={`${node.type}-${node.id}`}>
            <div
                className={cn(
                    "flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-muted rounded-sm",
                    { "bg-muted": node.type === "document" && node.id === currentDocId }
                )}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => {
                    if (node.type === "directory") {
                        toggleExpanded(node.id);
                    } else {
                        loadDocument(node.id);
                    }
                }}
            >
                {node.type === "directory" ? (
                    <>
                        {expandedIds.has(node.id) ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <span>{node.name}</span>
                    </>
                ) : (
                    <>
                        <div className="w-4" />
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>{node.name}</span>
                    </>
                )}
            </div>
            {node.type === "directory" && expandedIds.has(node.id) && node.children && (
                <div>
                    {node.children.map(child => renderTreeNode(child, level + 1))}
                </div>
            )}
        </div>
    ), [expandedIds, currentDocId, toggleExpanded, loadDocument]);

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
                <Skeleton className="h-[600px] w-full" />
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
                        <h1 className="text-2xl font-bold">编辑文档</h1>
                        <p className="text-muted-foreground">修改文档内容</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? "保存中..." : "保存"}
                    </Button>
                </div>
            </div>

            <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
                <ResizablePanel defaultSize={25} minSize={20}>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">文档目录</CardTitle>
                            <CardDescription>点击文档切换编辑</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px]">
                                {treeNodes.map(node => renderTreeNode(node))}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="pl-6">
                        <DocumentEditor
                            content={content}
                            name={name}
                            filename={filename}
                            onContentChange={handleEditorChange}
                            onNameChange={setName}
                            onFilenameChange={setFilename}
                            onPaste={handleEditorPaste}
                            onDrop={handleEditorDrop}
                            onInteraction={handleEditorInteraction}
                            autoSaveEnabled={autoSaveEnabled}
                            isAutoSaving={isAutoSaving}
                            showAutoSaveSuccess={showAutoSaveSuccess}
                            onToggleAutoSave={toggleAutoSave}
                            isUploadingImage={isUploadingImage}
                            onImageUpload={handleToolbarImageUpload}
                        />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}