"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type StyleTheme = "minimal" | "cyber" | "warm" | "ocean";

interface StyleThemeContextType {
    styleTheme: StyleTheme;
    setStyleTheme: (theme: StyleTheme) => void;
}

const StyleThemeContext = createContext<StyleThemeContextType | undefined>(undefined);

export function useStyleTheme() {
    const context = useContext(StyleThemeContext);
    if (!context) {
        throw new Error("useStyleTheme must be used within a StyleThemeProvider");
    }
    return context;
}

interface StyleThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: StyleTheme;
}

export function StyleThemeProvider({
    children,
    defaultTheme = "minimal",
}: StyleThemeProviderProps) {
    const [styleTheme, setStyleTheme] = useState<StyleTheme>(defaultTheme);

    useEffect(() => {
        const stored = localStorage.getItem("style-theme") as StyleTheme | null;
        if (stored && ["minimal", "cyber", "warm", "ocean"].includes(stored)) {
            setTimeout(() => setStyleTheme(stored), 0);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("style-theme", styleTheme);
        document.documentElement.classList.remove(
            "theme-minimal",
            "theme-cyber",
            "theme-warm",
            "theme-ocean"
        );
        document.documentElement.classList.add(`theme-${styleTheme}`);
    }, [styleTheme]);

    return (
        <StyleThemeContext.Provider value={{ styleTheme, setStyleTheme }}>
            {children}
        </StyleThemeContext.Provider>
    );
}
