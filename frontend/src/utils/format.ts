export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function formatCurrencyPrecise(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

export function formatPercent(value: number) {
  const percentual = value * 100;
  const sign = percentual > 0 ? "+" : "";
  return `${sign}${percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

export function formatDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("pt-BR");
}

export function formatPeriodo(mes: number, ano: number) {
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${meses[mes - 1] || mes}/${ano}`;
}
