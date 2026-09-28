(() => {
  const schema = window.floodProfileSchema;
  const search = document.getElementById('home-search');
  const status = document.getElementById('profile-status');
  const panels = [...document.querySelectorAll('.profile-panel')];
  let saved = null;
  let user = null;
  let loading = false;
  let homeZip = null;
  let legacyHomeLocality = null;
  let step = 0;
  let busy = false;
  let ready = false;
  let completedTasks = [];
  const preparedness = window.floodPreparedness;
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
  function updateHomeSelection() {
    document.getElementById('home-selection').textContent = homeZip ? 'Entered home ZIP: ' + homeZip : 'No home ZIP entered.';
    const legacy = document.getElementById('legacy-home');
    legacy.hidden = !legacyHomeLocality;
    legacy.textContent = legacyHomeLocality ? 'Earlier saved Virginia locality (read only): ' + legacyHomeLocality + '. Enter a home ZIP to use location-based features.' : '';
  }
  search.addEventListener('input', () => { homeZip = search.value.trim() || null; updateHomeSelection(); });
  function filter() { search.value = homeZip || ''; updateHomeSelection(); }
  function draft() {
    const value = { homeZip, legacyHomeLocality, householdSize: document.getElementById('household-size').value, completedTasks };
    for (const { key } of schema.profileQuestions) value[key] = document.querySelector(`input[name="${key}"]:checked`).value;
    return value;
  }
  function review() {
    const value = draft();
    const entries = [['Home ZIP', value.homeZip || 'Not provided'], ['Household size', value.householdSize === 'unspecified' ? 'Prefer not to say' : value.householdSize]];
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
    const heading = panels[step].querySelector('h2');
    heading.id ||= 'profile-step-heading-' + step;
    document.querySelector('.profile-card').setAttribute('aria-labelledby', heading.id);
    if (focus) heading.focus();
  }
  function showChecklist() {
    document.getElementById('preparedness-plan').hidden = false;
  }
  function showSurvey(focus = true) {
    document.getElementById('preparedness-plan').hidden = false;
    navigate(0, focus);
  }
  document.getElementById('checklist-edit-profile').addEventListener('click', () => {
    if (busy || loading) return;
    fill(saved); report(''); showSurvey();
  });
  function renderSaved() {
    const destination = user ? 'your account' : 'this browser';
    document.getElementById('profile-summary').textContent = saved ? 'Profile saved to ' + destination + '. Review or update your answers below.' : 'No household profile is saved to ' + destination + '.';
    document.getElementById('profile-account').textContent = user ? 'Signed in as ' + user.username + '. This profile belongs to your account.' : 'You are a guest. Save on this browser, or sign in before filling the form to save to an account.';
    document.getElementById('account-nav').textContent = user ? 'Account' : 'Sign in';
    document.getElementById('profile-save').textContent = user ? 'Save profile to account' : 'Save profile on this browser';
    document.getElementById('remove-profile').hidden = !saved;
    if (saved) completedTasks = saved.completedTasks || [];
    renderChecklist();
  }
  function fill(profile) {
    document.getElementById('delete-confirm').hidden = true;
    homeZip = profile?.homeZip || null;
    legacyHomeLocality = profile?.legacyHomeLocality || profile?.homeLocality || null;
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
    for (const input of document.querySelectorAll('#checklist-items input')) input.disabled = busy || loading;
    document.getElementById('checklist-print').disabled = busy || loading;
    document.getElementById('checklist-download').disabled = busy || loading;
    document.getElementById('checklist-edit-profile').disabled = busy || loading;
  }
  async function request(method, value, path = '/api/profile') {
    if (!navigator.onLine) throw new Error('You are offline. Reconnect to save or load your profile. Your answers stay on this page.');
    const response = await fetch(path, {
      method, signal: AbortSignal.timeout(5000), headers: { 'Content-Type': 'application/json', 'X-HERO-Profile': '1', 'X-HERO-Profile-Owner': user?.username || 'guest' },
      ...(value ? { body: JSON.stringify(value) } : {})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Profile storage is unavailable.');
    return data;
  }
  document.getElementById('clear-home').addEventListener('click', () => { homeZip = null; search.value = ''; filter(); });
  document.getElementById('profile-next').addEventListener('click', () => { report(''); navigate(step + 1); });
  document.getElementById('profile-back').addEventListener('click', () => { report(''); navigate(step - 1); });
  document.getElementById('profile-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (step !== 3 || busy || !ready) return;
    let value;
    try { value = schema.normalizeProfile(draft(), window.VIRGINIA_LOCALITIES || []); }
    catch (error) { report(error.message, true); return; }
    document.getElementById('return-home').hidden = true;
    setBusy(true); report('Saving your profile…');
    try {
      saved = (await request('PUT', value)).profile; renderSaved();
      document.getElementById('return-home').hidden = false;
      document.getElementById('checklist-status').textContent = 'Checklist ready. Your progress is saved with this profile.';
      report('Your household profile is saved.');
      navigate(0, false); showChecklist();
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
      await request('DELETE'); saved = null; completedTasks = []; fill(null); renderSaved(); navigate(0);
      report('Your saved profile has been deleted.');
      document.getElementById('checklist-status').textContent = 'Saved checklist progress was deleted with your profile.';
    } catch (error) { report(error.message || 'Could not delete your profile. Please try again.', true); }
    finally { setBusy(false); }
  });
  async function loadProfile() {
    if (busy || loading) return;
    loading = true; setBusy(false);
    try {
      const data = await request('GET');
      const nextUser = data.user || null;
      const accountChanged = ready && user?.username !== nextUser?.username;
      user = nextUser; saved = data.profile;
      if (!ready || accountChanged) { completedTasks = saved?.completedTasks || []; fill(saved); if (accountChanged) { showSurvey(); report('Your sign-in changed. The form now shows this account’s profile.'); } }
      const returningToSavedProfile = !ready && saved;
      ready = true; renderSaved();
      if (returningToSavedProfile) showChecklist();
      else if (!saved && !document.getElementById('preparedness-plan').hidden) showSurvey(false);
    } catch {
      if (!ready) {
        document.getElementById('profile-summary').textContent = 'Profile storage could not be loaded.';
        document.getElementById('profile-account').textContent = 'Sign-in status is unavailable.';
        report('Could not load your profile. Reload this page to try again. You can still find help without a profile.', true);
      }
    } finally { loading = false; renderChecklist(); setBusy(false); }
  }
  function renderChecklist() {
    const focusedTask = document.activeElement?.dataset?.taskId;
    const tasks = preparedness.getChecklist(saved);
    completedTasks = preparedness.normalizeCompletedTasks(completedTasks, saved);
    const completed = new Set(completedTasks);
    document.getElementById('checklist-context').textContent = saved
      ? 'Based on your saved household answers. Update and save the form to change these tasks. Progress saves to ' + (user ? 'your account.' : 'this browser’s profile.')
      : 'General preparation tasks. Progress stays on this page until you save a profile above; your saved answers will tailor the checklist.';
    document.getElementById('checklist-count').textContent = `${completed.size} of ${tasks.length} tasks complete. You can revisit any task.`;
    document.getElementById('checklist-items').replaceChildren(...tasks.map(task => {
      const item = document.createElement('li'); item.className = 'checklist-item';
      const label = document.createElement('label'); label.className = 'checklist-label';
      const input = document.createElement('input'); input.type = 'checkbox'; input.dataset.taskId = task.id;
      input.checked = completed.has(task.id); input.disabled = busy || loading;
      const title = document.createElement('strong'); title.textContent = task.title;
      const state = document.createElement('span'); state.className = 'checklist-state'; state.textContent = input.checked ? 'Done' : 'To do';
      label.append(input, title, state);
      const detail = document.createElement('p'); detail.textContent = task.detail;
      const source = document.createElement('a'); source.href = task.source.url; source.textContent = task.source.name;
      source.className = 'checklist-source';
      item.append(label, detail, source); return item;
    }));
    document.getElementById('checklist-export-text').value = window.heroAccess.translateExport(preparedness.checklistText(saved, completedTasks));
    document.getElementById('checklist-export-text').lang = window.heroAccess.language;
    document.getElementById('checklist-export-text').dir = window.heroLanguageCopy.languages[window.heroAccess.language].dir;
    if (focusedTask) document.querySelectorAll('#checklist-items input').forEach(input => { if (input.dataset.taskId === focusedTask) input.focus({ preventScroll: true }); });
  }
  document.getElementById('checklist-items').addEventListener('change', async event => {
    const input = event.target;
    if (!input.matches('input[data-task-id]') || busy || loading) return;
    const taskId = input.dataset.taskId;
    const completed = input.checked;
    const note = document.getElementById('checklist-status');
    if (!saved) {
      completedTasks = completed ? [...new Set([...completedTasks, taskId])] : completedTasks.filter(id => id !== taskId);
      renderChecklist(); note.textContent = 'Progress updated on this page. Save a profile to keep it for later.'; return;
    }
    setBusy(true); note.textContent = 'Saving checklist progress…';
    try {
      saved = (await request('PUT', { taskId, completed }, '/api/checklist')).profile;
      renderSaved(); note.textContent = 'Checklist progress saved.';
    } catch (error) { renderChecklist(); note.textContent = 'Progress was not saved. ' + (error instanceof TypeError ? 'Check your connection and try again.' : error.message); }
    finally { setBusy(false); document.querySelectorAll('#checklist-items input').forEach(input => { if (input.dataset.taskId === taskId) input.focus({ preventScroll: true }); }); }
  });
  document.getElementById('checklist-print').addEventListener('click', () => window.print());
  document.getElementById('checklist-download').addEventListener('click', () => {
    const blob = new Blob([window.heroAccess.translateExport(preparedness.checklistText(saved, completedTasks))], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'hero-preparedness-checklist.txt';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.getElementById('checklist-export').open = true;
    document.getElementById('checklist-status').textContent = 'Download requested. If it does not appear, use the checklist text below. Keep your copy private.';
  });
  document.getElementById('checklist-select-text').addEventListener('click', () => { const text = document.getElementById('checklist-export-text'); text.focus(); text.select(); });
  window.addEventListener('hero-language-change', renderChecklist);
  filter(); navigate(0, false); renderChecklist(); setBusy(false);
  loadProfile();
  window.addEventListener('pageshow', event => { if (event.persisted) loadProfile(); });
  window.addEventListener('focus', loadProfile);
})();
