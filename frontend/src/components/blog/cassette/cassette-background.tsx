"use client";

export function CassetteBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
            {/* Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--cf-amber)] opacity-[0.03] blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--cf-cyan)] opacity-[0.03] blur-[100px]" />
            
            {/* Perspective Grid Line (Horizon) */}
            <div 
                className="absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--cf-amber-dim)] to-transparent opacity-20"
            />
            
            {/* Random Floating Tech Elements */}
            <div className="absolute top-[15%] right-[5%] w-24 h-24 border border-[var(--cf-border)] opacity-10 rounded-full animate-[spin_60s_linear_infinite]" />
            <div className="absolute top-[40%] left-[2%] w-2 h-2 bg-[var(--cf-red)] opacity-40 animate-pulse" />
            <div className="absolute bottom-[20%] right-[10%] w-32 h-1 bg-[var(--cf-text-dim)] opacity-10 rotate-45" />
            
            {/* Vertical Data Lines */}
            <div className="absolute top-0 left-[15%] w-[1px] h-full bg-[var(--cf-border)] opacity-[0.05]" />
            <div className="absolute top-0 right-[15%] w-[1px] h-full bg-[var(--cf-border)] opacity-[0.05]" />
        </div>
    );
}
