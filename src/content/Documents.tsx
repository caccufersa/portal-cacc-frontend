import styles from './Content.module.css';

const documents = [
    { icon: '📋', name: 'PPC - Projeto Pedagógico do Curso', description: 'Documento oficial com toda estrutura do curso' },
    { icon: '📅', name: 'Calendário Acadêmico 2025', description: 'Datas importantes do ano letivo' },
    { icon: '📝', name: 'Manual do Calouro', description: 'Guia completo para novos estudantes' },
    { icon: '📚', name: 'Ementas das Disciplinas', description: 'Conteúdo programático de cada disciplina' },
    { icon: '🎓', name: 'Regulamento de TCC', description: 'Normas para o Trabalho de Conclusão de Curso' },
    { icon: '📖', name: 'Regulamento de Estágio', description: 'Informações sobre estágio obrigatório e não-obrigatório' },
    { icon: '✍️', name: 'Modelo de Requerimento', description: 'Template para solicitações à coordenação' },
    { icon: '🏆', name: 'Atividades Complementares', description: 'Lista de atividades válidas e formulários' }
];

export default function DocumentsContent() {
    return (
        <div className={styles.content}>
            <h1>📄 Documentos Úteis</h1>
            <p>
                Acesse documentos importantes para sua vida acadêmica. Clique para
                baixar ou visualizar.
            </p>

            <h2>Documentos do Curso</h2>
            {documents.map((doc, index) => (
                <div key={index} className={styles.docItem}>
                    <span className={styles.docIcon}>{doc.icon}</span>
                    <div>
                        <strong>{doc.name}</strong>
                        <p style={{ margin: 0, fontSize: '14px' }}>{doc.description}</p>
                    </div>
                </div>
            ))}

            <h2>Links Úteis</h2>
            <ul>
                <li><a href="https://sigaa.ufersa.edu.br" target="_blank" rel="noopener noreferrer">SIGAA - Sistema Acadêmico</a></li>
                <li><a href="https://ufersa.edu.br" target="_blank" rel="noopener noreferrer">Site da UFERSA</a></li>
                <li><a href="https://biblioteca.ufersa.edu.br" target="_blank" rel="noopener noreferrer">Biblioteca Digital</a></li>
                <li><a href="https://restaurante.ufersa.edu.br" target="_blank" rel="noopener noreferrer">Cardápio do RU</a></li>
            </ul>

            <p>
                <em>Alguns documentos podem estar desatualizados. Em caso de dúvida,
                    consulte a coordenação do curso.</em>
            </p>
        </div>
    );
}
