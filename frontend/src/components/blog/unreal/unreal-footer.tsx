"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Mail, Twitter, Send, MessageCircle, Hexagon, Shield } from "lucide-react";
import { useSiteConfig } from "@/contexts/site-config-context";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Tech stack items with icons
const techStack = [
    { name: "Next.js", icon: "/tech/nextjs.svg", url: "https://nextjs.org" },
    { name: "React", icon: "/tech/react.svg", url: "https://react.dev" },
    { name: "TypeScript", icon: "/tech/typescript.svg", url: "https://typescriptlang.org" },
    { name: "Tailwind CSS", icon: "/tech/tailwindcss.svg", url: "https://tailwindcss.com" },
    { name: "Rust", icon: "/tech/rust.svg", url: "https://rust-lang.org" },
    { name: "PostgreSQL", icon: "/tech/postgresql.svg", url: "https://postgresql.org" },
];

export function UnrealFooter() {
    const currentYear = new Date().getFullYear();
    const { config } = useSiteConfig();

    return (
        <footer className="ue-footer">
            {/* Tech Stack Section */}
            <div className="ue-footer-tech">
                <div className="ue-footer-tech-label">
                    <span className="ue-tech-dot" />
                    TECH STACK
                </div>
                <div className="ue-footer-tech-list">
                    {techStack.map((tech) => (
                        <Link
                            key={tech.name}
                            href={tech.url}
                            target="_blank"
                            className="ue-tech-item"
                            title={tech.name}
                        >
                            <Image
                                src={tech.icon}
                                alt={tech.name}
                                width={20}
                                height={20}
                                className="ue-tech-icon"
                            />
                            <span>{tech.name}</span>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="ue-footer-divider" />

            <div className="ue-footer-inner">
                <div className="flex items-center gap-3">
                    <Hexagon className="w-5 h-5 text-[var(--ue-blue)]" />
                    <span className="text-sm font-medium text-[var(--ue-text)]">
                        {config.site_title || "BLOG"}
                    </span>
                </div>

                <div className="ue-footer-links">
                    {config.social_github && (
                        <Link href={config.social_github} target="_blank" className="ue-footer-link">
                            <Github />
                        </Link>
                    )}
                    {config.social_twitter && (
                        <Link href={config.social_twitter} target="_blank" className="ue-footer-link">
                            <Twitter />
                        </Link>
                    )}
                    {config.social_telegram && (
                        <Link href={config.social_telegram} target="_blank" className="ue-footer-link">
                            <Send />
                        </Link>
                    )}
                    {config.social_weibo && (
                        <Link href={config.social_weibo} target="_blank" className="ue-footer-link" title="微博">
                            <span className="text-xs font-bold">微</span>
                        </Link>
                    )}
                    {config.social_zhihu && (
                        <Link href={config.social_zhihu} target="_blank" className="ue-footer-link" title="知乎">
                            <span className="text-xs font-bold">知</span>
                        </Link>
                    )}
                    {config.social_qq_qrcode && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="ue-footer-link" title="QQ">
                                    <span className="text-xs font-bold">Q</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" side="top">
                                <Image
                                    src={config.social_qq_qrcode}
                                    alt="QQ二维码"
                                    width={150}
                                    height={150}
                                    className="rounded"
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                    {config.social_wechat_qrcode && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="ue-footer-link" title="微信">
                                    <MessageCircle />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" side="top">
                                <Image
                                    src={config.social_wechat_qrcode}
                                    alt="微信二维码"
                                    width={150}
                                    height={150}
                                    className="rounded"
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                    {config.owner_email && (
                        <Link href={`mailto:${config.owner_email}`} className="ue-footer-link">
                            <Mail />
                        </Link>
                    )}
                </div>

                <div className="ue-footer-text">
                    {config.icp_number && (
                        <Link href="https://beian.miit.gov.cn/" target="_blank">
                            {config.icp_number}
                        </Link>
                    )}
                    {config.police_number && (
                        <Link
                            href="http://www.beian.gov.cn/"
                            target="_blank"
                            className="flex items-center gap-1"
                        >
                            <Shield className="w-3.5 h-3.5" />
                            {config.police_number}
                        </Link>
                    )}
                    <span>© {currentYear} {config.site_title || "Blog"}. All rights reserved.</span>
                </div>
            </div>
        </footer>
    );
}
