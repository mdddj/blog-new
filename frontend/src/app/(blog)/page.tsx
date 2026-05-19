import { Suspense } from "react";
import { IslandHome } from "@/components/blog/island";
import { blogApi, categoryApi, tagApi } from "@/lib/api";
import { Card, Loading } from "@/lib/animal-ui";

function LoadingSkeleton() {
    return (
        <main className="mx-auto grid w-[min(1180px,calc(100vw-2rem))] gap-4 py-6">
            <Card type="dashed">
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Loading active />
                </div>
            </Card>
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
