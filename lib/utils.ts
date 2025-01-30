export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const parsePrice = (priceString: string): number => {
  const matches = priceString.match(/\d+/g);
  return matches ? parseInt(matches.join('')) : 0;
};

export const cleanText = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};
