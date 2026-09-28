(() => {
  const $ = id => document.getElementById(id);
  const flow = $('help-questions');
  const zipInput = $('locality-search');
  const mapZipInput = $('map-zip');
  const damageInput = $('damage-search');
  const countySelect = $('damage-county');
  const needs = new Set([...document.querySelectorAll('[data-need]')].map(button => button.dataset.need));
  const disasters = new Set([...document.querySelectorAll('[data-disaster]')].map(button => button.dataset.disaster));
  const answers = { danger: null, currentZip: null, disasterType: null, need: null };
  const disasterNames = { flood: 'Flood', hurricane: 'Hurricane or tropical storm', wildfire: 'Wildfire', 'severe-storm': 'Tornado or severe storm', 'winter-storm': 'Winter storm', earthquake: 'Earthquake', other: 'Other or not sure' };
  let currentLocation = null, damageLocation = null, resourceResult = null, localListing = null, selectedListing = null;
  let profile = null, owner = 'guest', loadedOwner = false, messages = [], chatController = null, mapController = null, zipController = null, damageController = null;
  let mapRequest = 0, damageRequest = 0, pending = false, map = null, markers = null;
  const recoveryUI = window.createRecoveryUI({ getContext: () => ({ owner, answers, currentLocation,
    damageZip: damageLocation?.zip || null, localListing, selectedListing,
    profile: profile ? { homeZip: profile.homeZip, householdSize: profile.householdSize } : null
  }) });
  const validZip = zip => /^\d{5}$/.test(zip);
  const translate = text => window.heroAccess.translate(text);
  function step(id, focus = true) {
    for (const panel of flow.querySelectorAll('.step')) panel.hidden = panel.id !== id;
    if (id === 'need-step') $('need-description').hidden = answers.danger !== 'no';
    const heading = flow.querySelector(`#${id} h2`);
    if (focus) heading?.focus({ preventScroll: true });
  }
  function storeContext() {
    try { sessionStorage.setItem('hero-help-context-v2', JSON.stringify({ version: 2, owner, answers })); } catch { /* The page remains usable. */ }
  }
  function clearContext() {
    try { sessionStorage.removeItem('hero-help-context-v2'); sessionStorage.removeItem('hero-help-context'); } catch { /* The page remains usable. */ }
  }
  function invalidate() {
    chatController?.abort(); chatController = null; pending = false;
    zipController?.abort(); zipController = null;
    damageController?.abort(); damageController = null; damageRequest++;
    mapController?.abort(); mapController = null; mapRequest++;
    recoveryUI.reset(); clearContext();
    if (answers.need) { messages = []; $('chat-log').replaceChildren(); $('chat-input').value = ''; }
    answers.need = null;
    $('chat-panel').hidden = false;
    $('chat-emergency').hidden = true;
    $('chat-input').disabled = false;
    $('chat-send').disabled = false; $('chat-clear').disabled = false; $('chat-retry').hidden = true;
    $('ai-state').textContent = translate('Not checked');
    $('chat-status').textContent = '';
  }
  function reset() {
    invalidate();
    messages = []; $('chat-log').replaceChildren(); $('chat-input').value = '';
    answers.danger = null; answers.currentZip = null; answers.disasterType = null;
    $('chat-panel').hidden = false;
    currentLocation = null; damageLocation = null; selectedListing = null; localListing = null;
    zipInput.value = ''; mapZipInput.value = ''; damageInput.value = ''; countySelect.replaceChildren(new Option(translate('Enter a damage ZIP first'), '')); countySelect.disabled = true;
    $('map-zip-feedback').textContent = ''; mapZipInput.setAttribute('aria-invalid', 'false');
    $('location-count').textContent = ''; $('damage-count').textContent = '';
    $('location-error').hidden = true; $('damage-error').hidden = true;
    $('use-profile').checked = false;
    step('danger-step');
    loadResources(null);
  }
  function setMapStatus(message) { $('map-status').textContent = translate(message); }
  function keepMapAsExampleOnly() {
    mapController?.abort(); mapController = null; mapRequest++;
    localListing = null; selectedListing = null;
    $('map-example-note').textContent = translate('The map is an example or previous view, not your current location. Federal guidance remains available without a resolved ZIP.');
    setMapStatus('No current ZIP area is confirmed. Do not use these pins as directions.');
    if (resourceResult) renderResourceList(); else loadResources(null);
  }
  function addPinCard(pin) {
    const item = document.createElement('li'); item.id = 'resource-' + encodeURIComponent(pin.id); item.className = 'resource-pin-card';
    item.tabIndex = -1;
    const title = document.createElement('strong'); title.textContent = pin.name;
    const category = document.createElement('span'); category.className = 'pin-category'; category.textContent = translate(pin.category);
    const address = document.createElement('p'); address.textContent = pin.address || translate('Address not listed');
    item.append(title, category, address);
    if (currentLocation && answers.currentZip && resourceResult?.location?.zip === answers.currentZip) {
      const include = document.createElement('button'); include.type = 'button'; include.className = 'text-button'; include.textContent = selectedListing?.id === pin.id ? translate('Included in helper summary') : translate('Include in helper summary');
      include.addEventListener('click', () => { selectedListing = selectedListing?.id === pin.id ? null : pin; renderResourceList(); recoveryUI.changed(); });
      item.append(include);
    }
    return item;
  }
  function renderResourceList() {
    const pins = resourceResult?.pins || [];
    $('map-resource-items').replaceChildren(...pins.map(addPinCard));
    if (!pins.length) {
      const item = document.createElement('li'); item.textContent = translate(resourceResult?.partialFailure ? 'Resource feeds are unavailable. Use the official links below.' : 'No reported resource locations were returned for this view. Use the official links below.');
      $('map-resource-items').append(item);
    }
  }
  function drawMap(result) {
    if (!window.L) { $('resource-map').textContent = translate('Map could not load. Use the resource list.'); return; }
    if (!map) {
      map = L.map('resource-map', { scrollWheelZoom: false }).setView([result.location.latitude, result.location.longitude], 11);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 18 })
        .on('tileerror', () => { $('resource-map').setAttribute('aria-label', translate('Map tiles are unavailable. Use the resource list beside the map.')); })
        .addTo(map);
      markers = L.layerGroup().addTo(map);
    }
    map.setView([result.location.latitude, result.location.longitude], 11);
    markers.clearLayers();
    for (const pin of result.pins) {
      const marker = L.circleMarker([pin.latitude, pin.longitude], { radius: 7, color: pin.kind === 'center' ? '#b84b3c' : pin.kind === 'shelter' ? '#b2771f' : '#155b67', weight: 2, fillOpacity: .8 });
      const tooltip = document.createElement('span'); tooltip.textContent = pin.name;
      marker.bindTooltip(tooltip);
      marker.on('click', () => { const card = document.getElementById('resource-' + encodeURIComponent(pin.id)); card?.scrollIntoView({ block: 'center' }); card?.focus(); });
      markers.addLayer(marker);
    }
    setTimeout(() => map.invalidateSize(), 50);
  }
  async function loadResources(location) {
    mapController?.abort();
    const request = ++mapRequest;
    const controller = new AbortController(); mapController = controller;
    setMapStatus(location ? 'Checking resource listings near your ZIP area…' : 'Loading Charlottesville example locations…');
    try {
      const query = location ? `zip=${encodeURIComponent(location.zip)}` : 'example=charlottesville';
      const response = await fetch(`/api/local-resources?${query}`, { signal: controller.signal });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (request !== mapRequest) return;
      resourceResult = result;
      localListing = location ? (answers.need === 'A place to stay' ? result.pins.find(pin => pin.kind === 'shelter') : null) || result.pins.find(pin => pin.kind === 'center') || null : null;
      if (selectedListing && !result.pins.some(pin => pin.id === selectedListing.id)) selectedListing = null;
      $('map-example-note').textContent = location ? `${translate('Showing an approximate area for')} ${result.location.label}. ${translate('ZIPs are areas, not addresses.')}` : translate('Charlottesville, Virginia is an example view, not your location. Enter your ZIP above to update the map.');
      setMapStatus(`${result.pins.length} ${translate('resource locations returned')}${result.partialFailure ? '. ' + translate('Some sources were unavailable.') : '.'}`);
      $('map-source-status').textContent = (result.sources || []).map(source => `${source.name} (${source.category}): ${translate(source.status === 'checked' ? 'Checked' : 'Unavailable')}${source.checkedAt ? ' · ' + new Date(source.checkedAt).toLocaleString() : ''}`).join(' · ');
      renderResourceList(); drawMap(result);
      if (answers.need) recoveryUI.changed();
    } catch {
      if (request !== mapRequest) return;
      resourceResult = { pins: [], partialFailure: true };
      localListing = null; selectedListing = null;
      setMapStatus('Resource feeds are unavailable. The federal plan below remains available.');
      $('map-source-status').textContent = '';
      renderResourceList();
    } finally { if (request === mapRequest) mapController = null; }
  }
  async function lookupZip(zip, signal) {
    const response = await fetch(`/api/locations/zip?zip=${encodeURIComponent(zip)}`, { signal });
    return response.ok ? response.json() : null;
  }
  async function resolveCurrentZip(zip, fromMap) {
    const feedback = $('map-zip-feedback');
    if (!validZip(zip)) {
      if (fromMap) { feedback.textContent = translate('Enter a five-digit ZIP code.'); mapZipInput.setAttribute('aria-invalid', 'true'); mapZipInput.focus(); }
      else { $('location-error').textContent = translate('Enter a five-digit ZIP, or choose skip.'); $('location-error').hidden = false; zipInput.setAttribute('aria-invalid', 'true'); zipInput.focus(); }
      return;
    }
    zipController?.abort();
    const controller = new AbortController(); zipController = controller;
    feedback.textContent = translate('Checking ZIP area…');
    $('location-count').textContent = translate('Checking ZIP area…');
    try {
      let location = null, lookupUnavailable = false;
      try { location = await lookupZip(zip, controller.signal); }
      catch (error) { if (error.name === 'AbortError') return; lookupUnavailable = true; }
      if (zipController !== controller) return;
      const changed = zip !== answers.currentZip;
      if (changed) {
        invalidate();
        answers.currentZip = zip; answers.disasterType = null;
        selectedListing = null; localListing = null;
      }
      currentLocation = location;
      zipInput.value = zip; mapZipInput.value = zip;
      const status = location ? `${location.label} · ${translate('approximate ZIP area')}` : translate(lookupUnavailable ? 'ZIP lookup is unavailable. Federal guidance remains available.' : 'ZIP area could not be resolved. Federal guidance remains available.');
      feedback.textContent = status; $('location-count').textContent = status;
      $('location-error').hidden = true; zipInput.setAttribute('aria-invalid', 'false'); mapZipInput.setAttribute('aria-invalid', 'false');
      if (location) loadResources(location); else keepMapAsExampleOnly();
      if (!fromMap || (changed && answers.danger === 'no')) step('disaster-step');
    } finally { if (zipController === controller) zipController = null; }
  }
  function renderPrivateReminders() {
    const reminders = { pregnant: 'Pregnancy in your household.', children: 'Children in your household.', olderAdults: 'Support related to older age.', disability: 'Disability or accessibility needs.', mobility: 'Help with moving around or leaving home.', medicalPower: 'Electricity needed for medical equipment.', transport: 'Transportation support.', pets: 'Pets or service animals to plan for.' };
    const items = Object.entries(reminders).filter(([key]) => profile?.[key] === 'yes').map(([, value]) => { const li = document.createElement('li'); li.textContent = translate(value); return li; });
    $('private-reminders').hidden = !items.length;
    $('private-reminders-list').replaceChildren(...items);
  }
  function renderReferrals() {
    const plan = window.getFloodReferrals(answers.need);
    $('referral-context').textContent = translate('Start with these official federal sites for your selected need:');
    $('referral-location-note').textContent = currentLocation ? `${translate('Current ZIP area')}: ${currentLocation.label}` : translate('Your ZIP area could not be confirmed. Federal guidance remains available.');
    $('referral-list').replaceChildren(...plan.resources.map(resource => {
      const li = document.createElement('li'), a = document.createElement('a'), p = document.createElement('p');
      a.href = resource.url; a.textContent = translate(resource.name); p.textContent = translate(resource.reason); li.append(a, p); return li;
    }));
  }
  function addMessage(role, content, actionIds = [], language = window.heroAccess.language) {
    const node = document.createElement('div'); node.className = `chat-message ${role}`; node.lang = language; node.dir = role === 'user' ? 'auto' : window.heroLanguageCopy.languages[language].dir;
    const label = document.createElement('strong'); label.textContent = role === 'assistant' ? 'HERO' : translate('You');
    const body = document.createElement('span'); body.textContent = content; node.append(label, body);
    if (role === 'assistant' && answers.need) {
      const actions = window.heroRecovery.getPlan(answers.need, language, { currentZip: answers.currentZip, placeLabel: currentLocation?.label, disasterType: answers.disasterType, localListing });
      for (const id of actionIds) {
        const action = actions.find(candidate => candidate.id === id); if (!action) continue;
        const a = document.createElement('a'); a.className = 'chat-action'; a.href = action.source.url; a.textContent = action.title; node.append(a);
      }
    }
    $('chat-log').append(node); $('chat-log').scrollTop = $('chat-log').scrollHeight;
  }
  async function askChat() {
    if (pending || messages.at(-1)?.role !== 'user') return;
    if (!navigator.onLine) { $('ai-state').textContent = translate('AI unavailable'); $('chat-status').textContent = translate('You are offline. Your recovery plan remains available.'); $('chat-retry').hidden = false; return; }
    pending = true; $('chat-send').disabled = true; $('chat-retry').hidden = true; $('ai-state').textContent = translate('Connecting');
    $('chat-status').textContent = translate('Finding a helpful next step…'); $('chat-log').setAttribute('aria-busy', 'true');
    const controller = new AbortController(); chatController = controller;
    const started = performance.now();
    const timeout = setTimeout(() => controller.abort(), 40000);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ answers, messages: messages.slice(-12), completedActionIds: answers.need ? recoveryUI.completed() : [], language: window.heroAccess.language, useProfile: Boolean(answers.need && $('use-profile').checked) }) });
      const data = await response.json();
      if (chatController !== controller) return;
      if (!response.ok || typeof data.reply !== 'string') throw new Error(data.error || 'AI unavailable.');
      messages.push({ role: 'assistant', content: data.reply }); addMessage('assistant', data.reply, data.actionIds || []);
      $('ai-state').textContent = translate(data.emergency ? 'Emergency guidance — AI was not contacted' : 'AI reply received');
      $('ai-state').dataset.responseMs = (performance.now() - started).toFixed(1);
      $('chat-status').textContent = '';
      if (data.emergency) {
        $('chat-emergency').hidden = false;
        messages = [];
      }
    } catch (error) {
      if (chatController === controller) { $('ai-state').textContent = translate('AI unavailable'); $('chat-status').textContent = translate(error.name === 'AbortError' ? 'AI timed out. Use the recovery plan and official links.' : error.message); $('chat-retry').hidden = false; }
    } finally {
      clearTimeout(timeout);
      if (chatController === controller) { chatController = null; pending = false; $('chat-send').disabled = false; $('chat-log').setAttribute('aria-busy', 'false'); }
    }
  }
  function beginResults(startAI = true) {
    const planStarted = performance.now();
    const urgent = answers.danger !== 'no';
    $('recovery-plan').hidden = false; $('chat-emergency').hidden = !urgent; $('chat-input').disabled = false;
    $('result-emergency').hidden = !urgent;
    $('recovery-progress-note').hidden = urgent;
    $('chat-panel').hidden = false; $('declaration-panel').hidden = urgent;
    $('summary-chat-continue').hidden = urgent;
    $('chat-input').disabled = false; $('chat-send').disabled = false; $('chat-clear').disabled = false;
    const firstConversation = messages.length === 0;
    if (firstConversation) $('ai-state').textContent = translate('Not checked');
    if (firstConversation && !urgent) messages = [{ role: 'user', content: 'Please explain my approved recovery plan and ask one useful follow-up question if needed.' }];
    $('chat-status').textContent = ''; $('chat-retry').hidden = true;
    $('summary-text').textContent = `${translate('Current ZIP area')}: ${currentLocation?.label || answers.currentZip || translate('Not provided')}. ${translate('Disaster type')}: ${translate(disasterNames[answers.disasterType])}. ${translate('Help requested')}: ${translate(answers.need)}.`;
    if (resourceResult?.location?.zip === answers.currentZip) localListing = (answers.need === 'A place to stay' ? resourceResult.pins.find(pin => pin.kind === 'shelter') : null) || resourceResult.pins.find(pin => pin.kind === 'center') || null;
    else if (currentLocation && !mapController) loadResources(currentLocation);
    renderReferrals(); renderPrivateReminders(); recoveryUI.setContext(); if (urgent) clearContext(); else storeContext(); step('summary-step');
    requestAnimationFrame(() => { $('recovery-plan').dataset.readyMs = (performance.now() - planStarted).toFixed(1); });
    if (startAI && !urgent && firstConversation) askChat();
  }
  function renderDeclarations(result) {
    const records = Array.isArray(result.records) ? result.records : [];
    $('declaration-status').textContent = translate(result.status === 'checked' ? `FEMA returned ${records.length} recent declaration records for the confirmed county. This is not an eligibility determination.` : 'Declaration status unknown. Use the official FEMA source to confirm details.');
    $('declaration-checked').textContent = result.checkedAt ? `${translate('Last successful FEMA check')}: ${new Date(result.checkedAt).toLocaleString()}` : '';
    $('declaration-list').replaceChildren(...records.map(record => {
      const li = document.createElement('li'), h = document.createElement('h4'), a = document.createElement('a'), p = document.createElement('p');
      a.href = record.url; a.textContent = `${record.declarationType}-${record.disasterNumber}: ${record.title}`;
      p.textContent = `${translate('Designated area')}: ${record.area}. ${translate('Incident type')}: ${record.incidentType}. ${translate('Declared')}: ${record.declarationDate?.slice(0, 10) || '?'}.`;
      h.append(a); li.append(h, p); return li;
    }));
  }
  async function refreshProfile() {
    try {
      const response = await fetch('/api/profile', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const nextOwner = data.user ? `account:${data.user.username}` : 'guest';
      if (loadedOwner && nextOwner !== owner) reset();
      owner = nextOwner; loadedOwner = true; profile = data.profile;
      $('account-nav').textContent = translate(data.user ? 'Account' : 'Sign in');
      $('saved-home-choice').hidden = !profile?.homeZip;
      $('saved-home-text').textContent = profile?.homeZip ? `${translate('Saved home ZIP')}: ${profile.homeZip}. ${translate('Use only if you are there now.')}` : '';
      $('household-context-choice').hidden = !profile;
      $('household-context-summary').textContent = profile ? `${translate('Saved home ZIP')}: ${profile.homeZip || translate('Not provided')}. ${translate('Household size')}: ${profile.householdSize === 'unspecified' ? translate('Not provided') : profile.householdSize}.` : '';
      if (!profile) $('use-profile').checked = false;
      if (!answers.need) {
        let saved; try { saved = JSON.parse(sessionStorage.getItem('hero-help-context-v2')); } catch { /* No session. */ }
        if (saved?.version === 2 && saved.owner === owner && saved.answers?.danger === 'no' && needs.has(saved.answers.need) && disasters.has(saved.answers.disasterType) && (saved.answers.currentZip === null || validZip(saved.answers.currentZip))) {
          Object.assign(answers, saved.answers); zipInput.value = answers.currentZip || ''; mapZipInput.value = zipInput.value;
          if (answers.currentZip) {
            currentLocation = await lookupZip(answers.currentZip);
            if (currentLocation) await loadResources(currentLocation);
            else keepMapAsExampleOnly();
          }
          beginResults(false);
        } else clearContext();
      } else { renderPrivateReminders(); recoveryUI.setContext(); }
    } catch {
      $('profile-load-note').textContent = translate('Your saved profile could not be loaded. You can still find help with today’s answers.'); $('profile-load-note').hidden = false;
    }
  }
  flow.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.danger) {
      invalidate(); answers.danger = button.dataset.danger;
      if (answers.danger !== 'no') messages = [];
      $('chat-panel').hidden = false;
      $('chat-emergency').hidden = answers.danger === 'no';
      if (answers.currentZip && zipInput.value.trim() !== answers.currentZip) { answers.currentZip = null; currentLocation = null; keepMapAsExampleOnly(); }
      if (answers.danger === 'no') {
        if (currentLocation) loadResources(currentLocation);
        else if (!resourceResult) loadResources(null);
      }
      step(answers.danger === 'no' ? (answers.currentZip ? 'disaster-step' : 'location-step') : 'emergency-step');
    } else if (button.id === 'use-home-zip' && profile?.homeZip) { zipInput.value = profile.homeZip; mapZipInput.value = zipInput.value; zipInput.focus(); }
    else if (button.id === 'skip-location') { invalidate(); answers.currentZip = null; currentLocation = null; mapZipInput.value = ''; $('map-zip-feedback').textContent = ''; $('location-error').hidden = true; keepMapAsExampleOnly(); step('disaster-step'); }
    else if (button.dataset.disaster && disasters.has(button.dataset.disaster)) { invalidate(); answers.disasterType = button.dataset.disaster; step('need-step'); }
    else if (button.dataset.need && needs.has(button.dataset.need)) { if (answers.need && answers.need !== button.dataset.need) invalidate(); answers.need = button.dataset.need; beginResults(); }
    else if (button.dataset.back) { chatController?.abort(); step(button.dataset.back); }
    else if (button.hasAttribute('data-emergency-continue')) step(answers.currentZip ? 'disaster-step' : 'location-step');
    else if (button.hasAttribute('data-restart')) reset();
    else if (button.hasAttribute('data-continue-chat')) { $('chat-panel').scrollIntoView({ block: 'start' }); $('chat-input').focus({ preventScroll: true }); }
  });
  $('location-form').addEventListener('submit', event => { event.preventDefault(); resolveCurrentZip(zipInput.value.trim(), false); });
  $('map-zip-form').addEventListener('submit', event => { event.preventDefault(); resolveCurrentZip(mapZipInput.value.trim(), true); });
  zipInput.addEventListener('input', () => { zipController?.abort(); zipController = null; mapZipInput.value = zipInput.value; $('location-count').textContent = ''; $('map-zip-feedback').textContent = ''; mapZipInput.setAttribute('aria-invalid', 'false'); });
  mapZipInput.addEventListener('input', () => { zipController?.abort(); zipController = null; zipInput.value = mapZipInput.value; $('map-zip-feedback').textContent = ''; $('location-count').textContent = ''; mapZipInput.setAttribute('aria-invalid', 'false'); });
  damageInput.addEventListener('input', async () => {
    damageController?.abort(); const controller = new AbortController(); damageController = controller; const request = ++damageRequest;
    damageLocation = null; countySelect.replaceChildren(new Option(translate('Enter a damage ZIP first'), '')); countySelect.disabled = true;
    $('damage-count').textContent = ''; $('declaration-status').textContent = translate('Declaration status unknown. Confirm a damage ZIP and county.'); $('declaration-list').replaceChildren(); recoveryUI.changed();
    const zip = damageInput.value.trim(); if (!validZip(zip)) return;
    $('damage-count').textContent = translate('Checking county candidates…');
    try {
      const location = await lookupZip(zip, controller.signal); if (request !== damageRequest) return;
      damageLocation = location;
      if (!location?.counties?.length) { $('damage-count').textContent = translate('No Census county candidates are available for this ZIP. Declaration status remains unknown.'); return; }
      countySelect.replaceChildren(new Option(translate('Choose the county where damage occurred'), ''), ...location.counties.map(county => new Option(county.name, county.fips)));
      countySelect.disabled = false;
      $('damage-count').textContent = `${location.label}: ${location.counties.length} ${translate('county candidates. Select the correct one.')}`;
    } catch { if (request === damageRequest) $('damage-count').textContent = translate('County lookup unavailable. Declaration status remains unknown.'); }
  });
  $('damage-locality-form').addEventListener('submit', async event => {
    event.preventDefault(); const countyFips = countySelect.value;
    if (answers.danger !== 'no' || !damageLocation || !damageLocation.counties.some(county => county.fips === countyFips)) { $('damage-error').textContent = translate('Enter a damage ZIP and confirm its county first.'); $('damage-error').hidden = false; return; }
    $('damage-error').hidden = true; $('check-declarations').disabled = true; $('declaration-status').textContent = translate('Checking FEMA records…');
    try {
      const response = await fetch('/api/declarations', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-HERO-Declarations': '1' }, body: JSON.stringify({ danger: answers.danger, damageZip: damageLocation.zip, countyFips }), signal: AbortSignal.timeout(12000) });
      const result = await response.json(); if (!response.ok) throw new Error(); renderDeclarations(result); recoveryUI.changed();
    } catch { renderDeclarations({ status: 'unknown', records: [] }); }
    finally { $('check-declarations').disabled = false; }
  });
  $('chat-form').addEventListener('submit', event => { event.preventDefault(); const question = $('chat-input').value.trim(); if (!question || pending) return; messages.push({ role: 'user', content: question }); addMessage('user', question); $('chat-input').value = ''; askChat(); });
  document.querySelector('#chat-emergency [data-restart]').addEventListener('click', reset);
  $('chat-retry').addEventListener('click', askChat);
  $('chat-clear').addEventListener('click', () => { chatController?.abort(); chatController = null; pending = false; messages = []; $('chat-log').replaceChildren(); $('chat-input').value = ''; $('chat-input').disabled = false; $('chat-send').disabled = false; $('chat-log').setAttribute('aria-busy', 'false'); $('ai-state').textContent = translate('Not checked'); $('chat-status').textContent = ''; $('chat-retry').hidden = true; $('chat-input').focus(); });
  window.addEventListener('hero-language-change', () => { if (resourceResult) renderResourceList(); if (answers.need) { $('summary-text').textContent = `${translate('Current ZIP area')}: ${currentLocation?.label || answers.currentZip || translate('Not provided')}. ${translate('Disaster type')}: ${translate(disasterNames[answers.disasterType])}. ${translate('Help requested')}: ${translate(answers.need)}.`; } });
  step('danger-step', false); loadResources(null); refreshProfile();
  window.addEventListener('pageshow', () => { if (loadedOwner) refreshProfile(); });
})();
