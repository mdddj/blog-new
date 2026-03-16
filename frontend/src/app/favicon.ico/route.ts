import { NextResponse } from "next/server";

// 服务端使用内部 API URL（Docker 网络），客户端使用公开 URL
const API_BASE_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.itbug.shop/api/v1";
const PUBLIC_FALLBACK_API_URL = process.env.NEXT_PUBLIC_FALLBACK_API_URL || "https://api.itbug.shop/api/v1";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // 获取站点配置
        let configRes = await fetch(`${API_BASE_URL}/config`, { cache: "no-store" });
        if (!configRes.ok && API_BASE_URL !== PUBLIC_FALLBACK_API_URL) {
            configRes = await fetch(`${PUBLIC_FALLBACK_API_URL}/config`, { cache: "no-store" });
        }

        if (configRes.ok) {
            const data = await configRes.json();
            const avatarUrl = data.data?.owner_avatar;

            if (avatarUrl) {
                // 获取头像图片
                const imageRes = await fetch(avatarUrl);

                if (imageRes.ok) {
                    const imageBuffer = await imageRes.arrayBuffer();
                    const contentType = imageRes.headers.get("content-type") || "image/png";

                    return new NextResponse(imageBuffer, {
                        headers: {
                            "Content-Type": contentType,
                            "Cache-Control": "public, max-age=3600, s-maxage=3600",
                        },
                    });
                }
            }
        }
    } catch (e) {
        console.error("[favicon] Error:", e);
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
