import styles from './Content.module.css';

const documents = [
    { icon: '/icons-95/notepad_file.ico', name: 'PPC - Projeto Pedagógico do Curso', description: 'Documento oficial com toda estrutura do curso', url: 'https://cc.ufersa.edu.br/wp-content/uploads/sites/31/2018/09/PPC_2018.pdf' },
    { icon: '/icons-95/calendar.ico', name: 'Calendário Acadêmico 2026-1', description: 'Datas importantes do ano letivo', url: 'https://prograd.ufersa.edu.br/wp-content/uploads/sites/10/2026/03/26-1.pdf' },
    { icon: '/icons-95/document.ico', name: 'Ementas das Disciplinas', description: 'Conteúdo programático de cada disciplina', url: 'https://cc.ufersa.edu.br/' },
]

export default function DocumentsContent() {
    return (
        <div className={styles.content}>
            <h1>
                <img src="icons-95/notepad_file.ico" alt="" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                {' '}Documentos Úteis
            </h1>
            <p>
                Acesse documentos importantes para sua vida acadêmica. Clique para
                baixar ou visualizar.
            </p>

            <h2>Documentos do Curso</h2>
            {documents.map((doc, index) => (
                    <a
                    key= {index}
                    href = {doc.url}
                    target = "_blank"
                    rel="noopener noeferrer"
                    className={styles.docItem}
                    >
                    <span className={styles.docIcon}>
                        <img src={doc.icon} alt="" style={{ width: '24px', height: '24px' }} />
                    </span>
                    <div>
                        <strong>{doc.name}</strong>
                        <p style={{ margin: 0, fontSize: '14px' }}>{doc.description}</p>
                    </div>
                    </a>
            ))}

            <h2>Links Úteis</h2>
            <ul>
                <li><a href="https://sigaa.ufersa.edu.br" target="_blank" rel="noopener noreferrer">SIGAA - Sistema Acadêmico</a></li>
                <li><a href="https://ufersa.edu.br" target="_blank" rel="noopener noreferrer">Site da UFERSA</a></li>
            </ul>

            <p>
                <em>Alguns documentos podem estar desatualizados. Em caso de dúvida,
                    consulte a coordenação do curso.</em>
            </p>
        </div>
    );
}
