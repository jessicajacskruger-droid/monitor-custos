export interface ParetoInfo {
  prioridadePareto: boolean;
  percentualAcumuladoPareto: number;
}

/**
 * Calcula a classificação de Pareto (80/20) para um conjunto de linhas,
 * com base no impacto financeiro absoluto de cada uma.
 *
 * Ordena do maior impacto para o menor e marca como "prioridade" as linhas
 * que, somadas em ordem decrescente, ainda não tinham atingido 80% do
 * impacto total do conjunto ANTES de entrarem na soma — ou seja, os
 * "poucos vitais" que respondem pela maior parte do resultado.
 *
 * O "conjunto" é definido por quem chama esta função: se vier só os
 * materiais de um mês, o pareto é daquele mês; se vier a base toda
 * filtrada, o pareto é geral.
 */
export function calcularPareto(
  linhas: { id: string; impactoMMAbs: number }[]
): Map<string, ParetoInfo> {
  const resultado = new Map<string, ParetoInfo>();
  const total = linhas.reduce((acc, l) => acc + l.impactoMMAbs, 0);

  if (total === 0) {
    linhas.forEach((l) =>
      resultado.set(l.id, { prioridadePareto: false, percentualAcumuladoPareto: 0 })
    );
    return resultado;
  }

  const ordenado = [...linhas].sort((a, b) => b.impactoMMAbs - a.impactoMMAbs);

  let acumulado = 0;
  for (const linha of ordenado) {
    const percentualAntes = (acumulado / total) * 100;
    acumulado += linha.impactoMMAbs;
    const percentualAcumuladoPareto = (acumulado / total) * 100;
    resultado.set(linha.id, {
      prioridadePareto: percentualAntes < 80,
      percentualAcumuladoPareto,
    });
  }

  return resultado;
}
