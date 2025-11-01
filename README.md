# AI Doctor Backend - Graph RAG Medical Diagnosis System

A sophisticated medical diagnosis system using **Graph RAG** (Retrieval-Augmented Generation) that combines:
- **Natural Language Processing** - Extract symptoms from user messages
- **Vector Search** - Semantic similarity using Cloudflare Vectorize
- **Graph Traversal** - Navigate disease-symptom-medication relationships
- **Personalized Dosages** - Calculate medications based on patient age, weight, and type

## Architecture

```
User Message → NLP (Extract Symptoms) → Vector Search (Find Similar Diseases)
→ Graph Traversal (Get Relationships) → Hybrid Scoring → Dosage Calculation
→ Diagnosis Response
```

### Key Components

1. **NLP Service** - Extracts symptoms from natural language using Cloudflare AI
2. **Embeddings Service** - Generates vector embeddings for diseases/symptoms
3. **Vectorstore Service** - Manages Cloudflare Vectorize operations
4. **Graph Service** - Traverses medical knowledge graph
5. **Search Service** - Hybrid search (30% vector + 70% graph)
6. **Dosage Service** - Patient-specific medication calculations
7. **Diagnosis Service** - Orchestrates the full diagnosis flow

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **Vector DB**: Cloudflare Vectorize
- **AI Models**:
  - `@cf/baai/bge-base-en-v1.5` (embeddings)
  - `@cf/meta/llama-3.1-8b-instruct` (NLP)
- **ORM**: Prisma with D1 adapter

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Create Vectorize Index

```bash
npx wrangler vectorize create medical-entities-index --dimensions=768 --metric=cosine
```

### 3. Deploy to Cloudflare

```bash
bun deploy
```

### 4. Generate Embeddings (First-time Setup)

After deployment, generate embeddings for all diseases and symptoms:

```bash
curl -X POST https://your-worker.workers.dev/api/embeddings/generate
```

This will:
- Generate embeddings for all diseases
- Generate embeddings for all symptoms
- Store them in both D1 (metadata) and Vectorize (vectors)

## API Endpoints

### 1. Health Check

```bash
GET /health
```

### 2. Diagnosis

```bash
POST /api/diagnose
```

**Request:**
```json
{
  "message": "I have a headache and sore throat with fever",
  "patientInfo": {
    "age": 8,
    "weight": 25,
    "type": "pediatric"
  }
}
```

## Development

### Run Locally

```bash
bun dev
```

### Format Code

```bash
bun format
```

### Database Sync

```bash
# Sync to remote
bun db-sync:remote
```

## Project Structure

```
src/
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── services/           # Business logic
├── routers/            # API endpoints
├── middleware/         # Middleware
├── libs/               # Third-party libs example (prisma orm)
└── index.ts            # Main entry point
```

---

## 🤖 For AI Assistants (Claude Code)

### Critical Rules

**Package Manager:**
- ✅ **ALWAYS use `bun`** for all commands
- ❌ **NEVER use npm/yarn/pnpm**
- Examples:
  - `bun run dev` (not `npm run dev`)
  - `bun add package` (not `npm install package`)
  - `bun run format` (not `npm run format`)

**Runtime & Infrastructure:**
- Platform: Cloudflare Workers (edge runtime)
- Database: D1 (remote, accessed via wrangler)
- Local dev: Uses `wrangler dev` with remote D1 binding
- No local database - always connects to remote

**Code Style:**
- Formatter: Biome (not Prettier/ESLint)
- No emojis in code unless explicitly requested
- Turkish comments OK for medical domain
- TypeScript strict mode

### Architecture Overview

**Embeddings Strategy (Rich Context):**
- Diseases: Name + Category + Description + Top 5 Symptoms + Top 3 Diagnosis Criteria
- Symptoms: Name + Description + Related Diseases (Primary/Secondary)
- Model: `@cf/baai/bge-base-en-v1.5` (768 dimensions)

**Search & Scoring:**
- Hybrid Search: 30% Vector + 70% Graph
- Dynamic Thresholds: 0.5-0.65 (based on symptom count)
- Multi-symptom Boosting: +15% for 3+ symptoms, +10% for 70%+ match ratio
- Negative Criteria: Differential diagnosis penalties (up to -50%)

**Key Files:**
- `src/services/embeddings.ts` - Rich context building
- `src/services/search.ts` - Hybrid search + dynamic thresholds
- `src/services/graph.ts` - Scoring + boosting + negative criteria
- `src/libs/prisma/schema.prisma` - Database schema

### Development Commands

```bash
# Start local dev (connects to remote D1)
bun run dev

# Deploy to Cloudflare
bun run deploy

# Format code
bun run format

# Database sync
bun run db-sync:local    # Sync with local .env.local
bun run db-sync:remote   # Sync with remote .env.remote

# Generate embeddings (after data changes)
curl -X POST http://localhost:8787/api/embeddings/generate
```

### Recent Improvements (2025-10)

1. **Rich Context Embeddings** - Enhanced semantic search quality
2. **Dynamic Thresholds** - Adaptive based on symptom count
3. **Multi-symptom Boosting** - Rewards comprehensive matches
4. **Negative Criteria** - Filters out conflicting diagnoses
