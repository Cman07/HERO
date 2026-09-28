// Build-time translation of public editorial copy only. Never loads resident data.
import { readFile, writeFile } from 'node:fs/promises';
import { getFoundryAgentEndpoint, getFoundryAccessToken } from '../server.mjs';
process.loadEnvFile(new URL('../.env', import.meta.url));
const endpoint = getFoundryAgentEndpoint(process.env.FOUNDRY_AGENT_ENDPOINT);
const project = endpoint.pathname.match(/^(\/api\/projects\/[^/]+)/)[1];
const token = await getFoundryAccessToken();
const headers = { Authorization: `Bearer ${token.value}`, 'Content-Type': 'application/json' };
const agentName = endpoint.pathname.match(/\/agents\/([^/]+)/)[1];
const agent = await (await fetch(new URL(`${project}/agents/${agentName}?api-version=v1`, endpoint.origin), { headers })).json();
const model = agent.versions.latest.definition.model;
const sourceName = process.argv.includes('--latest-only') ? './localization-latest-source.json' : process.argv.includes('--new-only') ? './localization-new-source.json' : './localization-source.json';
const keys = JSON.parse(await readFile(new URL(sourceName, import.meta.url), 'utf8'));
const languages = { es: 'Spanish', ar: 'Modern Standard Arabic', 'zh-Hans': 'Simplified Chinese', ko: 'Korean', vi: 'Vietnamese', tl: 'Tagalog (Filipino)', fr: 'French' };
const requested = process.argv.find(arg => arg.startsWith('--languages='))?.slice(12).split(',') || Object.keys(languages);
if (requested.some(code => !Object.hasOwn(languages, code))) throw new Error('Choose supported additional language codes.');
await Promise.all(Object.entries(languages).filter(([code]) => requested.includes(code)).map(async ([code, name]) => {
  let result = {};
  try { result = JSON.parse(await readFile(new URL(`../locales/${code}.json`, import.meta.url), 'utf8')); } catch {}
  const missing = keys.filter(key => !result[key]);
  for (let offset = 0; offset < missing.length; offset += 15) {
    const batch = missing.slice(offset, offset + 15);
    const response = await fetch(new URL(`${project}/openai/v1/responses`, endpoint.origin), {
      method: 'POST', headers, signal: AbortSignal.timeout(90000), body: JSON.stringify({ model, store: false, max_output_tokens: 6000, text: { format: { type: "json_object" } },
        instructions: `Translate public website interface text into ${name}. Use clear, respectful, natural language for residents across the United States seeking disaster assistance. Preserve all safety and privacy boundaries exactly: HERO cannot contact responders, determine eligibility, check live conditions, or reserve assistance. Preserve 911, HERO, Azure AI, FEMA, OpenFEMA, URLs, dates, numbers, [x], ZIP digits and placeholders such as {place}, {n}, {total}, {detail}, {date}, {user}, {need}, {size}, {dest}, {error}, {title}, {state}, {source} verbatim. Do not add promises, advice, or claims. The input is an object mapping numeric IDs to English strings. Translate only values. Return ONLY a JSON object with EVERY numeric ID unchanged and its translated string as value. No Markdown. Do not omit keys.`,
        input: 'Return JSON translations for: '+JSON.stringify(Object.fromEntries(batch.map((text, index) => [String(index),text])))
      })
    });
    if (!response.ok) { const error = await response.json(); throw new Error(`Public translation HTTP ${response.status}: ${JSON.stringify(error.error).replace(/https?:[^\s"]+/g, "[endpoint]")}`); }
    const data = await response.json();
    const raw = data.output?.flatMap(x => x.content || []).filter(x => x.type === 'output_text').map(x => x.text).join('');
    const translated = JSON.parse(raw);
    for (const [index,key] of batch.entries()) {
      translated[key] = translated[String(index)];
      if (typeof translated[key] !== 'string' || !translated[key].trim()) throw new Error(`Missing translation ${code}: ${key}`);
      const tokens = key.match(/\{\w+\}|https?:\/\/[^\s]+|\b911\b/g) || [];
      if (tokens.some(token => !translated[key].includes(token))) throw new Error(`Lost literal in ${code}: ${key}`);
      result[key] = translated[key];
    }
    await writeFile(new URL(`../locales/${code}.json`, import.meta.url), JSON.stringify(result, null, 2) + '\n');
    console.log(`${code}: ${Object.keys(result).length}/${keys.length} public strings translated`);
  }
}));
