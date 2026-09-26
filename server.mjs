import { instructionsFor, immediateDanger, emergencyReply, allowedReply } from './chat-policy.mjs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import localities from './localities.cjs';
import { randomBytes } from 'node:crypto';
import schema from './profile.cjs';
import preparedness from './preparedness.cjs';
import { openProfileDatabase } from './profile-db.mjs';
import { openAccountDatabase, AccountError } from './auth-db.mjs';
import { verifyGoogleCredential } from './google-auth.mjs';
import { createDeclarationService } from './declarations.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);
const staticFiles = new Map([
  ...['language.cjs', 'accessibility.js', 'locality-picker.js', 'sw.js'].map(name => ['/' + name, { name, type: 'text/javascript' }]),
  ['/offline.html', { name: 'offline.html', type: 'text/html' }],
  ['/assets/community.svg', { name: 'assets/community.svg', type: 'image/svg+xml' }],
  ['/assets/fonts/dm-sans-latin.woff2', { name: 'assets/fonts/dm-sans-latin.woff2', type: 'font/woff2', binary: true }],
  ['/assets/fonts/OFL.txt', { name: 'assets/fonts/OFL.txt', type: 'text/plain' }],
  ['/index.html', { name: 'index.html', type: 'text/html' }],
  ['/plan.html', { name: 'plan.html', type: 'text/html' }],
  ['/account.html', { name: 'account.html', type: 'text/html' }],
  ['/account.js', { name: 'account.js', type: 'text/javascript' }],
  ['/plan.js', { name: 'plan.js', type: 'text/javascript' }],
  ['/styles.css', { name: 'styles.css', type: 'text/css' }],
  ['/app.js', { name: 'app.js', type: 'text/javascript' }],
  ['/localities.cjs', { name: 'localities.cjs', type: 'text/javascript' }],
  ['/referrals.cjs', { name: 'referrals.cjs', type: 'text/javascript' }],
  ['/preparedness.cjs', { name: 'preparedness.cjs', type: 'text/javascript' }],
  ['/profile.cjs', { name: 'profile.cjs', type: 'text/javascript' }]
]);
const allowedNeeds = new Set([
  'A place to stay',
  'Food or basic supplies',
  'Help after property damage',
  'In-person assistance',
  'Something else / not sure'
]);


export function getFoundryAgentEndpoint(value) {
  if (!value) return null;
  try {
    const endpoint = new URL(value);
    const validPath = /^\/api\/projects\/[^/]+\/(?:agents\/[^/]+\/endpoint|applications\/[^/]+)\/protocols\/openai\/responses\/?$/.test(endpoint.pathname);
    if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.services.ai.azure.com') || endpoint.username || endpoint.password || endpoint.hash || !validPath) return null;
    endpoint.searchParams.set('api-version', 'v1');
    return endpoint;
  } catch { return null; }
}

export async function getFoundryAccessToken(cachedToken) {
  if (cachedToken?.value && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken;
  let stdout;
  try {
    ({ stdout } = await execFileAsync('az', ['account', 'get-access-token', '--resource', 'https://ai.azure.com', '--output', 'json'], {
      timeout: 15_000,
      maxBuffer: 1024 * 1024,
      windowsHide: true
    }));
  } catch (cause) {
    const error = new Error('Azure CLI authentication failed. Install Azure CLI and run az login.');
    error.code = cause.code === 'ENOENT' ? 'AZURE_CLI_MISSING' : 'AZURE_CLI_AUTH';
    throw error;
  }
  let credential;
  try { credential = JSON.parse(stdout); } catch {
    const error = new Error('Azure CLI returned an invalid access token response.');
    error.code = 'AZURE_CLI_AUTH';
    throw error;
  }
  const timestamp = Number(credential.expiresOnTimestamp);
  const expiresAt = (timestamp ? (timestamp < 1e12 ? timestamp * 1000 : timestamp) : 0)
    || (Number(credential.expires_on) * 1000)
    || Date.parse(credential.expiresOn || '');
  if (typeof credential.accessToken !== 'string' || !credential.accessToken || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    const error = new Error('Azure CLI returned an invalid access token response.');
    error.code = 'AZURE_CLI_AUTH';
    throw error;
  }
  return { value: credential.accessToken, expiresAt };
}

export function foundryResponseText(result) {
  if (typeof result?.output_text === 'string') return result.output_text;
  return (Array.isArray(result?.output) ? result.output : [])
    .filter(item => item?.type === 'message' && Array.isArray(item.content))
    .flatMap(item => item.content)
    .filter(part => part?.type === 'output_text' && typeof part.text === 'string')
    .map(part => part.text)
    .join('\n');
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 16_000) throw new Error('Request is too large.');
  }
  try { return JSON.parse(body); } catch { throw new Error('Invalid request.'); }
}

