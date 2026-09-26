(() => {
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Settings can still work for this page. */ } };
  let language = read('hero-language') === 'es' ? 'es' : 'en';
  document.documentElement.lang = language;
  const copy = window.heroLanguageCopy;
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const excluded = 'script, style, noscript, textarea, [data-original-language], #chat-log, #declaration-list, #google-button, #language-choice';
  let observer;
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
      if (element.closest('script, style, #google-button, #language-choice')) continue;
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
    document.title = copy.translate(document.title.replace('Guía de inundaciones de Virginia', 'Virginia Flood Guide').replace('Prepararse —', 'Plan ahead —').replace('Su cuenta —', 'Your account —'), language);
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
    function connectionNotice() {
      document.getElementById('connection-notice').hidden = navigator.onLine && !publicFallback;
      applyLanguage();
    }
    languageChoice.addEventListener('change', () => {
      language = languageChoice.value === 'es' ? 'es' : 'en';
      document.documentElement.lang = language; write('hero-language', language);
      applyLanguage(); window.dispatchEvent(new Event('hero-language-change'));
    });
    // Only known interface copy is translated; input values, names, chat and FEMA records stay intact.
    observer = new MutationObserver(applyLanguage);
    connectionNotice();
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
