import { Prisma } from "@prisma/client";

export interface VariationQuery {
  mes?: string;
  ano?: string;
  dataInicio?: string;
  dataFim?: string;
  material?: string;
  descricao?: string;
  fornecedor?: string;
  contaFornecedor?: string;
  variacaoMin?: string;
  variacaoMax?: string;
  impactoMin?: string;
  impactoMax?: string;
  justificativa?: "todos" | "com" | "sem";
  busca?: string; // busca rápida (código, material, fornecedor)
}

export function buildWhere(q: VariationQuery): Prisma.CostVariationWhereInput {
  const where: Prisma.CostVariationWhereInput = {};
  const AND: Prisma.CostVariationWhereInput[] = [];

  if (q.mes) AND.push({ mes: Number(q.mes) });
  if (q.ano) AND.push({ anoDM: Number(q.ano) });

  if (q.dataInicio || q.dataFim) {
    AND.push({
      dataLancamento: {
        gte: q.dataInicio ? new Date(q.dataInicio) : undefined,
        lte: q.dataFim ? new Date(q.dataFim) : undefined,
      },
    });
  }

  if (q.material) AND.push({ material: { contains: q.material, mode: "insensitive" } });
  if (q.descricao) AND.push({ descricaoMaterial: { contains: q.descricao, mode: "insensitive" } });
  if (q.fornecedor) AND.push({ fornecedor: { contains: q.fornecedor, mode: "insensitive" } });
  if (q.contaFornecedor)
    AND.push({ contaFornecedor: { contains: q.contaFornecedor, mode: "insensitive" } });

  if (q.variacaoMin || q.variacaoMax) {
    AND.push({
      variacaoMMPercentual: {
        gte: q.variacaoMin ? Number(q.variacaoMin) : undefined,
        lte: q.variacaoMax ? Number(q.variacaoMax) : undefined,
      },
    });
  }

  if (q.impactoMin || q.impactoMax) {
    AND.push({
      impactoMM: {
        gte: q.impactoMin ? Number(q.impactoMin) : undefined,
        lte: q.impactoMax ? Number(q.impactoMax) : undefined,
      },
    });
  }

  if (q.justificativa === "com") AND.push({ justification: { isNot: null } });
  if (q.justificativa === "sem") AND.push({ justification: { is: null } });

  if (q.busca) {
    AND.push({
      OR: [
        { material: { contains: q.busca, mode: "insensitive" } },
        { descricaoMaterial: { contains: q.busca, mode: "insensitive" } },
        { fornecedor: { contains: q.busca, mode: "insensitive" } },
      ],
    });
  }

  if (AND.length > 0) where.AND = AND;
  return where;
}
