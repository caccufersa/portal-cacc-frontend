import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showPercentage?: boolean;
}

export default function ProgressBar({ value, max = 100, label, showPercentage = true }: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={styles.progressWrapper}>
            {(label || showPercentage) && (
                <div className={styles.label}>
                    <span>{label}</span>
                    {showPercentage && <span>{Math.round(percentage)}%</span>}
                </div>
            )}
            <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}
