import { Router } from "express";
import { prisma } from "../prisma";
import { buildWhere, VariationQuery } from "../utils/filters";

const router = Router();
// GET /api/dashboard/filtros-opcoes — valores distintos de TMat e Centro, para popular os selects de filtro
router.get("/filtros-opcoes", async (_req, res) => {
  const [tipos, centros, categorias] = await Promise.all([
    prisma.costVariation.findMany({
      where: { tipoMaterial: { not: null } },
      select: { tipoMaterial: true },
      distinct: ["tipoMaterial"],
      orderBy: { tipoMaterial: "asc" },
    }),
    prisma.costVariation.findMany({
      select: { centro: true },
      distinct: ["centro"],
      orderBy: { centro: "asc" },
    }),
    prisma.costVariation.findMany({
      where: { categoriaContabil: { not: null } },
      select: { categoriaContabil: true },
      distinct: ["categoriaContabil"],
      orderBy: { categoriaContabil: "asc" },
    }),
  ]);
  res.json({
    tiposMaterial: tipos.map((t) => t.tipoMaterial).filter(Boolean),
    centros: centros.map((c) => c.centro).filter(Boolean),
    categoriasContabeis: categorias.map((c) => c.categoriaContabil).filter(Boolean),
  });
});

// GET /api/dashboard/kpis — indicadores principais da página inicial
router.get("/kpis", async (req, res) => {
  const where = buildWhere(req.query as VariationQuery);

  const [
    totalMateriais,
    agregados,
    semJustificativa,
    comJustificativa,
    maiorAumento,
    maiorReducao,
  ] = await Promise.all([
    prisma.costVariation.count({ where }),
    prisma.costVariation.aggregate({
      where,
      _sum: { impactoMM: true, impactoMMAbs: true },
      _avg: { variacaoMMPercentual: true },
    }),
    prisma.costVariation.count({ where: { AND: [where, { justification: { is: null } }] } }),
    prisma.costVariation.count({ where: { AND: [where, { justification: { isNot: null } }] } }),
    prisma.costVariation.findFirst({
      where: { AND: [where, { variacaoMMPercentual: { gt: 0 } }] },
      orderBy: { variacaoMMPercentual: "desc" },
      select: { material: true, descricaoMaterial: true, variacaoMMPercentual: true, impactoMM: true },
    }),
    prisma.costVariation.findFirst({
      where: { AND: [where, { variacaoMMPercentual: { lt: 0 } }] },
      orderBy: { variacaoMMPercentual: "asc" },
      select: { material: true, descricaoMaterial: true, variacaoMMPercentual: true, impactoMM: true },
    }),
  ]);

  res.json({
    totalMateriaisComVariacao: totalMateriais,
    impactoFinanceiroTotal: agregados._sum.impactoMM || 0,
    impactoFinanceiroAbsolutoTotal: agregados._sum.impactoMMAbs || 0,
    variacaoMedia: agregados._avg.variacaoMMPercentual || 0,
    materiaisSemJustificativa: semJustificativa,
    materiaisComJustificativa: comJustificativa,
    percentualJustificado: totalMateriais > 0 ? (comJustificativa / totalMateriais) * 100 : 0,
    maiorAumento,
    maiorReducao,
  });
});

// GET /api/dashboard/ranking-impacto — top N por impacto financeiro absoluto
router.get("/ranking-impacto", async (req, res) => {
  const where = buildWhere(req.query as VariationQuery);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const rows = await prisma.costVariation.findMany({
    where,
    orderBy: { impactoMMAbs: "desc" },
    take: limit,
    select: {
      id: true,
      material: true,
      descricaoMaterial: true,
      fornecedor: true,
      impactoMM: true,
      variacaoMMPercentual: true,
      classificacao: true,
    },
  });
  res.json(rows);
});

// GET /api/dashboard/ranking-variacao — top N por variação percentual absoluta
router.get("/ranking-variacao", async (req, res) => {
  const where = buildWhere(req.query as VariationQuery);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const rows = await prisma.costVariation.findMany({
    where,
    orderBy: { variacaoMMPercentualAbs: "desc" },
    take: limit,
    select: {
      id: true,
      material: true,
      descricaoMaterial: true,
      fornecedor: true,
      impactoMM: true,
      variacaoMMPercentual: true,
      classificacao: true,
    },
  });
  res.json(rows);
});

