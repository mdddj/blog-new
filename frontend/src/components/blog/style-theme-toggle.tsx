"use client";

import { Palette, Sparkles, Sun, Waves, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useStyleTheme, type StyleTheme } from "./style-theme-provider";

const themes: { value: StyleTheme; label: string; icon: React.ReactNode; desc: string }[] = [
    {
        value: "minimal",
        label: "极简",
        icon: <Sun className="h-4 w-4" />,
        desc: "黑白灰，大留白",
    },
    {
        value: "cyber",
        label: "赛博",
        icon: <Sparkles className="h-4 w-4" />,
        desc: "霓虹渐变，科技感",
    },
    {
        value: "warm",
        label: "暖调",
        icon: <Flame className="h-4 w-4" />,
        desc: "复古温馨，衬线字体",
    },
    {
        value: "ocean",
        label: "海洋",
        icon: <Waves className="h-4 w-4" />,
        desc: "蓝绿色系，清新通透",
    },
];

export function StyleThemeToggle() {
    const { styleTheme, setStyleTheme } = useStyleTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                    <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="sr-only">切换风格主题</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>选择风格</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {themes.map((theme) => (
                    <DropdownMenuItem
                        key={theme.value}
                        onClick={() => setStyleTheme(theme.value)}
                        className={styleTheme === theme.value ? "bg-accent" : ""}
                    >
                        <span className="flex items-center gap-2 flex-1">
                            {theme.icon}
                            <span className="flex flex-col">
                                <span className="font-medium">{theme.label}</span>
                                <span className="text-xs text-muted-foreground">{theme.desc}</span>
                            </span>
                        </span>
                        {styleTheme === theme.value && (
                            <span className="text-primary">✓</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
