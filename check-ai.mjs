// Local operator check. No household record is read or sent; no token or endpoint is printed.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppServer } from './server.mjs';
try { process.loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const server = createAppServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
 const base = `http://127.0.0.1:${server.address().port}`;
 const status = await (await fetch(base + '/api/chat/status')).json();
 console.log('AI provider:', status.provider || 'not configured');
 if (!status.configured) { console.log('Set FOUNDRY_AGENT_ENDPOINT, or the three AZURE_OPENAI settings, in .env.'); process.exitCode = 1; }
 else {
  const response = await fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(40000), body: JSON.stringify({
   answers: { danger: 'no', locality: null, need: 'In-person assistance' }, useProfile: false, language: 'en',
   messages: [{ role: 'user', content: 'This is a setup test with no personal data. Give one official next step for asking a representative about flood assistance.' }]
  }) });
  const data = await response.json();
  if (response.ok) { console.log('Live reply received:', data.reply); }
  else { console.log('AI check:', data.code || 'response_unavailable');
   if (data.code === 'auth_required') console.log('Run az login, complete Microsoft sign-in, then rerun npm run check:ai.');
   else if (data.code === 'access_denied') console.log('Check the signed-in account and Foundry Agent Consumer permissions.');
   else console.log('Check the endpoint, agent deployment and Azure service status, then retry.');
   process.exitCode = 1;
  }
 }
} catch { console.log('AI check could not finish. Check the connection and rerun npm run check:ai.'); process.exitCode = 1; }
finally { await new Promise(resolve => server.close(resolve)); }
