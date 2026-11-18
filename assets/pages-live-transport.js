'use strict';
/* SHEILY GitHub Pages ↔ owner-authenticated console. No passwords in repository,
   URL, cookies, LocalStorage or sessionStorage. The origin is intentionally pinned. */
(function (root) {
  if (typeof root.location === 'undefined' || root.location.origin !== 'https://sheily-ai.github.io') return;
  const API_ORIGIN = 'https://yo-venus-series.tail2ed060.ts.net:8443';
  const originalFetch = root.fetch.bind(root);
  let bridgeSession = '';
  const PUBLIC_PATH = /^\/(?:api\/|health(?:\/|$)|ready(?:\/|$))/;
  const PRIVATE_PATH = /^\/api\/(?:admin(?:\/|$)|vault(?:\/|$)|tidex(?:\/|$)|auth\/setup(?:\/|$)|workspace(?:\/|$))/;
  const SAFE_PATH = /^\/api\/(?:auth\/(?:session|status)|chat|conversations(?:\/.*)?|control\/(?:turns(?:\/.*)?|access)|attachments(?:\/.*)?|memories(?:\/.*)?|settings|privacy|inference\/session-selection(?:\/.*)?|lifelong-memory(?:\/.*)?|overview|meta|artifacts\/download|previews(?:\/.*)?|connectome\/observed|tts\/speak)$/;
  function sourceUrl(input) {
    const raw = typeof input === 'string' ? input : input && typeof input.href === 'string' ? input.href : input && input.url;
    return new URL(raw, root.location.href);
  }
  function isApi(path) { return path.startsWith('/api/'); }
  function backendUrl(url) {
    // The server exposes exact, owner-authenticated aliases for the original
    // Rust console's health/readiness JSON. Never trust the public tunnel's
    // own plaintext /health response as cognitive readiness evidence.
    const pathname = url.pathname === '/health' ? '/api/bridge/health'
      : url.pathname === '/ready' ? '/api/bridge/ready' : url.pathname;
    return API_ORIGIN + pathname + url.search;
  }
  function denied() { return Promise.reject(new Error('Esta operación privada no está habilitada en la web pública. Usa la consola local de SHEILY.')); }
  function guardedFetch(input, init) {
    const options = init || {};
    let url;
    try { url = sourceUrl(input); } catch (error) { return Promise.reject(error); }
    if (url.origin !== root.location.origin || !PUBLIC_PATH.test(url.pathname)) return originalFetch(input, init);
    if (PRIVATE_PATH.test(url.pathname) || (isApi(url.pathname) && !SAFE_PATH.test(url.pathname))) return denied();
    const method = String(options.method || (input && input.method) || 'GET').toUpperCase();
    let headers = new Headers(options.headers || (input && input.headers) || {});
    headers.delete('cookie');
    headers.delete('authorization');
    headers.delete('x-console-token');
    const login = url.pathname === '/api/auth/session';
    if (login && method === 'POST') {
      let candidate;
      try { candidate = JSON.parse(options.body || '{}').token; }
      catch { return Promise.reject(new Error('Solicitud de acceso inválida.')); }
      if (typeof candidate !== 'string' || candidate.length < 12 || candidate.length > 128) return Promise.reject(new Error('Contraseña inválida. No se ha enviado.')); 
      bridgeSession = '';
      return originalFetch(backendUrl(url), { ...options, method, headers, credentials: 'omit', mode: 'cors', redirect: 'error', referrerPolicy: 'no-referrer' })
        .then(response => {
          if (response.ok) {
            const ticket = response.headers.get('X-Sheily-Bridge-Session') || '';
            if (!/^[A-Za-z0-9_-]{43}$/.test(ticket)) throw new Error('La pasarela no entregó una sesión válida.');
            bridgeSession = ticket;
          }
          return response;
        });
    }
    if (login && method === 'DELETE') {
      if (bridgeSession) headers.set('X-Sheily-Bridge-Session', bridgeSession);
      bridgeSession = '';
    } else if (bridgeSession && (isApi(url.pathname) || url.pathname === '/health' || url.pathname === '/ready') && !login) {
      headers.set('X-Sheily-Bridge-Session', bridgeSession);
    }
    return originalFetch(backendUrl(url), { ...options, method, headers, credentials: 'omit', mode: 'cors', redirect: 'error', referrerPolicy: 'no-referrer' });
  }
  root.fetch = guardedFetch;

  /* EventSource cannot carry headers. Stream authenticated SSE through fetch
     instead; never put credentials into a query parameter. */
  class AuthorizedEventSource {
    constructor(path) {
      this.url = String(path);
      this.readyState = 0;
      this.CONNECTING = 0;
      this.OPEN = 1;
      this.CLOSED = 2;
      this.withCredentials = false;
      this._listeners = new Map();
      this._abort = new AbortController();
      this._closed = false;
      Promise.resolve().then(() => this._connect());
    }
    addEventListener(type, listener) {
      if (typeof listener !== 'function') return;
      const key = String(type);
      if (!this._listeners.has(key)) this._listeners.set(key, new Set());
      this._listeners.get(key).add(listener);
    }
    removeEventListener(type, listener) { this._listeners.get(String(type))?.delete(listener); }
    _emit(type, data, id) {
      const event = { type, data: data || '', lastEventId: id || '', target: this };
      for (const callback of this._listeners.get(type) || []) {
        try { callback(event); } catch (e) { console.error('SSE callback failed:', e); }
      }
      const listener = this['on' + type];
      if (typeof listener === 'function') listener(event);
    }
    async _connect() {
      if (this._closed) return;
      try {
        const url = sourceUrl(this.url);
        if (url.origin !== root.location.origin || !/^\/api\/control\/turns\/[^/]+\/events$/.test(url.pathname)) throw new Error('SSE endpoint no autorizado');
        const response = await guardedFetch(this.url, { headers: { Accept: 'text/event-stream' }, signal: this._abort.signal });
        if (!response.ok || !response.body) throw new Error('Seguimiento no disponible: HTTP ' + response.status);
        if (this._closed) return;
        this.readyState = 1;
        this._emit('open');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const dispatch = frame => {
          let type = 'message', id = '', data = [];
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) type = line.slice(6).trim();
            else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
            else if (line.startsWith('id:')) id = line.slice(3).trim();
          }
          if (data.length && !this._closed) this._emit(type, data.join('\n'), id);
        };
        while (!this._closed) {
          const next = await reader.read();
          if (next.done) break;
          buffer += decoder.decode(next.value, { stream: true }).replace(/\r\n/g, '\n');
          if (buffer.length > 1048576) throw new Error('SSE frame exceeds limit');
          let cut;
          while ((cut = buffer.indexOf('\n\n')) !== -1) {
            dispatch(buffer.slice(0, cut));
            buffer = buffer.slice(cut + 2);
          }
        }
        if (!this._closed) this._emit('error', 'El seguimiento ha terminado.');
      } catch (error) {
        if (!this._closed) this._emit('error', 'Seguimiento no disponible.');
      } finally {
        this.readyState = 2;
      }
    }
    close() { this._closed = true; this.readyState = 2; this._abort.abort(); }
  }
  root.EventSource = AuthorizedEventSource;
  root.SheilyPagesTransport = Object.freeze({
    backendOrigin: API_ORIGIN,
    isAuthenticated: () => Boolean(bridgeSession),
  });

  if (root.document) root.document.addEventListener('DOMContentLoaded', async () => {
    for (const element of root.document.querySelectorAll('[data-view="admin"], [data-view="vault"]')) element.hidden = true;
    const status = root.document.querySelector('#sheily-pages-status');
    if (!status) return;
    try {
      const response = await guardedFetch('/api/auth/status', { signal: AbortSignal.timeout(7000) });
      if (response.ok) {
        status.querySelector('summary').textContent = 'SHEILY · consola remota accesible';
        const paragraph = status.querySelector('p');
        if (paragraph) paragraph.textContent = 'La conexión HTTPS responde. Introduce tu contraseña en el formulario para acceder al chat real. La clave se conserva solo en memoria mientras esta pestaña esté abierta; administración y custodia privada no se exponen.';
        setTimeout(() => {
          status.removeAttribute('open');
        }, 10000);
      }
    } catch { /* Keep the accurate disconnected banner. */ }
  });
})(globalThis);
