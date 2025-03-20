import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin(
  './src/i18n/config.ts'
)

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    domains: [],
  },
  // Configure strict mode for better debugging
  reactStrictMode: true,
}

export default withNextIntl(nextConfig)
