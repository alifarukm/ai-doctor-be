# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

**CRITICAL: Always use `bun` - never npm, yarn, or pnpm**

```bash
bun run dev          # NOT npm run dev
bun add package      # NOT npm install package
bun run format       # NOT npm run format
```

## Development Commands

```bash
# Start local development (connects to REMOTE D1 database)
bun run dev

# Deploy to Cloudflare Workers
bun run deploy

# Code formatting and linting (uses Biome, not Prettier/ESLint)
bun run format        # Auto-fix formatting
bun run format:check  # Check only
bun run lint          # Auto-fix linting
bun run lint:check    # Check only

# Database operations (uses Prisma with D1 adapter)
bun run db-sync:local   # Sync schema to local .env.local
bun run db-sync:remote  # Sync schema to remote .env.remote
bun run generate-schemas # Generate Prisma client

# Cloudflare type generation
bun run cf-typegen
```

## Architecture Overview

This is a **Graph RAG Medical Diagnosis System** running on Cloudflare Workers that combines:
- Vector search (Vectorize) for semantic similarity
- Graph traversal (Prisma + D1) for relationship navigation
- Hybrid scoring (30% vector + 70% graph)
- LLM enhancement for symptom extraction and explanations

### Critical Infrastructure Details

**Runtime:** Cloudflare Workers (edge runtime, not Node.js)
**Database:** Cloudflare D1 (remote SQLite, accessed via wrangler bindings)
**Vector DB:** Cloudflare Vectorize (768 dimensions, cosine similarity)
**AI Models:**
- `@cf/baai/bge-base-en-v1.5` - Embeddings (768d)
- `@cf/meta/llama-3.1-8b-instruct` - NLP extraction
- External LLM via OpenRouter for enhanced reasoning

**Important:** Local development uses `wrangler dev` with `remote: true` bindings - there is NO local database. All DB operations hit the remote D1 instance.

## Diagnosis Flow Architecture

```
1. User Message
   ↓
2. NLP Extraction (Cloudflare AI or LLM fallback)
   → Extract symptoms from natural language
   ↓
3. Symptom Validation (NLPService)
   → Fuzzy match against known symptoms in DB
   ↓
4. Hybrid Search (SearchService)
   → Vector Search: Generate query embedding, search Vectorize
   → Graph Traversal: Get disease-symptom relationships
   → Dynamic Threshold: 0.5-0.65 based on symptom count
   ↓
5. Scoring (GraphService)
   → Base Score: Symptom importance + primary/secondary weighting
   → Multi-symptom Boosting: +15% for 3+ symptoms, +10% for 70%+ match
   → Negative Criteria: Differential diagnosis penalties (up to -50%)
   → Combined: 30% vector + 70% graph - penalties
   ↓
6. Dosage Calculation (DosageService)
   → Patient-specific (age, weight, type)
   ↓
7. Response Assembly (DiagnosisService)
   → Top 5 diseases + medications + supportive care
   → Optional LLM explanation and follow-up questions
```

## Rich Context Embeddings

**CRITICAL IMPLEMENTATION DETAIL:** Embeddings are NOT simple "name + description". They use rich contextual information:

**Disease Embeddings:**
```
Hastalık: {name}.
Kategori: {category}.
Açıklama: {description}.
Ana semptomlar: {primary_symptoms with importance scores}.
Diğer semptomlar: {secondary_symptoms}.
Tanı kriterleri: {positive diagnosis criteria}
```

**Symptom Embeddings:**
```
Semptom: {name}.
Açıklama: {description}.
Ana semptom olduğu hastalıklar: {diseases where it's primary}.
İkincil semptom olduğu hastalıklar: {diseases where it's secondary}
```

See `src/services/embeddings.ts`:
- `buildRichDiseaseContext()` - Lines 15-118
- `buildRichSymptomContext()` - Lines 124-198

## Service Layer Interactions

**Key Services and Their Dependencies:**

1. **DiagnosisService** (orchestrator)
   - Depends on: NLPService, SearchService, DosageService, LLMService (optional)
   - Entry point for diagnosis flow
   - Stores query history in `user_queries` table

