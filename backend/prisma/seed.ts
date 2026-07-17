import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TIPOS_PADRAO = [
  "Compra emergencial",
  "Alteração de fornecedor",
  "Oscilação cambial",
  "Frete",
  "Alteração tributária",
  "Erro de cadastro",
  "Negociação comercial",
  "Outros",
];

async function main() {
  for (let i = 0; i < TIPOS_PADRAO.length; i++) {
    await prisma.justificationType.upsert({
      where: { nome: TIPOS_PADRAO[i] },
      update: {},
      create: { nome: TIPOS_PADRAO[i], ordem: i },
    });
  }
  console.log(`Seed concluído: ${TIPOS_PADRAO.length} tipos de justificativa cadastrados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
