# Monitor de Variação de Custos — Controladoria

Sistema web para acompanhamento diário dos materiais com variação relevante de custo (Médio Móvel x Unit. Entrada), substituindo o controle manual feito hoje em Excel.

## Sumário

- [Visão geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Regra de negócio central](#regra-de-negócio-central)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Rodando localmente](#rodando-localmente)
- [Importação dos dados](#importação-dos-dados)
- [Deploy em produção (Vercel + Render)](#deploy-em-produção-vercel--render)
- [Scripts úteis](#scripts-úteis)
- [Próxima fase (sugestão)](#próxima-fase-sugestão)

## Visão geral

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + Prisma
- **Banco**: PostgreSQL
- **Hospedagem**: Frontend na Vercel, backend + banco no Render

O sistema não possui login: qualquer pessoa com o link pode acessar. O **único dado editável** é a justificativa de cada variação — todo o restante é somente leitura, vindo diretamente da importação do Excel.

## Arquitetura

```
Monitor.xlsx (aba "Monitor")
        │  upload manual pelo botão "Importar Excel" no próprio sistema
        ▼
Backend (Render) ── processa a planilha, filtra "OK", grava no PostgreSQL
        │
        ▼
Frontend (Vercel) ── Dashboard, Monitoramento, Dashboards, Tipos de Justificativa
```

A importação é feita **manualmente**: sempre que o arquivo `Monitor.xlsx` for atualizado, basta abrir o sistema, clicar em **"Importar Excel"** na barra lateral e selecionar o arquivo atualizado. O processamento filtra automaticamente as linhas "OK" e preserva todas as justificativas já cadastradas.

> Uma sincronização 100% automática (sem precisar clicar em nada) é possível numa segunda fase, com um pequeno agente instalado numa máquina com acesso ao arquivo. Ficou fora do escopo desta entrega a pedido do cliente.

## Regra de negócio central

A coluna **"Análise da Variação MM %"** do Excel decide se um material aparece no sistema:

- `OK` → **nunca** entra no sistema (nem na tabela, nem nos dashboards, nem nos indicadores)
- Qualquer outra classificação (`Redução crítica`, `Aumento crítico`, `Redução relevante`, `Aumento relevante`, `Crítico financeiro`) → entra no sistema normalmente

Justificativas são vinculadas por uma **chave de negócio estável** (material + documento de compra + item + referência + ano/mês), então uma nova importação **nunca apaga** uma justificativa já preenchida — mesmo que o restante dos dados daquela linha mude.

## Estrutura de pastas

```
monitor-custos/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # modelo de dados
│   │   ├── seed.ts               # tipos de justificativa padrão
│   │   └── migrations/           # migration inicial (SQL)
│   ├── src/
│   │   ├── routes/               # import, variations, dashboard, export, justification-types
│   │   ├── services/             # excelImportService.ts (parser da planilha)
│   │   ├── middleware/           # tratamento de erros
│   │   ├── utils/                # construção de filtros compartilhados
│   │   └── index.ts              # entrada da API Express
│   ├── package.json
│   ├── tsconfig.json
│   ├── render.yaml                # blueprint de deploy no Render
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Dashboard, Monitoramento, Dashboards, Justificativas
│   │   ├── components/            # Layout, tabela, filtros, drawer de justificativa, importação, etc.
│   │   ├── services/api.ts        # chamadas à API
│   │   └── types/                 # tipos compartilhados
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── vercel.json                # config de deploy na Vercel
│   └── .env.example
└── README.md
```

## Rodando localmente

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (local, Docker, ou um banco gerenciado)

### 1. Banco de dados

Crie um banco vazio, por exemplo via Docker:

```bash
docker run --name monitor-custos-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=monitor_custos -p 5432:5432 -d postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# edite o .env com a DATABASE_URL do passo anterior, se necessário

npm install
npm run prisma:migrate:deploy   # cria as tabelas
npm run prisma:seed             # cadastra os tipos de justificativa padrão
npm run dev                     # inicia a API em http://localhost:3333
```

### 3. Frontend

Em outro terminal:

```bash
cd frontend
cp .env.example .env
# por padrão já aponta para http://localhost:3333/api

npm install
npm run dev                     # inicia o frontend em http://localhost:5173
```

Acesse `http://localhost:5173`, clique em **Importar Excel** e selecione o `Monitor.xlsx` para popular o sistema pela primeira vez.

## Importação dos dados

1. Na barra lateral, clique em **"Importar Excel"**.
2. Selecione o arquivo `Monitor.xlsx` atualizado (o mesmo formato usado hoje, com a aba **Monitor**).
3. O sistema processa o arquivo, mostra quantas linhas foram lidas, quantas entraram (variação relevante) e quantas foram ignoradas (`OK`).
4. Justificativas já cadastradas para materiais que continuam aparecendo no novo arquivo são mantidas automaticamente.

Cada importação fica registrada (data, totais, status) e pode ser consultada via `GET /api/import/history`.

## Deploy em produção (Vercel + Render)

### Backend + banco no Render

1. Crie um novo **Blueprint** no Render apontando para a pasta `backend/` (o arquivo `render.yaml` já descreve o serviço web e o banco PostgreSQL).
2. Ou, manualmente:
   - Crie um **PostgreSQL** no Render e copie a *Internal Database URL*.
   - Crie um **Web Service** apontando para `backend/`, com:
     - Build Command: `npm install && npm run build && npm run prisma:migrate:deploy`
     - Start Command: `npm start`
     - Variável `DATABASE_URL` com a URL do banco criado
     - Variável `CORS_ORIGIN` com a URL da Vercel (ex.: `https://monitor-custos.vercel.app`)
3. Após o primeiro deploy, rode o seed uma vez (Shell do Render): `npm run prisma:seed`.

### Frontend na Vercel

1. Importe o repositório na Vercel apontando o **Root Directory** para `frontend/`.
2. Configure a variável de ambiente `VITE_API_URL` com a URL pública do backend no Render (ex.: `https://monitor-custos-api.onrender.com/api`).
3. Deploy automático a cada push — o `vercel.json` já está configurado.

Depois do primeiro deploy dos dois lados, atualize `CORS_ORIGIN` no Render com a URL final da Vercel (e faça redeploy do backend).

## Scripts úteis

**Backend** (`backend/package.json`):
- `npm run dev` — API em modo desenvolvimento (hot reload)
- `npm run build` / `npm start` — build e execução em produção
- `npm run prisma:migrate:deploy` — aplica as migrations no banco
- `npm run prisma:seed` — cadastra os tipos de justificativa padrão

**Frontend** (`frontend/package.json`):
- `npm run dev` — frontend em modo desenvolvimento
- `npm run build` — build de produção (pasta `dist/`)

## Próxima fase (sugestão)

Quando fizer sentido, a importação manual pode evoluir para automática com um pequeno agente monitorando o arquivo (local ou de rede) e enviando para a API sozinho — sem precisar abrir o sistema. Essa etapa foi propositalmente deixada de fora desta entrega.
