'use client';

import { useState, ReactNode } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
    text: string;
    children: ReactNode;
    position?: 'top' | 'bottom';
}

export default function Tooltip({ text, children, position = 'top' }: TooltipProps) {
    const [visible, setVisible] = useState(false);

    return (
        <div
            className={styles.tooltipWrapper}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && (
                <div className={`${styles.tooltip} ${position === 'bottom' ? styles.tooltipBottom : ''}`}>
                    {text}
                </div>
            )}
        </div>
    );
}
