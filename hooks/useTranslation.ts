import { useTranslation as useNextTranslation } from 'next-i18next';

export const useTranslation = () => {
  const { t } = useNextTranslation('common');
  return { t };
};
