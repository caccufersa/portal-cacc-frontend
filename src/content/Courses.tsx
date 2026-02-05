import styles from './Content.module.css';

const semesters = [
    {
        name: '1º Semestre',
        subjects: []
    },
    {
        name: '2º Semestre',
        subjects: []
    },
    {
        name: '3º Semestre',
        subjects: []
    },
    {
        name: '4º Semestre',
        subjects: []
    },
    {
        name: '5º Semestre',
        subjects: []
    },
    {
        name: '6º Semestre',
        subjects: []
    },
    {
        name: '7º Semestre',
        subjects: []
    },
    {
        name: '8º Semestre',
        subjects: []
    },
];

export default function CoursesContent() {
    return (
        <div className={styles.content}>
            <div className={styles.header}>
            <img src="icons-95/certificate_3.ico" alt="Grade Curricular" className={styles.contentIcon} />
            <h3>
                Confira abaixo a grade curricular do curso de Ciência da Computação da UFERSA.
                As disciplinas estão organizadas por semestre.
            </h3>
                </div>
            {semesters.map((semester, index) => (
                <div key={index}>
                    <h2>{semester.name}</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Disciplina</th>
                            </tr>
                        </thead>
                        <tbody>
                            {semester.subjects.map((subject, idx) => (
                                <tr key={idx}>
                                    <td>{subject}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}

            <p>
                <em>Esta é uma grade resumida. Para informações completas,
                    consulte o PPC do curso na coordenação.</em>
            </p>
        </div>
    );
}
