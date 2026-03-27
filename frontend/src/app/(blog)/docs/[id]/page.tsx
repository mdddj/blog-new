import type { Metadata } from "next";
import { documentApi } from "@/lib/api";
import type { DocumentResponse } from "@/types";
import { DocDetailClient } from "./doc-detail-client";

async function getDocument(docId: number): Promise<DocumentResponse | null> {
  if (!Number.isFinite(docId) || docId <= 0) {
    return null;
  }

  try {
    return await documentApi.getById(docId);
  } catch (error) {
    console.error("Failed to fetch document for metadata:", error);
    return null;
  }
}

function buildDocumentTitle(doc: DocumentResponse): string {
  const suffix = doc.filename?.trim() || "文档";
  return `${doc.name} | ${suffix}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = await getDocument(Number(id));

  if (!doc) {
    return {
      title: "文档未找到",
    };
  }

  return {
    title: buildDocumentTitle(doc),
    description: doc.name,
  };
}

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocDetailClient docId={Number(id)} />;
}
