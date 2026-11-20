/* Static GitHub Pages deployment: no console credentials sent to github.io. */
(function () {
  'use strict';
  const upstreamFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = function (input, init) {
    let url;
    try { url = new URL(typeof input === 'string' ? input : input.url, location.href); }
    catch (error) { return Promise.reject(error); }
    if (url.origin === location.origin && /^(?:\/api(?:\/|$)|\/(?:health|ready)(?:\/|$))/.test(url.pathname)) {
      return Promise.reject(new Error('SHEILY no tiene un backend autenticado conectado a GitHub Pages.'));
    }
    return upstreamFetch(input, init);
  };
})();
