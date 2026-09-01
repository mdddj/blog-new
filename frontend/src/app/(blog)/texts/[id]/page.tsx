import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { textApi } from "@/lib/api";
import type { Text } from "@/types";
import { absoluteUrl, cleanText } from "@/lib/seo";
import { TextDetailClient } from "./text-detail-client";

const getText = cache(async (textKey: string): Promise<Text | null> => {
  if (!textKey.trim()) return null;
  try {
    return await textApi.getPublicByKey(textKey);
  } catch (error) {
    console.error("Failed to fetch text:", error);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const text = await getText(id);
  if (!text) notFound();

  const description = cleanText(text.intro || `${text.name} 公开文本`, 160);
  return {
    title: text.name,
    description,
    alternates: { canonical: absoluteUrl(`/texts/${encodeURIComponent(id)}`) },
    robots: text.is_encrypted ? { index: false, follow: false } : undefined,
  };
}

export default async function TextDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const text = await getText(id);
  if (!text) notFound();
  return <TextDetailClient textKey={id} initialText={text} />;
}
