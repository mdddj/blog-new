import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "../blog-editor/utils";
import { useAutoSaveSuccess } from "../blog-editor/auto-save-command";
import { toast } from "sonner";

export interface UseAutoSaveOptions<T> {
    content: string;
    title: string;
    enabled?: boolean;
    delay?: number;
    saveFunction: (data: T) => Promise<void>;
    buildSaveData: () => T;
    onSaveSuccess?: () => void;
    onSaveError?: (error: Error) => void;
}

export function useAutoSave<T>({
    content,
    title,
    enabled = false,
    delay = 2000,
    saveFunction,
    buildSaveData,
    onSaveSuccess,
    onSaveError,
}: UseAutoSaveOptions<T>) {
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(enabled);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSavedContent, setLastSavedContent] = useState("");

    const { showSuccess, triggerSuccess } = useAutoSaveSuccess();
    const debouncedContent = useDebounce(content, delay);

    // Auto-save effect
    useEffect(() => {
        if (
            autoSaveEnabled &&
            debouncedContent &&
            debouncedContent !== lastSavedContent &&
            title.trim() // 确保有标题才自动保存
        ) {
            handleAutoSave();
        }
    }, [debouncedContent, autoSaveEnabled, lastSavedContent, title]);

    // Auto-save function
    const handleAutoSave = useCallback(async () => {
        if (isAutoSaving || !title.trim()) return;

        setIsAutoSaving(true);
        try {
            const data = buildSaveData();
            await saveFunction(data);
            setLastSavedContent(debouncedContent);
            triggerSuccess();
            toast.success("自动保存成功", { duration: 1500 });
            onSaveSuccess?.();
        } catch (err) {
            const error = err instanceof Error ? err : new Error("未知错误");
            toast.error("自动保存失败: " + error.message);
            onSaveError?.(error);
        } finally {
            setIsAutoSaving(false);
        }
    }, [
        isAutoSaving,
        title,
        debouncedContent,
        buildSaveData,
        saveFunction,
        triggerSuccess,
        onSaveSuccess,
        onSaveError,
    ]);

    // Toggle auto-save
    const toggleAutoSave = useCallback(() => {
        setAutoSaveEnabled(!autoSaveEnabled);
        toast.info(autoSaveEnabled ? "已关闭自动保存" : "已开启自动保存");
    }, [autoSaveEnabled]);

    // Reset last saved content (call when content is saved manually)
    const resetLastSavedContent = useCallback(() => {
        setLastSavedContent(content);
    }, [content]);

    return {
        autoSaveEnabled,
        isAutoSaving,
        showAutoSaveSuccess: showSuccess,
        toggleAutoSave,
        resetLastSavedContent,
    };
}