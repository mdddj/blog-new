"use client";

import { useState, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminLayoutProps {
    children: React.ReactNode;
}

// Helper to read sidebar state from localStorage
function getSidebarCollapsedFromStorage(): boolean {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
}

// Subscribe function for useSyncExternalStore
function subscribeToStorage(callback: () => void) {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const { isLoading } = useAuth();

    // Use useSyncExternalStore to read initial value from localStorage without triggering cascading renders
    const initialCollapsed = useSyncExternalStore(
        subscribeToStorage,
        getSidebarCollapsedFromStorage,
        () => false // Server snapshot
    );

    const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsed);

    // Save sidebar state to localStorage
    const handleToggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
            <Header sidebarCollapsed={sidebarCollapsed} />
            <main
                className={cn(
                    "min-h-screen pt-16 transition-all duration-300",
                    sidebarCollapsed ? "pl-16" : "pl-64"
                )}
            >
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
