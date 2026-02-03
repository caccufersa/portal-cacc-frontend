import styles from './Content.module.css';

const faqs = [
    {
        question: 'O que é o Centro Acadêmico?',
        answer: 'O Centro Acadêmico (CA) é a entidade que representa os estudantes do curso perante a universidade. Organizamos eventos, ajudamos os alunos e lutamos por melhorias no curso.'
    },
    {
        question: 'Como posso participar do CA?',
        answer: 'Todos os estudantes do curso podem participar! Acompanhe nossas redes sociais para ficar por dentro das eleições e dos projetos que precisam de voluntários.'
    },
    {
        question: 'Onde fico sabendo dos eventos?',
        answer: 'Siga nosso Instagram @cacc.ufersa e participe do grupo do WhatsApp do curso para receber todas as novidades.'
    },
    {
        question: 'Como funciona a matrícula em disciplinas?',
        answer: 'A matrícula é feita pelo SIGAA no período determinado pela universidade. Fique atento ao calendário acadêmico e planeje suas disciplinas com antecedência.'
    },
    {
        question: 'Onde encontro o PPC do curso?',
        answer: 'O Projeto Pedagógico do Curso (PPC) está disponível no site da UFERSA e na coordenação. Lá você encontra todas as informações sobre a grade curricular.'
    },
    {
        question: 'O curso tem atividades extracurriculares?',
        answer: 'Sim! Temos grupos de estudo, maratonas de programação, projetos de extensão, ligas acadêmicas e muito mais. Confira a seção "Projetos".'
    },
    {
        question: 'Como solicitar documentos acadêmicos?',
        answer: 'A maioria dos documentos pode ser gerada pelo SIGAA. Para casos específicos, procure a secretaria acadêmica ou a coordenação do curso.'
    }
];

export default function HelpContent() {
    return (
        <div className={styles.content}>
            <h1>❓ Ajuda - FAQ</h1>
            <p>
                Encontre aqui respostas para as perguntas mais frequentes dos estudantes.
            </p>

            {faqs.map((faq, index) => (
                <div key={index} className={styles.faqItem}>
                    <div className={styles.faqQuestion}>❔ {faq.question}</div>
                    <p>{faq.answer}</p>
                </div>
            ))}

            <h2>Não encontrou sua resposta?</h2>
            <p>
                Entre em contato conosco através das redes sociais ou venha conversar
                pessoalmente na sala do CA. Teremos prazer em ajudar!
            </p>
        </div>
    );
}
