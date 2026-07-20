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

    const result = await importMonitorExcel(
      req.file.buffer,
      req.file.originalname
    );

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

export default router;
