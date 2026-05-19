"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card, Divider, Icon } from "@/lib/animal-ui";
import { useSiteConfig } from "@/contexts/site-config-context";
import type { Category, Tag } from "@/types";

interface IslandSidebarProps {
  categories: Category[];
  tags: Tag[];
  title?: string;
}

export function IslandSidebar({ categories, tags, title = "岛屿索引" }: IslandSidebarProps) {
  const router = useRouter();
  const { config } = useSiteConfig();

  return (
    <aside className="grid gap-4">
      <Card color="warm-peach-pink">
        <div className="flex items-center gap-4">
          {config.owner_avatar ? (
            <Image
              src={config.owner_avatar}
              alt={config.owner_name || "作者头像"}
              width={58}
              height={58}
              className="rounded-full object-cover"
            />
          ) : (
            <Icon name="icon-chat" size={58} bounce />
          )}
          <div>
            <div className="font-black">{config.owner_name || "作者"}</div>
            <p className="mt-1 line-clamp-3 text-sm leading-6">
              {config.owner_bio || "欢迎浏览这里整理的文章与资料。"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 font-black">
          <Icon name="icon-map" size={24} bounce />
          {title}
        </div>
        <Divider type="line-brown" />
        <div className="grid gap-2">
          {categories.slice(0, 10).map((category) => (
            <Button
              key={category.id}
              type="dashed"
              block
              onClick={() => router.push(`/category/${category.id}`)}
            >
              {category.name} ({category.blog_count || 0})
            </Button>
          ))}
          {categories.length === 0 ? <p className="text-sm">暂无分类</p> : null}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 font-black">
          <Icon name="icon-critterpedia" size={24} bounce />
          热门标签
        </div>
        <Divider type="line-teal" />
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 20).map((tag) => (
            <Button
              key={tag.id}
              type="text"
              size="small"
              onClick={() => router.push(`/tag/${tag.id}`)}
            >
              #{tag.name}
            </Button>
          ))}
          {tags.length === 0 ? <p className="text-sm">暂无标签</p> : null}
        </div>
      </Card>
    </aside>
  );
}
