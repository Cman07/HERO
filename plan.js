(() => {
  const localities = window.VIRGINIA_LOCALITIES || [];
  const schema = window.floodProfileSchema;
  const search = document.getElementById('home-search');
  const select = document.getElementById('home-locality');
  const status = document.getElementById('profile-status');
  const panels = [...document.querySelectorAll('.profile-panel')];
  let saved = null;
  let user = null;
  let loading = false;
  let homeLocality = null;
  let step = 0;
  let busy = false;
  let ready = false;
  const labels = { unspecified: 'Prefer not to say', yes: 'Yes', no: 'No' };
  function report(message, error = false) {
    status.textContent = message;
    status.classList.toggle('form-error', error);
  }
  for (const [index, question] of schema.profileQuestions.entries()) {
    const field = document.createElement('fieldset');
    field.className = 'profile-question';
    const legend = document.createElement('legend');
    legend.textContent = question.label;
    const choices = document.createElement('div');
    choices.className = 'profile-options';
    for (const value of ['yes', 'no', 'unspecified']) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio'; input.name = question.key; input.value = value; input.checked = value === 'unspecified';
      label.append(input, document.createTextNode(labels[value]));
      choices.append(label);
    }
    field.append(legend, choices);
    document.getElementById(index < 3 ? 'household-questions' : 'support-questions').append(field);
  }
  function filter() {
    const query = search.value.trim().toLocaleLowerCase();
    const matches = localities.filter(name => name.toLocaleLowerCase().includes(query));
    select.replaceChildren(...matches.map(name => new Option(name, name)));
    select.value = matches.includes(homeLocality) ? homeLocality : '';
    select.selectedIndex = matches.includes(homeLocality) ? select.selectedIndex : -1;
    document.getElementById('home-count').textContent = matches.length + ' options available. Select one from the list.';
    document.getElementById('home-selection').textContent = homeLocality ? 'Selected home: ' + homeLocality : 'No home locality selected.';
  }
  function draft() {
    const value = { homeLocality, householdSize: document.getElementById('household-size').value };
    for (const { key } of schema.profileQuestions) value[key] = document.querySelector(`input[name="${key}"]:checked`).value;
    return value;
  }
  function review() {
    const value = draft();
    const entries = [['Home locality', value.homeLocality || 'Not provided'], ['Household size', value.householdSize === 'unspecified' ? 'Prefer not to say' : value.householdSize]];
    for (const { key, label } of schema.profileQuestions) entries.push([label, labels[value[key]]]);
    document.getElementById('profile-review').replaceChildren(...entries.flatMap(([label, answer]) => {
      const term = document.createElement('dt'); term.textContent = label;
      const definition = document.createElement('dd'); definition.textContent = answer;
      return [term, definition];
    }));
  }
  function navigate(next, focus = true) {
    step = next;
    panels.forEach((panel, index) => { panel.hidden = index !== step; });
    document.getElementById('profile-progress').textContent = `Step ${step + 1} of 4`;
    document.getElementById('profile-progress-fill').style.width = `${(step + 1) * 25}%`;
    document.getElementById('profile-back').hidden = step === 0;
    document.getElementById('profile-next').hidden = step === 3;
    document.getElementById('profile-save').hidden = step !== 3;
    if (step === 3) review();
    if (focus) panels[step].querySelector('h2').focus();
  }
  function renderSaved() {
    const destination = user ? 'your account' : 'this browser';
    document.getElementById('profile-summary').textContent = saved ? 'Profile saved to ' + destination + '. Review or update your answers below.' : 'No household profile is saved to ' + destination + '.';
    document.getElementById('profile-account').textContent = user ? 'Signed in as ' + user.username + '. This profile belongs to your account.' : 'You are a guest. Save on this browser, or sign in before filling the form to save to an account.';
    document.getElementById('account-nav').textContent = user ? 'Account' : 'Sign in';
    document.getElementById('profile-save').textContent = user ? 'Save profile to account' : 'Save profile on this browser';
    document.getElementById('remove-profile').hidden = !saved;
  }
  function fill(profile) {
    document.getElementById('delete-confirm').hidden = true;
    homeLocality = profile?.homeLocality || null;
    search.value = ''; filter();
    document.getElementById('household-size').value = profile?.householdSize || 'unspecified';
    for (const { key } of schema.profileQuestions) document.querySelector(`input[name="${key}"][value="${profile?.[key] || 'unspecified'}"]`).checked = true;
  }
  function setBusy(value) {
    busy = value;
    document.getElementById('profile-save').disabled = busy || !ready;
    document.getElementById('remove-profile').disabled = busy;
    document.getElementById('confirm-delete').disabled = busy;
    document.getElementById('cancel-delete').disabled = busy;
  }
  async function request(method, value) {
    const response = await fetch('/api/profile', {
      method, signal: AbortSignal.timeout(5000), headers: { 'Content-Type': 'application/json', 'X-HERO-Profile': '1', 'X-HERO-Profile-Owner': user?.username || 'guest' },
      ...(value ? { body: JSON.stringify(value) } : {})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Profile storage is unavailable.');
    return data;
  }
  search.addEventListener('input', filter);
  select.addEventListener('change', () => { homeLocality = select.value || null; filter(); });
  document.getElementById('clear-home').addEventListener('click', () => { homeLocality = null; search.value = ''; filter(); });
  document.getElementById('profile-next').addEventListener('click', () => { report(''); navigate(step + 1); });
  document.getElementById('profile-back').addEventListener('click', () => { report(''); navigate(step - 1); });
  document.getElementById('profile-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (step !== 3 || busy || !ready) return;
    let value;
    try { value = schema.normalizeProfile(draft(), localities); }
    catch (error) { report(error.message, true); return; }
    document.getElementById('return-home').hidden = true;
    setBusy(true); report('Saving your profile…');
    try {
      saved = (await request('PUT', value)).profile; renderSaved();
      document.getElementById('return-home').hidden = false;
      report('Your household profile is saved to ' + (user ? 'your account' : 'this browser') + '. You can update it here or return to the main page.');
    } catch (error) { report(error instanceof TypeError ? 'Could not reach profile storage. Your answers are still on this page; please try again.' : error.message, true); }
    finally { setBusy(false); }
  });
  document.getElementById('remove-profile').addEventListener('click', () => {
    document.getElementById('delete-confirm').hidden = false;
    document.getElementById('confirm-delete').focus();
  });
  document.getElementById('cancel-delete').addEventListener('click', () => {
    document.getElementById('delete-confirm').hidden = true;
    document.getElementById('remove-profile').focus();
  });
  document.getElementById('confirm-delete').addEventListener('click', async () => {
    if (busy) return;
    setBusy(true); report('Deleting your saved profile…');
    try {
      await request('DELETE'); saved = null; fill(null); renderSaved(); navigate(0);
      report('Your saved profile has been deleted.');
    } catch (error) { report(error.message || 'Could not delete your profile. Please try again.', true); }
    finally { setBusy(false); }
  });
  async function loadProfile() {
    if (busy || loading) return;
    loading = true;
    try {
      const data = await request('GET');
      const nextUser = data.user || null;
      const accountChanged = ready && user?.username !== nextUser?.username;
      user = nextUser; saved = data.profile;
      if (!ready || accountChanged) { fill(saved); if (accountChanged) { navigate(0); report('Your sign-in changed. The form now shows this account’s profile.'); } }
      ready = true; renderSaved();
    } catch {
      if (!ready) {
        document.getElementById('profile-summary').textContent = 'Profile storage could not be loaded.';
        document.getElementById('profile-account').textContent = 'Sign-in status is unavailable.';
        report('Could not load your profile. Reload this page to try again. You can still find help without a profile.', true);
      }
    } finally { loading = false; setBusy(false); }
  }
  filter(); navigate(0, false); setBusy(false);
  loadProfile();
  window.addEventListener('pageshow', event => { if (event.persisted) loadProfile(); });
  window.addEventListener('focus', loadProfile);
})();
