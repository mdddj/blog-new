"use client";

import { useEffect, useState } from "react";

export function IslandReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const documentElement = document.documentElement;
            const scrollTop = documentElement.scrollTop || document.body.scrollTop;
            const scrollHeight = documentElement.scrollHeight - documentElement.clientHeight;
            const ratio = scrollHeight <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / scrollHeight));
            setProgress(ratio);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    return (
        <div
            className="island-reading-progress"
            role="progressbar"
            aria-label="阅读进度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
        >
            <span style={{ transform: `scaleX(${progress})` }} />
        </div>
    );
}
