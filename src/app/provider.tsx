"use client";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from 'next-intl';

interface ProviderProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export default function Provider({
  children,
  locale,
  messages
}: ProviderProps ) {
  if ( !messages || !locale ) {
    throw new Error( 'Provider requires both messages and locale props' );
  }

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="UTC"
    >
      <>
        <ToastContainer
          style={{ zIndex: 999999 }}
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        {children}
      </>
    </NextIntlClientProvider>
  );
}
