"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button, Card, Icon, Loading, Modal } from "@/lib/animal-ui";
import type { BlogReference } from "@/types";
import { sanitizeReference } from "@/lib/reference-utils";

const MDPreview = dynamic(() => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown), {
  ssr: false,
  loading: () => (
    <Card type="dashed">
      <div className="flex min-h-28 items-center justify-center">
        <Loading active />
      </div>
    </Card>
  ),
});

interface ReferenceCardProps {
  reference: BlogReference;
}

export function ReferenceCard({ reference }: ReferenceCardProps) {
  const [open, setOpen] = useState(false);
  const safeReference = sanitizeReference<BlogReference>(reference);

  return (
    <>
      <Button type="dashed" size="small" icon={<Icon name="icon-chat" size={16} />} onClick={() => setOpen(true)}>
        {safeReference.title}
      </Button>

      <Modal
        open={open}
        title={
          <span className="inline-flex items-center gap-2">
            <Icon name="icon-chat" size={22} bounce />
            {safeReference.title}
          </span>
        }
        width="min(720px, calc(100vw - 2rem))"
        footer={null}
        onClose={() => setOpen(false)}
        typewriter={false}
      >
        <div className="max-h-[65vh] overflow-auto" data-color-mode="light">
          <MDPreview source={safeReference.content} />
        </div>
      </Modal>
    </>
  );
}

export function parseReferences(
  content: string,
  references: Record<string, BlogReference>,
): { type: "text" | "reference"; content: string; reference?: BlogReference }[] {
  const refPattern = /:::ref\[([^\]]+)\]/g;
  const parts: { type: "text" | "reference"; content: string; reference?: BlogReference }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = refPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }

    const refId = match[1];
    const reference = references[refId];
    parts.push(reference ? { type: "reference", content: refId, reference } : { type: "text", content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  return parts;
}
