"use client";

import { useMemo } from "react";
import { ReferenceCard } from "./document-reference-card";
import type { DocumentReference } from "@/types";

interface DocumentContentRendererProps {
    html: string;
    references?: Record<string, DocumentReference>;
    className?: string;
}

export function DocumentContentRenderer({ html, references = {}, className }: DocumentContentRendererProps) {
    // Parse HTML and split by reference markers
    const parts = useMemo(() => {
        const result: { type: "html" | "reference"; content: string; refId?: string }[] = [];
        const refPattern = /:::ref\[([^\]]+)\]/g;
        let lastIndex = 0;
        let match;

        while ((match = refPattern.exec(html)) !== null) {
            // Add HTML before the reference
            if (match.index > lastIndex) {
                result.push({
                    type: "html",
                    content: html.slice(lastIndex, match.index),
                });
            }

            // Add the reference marker
            const refId = match[1];
            if (references[refId]) {
                result.push({
                    type: "reference",
                    content: refId,
                    refId,
                });
            } else {
                // Reference not found, keep as HTML
                result.push({
                    type: "html",
                    content: match[0],
                });
            }

            lastIndex = match.index + match[0].length;
        }

        // Add remaining HTML
        if (lastIndex < html.length) {
            result.push({
                type: "html",
                content: html.slice(lastIndex),
            });
        }

        return result;
    }, [html, references]);

    return (
        <div className={className}>
            {parts.map((part, index) => {
                if (part.type === "reference" && part.refId && references[part.refId]) {
                    return (
                        <ReferenceCard
                            key={`ref-${part.refId}-${index}`}
                            reference={references[part.refId]}
                        />
                    );
                }
                return (
                    <span
                        key={`html-${index}`}
                        dangerouslySetInnerHTML={{ __html: part.content }}
                    />
                );
            })}
        </div>
    );
}
