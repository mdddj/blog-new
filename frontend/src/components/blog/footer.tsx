"use client";

import Link from "next/link";
import { Github, Mail, Heart } from "lucide-react";

export function BlogFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t bg-background">
            <div className="container mx-auto px-4 py-6 sm:py-8">
                <div className="flex flex-col items-center gap-3 sm:gap-4 md:flex-row md:justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="https://github.com"
                            target="_blank"
                            className="text-muted-foreground transition-colors hover:text-foreground p-2 -m-2"
                            aria-label="GitHub"
                        >
                            <Github className="h-5 w-5" />
                        </Link>
                        <Link
                            href="mailto:example@example.com"
                            className="text-muted-foreground transition-colors hover:text-foreground p-2 -m-2"
                            aria-label="Email"
                        >
                            <Mail className="h-5 w-5" />
                        </Link>
                    </div>
                    <p className="flex flex-wrap items-center justify-center gap-1 text-xs sm:text-sm text-muted-foreground text-center">
                        <span>© {currentYear} Blog.</span>
                        <span className="flex items-center gap-1">
                            Made with
                            <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        </span>
                        <span className="hidden sm:inline">using Next.js & Rust</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
