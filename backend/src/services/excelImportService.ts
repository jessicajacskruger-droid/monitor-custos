import ExcelJS from "exceljs";
import { Readable } from "stream";
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
  registrosNovos: number;
  registrosAtualizados: number;
  totalAtualNoBanco: number;
  avisos: string[];
}

/**
 * Recalcula a Média Histórica de Entrada para todos os materiais informados.
 *
 * A média, para cada linha, é a média do Unit Entrada $ de TODAS as entradas
 * anteriores daquele material (de qualquer período), em ordem cronológica
 * pela Data de Lançamento — com empate resolvido pela linha da planilha.
 * A primeira entrada de um material (sem nenhuma anterior) fica com
 * mediaHistoricaEntrada = null, sinalizando "Primeira entrada registrada".
 *
 * Precisa rodar depois de QUALQUER import que toque nesses materiais, pois
 * uma entrada nova pode entrar no meio da linha do tempo e mudar a média
 * de todas as entradas posteriores, não só da entrada nova.
 */
async function recalcularMediaHistorica(materiais: string[]) {
  for (const material of materiais) {
    const entradas = await prisma.costVariation.findMany({
      where: { material },
      orderBy: [{ dataLancamento: "asc" }, { linhaPlanilha: "asc" }, { id: "asc" }],
      select: { id: true, unitEntrada: true },
    });

    let somaAnteriores = 0;
    const updates = entradas.map((entrada, index) => {
      const qtdAnteriores = index;
      const mediaHistoricaEntrada = qtdAnteriores > 0 ? somaAnteriores / qtdAnteriores : null;
      const desvioHistoricoPercentual =
        mediaHistoricaEntrada && mediaHistoricaEntrada !== 0
          ? (entrada.unitEntrada - mediaHistoricaEntrada) / mediaHistoricaEntrada
          : null;

      somaAnteriores += entrada.unitEntrada;

      return prisma.costVariation.update({
        where: { id: entrada.id },
        data: {
          mediaHistoricaEntrada,
          desvioHistoricoPercentual,
          qtdEntradasAnteriores: qtdAnteriores,
        },
      });
    });

    // Lote por material — evita uma transação gigante com o banco inteiro de uma vez
    const BATCH = 50;
    for (let i = 0; i < updates.length; i += BATCH) {
      await prisma.$transaction(updates.slice(i, i + BATCH));
    }
  }
}



