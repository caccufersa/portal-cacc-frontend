'use client';

import { ReactNode, useRef, useState, useCallback, useEffect } from 'react';
import { useWindows, WindowState } from '@/context/WindowsContext';
import styles from './Window.module.css';

interface WindowProps {
    windowState: WindowState;
    children: ReactNode;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

export default function Window({ windowState, children }: WindowProps) {
    const { activeWindowId, closeWindow, minimizeWindow, maximizeWindow, restoreWindow, focusWindow, updateWindowPosition, updateWindowSize } = useWindows();
    const windowRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isActive = activeWindowId === windowState.id;

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (windowState.isMaximized || isMobile) return;
        focusWindow(windowState.id);
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - windowState.position.x,
            y: e.clientY - windowState.position.y
        });
    }, [windowState.id, windowState.position, windowState.isMaximized, focusWindow, isMobile]);

    const handleResizeStart = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
        e.stopPropagation();
        if (windowState.isMaximized || isMobile) return;
        focusWindow(windowState.id);
        setIsResizing(true);
        setResizeDirection(direction);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: windowState.size.width,
            height: windowState.size.height,
            posX: windowState.position.x,
            posY: windowState.position.y
        });
    }, [windowState.id, windowState.size, windowState.position, windowState.isMaximized, focusWindow, isMobile]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = Math.max(0, e.clientX - dragOffset.x);
                const newY = Math.max(0, e.clientY - dragOffset.y);
                updateWindowPosition(windowState.id, { x: newX, y: newY });
            } else if (isResizing && resizeDirection) {
                const deltaX = e.clientX - resizeStart.x;
                const deltaY = e.clientY - resizeStart.y;
                let newWidth = resizeStart.width;
                let newHeight = resizeStart.height;
                let newX = resizeStart.posX;
                let newY = resizeStart.posY;

                if (resizeDirection.includes('e')) {
                    newWidth = Math.max(250, resizeStart.width + deltaX);
                }
                if (resizeDirection.includes('w')) {
                    const proposedWidth = resizeStart.width - deltaX;
                    if (proposedWidth >= 250) {
                        newWidth = proposedWidth;
                        newX = resizeStart.posX + deltaX;
                    }
                }
                if (resizeDirection.includes('s')) {
                    newHeight = Math.max(150, resizeStart.height + deltaY);
                }
                if (resizeDirection.includes('n')) {
                    const proposedHeight = resizeStart.height - deltaY;
                    if (proposedHeight >= 150) {
                        newHeight = proposedHeight;
                        newY = resizeStart.posY + deltaY;
                    }
                }

                updateWindowSize(windowState.id, { width: newWidth, height: newHeight });
                updateWindowPosition(windowState.id, { x: newX, y: newY });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            setResizeDirection(null);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, resizeDirection, dragOffset, resizeStart, windowState.id, updateWindowPosition, updateWindowSize]);

    const handleMaximizeToggle = useCallback(() => {
        if (windowState.isMaximized) {
            restoreWindow(windowState.id);
        } else {
            maximizeWindow(windowState.id);
        }
    }, [windowState.id, windowState.isMaximized, maximizeWindow, restoreWindow]);

    if (!windowState.isOpen || windowState.isMinimized) {
        return null;
    }

    // No mobile, janelas sempre aparecem em fullscreen via CSS
    const windowStyle = (windowState.isMaximized || isMobile) ? {} : {
        left: windowState.position.x,
        top: windowState.position.y,
        width: windowState.size.width,
        height: windowState.size.height,
        zIndex: windowState.zIndex
    };

    return (
        <div
            ref={windowRef}
            className={`${styles.window} ${(windowState.isMaximized || isMobile) ? styles.windowMaximized : ''}`}
            style={{ ...windowStyle, zIndex: windowState.zIndex }}
            onClick={() => focusWindow(windowState.id)}
        >
            <div
                className={`${styles.titleBar} ${!isActive ? styles.titleBarInactive : ''}`}
                onMouseDown={handleMouseDown}
            >
                <span className={styles.titleIcon}>
                    <img src={windowState.icon} alt="" style={{ width: '16px', height: '16px' }} />
                </span>
                <span className={styles.titleText}>{windowState.title}</span>
                <div className={styles.titleButtons}>
                    {!isMobile && (
                        <>
                            <button
                                className={styles.titleButton}
                                onClick={(e) => { e.stopPropagation(); minimizeWindow(windowState.id); }}
                            >
                                _
                            </button>
                            <button
                                className={styles.titleButton}
                                onClick={(e) => { e.stopPropagation(); handleMaximizeToggle(); }}
                            >
                                □
                            </button>
                        </>
                    )}
                    <button
                        className={styles.titleButton}
                        onClick={(e) => { e.stopPropagation(); closeWindow(windowState.id); }}
                    >
                        ×
                    </button>
                </div>
            </div>
            <div className={styles.content}>
                {children}
            </div>

            {!windowState.isMaximized && !isMobile && (
                <>
                    <div className={`${styles.resizeHandle} ${styles.resizeN}`} onMouseDown={(e) => handleResizeStart(e, 'n')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeS}`} onMouseDown={(e) => handleResizeStart(e, 's')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeE}`} onMouseDown={(e) => handleResizeStart(e, 'e')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeW}`} onMouseDown={(e) => handleResizeStart(e, 'w')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeNE}`} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeNW}`} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeSE}`} onMouseDown={(e) => handleResizeStart(e, 'se')} />
                    <div className={`${styles.resizeHandle} ${styles.resizeSW}`} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                    <div className={styles.resizeGrip} />
                </>
            )}
        </div>
    );
}
