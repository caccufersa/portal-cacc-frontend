import styles from './Content.module.css';

const socialLinks = [
    { icon: '📸', name: 'Instagram', url: 'https://instagram.com/cacc.ufersa' },
    { icon: '💬', name: 'WhatsApp', url: 'https://wa.me/5584992152351' },
    { icon: '📧', name: 'E-mail', url: 'mailto:caccufersa@gmail.com' },
    { icon: '🐙', name: 'GitHub', url: 'https://github.com/caccufersa' }
];

export default function ContactContent() {
    return (
        <div className={styles.content}>
            <h1>📞 Contato</h1>
            <p>
                Entre em contato conosco! Estamos sempre disponíveis para ajudar
                os estudantes e ouvir sugestões.
            </p>

            <h2>Redes Sociais</h2>
            <div className={styles.socialLinks}>
                {socialLinks.map((link, index) => (
                    <a
                        key={index}
                        href={link.url}
                        className={styles.socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span>{link.icon}</span>
                        <span>{link.name}</span>
                    </a>
                ))}
            </div>

            <h2>Localização</h2>
            <p>
                <strong>Endereço:</strong><br />
                Universidade Federal Rural do Semi-Árido<br />
                Centro de Ciências Exatas e Naturais<br />
                Av. Francisco Mota, 572 - Bairro Costa e Silva<br />
                Mossoró - RN, 59625-900
            </p>

            <h2>Horário de Atendimento</h2>
            <p>
                <strong>Segunda a Sexta:</strong> Em algum lugar do bloco<br />
                <strong>Sala do CA:</strong> Bloco LCC
            </p>

            <h2>Coordenação do Curso</h2>
            <p>
                Para assuntos acadêmicos oficiais, procure a coordenação:<br />
                <strong>E-mail:</strong> [EMAIL_ADDRESS]<br />
                <strong>Telefone:</strong> (84) 3317-8200
            </p>
        </div>
    );
}
