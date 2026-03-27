import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const FAVICON_CANDIDATE_PATHS = [
    path.join(process.cwd(), "public", "favicon.ico"),
    path.join(process.cwd(), "frontend", "public", "favicon.ico"),
];

async function resolveFaviconPath() {
    for (const candidatePath of FAVICON_CANDIDATE_PATHS) {
        try {
            await access(candidatePath);
            return candidatePath;
        } catch {
            continue;
        }
    }

    return null;
}

export async function GET() {
    try {
        const faviconPath = await resolveFaviconPath();
        if (!faviconPath) {
            throw new Error("Local favicon.ico not found");
        }

        const iconBuffer = await readFile(faviconPath);

        return new NextResponse(iconBuffer, {
            headers: {
                "Content-Type": "image/x-icon",
                "Cache-Control": "public, max-age=86400, s-maxage=86400",
            },
        });
    } catch (error) {
        console.error("[favicon] Error serving local icon:", error);
    }

    // Fallback: 返回一个简单的 1x1 透明 PNG
    const transparentPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
    );

    return new NextResponse(transparentPng, {
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=60",
        },
    });
}
