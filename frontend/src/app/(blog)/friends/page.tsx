import type { Metadata } from "next";
import { friendLinkApi } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";
import { FriendsClient } from "./friends-client";

export const metadata: Metadata = {
  title: "友情链接",
  description: "发现梁典典长期阅读与交流的技术站点。",
  alternates: { canonical: absoluteUrl("/friends") },
};

export default async function FriendsPage() {
  const links = await friendLinkApi.list();
  return <FriendsClient links={links} />;
}
