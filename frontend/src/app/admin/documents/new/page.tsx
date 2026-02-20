"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { directoryApi, documentApi } from "@/lib/api";
import type { DirectoryTreeNode, CreateDocumentRequest } from "@/types";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";

import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { DocumentReferenceManager } from "@/components/docs";
import type { DocumentReference } from "@/types";
import { useDocumentEditor } from "@/hooks/use-document-editor";
import {
    DocumentPageHeader,
    DocumentInfoCard,
    DocumentPageSkeleton,
} from "@/components/admin/documents";

export default function NewDocumentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const directoryIdParam = searchParams.get("directory_id");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [directories, setDirectories] = useState<DirectoryTreeNode[]>([]);

    // Form state
    const [name, setName] = useState("");
    const [filename, setFilename] = useState("");
    const [content, setContent] = useState("");
    const [directoryId, setDirectoryId] = useState<string>(directoryIdParam || "none");
    const [sortOrder, setSortOrder] = useState(0);
    const [references, setReferences] = useState<Record<string, DocumentReference>>({});
    const [referenceManagerOpen, setReferenceManagerOpen] = useState(false);

    const {
        isUploadingImage,
        handleToolbarImageUpload,
        handleEditorPaste,
        handleEditorDrop,
        handleEditorChange,
        handleEditorInteraction,
        handleInsertReference,
    } = useDocumentEditor({ setContent });

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
                directory_id: (directoryId && directoryId !== "none") ? parseInt(directoryId) : undefined,
                sort_order: sortOrder,
                references: Object.keys(references).length > 0 ? references : undefined,
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
        return <DocumentPageSkeleton />;
    }

    return (
        <div className="space-y-6">
            <DocumentPageHeader
                title="新建文档"
                description="创建新的文档"
                onBack={() => router.back()}
                onSave={handleSubmit}
                isSaving={isSaving}
                saveLabel="创建文档"
                savingLabel="创建中..."
            />

            <div className="space-y-6">
                <DocumentInfoCard
                    name={name}
                    filename={filename}
                    onNameChange={setName}
                    onFilenameChange={setFilename}
                >
                    <div className="space-y-2">
                        <Label htmlFor="directory">所属目录</Label>
                        <Select value={directoryId} onValueChange={setDirectoryId}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择目录（可选）" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">根目录</SelectItem>
                                {flattenDirectories(directories).map((dir) => (
                                    <SelectItem key={dir.id} value={String(dir.id)}>
                                        {"  ".repeat(dir.level || 0)}{dir.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </DocumentInfoCard>

                <MarkdownEditor
                    title="文档内容"
                    content={content}
                    onContentChange={handleEditorChange}
                    onPaste={handleEditorPaste}
                    onDrop={handleEditorDrop}
                    onInteraction={handleEditorInteraction}
                    isUploadingImage={isUploadingImage}
                    onImageUpload={handleToolbarImageUpload}
                    onOpenReferenceManager={() => setReferenceManagerOpen(true)}
                />
            </div>

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