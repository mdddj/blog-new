import { Skeleton } from "@/components/ui/skeleton";

export function DocumentPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-9" />
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32 mt-2" />
                </div>
            </div>
            <div className="grid gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
    );
}
