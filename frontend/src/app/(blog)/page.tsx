import { Suspense } from "react";
import { CassetteHome } from "./cassette-home";
import { blogApi, categoryApi, tagApi } from "@/lib/api";

function LoadingSkeleton() {
    return (
        <main className="cf-main">
            <div className="cf-featured animate-pulse bg-[var(--cf-bg-panel)] h-[400px] border border-[var(--cf-border)]" />
            
            <div className="cf-section-header mt-8">
                <div className="h-6 w-48 bg-[var(--cf-bg-elevated)] rounded animate-pulse" />
                <div className="h-6 w-20 bg-[var(--cf-bg-elevated)] rounded animate-pulse" />
            </div>

            <div className="cf-grid cf-grid-2-1 mt-6">
                <div className="cf-grid cf-grid-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 bg-[var(--cf-bg-panel)] border border-[var(--cf-border)] animate-pulse" />
                    ))}
                </div>
                <div className="hidden lg:block space-y-8">
                    <div className="h-48 bg-[var(--cf-bg-panel)] border-l border-dashed border-[var(--cf-border)] animate-pulse" />
                </div>
            </div>
        </main>
    );
}

export default async function HomePage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const pageSize = 9;

    let initialData = undefined;
    try {
        const [blogsRes, categoriesRes, tagsRes] = await Promise.all([
            blogApi.list(page, pageSize),
            categoryApi.list(),
            tagApi.list(),
        ]);
        initialData = {
            blogs: blogsRes.items,
            pagination: {
                total: blogsRes.total,
                totalPages: blogsRes.total_pages,
            },
            categories: categoriesRes,
            tags: tagsRes,
        };
    } catch (error) {
        console.error("Failed to fetch initial data server-side:", error);
    }

    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <CassetteHome initialData={initialData} />
        </Suspense>
    );
}