2. **SearchService** (hybrid search)
   - Depends on: EmbeddingsService, VectorStoreService, GraphService
   - Implements dynamic thresholds (fewer symptoms = higher threshold)
   - Combines vector and graph scores

3. **GraphService** (scoring & traversal)
   - Direct Prisma access for graph traversal
   - Implements multi-symptom boosting
   - Handles negative criteria (differential diagnosis)
   - `scoreDiseaseLikelihood()` is the core scoring algorithm

4. **EmbeddingsService** (vector generation)
   - Depends on: Cloudflare AI binding, Prisma
   - Builds rich context before embedding
   - Batch processes in groups of 10

5. **VectorStoreService** (Vectorize operations)
   - Manages Cloudflare Vectorize CRUD
   - Strips array fields (e.g., `relatedEntityIds`) before upsert (Vectorize limitation)

## Database Schema Key Points

**Main Tables:**
- `diseases` - Has `vector_id` linking to Vectorize
- `symptoms` - Has `vector_id` linking to Vectorize
- `disease_symptoms` - Junction table with `is_primary`, `importance` (1-10)
- `diagnosis_criterions` - Has `type` field: "positive" or "negative"
- `medications_dosages` - Age/weight-specific dosing rules
- `vector_embeddings` - Tracks all embeddings in D1

**Critical Relationships:**
- Diseases → Categories (many-to-one)
- Diseases ↔ Symptoms (many-to-many via `disease_symptoms`)
- Diseases → Treatments → Medications → Dosages (nested hierarchy)
- Diagnosis criteria can be positive (supportive) or negative (differential)

## Cloudflare Bindings

Defined in `wrangler.jsonc` and accessed via `c.env` in Hono routes:

```typescript
env.DB           // D1 database binding (remote: true)
env.VECTORIZE    // Vectorize index binding (remote: true)
env.AI           // Cloudflare AI binding
env.EMBEDDING_MODEL      // "@cf/baai/bge-base-en-v1.5"
env.NLP_MODEL            // "@cf/meta/llama-3.1-8b-instruct"
env.OPEN_ROUTER_API_KEY  // External LLM API key
env.LLM_MODEL            // "z-ai/glm-4.5-air:free"
```

## Code Style Rules

- **Formatter:** Biome (configured in `biome.json`)
- **No emojis** in code unless explicitly requested
- **Turkish comments** are acceptable for medical domain terminology
- **TypeScript strict mode** enabled
- **Logging:** Use `logger` from `@/utils/logger` (pino-based)

## Common Workflows

**After changing database schema:**
```bash
bun run generate-schemas  # Regenerate Prisma client
bun run db-sync:remote    # Push schema to D1
```

**After adding/modifying diseases or symptoms:**
```bash
# Deploy first
bun run deploy

# Then regenerate embeddings
curl -X POST https://your-worker.workers.dev/api/embeddings/generate
```

**Testing diagnosis locally:**
```bash
bun run dev  # Starts on localhost:8787

curl -X POST http://localhost:8787/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Boğazım çok ağrıyor ve ateşim var",
    "patientInfo": {
      "age": 25,
      "weight": 70,
      "type": "adult"
    }
  }'
```

## Recent Architecture Changes (2025-10)

1. **Rich Context Embeddings** - Enhanced from simple "name: description" to include categories, symptoms, and diagnostic criteria
2. **Dynamic Thresholds** - Vector search threshold now adjusts 0.5-0.65 based on symptom count
3. **Multi-symptom Boosting** - Diseases matching 3+ symptoms get +15% score, 70%+ match ratio gets +10%
4. **Negative Criteria Implementation** - Differential diagnosis now penalizes conflicting symptoms up to -50%

These are implemented across:
- `src/services/embeddings.ts` (rich context building)
- `src/services/search.ts` (dynamic thresholds, line 19-24)
- `src/services/graph.ts` (boosting lines 192-228, negative criteria lines 234-298)
