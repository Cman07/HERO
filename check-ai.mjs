// Synthetic operator check. No household record is read or sent; no token/endpoint is printed.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import languageCopy from './language.cjs';
import { createAppServer } from './server.mjs';
try { process.loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const requestedBase = process.argv.find(arg => arg.startsWith('--base='))?.slice(7);
const reportPath = process.argv.find(arg => arg.startsWith('--report='))?.slice(9);
const requestedLanguages = process.argv.find(arg => arg.startsWith('--languages='))?.slice(12).split(',') || Object.keys(languageCopy.languages);
if (requestedLanguages.some(code => !Object.hasOwn(languageCopy.languages, code))) throw new Error('Choose supported language codes for --languages.');
if (requestedBase && !/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(requestedBase)) throw new Error('Use a loopback HTTP origin for --base.');
const server = requestedBase ? null : createAppServer();
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const report = { checkedAt: new Date().toISOString(), synthetic: true, householdProfileSent: false, cases: [] };
try {
 const base = requestedBase || `http://127.0.0.1:${server.address().port}`;
 const status = await (await fetch(base + '/api/chat/status')).json();
 report.provider = status.provider;
 console.log('AI provider:', status.provider || 'not configured');
 if (!status.configured) { console.log('Configure the Foundry agent or direct Azure model in .env.'); process.exitCode = 1; }
 else for (const language of requestedLanguages) {
  const started = performance.now();
  const response = await fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(40000), body: JSON.stringify({
   answers: { danger: 'no', currentZip: '10001', disasterType: 'severe-storm', need: 'Help after property damage' }, useProfile: false, language, completedActionIds: ['damage-application'],
   messages: [{ role: 'user', content: language === 'es' ? 'Prueba ficticia sin datos personales. Ya revisé la vía oficial para solicitar ayuda. ¿Qué puedo hacer ahora?' : 'Synthetic setup test with no personal data. I have reviewed the official application route. What can I do next?' }]
  }) });
  const elapsedMs = Math.round(performance.now() - started);
  const data = await response.json();
  const valid = response.ok && data.mode === 'ai' && typeof data.reply === 'string' && Array.isArray(data.actionIds);
  report.cases.push({ language, elapsedMs, status: response.status, valid, ...(valid ? { reply: data.reply, actionIds: data.actionIds } : { error: data.code || 'response_unavailable' }) });
  if (valid) console.log(`${language}: live structured reply received in ${elapsedMs} ms.\n${data.reply}\nActions: ${data.actionIds.join(', ') || '(clarification only)'}`);
  else {
   console.log(`${language}: AI check failed (${data.code || 'response_unavailable'}).`);
   if (data.code === 'auth_required') console.log('Run az login, complete sign-in, then retry.');
   else if (data.code === 'invalid_output') console.log('Run npm run sync:ai-policy to check the stored policy.');
   process.exitCode = 1;
  }
 }
 if (reportPath) await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
} catch { console.log('AI check could not finish. Check the connection and rerun npm run check:ai.'); process.exitCode = 1; }
finally { if (server) await new Promise(resolve => server.close(resolve)); }
