(() => {
  const catalog = window.heroRecovery;
  const key = 'hero-recovery-progress-v2';
  const $ = id => document.getElementById(id);
  const labels = {
    en: { first: 'Your first step', next: 'Your next step', complete: 'Your recorded steps are complete', completeDetail: 'Review your questions or prepare a summary for a helper. Agencies confirm the outcome of any assistance request.', why: 'Why this step', done: 'Done', todo: 'To do', reviewed: 'Guidance reviewed', progress: (n, total) => `${n} of ${total} recovery actions marked complete by you.`, home: 'Include saved home ZIP', size: 'Include saved household size', missing: 'Not provided', selected: 'Text selected. Use your device’s copy command.', downloaded: 'Download requested. If it does not appear, use the text preview. Keep your copy private.', print: 'Print dialog requested. Choose Save as PDF or a printer. The reviewed text remains available below.' },
    es: { first: 'Su primer paso', next: 'Su siguiente paso', complete: 'Ha marcado todos los pasos como completados', completeDetail: 'Revise sus preguntas o prepare un resumen para una persona que le ayude. Las agencias confirman el resultado de las solicitudes de ayuda.', why: 'Por qué este paso', done: 'Hecho', todo: 'Pendiente', reviewed: 'Guía revisada', progress: (n, total) => `${n} de ${total} acciones de recuperación marcadas como completadas por usted.`, home: 'Incluir el ZIP del hogar guardado', size: 'Incluir el número de personas del hogar guardado', missing: 'No indicado', selected: 'Texto seleccionado. Use el comando de copiar de su dispositivo.', downloaded: 'Se solicitó la descarga. Si no aparece, use la vista previa del texto. Guarde la copia en privado.', print: 'Se solicitó el diálogo de impresión. Elija Guardar como PDF o una impresora. El texto revisado sigue disponible abajo.' }
  };
  window.createRecoveryUI = ({ getContext }) => {
    let current = null;
    let completed = [];
    let helperDirty = false;
    let selectionNeedsReview = false;
    const lang = () => window.heroAccess.language;
    const t = () => labels[lang()] || { ...Object.fromEntries(Object.entries(labels.en).filter(([,value])=>typeof value === 'string').map(([key,value])=>[key,window.heroAccess.translate(value)])), progress: (n,total) => window.heroAccess.translate(`${n} of ${total} recovery actions marked complete by you.`) };
    function snapshot(summary = false) {
      const context = getContext();
      const body = catalog.textSnapshot({
        need: context.answers.need, currentZip: context.answers.currentZip, placeLabel: context.currentLocation?.label, disasterType: context.answers.disasterType,
        currentLocality: context.answers.locality, damageZip: context.damageZip, damageLocality: context.damageLocality,
        localListing: context.localListing || null, selectedListing: context.selectedListing || null, completedActionIds: completed,
        language: lang(), summary, questions: summary ? $('helper-questions').value : '',
        homeZip: summary && $('helper-include-home').checked ? context.profile?.homeZip : null,
        homeLocality: summary && $('helper-include-home').checked ? context.profile?.homeLocality : null,
        householdSize: summary && $('helper-include-size').checked ? context.profile?.householdSize : null
      });
      return context.answers.danger === 'no' ? body : `${window.heroAccess.translate('If you are in danger, seriously injured, or unsure whether you need emergency help, call 911. This guide cannot assess an emergency or contact responders for you.')}\n\n${body}`;
    }
    function persist() {
      const { owner, answers } = getContext();
      const record = catalog.progressRecord(owner, answers, completed, { currentZip: answers.currentZip, placeLabel: getContext().currentLocation?.label, disasterType: answers.disasterType, localListing: getContext().localListing });
      try { if (record) sessionStorage.setItem(key, JSON.stringify(record)); } catch { /* Page progress still works. */ }
    }
    function reset() {
      current = null; completed = []; helperDirty = false;
      selectionNeedsReview = false;
      try { sessionStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
      $('helper-panel').hidden = true; $('helper-open').setAttribute('aria-expanded', 'false');
      for (const id of ['helper-preview', 'helper-questions', 'recovery-text', 'recovery-print-text']) {
        if ('value' in $(id)) $(id).value = ''; else $(id).textContent = '';
      }
      $('helper-include-home').checked = false; $('helper-include-size').checked = false;
      $('helper-change-notice').hidden = true;
      $('helper-export-status').textContent = ''; $('recovery-export-status').textContent = '';
      $('helper-download').disabled = false; $('helper-print').disabled = false; $('helper-select').disabled = false;
    }
    function setContext() {
      const { owner, answers } = getContext();
      if (!answers.need) { reset(); return; }
      const next = JSON.stringify([owner, answers.need, answers.currentZip ?? answers.locality, answers.disasterType || null]);
      if (current !== next) {
        // Restore only after the server has identified the current guest/account.
        let record; try { record = JSON.parse(sessionStorage.getItem(key)); } catch { /* No saved progress. */ }
        if (current !== null) reset();
        completed = catalog.restoreProgress(record, owner, answers, { currentZip: answers.currentZip, placeLabel: getContext().currentLocation?.label, disasterType: answers.disasterType, localListing: getContext().localListing });
        current = next;
      }
      persist(); render(); profileOptions();
    }
    function profileOptions() {
      const profile = getContext().profile;
      const hasHome = Boolean(profile?.homeZip);
      const hasSize = Boolean(profile?.householdSize && profile.householdSize !== 'unspecified');
      const selectedDetailRemoved = (!hasHome && $('helper-include-home').checked) || (!hasSize && $('helper-include-size').checked);
      $('helper-profile-options').hidden = !hasHome && !hasSize;
      $('helper-include-home').disabled = !hasHome; $('helper-include-size').disabled = !hasSize;
      if (!hasHome) $('helper-include-home').checked = false;
      if (!hasSize) $('helper-include-size').checked = false;
      $('helper-home-label').textContent = `${t().home}: ${profile?.homeZip || t().missing}`;
      $('helper-size-label').textContent = `${t().size}: ${hasSize ? profile.householdSize : t().missing}`;
      if (selectedDetailRemoved && !$('helper-panel').hidden) {
        selectionNeedsReview = true;
        $('helper-change-notice').hidden = false;
        $('helper-download').disabled = true; $('helper-print').disabled = true; $('helper-select').disabled = true;
        $('helper-export-status').textContent = window.heroAccess.translate('Rebuild the summary to apply your household-detail selections before exporting.');
      }
    }
    function node(tag, text, className) {
      const element = document.createElement(tag); element.textContent = text;
      if (className) element.className = className;
      return element;
    }
    function actionRow(action) {
      const item = document.createElement('li'); item.className = 'recovery-action';
      const label = document.createElement('label'); label.className = 'checklist-label';
      const input = document.createElement('input'); input.type = 'checkbox'; input.dataset.recoveryAction = action.id;
      input.checked = completed.includes(action.id);
      label.append(input, node('strong', action.title), node('span', input.checked ? t().done : t().todo, 'checklist-state'));
      const link = node('a', action.source.name); link.href = action.source.url;
      item.append(label, node('p', action.detail), link, node('p', `${t().reviewed}: ${action.reviewedAt}`, 'location-count'));
      return item;
    }
    function render() {
      if (!current) return;
      const context = getContext();
      const actions = catalog.getPlan(context.answers.need, lang(), { currentZip: context.answers.currentZip, placeLabel: context.currentLocation?.label, disasterType: context.answers.disasterType, localListing: context.localListing });
      const next = actions.find(a => !completed.includes(a.id));
      const first = $('recovery-first'); first.replaceChildren();
      first.append(node('p', completed.length ? t().next : t().first, 'eyebrow'));
      first.append(node('h3', next?.title || t().complete));
      first.append(node('p', next?.detail || t().completeDetail));
      if (next) {
        const link = node('a', next.source.name, 'primary-button'); link.href = next.source.url; first.append(link);
      }
      $('recovery-progress').textContent = t().progress(completed.length, actions.length);
      $('recovery-next').replaceChildren(...actions.filter(a => a.stage === 'next').map(actionRow));
      $('recovery-prepare').replaceChildren(...actions.filter(a => a.stage === 'prepare').map(actionRow));
      $('recovery-text').value = snapshot();
      $('recovery-text').lang = lang();
      $('recovery-text').dir = window.heroLanguageCopy.languages[lang()].dir;
    }
    function changed() {
      if (!current) return;
      render(); profileOptions();
      if (!$('helper-panel').hidden) $('helper-change-notice').hidden = false;
    }
    function rebuild() {
      $('helper-preview').value = snapshot(true); $('helper-preview').lang = lang();
      $('helper-preview').dir = window.heroLanguageCopy.languages[lang()].dir;
      helperDirty = false; $('helper-change-notice').hidden = true; $('helper-export-status').textContent = '';
      selectionNeedsReview = false;
      $('helper-download').disabled = false; $('helper-print').disabled = false; $('helper-select').disabled = false;
    }
    function download(text, name, status) {
      const started = performance.now();
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = name;
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      $(status).textContent = t().downloaded;
      $(status).dataset.exportMs = (performance.now() - started).toFixed(1);
    }
    function print(text, status) {
      $('recovery-print-text').textContent = text;
      $('recovery-print-text').dir = status === 'helper-export-status' ? $('helper-preview').dir : window.heroLanguageCopy.languages[lang()].dir;
      $('recovery-print-text').lang = status === 'helper-export-status' ? $('helper-preview').lang : lang();
      document.body.dataset.recoveryPrinting = 'true';
      window.print();
      $(status).textContent = t().print;
    }
    window.addEventListener('afterprint', () => { delete document.body.dataset.recoveryPrinting; $('recovery-print-text').textContent = ''; });
    $('recovery-plan').addEventListener('change', event => {
      const id = event.target.dataset.recoveryAction; if (!id || !current) return;
      const context = getContext();
      completed = catalog.normalizeCompleted(context.answers.need, event.target.checked ? [...completed, id] : completed.filter(value => value !== id), { currentZip: context.answers.currentZip, placeLabel: context.currentLocation?.label, disasterType: context.answers.disasterType, localListing: context.localListing });
      persist(); changed();
      document.querySelector(`[data-recovery-action="${id}"]`)?.focus({ preventScroll: true });
    });
    $('helper-open').addEventListener('click', () => {
      if (!current) return;
      profileOptions();
      if (!$('helper-preview').value) rebuild();
      $('helper-panel').hidden = false; $('helper-open').setAttribute('aria-expanded', 'true');
      $('helper-heading').focus();
    });
    $('helper-preview').addEventListener('input', () => { helperDirty = true; });
    for (const id of ['helper-include-home', 'helper-include-size', 'helper-questions']) $(id).addEventListener('input', () => {
      if (!helperDirty) rebuild(); else {
        $('helper-change-notice').hidden = false;
        if (id !== 'helper-questions') {
          selectionNeedsReview = true;
          $('helper-download').disabled = true; $('helper-print').disabled = true; $('helper-select').disabled = true;
          $('helper-export-status').textContent = window.heroAccess.translate('Rebuild the summary to apply your household-detail selections before exporting.');
        }
      }
    });
    $('helper-rebuild').addEventListener('click', rebuild);
    $('recovery-download').addEventListener('click', () => { $('recovery-text-fallback').open = true; download(snapshot(), `hero-recovery-plan-${lang()}.txt`, 'recovery-export-status'); });
    $('helper-download').addEventListener('click', () => { if (!selectionNeedsReview) download($('helper-preview').value, `hero-helper-summary-${$('helper-preview').lang || lang()}.txt`, 'helper-export-status'); });
    $('recovery-print-button').addEventListener('click', () => print(snapshot(), 'recovery-export-status'));
    $('helper-print').addEventListener('click', () => { if (!selectionNeedsReview) print($('helper-preview').value, 'helper-export-status'); });
    for (const [button, field, status] of [['recovery-select', 'recovery-text', 'recovery-export-status'], ['helper-select', 'helper-preview', 'helper-export-status']]) $(button).addEventListener('click', () => {
      $(field).focus(); $(field).select(); $(status).textContent = t().selected;
    });
    window.addEventListener('hero-language-change', () => { changed(); if (!$('helper-panel').hidden && !helperDirty) rebuild(); });
    return { setContext, reset, changed, completed: () => [...completed] };
  };
})();
