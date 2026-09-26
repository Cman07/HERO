import { OAuth2Client } from 'google-auth-library';
import { AccountError } from './auth-db.mjs';
const client = new OAuth2Client({ transporterOptions: { timeout: 10000 } });
export async function verifyGoogleCredential(credential, audience, nonce, verifier = client) {
  let payload;
  try {
    const ticket = await verifier.verifyIdToken({ idToken: credential, audience });
    payload = ticket.getPayload();
  } catch { throw new AccountError('Google sign-in could not be verified. Reload and try again.', 401); }
  if (!payload?.sub || payload.nonce !== nonce || payload.email_verified !== true || !payload.email) {
    throw new AccountError('Google sign-in could not be verified. Reload and try again.', 401);
  }
  return { sub: payload.sub, email: payload.email };
}
