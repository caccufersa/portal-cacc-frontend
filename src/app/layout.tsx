import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '',
  description: 'Site oficial do Centro Acadêmico de Ciência da Computação da Universidade Federal Rural do Semi-Árido (UFERSA). Informações sobre o curso, grade curricular, projetos, eventos e contato.',
  keywords: 'CACC, Centro Acadêmico, Ciência da Computação, UFERSA, Mossoró, RN, Universidade, Curso, Programação',
  authors: [{ name: 'CACC UFERSA' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  },
  openGraph: {
    title: 'CACC - Centro Acadêmico de Ciência da Computação',
    description: 'Site oficial do CA de Ciência da Computação da UFERSA',
    type: 'website',
    locale: 'pt_BR'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
