"use client";

import { useState, useCallback } from "react";
import { categoryApi, tagApi, fileApi } from "@/lib/api";
import type { Category, Tag } from "@/types";
import { toast } from "sonner";

interface UseBlogFormOptions {
    setCategoryId: React.Dispatch<React.SetStateAction<string>>;
    setSelectedTagIds: React.Dispatch<React.SetStateAction<number[]>>;
    setThumbnail: React.Dispatch<React.SetStateAction<string>>;
}

export function useBlogForm({ setCategoryId, setSelectedTagIds, setThumbnail }: UseBlogFormOptions) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const refreshCategories = useCallback(async () => {
        try {
            const data = await categoryApi.list();
            setCategories(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "刷新分类失败");
        }
    }, []);

    const refreshTags = useCallback(async () => {
        try {
            const data = await tagApi.list();
            setTags(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "刷新标签失败");
        }
    }, []);

    const handleCreateCategory = useCallback(async (name: string) => {
        const newCategory = await categoryApi.create({ name });
        await refreshCategories();
        setCategoryId(String(newCategory.id));
        toast.success("分类创建成功");
    }, [refreshCategories, setCategoryId]);

    const handleCreateTag = useCallback(async (name: string) => {
        const newTag = await tagApi.create({ name });
        await refreshTags();
        setSelectedTagIds(prev => [...prev, newTag.id]);
        toast.success("标签创建成功");
    }, [refreshTags, setSelectedTagIds]);

    const handleTagToggle = useCallback((tagId: number) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId)
                ? prev.filter((id) => id !== tagId)
                : [...prev, tagId]
        );
    }, [setSelectedTagIds]);

    const handleThumbnailUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    }, [setThumbnail]);

    const handleThumbnailRemove = useCallback(() => {
        setThumbnail("");
    }, [setThumbnail]);

    return {
        categories,
        setCategories,
        tags,
        setTags,
        isUploading,
        refreshCategories,
        refreshTags,
        handleCreateCategory,
        handleCreateTag,
        handleTagToggle,
        handleThumbnailUpload,
        handleThumbnailRemove,
    };
}
