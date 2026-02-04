'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import styles from './DesktopIcon.module.css';

interface DesktopIconProps {
    id: string;
    icon: string;
    label: string;
    initialPosition: { x: number; y: number };
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDoubleClick: () => void;
    onPositionChange: (position: { x: number; y: number }) => void;
}

export default function DesktopIcon({ id, icon, label, initialPosition, isSelected, onSelect, onDoubleClick, onPositionChange }: DesktopIconProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(initialPosition);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const iconRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(id);
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    }, [id, position, onSelect]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newX = Math.max(0, e.clientX - dragOffset.x);
            const newY = Math.max(0, e.clientY - dragOffset.y);
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                onPositionChange(position);
            }
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, position, onPositionChange]);

    return (
        <div
            ref={iconRef}
            className={`${styles.icon} ${isSelected ? styles.iconSelected : ''} ${isDragging ? styles.iconDragging : ''}`}
            style={{ left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
            tabIndex={0}
        >
            <div className={styles.iconImage}>
                <img src={icon} alt={label} style={{ width: '32px', height: '32px' }} />
            </div>
            <span className={styles.label}>{label}</span>
        </div>
    );
}
