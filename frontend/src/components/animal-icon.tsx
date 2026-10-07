"use client";

import type { ComponentType } from "react";
import {
  AirplaneIcon,
  BookIcon,
  CameraIcon,
  ChatIcon,
  HomeIcon,
  LeafIcon,
  MapIcon,
  PencilIcon,
  PaintbrushIcon,
  RefreshIcon,
  ShoppingBagIcon,
} from "naive-icons";
import type { IconProps } from "naive-icons";
import { cn } from "@/lib/utils";

/**
 * Island icons, backed by the MIT-licensed `naive-icons` package.
 *
 * `animal-island-ui` 2.x ships no icons: v1.x had an `Icon` / `ICON_LIST` component with 10
 * full-colour island SVGs, and 2.x delegates icon art to `naive-icons` (159 stroke-based
 * folk-art icons). This module keeps the old `name="icon-…"` call sites working while
 * mapping each one to its nearest `naive-icons` equivalent.
 *
 * The v1.x SVGs must NOT be reinstated: they shipped under CC BY-NC 4.0 (non-commercial
 * only) while 2.x is MIT, and this site renders sponsored placements.
 */
export type AnimalIconName =
  | "icon-home"
  | "icon-miles"
  | "icon-camera"
  | "icon-chat"
  | "icon-critterpedia"
  | "icon-design"
  | "icon-diy"
  | "icon-helicopter"
  | "icon-map"
  | "icon-shopping"
  | "icon-variant";

type NaiveIcon = ComponentType<IconProps>;

/** Legacy v1.x island icon → naive-icons substitute (matched by meaning, not shape). */
const ANIMAL_ICON_COMPONENTS: Record<AnimalIconName, NaiveIcon> = {
  "icon-home": HomeIcon,
  "icon-miles": LeafIcon,
  "icon-camera": CameraIcon,
  "icon-chat": ChatIcon,
  "icon-critterpedia": BookIcon,
  "icon-design": PaintbrushIcon,
  "icon-diy": PencilIcon,
  "icon-helicopter": AirplaneIcon,
  "icon-map": MapIcon,
  "icon-shopping": ShoppingBagIcon,
  "icon-variant": RefreshIcon,
};

export interface AnimalIconProps {
  name: AnimalIconName;
  size?: number | string;
  bounce?: boolean;
  className?: string;
}

export function AnimalIcon({ name, size = 24, bounce = false, className }: AnimalIconProps) {
  const Icon = ANIMAL_ICON_COMPONENTS[name];

  return (
    <Icon
      size={size}
      color="currentColor"
      aria-hidden="true"
      className={cn("inline-block align-middle", bounce && "animal-icon-bounce", className)}
    />
  );
}
