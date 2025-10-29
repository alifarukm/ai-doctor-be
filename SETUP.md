# Setup Instructions

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed
- Bun or Node.js installed

## Step-by-Step Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Create Vectorize Index

Create a Vectorize index for storing vector embeddings:

```bash
npx wrangler vectorize create medical-entities-index --dimensions=768 --metric=cosine
```

**Expected output:**
```
✅ Successfully created index 'medical-entities-index'
📋 Index Details:
   - Dimensions: 768
   - Metric: cosine
   - Binding: VECTORIZE
```

### 3. Verify Configuration

Check that `wrangler.jsonc` has the correct settings:

```jsonc
{
  "vectorize": [
    {
      "binding": "VECTORIZE",
      "index_name": "medical-entities-index"
    }
  ],
  "ai": {
    "binding": "AI"
  }
}
```

### 4. Test Locally (Optional)

```bash
bun dev
```

Visit http://localhost:8787 to see the API info.

### 5. Deploy to Cloudflare

```bash
bun deploy
```

**Expected output:**
```
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded ai-doctor-be (x.xx sec)
Published ai-doctor-be (x.xx sec)
  https://ai-doctor-be.your-subdomain.workers.dev
```

### 6. Generate Initial Embeddings

This is a **CRITICAL** step - you must generate embeddings before the diagnosis endpoint will work:

```bash
# Replace with your actual worker URL
curl -X POST https://ai-doctor-be.your-subdomain.workers.dev/api/embeddings/generate
```

**This will:**
1. Fetch all diseases and symptoms from the database
2. Generate embeddings using Cloudflare AI
3. Store embeddings in both D1 (metadata) and Vectorize (vectors)

**Expected response:**
```json
{
  "success": true,
  "data": {
    "generated": {
      "diseases": { "generated": 14, "failed": 0 },
      "symptoms": { "generated": 50, "failed": 0 }
    },
    "vectorize": {
      "upserted": 64,
      "failed": 0
    }
  },
  "timestamp": "2025-10-29T10:00:00Z"
}
```

**Note:** This process may take 1-2 minutes depending on the number of entities.

### 7. Test the Diagnosis Endpoint

```bash
curl -X POST https://ai-doctor-be.your-subdomain.workers.dev/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a headache and sore throat with fever",
    "patientInfo": {
      "age": 8,
      "weight": 25,
      "type": "pediatric"
    }
  }'
```

**Expected:** A diagnosis response with diseases, medications, and dosages.

## Troubleshooting

### Issue: "VECTORIZE is not defined"

**Solution:** Make sure you created the Vectorize index:

```bash
npx wrangler vectorize list
```

If `medical-entities-index` is not listed, create it:

```bash
npx wrangler vectorize create medical-entities-index --dimensions=768 --metric=cosine
```

### Issue: "No vector search results"

**Solution:** You need to generate embeddings first:

```bash
curl -X POST https://your-worker.workers.dev/api/embeddings/generate
```

### Issue: "AI model not found"

**Solution:** Ensure your Cloudflare account has AI Workers enabled. Check the Cloudflare dashboard.

### Issue: Database errors

**Solution:** Check your D1 database connection:

```bash
npx wrangler d1 list
```

Verify the database ID matches in `wrangler.jsonc`.

## Verification Checklist

- [ ] Dependencies installed (`bun install`)
- [ ] Vectorize index created
- [ ] Worker deployed to Cloudflare
- [ ] Embeddings generated (POST /api/embeddings/generate)
- [ ] Health check passing (GET /health)
- [ ] Diagnosis endpoint working (POST /api/diagnose)

## Next Steps

Once setup is complete:

1. Test with various symptom inputs
2. Monitor response times and accuracy
3. Adjust scoring weights if needed (in `search.service.ts`)
4. Add more diseases/symptoms to the database
5. Regenerate embeddings when data changes

## Commands Reference

```bash
# Development
bun dev                  # Run locally
bun format              # Format code
bun lint                # Lint code

# Database
bun db-sync:remote      # Sync schema to remote
bun db-sync:local       # Sync schema to local

# Deployment
bun deploy              # Deploy to Cloudflare

# Vectorize
npx wrangler vectorize list                    # List indexes
npx wrangler vectorize create <name>           # Create index
npx wrangler vectorize delete <name>           # Delete index
npx wrangler vectorize get <name>              # Get index info
```

## Important Notes

1. **Embeddings must be generated** before the diagnosis system works
2. **Regenerate embeddings** whenever you add/modify diseases or symptoms
3. **Patient age** should be in years (converted to months internally)
4. **Patient weight** should be in kilograms
5. The system uses **Turkish medical data** (from first_data.sql)

## Support

For issues or questions:
1. Check the logs in Cloudflare dashboard
2. Test individual endpoints (health, embeddings)
3. Verify Vectorize index exists
4. Ensure AI binding is working
