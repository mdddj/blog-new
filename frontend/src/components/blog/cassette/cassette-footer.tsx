"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Mail, Twitter, Send, MessageCircle } from "lucide-react";
import { useSiteConfig } from "@/contexts/site-config-context";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function CassetteFooter() {
    const currentYear = new Date().getFullYear();
    const { config } = useSiteConfig();

    return (
        <footer className="cf-footer">
            <div className="cf-footer-inner">
                <div className="cf-footer-status">
                    <div className="cf-status-item">
                        <span className="cf-status-dot" />
                        <span>SYSTEM ONLINE</span>
                    </div>
                    {/* 备案信息 */}
                    {config.icp_number && (
                        <div className="cf-status-item">
                            <Link
                                href="https://beian.miit.gov.cn/"
                                target="_blank"
                                className="hover:text-(--cf-cyan)"
                            >
                                {config.icp_number}
                            </Link>
                        </div>
                    )}
                    {config.police_number && (
                        <div className="cf-status-item">
                            <Link
                                href="http://www.beian.gov.cn/"
                                target="_blank"
                                className="hover:text-(--cf-cyan)"
                            >
                                {config.police_number}
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 max-w-full">
                    {config.social_github && (
                        <Link
                            href={config.social_github}
                            target="_blank"
                            className="cf-btn-icon w-8! h-8!"
                            aria-label="GitHub"
                        >
                            <Github className="w-3.5 h-3.5" />
                        </Link>
                    )}
                    {config.social_twitter && (
                        <Link
                            href={config.social_twitter}
                            target="_blank"
                            className="cf-btn-icon w-8! h-8!"
                            aria-label="Twitter"
                        >
                            <Twitter className="w-3.5 h-3.5" />
                        </Link>
                    )}
                    {config.social_telegram && (
                        <Link
                            href={config.social_telegram}
                            target="_blank"
                            className="cf-btn-icon w-8! h-8!"
                            aria-label="Telegram"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </Link>
                    )}
                    {config.social_weibo && (
                        <Link
                            href={config.social_weibo}
                            target="_blank"
                            className="cf-btn-icon w-8! h-8!"
                            aria-label="微博"
                        >
                            <span className="text-xs font-bold">微</span>
                        </Link>
                    )}
                    {config.social_zhihu && (
                        <Link
                            href={config.social_zhihu}
                            target="_blank"
                            className="cf-btn-icon w-8! h-8!"
                            aria-label="知乎"
                        >
                            <span className="text-xs font-bold">知</span>
                        </Link>
                    )}
                    {/* QQ 二维码 */}
                    {config.social_qq_qrcode && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className="cf-btn-icon w-8! h-8!"
                                    aria-label="QQ"
                                >
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
                    {/* 微信二维码 */}
                    {config.social_wechat_qrcode && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className="cf-btn-icon w-8! h-8!"
                                    aria-label="微信"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
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
                        <Link
                            href={`mailto:${config.owner_email}`}
                            className="cf-btn-icon w-8! h-8!"
                            aria-label="Email"
                        >
                            <Mail className="w-3.5 h-3.5" />
                        </Link>
                    )}
                </div>

                <div className="hidden sm:block">
                    {config.footer_text && (
                        <div
                            className="w-full text-center text-xs [&_a]:text-(--cf-cyan) [&_a]:hover:underline"
                            dangerouslySetInnerHTML={{ __html: config.footer_text }}
                        />
                    )}
                    © {currentYear} {config.site_title || "TERMINAL_BLOG"} {"// ALL_RIGHTS_RESERVED"}
                </div>


            </div>
        </footer>
    );
}
