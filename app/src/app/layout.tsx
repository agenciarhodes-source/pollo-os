import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/demo/session';
import { DemoBar } from '@/components/DemoBar';
import { WidthClasses } from '@/components/WidthClasses';

export const metadata: Metadata = {
  title: 'Pollo OS · Pollo CEO',
  description: 'Pollo OS — inteligência empresarial conversacional. Modo demonstração com dados fictícios.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&family=JetBrains+Mono:wght@500&display=swap"
        />
      </head>
      <body>
        <SessionProvider>
          <WidthClasses />
          <DemoBar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
