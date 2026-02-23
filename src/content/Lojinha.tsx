import Cat from '../../public/images/cat.jpg';
import Image from 'next/image';

export default function Lojinha() {
    return (
        <div style={{ padding: '20px', textAlign: 'center', background: '#ffffffff', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
            <br />
            <br />
            <h2 style={{ fontSize: '32px', marginBottom: '4px' }}>Lojinha do LCC</h2>
            <br />
            <p style={{ fontSize: '16px', color: '#555' }}>Página em construção... Volte em breve!</p>
            <Image src={Cat} alt="Cat" width={256} height={256} style={{ marginTop: '20px' }} />
        </div>
    );
}
