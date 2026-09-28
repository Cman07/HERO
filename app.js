      (() => {
        const flow = document.getElementById('help-questions');
        const reveal = document.getElementById('help-reveal');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let openingAnimation = null;
        let openingScrollFrame = null;
        const start = document.getElementById('start-help');
        const search = document.getElementById('locality-search');
        const localityList = document.getElementById('current-locality-list');
        const localitySelect = document.getElementById('current-locality');
        const localityCount = document.getElementById('location-count');
        const localities = Array.isArray(window.VIRGINIA_LOCALITIES) ? window.VIRGINIA_LOCALITIES : [];
        const error = document.getElementById('location-error');
        const chatLog = document.getElementById('chat-log');
        const chatStatus = document.getElementById('chat-status');
        const chatForm = document.getElementById('chat-form');
        const chatRetry = document.getElementById('chat-retry');
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const answers = { danger: null, locality: null, need: null };
        let messages = [];
        let pending = false;
        let requestController = null;
        let profile = null;
        let profileIdentity;
        let contextRestored = false;
        let intakeStartedAt = null;
        const recoveryUI = window.createRecoveryUI({ getContext: () => ({
          owner: profileIdentity || null, answers,
          damageLocality: localities.includes(damageSelect.value) ? damageSelect.value : null,
          profile: profile ? { homeLocality: profile.homeLocality, householdSize: profile.householdSize } : null
        }) });
        function saveHelpContext() {
          contextRestored = true;
          try { sessionStorage.setItem('hero-help-context', JSON.stringify({ owner: profileIdentity || 'guest', answers: { ...answers } })); }
          catch { /* Current-page answers still accompany every chat request. */ }
        }
        function restoreHelpContext(owner) {
          if (contextRestored) return;
          contextRestored = true;
          try {
            const savedContext = JSON.parse(sessionStorage.getItem('hero-help-context'));
            const previous = savedContext?.answers;
            const needs = [...document.querySelectorAll('[data-need]')].map(button => button.dataset.need);
            if (savedContext?.owner !== owner || previous?.danger !== 'no' || !needs.includes(previous.need) || (previous.locality !== null && !localities.includes(previous.locality))) {
              sessionStorage.removeItem('hero-help-context'); return;
            }
            Object.assign(answers, { danger: 'no', locality: previous.locality, need: previous.need });
            chooseLocality(previous.locality);
            beginChat(false);
          } catch { /* Missing or unavailable session storage leaves a fresh questionnaire. */ }
        }
        async function refreshSavedHome() {
          const note = document.getElementById('profile-load-note');
          profile = null;
          document.getElementById('saved-home-choice').hidden = true;
          document.getElementById('household-context-choice').hidden = true;
          document.getElementById('private-reminders').hidden = true;
          document.getElementById('private-reminders-list').replaceChildren();
          try {
            const response = await fetch('/api/profile', { signal: AbortSignal.timeout(5000) });
            if (!response.ok) throw new Error();
            const data = await response.json();
            const nextIdentity = data.user ? 'account:' + data.user.username : 'guest';
            if (profileIdentity !== undefined && profileIdentity !== nextIdentity) reset();
            profileIdentity = nextIdentity;
            if (contextRestored && answers.danger === 'no' && answers.need) saveHelpContext();
            profile = data.profile;
            document.getElementById('account-nav').textContent = data.user ? 'Account' : 'Sign in';
            note.hidden = true;
          } catch {
            profile = null;
            note.textContent = 'Your saved profile could not be loaded. You can still find help with today’s answers.';
            note.hidden = false;
          }
          document.getElementById('saved-home-choice').hidden = !profile?.homeLocality;
          document.getElementById('saved-home-text').textContent = profile?.homeLocality ? 'Your saved home locality is ' + profile.homeLocality + '. Use it only if you are there now.' : '';
          document.getElementById('household-context-choice').hidden = !profile;
          document.getElementById('household-context-summary').textContent = profile ? 'Saved home: ' + (profile.homeLocality || 'not provided') + '. Household size: ' + (profile.householdSize === 'unspecified' ? 'not provided' : profile.householdSize) + '.' : '';
          if (!profile) document.getElementById('use-profile').checked = false;
          if (profileIdentity !== undefined) restoreHelpContext(profileIdentity);
          if (!document.getElementById('summary-step').hidden) { renderPrivateReminders(); recoveryUI.setContext(); }
        }
        window.addEventListener('pageshow', refreshSavedHome);
        window.addEventListener('focus', refreshSavedHome);
        const damageSearch = document.getElementById('damage-search');
        const damageSelect = document.getElementById('damage-locality');
        const declarationButton = document.getElementById('check-declarations');
        let declarationController = null;
        let declarationResult = null;
        let declarationExpiry = null;
        const damagePicker = window.createLocalityPicker({
          search: damageSearch, value: damageSelect, list: document.getElementById('damage-locality-list'),
          count: document.getElementById('damage-count'), error: document.getElementById('damage-error'),
          onChange: invalidateDeclarationSelection
        });
        function filterDamageLocalities() { damagePicker.setValue(damageSelect.value); }
        function clearDeclarations() {
          declarationController?.abort(); declarationController = null;
          clearTimeout(declarationExpiry); declarationExpiry = null; declarationResult = null;
          declarationButton.disabled = false;
          damageSearch.value = ''; damageSelect.value = ''; filterDamageLocalities();
          document.getElementById('damage-error').hidden = true; damageSearch.setAttribute('aria-invalid', 'false');
          document.getElementById('declaration-list').replaceChildren();
          document.getElementById('declaration-checked').textContent = '';
          document.getElementById('declaration-status').textContent = 'No damage locality selected. Declaration status unknown.';
        }
        function renderDeclarations() {
          if (!declarationResult) return;
          const result = declarationResult;
          const stale = result.stale || (result.checkedAt && Date.now() - Date.parse(result.checkedAt) >= 15 * 60_000);
          const unknown = result.status !== 'checked' || stale;
          const records = Array.isArray(result.records) ? result.records : [];
          document.getElementById('declaration-status').textContent = unknown
            ? 'Declaration status unknown for ' + result.locality + '. ' + (records.length ? 'Previously retrieved records are shown as historical context. Check again or confirm details through the official resources.' : 'FEMA data could not be checked. You can still use the official assistance resources above.')
            : records.length ? 'Retrieved ' + records.length + ' recent declaration records for ' + result.locality + ' (all incident types).' + (result.moreAvailable ? ' More historical records are available in the source dataset.' : '')
            : 'No declaration records returned for ' + result.locality + '. This does not rule out other assistance.';
          document.getElementById('declaration-checked').textContent = result.checkedAt
            ? 'Last successful FEMA check: ' + new Date(result.checkedAt).toLocaleString() + (stale ? ' — stale.' : (result.cached ? ' — cached for up to 15 minutes.' : '.'))
            : 'Last successful FEMA check: not available.';
          const displayDate = value => value ? value.slice(0, 10) : 'not listed';
          document.getElementById('declaration-list').replaceChildren(...records.map(record => {
            const item = document.createElement('li');
            const heading = document.createElement('h4');
            const link = document.createElement('a'); link.href = record.url;
            link.textContent = record.declarationType + '-' + record.disasterNumber + ': ' + record.title;
            heading.append(link);
            const area = document.createElement('p'); area.textContent = 'Designated area: ' + record.area + '. Incident type: ' + record.incidentType + '.';
            const dates = document.createElement('p'); dates.textContent = 'Declared: ' + displayDate(record.declarationDate) + '. Incident dates: ' + displayDate(record.incidentBeginDate) + ' to ' + displayDate(record.incidentEndDate) + '.';
            const program = document.createElement('p'); program.textContent = 'Individual Assistance designation in this record: ' + (record.individualAssistance === true ? 'reported' : record.individualAssistance === false ? 'not reported' : 'unknown') + '. This is not an eligibility or application-status check.';
            const updated = document.createElement('p'); updated.className = 'location-count'; updated.textContent = 'Record last updated by FEMA: ' + displayDate(record.lastRefresh) + '.';
            item.append(heading, area, dates, program, updated); return item;
          }));
          clearTimeout(declarationExpiry);
          if (!unknown && result.checkedAt) declarationExpiry = setTimeout(renderDeclarations, Math.max(1, 15 * 60_000 - (Date.now() - Date.parse(result.checkedAt))));
        }
        function invalidateDeclarationSelection() {
          declarationController?.abort(); declarationController = null; clearTimeout(declarationExpiry);
          declarationResult = null; declarationButton.disabled = false;
          document.getElementById('declaration-list').replaceChildren();
          document.getElementById('declaration-checked').textContent = '';
          document.getElementById('declaration-status').textContent = 'Declaration status unknown. Select the damage locality and check FEMA records.';
          recoveryUI.changed();
        }
        document.getElementById('damage-locality-form').addEventListener('submit', async event => {
          event.preventDefault();
          const damageLocality = damageSelect.value;
          if (answers.danger !== 'no' || !localities.includes(damageLocality)) {
            document.getElementById('damage-error').textContent = 'Select where the damage occurred from the list.';
            document.getElementById('damage-error').hidden = false; damageSearch.setAttribute('aria-invalid', 'true'); damageSearch.focus(); damagePicker.open(); return;
          }
          declarationController?.abort(); clearTimeout(declarationExpiry);
          const controller = new AbortController(); declarationController = controller;
          declarationButton.disabled = true;
          declarationResult = null; document.getElementById('declaration-list').replaceChildren();
          document.getElementById('declaration-checked').textContent = '';
          document.getElementById('declaration-status').textContent = 'Checking FEMA records for ' + damageLocality + '…';
          const timeout = setTimeout(() => controller.abort(), 12000);
          try {
            const response = await fetch('/api/declarations', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-HERO-Declarations': '1' },
              body: JSON.stringify({ danger: answers.danger, damageLocality }), signal: controller.signal });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'FEMA check is unavailable.');
            if (declarationController !== controller) return;
            declarationResult = data; renderDeclarations();
          } catch {
            if (declarationController === controller) {
              declarationResult = { status: 'unknown', locality: damageLocality, checkedAt: null, records: [] }; renderDeclarations();
            }
          } finally {
            clearTimeout(timeout);
            if (declarationController === controller) { declarationController = null; declarationButton.disabled = false; }
          }
        });
        filterDamageLocalities();
        window.addEventListener('focus', renderDeclarations);
        window.addEventListener('pageshow', renderDeclarations);
        const currentPicker = window.createLocalityPicker({
          search, value: localitySelect, list: localityList, count: localityCount, error,
          onChange: () => {
            answers.locality = null; answers.need = null;
            recoveryUI.reset();
            try { sessionStorage.removeItem('hero-help-context'); } catch { /* Current-page editing remains available. */ }
          }
        });
        function filterLocalities() { currentPicker.setValue(localitySelect.value); }
        function openLocalityList() { currentPicker.open(); }
        function chooseLocality(name) { currentPicker.setValue(name); }
        function finishReveal() {
          const animation = openingAnimation;
          openingAnimation = null;
          window.cancelAnimationFrame(openingScrollFrame);
          openingScrollFrame = null;
          animation?.cancel();
          reveal.classList.remove('is-opening');
          document.documentElement.classList.remove('is-revealing-help');
        }
        function focusOpeningQuestion(heading) {
          heading.focus({ preventScroll: true });
          flow.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
        }
        function show(id) {
          const isOpening = flow.hidden;
          finishReveal();
          reveal.hidden = false;
          flow.hidden = false;
          flow.querySelectorAll('.step').forEach(step => { step.hidden = step.id !== id; });
          start.setAttribute('aria-expanded', 'true');
          const heading = flow.querySelector('#' + id + ' h2');
          if (!isOpening) {
            heading.focus();
            return;
          }
          if (reducedMotion.matches || typeof reveal.animate !== 'function') {
            focusOpeningQuestion(heading);
            return;
          }
          const scrollFrom = window.scrollY;
          const scrollTo = Math.max(0, flow.getBoundingClientRect().top + scrollFrom - parseFloat(window.getComputedStyle(flow).scrollMarginTop));
          reveal.classList.add('is-opening');
          document.documentElement.classList.add('is-revealing-help');
          const animation = reveal.animate(
            [{ height: '0px' }, { height: reveal.scrollHeight + 'px' }],
            { duration: 650, easing: 'cubic-bezier(.22, 1, .36, 1)' }
          );
          openingAnimation = animation;
          let scrollStartedAt = null;
          function followReveal(timestamp) {
            if (openingAnimation !== animation) return;
            scrollStartedAt ??= timestamp;
            const progress = Math.min((timestamp - scrollStartedAt) / 1200, 1);
            const easedProgress = progress * progress * (3 - 2 * progress);
            window.scrollTo({ top: scrollFrom + (scrollTo - scrollFrom) * easedProgress, behavior: 'auto' });
            if (progress < 1) {
              openingScrollFrame = window.requestAnimationFrame(followReveal);
            } else {
              finishReveal();
              focusOpeningQuestion(heading);
            }
          }
          openingScrollFrame = window.requestAnimationFrame(followReveal);
          animation.finished.then(() => {
            if (openingAnimation !== animation) return;
            reveal.classList.remove('is-opening');
          }, () => { /* Navigation can cancel an unfinished reveal. */ });
        }
        flow.addEventListener('focusin', () => {
          if (openingAnimation) finishReveal();
        });
        function setStatus(message, isError = false) {
          chatStatus.textContent = message;
          chatStatus.classList.toggle('error', isError);
        }
        function aiState(state) {
          document.getElementById('ai-state').textContent = state;
        }
        function addMessage(role, content, actionIds = [], messageLanguage = window.heroAccess.language) {
          const item = document.createElement('div');
          item.className = 'chat-message ' + role;
          item.lang = messageLanguage;
          item.dir = role === 'user' ? 'auto' : window.heroLanguageCopy.languages[messageLanguage].dir;
          const label = document.createElement('strong');
          label.textContent = window.heroLanguageCopy.translate(role === 'assistant' ? 'HERO' : 'You', messageLanguage);
          const body = document.createElement('span');
          body.textContent = content;
          item.append(label, body);
          if (role === 'assistant' && Array.isArray(actionIds)) {
            // Links and labels always come from HERO's catalog, never model text.
            const actions = window.heroRecovery.getPlan(answers.need, messageLanguage);
            for (const id of [...new Set(actionIds)].slice(0, 3)) {
              const action = actions.find(candidate => candidate.id === id); if (!action) continue;
              const link = document.createElement('a'); link.href = action.source.url; link.textContent = action.title;
              link.className = 'chat-action'; item.append(link);
            }
          }
          chatLog.append(item);
          chatLog.scrollTop = chatLog.scrollHeight;
        }
        function renderReferrals() {
          if (typeof window.getFloodReferrals !== 'function') return;
          const plan = window.getFloodReferrals(answers.need);
          document.getElementById('referral-context').textContent = 'Based on your request for ' + plan.selectedNeed.toLowerCase() + ', start with these official sites:';
          document.getElementById('referral-location-note').textContent = plan.locationNote;
          const cards = plan.resources.map((resource, index) => {
            const item = document.createElement('li');
            const rank = document.createElement('span');
            rank.className = 'referral-rank';
            rank.textContent = 'Step ' + (index + 1);
            const link = document.createElement('a');
            link.href = resource.url;
            link.textContent = resource.name;
            const reason = document.createElement('p');
            reason.textContent = resource.reason;
            item.append(rank, link, reason);
            return item;
          });
          document.getElementById('referral-list').replaceChildren(...cards);
        }
        async function askChat() {
          if (pending || answers.danger !== 'no') return;
          if (!navigator.onLine) { aiState('AI unavailable'); setStatus('Chat needs a connection. Your question is still available to retry.', true); chatRetry.hidden = false; return; }
          chatRetry.hidden = true;
          messages = messages.slice(-12);
          while (messages.length > 1 && messages.reduce((n, message) => n + message.content.length, 0) > 10000) messages.shift();
          pending = true;
          chatSend.disabled = true;
          const controller = new AbortController();
          requestController = controller;
          aiState('Connecting');
          const requestStartedAt = performance.now();
          const requestLanguage = window.heroAccess.language;
          setStatus('Finding a helpful next step…');
          chatLog.setAttribute('aria-busy', 'true');
          const timeout = setTimeout(() => controller.abort(), 40000);
          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ answers, messages, completedActionIds: recoveryUI.completed(), language: requestLanguage, useProfile: document.getElementById('use-profile').checked }),
              signal: controller.signal
            });
            const data = await response.json();
            if (requestController !== controller) return;
            if (!response.ok || typeof data.reply !== 'string') throw new Error(data.error || 'Chat is unavailable right now.');
            messages.push({ role: 'assistant', content: data.reply });
            addMessage('assistant', data.reply, data.actionIds, requestLanguage);
            aiState(data.emergency ? 'Emergency guidance — AI was not contacted' : 'AI reply received');
            document.getElementById('ai-state').dataset.responseMs = (performance.now() - requestStartedAt).toFixed(1);
            setStatus('');
            if (data.emergency) { try { sessionStorage.removeItem('hero-help-context'); } catch {} answers.danger = 'unsure'; recoveryUI.reset(); document.getElementById('recovery-plan').hidden = true; chatInput.disabled = true; chatRetry.hidden = true; document.getElementById('chat-emergency').hidden = false; document.getElementById('chat-emergency').scrollIntoView({ block: 'center' }); }
          } catch (chatError) {
            if (requestController === controller) aiState('AI unavailable');
            if (requestController === controller && chatError.name === 'AbortError') {
              setStatus('Chat took too long. Retry when your connection is ready, or use the official links.', true);
              chatRetry.hidden = false;
            } else if (requestController === controller && chatError.name !== 'AbortError') {
              chatRetry.hidden = false;
              setStatus(chatError instanceof TypeError ? 'Chat is unavailable right now. Use the official referrals above.' : (chatError.message || 'Chat is unavailable right now. Use the official referrals above.'), true);
            }
          } finally {
            clearTimeout(timeout);
            if (requestController === controller) {
              chatLog.setAttribute('aria-busy', 'false');
              pending = false;
              requestController = null;
              chatSend.disabled = answers.danger !== 'no';
            }
          }
        }
        function renderPrivateReminders() {
          const reminders = {
            pregnant: 'Pregnancy in your household.', children: 'Children in your household.',
            olderAdults: 'Support related to older age.', disability: 'Disability or accessibility needs.',
            mobility: 'Help with moving around or leaving home.', medicalPower: 'Electricity needed for medical equipment.',
            transport: 'Transportation support.', pets: 'Pets or service animals to plan for.'
          };
          const items = Object.entries(reminders).filter(([key]) => profile?.[key] === 'yes').map(([, text]) => {
            const item = document.createElement('li'); item.textContent = text; return item;
          });
          document.getElementById('private-reminders').hidden = !items.length;
          document.getElementById('private-reminders-list').replaceChildren(...items);
        }
        function beginChat(startConversation = true) {
          const planStartedAt = performance.now();
          document.getElementById('recovery-plan').hidden = false;
          aiState('Not checked');
          chatInput.disabled = false;
          document.getElementById('chat-emergency').hidden = true;
          clearDeclarations();
          requestController?.abort();
          requestController = null;
          pending = false;
          chatSend.disabled = false;
          chatLog.replaceChildren();
          chatLog.setAttribute('aria-busy', 'false');
          chatRetry.hidden = true;
          chatInput.value = '';
          setStatus('');
          messages = [{ role: 'user', content: 'Please use my questionnaire answers to suggest a safe next step and ask one useful follow-up question if needed.' }];
          const location = answers.locality ? 'Current locality you entered: ' + answers.locality + '.' : 'Current locality: not provided.';
          document.getElementById('summary-text').textContent = location + ' Help requested: ' + answers.need + '.';
          renderReferrals();
          renderPrivateReminders();
          recoveryUI.setContext();
          show('summary-step');
          if (!startConversation) chatRetry.hidden = false;
          requestAnimationFrame(() => requestAnimationFrame(() => {
            document.getElementById('recovery-plan').dataset.readyMs = (performance.now() - planStartedAt).toFixed(1);
            if (intakeStartedAt !== null) document.getElementById('recovery-plan').dataset.intakeMs = (performance.now() - intakeStartedAt).toFixed(1);
          }));
          if (!navigator.onLine) {
            aiState('AI unavailable');
            chatRetry.hidden = false;
            setStatus('Chat needs a connection. Your question is still available to retry.');
          } else if (startConversation) askChat();
        }
        document.getElementById('chat-clear').addEventListener('click', () => {
          if (answers.danger !== 'no') { reset(); return; }
          requestController?.abort(); requestController = null; pending = false;
          chatSend.disabled = false; chatLog.setAttribute('aria-busy', 'false'); chatLog.replaceChildren(); chatInput.value = '';
          document.getElementById('chat-emergency').hidden = true;
          messages = [{ role: 'user', content: 'Use the questionnaire to give one safe next step and ask one useful follow-up question if needed.' }];
          aiState('Not checked');
          chatRetry.hidden = false; setStatus('Conversation cleared. Start again when ready.'); chatInput.focus();
        });
        function reset() {
          intakeStartedAt = performance.now();
          recoveryUI.reset(); aiState('Not checked');
          chatInput.disabled = false;
          document.getElementById('chat-emergency').hidden = true;
          clearDeclarations();
          requestController?.abort();
          requestController = null;
          pending = false;
          chatSend.disabled = false;
          messages = [];
          chatLog.replaceChildren();
          chatLog.setAttribute('aria-busy', 'false');
          chatRetry.hidden = true;
          chatInput.value = '';
          setStatus('');
          try { sessionStorage.removeItem('hero-help-context'); } catch { /* Page context still resets. */ }
          answers.danger = null;
          answers.locality = null;
          answers.need = null;
          document.getElementById('use-profile').checked = false;
          localitySelect.value = '';
          search.value = '';
          filterLocalities();
          error.hidden = true; search.setAttribute('aria-invalid', 'false');
          show('danger-step');
        }
        function openHelp() {
          if (answers.danger === 'no' && answers.need) show('summary-step');
          else reset();
          refreshSavedHome();
        }
        start.addEventListener('click', openHelp);
        document.querySelectorAll('[data-start-help]').forEach(link => {
          link.addEventListener('click', event => {
            event.preventDefault();
            openHelp();
          });
        });
        flow.addEventListener('click', event => {
          const button = event.target.closest('button');
          if (!button) return;
          if (button.id === 'use-home-locality' && profile) {
            chooseLocality(profile.homeLocality);
            search.focus();
          } else if (button.dataset.danger) {
            recoveryUI.reset();
            clearDeclarations();
            try { sessionStorage.removeItem('hero-help-context'); } catch { /* Current-page editing remains available. */ }
            answers.need = null;
            answers.danger = button.dataset.danger;
            show(button.dataset.danger === 'no' ? 'location-step' : 'emergency-step');
          } else if (button.id === 'skip-location') {
            try { sessionStorage.removeItem('hero-help-context'); } catch { /* Current-page editing remains available. */ }
            answers.need = null;
            answers.locality = null;
            error.hidden = true; search.setAttribute('aria-invalid', 'false');
            show('need-step');
          } else if (button.dataset.need) {
            answers.need = button.dataset.need;
            saveHelpContext();
            beginChat();
          } else if (button.hasAttribute('data-back')) {
            clearDeclarations();
            requestController?.abort();
            requestController = null;
            pending = false;
            chatSend.disabled = false;
            aiState('Not checked');
            show(button.dataset.back);
          } else if (button.hasAttribute('data-continue-chat')) {
            if (!messages.some(message => message.role === 'assistant') && !pending) askChat();
            chatInput.focus();
            chatForm.scrollIntoView({ block: 'center', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
          } else if (button.hasAttribute('data-restart')) {
            reset();
          }
        });
        document.getElementById('location-form').addEventListener('submit', event => {
          event.preventDefault();
          const locality = localitySelect.value;
          if (!localities.includes(locality)) {
            error.textContent = 'Select a county or independent city from the list, or choose skip.';
            error.hidden = false; search.setAttribute('aria-invalid', 'true');
            search.focus();
            openLocalityList();
            return;
          }
          try { sessionStorage.removeItem('hero-help-context'); } catch { /* Current-page editing remains available. */ }
          answers.need = null;
          answers.locality = locality;
          error.hidden = true; search.setAttribute('aria-invalid', 'false');
          show('need-step');
        });
        chatRetry.addEventListener('click', askChat);
        chatForm.addEventListener('submit', event => {
          event.preventDefault();
          const question = chatInput.value.trim();
          if (!question || pending) return;
          messages.push({ role: 'user', content: question });
          addMessage('user', question);
          chatInput.value = '';
          askChat();
        });
        if (location.hash === '#help') show('danger-step');
      })();
