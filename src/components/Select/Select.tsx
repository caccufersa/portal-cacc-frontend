import { SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: SelectOption[];
}

export default function Select({ label, options, className = '', ...props }: SelectProps) {
    return (
        <div className={styles.selectWrapper}>
            {label && <label className={styles.label}>{label}</label>}
            <select className={`${styles.select} ${className}`} {...props}>
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
