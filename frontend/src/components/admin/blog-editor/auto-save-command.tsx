import { useState } from "react";
import type { ICommand } from "@uiw/react-md-editor";

interface AutoSaveCommandProps {
    autoSaveEnabled: boolean;
    isAutoSaving: boolean;
    onToggle: () => void;
    showSuccess?: boolean;
}

// Create auto-save toggle command with success animation
export function createAutoSaveCommand({
    autoSaveEnabled,
    isAutoSaving,
    onToggle,
    showSuccess = false
}: AutoSaveCommandProps): ICommand {
    return {
        name: "auto-save",
        keyCommand: "auto-save",
        buttonProps: {
            "aria-label": autoSaveEnabled ? "关闭自动保存" : "开启自动保存",
            title: autoSaveEnabled ? "关闭自动保存" : "开启自动保存",
            style: {
                color: autoSaveEnabled ? '#22c55e' : 'inherit', // 绿色图标表示已开启
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
            }
        },
        icon: showSuccess ? (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                animation: 'fadeInScale 0.3s ease'
            }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>已保存</span>
            </div>
        ) : isAutoSaving ? (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px'
            }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    border: '2px solid currentColor',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <span>保存中</span>
            </div>
        ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17,21 17,13 7,13 7,21" />
                <polyline points="7,3 7,8 15,8" />
                {autoSaveEnabled && (
                    <path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2" />
                )}
            </svg>
        ),
        execute: () => {
            onToggle();
        },
    };
}

// Hook to manage auto-save success state
export function useAutoSaveSuccess() {
    const [showSuccess, setShowSuccess] = useState(false);

    const triggerSuccess = () => {
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
        }, 2000); // 2秒后恢复图标
    };

    return { showSuccess, triggerSuccess };
}