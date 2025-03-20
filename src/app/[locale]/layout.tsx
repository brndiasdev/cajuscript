import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales } from '@/config/i18n-config';

import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export async function generateStaticParams() {
  return locales.map(( locale ) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return {
    title: 'CajuScript - Automação de Busca',
    description: 'Automatize suas buscas com facilidade e eficiência',
  };
}

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale}
          messages={messages}>
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
