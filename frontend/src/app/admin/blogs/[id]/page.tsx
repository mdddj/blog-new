"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { blogApi, categoryApi, tagApi, aiApi } from "@/lib/api";
import type { UpdateBlogRequest, BlogReference } from "@/types";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";

import {
    BlogForm,
    Sidebar,
    PageHeader,
    ReferenceManager,
    BlogPageSkeleton,
} from "@/components/admin/blog-editor";

import {
    MarkdownEditor,
    useAutoSave,
} from "@/components/admin/markdown-editor";

import { useDocumentEditor } from "@/hooks/use-document-editor";
import { useBlogForm } from "@/hooks/use-blog-form";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditBlogPage({ params }: PageProps) {
    const { id } = use(params);
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
    const [isPublished, setIsPublished] = useState(false);
    const [summary, setSummary] = useState("");
    const [aiEnabled, setAiEnabled] = useState(false);
    const [references, setReferences] = useState<Record<string, BlogReference>>({});
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

    // Auto-save functions
    const saveFunction = useCallback(async (data: UpdateBlogRequest) => {
        await blogApi.update(parseInt(id), data);
    }, [id]);

    const buildSaveData = useCallback(() => ({
        title: title.trim(),
        slug: slug.trim() || undefined,
        content,
        summary: summary || undefined,
        thumbnail: thumbnail || undefined,
        category_id: categoryId ? parseInt(categoryId) : undefined,
        tag_ids: selectedTagIds,
        is_published: isPublished,
        references: Object.keys(references).length > 0 ? references : undefined,
    }), [title, slug, content, summary, thumbnail, categoryId, selectedTagIds, isPublished, references]);

    const {
        autoSaveEnabled,
        isAutoSaving,
        showAutoSaveSuccess,
        toggleAutoSave,
        resetLastSavedContent,
    } = useAutoSave({
        content,
        title,
        enabled: false,
        saveFunction,
        buildSaveData,
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [blogData, categoriesData, tagsData] = await Promise.all([
                    blogApi.getById(parseInt(id)),
                    categoryApi.list(),
                    tagApi.list(),
                ]);
                setCategories(categoriesData);
                setTags(tagsData);

                // Populate form
                setTitle(blogData.title);
                setSlug(blogData.slug || "");
                setContent(blogData.content || "");
                setSummary(blogData.summary || "");
                setThumbnail(blogData.thumbnail || "");
                setCategoryId(blogData.category?.id ? String(blogData.category.id) : "");
                setSelectedTagIds(blogData.tags.map((t) => t.id));
                setIsPublished(blogData.is_published ?? false);
                setReferences(blogData.references || {});
                resetLastSavedContent();

                // Check if AI is enabled
                try {
                    const status = await aiApi.status();
                    setAiEnabled(status.enabled);
                } catch {
                    setAiEnabled(false);
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "加载数据失败");
                router.push("/admin/blogs");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, router, setCategories, setTags, resetLastSavedContent]);

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
            const data: UpdateBlogRequest = {
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
            await blogApi.update(parseInt(id), data);
            resetLastSavedContent();
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
                title="编辑文章"
                description="修改博客文章"
                autoSaveEnabled={autoSaveEnabled}
                isAutoSaving={isAutoSaving}
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

                    <MarkdownEditor
                        title="文章内容"
                        content={content}
                        onContentChange={handleEditorChange}
                        onPaste={handleEditorPaste}
                        onDrop={handleEditorDrop}
                        onInteraction={handleEditorInteraction}
                        autoSaveEnabled={autoSaveEnabled}
                        isAutoSaving={isAutoSaving}
                        showAutoSaveSuccess={showAutoSaveSuccess}
                        onToggleAutoSave={toggleAutoSave}
                        isUploadingImage={isUploadingImage}
                        onImageUpload={handleToolbarImageUpload}
                        aiEnabled={aiEnabled}
                        onPolishComplete={setContent}
                        onSummarizeComplete={setSummary}
                        onOpenReferenceManager={() => setReferenceManagerOpen(true)}
                    />
                </div>

                {/* Sidebar */}
                <Sidebar
                    isPublished={isPublished}
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
