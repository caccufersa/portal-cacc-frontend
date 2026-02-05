'use client';

import { useState, useCallback } from 'react';
import { useWindows } from '@/context/WindowsContext';
import DesktopIcon from '@/components/DesktopIcon/DesktopIcon';
import Window from '@/components/Window/Window';
import AboutContent from '@/content/About';
import CoursesContent from '@/content/Courses';
import ProjectsContent from '@/content/Projects';
import ContactContent from '@/content/Contact';
import HelpContent from '@/content/Help';
import DocumentsContent from '@/content/Documents';
import CalouroGuide from '@/content/CalouroGuide';

import styles from './Desktop.module.css';
import Sugest from '@/content/Sugest';

const windowContents: Record<string, React.ReactNode> = {
    about: <AboutContent />,
    courses: <CoursesContent />,
    projects: <ProjectsContent />,
    contact: <ContactContent />,
    help: <HelpContent />,
    documents: <DocumentsContent />,
    calouroGuide: <CalouroGuide />,
    sugest: <Sugest />, 
};

interface SelectionBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export default function Desktop() {
    const { windows, iconPositions, openWindow, updateIconPosition, setStartMenuOpen } = useWindows();
    const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    const handleDesktopClick = () => {
        setStartMenuOpen(false);
        setSelectedIconId(null);
    };

    const handleIconSelect = (id: string) => {
        setSelectedIconId(id);
    };

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsSelecting(true);
            setSelectionBox({
                startX: e.clientX,
                startY: e.clientY,
                endX: e.clientX,
                endY: e.clientY
            });
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isSelecting && selectionBox) {
            setSelectionBox(prev => prev ? {
                ...prev,
                endX: e.clientX,
                endY: e.clientY
            } : null);
        }
    }, [isSelecting, selectionBox]);

    const handleMouseUp = useCallback(() => {
        setIsSelecting(false);
        setSelectionBox(null);
    }, []);

    const getSelectionStyle = () => {
        if (!selectionBox) return {};
        const left = Math.min(selectionBox.startX, selectionBox.endX);
        const top = Math.min(selectionBox.startY, selectionBox.endY);
        const width = Math.abs(selectionBox.endX - selectionBox.startX);
        const height = Math.abs(selectionBox.endY - selectionBox.startY);
        return { left, top, width, height };
    };

    return (
        <div
            className={styles.desktop}
            onClick={handleDesktopClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className={styles.iconsContainer}>
                {windows.map(w => {
                    const iconPos = iconPositions.find(ip => ip.id === w.id);
                    return (
                        <DesktopIcon
                            key={w.id}
                            id={w.id}
                            icon={w.icon}
                            label={w.title}
                            initialPosition={iconPos?.position || { x: 20, y: 20 }}
                            isSelected={selectedIconId === w.id}
                            onSelect={handleIconSelect}
                            onDoubleClick={() => openWindow(w.id)}
                            onPositionChange={(pos) => updateIconPosition(w.id, pos)}
                        />
                    );
                })}
            </div>

            {selectionBox && (
                <div className={styles.selectionBox} style={getSelectionStyle()} />
            )}

            <div className={styles.windowsContainer}>
                {windows.map(w => (
                    <Window key={w.id} windowState={w}>
                        {windowContents[w.id]}
                    </Window>
                ))}
            </div>
        </div>
    );
}
