const INR_LOCALE = 'en-IN';

export function formatCurrency(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '₹0';
  return '₹' + n.toLocaleString(INR_LOCALE, { maximumFractionDigits: 0 });
}

export function formatCurrencyDecimal(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '₹0.00';
  return '₹' + n.toLocaleString(INR_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
