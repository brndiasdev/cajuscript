import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import Provider from "@/app/provider";
import { Locale, locales } from "@/config/i18n-config";
import { getTranslations } from 'next-intl/server';
import Script from "next/script";
import { notFound } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL( process.env.NEXT_PUBLIC_SITE_URL || 'https://digibank.tdevs.co/' ),
  title: 'Digibank - Digital Banking Made Simple',
  description: 'Experience seamless digital banking with Digibank. Manage your money, make transfers, and access financial services anytime, anywhere.',
  keywords: [
    'digital banking',
    'online banking',
    'mobile banking',
    'money transfer',
    'fund transfer',
    'digital wallet',
    'virtual cards',
    'online payments',
    'bank deposits',
    'secure banking',
    'financial services',
    'banking app',
    'internet banking',
    'electronic banking',
    'mobile payments',
    'digital transactions',
    'online money management',
    'banking security',
    'personal banking',
    'smart banking',
  ],
  openGraph: {
    title: 'Digibank | Modern Digital Banking Solution',
    description: 'Transform your banking experience with Digibank. Access your accounts, make transfers, and manage your finances with our secure digital platform.',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Digibank',
    images: [
      {
        url: '/images/digibank-og.webp',
        width: 1200,
        height: 630,
        alt: 'Digibank digital banking platform interface',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  authors: [{ name: 'Digibank' }],
  generator: 'Next.js',
  applicationName: 'Digibank',
  referrer: 'origin-when-cross-origin',
  creator: 'Digibank',
  publisher: 'Digibank',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  category: 'Finance',
  classification: 'Digital Banking',
};

async function getMessages( locale: string ) {
  try {
    const messages = ( await import( `@/messages/${locale}.json` )).default;
    return messages;
  } catch ( error ) {
    console.error( `Failed to load messages for locale ${locale}:`, error );
    return ( await import( `@/messages/en.json` )).default;
  }
}

export default async function RootLayout({
  children,
  params,
}: {
children: ReactNode;
params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if ( !locales.includes( locale as Locale )) {
    notFound();
  }

  const messages = await getMessages( locale );
  await getTranslations({ locale });

  return (
    <html
      lang={locale}
    >
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
`,
          }}
        />
      </head>

      <body
        className={`scroll-smooth ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider
          locale={locale}
          messages={messages}
        >
          <Suspense
            fallback={
              <div className="flex h-screen items-center justify-center">
                <p>Carregando...</p>
              </div>
            }
          >
            {children}
          </Suspense>
        </Provider>
      </body>

      <Script
        src="https://cdn.counter.dev/script.js"
        data-id={
          process.env.COUNTER_API_KEY ??
'f30df6f3-776d-4154-959d-0210ac8a8325'
        }
        data-utcoffset="-3"
      ></Script>
    </html>
  );
}
