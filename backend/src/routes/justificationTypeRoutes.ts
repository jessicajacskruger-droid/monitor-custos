import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();

// GET /api/justification-types
router.get("/", async (req, res) => {
  const somenteAtivos = req.query.somenteAtivos !== "false";
  const tipos = await prisma.justificationType.findMany({
    where: somenteAtivos ? { ativo: true } : undefined,
    orderBy: { ordem: "asc" },
  });
  res.json(tipos);
});

const createSchema = z.object({
  nome: z.string().min(2).max(120),
  ordem: z.number().int().optional(),
});

// POST /api/justification-types — cadastrar novo tipo de justificativa
router.post("/", async (req, res) => {
  const body = createSchema.parse(req.body);
  const maxOrdem = await prisma.justificationType.aggregate({ _max: { ordem: true } });
  const tipo = await prisma.justificationType.create({
    data: { nome: body.nome, ordem: body.ordem ?? (maxOrdem._max.ordem ?? 0) + 1 },
  });
  res.status(201).json(tipo);
});

const updateSchema = z.object({
  nome: z.string().min(2).max(120).optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional(),
});

// PATCH /api/justification-types/:id — editar nome/ordem, ou inativar (soft-delete)
router.patch("/:id", async (req, res) => {
  const body = updateSchema.parse(req.body);
  const tipo = await prisma.justificationType.update({
    where: { id: req.params.id },
    data: body,
  });
  res.json(tipo);
});

// DELETE /api/justification-types/:id — inativa (nunca apaga de fato, pois pode já estar em uso)
router.delete("/:id", async (req, res) => {
  const emUso = await prisma.justification.count({ where: { justificationTypeId: req.params.id } });
  if (emUso > 0) {
    const tipo = await prisma.justificationType.update({
      where: { id: req.params.id },
      data: { ativo: false },
    });
    return res.json({ ...tipo, mensagem: "Tipo em uso: foi inativado em vez de excluído." });
  }
  await prisma.justificationType.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
