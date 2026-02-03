import styles from './Content.module.css';

const semesters = [
    {
        name: '1º Semestre',
        subjects: [
            'Introdução à Ciência da Computação',
            'Cálculo I',
            'Algoritmos e Lógica de Programação',
            'Matemática Discreta',
            'Geometria Analítica'
        ]
    },
    {
        name: '2º Semestre',
        subjects: [
            'Programação Orientada a Objetos',
            'Cálculo II',
            'Estrutura de Dados I',
            'Álgebra Linear',
            'Física I'
        ]
    },
    {
        name: '3º Semestre',
        subjects: [
            'Estrutura de Dados II',
            'Banco de Dados I',
            'Arquitetura de Computadores',
            'Probabilidade e Estatística',
            'Física II'
        ]
    },
    {
        name: '4º Semestre',
        subjects: [
            'Análise de Algoritmos',
            'Banco de Dados II',
            'Sistemas Operacionais',
            'Redes de Computadores I',
            'Engenharia de Software I'
        ]
    }
];

export default function CoursesContent() {
    return (
        <div className={styles.content}>
            <h1>📚 Grade Curricular</h1>
            <p>
                Confira abaixo a grade curricular do curso de Ciência da Computação da UFERSA.
                As disciplinas estão organizadas por semestre.
            </p>

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
