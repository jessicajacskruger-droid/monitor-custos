import { Router } from "express";
import ExcelJS from "exceljs";
import { Parser as CsvParser } from "json2csv";
import PDFDocument from "pdfkit";
import { prisma } from "../prisma";
import { buildWhere, VariationQuery } from "../utils/filters";

const router = Router();

const CLASSIFICACAO_LABEL: Record<string, string> = {
  REDUCAO_CRITICA: "Redução crítica",
  AUMENTO_CRITICO: "Aumento crítico",
  REDUCAO_RELEVANTE: "Redução relevante",
  AUMENTO_RELEVANTE: "Aumento relevante",
  CRITICO_FINANCEIRO: "Crítico financeiro",
};

async function fetchRows(q: VariationQuery) {
  const where = buildWhere(q);
  return prisma.costVariation.findMany({
    where,
    orderBy: { impactoMMAbs: "desc" },
    include: { justification: { include: { justificationType: true } } },
  });
}

function toPlainRow(r: Awaited<ReturnType<typeof fetchRows>>[number]) {
  return {
    Material: r.material,
    Descrição: r.descricaoMaterial,
    Centro: r.centro,
    Fornecedor: r.fornecedor,
    "Ano/Mês": `${r.mes}/${r.anoDM}`,
    "Data Lançamento": r.dataLancamento.toISOString().slice(0, 10),
    "Unit. Entrada $": r.unitEntrada,
    "Médio Móvel $": r.medioMovel,
    "Variação MM $": r.variacaoMMValor,
    "Variação MM %": r.variacaoMMPercentual,
    "Impacto MM $": r.impactoMM,
    Classificação: CLASSIFICACAO_LABEL[r.classificacao] || r.classificacao,
    "Tipo de Justificativa": r.justification?.justificationType?.nome || "",
    "Justificativa (texto livre)": r.justification?.textoLivre || "",
    "Status Justificativa": r.justification ? "Justificado" : "Pendente",
  };
}

// GET /api/export/excel
router.get("/excel", async (req, res) => {
  const rows = await fetchRows(req.query as VariationQuery);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Monitor de Variações");

  if (rows.length > 0) {
    const plain = rows.map(toPlainRow);
    sheet.columns = Object.keys(plain[0]).map((key) => ({ header: key, key, width: 20 }));
    sheet.addRows(plain);
    sheet.getRow(1).font = { bold: true };
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=monitor-custos-export.xlsx");
  await workbook.xlsx.write(res);
  res.end();
});

// GET /api/export/csv
router.get("/csv", async (req, res) => {
  const rows = await fetchRows(req.query as VariationQuery);
  const plain = rows.map(toPlainRow);
  const parser = new CsvParser({ fields: plain.length > 0 ? Object.keys(plain[0]) : [] });
  const csv = parser.parse(plain);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=monitor-custos-export.csv");
  res.send("\uFEFF" + csv); // BOM para acentuação correta no Excel
});

// GET /api/export/pdf — relatório de auditoria (usado no fechamento mensal)
router.get("/pdf", async (req, res) => {
  const rows = await fetchRows(req.query as VariationQuery);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=monitor-custos-auditoria.pdf");

  const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" });
  doc.pipe(res);

  doc.fontSize(16).text("Relatório de Auditoria — Monitor de Variação de Custos", { align: "left" });
  doc.fontSize(9).fillColor("#555").text(`Gerado em ${new Date().toLocaleString("pt-BR")}`);
  doc.moveDown(0.5);

  const totalImpacto = rows.reduce((acc, r) => acc + r.impactoMM, 0);
  const semJustificativa = rows.filter((r) => !r.justification).length;
  doc
    .fontSize(10)
    .fillColor("#000")
    .text(
      `Total de materiais: ${rows.length}  |  Impacto financeiro total: R$ ${totalImpacto.toLocaleString(
        "pt-BR",
        { maximumFractionDigits: 2 }
      )}  |  Sem justificativa: ${semJustificativa}`
    );
  doc.moveDown(0.8);

  const headers = ["Material", "Descrição", "Fornecedor", "Período", "Var. %", "Impacto $", "Classificação", "Justificativa"];
  const colWidths = [60, 130, 100, 55, 50, 70, 90, 200];

  function drawHeader(y: number) {
    doc.fontSize(8).fillColor("#fff");
    let x = 36;
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], 18).fill("#0B1F3A");
      doc.fillColor("#fff").text(h, x + 3, y + 5, { width: colWidths[i] - 6 });
      x += colWidths[i];
    });
  }

  let y = doc.y;
  drawHeader(y);
  y += 18;

  doc.fontSize(7.5);
  rows.forEach((r, idx) => {
    if (y > 520) {
      doc.addPage();
      y = 40;
      drawHeader(y);
      y += 18;
    }
    const values = [
      r.material,
      r.descricaoMaterial.slice(0, 55),
      r.fornecedor.slice(0, 40),
      `${r.mes}/${r.anoDM}`,
      `${r.variacaoMMPercentual.toFixed(1)}%`,
      r.impactoMM.toLocaleString("pt-BR", { maximumFractionDigits: 0 }),
      CLASSIFICACAO_LABEL[r.classificacao] || r.classificacao,
      (r.justification?.justificationType?.nome || r.justification?.textoLivre || "Pendente").slice(0, 80),
    ];
    let x = 36;
    if (idx % 2 === 0) {
      doc.rect(36, y, colWidths.reduce((a, b) => a + b, 0), 16).fill("#F5F7FA");
    }
    doc.fillColor("#111");
    values.forEach((v, i) => {
      doc.text(String(v), x + 3, y + 4, { width: colWidths[i] - 6, ellipsis: true });
      x += colWidths[i];
    });
    y += 16;
  });

  doc.end();
});

export default router;
