/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'zh'],
    localeDetection: false,
  },
  defaultLocale: 'en',
  ns: ['common'],
  defaultNS: 'common',
  localePath: './public/locales',
  reloadOnPrerender: false,
  debug: process.env.NODE_ENV !== 'production' || process.env.DEBUG_I18N === 'true',
  fallbackLng: 'en',
  load: 'all',
  react: { 
    useSuspense: true 
  },
  strictMode: false
};
