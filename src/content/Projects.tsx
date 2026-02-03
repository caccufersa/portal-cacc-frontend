import styles from './Content.module.css';

const projects = [
    {
        icon: '💻',
        title: 'Maratona de Programação',
        description: 'Treinamento e participação em competições de programação regionais e nacionais.'
    },
    {
    },
    {
    },
    {
    },
    {
    },
    {
    }
];

export default function ProjectsContent() {
    return (
        <div className={styles.content}>
            <h1>🎓 Projetos e Atividades</h1>
            <p>
                Confira os projetos e grupos de estudo organizados pelo CACC e pelos
                estudantes do curso.
            </p>

            <div className={styles.grid}>
                {projects.map((project, index) => (
                    <div key={index} className={styles.card}>
                        <h3>{project.icon} {project.title}</h3>
                        <p>{project.description}</p>
                    </div>
                ))}
            </div>

            <h2>Eventos Anuais</h2>
            <ul>
                <li><strong>Semana da Computação</strong> - Palestras, workshops e minicursos</li>
                <li><strong>Hackathon UFERSA</strong> - Maratona de desenvolvimento</li>
                <li><strong>Recepção de Calouros</strong> - Integração dos novos alunos</li>
                <li><strong>SECOMP</strong> - Semana Acadêmica de Computação</li>
            </ul>

            <h2>Como Participar</h2>
            <p>
                Interessado em algum projeto? Entre em contato conosco através das
                nossas redes sociais ou venha conversar pessoalmente!
            </p>
        </div>
    );
}
