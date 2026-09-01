import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { documentApi, directoryApi } from "@/lib/api";
import type { DocumentResponse } from "@/types";
import { absoluteUrl } from "@/lib/seo";
import { DocDetailClient } from "./doc-detail-client";

const getDocument = cache(async (docId: number): Promise<DocumentResponse | null> => {
  if (!Number.isFinite(docId) || docId <= 0) return null;
  try {
    return await documentApi.getById(docId);
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return null;
  }
});

function buildDocumentTitle(doc: DocumentResponse) {
  const suffix = doc.filename?.trim() || "文档";
  return `${doc.name} | ${suffix}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = Number((await params).id);
  const doc = await getDocument(id);
  if (!doc) notFound();

  const title = buildDocumentTitle(doc);
  return {
    title,
    description: doc.name,
    alternates: { canonical: absoluteUrl(`/docs/${id}`) },
  };
}

export default async function DocDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const docId = Number((await params).id);
  const doc = await getDocument(docId);
  if (!doc) notFound();

  const tree = await directoryApi.getTree();
  return <DocDetailClient docId={docId} initialDoc={doc} initialTree={tree} />;
}
