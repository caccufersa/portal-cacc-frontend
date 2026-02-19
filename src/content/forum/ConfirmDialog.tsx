import React from 'react';
import s from '../Forum.module.css';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className={s.modalOverlay}>
            <div className={s.modalBox}>
                <div className={s.modalHeader}>
                    <span>{title}</span>
                    <button onClick={onCancel} className={s.modalCloseBtn}>X</button>
                </div>
                <div className={s.modalBody}>
                    <div className={s.modalIcon}>
                        <img src="/icons-95/msg_question.ico" alt="?" />
                    </div>
                    <div className={s.modalMessage}>{message}</div>
                </div>
                <div className={s.modalFooter}>
                    <button className={s.modalBtn} onClick={onConfirm}>Sim</button>
                    <button className={s.modalBtn} onClick={onCancel}>Não</button>
                </div>
            </div>
        </div>
    );
}