function validChat(body) {
  if (!body || typeof body !== 'object' || !body.answers || !Array.isArray(body.messages)) return false;
  const { danger, locality, need } = body.answers;
  if (danger !== 'no' || !allowedNeeds.has(need)) return false;
  if (locality !== null && !localities.includes(locality)) return false;
  if (body.language !== undefined && !['en', 'es'].includes(body.language)) return false;
  if (body.messages.reduce((n, m) => n + (typeof m?.content === 'string' ? m.content.length : 0), 0) > 10000) return false;
  if (body.messages.length < 1 || body.messages.length > 12) return false;
  if (body.messages.at(-1)?.role !== 'user') return false;
  return body.messages.every(message =>
    message && ['user', 'assistant'].includes(message.role) &&
    typeof message.content === 'string' && message.content.trim().length > 0 && message.content.length <= (message.role === 'user' ? 1000 : 6000)
  );
}

function sessionToken(req, name = 'hero_profile') {
  const value = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(name + '='))?.slice(name.length + 1);
  return /^[a-f0-9]{64}$/.test(value || '') ? value : null;
}
function sameOrigin(req, env = {}) {
  if (!req.headers.origin) return true;
  try { return env.HERO_ORIGIN ? new URL(req.headers.origin).origin === new URL(env.HERO_ORIGIN).origin : new URL(req.headers.origin).host === req.headers.host; } catch { return false; }
}
function profileCookie(token, env) {
  return `hero_profile=${token || ''}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 31536000 : 0}${(env.NODE_ENV === 'production' || env.HERO_ORIGIN?.startsWith('https://')) ? '; Secure' : ''}`;
}

function accountCookie(token, env) {
  return `hero_session=${token || ''}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 604800 : 0}${(env.NODE_ENV === 'production' || env.HERO_ORIGIN?.startsWith('https://')) ? '; Secure' : ''}`;
}

