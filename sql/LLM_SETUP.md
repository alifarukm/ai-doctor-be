# LLM Integration Setup Guide

This guide explains how to configure and use external LLM providers (OpenAI, Gemini, Anthropic) for enhanced diagnosis capabilities.

## Why Use External LLMs?

The Graph RAG system uses external LLMs to provide:

1. **Better Symptom Extraction** - More accurate natural language processing than basic pattern matching
2. **Diagnosis Reasoning** - Intelligent analysis of symptoms and disease relationships
3. **Natural Language Explanations** - User-friendly, empathetic explanations of diagnosis results
4. **Follow-up Questions** - Smart suggestions for additional information needed

## Supported Providers

### 1. OpenAI (Recommended)
- **Models**: `gpt-4-turbo-preview`, `gpt-4`, `gpt-3.5-turbo`
- **Best for**: Highest quality responses and reasoning
- **Cost**: Moderate to high
- **Setup**: Get API key from https://platform.openai.com/api-keys

### 2. Google Gemini
- **Models**: `gemini-pro`, `gemini-1.5-pro`
- **Best for**: Good balance of quality and cost
- **Cost**: Low to moderate
- **Setup**: Get API key from https://makersuite.google.com/app/apikey

### 3. Anthropic Claude
- **Models**: `claude-3-sonnet-20240229`, `claude-3-opus-20240229`
- **Best for**: Thoughtful, nuanced responses
- **Cost**: Moderate
- **Setup**: Get API key from https://console.anthropic.com/

## Configuration

### Step 1: Update wrangler.jsonc

Open `wrangler.jsonc` and configure the LLM settings in the `vars` section:

```jsonc
{
  "vars": {
    // ... other settings ...

    // LLM Configuration
    "LLM_PROVIDER": "openai",  // Choose: "openai", "gemini", or "anthropic"
    "LLM_API_KEY": "sk-...",   // Your API key
    "LLM_MODEL": "gpt-4-turbo-preview",
    "LLM_TEMPERATURE": "0.7",  // Optional: 0.0-1.0 (lower = more focused)
    "LLM_MAX_TOKENS": "1000"   // Optional: max response length
  }
}
```

### Step 2: For Production Deployment

For security, use Cloudflare secrets instead of hardcoding API keys:

```bash
# Set the API key as a secret
npx wrangler secret put LLM_API_KEY
# Enter your API key when prompted

# Other vars can stay in wrangler.jsonc
```

Then update `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "LLM_PROVIDER": "openai",
    "LLM_MODEL": "gpt-4-turbo-preview"
    // LLM_API_KEY will come from secrets
  }
}
```

## Provider-Specific Configuration

### OpenAI

```jsonc
{
  "LLM_PROVIDER": "openai",
  "LLM_API_KEY": "sk-proj-...",
  "LLM_MODEL": "gpt-4-turbo-preview"
}
```

**Recommended models:**
- `gpt-4-turbo-preview` - Best quality, slower
- `gpt-4` - High quality, good balance
- `gpt-3.5-turbo` - Fast and cheap

### Google Gemini

```jsonc
{
  "LLM_PROVIDER": "gemini",
  "LLM_API_KEY": "AIzaSy...",
  "LLM_MODEL": "gemini-pro"
}
```

**Recommended models:**
- `gemini-1.5-pro` - Latest, best quality
- `gemini-pro` - Good quality, faster

### Anthropic Claude

```jsonc
{
  "LLM_PROVIDER": "anthropic",
  "LLM_API_KEY": "sk-ant-...",
  "LLM_MODEL": "claude-3-sonnet-20240229"
}
```

**Recommended models:**
- `claude-3-opus-20240229` - Highest quality
- `claude-3-sonnet-20240229` - Good balance
- `claude-3-haiku-20240307` - Fast and cheap

## Testing LLM Integration

### 1. Test locally

```bash
# Start local dev server
bun dev
```

### 2. Send a diagnosis request

```bash
curl -X POST http://localhost:8787/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a severe headache and fever for 2 days",
    "patientInfo": {
      "age": 30,
      "weight": 70,
      "type": "adult"
    }
  }'
```

### 3. Check for LLM enhancements

The response should now include:

```json
{
  "success": true,
  "data": {
    "extractedSymptoms": {
      "identified": ["headache", "fever"],
      "confidence": 0.95
    },
    "results": [...],
    "explanation": "Based on your symptoms of severe headache and fever...",
    "followUpQuestions": [
      "Have you experienced any neck stiffness?",
      "Do you have sensitivity to light?",
      "Have you been in contact with anyone who is sick?"
    ],
    ...
  }
}
```

