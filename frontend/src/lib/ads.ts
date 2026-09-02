import type { Ad, AdSlot } from "@/types";

export const ARTICLE_END_SLOT: AdSlot = "article_end";

export function pickAdByWeight(ads: Ad[]): Ad | null {
  const eligible = ads.filter((ad) => Number.isFinite(ad.weight) && ad.weight >= 1);
  if (eligible.length === 0) {
    return null;
  }

  const totalWeight = eligible.reduce((sum, ad) => sum + ad.weight, 0);
  let ticket = Math.random() * totalWeight;

  for (const ad of eligible) {
    ticket -= ad.weight;
    if (ticket <= 0) {
      return ad;
    }
  }

  return eligible[eligible.length - 1];
}
