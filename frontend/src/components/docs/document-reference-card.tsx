"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BookOpen, X } from "lucide-react";
import type { DocumentReference } from "@/types";
import { sanitizeReference } from "@/lib/reference-utils";

const MDPreview = dynamic(() => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-28 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      正在加载引用
    </div>
  ),
});

interface DocumentReferenceCardProps {
  reference: DocumentReference;
}

export function ReferenceCard({ reference }: DocumentReferenceCardProps) {
  const [open, setOpen] = useState(false);
  const safeReference = sanitizeReference<DocumentReference>(reference);

  return (
    <>
      <button
        type="button"
        className="mx-1 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 align-baseline transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        onClick={() => setOpen(true)}
      >
        <BookOpen className="h-3.5 w-3.5" />
        {safeReference.title}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true">
          <div className="grid max-h-[82vh] w-[min(720px,100%)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="min-w-0 truncate text-lg font-semibold text-slate-950 dark:text-white">{safeReference.title}</h2>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="关闭引用"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="max-h-[65vh] overflow-auto p-5" data-color-mode="light">
              <MDPreview source={safeReference.content} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
