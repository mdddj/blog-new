"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { blogApi, aiApi } from "@/lib/api";
import type { CreateBlogRequest, BlogReference } from "@/types";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";

import {
    BlogForm,
    ContentEditor,
    NewBlogSidebar,
    PageHeader,
    ReferenceManager,
    BlogPageSkeleton,
    createImageUploadCommand,
    kbdCommand,
} from "@/components/admin/blog-editor";

import { useDocumentEditor } from "@/hooks/use-document-editor";
import { useBlogForm } from "@/hooks/use-blog-form";

export default function NewBlogPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [thumbnail, setThumbnail] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [summary, setSummary] = useState("");
    const [aiEnabled, setAiEnabled] = useState(false);
    const [references, setReferences] = useState<Record<string, BlogReference>>({});
    const [referenceManagerOpen, setReferenceManagerOpen] = useState(false);

    // Auto-save states (disabled for new blog)
    const [autoSaveEnabled] = useState(false);

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

    // Shared blog form handlers
    const {
        categories,
        setCategories,
        tags,
        setTags,
        isUploading,
        handleCreateCategory,
        handleCreateTag,
        handleTagToggle,
        handleThumbnailUpload,
        handleThumbnailRemove,
    } = useBlogForm({ setCategoryId, setSelectedTagIds, setThumbnail });

    // Custom image upload command
    const imageUploadCommand = createImageUploadCommand(handleToolbarImageUpload);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const { categoryApi, tagApi } = await import("@/lib/api");
                const [categoriesData, tagsData] = await Promise.all([
                    categoryApi.list(),
                    tagApi.list(),
                ]);
                setCategories(categoriesData);
                setTags(tagsData);

                // Check if AI is enabled
                try {
                    const status = await aiApi.status();
                    setAiEnabled(status.enabled);
                } catch {
                    setAiEnabled(false);
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "加载数据失败");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [setCategories, setTags]);

    const handleSubmit = async (publish: boolean) => {
        if (!title.trim()) {
            toast.error("请输入文章标题");
            return;
        }
        if (!content.trim()) {
            toast.error("请输入文章内容");
            return;
        }

        setIsSaving(true);
        try {
            const data: CreateBlogRequest = {
                title: title.trim(),
                slug: slug.trim() || undefined,
                content,
                summary: summary || undefined,
                thumbnail: thumbnail || undefined,
                category_id: categoryId ? parseInt(categoryId) : undefined,
                tag_ids: selectedTagIds,
                is_published: publish,
                references: Object.keys(references).length > 0 ? references : undefined,
            };
            await blogApi.create(data);
            toast.success(publish ? "发布成功" : "保存成功");
            router.push("/admin/blogs");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <BlogPageSkeleton />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="新建文章"
                description="创建新的博客文章"
                autoSaveEnabled={autoSaveEnabled}
                isAutoSaving={false}
                isSaving={isSaving}
                onBack={() => router.back()}
                onSaveDraft={() => handleSubmit(false)}
                onPublish={() => handleSubmit(true)}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <BlogForm
                        title={title}
                        slug={slug}
                        onTitleChange={setTitle}
                        onSlugChange={setSlug}
                    />

                    <ContentEditor
                        content={content}
                        onContentChange={handleEditorChange}
                        onPaste={handleEditorPaste}
                        onDrop={handleEditorDrop}
                        onInteraction={handleEditorInteraction}
                        imageUploadCommand={imageUploadCommand}
                        kbdCommand={kbdCommand}
                        autoSaveEnabled={autoSaveEnabled}
                        isAutoSaving={false}
                        showAutoSaveSuccess={false}
                        onToggleAutoSave={() => toast.info("新建博客暂不支持自动保存，请先保存为草稿")}
                        isUploadingImage={isUploadingImage}
                        aiEnabled={aiEnabled}
                        onPolishComplete={setContent}
                        onSummarizeComplete={setSummary}
                        onOpenReferenceManager={() => setReferenceManagerOpen(true)}
                    />
                </div>

                {/* Sidebar */}
                <NewBlogSidebar
                    thumbnail={thumbnail}
                    categoryId={categoryId}
                    selectedTagIds={selectedTagIds}
                    categories={categories}
                    tags={tags}
                    isUploading={isUploading}
                    onThumbnailUpload={handleThumbnailUpload}
                    onThumbnailRemove={handleThumbnailRemove}
                    onCategoryChange={setCategoryId}
                    onTagToggle={handleTagToggle}
                    onCreateCategory={handleCreateCategory}
                    onCreateTag={handleCreateTag}
                />
            </div>

            {/* Reference Manager Dialog */}
            <ReferenceManager
                open={referenceManagerOpen}
                onOpenChange={setReferenceManagerOpen}
                references={references}
                onReferencesChange={setReferences}
                onInsertReference={handleInsertReference}
            />
        </div>
    );
}
