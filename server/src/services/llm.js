/**
 * Optional LLM integration.
 *
 * Configured ONLY through environment variables:
 *   LLM_API_KEY  - key for an OpenAI-compatible endpoint
 *   LLM_BASE_URL - defaults to https://api.openai.com/v1
 *   LLM_MODEL    - defaults to gpt-4o-mini
 *
 * The model is used solely to translate a free-text request into a small
 * structured command object. Every command is then validated and applied by
 * this server - the model never writes itinerary data directly.
 * If nothing is configured, or the call fails, the caller falls back to the
 * transparent rule-based parser and says so in the UI.
 */
const BASE = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

export function llmConfigured() {
  return Boolean(process.env.LLM_API_KEY);
}

const SYSTEM_PROMPT = `You convert a travel-planner request into JSON only.
Return exactly one JSON object with these keys:
{"intent":"less_busy"|"add_food"|"reduce_budget"|"add_nature"|"add_history"|"add_beaches"|"add_culture"|"add_adventure"|"add_shopping"|"add_relaxation"|"unknown",
 "dayNumber": <integer or null>,
 "amount": <integer 1-3 or null>,
 "reason": <short string>}
No prose, no markdown fences.`;

/**
 * @returns {Promise<object|null>} structured command or null when unavailable.
 */
export async function interpretWithLLM(text) {
  if (!llmConfigured()) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed.intent !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function llmStatus() {
  const configured = llmConfigured();
  return {
    name: 'LLM interpreter',
    ok: configured,
    detail: configured
      ? `configured (${MODEL}) - requests are interpreted by ${MODEL} and validated server-side`
      : 'not configured - the rule-based fallback is used and shown honestly in the UI',
  };
}
