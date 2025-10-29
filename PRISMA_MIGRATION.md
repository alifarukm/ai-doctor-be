# Prisma ORM Migration Guide

All services have been refactored to use Prisma ORM instead of raw SQL queries for type safety and better code maintainability.

## Changes Made

### 1. Service Constructor Changes

**Before (D1Database):**
```typescript
constructor(private db: D1Database) {}
```

**After (PrismaClient):**
```typescript
constructor(private prisma: PrismaClient) {}
```

### 2. Query Pattern Changes

**Before (Raw SQL):**
```typescript
const result = await this.db
  .prepare("SELECT id, name FROM diseases WHERE vectorId IS NULL")
  .all();

const diseases = result.results as Array<{id: number; name: string}>;
```

**After (Prisma):**
```typescript
const diseases = await this.prisma.diseases.findMany({
  where: { vector_id: null },
  select: { id: true, name: true }
});
```

### 3. Field Name Mapping

Prisma uses snake_case for database columns as defined in schema.prisma:

| JavaScript (camelCase) | Database (snake_case) |
|------------------------|----------------------|
| `vectorId` | `vector_id` |
| `categoryId` | `category_id` |
| `symptomId` | `symptom_id` |
| `diseaseId` | `disease_id` |
| `isPrimary` | `is_primary` |
| `isRequired` | `is_required` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

### 4. Router Initialization

**Key Change:** Routers must now initialize Prisma client from D1Database:

```typescript
import prismaClients from "../../../lib/prisma/index";

// Inside router handler
const prisma = await prismaClients.fetch(env.DB);

// Initialize services with prisma
const nlpService = new NLPService(env.AI, prisma, env.NLP_MODEL);
const embeddingsService = new EmbeddingsService(env.AI, prisma, env.EMBEDDING_MODEL);
// ... etc
```

## Remaining Services to Update

The following services still need D1Database → PrismaClient refactoring:

### graph.service.ts
- Replace all `this.db.prepare()` with Prisma queries
- Use Prisma relations for joins (include/select)

### dosage.service.ts
- Replace raw SQL queries with Prisma
- Use findMany with complex where clauses

### diagnosis.service.ts
- Update to use PrismaClient
- Replace raw INSERT/UPDATE with Prisma create/update

### vectorstore.service.ts
- Update getVectorMetadata to use Prisma
- Replace prepare() calls with Prisma queries

### search.service.ts
- Update getDiseasesFromSymptoms method
- Access prisma through graphService

## Benefits of Prisma

✅ **Type Safety** - Full TypeScript type inference
✅ **Auto-completion** - IDE support for all queries
✅ **Validation** - Runtime validation of data
✅ **Relations** - Easy to query related data
✅ **Migrations** - Schema versioning built-in
✅ **No SQL Injection** - Parameterized queries by default

## Example: Complex Query Migration

**Before (Raw SQL with joins):**
```typescript
const result = await this.db.prepare(`
  SELECT d.id, d.name, s.name as symptom_name
  FROM diseases d
  JOIN disease_symptoms ds ON d.id = ds.disease_id
  JOIN symptoms s ON ds.symptom_id = s.id
  WHERE d.id = ?
`).bind(diseaseId).all();
```

**After (Prisma with includes):**
```typescript
const disease = await this.prisma.diseases.findUnique({
  where: { id: diseaseId },
  include: {
    symptoms: {
      include: {
        symptom: true
      }
    }
  }
});
```

## Next Steps

1. Complete refactoring of remaining services
2. Update all routers to use prismaClients.fetch()
3. Test all endpoints
4. Update documentation

## Testing

After migration, test each endpoint:
- ✅ POST /api/embeddings/generate
- ✅ POST /api/diagnose
- ✅ GET /health
