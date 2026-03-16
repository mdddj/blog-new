import { Suspense } from "react";
import { IslandHome } from "@/components/blog/island";
import { blogApi, categoryApi, tagApi } from "@/lib/api";

function LoadingSkeleton() {
    return (
        <main className="island-main">
            <div className="island-container island-page">
                <div className="island-panel island-skeleton h-[320px]" />
                <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="island-panel island-skeleton h-60" />
                        ))}
                    </div>
                    <div className="island-panel island-skeleton h-96" />
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
            <IslandHome initialData={initialData} />
        </Suspense>
    );
}
