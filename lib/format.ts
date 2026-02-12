export function formatUah(price: number) {
  return `${new Intl.NumberFormat("uk-UA").format(price)} грн`;
}
