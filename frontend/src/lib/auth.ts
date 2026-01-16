"use client";

import { authApi } from "./api";
import type { LoginRequest, LoginResponse } from "@/types";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TOKEN_EXPIRY_KEY = "token_expiry";

// Token storage functions
export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getTokenExpiry(): number | null {
    if (typeof window === "undefined") return null;
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
}

export function setTokens(response: LoginResponse): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    // Calculate expiry time (current time + expires_in seconds)
    const expiryTime = Date.now() + response.expires_in * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

export function clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

// Check if token is expired or about to expire (within 5 minutes)
export function isTokenExpired(bufferMinutes: number = 5): boolean {
    const expiry = getTokenExpiry();
    if (!expiry) return true;
    const bufferMs = bufferMinutes * 60 * 1000;
    return Date.now() >= expiry - bufferMs;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
    const token = getAccessToken();
    if (!token) return false;
    return !isTokenExpired(0); // Check if actually expired, not just near expiry
}

// Login function
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await authApi.login(credentials);
    setTokens(response);
    return response;
}

// Logout function
export function logout(): void {
    clearTokens();
}

// Refresh token function
export async function refreshToken(): Promise<LoginResponse | null> {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    try {
        const response = await authApi.refresh({ refresh_token: refresh });
        setTokens(response);
        return response;
    } catch {
        // If refresh fails, clear tokens
        clearTokens();
        return null;
    }
}

// Auto-refresh token if needed
export async function ensureValidToken(): Promise<boolean> {
    if (!getAccessToken()) return false;

    // If token is about to expire (within 5 minutes), refresh it
    if (isTokenExpired(5)) {
        const result = await refreshToken();
        return result !== null;
    }

    return true;
}

// Parse JWT token to get user info (without verification)
export function parseToken(token: string): { sub: number; username: string; exp: number } | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch {
        return null;
    }
}

// Get current user from token
export function getCurrentUser(): { id: number; username: string } | null {
    const token = getAccessToken();
    if (!token) return null;

    const payload = parseToken(token);
    if (!payload) return null;

    return {
        id: payload.sub,
        username: payload.username,
    };
}
