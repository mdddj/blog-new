import { Suspense } from "react";
import { LoadingState, PublicHome, PUBLIC_CONTAINER } from "@/components/blog/public";
import { blogApi, categoryApi, tagApi } from "@/lib/api";
import { cn } from "@/lib/utils";

function LoadingSkeleton() {
    return (
        <main className={cn(PUBLIC_CONTAINER, "grid gap-4 py-8")}>
            <LoadingState label="正在加载首页内容" />
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
            <PublicHome initialData={initialData} />
        </Suspense>
    );
}
