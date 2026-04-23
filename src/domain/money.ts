export type Money = {
  amount: string;
  currencyCode: string;
};

export function formatMoney(money: Money, locale = 'es-MX'): string {
  const amount = Number(money.amount);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currencyCode,
  }).format(amount);
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currencyCode !== b.currencyCode) {
    throw new Error(`Cannot add different currencies: ${a.currencyCode} + ${b.currencyCode}`);
  }

  return {
    amount: (Number(a.amount) + Number(b.amount)).toFixed(2),
    currencyCode: a.currencyCode,
  };
}
