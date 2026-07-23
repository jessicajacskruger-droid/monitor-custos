import { Router } from "express";
import multer from "multer";
import { importMonitorExcel } from "../services/excelImportService";
import { prisma } from "../prisma";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 80) * 1024 * 1024 },
});

// POST /api/import  — upload manual do Monitor.xlsx feito pela própria tela do sistema
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Nenhum arquivo enviado (campo 'file').",
      });
    }

  console.log("===== INÍCIO IMPORT =====");
  console.log("Arquivo:", req.file.originalname);
  console.log("Tamanho:", req.file.size);
  
  const result = await importMonitorExcel(
    req.file.buffer,
    req.file.originalname
  );
  
  console.log("===== IMPORT FINALIZADO =====");
  
  return res.status(201).json(result);

  } catch (error) {
    console.error("========== ERRO NA IMPORTAÇÃO ==========");
    console.error(error);
    console.error("========================================");

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Erro interno ao importar arquivo.",
    });
  }
});

// GET /api/import/history — histórico de importações, para exibir na tela
router.get("/history", async (_req, res) => {
  const logs = await prisma.importLog.findMany({
    orderBy: { dataImportacao: "desc" },
    take: 50,
  });
  res.json(logs);
});
// DELETE /api/import/reset — apaga TODOS os dados importados (CostVariation,
// Justification, JustificationHistory, ImportLog), mas preserva os
// JustificationType cadastrados. Ação destrutiva e sem volta.
router.delete("/reset", async (_req, res) => {
  try {
    // Ordem importa por causa das foreign keys: primeiro quem depende,
    // depois quem é depended-on.
    await prisma.justificationHistory.deleteMany({});
    await prisma.justification.deleteMany({});
    await prisma.costVariation.deleteMany({});
    await prisma.importLog.deleteMany({});

    console.log("===== RESET: todos os dados importados foram apagados =====");
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro ao resetar dados:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Erro ao apagar os dados.",
    });
  }
});
export default router;