export function createAppServer({ env = process.env, fetchImpl = fetch, profileStore = null, accountStore = null, googleVerifier = verifyGoogleCredential, declarationService = createDeclarationService(), foundryTokenProvider = getFoundryAccessToken } = {}) {
  const agentEndpoint = getFoundryAgentEndpoint(env.FOUNDRY_AGENT_ENDPOINT);
  const endpoint = env.AZURE_OPENAI_ENDPOINT;
  const deployment = env.AZURE_OPENAI_DEPLOYMENT;
  const apiKey = env.AZURE_OPENAI_API_KEY;
  const requestsByAddress = new Map();
  const accountAttempts = new Map();
  const declarationAttempts = new Map();
  let cachedFoundryToken = null;
  function identity(req) {
    const token = sessionToken(req, 'hero_session');
    const user = accountStore?.userForSession(token) || null;
    return { token, user, owner: user?.profileToken || (token ? null : sessionToken(req)) };
  }
  let apiUrl = null;
  if (endpoint && deployment && apiKey) {
    try {
      const parsed = new URL(endpoint);
      const azureHost = parsed.hostname.endsWith('.openai.azure.com') || parsed.hostname.endsWith('.services.ai.azure.com');
      if (parsed.protocol === 'https:' && azureHost && !parsed.username && !parsed.password && (parsed.pathname === '/' || parsed.pathname === '')) {
        apiUrl = new URL('/openai/v1/chat/completions', parsed);
      }
    } catch { /* Invalid configuration is reported as unavailable below. */ }
  }

  return createServer(async (req, res) => {
    const path = new URL(req.url || '/', 'http://localhost').pathname;
    if (req.method === 'GET' && ['/plan', '/plan/'].includes(path)) {
      res.writeHead(302, { Location: '/plan.html' }); res.end(); return;
    }
    const asset = staticFiles.get(path === '/' ? '/index.html' : path);
    if (req.method === 'GET' && asset) {
      try {
        const contents = await readFile(join(root, asset.name));
        const etag = 'W/"' + createHash('sha256').update(contents).digest('hex') + '"';
        const headers = { 'Content-Type': asset.type + (asset.binary ? '' : '; charset=utf-8'), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache', ETag: etag, Vary: 'Accept-Encoding' };
        if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); res.end(); return; }
        const acceptsGzip = /(?:^|,)\s*gzip\s*(?:;\s*q=(?!0(?:\.0*)?(?:\s|,|$))[0-9.]+)?\s*(?:,|$)/i.test(req.headers['accept-encoding'] || '');
        const compress = !asset.binary && contents.length > 512 && acceptsGzip;
        const body = compress ? gzipSync(contents) : contents;
        if (compress) headers['Content-Encoding'] = 'gzip';
        res.writeHead(200, headers); res.end(body);
      } catch { sendJson(res, 500, { error: 'Page asset unavailable.' }); }
      return;
    }
    if (path === '/api/declarations' && req.method === 'POST') {
      if (!sameOrigin(req, env) || req.headers['x-hero-declarations'] !== '1') { sendJson(res, 403, { error: 'Request not allowed.' }); return; }
      if (!req.headers['content-type']?.startsWith('application/json')) { sendJson(res, 415, { error: 'Send JSON.' }); return; }
      let body;
      try { body = await readJson(req); } catch { sendJson(res, 400, { error: 'Choose a damage locality and try again.' }); return; }
      if (body?.danger !== 'no' || !localities.includes(body.damageLocality)) { sendJson(res, 400, { error: 'Confirm that you are not in immediate danger and select a damage locality.' }); return; }
      const address = req.socket.remoteAddress || 'unknown'; const time = Date.now();
      for (const [key, stamps] of declarationAttempts) if (stamps.at(-1) < time - 60_000) declarationAttempts.delete(key);
      const recent = (declarationAttempts.get(address) || []).filter(stamp => stamp > time - 60_000);
      if (recent.length >= 20) { sendJson(res, 429, { error: 'Please wait a minute before checking declarations again.' }); return; }
      recent.push(time); declarationAttempts.set(address, recent);
      try { sendJson(res, 200, await declarationService.lookup(body.damageLocality)); }
      catch { sendJson(res, 200, { status: 'unknown', locality: body.damageLocality, checkedAt: null, stale: false, records: [] }); }
      return;
    }
    if (path.startsWith('/api/account')) {
      if (!accountStore) { sendJson(res, 503, { error: 'Accounts are unavailable right now. You can still find help.' }); return; }
      try {
        if (path === '/api/account/google/config' && req.method === 'GET') {
          if (!sameOrigin(req, env) || req.headers['x-hero-account'] !== '1') { sendJson(res, 403, { error: 'Request not allowed.' }); return; }
          const { user } = identity(req);
          const clientId = env.GOOGLE_CLIENT_ID;
          if (!clientId || !/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
            sendJson(res, 200, { enabled: false }); return;
          }
          const nonce = accountStore.googleChallenge(user?.profileToken || null);
          res.setHeader('Set-Cookie', `hero_google=${nonce}; HttpOnly; SameSite=Strict; Path=/api/account/google; Max-Age=600${(env.NODE_ENV === 'production' || env.HERO_ORIGIN?.startsWith('https://')) ? '; Secure' : ''}`);
          sendJson(res, 200, { enabled: true, clientId, nonce, linking: Boolean(user), linkedEmail: user ? accountStore.googleDetails(user.profileToken) : null }); return;
        }
        if (path === '/api/account' && req.method === 'GET') {
          const { user, token } = identity(req);
          if (token && !user) res.setHeader('Set-Cookie', accountCookie(null, env));
          const browserToken = sessionToken(req);
          const hasBrowserProfile = Boolean(user && profileStore && browserToken && profileStore.get(browserToken) && !profileStore.get(user.profileToken));
          sendJson(res, 200, { user: user ? { username: user.username } : null, hasBrowserProfile }); return;
        }
        if (req.method !== 'POST' || !['/api/account/register', '/api/account/login', '/api/account/logout', '/api/account/google'].includes(path)) {
          sendJson(res, 404, { error: 'Not found.' }); return;
        }
        if (!sameOrigin(req, env) || req.headers['x-hero-account'] !== '1') { sendJson(res, 403, { error: 'Request not allowed.' }); return; }
        const oldToken = sessionToken(req, 'hero_session');
        if (path === '/api/account/logout') {
          accountStore.logout(oldToken);
          res.setHeader('Set-Cookie', accountCookie(null, env));
          sendJson(res, 200, { user: null }); return;
        }
        if (!req.headers['content-type']?.startsWith('application/json')) { sendJson(res, 415, { error: 'Send JSON.' }); return; }
        const address = req.socket.remoteAddress || 'unknown';
        const time = Date.now();
        for (const [key, attempts] of accountAttempts) if (attempts.at(-1) < time - 900_000) accountAttempts.delete(key);
        const recent = (accountAttempts.get(address) || []).filter(stamp => stamp > time - 900_000);
        if (recent.length >= 10) { sendJson(res, 429, { error: 'Too many sign-in attempts. Try again in 15 minutes.' }); return; }
        recent.push(time); accountAttempts.set(address, recent);
        let body;
        try { body = await readJson(req); } catch (error) { sendJson(res, 400, { error: error.message }); return; }
        let result;
        if (path === '/api/account/google') {
          if (!env.GOOGLE_CLIENT_ID) { sendJson(res, 503, { error: 'Google sign-in has not been configured yet. Use username and password.' }); return; }
          const { user, token } = identity(req);
          if (token && !user) { sendJson(res, 401, { error: 'Your session expired. Sign out and reload before using Google.' }); return; }
          const nonce = sessionToken(req, 'hero_google');
          if (body?.nonce !== nonce || !nonce || typeof body.credential !== 'string' || body.credential.length > 12000) {
            sendJson(res, 403, { error: 'Reload the account page and try Google again.' }); return;
          }
          accountStore.consumeGoogleChallenge(nonce, user?.profileToken || null);
          const verified = await googleVerifier(body.credential, env.GOOGLE_CLIENT_ID, nonce);
          // Linking is bound to the original session, even while token verification awaits Google's keys.
          if (user && accountStore.userForSession(token)?.profileToken !== user.profileToken) throw new AccountError('Your session changed. Reload before linking Google.', 401);
          result = accountStore.googleSignIn(verified, user?.profileToken || null);
        } else {
          result = await accountStore[path.endsWith('/register') ? 'register' : 'login'](body);
        }
        accountStore.logout(oldToken);
        res.setHeader('Set-Cookie', accountCookie(result.token, env));
        sendJson(res, path.endsWith('/register') ? 201 : 200, { user: result.user });
      } catch (error) {
        sendJson(res, error instanceof AccountError ? error.status : 500, { error: error instanceof AccountError ? error.message : 'Account service is unavailable. Please try again.' });
      }
      return;
    }
    if (path === '/api/profile/import' && req.method === 'POST') {
      if (!sameOrigin(req, env) || req.headers['x-hero-profile'] !== '1') { sendJson(res, 403, { error: 'Request not allowed.' }); return; }
      if (!req.headers['content-type']?.startsWith('application/json')) { sendJson(res, 415, { error: 'Send JSON.' }); return; }
      try {
        if ((await readJson(req))?.consent !== true) { sendJson(res, 400, { error: 'Agree to move this browser profile into your account first.' }); return; }
      } catch (error) { sendJson(res, 400, { error: error.message }); return; }
      try {
        const { user } = identity(req);
        if (!user) { sendJson(res, 401, { error: 'Sign in before copying your browser profile.' }); return; }
        if (!profileStore) { sendJson(res, 503, { error: 'Profile storage is unavailable.' }); return; }
        if (profileStore.get(user.profileToken)) { sendJson(res, 409, { error: 'Your account already has a profile. Edit it from Plan ahead instead.' }); return; }
        const browserToken = sessionToken(req);
        const profile = browserToken ? profileStore.get(browserToken) : null;
        if (!profile) { sendJson(res, 404, { error: 'No browser profile is available to copy.' }); return; }
        profileStore.save(user.profileToken, profile);
        profileStore.remove(browserToken);
        res.setHeader('Set-Cookie', profileCookie(null, env));
        sendJson(res, 200, { copied: true });
      } catch { sendJson(res, 500, { error: 'Could not copy your profile. Please try again.' }); }
      return;
    }
    if ((path === '/api/profile' && ['GET', 'PUT', 'DELETE'].includes(req.method)) || (path === '/api/checklist' && req.method === 'PUT')) {
      if (!profileStore) { sendJson(res, 503, { error: 'Profile storage is unavailable. You can still find help.' }); return; }
      if (!sameOrigin(req, env) || (req.method !== 'GET' && req.headers['x-hero-profile'] !== '1')) {
        sendJson(res, 403, { error: 'Request not allowed.' }); return;
      }
      try {
        const { token: authToken, user, owner: token } = identity(req);
        if (req.method === 'GET') {
          sendJson(res, 200, { profile: token ? profileStore.get(token) : null, ...(accountStore ? { user: user ? { username: user.username } : null } : {}) }); return;
        }
        if (authToken && !user) { sendJson(res, 401, { error: 'Your session expired. Sign in again before changing your profile.' }); return; }
        if (req.headers['x-hero-profile-owner'] && req.headers['x-hero-profile-owner'] !== (user?.username || 'guest')) {
          sendJson(res, 409, { error: 'Your sign-in changed. Reload the profile before changing it.' }); return;
        }
        if (req.method === 'DELETE') {
          if (token) profileStore.remove(token);
          if (!user) res.setHeader('Set-Cookie', profileCookie(null, env));
          sendJson(res, 200, { profile: null }); return;
        }
        if (!req.headers['content-type']?.startsWith('application/json')) { sendJson(res, 415, { error: 'Send JSON.' }); return; }
        let value;
        const input = await readJson(req).catch(() => null);
        const existing = token ? profileStore.get(token) : null;
        if (path === '/api/checklist') {
          if (!existing) { sendJson(res, 409, { error: 'Save a household profile before saving checklist progress.' }); return; }
          const tasks = preparedness.getChecklist(existing);
          if (!input || typeof input.completed !== 'boolean' || !tasks.some(task => task.id === input.taskId)) {
            sendJson(res, 400, { error: 'Choose a valid checklist task.' }); return;
          }
          const completed = new Set(existing.completedTasks);
          if (input.completed) completed.add(input.taskId); else completed.delete(input.taskId);
          value = { ...existing, completedTasks: [...completed] };
        } else {
          try { value = schema.normalizeProfile({ ...input, ...(existing ? { completedTasks: existing.completedTasks } : {}) }, localities); }
          catch (error) { sendJson(res, 400, { error: error.message }); return; }
        }
        const owner = token || randomBytes(32).toString('hex');
        const profile = profileStore.save(owner, value);
        if (!user) res.setHeader('Set-Cookie', profileCookie(owner, env));
        sendJson(res, 200, { profile });
      } catch { sendJson(res, 500, { error: 'The profile could not be read or saved. Your draft is still on this page; please try again.' }); }
      return;
    }
    if (req.method === 'GET' && path === '/api/chat/status') {
      sendJson(res, 200, { configured: Boolean(agentEndpoint || apiUrl), provider: agentEndpoint ? 'foundry' : apiUrl ? 'azure-model' : null }); return;
    }
    if (req.method === 'POST' && path === '/api/chat') {
      if (!sameOrigin(req, env)) { sendJson(res, 403, { error: 'Request not allowed.' }); return; }
      if (!req.headers['content-type']?.startsWith('application/json')) { sendJson(res, 415, { error: 'Send JSON.' }); return; }
      const address = req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const recent = (requestsByAddress.get(address) || []).filter(time => now - time < 60_000);
      if (recent.length >= 12) { sendJson(res, 429, { error: 'Please wait a minute before sending more messages.' }); return; }
      for (const [key, times] of requestsByAddress) if (!times.some(time => now - time < 60000)) requestsByAddress.delete(key);
      recent.push(now);
      requestsByAddress.set(address, recent);
      let body;
      try { body = await readJson(req); } catch (error) { sendJson(res, 400, { error: error.message }); return; }
      if (!validChat(body)) { sendJson(res, 400, { error: 'Check the questionnaire answers and message, then try again.' }); return; }
      const language = body.language || 'en';
      if (immediateDanger(body.messages.at(-1).content)) { sendJson(res, 200, { reply: emergencyReply(language), emergency: true }); return; }
      if (!agentEndpoint && !apiUrl) { sendJson(res, 503, { error: 'Chat is not configured yet. Use the official referrals on this page.', code: 'not_configured' }); return; }
      const history = body.messages.map(({ role, content }) => ({ role, content }));
      let householdContext = '';
      if (body.useProfile === true && profileStore) {
        try {
          const { owner: token } = identity(req);
          const profile = token ? profileStore.get(token) : null;
          // Explicit allowlist: saved health, disability, access and support answers never enter the AI payload.
          if (profile) householdContext = ` Saved household context (unverified and possibly outdated): ${JSON.stringify({ homeLocality: profile.homeLocality, householdSize: profile.householdSize })}. Home locality is distinct from current and damage locality; confirm before using it.`;
        } catch { sendJson(res, 503, { error: 'Saved household context is unavailable. Turn off profile use to continue.' }); return; }
      }
      const context = `Preferred reply language: ${language === 'es' ? 'Spanish' : 'English'}. Questionnaire answers (unverified user data): immediate danger: no; current Virginia locality: ${body.answers.locality ?? 'not provided'}; help requested: ${body.answers.need}.` + householdContext;
      try {
        const useAgent = Boolean(agentEndpoint);
        const headers = { 'Content-Type': 'application/json' };
        let payload;
        let target = apiUrl;
        if (useAgent) {
          const token = await foundryTokenProvider(cachedFoundryToken);
          cachedFoundryToken = token;
          headers.Authorization = `Bearer ${token.value}`;
          target = agentEndpoint;
          payload = {
            input: [{ role: 'user', content: context }, ...history],
            store: false, max_output_tokens: 500
          };
        } else {
          headers['api-key'] = apiKey;
          payload = {
            model: deployment,
            messages: [
              { role: 'system', content: instructionsFor(language) },
              { role: 'user', content: context },
              ...history
            ],
            store: false, max_completion_tokens: 500
          };
        }
        const response = await fetchImpl(target, {
          method: 'POST', headers, body: JSON.stringify(payload), redirect: 'error', signal: AbortSignal.timeout(20_000)
        });
        if (!response.ok) {
          const message = useAgent && [401, 403].includes(response.status)
            ? 'AI assistance is unavailable right now. Use the official resources or speak with a representative.'
            : 'Chat is unavailable right now. Use the official referrals on this page.';
          sendJson(res, 502, { error: message, code: [401,403].includes(response.status) ? 'access_denied' : response.status === 429 ? 'provider_busy' : 'provider_unavailable' }); return;
        }
        const result = await response.json();
        const reply = useAgent ? foundryResponseText(result) : result?.choices?.[0]?.message?.content;
        if (!allowedReply(reply)) { sendJson(res, 502, { error: 'Chat did not return an answer. Use the official referrals on this page.' }); return; }
        sendJson(res, 200, { reply: reply.trim() });
      } catch (error) {
        sendJson(res, 502, { error: 'AI assistance is unavailable right now. Use the official resources or speak with a representative.', code: ['AZURE_CLI_MISSING', 'AZURE_CLI_AUTH'].includes(error.code) ? 'auth_required' : error.name === 'TimeoutError' ? 'timeout' : 'provider_unavailable' });
      }
      return;
    }
    sendJson(res, 404, { error: 'Not found.' });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { process.loadEnvFile(join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const directory = process.env.PROFILE_DATA_DIR || join(root, '.data');
  const profileStore = openProfileDatabase(directory);
  const accountStore = openAccountDatabase(directory);
  const server = createAppServer({ profileStore, accountStore });
  server.listen(port, host, () => console.log(`Virginia Flood Guide running at http://${host}:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { profileStore.close(); accountStore.close(); process.exit(0); }));
}
