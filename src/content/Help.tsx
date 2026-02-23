import styles from './Content.module.css';
import { useState } from 'react';

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
    const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
    const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
    const [swipeOffset, setSwipeOffset] = useState<{ index: number; offset: number } | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaqs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setTouchStart({ x: touch.clientX, y: touch.clientY, time: e.timeStamp });
    };

    const handleTouchMove = (e: React.TouchEvent, index: number) => {
        if (!touchStart) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStart.x;
        const deltaY = touch.clientY - touchStart.y;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            e.preventDefault();
            setSwipeOffset({ index, offset: deltaX });
        }
    };

    const handleTouchEnd = (e: React.TouchEvent, index: number) => {
        if (!touchStart) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStart.x;
        const deltaY = touch.clientY - touchStart.y;
        const currentTime = e.timeStamp;
        const deltaTime = currentTime - touchStart.time;

        const isQuickSwipe = deltaTime < 300 && Math.abs(deltaX) > 30;
        const isLongSwipe = Math.abs(deltaX) > 80;

        if (Math.abs(deltaX) > Math.abs(deltaY) && (isQuickSwipe || isLongSwipe)) {
            toggleFaq(index);
        }

        setTouchStart(null);
        setSwipeOffset(null);
    };
    return (
        <div className={styles.content}>
            <h1>
                <img src="icons-95/help_question_mark.ico" alt="" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                {' '}Ajuda - FAQ
            </h1>
            <p>
                Encontre aqui respostas para as perguntas mais frequentes dos estudantes.
            </p>


            {faqs.map((faq, index) => {
                const isOpen = openFaqs.has(index);
                const offset = swipeOffset?.index === index ? swipeOffset.offset : 0;

                return (
                    <div
                        key={index}
                        className={styles.faqItem}
                        onTouchStart={(e) => handleTouchStart(e)}
                        onTouchMove={(e) => handleTouchMove(e, index)}
                        onTouchEnd={(e) => handleTouchEnd(e, index)}
                        style={{
                            transform: offset ? `translateX(${Math.max(-10, Math.min(10, offset * 0.2))}px)` : 'none',
                            transition: offset ? 'none' : 'transform 0.2s ease',
                        }}
                    >
                        <button
                            className={`${styles.faqButton} ${isOpen ? styles.faqButtonOpen : ''}`}
                            onClick={() => toggleFaq(index)}
                        >
                            <span className={styles.faqIcon}>{isOpen ? '▼' : '▶'}</span>
                            {faq.question}
                        </button>
                        {isOpen && (
                            <div className={styles.faqAnswer}>
                                {faq.answer}
                            </div>
                        )}
                    </div>
                );
            })}

            <h2>Não encontrou sua resposta?</h2>
            <p>
                Entre em contato conosco através das redes sociais ou venha conversar
                pessoalmente na sala do CA. Teremos prazer em ajudar!
            </p>
        </div>
    );
}
