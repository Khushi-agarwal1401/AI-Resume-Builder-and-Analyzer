/**
 * Verify real AI provider API keys (Gemini + Groq) against the live endpoints.
 *
 * Usage:
 *   node --env-file=.env.local scripts/verify-ai-keys.mjs
 *
 * Reports, per provider:
 *   - whether the key is configured (never prints the key itself)
 *   - which of the app's configured model IDs actually exist on the account
 *   - the HTTP status and response text of a real generation call
 */

const GEMINI_MODEL_ORDER = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];
const GROQ_MODEL_ORDER = ["llama-3.3-70b-versatile", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"];

const TEST_PROMPT = "Reply with exactly: OK";

function mask(key) {
  if (!key) return "";
  return `${key.slice(0, 4)}…${key.slice(-4)} (len=${key.length})`;
}

async function geminiTest(apiKey) {
  console.log("\n=== GEMINI ===");
  console.log(`Key configured: ${mask(apiKey)}`);

  // 1. List available models to validate the IDs the app uses.
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  let available = new Set();
  try {
    const res = await fetch(listUrl);
    console.log(`List models HTTP ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      available = new Set(
        (data.models ?? []).map((m) => m.name.replace(/^models\//, ""))
      );
      console.log(`Account has ${available.size} models`);
    } else {
      console.log(`List models body: ${(await res.text()).slice(0, 300)}`);
    }
  } catch (err) {
    console.log(`List models failed: ${err.message}`);
  }

  for (const model of GEMINI_MODEL_ORDER) {
    console.log(`\nModel "${model}": ${available.has(model) ? "EXISTS on account" : "NOT listed (may still work or may 404)"}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: TEST_PROMPT }] }] }),
      });
      const body = await res.text();
      console.log(`  generateContent HTTP ${res.status}`);
      if (res.ok) {
        let text = "";
        try {
          text = JSON.parse(body)?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        } catch {}
        console.log(`  Reply: ${JSON.stringify(text.slice(0, 200))}`);
      } else {
        console.log(`  Error body: ${body.slice(0, 300)}`);
      }
    } catch (err) {
      console.log(`  Request failed: ${err.message}`);
    }
  }
}

async function groqTest(apiKey) {
  console.log("\n=== GROQ ===");
  if (!apiKey) {
    console.log("Key NOT configured — nothing to verify.");
    console.log("Add GROQ_API_KEY to .env.local, then re-run this script.");
    return;
  }
  console.log(`Key configured: ${mask(apiKey)}`);

  // 1. List available models to validate the IDs the app uses.
  let available = new Set();
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    console.log(`List models HTTP ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      available = new Set((data.data ?? []).map((m) => m.id));
      console.log(`Account has ${available.size} models`);
    } else {
      console.log(`List models body: ${(await res.text()).slice(0, 300)}`);
    }
  } catch (err) {
    console.log(`List models failed: ${err.message}`);
  }

  for (const model of GROQ_MODEL_ORDER) {
    console.log(`\nModel "${model}": ${available.has(model) ? "EXISTS on account" : "NOT listed (may still work or may 404)"}`);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: TEST_PROMPT }],
        }),
      });
      const body = await res.text();
      console.log(`  chat.completions HTTP ${res.status}`);
      if (res.ok) {
        let text = "";
        try {
          text = JSON.parse(body)?.choices?.[0]?.message?.content ?? "";
        } catch {}
        console.log(`  Reply: ${JSON.stringify(text.slice(0, 200))}`);
      } else {
        console.log(`  Error body: ${body.slice(0, 300)}`);
      }
    } catch (err) {
      console.log(`  Request failed: ${err.message}`);
    }
  }
}

async function main() {
  await geminiTest(process.env.GEMINI_API_KEY);
  await groqTest(process.env.GROQ_API_KEY);
  console.log("\n=== DONE ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
