      (() => {
        const flow = document.getElementById('help-questions');
        const reveal = document.getElementById('help-reveal');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let openingAnimation = null;
        let openingScrollFrame = null;
        const start = document.getElementById('start-help');
        const search = document.getElementById('locality-search');
        const localityPicker = document.getElementById('locality-picker');
        const localityList = document.getElementById('current-locality-list');
        const localitySelect = document.getElementById('current-locality');
        const localityCount = document.getElementById('location-count');
        const localities = Array.isArray(window.VIRGINIA_LOCALITIES) ? window.VIRGINIA_LOCALITIES : [];
        const error = document.getElementById('location-error');
        const chatLog = document.getElementById('chat-log');
        const chatStatus = document.getElementById('chat-status');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const answers = { danger: null, locality: null, need: null };
        let messages = [];
        let visibleLocalities = [];
        let activeLocalityIndex = -1;
        let pending = false;
        let requestController = null;
        let profile = null;
        let profileIdentity;
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
            const nextIdentity = data.user?.username || 'guest';
            if (profileIdentity !== undefined && profileIdentity !== nextIdentity) reset();
            profileIdentity = nextIdentity;
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
          if (!document.getElementById('summary-step').hidden) renderPrivateReminders();
        }
        window.addEventListener('pageshow', refreshSavedHome);
        window.addEventListener('focus', refreshSavedHome);
        function filterLocalities() {
          const query = search.value.trim().toLocaleLowerCase();
          visibleLocalities = localities.filter(name => name.toLocaleLowerCase().includes(query));
          localityList.replaceChildren(...visibleLocalities.map((name, index) => {
            const option = document.createElement('li');
            option.id = 'locality-option-' + localities.indexOf(name);
            option.className = 'location-option';
            option.setAttribute('role', 'option');
            option.setAttribute('aria-selected', String(localitySelect.value === name));
            option.textContent = name;
            option.addEventListener('pointerenter', () => setActiveLocality(index));
            option.addEventListener('pointerdown', event => {
              if (event.pointerType === 'mouse') event.preventDefault();
            });
            option.addEventListener('click', () => chooseLocality(name));
            return option;
          }));
          activeLocalityIndex = -1;
          search.removeAttribute('aria-activedescendant');
          localityCount.textContent = visibleLocalities.length
            ? visibleLocalities.length + (visibleLocalities.length === 1 ? ' locality available.' : ' localities available.')
            : 'No localities match your search.';
          if (!localities.length) {
            error.textContent = 'The locality list is unavailable. You can skip this question.';
            error.hidden = false;
          }
        }
        function openLocalityList() {
          if (!localityList.hidden) return;
          filterLocalities();
          localityList.hidden = false;
          search.setAttribute('aria-expanded', 'true');
        }
        function closeLocalityList() {
          localityList.hidden = true;
          search.setAttribute('aria-expanded', 'false');
          search.removeAttribute('aria-activedescendant');
          activeLocalityIndex = -1;
        }
        function setActiveLocality(index) {
          if (index < 0 || index >= visibleLocalities.length) return;
          activeLocalityIndex = index;
          const options = localityList.querySelectorAll('[role="option"]');
          options.forEach((option, optionIndex) => option.classList.toggle('is-active', optionIndex === index));
          const option = options[index];
          search.setAttribute('aria-activedescendant', option.id);
          option.scrollIntoView({ block: 'nearest' });
        }
        function chooseLocality(name) {
          if (!localities.includes(name)) return;
          localitySelect.value = name;
          search.value = name;
          error.hidden = true;
          filterLocalities();
          closeLocalityList();
        }
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
        function addMessage(role, content) {
          const item = document.createElement('div');
          item.className = 'chat-message ' + role;
          const label = document.createElement('strong');
          label.textContent = role === 'assistant' ? 'Flood Guide' : 'You';
          const body = document.createElement('span');
          body.textContent = content;
          item.append(label, body);
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
          if (pending) return;
          messages = messages.slice(-12);
          pending = true;
          chatSend.disabled = true;
          const controller = new AbortController();
          requestController = controller;
          setStatus('Finding a helpful next step…');
          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ answers, messages, useProfile: document.getElementById('use-profile').checked }),
              signal: controller.signal
            });
            const data = await response.json();
            if (!response.ok || typeof data.reply !== 'string') throw new Error(data.error || 'Chat is unavailable right now.');
            messages.push({ role: 'assistant', content: data.reply });
            addMessage('assistant', data.reply);
            setStatus('');
          } catch (chatError) {
            if (chatError.name !== 'AbortError') {
              setStatus(chatError instanceof TypeError ? 'Chat is unavailable right now. Use the official referrals above.' : (chatError.message || 'Chat is unavailable right now. Use the official referrals above.'), true);
            }
          } finally {
            if (requestController === controller) {
              pending = false;
              requestController = null;
              chatSend.disabled = false;
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
        function beginChat() {
          requestController?.abort();
          requestController = null;
          pending = false;
          chatLog.replaceChildren();
          chatInput.value = '';
          setStatus('');
          messages = [{ role: 'user', content: 'Please use my questionnaire answers to suggest a safe next step and ask one useful follow-up question if needed.' }];
          const location = answers.locality ? 'Current locality you entered: ' + answers.locality + '.' : 'Current locality: not provided.';
          document.getElementById('summary-text').textContent = location + ' Help requested: ' + answers.need + '.';
          renderReferrals();
          renderPrivateReminders();
          show('summary-step');
          askChat();
        }
        function reset() {
          requestController?.abort();
          requestController = null;
          pending = false;
          chatSend.disabled = false;
          messages = [];
          chatLog.replaceChildren();
          chatInput.value = '';
          setStatus('');
          answers.danger = null;
          answers.locality = null;
          answers.need = null;
          document.getElementById('use-profile').checked = false;
          search.value = '';
          filterLocalities();
          error.hidden = true;
          show('danger-step');
        }
        start.addEventListener('click', () => { reset(); refreshSavedHome(); });
        search.addEventListener('input', () => {
          localitySelect.value = '';
          filterLocalities();
          localityList.hidden = false;
          search.setAttribute('aria-expanded', 'true');
          if (localities.length) error.hidden = true;
        });
        search.addEventListener('focus', openLocalityList);
        localityPicker.addEventListener('pointerenter', openLocalityList);
        search.addEventListener('keydown', event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            openLocalityList();
            setActiveLocality(activeLocalityIndex < visibleLocalities.length - 1 ? activeLocalityIndex + 1 : 0);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            openLocalityList();
            setActiveLocality(activeLocalityIndex > 0 ? activeLocalityIndex - 1 : visibleLocalities.length - 1);
          } else if (event.key === 'Enter' && !localityList.hidden) {
            if (activeLocalityIndex >= 0) {
              event.preventDefault();
              chooseLocality(visibleLocalities[activeLocalityIndex]);
            }
          } else if (event.key === 'Escape' && !localityList.hidden) {
            event.preventDefault();
            closeLocalityList();
          } else if (event.key === 'Tab') {
            closeLocalityList();
          }
        });
        document.addEventListener('click', event => {
          if (!localityPicker.contains(event.target)) closeLocalityList();
        });
        filterLocalities();
        flow.addEventListener('click', event => {
          const button = event.target.closest('button');
          if (!button) return;
          if (button.id === 'use-home-locality' && profile) {
            chooseLocality(profile.homeLocality);
            search.focus();
          } else if (button.dataset.danger) {
            answers.danger = button.dataset.danger;
            show(button.dataset.danger === 'no' ? 'location-step' : 'emergency-step');
          } else if (button.id === 'skip-location') {
            answers.locality = null;
            error.hidden = true;
            show('need-step');
          } else if (button.dataset.need) {
            answers.need = button.dataset.need;
            beginChat();
          } else if (button.hasAttribute('data-back')) {
            requestController?.abort();
            requestController = null;
            pending = false;
            chatSend.disabled = false;
            show(button.dataset.back);
          } else if (button.hasAttribute('data-restart')) {
            reset();
          }
        });
        document.getElementById('location-form').addEventListener('submit', event => {
          event.preventDefault();
          const locality = localitySelect.value;
          if (!localities.includes(locality)) {
            error.textContent = 'Select a county or independent city from the list, or choose skip.';
            error.hidden = false;
            search.focus();
            openLocalityList();
            return;
          }
          answers.locality = locality;
          error.hidden = true;
          show('need-step');
        });
        chatForm.addEventListener('submit', event => {
          event.preventDefault();
          const question = chatInput.value.trim();
          if (!question || pending) return;
          messages.push({ role: 'user', content: question });
          addMessage('user', question);
          chatInput.value = '';
          askChat();
        });
        if (location.hash === '#help') reset();
      })();
