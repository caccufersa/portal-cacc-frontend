import styles from './Content.module.css';

export default function CalouroGuide() {
    return (
        <div className={styles.content}>
            <div className={styles.header}>
                <img src="icons-95/world.ico" alt="Calouro Guide" className={styles.contentIcon} />
                <div>
                    <h1 className={styles.title}>CACC</h1>
                    <p className={styles.subtitle}>Centro Acadêmico de Ciência da Computação</p>
                </div>
            </div>
            <h2>Guia do Calouro</h2>
            <p>
                Seja bem-vindo ao curso de Ciência da Computação da UFERSA! Este guia foi
                criado para ajudar você a se orientar nos primeiros dias e aproveitar ao
                máximo sua experiência acadêmica.
            </p>
            
        </div>
    );
}
