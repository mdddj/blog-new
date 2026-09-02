"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Icon, Tag } from "animal-island-ui";
import { PublicCard } from "@/components/blog/public";
import type { Ad } from "@/types";

const SPONSORED_REL = "noopener noreferrer sponsored";

export function ArticleEndAd({ ad }: { ad: Ad }) {
  const [imageHidden, setImageHidden] = useState(false);

  const openTarget = () => {
    window.open(ad.target_url, "_blank", "noopener,noreferrer");
  };

  return (
    <aside className="mx-auto grid w-full max-w-190 min-w-0" aria-label="广告">
      <PublicCard color="default" className="grid gap-4 overflow-hidden p-4 sm:p-5">
        <div className="flex items-center">
          <Tag color="app-orange" size="small">
            广告
          </Tag>
        </div>

        <a
          href={ad.target_url}
          target="_blank"
          rel={SPONSORED_REL}
          className="relative block aspect-video overflow-hidden rounded-[var(--animal-border-radius-lg)] bg-[var(--animal-bg-color-secondary)]"
          aria-label={ad.title}
        >
          {imageHidden ? null : (
            <Image
              src={ad.image_url}
              alt={ad.title}
              fill
              sizes="(max-width: 768px) 100vw, 760px"
              className="object-cover"
              onError={() => setImageHidden(true)}
            />
          )}
        </a>

        <div className="grid min-w-0 gap-2">
          <a
            href={ad.target_url}
            target="_blank"
            rel={SPONSORED_REL}
            className="wrap-break-word text-xl font-extrabold leading-snug text-[var(--animal-text-color)] hover:underline"
          >
            {ad.title}
          </a>
          {ad.intro ? (
            <p className="text-sm font-medium leading-6 text-[var(--animal-text-color-secondary)]">
              {ad.intro}
            </p>
          ) : null}
        </div>

        <div>
          <Button
            type="primary"
            icon={<Icon name="icon-shopping" size={16} />}
            onClick={openTarget}
          >
            {ad.cta_text || "了解更多"}
          </Button>
        </div>
      </PublicCard>
    </aside>
  );
}
