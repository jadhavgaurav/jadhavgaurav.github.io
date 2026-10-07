// Small progressive enhancements. Every story and contribution is static HTML.
const repoForm = document.querySelector('[data-repo-controls]');
if (repoForm) {
  repoForm.hidden = false;
  const rows = [...document.querySelectorAll('[data-repo]')];
  const search = document.querySelector('#repo-search');
  const category = document.querySelector('#repo-category');
  const year = document.querySelector('#repo-year');
  const filter = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let shown = 0;
    for (const row of rows) {
      const match = row.textContent.toLocaleLowerCase().includes(query)
        && (category.value === 'all' || row.dataset.category === category.value)
        && (year.value === 'all' || row.dataset.year === year.value);
      row.hidden = !match;
      shown += Number(match);
    }
    document.querySelector('#repo-status').textContent = `${shown} of ${rows.length} repositories`;
    document.querySelector('#repo-empty').hidden = shown > 0;
  };
  repoForm.addEventListener('submit', event => event.preventDefault());
  repoForm.addEventListener('input', filter);
  repoForm.addEventListener('change', filter);
  repoForm.addEventListener('reset', () => requestAnimationFrame(filter));
  filter();
}

