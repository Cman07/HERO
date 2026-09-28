// Explicit operator command. Default is read-only; --apply creates a new version of the configured agent.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFoundryAgentEndpoint, getFoundryAccessToken } from './server.mjs';
import { storedAgentInstructions } from './chat-policy.mjs';
try { process.loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '.env')); } catch {}
async function run() {
  const endpoint = getFoundryAgentEndpoint(process.env.FOUNDRY_AGENT_ENDPOINT);
  const match = endpoint?.pathname.match(/^(\/api\/projects\/[^/]+)\/agents\/([^/]+)\/endpoint\//);
  if (!match) throw new Error('Configure a direct Foundry agent endpoint to use this policy-sync command.');
  const token = await getFoundryAccessToken();
  const headers = { Authorization: `Bearer ${token.value}`, 'Content-Type': 'application/json' };
  async function request(path, body) {
    const response = await fetch(new URL(`${match[1]}${path}?api-version=v1`, endpoint.origin), {
      method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: 'error', signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error(`Foundry policy operation failed (HTTP ${response.status}). Check your project permissions.`);
    return response.json();
  }
  const agent = await request(`/agents/${match[2]}`);
  const latest = agent.versions?.latest;
  const definition = latest?.definition;
  if (definition?.kind !== 'prompt' || !definition.model || definition.tools?.length) throw new Error('Expected the existing prompt agent with no external tools. Review its configuration before changing policy.');
  console.log(`Configured agent version: ${latest.version}; model: ${definition.model}; external tools: 0.`);
  if (definition.instructions === storedAgentInstructions) { console.log('Stored instructions match the local HERO policy.'); return; }
  if (!process.argv.includes('--apply')) { console.log('Stored instructions differ. Run npm run sync:ai-policy -- --apply to create a version with the local policy.'); process.exitCode = 1; return; }
  const result = await request(`/agents/${match[2]}/versions`, {
    ...(latest.description ? { description: latest.description } : {}),
    ...(latest.metadata ? { metadata: latest.metadata } : {}),
    definition: { ...definition, instructions: storedAgentInstructions }
  });
  const created = result;
  if (created?.definition?.instructions !== storedAgentInstructions) throw new Error('Foundry did not confirm the new policy. Read the current agent before retrying.');
  console.log(`Policy synchronized in version ${created.version}. Previous version ${latest.version} remains available in Foundry.`);
}
run().catch(error => { console.error(error.code === 'AZURE_CLI_AUTH' ? 'Run az login, then retry policy sync.' : error.message); process.exitCode = 1; });
