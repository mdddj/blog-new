"use client";

import { useEffect, useRef } from "react";

interface EditorSurfaceEvents {
  onPaste?: (event: React.ClipboardEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  onInteraction?: (event: React.SyntheticEvent) => void;
}

export function useEditorSurfaceEvents({ onPaste, onDrop, onInteraction }: EditorSurfaceEvents) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handlePaste = (event: ClipboardEvent) => {
      onPaste?.(event as unknown as React.ClipboardEvent);
    };
    const handleDrop = (event: DragEvent) => {
      onDrop?.(event as unknown as React.DragEvent);
    };
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };
    const handleInteraction = (event: Event) => {
      onInteraction?.(event as unknown as React.SyntheticEvent);
    };

    el.addEventListener("paste", handlePaste);
    el.addEventListener("drop", handleDrop);
    el.addEventListener("dragover", handleDragOver);
    el.addEventListener("click", handleInteraction);
    el.addEventListener("keyup", handleInteraction);

    return () => {
      el.removeEventListener("paste", handlePaste);
      el.removeEventListener("drop", handleDrop);
      el.removeEventListener("dragover", handleDragOver);
      el.removeEventListener("click", handleInteraction);
      el.removeEventListener("keyup", handleInteraction);
    };
  }, [onPaste, onDrop, onInteraction]);

  return ref;
}
