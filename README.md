# LICITA-Pro

Sistema profissional de análise de editais de licitação pública com IA local (OLLAMA).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite 6 + **MUI v7** + Satoshi font |
| Backend | **Next.js 15** (API Routes) |
| LLM | **OLLAMA** local (`llama3.2:3b`) |
| PDF | `pdfjs-dist` + chunking semântico |
| Database | **Supabase** (PostgreSQL + Storage) |
| Monorepo | Turborepo + npm workspaces |

---

## Pré-requisitos

- Node.js 20+
- OLLAMA instalado e rodando: https://ollama.com
- Conta Supabase: https://app.supabase.com

---

## Setup Inicial

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o OLLAMA

```bash
# Baixe o modelo
ollama pull llama3.2:3b

# Configure o context window (adicione ao ambiente ou .env do sistema)
# Windows: set OLLAMA_NUM_CTX=8192
# Linux/Mac: export OLLAMA_NUM_CTX=8192

# Inicie o OLLAMA
ollama serve
```

### 3. Configure o Supabase

1. Crie um projeto em https://app.supabase.com
2. No SQL Editor, execute as migrations **na ordem**:

```
supabase/migrations/001_orgaos.sql
supabase/migrations/002_editais.sql
supabase/migrations/003_itens_edital.sql
supabase/migrations/004_analises_llm.sql
supabase/migrations/005_certificacoes.sql
supabase/migrations/006_rls_policies.sql
supabase/migrations/007_indexes_functions.sql
supabase/migrations/008_storage.sql
supabase/migrations/009_auth_rls.sql
```

3. Em **Authentication → Providers → Email**: habilite email/senha
4. Crie um usuário em **Authentication → Users → Add user**

### 4. Configure as variáveis de ambiente

**apps/api/.env.local**
```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Settings → API → service_role key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
NEXT_PUBLIC_FRONTEND_URL=http://localhost:8080
```

**apps/web/.env.local**
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # Settings → API → anon public key
```

### 5. Baixe a fonte Satoshi

Acesse https://www.fontshare.com/fonts/satoshi e baixe o arquivo `Satoshi-Variable.woff2`.
Coloque em: `apps/web/public/fonts/Satoshi-Variable.woff2`

---

## Rodando o Projeto

```bash
# Inicia frontend (porta 8080) e backend (porta 3001) simultaneamente
npm run dev
```

Ou separadamente:

```bash
# Terminal 1 — Backend
cd apps/api && npm run dev

# Terminal 2 — Frontend
cd apps/web && npm run dev
```

---

## Verificação

Acesse `http://localhost:3001/api/health` — deve retornar:
```json
{
  "status": "ok",
  "ollama": "ok",
  "supabase": "ok",
  "ollamaModel": "llama3.2:3b"
}
```

---

## Fluxo de Uso

### Upload de Edital (PDF)
1. Acesse `http://localhost:8080`
2. Faça login com as credenciais criadas no Supabase
3. Arraste o PDF do edital para a zona de upload
4. Acompanhe o progresso em tempo real (SSE)
5. Após concluir, acesse o Dashboard do Edital

### Importação via PNCP
1. Menu → "Buscar no PNCP"
2. Digite a palavra-chave (ex: "mobiliário"), selecione UF/modalidade
3. Clique em "Buscar"
4. Em um resultado, clique "Importar e Analisar"
5. O edital será baixado automaticamente do PNCP e analisado

---

## Estrutura

```
LICITA-Pro/
├── apps/
│   ├── web/          # React + Vite + MUI v7 (porta 8080)
│   └── api/          # Next.js 15 backend (porta 3001)
├── packages/
│   └── shared-types/ # Interfaces TypeScript compartilhadas
└── supabase/
    └── migrations/   # Schema do banco de dados (001-009)
```

---

## Agentes OLLAMA

O sistema usa 5 agentes especializados em sequência:

| Agente | Função |
|---|---|
| `dados_basicos` | Extrai órgão, objeto, datas, valores, modalidade |
| `itens_completos` | Extrai todos os produtos/itens com especificações |
| `requisitos_tecnicos` | Mapeia certificações ABNT, habilitações exigidas |
| `viabilidade` | Calcula score 0-100 de viabilidade para fabricante de mobiliário |
| `resumo_executivo` | Gera relatório executivo com próximas ações |

---

## APIs do Governo

- **PNCP** (Portal Nacional de Contratações Públicas): `https://pncp.gov.br/api/consulta/v1`
  - Sem autenticação para leitura
  - Editais federais de todos os órgãos

---

*Desenvolvido para fabricantes de mobiliário que participam de licitações públicas brasileiras.*
