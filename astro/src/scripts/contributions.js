const ossForm = document.querySelector('[data-oss-controls]');
if (ossForm) {
  ossForm.hidden = false;
  const search = document.querySelector('#oss-search');
  const groups = [...document.querySelectorAll('[data-oss-group]')];
  const buttons = [...document.querySelectorAll('[data-oss-state]')];
  const total = document.querySelectorAll('[data-pr]').length;
  let state = 'all';
  const filter = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let shown = 0, shownGroups = 0;
    for (const group of groups) {
      const name = group.querySelector('.oss-repo-heading').textContent.toLocaleLowerCase();
      let count = 0;
      for (const row of group.querySelectorAll('[data-pr]')) {
        const match = (state === 'all' || row.dataset.state === state)
          && `${name} ${row.textContent.toLocaleLowerCase()}`.includes(query);
        row.hidden = !match;
        count += Number(match);
      }
      group.hidden = count === 0;
      shown += count;
      shownGroups += Number(count > 0);
    }
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.ossState === state)));
    document.querySelector('#oss-status').textContent = `${shown} of ${total} pull requests across ${shownGroups} ${shownGroups === 1 ? 'project' : 'projects'}`;
    document.querySelector('#oss-empty').hidden = shown > 0;
  };
  buttons.forEach(button => button.addEventListener('click', () => { state = button.dataset.ossState; filter(); }));
  ossForm.addEventListener('submit', event => event.preventDefault());
  ossForm.addEventListener('input', filter);
  ossForm.addEventListener('reset', () => { state = 'all'; requestAnimationFrame(filter); });
  // A direct contribution link should land at its group below the filter bar.
  if (location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());
  filter();
}
