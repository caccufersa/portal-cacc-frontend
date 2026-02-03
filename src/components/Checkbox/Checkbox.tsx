import { InputHTMLAttributes } from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
    return (
        <label className={`${styles.checkbox} ${className}`}>
            <input type="checkbox" className={styles.checkboxInput} {...props} />
            <span>{label}</span>
        </label>
    );
}

export function Radio({ label, className = '', ...props }: CheckboxProps) {
    return (
        <label className={`${styles.radio} ${className}`}>
            <input type="radio" className={styles.radioInput} {...props} />
            <span>{label}</span>
        </label>
    );
}
