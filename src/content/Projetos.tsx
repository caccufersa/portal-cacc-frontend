import styles from './Content.module.css';

const projects = [
    {
        icon: 'icons-95/computer.ico',
        title: 'Maratona de Programação',
        description: 'Treinamento e participação em competições de programação regionais e nacionais.'
    },
    {
        icon: 'icons-95/directory_program_group.ico',
        title: 'Grupos de Estudo',
        description: 'Grupos de estudo para desenvolvimento web'
    },
]
export default function ProjectsContent() {
    return (
        <div className={styles.content}>
            <div className={styles.header}>
            </div>

            <h4>
                Página de divulgação dos projetos realizados e projetos em andamento! Fomente a comunidade e contribua para o futuro do curso!
            </h4>
        <div className={styles.header}>
            </div>
            <h2>Projetos dos discentes</h2>

            {projects.map((project, index) => (
                <div key={index} className={styles.card}>
                    <h3>
                        <img src={project.icon} alt="" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />
                        {' '}{project.title}
                    </h3>
                    <p>{project.description}</p>
                </div>
            ))}
        </div>
    );
}
