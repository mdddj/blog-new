import type { Metadata } from "next";
import { textApi } from "@/lib/api";
import type { Text } from "@/types";
import { TextDetailClient } from "./text-detail-client";

async function getText(textKey: string): Promise<Text | null> {
  if (!textKey.trim()) {
    return null;
  }

  try {
    return await textApi.getPublicByKey(textKey);
  } catch (error) {
    console.error("Failed to fetch text for metadata:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const text = await getText(id);

  if (!text) {
    return {
      title: "字典文本未找到",
    };
  }

  return {
    title: text.name,
    description: text.intro || text.name,
  };
}

export default async function TextDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TextDetailClient textKey={id} />;
}
