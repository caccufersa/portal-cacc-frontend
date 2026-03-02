import styles from './Content.module.css';

export default function CoursesContent() {
    return (
        <div className={styles.content} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.header}>
                <img src="icons-95/certificate_3.ico" alt="Grade Curricular" className={styles.contentIcon} />
                <h3 style={{ margin: 0 }}>
                    Grade Curricular — Ciência da Computação (Integral)
                </h3>
            </div>

            <div style={{
                flex: 1,
                minHeight: 0,
                border: '2px inset var(--win95-border-dark)',
                background: '#525659',
            }}>
                <iframe
                    src="/Grade_computação_integral.pdf"
                    title="Grade Curricular - Ciência da Computação"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        display: 'block',
                    }}
                />
            </div>
        </div>
    );
}
