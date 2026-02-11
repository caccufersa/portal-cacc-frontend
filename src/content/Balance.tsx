import styles from './Content.module.css';

const balances = [
    { year: 2026, month: '2025 - Janeiro 2026', link: '/balancetes/Balancetes - 06-2025 à 01-2026.pdf', icon: '/icons-95/notepad_file.ico', type: 'Balancete' },
];

const minutes = [
    { year: 2025, month: 'Dezembro', link: '/atas/Ata - Dezembro 2025.pdf', icon: '/icons-95/notepad_file.ico', type: 'Ata' },
];

const MONTHS: Record<string, number> = {
    'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
    'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
    'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
};

const getMonthNumber = (month: string): number => {
    return MONTHS[month] || 0;
};

const extractMonthName = (monthString: string): string => {
    // Extract month name from formats like "Janeiro", "2025 - Janeiro 2026", etc.
    for (const monthName of Object.keys(MONTHS)) {
        if (monthString.includes(monthName)) {
            return monthName;
        }
    }
    return '';
};

const sortedBalances = [...balances].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return getMonthNumber(extractMonthName(b.month)) - getMonthNumber(extractMonthName(a.month));
});

const sortedMinutes = [...minutes].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return getMonthNumber(b.month) - getMonthNumber(a.month);
});

export default function TransparencyContent() {
    return (
        <>
        <div className={styles.content}>
            <div className={styles.header}>
                <img src="/icons-95/calculator.ico" alt="Transparência" className={styles.contentIcon} />
                <div>
                    <h1 className={styles.title}>Transparência</h1>
                    <p className={styles.subtitle}>Gestão Financeira e Administrativa</p>
                </div>
            </div>

            <p>
                Consulte os balancetes, atas e documentos do Centro Acadêmico de Ciência da Computação.
                Mantemos total transparência com a comunidade acadêmica sobre nossas despesas, receitas e decisões.
            </p>

            <h2>Balancetes</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                Clique no arquivo para baixar em PDF
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {sortedBalances.map((balance, index) => (
                    <a
                        key={`balance-${index}`}
                        href={balance.link}
                        download={`Balancete_${balance.month}_${balance.year}.pdf`}
                        style={{
                            padding: '12px',
                            background: '#f0f0f0',
                            border: '1px solid #808080',
                            borderRadius: '2px',
                            textDecoration: 'none',
                            color: '#000080',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
                    >
                        <img src={balance.icon} alt="" style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>
                            <strong>{balance.month}</strong>
                            <br />
                            <span style={{ fontSize: '12px', color: '#666' }}>{balance.year}</span>
                        </span>
                        <span style={{ fontSize: '16px' }}>⬇</span>
                    </a>
                ))}
            </div>

            <h2>Atas de Reunião</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                Clique no arquivo para baixar em PDF
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {sortedMinutes.map((minute, index) => (
                    <a
                        key={`minute-${index}`}
                        href={minute.link}
                        download={`Ata_${minute.month}_${minute.year}.pdf`}
                        style={{
                            padding: '12px',
                            background: '#f0f0f0',
                            border: '1px solid #808080',
                            borderRadius: '2px',
                            textDecoration: 'none',
                            color: '#000080',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
                    >
                        <img src={minute.icon} alt="" style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>
                            <strong>{minute.month}</strong>
                            <br />
                            <span style={{ fontSize: '12px', color: '#666' }}>{minute.year}</span>
                        </span>
                        <span style={{ fontSize: '16px' }}>⬇</span>
                    </a>
                ))}
            </div>

            <h2>Informações</h2>
            <ul>
                <li><strong>Formato:</strong> Arquivo PDF</li>
                <li><strong>Frequência:</strong> Atualizado mensalmente</li>
                <li><strong>Disponibilidade:</strong> Acesso livre para a comunidade</li>
                <li><strong>Contato:</strong> Entre em contato com a tesouraria para dúvidas</li>
            </ul>

            <div style={{
                background: '#ffffcc',
                padding: '12px',
                border: '1px solid #e6e600',
                marginTop: '16px',
                borderRadius: '2px'
            }}>
                <p style={{ margin: 0, fontSize: '13px' }}>
                    <strong>ℹ️ Nota:</strong> Todos os documentos são públicos e refletem
                    a gestão financeira e administrativa transparente do CACC. Para informações
                    adicionais, entre em contato com a tesouraria.
                </p>
            </div>
        </div>
        </>
    );
}

