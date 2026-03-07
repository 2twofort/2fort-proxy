(function () {
  const DEFAULTS = {
    backendUrl: 'https://proxy.2fort.lol',
    uvPrefix:   '/2fort-proxy/service/',
    barePath:   '/bare/',
  };
  if (!localStorage.getItem('2fp-config')) {
    localStorage.setItem('2fp-config', JSON.stringify(DEFAULTS));
  }
})();