/**
 * Importa a aba "Monitor" de um arquivo .xlsx.
 *
 * IMPORTANTE (leitura em streaming):
 * O arquivo de origem costuma trazer, além da aba "Monitor" (poucas
 * milhares de linhas), outras abas auxiliares muito grandes (ex.: MBEWH e
 * Conversão UMB, que juntas já passam de 700 mil linhas) que não são
 * usadas aqui. O ExcelJS no modo `workbook.xlsx.load()` carrega TODAS as
 * abas do arquivo em memória de uma vez, o que é suficiente para estourar
 * a RAM em ambientes com pouca memória (ex.: planos gratuitos/starter do
 * Render) e derrubar o processo (502 Bad Gateway).
 *
 * Por isso usamos aqui o `ExcelJS.stream.xlsx.WorkbookReader`, que lê o
 * arquivo linha a linha, aba a aba, sem nunca montar o workbook inteiro
 * em memória. As abas que não são "Monitor" são drenadas (percorridas
 * sem serem processadas) só para o parser conseguir avançar até a aba
 * correta, sem reter esses dados.
 *
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

  const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(
    Readable.from(fileBuffer),
    {
      worksheets: "emit",
      sharedStrings: "cache",
      hyperlinks: "ignore",
      styles: "ignore",
      entries: "emit",
    }
  );

  const colIndexToKey: Record<number, string> = {};
  let totalLinhasLidas = 0;
  let totalComVariacao = 0;
  let totalIgnoradasOK = 0;
  const rowsToUpsert: Prisma.CostVariationUpsertArgs[] = [];
  let sheetEncontrada = false;

  console.log("Iniciando leitura em streaming do arquivo");

  for await (const worksheetReader of workbookReader) {
console.log("Worksheet encontrada:", (worksheetReader as any).name);
    
    if ((worksheetReader as any).name !== SHEET_NAME) {
      // Drena a aba sem processar/guardar nada, apenas para o parser
      // conseguir seguir em frente até a próxima aba do arquivo.
      for await (const _row of worksheetReader) {
        // no-op intencional
      }
      continue;
    }

    sheetEncontrada = true;
    console.log(`Aba "${SHEET_NAME}" localizada, processando linhas...`);
    let linhaAtual = 0;
    
    try {

for await (const row of worksheetReader) {
      linhaAtual = row.number;

      if (linhaAtual % 1000 === 0) {
        console.log(`Linha ${linhaAtual}`);
      }
      if (row.number === 1) {
        // cabeçalho
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const header = cellToString(cell.value);
          const mapped = COLUMN_MAP[header];
          if (mapped) colIndexToKey[colNumber] = mapped;
        });
        continue;
      }

const parsed: ParsedRow = {};
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const key = colIndexToKey[colNumber];
        if (key) parsed[key] = cell.value;
      });
      parsed.linhaPlanilha = row.number;

      if (!parsed.material) continue; // linha vazia/lixo
      totalLinhasLidas++;

      const classificacaoTexto = cellToString(parsed.classificacaoRaw);
      const classificacao = CLASSIFICACAO_MAP[classificacaoTexto];

      if (!classificacao || classificacao === "OK") {
        totalIgnoradasOK++;
        continue;
      }

      const materialCod = cellToString(parsed.material);
      const docCompra = cellToString(parsed.docCompra);
      const item = cellToString(parsed.item);
      const referencia = cellToString(parsed.referencia);
      const anoDM = Math.round(cellToNumber(parsed.anoDM));
      const mes = Math.round(cellToNumber(parsed.mes));

      const naturalKey = buildNaturalKey({
        material: materialCod,
        docCompra,
        item,
        referencia,
        anoDM,
        mes,
      });

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
        linhaPlanilha: parsed.linhaPlanilha as number,
        obs: cellToString(parsed.obs) || null,
      };
      
      if (totalComVariacao % 500 === 0) {
        console.log(`Encontradas ${totalComVariacao} variações`);
      }
      rowsToUpsert.push({
        where: { naturalKey },
        create: { ...data, import: { connect: { id: "__IMPORT_ID__" } } } as any,
        update: { ...data },
      });

      totalComVariacao++;
    }

    } catch (err) {
      console.error("Erro na linha:", linhaAtual);
      console.error(err);
      throw err;
    }

    // Já lemos tudo que precisávamos da aba "Monitor". Não precisamos
    // continuar o loop para as demais abas/planilhas ocultas do arquivo.
    break;
  }

  if (!sheetEncontrada) {
    throw new Error(
      `A aba "${SHEET_NAME}" não foi encontrada no arquivo. Verifique se o nome da aba não foi alterado.`
    );
  }
// Descobre quantos desses registros já existiam (serão atualizados)
  // e quantos são novos, comparando as naturalKeys com o que já está no banco.
  // Antes disso, remove duplicatas DENTRO do próprio arquivo (mesma
  // naturalKey em mais de uma linha), já que elas colapsam em um único
  // registro no banco e não devem ser contadas duas vezes como "novas".
  const naturalKeysComRepeticao = rowsToUpsert.map((r) => r.where.naturalKey as string);
  const naturalKeysUnicas = [...new Set(naturalKeysComRepeticao)];
  const duplicatasNoArquivo = naturalKeysComRepeticao.length - naturalKeysUnicas.length;

  const existentes = await prisma.costVariation.findMany({
    where: { naturalKey: { in: naturalKeysUnicas } },
    select: { naturalKey: true },
  });
  const registrosAtualizados = existentes.length;
  const registrosNovos = naturalKeysUnicas.length - registrosAtualizados;

  if (duplicatasNoArquivo > 0) {
    avisos.push(
      `${duplicatasNoArquivo} linha(s) duplicada(s) no arquivo (mesmo Material/Doc.compra/Item/Referência/Mês/Ano) foram consolidadas em um único registro.`
    );
  }
  const missingColumns = Object.keys(COLUMN_MAP).filter(
    (h) => !Object.values(colIndexToKey).includes(COLUMN_MAP[h])
  );
  if (missingColumns.length > 0) {
    avisos.push(
      `Colunas não encontradas no arquivo (foram ignoradas): ${missingColumns.join(", ")}`
    );
  }

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

const materiaisAfetados = [...new Set(rowsToUpsert.map((r) => (r.create as any).material as string))];
  console.log(`Recalculando média histórica para ${materiaisAfetados.length} material(is) afetado(s)...`);
  await recalcularMediaHistorica(materiaisAfetados);
  console.log("Recálculo da média histórica concluído");

  await prisma.importLog.update({
    where: { id: importLog.id },
    data: { duracaoMs: Date.now() - inicio },
  });

  return {

const totalAtualNoBanco = await prisma.costVariation.count();

  return {
    importId: importLog.id,
    status,
    totalLinhasLidas,
    totalComVariacao,
    totalIgnoradasOK,
    registrosNovos,
    registrosAtualizados,
    totalAtualNoBanco,
    avisos,
  };
}
