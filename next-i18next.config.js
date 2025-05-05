/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'zh'],
  },
  defaultLocale: 'en',
  ns: ['common'],
  defaultNS: 'common',
  localePath: './public/locales',
  reloadOnPrerender: true,
  debug: process.env.NODE_ENV !== 'production' || process.env.DEBUG_I18N === 'true',
  fallbackLng: 'en',
  load: 'currentOnly',
  react: { 
    useSuspense: false 
  }
};
