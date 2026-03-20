import type { BlogReference, DocumentReference } from "@/types";

type ReferenceLike = {
  id?: unknown;
  title?: unknown;
  content?: unknown;
};

type NormalizedReference = {
  id: string;
  title: string;
  content: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function sanitizeReferenceEntry(
  entryKey: string,
  value: unknown,
): NormalizedReference | null {
  if (!isRecord(value)) {
    return null;
  }

  const raw = value as ReferenceLike;
  const id = toStringOrEmpty(raw.id).trim() || entryKey;
  const title = toStringOrEmpty(raw.title).trim() || `引用 ${id}`;
  const content = toStringOrEmpty(raw.content);

  return { id, title, content };
}

export function sanitizeReferenceRecord<T extends BlogReference | DocumentReference>(
  input: unknown,
): Record<string, T> {
  if (!isRecord(input)) {
    return {};
  }

  const normalized = Object.entries(input).reduce<Record<string, T>>((acc, [key, value]) => {
    const entry = sanitizeReferenceEntry(key, value);
    if (entry) {
      acc[entry.id] = entry as T;
    }
    return acc;
  }, {});

  return normalized;
}

export function sanitizeReference<T extends BlogReference | DocumentReference>(
  reference: unknown,
  fallbackId = "ref-unknown",
): T {
  const entry = sanitizeReferenceEntry(fallbackId, reference) ?? {
    id: fallbackId,
    title: `引用 ${fallbackId}`,
    content: "",
  };

  return entry as T;
}

export function getReferencePreview(content: unknown, maxLength = 150): string {
  const plainText = toStringOrEmpty(content).replace(/[#*`>\-\[\]]/g, "").trim();
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return `${plainText.slice(0, maxLength)}...`;
}
