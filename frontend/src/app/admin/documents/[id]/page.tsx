"use client";

import { useState, useEffect, use, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, FileText, ChevronRight, ChevronDown } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    useAutoSave,
} from "@/components/admin/markdown-editor";

import { DocumentReferenceManager } from "@/components/docs";
import type { DocumentReference } from "@/types";
import { useDocumentEditor } from "@/hooks/use-document-editor";
import {
    DocumentPageHeader,
    DocumentInfoCard,
    DocumentPageSkeleton,
} from "@/components/admin/documents";

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
    onOpenReferenceManager,
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
    onOpenReferenceManager?: () => void;
}) {
    return (
        <div className="space-y-6">
            <DocumentInfoCard
                name={name}
                filename={filename}
                onNameChange={onNameChange}
                onFilenameChange={onFilenameChange}
            />

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
                onOpenReferenceManager={onOpenReferenceManager}
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

    // Current document state
    const [currentDocId, setCurrentDocId] = useState<number>(parseInt(id));
    const [name, setName] = useState("");
    const [filename, setFilename] = useState("");
    const [content, setContent] = useState("");
    const [sortOrder, setSortOrder] = useState(0);
    const [references, setReferences] = useState<Record<string, DocumentReference>>({});
    const [referenceManagerOpen, setReferenceManagerOpen] = useState(false);

    // Shared editor handlers
    const {
        isUploadingImage,
        handleToolbarImageUpload,
        handleEditorPaste,
        handleEditorDrop,
        handleEditorChange,
        handleEditorInteraction,
        handleInsertReference,
    } = useDocumentEditor({ setContent });

    // Auto-save functions - memoized to prevent re-creation
    const saveFunction = useCallback(async (data: UpdateDocumentRequest) => {
        await documentApi.update(currentDocId, data);
    }, [currentDocId]);

    const buildSaveData = useCallback(() => ({
        name: name.trim(),
        filename: filename.trim() || undefined,
        content,
        sort_order: sortOrder,
        references: Object.keys(references).length > 0 ? references : undefined,
    }), [name, filename, content, sortOrder, references]);

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

    // Load document content - stable function
    const loadDocument = useCallback(async (docId: number) => {
        try {
            const doc = await documentApi.getById(docId);
            setName(doc.name);
            setFilename(doc.filename || "");
            setContent(doc.content || "");
            setSortOrder(doc.sort_order || 0);
            setReferences(doc.references || {});
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
                references: Object.keys(references).length > 0 ? references : undefined,
            };
            await documentApi.update(currentDocId, data);
            resetLastSavedContent();
            toast.success("保存成功");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    }, [name, filename, content, sortOrder, references, currentDocId, resetLastSavedContent]);

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
        return <DocumentPageSkeleton />;
    }

    return (
        <div className="space-y-6">
            <DocumentPageHeader
                title="编辑文档"
                description="修改文档内容"
                onBack={() => router.back()}
                onSave={handleSave}
                isSaving={isSaving}
            />

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
                            onOpenReferenceManager={() => setReferenceManagerOpen(true)}
                        />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>

            {/* Reference Manager Dialog */}
            <DocumentReferenceManager
                open={referenceManagerOpen}
                onOpenChange={setReferenceManagerOpen}
                references={references}
                onReferencesChange={setReferences}
                onInsertReference={handleInsertReference}
            />
        </div>
    );
}