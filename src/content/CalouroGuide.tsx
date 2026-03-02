import styles from './Content.module.css';

export default function CalouroGuide() {
    return (
        <div className={styles.content} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.header}>
                <img src="icons-95/user_world.ico" alt="Guia do Calouro" className={styles.contentIcon} />
                <div>
                    <h1 className={styles.title} style={{ margin: 0 }}>Guia do Calouro</h1>
                    <p className={styles.subtitle} style={{ margin: 0 }}>Manual do Fera — UFERSA</p>
                </div>
            </div>

            <div style={{
                flex: 1,
                minHeight: 0,
                border: '2px inset var(--win95-border-dark)',
                background: '#525659',
            }}>
                <iframe
                    src="/Manual-do-Fera.pdf"
                    title="Manual do Fera - Guia do Calouro UFERSA"
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
