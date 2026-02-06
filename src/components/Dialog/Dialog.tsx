'use client';

import { ReactNode } from 'react';
import styles from './Dialog.module.css';
import Image from 'next/image';

interface DialogButton {
    label: string;
    onClick: () => void;
    primary?: boolean;
}

interface DialogProps {
    title: string;
    children: ReactNode;
    icon?: string;
    buttons?: DialogButton[];
    onClose: () => void;
}

export default function Dialog({ title, children, icon, buttons, onClose }: DialogProps) {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.titleBar}>
                    <span className={styles.titleText}>{title}</span>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>
                <div className={styles.content}>
                    <div className={styles.iconContent}>
                        {icon && <span className={styles.icon}>{icon}</span>}
                        <div className={styles.message}>{children}</div>
                    </div>
                </div>
                {buttons && buttons.length > 0 && (
                    <div className={styles.buttons}>
                        {buttons.map((button, index) => (
                            <button
                                key={index}
                                className={`${styles.button} ${button.primary ? styles.buttonPrimary : ''}`}
                                onClick={button.onClick}
                            >
                                {button.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface AlertDialogProps {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'question';
    onOk: () => void;
    onCancel?: () => void;
    Image?: React.ComponentType<{ src: string; alt: string; height: number; width: number }>;
}

const typeIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    question: '❓'
};

export function AlertDialog({ title, message, type = 'info', onOk, onCancel, Image }: AlertDialogProps) {
    const buttons: DialogButton[] = onCancel
        ? [
            { label: 'OK', onClick: onOk, primary: true },
            { label: 'Cancelar', onClick: onCancel }
        ]
        : [{ label: 'OK', onClick: onOk, primary: true }];

    return (
        <Dialog title={title} icon={typeIcons[type]} buttons={buttons} onClose={onCancel || onOk}>
            <div style={{ paddingRight: '50px', justifyContent: 'center', display: 'flex', }}>
            {Image && <Image src={`/icons-95/${type}.ico`} alt={type} height={16} width={16}  />}
            </div>
            <p>{message}</p>
        </Dialog>
    );
}
