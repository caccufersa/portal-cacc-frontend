'use client';

import { useState, useCallback } from 'react';
import { useWindows } from '@/context/WindowsContext';
import DesktopIcon from '@/components/DesktopIcon/DesktopIcon';
import Window from '@/components/Window/Window';
import AboutContent from '@/content/About';
import CoursesContent from '@/content/Courses';
import GaleriaContent from '@/content/Galeria';
import ProjectsContent from '@/content/Calendário';
import ContactContent from '@/content/Contact';
import HelpContent from '@/content/Help';
import DocumentsContent from '@/content/Documents';
import CalouroGuide from '@/content/CalouroGuide';
import Projetos from '@/content/Projetos';
import styles from './Desktop.module.css';
import Sugest from '@/content/Sugest';
import BalanceContent from '@/content/Balance';
import Forum from '@/content/forum/Forum';
import News from '@/content/news/News';
import BusContent from '@/content/Bus';
import MapContent from '@/content/Map';
import Lojinha from '@/content/Lojinha';

// Tamanho de cada célula do grid virtual — deve casar com o footprint visual do ícone
const CELL_W = 156; // px — largura do ícone + margem
const CELL_H = 108;

function snapToGrid(
    rawPos: { x: number; y: number },
    currentId: string,
    allPositions: { id: string; position: { x: number; y: number } }[]
): { x: number; y: number } {
    const col = Math.round(rawPos.x / CELL_W);
    const row = Math.round(rawPos.y / CELL_H);

    const occupied = allPositions
        .filter(ip => ip.id !== currentId)
        .map(ip => ({
            col: Math.round(ip.position.x / CELL_W),
            row: Math.round(ip.position.y / CELL_H),
        }));

    const isFree = (c: number, r: number) =>
        c >= 0 && r >= 0 && !occupied.some(o => o.col === c && o.row === r);

    if (isFree(col, row)) return { x: col * CELL_W, y: row * CELL_H };

    for (let radius = 1; radius < 30; radius++) {
        for (let dc = -radius; dc <= radius; dc++) {
            for (let dr = -radius; dr <= radius; dr++) {
                if (Math.abs(dc) !== radius && Math.abs(dr) !== radius) continue;
                if (isFree(col + dc, row + dr)) {
                    return { x: (col + dc) * CELL_W, y: (row + dr) * CELL_H };
                }
            }
        }
    }

    return { x: col * CELL_W, y: row * CELL_H };
}

const windowContents: Record<string, React.ReactNode> = {
    about: <AboutContent />,
    courses: <CoursesContent />,
    galeria: <GaleriaContent />,
    projects: <ProjectsContent />,
    contact: <ContactContent />,
    help: <HelpContent />,
    documents: <DocumentsContent />,
    calouroGuide: <CalouroGuide />,
    sugest: <Sugest />,
    balance: <BalanceContent />,
    forum: <Forum />,
    news: <News />,
    bus: <BusContent />,
    map: <MapContent />,
    lojinha: <Lojinha />,
    projetos: <Projetos />,
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
                            onPositionChange={(pos) => updateIconPosition(w.id, snapToGrid(pos, w.id, iconPositions))}
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
