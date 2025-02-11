export const formatPriceWithCurrency = (
  price: number | undefined,
  locale: string
) => {
  if (!price) return '';

  const currencySymbol = '£';
  return `${currencySymbol}${price}`;
};
