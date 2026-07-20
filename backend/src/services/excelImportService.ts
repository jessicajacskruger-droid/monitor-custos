import ExcelJS from "exceljs";
import { prisma } from "../prisma";
import { Classificacao, StatusImportacao, Prisma } from "@prisma/client";

const SHEET_NAME = "Monitor";

// Mapa: cabeçalho exato da planilha -> chave interna usada no código.
// Se alguém renomear/reordenar colunas no Excel, o import continua
// funcionando desde que o TEXTO do cabeçalho não mude.
const COLUMN_MAP: Record<string, string> = {
  "Material": "material",
  "AnoDM": "anoDM",
  "Mês": "mes",
  "Data de Lançamento": "dataLancamento",
  "Centro": "centro",
  "Categoria de classificação contábil": "categoriaContabil",
  "Doc.compra": "docCompra",
  "Item": "item",
  "Referência": "referencia",
  "Doc.ref.": "docRef",
  "Nº conta do fornecedor": "fornecedor",
  "Chave do país": "chaveDoPais",
  "T/C": "taxaCambio",
  "Texto breve de material": "descricaoMaterial",
  "TMat": "tipoMaterial",
  "Qtd entrada": "qtdEntrada",
  "Unidade de medida basica": "unidadeMedida",
  "Necessário Conversão?": "necessarioConv",
  "Montante em MI": "montanteMI",
  "Unit Entrada $": "unitEntrada",
  "Médio Movel $": "medioMovel",
  "Variação MM $": "variacaoMMValor",
  "Variação MM %": "variacaoMMPercentual",
  "Impacto MM $": "impactoMM",
  "Análise da Variação MM %": "classificacaoRaw",
  "Magnitude": "magnitude",
  "Media dinâmica": "mediaDinamica",
  "Desvio Entradas REAL % ": "desvioEntradasReal",
  "Obs": "obs",
};

const CLASSIFICACAO_MAP: Record<string, Classificacao | "OK"> = {
  "OK": "OK",
  "Redução crítica": Classificacao.REDUCAO_CRITICA,
  "Aumento crítico": Classificacao.AUMENTO_CRITICO,
  "Redução relevante": Classificacao.REDUCAO_RELEVANTE,
  "Aumento relevante": Classificacao.AUMENTO_RELEVANTE,
  "Crítico financeiro": Classificacao.CRITICO_FINANCEIRO,
};

interface ParsedRow {
  [key: string]: any;
}

function cellToDate(value: any): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // Serial date do Excel
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }
  return new Date(value);
}

function cellToString(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value) return String(value.text);
  return String(value).trim();
}

