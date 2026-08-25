"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

interface ResumeFrameProps {
  html: string;
  title: string;
  className?: string;
}

export const ResumeFrame = forwardRef<HTMLIFrameElement, ResumeFrameProps>(function ResumeFrame(
  { html, title, className },
  ref,
) {
  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={html}
      sandbox="allow-modals allow-same-origin"
      referrerPolicy="no-referrer"
      className={cn("block w-full border-0 bg-white", className)}
    />
  );
});
