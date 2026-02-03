import { ReactNode } from 'react';
import styles from './GroupBox.module.css';

interface GroupBoxProps {
    title: string;
    children: ReactNode;
}

export default function GroupBox({ title, children }: GroupBoxProps) {
    return (
        <div className={styles.groupBox}>
            <span className={styles.legend}>{title}</span>
            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
}
