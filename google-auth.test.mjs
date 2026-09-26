import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { verifyGoogleCredential } from './google-auth.mjs';

test('Google verification rejects bad signatures, audience, issuer, expiry, nonce and unverified email', async () => {
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const client = new OAuth2Client();
  client.getFederatedSignonCertsAsync = async () => ({ certs: { test: keys.publicKey.export({ type: 'spki', format: 'pem' }) }, format: 'PEM' });
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: 'https://accounts.google.com', aud: 'hero.apps.googleusercontent.com', sub: 'stable-subject', email: 'test@example.test', email_verified: true, nonce: 'nonce-value', iat: now, exp: now + 300 };
  function token(payload, privateKey = keys.privateKey) {
    const parts = [Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test' })).toString('base64url'), Buffer.from(JSON.stringify(payload)).toString('base64url')];
    const data = parts.join('.');
    return data + '.' + sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url');
  }
  assert.deepEqual(await verifyGoogleCredential(token(claims), claims.aud, claims.nonce, client), { sub: claims.sub, email: claims.email });
  for (const change of [{ aud: 'attacker' }, { iss: 'https://attacker.test' }, { exp: now - 3600 }, { nonce: 'wrong' }, { email_verified: false }]) {
    await assert.rejects(verifyGoogleCredential(token({ ...claims, ...change }), claims.aud, claims.nonce, client), /could not be verified/);
  }
  const wrong = generateKeyPairSync('rsa', { modulusLength: 2048 });
  await assert.rejects(verifyGoogleCredential(token(claims, wrong.privateKey), claims.aud, claims.nonce, client), /could not be verified/);
});