function cellToNumber(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function buildNaturalKey(row: ParsedRow): string {
  return [
    row.material,
    row.docCompra ?? "",
    row.item ?? "",
    row.referencia ?? "",
    row.anoDM,
    row.mes,
  ].join("::");
}

export interface ImportResult {
  importId: string;
  status: StatusImportacao;
  totalLinhasLidas: number;
  totalComVariacao: number;
  totalIgnoradasOK: number;
  avisos: string[];
}

/**
 * Importa a aba "Monitor" de um arquivo .xlsx.
 * Regra central: apenas linhas cuja "Análise da Variação MM %" seja
 * diferente de "OK" são persistidas. Justificativas já cadastradas
 * NUNCA são apagadas, pois o upsert é feito pela naturalKey, que mantém
 * o mesmo `id` de CostVariation (e portanto a mesma Justification) entre
 * importações sucessivas.
 */
export async function importMonitorExcel(
  fileBuffer: Buffer,
  arquivoOrigem: string
): Promise<ImportResult> {
  const inicio = Date.now();
  const avisos: string[] = [];

  const workbook = new ExcelJS.Workbook();
  console.log("Workbook criado");
  await workbook.xlsx.load(fileBuffer as any);
  console.log("Workbook carregado");

  const sheet = workbook.getWorksheet(SHEET_NAME);
  console.log("Worksheet localizada");
  if (!sheet) {
    throw new Error(
      `A aba "${SHEET_NAME}" não foi encontrada no arquivo. Verifique se o nome da aba não foi alterado.`
    );
  }

  const headerRow = sheet.getRow(1);
  const colIndexToKey: Record<number, string> = {};
  headerRow.eachCell((cell, colNumber) => {
    const header = cellToString(cell.value);
    const mapped = COLUMN_MAP[header];
    if (mapped) colIndexToKey[colNumber] = mapped;
  });

  const missingColumns = Object.keys(COLUMN_MAP).filter(
    (h) => !Object.values(colIndexToKey).includes(COLUMN_MAP[h])
  );
  if (missingColumns.length > 0) {
    avisos.push(
      `Colunas não encontradas no arquivo (foram ignoradas): ${missingColumns.join(", ")}`
    );
  }

  let totalLinhasLidas = 0;
  let totalComVariacao = 0;
  let totalIgnoradasOK = 0;
  const rowsToUpsert: Prisma.CostVariationUpsertArgs[] = [];
  console.log("Começando leitura das linhas");

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // cabeçalho

    const parsed: ParsedRow = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = colIndexToKey[colNumber];
      if (key) parsed[key] = cell.value;
    });

    if (!parsed.material) return; // linha vazia/lixo
    totalLinhasLidas++;

    const classificacaoTexto = cellToString(parsed.classificacaoRaw);
    const classificacao = CLASSIFICACAO_MAP[classificacaoTexto];

    if (!classificacao || classificacao === "OK") {
      totalIgnoradasOK++;
      return;
    }

    const materialCod = cellToString(parsed.material);
    const docCompra = cellToString(parsed.docCompra);
    const item = cellToString(parsed.item);
    const referencia = cellToString(parsed.referencia);
    const anoDM = Math.round(cellToNumber(parsed.anoDM));
    const mes = Math.round(cellToNumber(parsed.mes));

    const naturalKey = buildNaturalKey({ material: materialCod, docCompra, item, referencia, anoDM, mes });

    const data = {
      naturalKey,
      material: materialCod,
      descricaoMaterial: cellToString(parsed.descricaoMaterial),
      tipoMaterial: cellToString(parsed.tipoMaterial) || null,
      anoDM,
      mes,
      dataLancamento: cellToDate(parsed.dataLancamento),
      centro: cellToString(parsed.centro),
      categoriaContabil: cellToString(parsed.categoriaContabil) || null,
      docCompra: docCompra || null,
      item: item || null,
      referencia: referencia || null,
      docRef: cellToString(parsed.docRef) || null,
      fornecedor: cellToString(parsed.fornecedor),
      contaFornecedor: cellToString(parsed.fornecedor) || null,
      chaveDoPais: cellToString(parsed.chaveDoPais) || null,
      taxaCambio: cellToNumber(parsed.taxaCambio),
      qtdEntrada: cellToNumber(parsed.qtdEntrada),
      unidadeMedida: cellToString(parsed.unidadeMedida) || null,
      necessarioConv: cellToString(parsed.necessarioConv).toUpperCase() === "SIM",
      montanteMI: cellToNumber(parsed.montanteMI),
      unitEntrada: cellToNumber(parsed.unitEntrada),
      medioMovel: cellToNumber(parsed.medioMovel),
      variacaoMMValor: cellToNumber(parsed.variacaoMMValor),
      variacaoMMPercentual: cellToNumber(parsed.variacaoMMPercentual),
      impactoMM: cellToNumber(parsed.impactoMM),
      impactoMMAbs: Math.abs(cellToNumber(parsed.impactoMM)),
      variacaoMMPercentualAbs: Math.abs(cellToNumber(parsed.variacaoMMPercentual)),
      classificacao,
      magnitude: cellToNumber(parsed.magnitude),
      mediaDinamica: cellToString(parsed.mediaDinamica) || null,
      desvioEntradasReal: cellToNumber(parsed.desvioEntradasReal),
      obs: cellToString(parsed.obs) || null,
    };

    rowsToUpsert.push({
      where: { naturalKey },
      create: { ...data, import: { connect: { id: "__IMPORT_ID__" } } } as any,
      update: { ...data },
    });
    totalComVariacao++;
  });

  const status: StatusImportacao =
    avisos.length > 0 ? StatusImportacao.SUCESSO_COM_AVISOS : StatusImportacao.SUCESSO;

  console.log("Leitura concluída");
  console.log("Total para importar:", rowsToUpsert.length);
  const importLog = await prisma.importLog.create({
    data: {
      arquivoOrigem,
      totalLinhasLidas,
      totalComVariacao,
      totalIgnoradasOK,
      status,
      mensagem: avisos.join(" | ") || null,
    },
  });

  // Upsert em lotes para não travar o banco com milhares de statements simultâneos
  const BATCH_SIZE = 100;
  for (let i = 0; i < rowsToUpsert.length; i += BATCH_SIZE) {
    const batch = rowsToUpsert.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      batch.map((args) => {
        const createData = { ...(args.create as any) };
        createData.import = { connect: { id: importLog.id } };
        return prisma.costVariation.upsert({
          where: args.where,
          create: createData,
          update: { ...(args.update as any), importId: importLog.id },
        });
      })
    );
  }

  await prisma.importLog.update({
    where: { id: importLog.id },
    data: { duracaoMs: Date.now() - inicio },
  });

  return {
    importId: importLog.id,
    status,
    totalLinhasLidas,
    totalComVariacao,
    totalIgnoradasOK,
    avisos,
  };
}
