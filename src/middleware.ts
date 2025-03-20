import createMiddleware from 'next-intl/middleware';
import { locales } from './config/i18n-config';

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: 'br',

  // Redirect to the corresponding locale but maintain the path
  localePrefix: 'always',
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
