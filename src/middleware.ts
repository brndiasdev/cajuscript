import createMiddleware from 'next-intl/middleware';
import { locales } from './config/i18n-config';

export default createMiddleware({
  locales: locales,

  defaultLocale: 'br',

  localePrefix: 'always',
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
