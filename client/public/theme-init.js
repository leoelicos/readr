(function () {
  try {
    var saved = localStorage.getItem('readr:theme');
    var theme =
      saved === 'light' || saved === 'dark'
        ? saved
        : matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.dataset.theme = theme;
  } catch {
    /* ignore: CSS falls back to prefers-color-scheme */
  }
})();
