(() => {
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Settings can still work for this page. */ } };
  const copy = window.heroLanguageCopy;
  const welcomeKey = 'hero-language-welcome-v2';
  const savedLanguage = read('hero-language');
  let needsWelcome = read(welcomeKey) !== 'chosen' || !Object.hasOwn(copy.languages, savedLanguage);
  let language = needsWelcome ? 'en' : copy.normalizeLanguage(savedLanguage);
  let confirmedLanguage = language;
  if (needsWelcome) document.documentElement.classList.add('language-welcome-pending');
  document.documentElement.lang = language;
  document.documentElement.dir = copy.languages[language].dir;
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const excluded = 'script, style, noscript, textarea, [data-original-language], #chat-log, #declaration-list, #google-button, #language-choice';
  let observer;
  const originalTitle = document.title;
  let publicFallback = false;
  function sourceValue(map, object, current) {
    const previous = map.get(object);
    const original = previous && current === previous.rendered ? previous.original : current;
    const rendered = copy.translate(original, language);
    map.set(object, { original, rendered });
    return rendered;
  }
  function applyLanguage() {
    observer?.disconnect();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || node.parentElement.closest(excluded) || !node.data.trim()) continue;
      const rendered = sourceValue(textSources, node, node.data);
      if (node.data !== rendered) node.data = rendered;
    }
    for (const element of document.querySelectorAll('[aria-label], [placeholder], [title]')) {
      if (element.closest('script, style, [data-original-language], #google-button, #language-choice')) continue;
      let sources = attributeSources.get(element);
      if (!sources) { sources = new Map(); attributeSources.set(element, sources); }
      for (const name of ['aria-label', 'placeholder', 'title']) {
        const current = element.getAttribute(name); if (current === null) continue;
        const previous = sources.get(name);
        const original = previous && current === previous.rendered ? previous.original : current;
        const rendered = copy.translate(original, language);
        sources.set(name, { original, rendered });
        if (current !== rendered) element.setAttribute(name, rendered);
      }
    }
    document.title = copy.translate(originalTitle, language);
    observer?.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'placeholder', 'title'] });
  }
  window.heroAccess = {
    get language() { return language; },
    translate: text => copy.translate(text, language),
    translateExport: text => text.split('\n').map(line => copy.translate(line, language)).join('\n')
  };
  document.addEventListener('DOMContentLoaded', () => {
    const languageChoice = document.getElementById('language-choice');
    languageChoice.value = language;
    const welcome = document.createElement('dialog');
    welcome.className = 'language-welcome';
    welcome.id = 'language-welcome';
    welcome.lang = 'en'; welcome.dir = 'ltr';
    welcome.setAttribute('data-original-language', '');
    welcome.setAttribute('aria-labelledby', 'language-welcome-title');
    // Public fixed copy only; no questionnaire, profile or conversation content.
    welcome.innerHTML = `<div class="language-welcome-top"><div class="language-welcome-brand"><span aria-hidden="true"><img src="./assets/hero-shield.svg" width="38" height="38" alt="" decoding="async" /></span> HERO</div><a class="language-welcome-emergency" href="tel:911">Call 911 ↗</a></div>
      <h2 id="language-welcome-title">Choose your language</h2>
      <p class="language-welcome-intro">Select the language you’re most comfortable with, then press Confirm.</p>
      <div class="language-welcome-options"></div>
      <div class="language-welcome-confirmation"><p id="language-selection-status" class="language-welcome-selection" role="status" aria-live="polite"></p><button id="language-welcome-confirm" class="primary-button" type="button" disabled>Confirm</button></div>
      <p class="language-welcome-note">You can change your language anytime using the menu at the top of the page.</p>`;
    const invitations = {
      en: 'Select English', es: 'Elegir español', ar: 'اختيار العربية',
      'zh-Hans': '选择简体中文', ko: '한국어 선택', vi: 'Chọn tiếng Việt', tl: 'Piliin ang Tagalog', fr: 'Choisir le français'
    };
    const confirm = welcome.querySelector('#language-welcome-confirm');
    const selectionStatus = welcome.querySelector('#language-selection-status');
    let pendingLanguage = null;
    const buttons = [];
    for (const [code, locale] of Object.entries(copy.languages)) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'language-welcome-option';
      if (code === 'en') button.autofocus = true;
      button.lang = code; button.dir = locale.dir; button.dataset.language = code;
      const name = document.createElement('strong'); name.textContent = locale.nativeName;
      const invitation = document.createElement('span'); invitation.textContent = invitations[code];
      button.append(name, invitation);
      if (locale.dir === 'rtl') {
        const explanation = document.createElement('small'); explanation.className = 'language-direction-note';
        button.append(explanation);
      }
      button.addEventListener('click', () => { pendingLanguage = code; previewLanguage(code); updateSelection(); });
      buttons.push(button); welcome.querySelector('.language-welcome-options').append(button);
    }
    document.body.append(welcome);
    const reopen = document.createElement('button');
    reopen.type = 'button'; reopen.id = 'language-welcome-open'; reopen.className = 'text-button language-welcome-open';
    reopen.setAttribute('aria-haspopup', needsWelcome ? 'dialog' : 'listbox');
    reopen.setAttribute('aria-controls', needsWelcome ? welcome.id : languageChoice.id);
    reopen.textContent = 'Choose language';
    languageChoice.closest('.access-controls-inner').append(reopen);
    let returnFocus = null;
    function updateSelection() {
      const t = text => copy.translate(text, language);
      welcome.lang = language; welcome.dir = copy.languages[language].dir;
      welcome.querySelector('#language-welcome-title').textContent = t('Choose your language');
      welcome.querySelector('.language-welcome-intro').textContent = t('Select the language you’re most comfortable with, then press Confirm.');
      welcome.querySelector('.language-welcome-note').textContent = t('You can change your language anytime using the menu at the top of the page.');
      welcome.querySelector('.language-welcome-emergency').textContent = t('Call 911 ↗');
      for (const note of welcome.querySelectorAll('.language-direction-note')) {
        note.lang = language; note.dir = copy.languages[language].dir;
        note.textContent = t('Reads right to left');
      }
      for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.language === pendingLanguage));
      confirm.disabled = pendingLanguage === null;
      confirm.textContent = t('Confirm');
      selectionStatus.replaceChildren();
      if (pendingLanguage) {
        const locale = copy.languages[pendingLanguage];
        selectionStatus.append(document.createTextNode(t('Selected language:') + ' '));
        const name = document.createElement('span'); name.lang = pendingLanguage; name.dir = locale.dir;
        name.textContent = locale.nativeName; selectionStatus.append(name);
      } else selectionStatus.textContent = t('Choose a language to enable Confirm.');
    }
    function openWelcome(preselection) {
      returnFocus = document.activeElement;
      pendingLanguage = typeof preselection === 'string' ? copy.normalizeLanguage(preselection) : needsWelcome ? null : language;
      if (pendingLanguage) previewLanguage(pendingLanguage);
      updateSelection();
      welcome.showModal();
    }
    function previewLanguage(code) {
      language = copy.normalizeLanguage(code);
      languageChoice.value = language;
      document.documentElement.lang = language;
      document.documentElement.dir = copy.languages[language].dir;
      applyLanguage(); window.dispatchEvent(new Event('hero-language-change'));
    }
    function selectLanguage(code) {
      if (language !== code) previewLanguage(code);
      confirmedLanguage = language;
      write('hero-language', language); write(welcomeKey, 'chosen');
      needsWelcome = false;
      document.documentElement.classList.remove('language-welcome-pending');
      reopen.setAttribute('aria-haspopup', 'listbox');
      reopen.setAttribute('aria-controls', languageChoice.id);
    }
    reopen.addEventListener('click', () => {
      if (needsWelcome) { openWelcome(); return; }
      languageChoice.focus();
      try { languageChoice.showPicker?.(); } catch { /* The focused select remains usable. */ }
    });
    confirm.addEventListener('click', () => {
      if (!pendingLanguage) return;
      selectLanguage(pendingLanguage); welcome.close();
    });
    welcome.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...welcome.querySelectorAll('a[href], button:not(:disabled)')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    // A first visit requires explicit confirmation; reopening can be cancelled without changing the saved choice.
    welcome.addEventListener('cancel', event => {
      event.preventDefault();
      if (!needsWelcome) { previewLanguage(confirmedLanguage); welcome.close(); }
      else { selectionStatus.textContent = copy.translate('Press Confirm to enter HERO.', language); confirm.disabled ? buttons[0].focus() : confirm.focus(); }
    });
    welcome.addEventListener('close', () => {
      const target = returnFocus && returnFocus !== document.body ? returnFocus : document.getElementById('main');
      target?.focus({ preventScroll: true });
    });
    function connectionNotice() {
      document.getElementById('connection-notice').hidden = navigator.onLine && !publicFallback;
      applyLanguage();
    }
    languageChoice.addEventListener('change', () => {
      const selected = languageChoice.value;
      if (needsWelcome) { languageChoice.value = language; openWelcome(selected); }
      else selectLanguage(selected);
    });
    // Only known interface copy is translated; input values, names, chat and FEMA records stay intact.
    observer = new MutationObserver(applyLanguage);
    connectionNotice();
    if (needsWelcome) openWelcome();
    window.addEventListener('online', connectionNotice); window.addEventListener('offline', connectionNotice);
    // Keyboard scroll access to bounded result lists and chat; source controls keep their focus.
    for (const id of ['declaration-list', 'chat-log']) {
      const area = document.getElementById(id); if (area) area.tabIndex = 0;
    }
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'hero-public-status') { publicFallback = event.data.fallback === true; connectionNotice(); }
      });
      const requestStatus = () => navigator.serviceWorker.controller?.postMessage({ type: 'hero-public-status' });
      navigator.serviceWorker.addEventListener('controllerchange', requestStatus); requestStatus();
      navigator.serviceWorker.register('/sw.js').catch(() => { /* Ordinary online pages remain usable. */ });
    }
  });
})();
