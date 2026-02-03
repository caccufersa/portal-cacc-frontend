import styles from './Content.module.css';

export default function AboutContent() {
    return (
        <div className={styles.content}>
            <div className={styles.header}>
                <span className={styles.logo}>🎓</span>
                <div>
                    <h1 className={styles.title}>CACC</h1>
                    <p className={styles.subtitle}>Centro Acadêmico de Ciência da Computação</p>
                </div>
            </div>

            <p>
                Bem-vindo ao site oficial do Centro Acadêmico de Ciência da Computação da
                Universidade Federal Rural do Semi-Árido (UFERSA)!
            </p>

            <h2>Quem Somos</h2>
            <p>
                O CACC é a entidade representativa dos estudantes do curso de Ciência da
                Computação da UFERSA. Atuamos como ponte entre os alunos e a instituição,
                buscando sempre melhorar a experiência acadêmica.
            </p>

            <h2>Nossa Missão</h2>
            <ul>
                <li>Representar os interesses dos estudantes</li>
                <li>Promover eventos acadêmicos e culturais</li>
                <li>Facilitar a integração entre os alunos</li>
                <li>Apoiar iniciativas estudantis</li>
                <li>Manter comunicação ativa com a coordenação</li>
            </ul>

            <h2>Gestão Atual</h2>
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Presidente</h3>
                    <p>A definir</p>
                </div>
                <div className={styles.card}>
                    <h3>Vice-Presidente</h3>
                    <p>A definir</p>
                </div>
                <div className={styles.card}>
                    <h3>Secretário</h3>
                    <p>A definir</p>
                </div>
                <div className={styles.card}>
                    <h3>Tesoureiro</h3>
                    <p>A definir</p>
                </div>
            </div>
        </div>
    );
}
