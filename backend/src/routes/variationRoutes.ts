import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { buildWhere, VariationQuery } from "../utils/filters";

const router = Router();

const SORT_FIELDS: Record<string, string> = {
  impacto: "impactoMMAbs",
  variacao: "variacaoMMPercentualAbs",
  data: "dataLancamento",
};

// GET /api/variations
// Query params: página, filtros (ver utils/filters.ts), sortBy=impacto|variacao, sortDir=asc|desc
router.get("/", async (req, res) => {
  const q = req.query as VariationQuery & {
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDir?: string;
  };

  const page = Math.max(1, Number(q.page) || 1);
  const pageSize = Math.min(500, Math.max(1, Number(q.pageSize) || 50));
  const where = buildWhere(q);

  const sortField = SORT_FIELDS[q.sortBy || "impacto"] || "impactoMMAbs";
  const sortDir = q.sortDir === "asc" ? "asc" : "desc";

  // Ordena sempre pelo valor ABSOLUTO de impacto/variação, para que os maiores
  // aumentos e as maiores reduções apareçam juntos no topo (o que importa
  // para a Controladoria é o tamanho do desvio, não o sinal).
  const orderBy = [{ [sortField]: sortDir }];

  const [total, rows] = await Promise.all([
    prisma.costVariation.count({ where }),
    prisma.costVariation.findMany({
      where,
      orderBy: orderBy as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { justification: { include: { justificationType: true } } },
    }),
  ]);

  // Reincidência: quantos meses distintos esse material aparece com variação relevante
  const materiais = [...new Set(rows.map((r) => r.material))];
  const reincidencias = await prisma.costVariation.groupBy({
    by: ["material"],
    where: { material: { in: materiais } },
    _count: { _all: true },
  });
  const reincidenciaMap = new Map(reincidencias.map((r) => [r.material, r._count._all]));

  res.json({
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    data: rows.map((r) => ({ ...r, reincidencia: reincidenciaMap.get(r.material) || 1 })),
  });
});

// GET /api/variations/:id
router.get("/:id", async (req, res) => {
  const row = await prisma.costVariation.findUnique({
    where: { id: req.params.id },
    include: { justification: { include: { justificationType: true } } },
  });
  if (!row) return res.status(404).json({ error: "Registro não encontrado." });
  res.json(row);
});

// GET /api/variations/:id/historico-material — histórico de justificativas do MESMO material
router.get("/:id/historico-material", async (req, res) => {
  const row = await prisma.costVariation.findUnique({ where: { id: req.params.id } });
  if (!row) return res.status(404).json({ error: "Registro não encontrado." });

  const historico = await prisma.justificationHistory.findMany({
    where: { material: row.material },
    orderBy: { alteradoEm: "desc" },
    take: 100,
  });
  res.json(historico);
});

const justificationSchema = z.object({
  justificationTypeId: z.string().nullable().optional(),
  textoLivre: z.string().max(2000).nullable().optional(),
  autor: z.string().max(120).nullable().optional(),
});

// PUT /api/variations/:id/justification — único campo editável do sistema
router.put("/:id/justification", async (req, res) => {
  const body = justificationSchema.parse(req.body);

  const costVariation = await prisma.costVariation.findUnique({
    where: { id: req.params.id },
    include: { justification: true },
  });
  if (!costVariation) return res.status(404).json({ error: "Registro não encontrado." });

  const tipoAntigo = costVariation.justification?.justificationTypeId ?? null;
  const textoAntigo = costVariation.justification?.textoLivre ?? null;

  const justification = await prisma.justification.upsert({
    where: { costVariationId: costVariation.id },
    create: {
      costVariationId: costVariation.id,
      justificationTypeId: body.justificationTypeId || null,
      textoLivre: body.textoLivre || null,
      autor: body.autor || null,
    },
    update: {
      justificationTypeId: body.justificationTypeId || null,
      textoLivre: body.textoLivre || null,
      autor: body.autor || null,
    },
    include: { justificationType: true },
  });

  await prisma.justificationHistory.create({
    data: {
      justificationId: justification.id,
      material: costVariation.material,
      tipoAntigo,
      tipoNovo: justification.justificationTypeId,
      textoAntigo,
      textoNovo: justification.textoLivre,
      autor: body.autor || null,
    },
  });

  res.json(justification);
});

export default router;
