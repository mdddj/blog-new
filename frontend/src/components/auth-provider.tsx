"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    isAuthenticated,
    login as authLogin,
    logout as authLogout,
    getCurrentUser,
    ensureValidToken,
    refreshToken,
    isTokenExpired,
} from "@/lib/auth";
import type { LoginRequest, LoginResponse } from "@/types";

interface AuthUser {
    id: number;
    username: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    login: (credentials: LoginRequest) => Promise<LoginResponse>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            try {
                if (isAuthenticated()) {
                    // Try to ensure token is valid
                    const valid = await ensureValidToken();
                    if (valid) {
                        const currentUser = getCurrentUser();
                        setUser(currentUser);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Set up auto-refresh interval
    useEffect(() => {
        if (!user) return;

        const checkAndRefresh = async () => {
            // If token is about to expire (within 5 minutes), refresh it
            if (isTokenExpired(5)) {
                const result = await refreshToken();
                if (!result) {
                    // Refresh failed, log out
                    setUser(null);
                    router.push("/admin/login");
                }
            }
        };

        // Check every minute
        const interval = setInterval(checkAndRefresh, 60 * 1000);

        return () => clearInterval(interval);
    }, [user, router]);

    // Redirect to login if accessing protected routes while not authenticated
    useEffect(() => {
        if (isLoading) return;

        const isAdminRoute = pathname?.startsWith("/admin") && pathname !== "/admin/login";

        if (isAdminRoute && !user) {
            router.push("/admin/login");
        }
    }, [isLoading, user, pathname, router]);

    const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await authLogin(credentials);
        const currentUser = getCurrentUser();
        setUser(currentUser);
        return response;
    }, []);

    const logout = useCallback(() => {
        authLogout();
        setUser(null);
        router.push("/admin/login");
    }, [router]);

    const value: AuthContextType = {
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
