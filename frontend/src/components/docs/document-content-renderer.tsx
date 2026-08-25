"use client";

import { useMemo } from "react";
import { ReferenceCard } from "./document-reference-card";
import { ImagePreview } from "@/components/blog/image-preview";
import type { DocumentReference } from "@/types";
import { sanitizeReferenceRecord } from "@/lib/reference-utils";
import { sanitizeHtml } from "@/lib/sanitize";

interface DocumentContentRendererProps {
  html: string;
  references?: Record<string, DocumentReference>;
  className?: string;
}

export function DocumentContentRenderer({
  html,
  references = {},
  className,
}: DocumentContentRendererProps) {
  const safeReferences = useMemo(
    () => sanitizeReferenceRecord<DocumentReference>(references),
    [references],
  );

  const parts = useMemo(() => {
    const result: { type: "html" | "reference"; content: string; refId?: string }[] = [];
    const refPattern = /:::ref\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = refPattern.exec(html)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: "html",
          content: html.slice(lastIndex, match.index),
        });
      }

      const refId = match[1];
      if (safeReferences[refId]) {
        result.push({
          type: "reference",
          content: refId,
          refId,
        });
      } else {
        result.push({
          type: "html",
          content: match[0],
        });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < html.length) {
      result.push({
        type: "html",
        content: html.slice(lastIndex),
      });
    }

    return result;
  }, [html, safeReferences]);

  return (
    <ImagePreview className={className}>
      {parts.map((part, index) => {
        if (part.type === "reference" && part.refId && safeReferences[part.refId]) {
          return (
            <ReferenceCard
              key={`ref-${part.refId}-${index}`}
              reference={safeReferences[part.refId]}
            />
          );
        }
        return (
          <span
            key={`html-${index}`}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(part.content) }}
          />
        );
      })}
    </ImagePreview>
  );
}
