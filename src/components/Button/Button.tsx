import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'default' | 'small' | 'icon';
}

export default function Button({ children, variant = 'default', className = '', ...props }: ButtonProps) {
    const variantClass = variant === 'small' ? styles.buttonSmall : variant === 'icon' ? styles.buttonIcon : '';

    return (
        <button className={`${styles.button} ${variantClass} ${className}`} {...props}>
            {children}
        </button>
    );
}