// GET /api/dashboard/fornecedores — fornecedores com maior impacto financeiro
// Sem "tipo": ranking por impacto absoluto somado (comportamento antigo).
// tipo=aumento: só fornecedores com impacto líquido positivo, do maior aumento para o menor.
// tipo=reducao: só fornecedores com impacto líquido negativo, da maior economia para a menor.
router.get("/fornecedores", async (req, res) => {
  const where = buildWhere(req.query as VariationQuery);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const tipo = req.query.tipo as string | undefined;

  const having =
    tipo === "aumento"
      ? { impactoMM: { _sum: { gt: 0 } } }
      : tipo === "reducao"
      ? { impactoMM: { _sum: { lt: 0 } } }
      : undefined;

  const orderBy =
    tipo === "aumento"
      ? { _sum: { impactoMM: "desc" as const } }
      : tipo === "reducao"
      ? { _sum: { impactoMM: "asc" as const } }
      : { _sum: { impactoMMAbs: "desc" as const } };

  const grupos = await prisma.costVariation.groupBy({
    by: ["fornecedor"],
    where,
    _sum: { impactoMM: true, impactoMMAbs: true },
    _count: { _all: true },
    having,
    orderBy,
    take: limit,
  });
  res.json(
    grupos.map((g) => ({
      fornecedor: g.fornecedor,
      impactoTotal: g._sum.impactoMM || 0,
      impactoAbsolutoTotal: g._sum.impactoMMAbs || 0,
      quantidadeMateriais: g._count._all,
    }))
  );
});

// GET /api/dashboard/reincidencia — materiais que mais se repetem com variação relevante
router.get("/reincidencia", async (req, res) => {
  const where = buildWhere(req.query as VariationQuery);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const grupos = await prisma.costVariation.groupBy({
    by: ["material", "descricaoMaterial"],
    where,
    _count: { _all: true },
    _sum: { impactoMM: true },
    orderBy: { _count: { material: "desc" } },
    take: limit,
  });
  res.json(
    grupos.map((g) => ({
      material: g.material,
      descricaoMaterial: g.descricaoMaterial,
      ocorrencias: g._count._all,
      impactoAcumulado: g._sum.impactoMM || 0,
    }))
  );
});

// GET /api/dashboard/evolucao-mensal — evolução do impacto e da variação por mês/ano
router.get("/evolucao-mensal", async (req, res) => {
  const where = buildWhere(req.query as VariationQuery);
  const grupos = await prisma.costVariation.groupBy({
    by: ["anoDM", "mes"],
    where,
    _sum: { impactoMM: true, impactoMMAbs: true },
    _avg: { variacaoMMPercentual: true },
    _count: { _all: true },
  });

  const ordenado = grupos
    .sort((a, b) => a.anoDM - b.anoDM || a.mes - b.mes)
    .map((g) => ({
      ano: g.anoDM,
      mes: g.mes,
      periodo: `${String(g.mes).padStart(2, "0")}/${g.anoDM}`,
      impactoTotal: g._sum.impactoMM || 0,
      impactoAbsolutoTotal: g._sum.impactoMMAbs || 0,
      variacaoMedia: g._avg.variacaoMMPercentual || 0,
      quantidadeMateriais: g._count._all,
    }));

  res.json(ordenado);
});

// GET /api/dashboard/distribuicao — distribuição por classificação (para gráfico de pizza/barras)
router.get("/distribuicao", async (req, res) => {
  const where = buildWhere(req.query as VariationQuery);
  const grupos = await prisma.costVariation.groupBy({
    by: ["classificacao"],
    where,
    _count: { _all: true },
    _sum: { impactoMM: true },
  });
  res.json(
    grupos.map((g) => ({
      classificacao: g.classificacao,
      quantidade: g._count._all,
      impactoTotal: g._sum.impactoMM || 0,
    }))
  );
});

// GET /api/dashboard/pareto — pareto dos maiores impactos (curva acumulada de %)
router.get("/pareto", async (req, res) => {
  const where = buildWhere(req.query as VariationQuery);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const rows = await prisma.costVariation.findMany({
    where,
    orderBy: { impactoMMAbs: "desc" },
    take: limit,
    select: { material: true, descricaoMaterial: true, impactoMM: true, impactoMMAbs: true },
  });

  const totalGeral = await prisma.costVariation.aggregate({ where, _sum: { impactoMMAbs: true } });
  const total = totalGeral._sum.impactoMMAbs || 1;

  let acumulado = 0;
  const pareto = rows.map((r) => {
    acumulado += r.impactoMMAbs;
    return {
      material: r.material,
      descricaoMaterial: r.descricaoMaterial,
      impacto: r.impactoMM,
      impactoAbs: r.impactoMMAbs,
      percentualAcumulado: (acumulado / total) * 100,
    };
  });

  res.json(pareto);
});

export default router;
