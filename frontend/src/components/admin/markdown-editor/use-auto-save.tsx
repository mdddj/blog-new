import { useState, useEffect, useCallback, useRef } from "react";
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
    const lastSavedContentRef = useRef("");
    const contentRef = useRef(content);

    const { showSuccess, triggerSuccess } = useAutoSaveSuccess();
    const debouncedContent = useDebounce(content, delay);

    // Update content ref whenever content changes
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Store functions in refs to avoid dependency changes
    const saveFunctionRef = useRef(saveFunction);
    const buildSaveDataRef = useRef(buildSaveData);
    const onSaveSuccessRef = useRef(onSaveSuccess);
    const onSaveErrorRef = useRef(onSaveError);

    // Update refs when functions change
    useEffect(() => {
        saveFunctionRef.current = saveFunction;
    }, [saveFunction]);

    useEffect(() => {
        buildSaveDataRef.current = buildSaveData;
    }, [buildSaveData]);

    useEffect(() => {
        onSaveSuccessRef.current = onSaveSuccess;
    }, [onSaveSuccess]);

    useEffect(() => {
        onSaveErrorRef.current = onSaveError;
    }, [onSaveError]);

    // Auto-save effect
    useEffect(() => {
        if (
            autoSaveEnabled &&
            debouncedContent &&
            debouncedContent !== lastSavedContentRef.current &&
            title.trim()
        ) {
            const performAutoSave = async () => {
                if (isAutoSaving) return;

                setIsAutoSaving(true);
                try {
                    const data = buildSaveDataRef.current();
                    await saveFunctionRef.current(data);
                    lastSavedContentRef.current = debouncedContent;
                    triggerSuccess();
                    toast.success("自动保存成功", { duration: 1500 });
                    onSaveSuccessRef.current?.();
                } catch (err) {
                    const error = err instanceof Error ? err : new Error("未知错误");
                    toast.error("自动保存失败: " + error.message);
                    onSaveErrorRef.current?.(error);
                } finally {
                    setIsAutoSaving(false);
                }
            };

            performAutoSave();
        }
    }, [autoSaveEnabled, debouncedContent, title, isAutoSaving, triggerSuccess]);

    // Toggle auto-save - stable function
    const toggleAutoSave = useCallback(() => {
        setAutoSaveEnabled(prev => {
            const newValue = !prev;
            toast.info(newValue ? "已开启自动保存" : "已关闭自动保存");
            return newValue;
        });
    }, []);

    // Reset last saved content - stable function without dependencies
    const resetLastSavedContent = useCallback(() => {
        lastSavedContentRef.current = contentRef.current;
    }, []);

    return {
        autoSaveEnabled,
        isAutoSaving,
        showAutoSaveSuccess: showSuccess,
        toggleAutoSave,
        resetLastSavedContent,
    };
}