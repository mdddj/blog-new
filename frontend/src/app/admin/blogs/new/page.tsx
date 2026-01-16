"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { blogApi, categoryApi, tagApi, fileApi, aiApi } from "@/lib/api";
import type { Category, Tag, CreateBlogRequest, BlogReference } from "@/types";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";
import type { TextAreaTextApi } from "@uiw/react-md-editor";

// Import components
import {
    BlogForm,
    ContentEditor,
    NewBlogSidebar,
    PageHeader,
    ReferenceManager,
    insertTextAtCursor,
    uploadImageToServer,
    createImageUploadCommand,
    kbdCommand,
} from "@/components/admin/blog-editor";

export default function NewBlogPage() {
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
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [summary, setSummary] = useState("");
    const [aiEnabled, setAiEnabled] = useState(false);
    const [references, setReferences] = useState<Record<string, BlogReference>>({});
    const [referenceManagerOpen, setReferenceManagerOpen] = useState(false);

    // Ref to track cursor position
    const cursorPosRef = useRef<number | null>(null);

    // Auto-save states (disabled for new blog)
    const [autoSaveEnabled] = useState(false);

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

    // Custom image upload command
    const imageUploadCommand = createImageUploadCommand(handleToolbarImageUpload);

    // Handle paste event for image upload in editor
    const handleEditorPaste = useCallback(async (event: React.ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        const textarea = (event.target as HTMLElement).closest('.w-md-editor')?.querySelector('textarea');
        const cursorPos = textarea?.selectionStart ?? null;

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

        const textarea = (event.target as HTMLElement).closest('.w-md-editor')?.querySelector('textarea');
        const cursorPos = textarea?.selectionStart ?? null;

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
    }, []);

    const handleTagToggle = (tagId: number) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId)
                ? prev.filter((id) => id !== tagId)
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
