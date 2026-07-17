-- CreateEnum
CREATE TYPE "Classificacao" AS ENUM ('REDUCAO_CRITICA', 'AUMENTO_CRITICO', 'REDUCAO_RELEVANTE', 'AUMENTO_RELEVANTE', 'CRITICO_FINANCEIRO');

-- CreateEnum
CREATE TYPE "StatusImportacao" AS ENUM ('SUCESSO', 'SUCESSO_COM_AVISOS', 'ERRO');

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "arquivoOrigem" TEXT NOT NULL,
    "dataImportacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalLinhasLidas" INTEGER NOT NULL,
    "totalComVariacao" INTEGER NOT NULL,
    "totalIgnoradasOK" INTEGER NOT NULL,
    "status" "StatusImportacao" NOT NULL,
    "mensagem" TEXT,
    "duracaoMs" INTEGER,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JustificationType" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JustificationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostVariation" (
    "id" TEXT NOT NULL,
    "naturalKey" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "descricaoMaterial" TEXT NOT NULL,
    "tipoMaterial" TEXT,
    "anoDM" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "dataLancamento" TIMESTAMP(3) NOT NULL,
    "centro" TEXT NOT NULL,
    "categoriaContabil" TEXT,
    "docCompra" TEXT,
    "item" TEXT,
    "referencia" TEXT,
    "docRef" TEXT,
    "fornecedor" TEXT NOT NULL,
    "contaFornecedor" TEXT,
    "chaveDoPais" TEXT,
    "taxaCambio" DOUBLE PRECISION,
    "qtdEntrada" DOUBLE PRECISION NOT NULL,
    "unidadeMedida" TEXT,
    "necessarioConv" BOOLEAN NOT NULL DEFAULT false,
    "montanteMI" DOUBLE PRECISION NOT NULL,
    "unitEntrada" DOUBLE PRECISION NOT NULL,
    "medioMovel" DOUBLE PRECISION NOT NULL,
    "variacaoMMValor" DOUBLE PRECISION NOT NULL,
    "variacaoMMPercentual" DOUBLE PRECISION NOT NULL,
    "impactoMM" DOUBLE PRECISION NOT NULL,
    "impactoMMAbs" DOUBLE PRECISION NOT NULL,
    "variacaoMMPercentualAbs" DOUBLE PRECISION NOT NULL,
    "classificacao" "Classificacao" NOT NULL,
    "magnitude" DOUBLE PRECISION,
    "mediaDinamica" TEXT,
    "desvioEntradasReal" DOUBLE PRECISION,
    "obs" TEXT,
    "importId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Justification" (
    "id" TEXT NOT NULL,
    "costVariationId" TEXT NOT NULL,
    "justificationTypeId" TEXT,
    "textoLivre" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "autor" TEXT,

    CONSTRAINT "Justification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JustificationHistory" (
    "id" TEXT NOT NULL,
    "justificationId" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "tipoAntigo" TEXT,
    "tipoNovo" TEXT,
    "textoAntigo" TEXT,
    "textoNovo" TEXT,
    "autor" TEXT,
    "alteradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JustificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CostVariation_naturalKey_key" ON "CostVariation"("naturalKey");
CREATE INDEX "CostVariation_classificacao_idx" ON "CostVariation"("classificacao");
CREATE INDEX "CostVariation_material_idx" ON "CostVariation"("material");
CREATE INDEX "CostVariation_fornecedor_idx" ON "CostVariation"("fornecedor");
CREATE INDEX "CostVariation_anoDM_mes_idx" ON "CostVariation"("anoDM", "mes");
CREATE INDEX "CostVariation_impactoMM_idx" ON "CostVariation"("impactoMM");
CREATE INDEX "CostVariation_variacaoMMPercentual_idx" ON "CostVariation"("variacaoMMPercentual");
CREATE INDEX "CostVariation_impactoMMAbs_idx" ON "CostVariation"("impactoMMAbs");
CREATE INDEX "CostVariation_variacaoMMPercentualAbs_idx" ON "CostVariation"("variacaoMMPercentualAbs");

CREATE UNIQUE INDEX "Justification_costVariationId_key" ON "Justification"("costVariationId");
CREATE INDEX "JustificationHistory_material_idx" ON "JustificationHistory"("material");
CREATE UNIQUE INDEX "JustificationType_nome_key" ON "JustificationType"("nome");

-- AddForeignKey
ALTER TABLE "CostVariation" ADD CONSTRAINT "CostVariation_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ImportLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Justification" ADD CONSTRAINT "Justification_costVariationId_fkey" FOREIGN KEY ("costVariationId") REFERENCES "CostVariation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Justification" ADD CONSTRAINT "Justification_justificationTypeId_fkey" FOREIGN KEY ("justificationTypeId") REFERENCES "JustificationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JustificationHistory" ADD CONSTRAINT "JustificationHistory_justificationId_fkey" FOREIGN KEY ("justificationId") REFERENCES "Justification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
