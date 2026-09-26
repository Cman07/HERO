(() => {
  window.createLocalityPicker = ({ search, value, list, count, error, onChange = () => {} }) => {
    const places = window.VIRGINIA_LOCALITIES || [];
    const container = search.closest('.locality-picker');
    let matches = [];
    let active = -1;
    function render(filterText = search.value) {
      const query = filterText.trim().toLocaleLowerCase();
      matches = places.filter(place => place.toLocaleLowerCase().includes(query));
      list.replaceChildren(...matches.map((place, index) => {
        const option = document.createElement('li');
        option.id = list.id + '-option-' + places.indexOf(place);
        option.className = 'location-option';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(value.value === place));
        option.textContent = place;
        option.addEventListener('pointerenter', () => activate(index));
        option.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') event.preventDefault(); });
        option.addEventListener('click', () => { setValue(place); onChange(place); });
        return option;
      }));
      active = -1;
      search.removeAttribute('aria-activedescendant');
      count.textContent = matches.length ? matches.length + (matches.length === 1 ? ' locality available.' : ' localities available.') : 'No localities match your search.';
    }
    function close() {
      list.hidden = true; search.setAttribute('aria-expanded', 'false');
      search.removeAttribute('aria-activedescendant'); active = -1;
    }
    function open() {
      if (!list.hidden) return;
      render(value.value && search.value === value.value ? '' : search.value);
      list.hidden = false; search.setAttribute('aria-expanded', 'true');
    }
    function activate(index) {
      if (index < 0 || index >= matches.length) return;
      active = index;
      [...list.children].forEach((option, i) => option.classList.toggle('is-active', i === index));
      const option = list.children[index];
      search.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    }
    function setValue(place) {
      value.value = places.includes(place) ? place : '';
      search.value = value.value;
      if (error) error.hidden = true;
      search.setAttribute('aria-invalid', 'false'); render(); close();
    }
    search.addEventListener('input', () => {
      value.value = ''; onChange('');
      if (error) error.hidden = true;
      search.setAttribute('aria-invalid', 'false');
      render(); list.hidden = false; search.setAttribute('aria-expanded', 'true');
    });
    search.addEventListener('focus', open);
    search.addEventListener('click', open);
    search.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); open();
        activate(event.key === 'ArrowDown' ? (active + 1) % Math.max(1, matches.length) : (active <= 0 ? matches.length - 1 : active - 1));
      } else if (event.key === 'Enter' && !list.hidden && active >= 0) {
        event.preventDefault(); const place = matches[active]; setValue(place); onChange(place);
      } else if (event.key === 'Escape') {
        event.preventDefault(); close();
      } else if (event.key === 'Tab') close();
    });
    document.addEventListener('click', event => { if (!container.contains(event.target)) close(); });
    render(); close();
    return { setValue, open, close };
  };
})();
