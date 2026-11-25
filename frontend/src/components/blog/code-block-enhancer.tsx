"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button as AIButton } from "animal-island-ui";
import { CheckIcon, CopyIcon } from "naive-icons";

interface CodeBlockHost {
  key: string;
  host: HTMLElement;
  pre: HTMLPreElement;
}

function languageOf(pre: HTMLPreElement): string {
  const code = pre.querySelector("code");
  const match = code?.className.match(/language-([\w#+.-]+)/);
  return match ? match[1] : "text";
}

/**
 * Wraps a server-rendered `<pre>` in a `.code-block` frame with a header
 * (language label + action slot). Idempotent: re-running reuses the frame.
 */
function ensureFrame(pre: HTMLPreElement): HTMLElement {
  const parent = pre.parentElement;
  const existing = parent?.classList.contains("code-block")
    ? parent.querySelector<HTMLElement>(".code-block__actions")
    : null;
  if (existing) return existing;

  const frame = document.createElement("div");
  frame.className = "code-block";
  const header = document.createElement("div");
  header.className = "code-block__header";
  const lang = document.createElement("span");
  lang.className = "code-block__lang";
  lang.textContent = languageOf(pre);
  const actions = document.createElement("span");
  actions.className = "code-block__actions";
  header.append(lang, actions);
  pre.before(frame);
  frame.append(header, pre);
  return actions;
}

function CopyCodeButton({ pre }: { pre: HTMLPreElement }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <AIButton
      type="text"
      size="small"
      aria-label={copied ? "代码已复制" : "复制代码"}
      icon={copied ? <CheckIcon size={14} color="currentColor" /> : <CopyIcon size={14} color="currentColor" />}
      onClick={async () => {
        const text = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          // Clipboard unavailable (insecure context / denied): leave the label unchanged.
        }
      }}
    >
      {copied ? "已复制" : "复制"}
    </AIButton>
  );
}

/**
 * Adds a language header + copy button to every code block inside `children`.
 * `watch` should change whenever the inner HTML changes (pass the article HTML).
 */
export function CodeBlockEnhancer({
  children,
  watch,
}: {
  children: React.ReactNode;
  watch: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0);
  const [hosts, setHosts] = useState<CodeBlockHost[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    generationRef.current += 1;
    const generation = generationRef.current;
    const pres = Array.from(container.querySelectorAll<HTMLPreElement>("pre"));
    setHosts(
      pres.map((pre, index) => ({
        key: `${generation}-${index}`,
        pre,
        host: ensureFrame(pre),
      })),
    );
  }, [watch]);

  return (
    <div ref={containerRef}>
      {children}
      {hosts.map((item) => createPortal(<CopyCodeButton pre={item.pre} />, item.host, item.key))}
    </div>
  );
}
