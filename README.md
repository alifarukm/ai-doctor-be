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
└── index.ts           # Main entry point
```
