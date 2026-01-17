"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { blogApi, categoryApi, tagApi, fileApi, aiApi } from "@/lib/api";
import type { Category, Tag, UpdateBlogRequest, BlogReference } from "@/types";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";
import type { TextAreaTextApi } from "@uiw/react-md-editor";

// Import components
import {
    BlogForm,
    Sidebar,
    PageHeader,
    ReferenceManager,
} from "@/components/admin/blog-editor";

import {
    MarkdownEditor,
    insertTextAtCursor,
    uploadImageToServer,
    useAutoSave,
} from "@/components/admin/markdown-editor";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditBlogPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [thumbnail, setThumbnail] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [isPublished, setIsPublished] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [summary, setSummary] = useState("");
    const [aiEnabled, setAiEnabled] = useState(false);
    const [references, setReferences] = useState<Record<string, BlogReference>>({});
    const [referenceManagerOpen, setReferenceManagerOpen] = useState(false);

    // Auto-save functions - memoized to prevent re-creation
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

    // Auto-save hook
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

    // Ref to track cursor position
    const cursorPosRef = useRef<number | null>(null);

    // Refresh categories
    const refreshCategories = useCallback(async () => {
        try {
            const data = await categoryApi.list();
            setCategories(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "刷新分类失败");
        }
    }, []);

    // Refresh tags
    const refreshTags = useCallback(async () => {
        try {
            const data = await tagApi.list();
            setTags(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "刷新标签失败");
        }
    }, []);

    // Create new category
    const handleCreateCategory = async (name: string) => {
        const newCategory = await categoryApi.create({ name });
        await refreshCategories();
        setCategoryId(String(newCategory.id));
        toast.success("分类创建成功");
    };

    // Create new tag
    const handleCreateTag = async (name: string) => {
        const newTag = await tagApi.create({ name });
        await refreshTags();
        setSelectedTagIds(prev => [...prev, newTag.id]);
        toast.success("标签创建成功");
    };

    // Handle toolbar image upload button click - uses API to insert at cursor
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

    // Handle paste event for image upload in editor
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

    // Handle drop event for image upload in editor
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

    // Track cursor position when editor content changes or selection changes
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

    // Handle inserting reference into content
    const handleInsertReference = useCallback((refId: string) => {
        const refMarkdown = `:::ref[${refId}]`;
        setContent((prev) => {
            const { newContent } = insertTextAtCursor(prev, refMarkdown, cursorPosRef.current);
            return newContent;
        });
    }, []);

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
    }, [id, router]);

    const handleTagToggle = (tagId: number) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId)
                ? prev.filter((tid) => tid !== tagId)
                : [...prev, tagId]
        );
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await fileApi.upload(file);
            setThumbnail(result.url);
            toast.success("图片上传成功");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "上传失败");
        } finally {
            setIsUploading(false);
        }
    };

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
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9" />
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32 mt-2" />
                    </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-[500px] w-full" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            </div>
        );
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
                    onThumbnailRemove={() => setThumbnail("")}
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
