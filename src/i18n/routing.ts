import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { locales } from '@/config/i18n-config';

export const routing = defineRouting({
  locales: locales,

  defaultLocale: 'br',
});

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation( routing );