## How It Works

### Without LLM (Fallback Mode)
1. Uses Cloudflare AI for basic symptom extraction
2. Simple keyword matching
3. No explanations or follow-up questions

### With LLM (Enhanced Mode)
1. LLM extracts symptoms with better context understanding
2. Matches symptoms against database with fuzzy matching
3. Generates human-friendly explanation of diagnosis
4. Suggests relevant follow-up questions
5. Handles medical terminology and colloquialisms

## Cost Considerations

Typical costs per diagnosis request:

| Provider | Model | Approx. Cost | Speed |
|----------|-------|--------------|-------|
| OpenAI | gpt-4-turbo | $0.02-0.04 | Medium |
| OpenAI | gpt-3.5-turbo | $0.001-0.002 | Fast |
| Gemini | gemini-pro | $0.0005-0.001 | Fast |
| Anthropic | claude-3-sonnet | $0.01-0.02 | Medium |

**Recommendations:**
- **Development**: Use `gpt-3.5-turbo` or `gemini-pro` (cheap and fast)
- **Production**: Use `gpt-4-turbo` or `claude-3-sonnet` (best quality)

## Fallback Behavior

If LLM is not configured or fails:
- ✅ System automatically falls back to Cloudflare AI
- ✅ Diagnosis still works, just without enhanced features
- ✅ No errors or service disruption
- ⚠️ Missing: explanations and follow-up questions

## Troubleshooting

### "LLM_EXTRACTION_ERROR"
- **Cause**: Invalid API key or quota exceeded
- **Fix**: Check your API key and billing status

### "PARSE_ERROR"
- **Cause**: LLM returned unexpected format
- **Fix**: System will automatically fallback to basic NLP

### Missing explanation/followUpQuestions
- **Cause**: LLM not configured
- **Fix**: Set `LLM_PROVIDER` and `LLM_API_KEY` in wrangler.jsonc

### High latency
- **Cause**: LLM API calls add 1-3 seconds
- **Fix**: Use faster models (gpt-3.5-turbo, gemini-pro) or disable LLM

## Disabling LLM

To disable LLM and use only Cloudflare AI:

```jsonc
{
  "vars": {
    // Remove or comment out these lines:
    // "LLM_PROVIDER": "openai",
    // "LLM_API_KEY": "...",
    // "LLM_MODEL": "..."
  }
}
```

Or set empty values:

```jsonc
{
  "vars": {
    "LLM_PROVIDER": "",
    "LLM_API_KEY": "",
    "LLM_MODEL": ""
  }
}
```

## Best Practices

1. **Use secrets for production** - Never commit API keys
2. **Monitor costs** - Set up billing alerts in your LLM provider dashboard
3. **Test locally first** - Verify configuration before deploying
4. **Choose appropriate models** - Balance quality vs. cost vs. speed
5. **Handle errors gracefully** - System will fallback automatically

## Example Configurations

### Development (Low Cost)
```jsonc
{
  "LLM_PROVIDER": "openai",
  "LLM_API_KEY": "sk-...",
  "LLM_MODEL": "gpt-3.5-turbo",
  "LLM_TEMPERATURE": "0.7",
  "LLM_MAX_TOKENS": "800"
}
```

### Production (High Quality)
```jsonc
{
  "LLM_PROVIDER": "openai",
  "LLM_MODEL": "gpt-4-turbo-preview",
  "LLM_TEMPERATURE": "0.5",
  "LLM_MAX_TOKENS": "1500"
  // LLM_API_KEY stored as secret
}
```

### Budget-Conscious
```jsonc
{
  "LLM_PROVIDER": "gemini",
  "LLM_API_KEY": "AIza...",
  "LLM_MODEL": "gemini-pro",
  "LLM_TEMPERATURE": "0.7",
  "LLM_MAX_TOKENS": "1000"
}
```

## Next Steps

1. Choose your LLM provider and get an API key
2. Update [wrangler.jsonc](../wrangler.jsonc) with your configuration
3. Test locally with `bun dev`
4. Deploy with `bun deploy`
5. Monitor usage and costs in your provider's dashboard

For more information, see:
- [Main Setup Guide](../SETUP.md)
- [API Documentation](../README.md)
