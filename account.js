(() => {
  let mode = 'login';
  let busy = false;
  let user = null;
  let googleConfig = null;
  let googleScript = null;
  const status = document.getElementById('account-status');
  const password = document.getElementById('account-password');
  const confirmation = document.getElementById('account-confirm');
  function report(text, error = false) {
    status.textContent = text;
    status.classList.toggle('form-error', error);
  }
  function setBusy(value) {
    busy = value;
    for (const id of ['account-submit', 'account-logout', 'import-profile', 'login-mode', 'register-mode']) document.getElementById(id).disabled = value;
  }
  function changeMode(next) {
    if (busy) return;
    mode = next;
    document.getElementById('login-mode').setAttribute('aria-pressed', String(mode === 'login'));
    document.getElementById('register-mode').setAttribute('aria-pressed', String(mode === 'register'));
    document.getElementById('confirm-password-field').hidden = mode !== 'register';
    confirmation.required = mode === 'register';
    confirmation.value = ''; confirmation.setCustomValidity('');
    password.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
    document.getElementById('account-submit').textContent = mode === 'register' ? 'Create account' : 'Sign in';
    report('');
  }
  async function request(path, body) {
    if (!navigator.onLine) throw new Error('You are offline. Reconnect to use your account.');
    const response = await fetch(path, {
      method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', 'X-HERO-Account': '1', 'X-HERO-Profile': '1' },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Account service is unavailable.');
    return data;
  }
  function render(data) {
    user = data.user;
    document.getElementById('account-nav').textContent = user ? 'Account' : 'Sign in';
    document.getElementById('signed-out').hidden = Boolean(user);
    document.getElementById('signed-in').hidden = !user;
    document.getElementById('signed-in-name').textContent = user ? 'Signed in as ' + user.username : '';
    document.getElementById('browser-profile-import').hidden = !data.hasBrowserProfile;
    document.getElementById('import-consent').checked = false;
    document.getElementById('account-form').reset();
    confirmation.setCustomValidity('');
    document.querySelector('.profile-footer-actions a').textContent = user ? 'Back to Plan ahead' : 'Continue without an account';
  }
  async function load() { const data = await request('/api/account'); render(data); await loadGoogle(); return data; }
  async function loadGoogle() {
    const note = document.getElementById('google-note');
    const container = document.getElementById('google-button');
    container.replaceChildren();
    try {
      googleConfig = await request('/api/account/google/config');
      document.getElementById('google-title').textContent = user ? 'Link your Google account' : 'Continue with Google';
      if (!googleConfig.enabled) { note.textContent = 'Google sign-in is not configured yet. Username/password sign-in is available below.'; return; }
      if (googleConfig.linkedEmail) { note.textContent = 'Google account linked: ' + googleConfig.linkedEmail + '. Either sign-in method opens this same profile if you created a password account.'; return; }
      note.textContent = user ? 'Choose Google to link it to this HERO account. Your existing profile will stay with this account.' : 'Choose your Google account to sign in or create a HERO account. Sign in from any device to access your saved profile on this site.';
      if (!googleScript) googleScript = new Promise((resolve, reject) => {
        const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
        script.onload = resolve; script.onerror = () => reject(new Error('Google could not be loaded.'));
        document.head.append(script);
      });
      await googleScript;
      window.google.accounts.id.initialize({ client_id: googleConfig.clientId, nonce: googleConfig.nonce,
        auto_select: false, callback: async response => {
          if (busy) return;
          const nonce = googleConfig.nonce;
          setBusy(true); report(user ? 'Linking Google…' : 'Signing in with Google…');
          try {
            await request('/api/account/google', { credential: response.credential, nonce });
            await load(); report('Google is connected. Open Plan ahead to review your profile.');
          } catch (error) { report(error.message, true); await loadGoogle(); }
          finally { setBusy(false); }
        } });
      window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', text: 'continue_with' });
    } catch { googleScript = null; note.textContent = 'Google sign-in is unavailable right now. You can still use username and password.'; }
  }
  document.getElementById('login-mode').addEventListener('click', () => changeMode('login'));
  document.getElementById('register-mode').addEventListener('click', () => changeMode('register'));
  confirmation.addEventListener('input', () => confirmation.setCustomValidity(''));
  password.addEventListener('input', () => confirmation.setCustomValidity(''));
  document.getElementById('account-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (mode === 'register' && password.value !== confirmation.value) {
      confirmation.setCustomValidity(window.heroAccess.translate('The passwords do not match.')); confirmation.reportValidity(); return;
    }
    const body = { username: document.getElementById('account-username').value, password: password.value };
    setBusy(true); report(mode === 'register' ? 'Creating your account…' : 'Signing in…');
    try {
      await request('/api/account/' + mode, body);
      password.value = ''; confirmation.value = '';
      await load(); report(mode === 'register' ? 'Account created. You can now save a profile from Plan ahead.' : 'You are signed in. Open Plan ahead to review your profile.');
    } catch (error) { report(error.name === 'TimeoutError' ? 'The request took too long. Try signing in again.' : error.message, true); }
    finally { setBusy(false); }
  });
  document.getElementById('account-logout').addEventListener('click', async () => {
    if (busy) return;
    setBusy(true); report('Signing out…');
    try { await request('/api/account/logout', {}); render({ user: null }); window.google?.accounts.id.disableAutoSelect(); await loadGoogle(); report('You are signed out. Your account profile is still saved for your next sign-in.'); }
    catch (error) { report(error.message, true); }
    finally { setBusy(false); }
  });
  document.getElementById('import-profile').addEventListener('click', async () => {
    if (busy) return;
    if (!document.getElementById('import-consent').checked) { report('Agree to move the browser profile into your account first.', true); return; }
    setBusy(true); report('Moving your profile…');
    try { await request('/api/profile/import', { consent: true }); await load(); report('Your profile is now saved to your account. Open Plan ahead to review it.'); }
    catch (error) { report(error.message, true); }
    finally { setBusy(false); }
  });
  setBusy(true);
  load().then(() => report(user ? 'Your account is ready.' : 'Sign in, create an account, or continue as a guest.'))
    .catch(() => report('Accounts could not be loaded. Reload to try again, or continue to Find help now.', true))
    .finally(() => setBusy(false));
})();
