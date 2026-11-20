(function (root) {
  'use strict';
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  function render(data) {
    const anc = data && data.anc;
    if (!anc || data.schema !== 'sheily.pages.neural-status.v1' || data.kind !== 'static-snapshot' || !Array.isArray(anc.tiles) || !Array.isArray(anc.pipeline) || !Array.isArray(anc.caveats)) return null;
    const panel = el('section', 'anc-panel');
    panel.setAttribute('aria-labelledby', 'anc-title');
    const head = el('div', 'lifelong-memory-panel-head');
    const left = el('div');
    left.append(el('p', 'eyebrow', 'SISTEMA NEURONAL'));
    const h = el('h2', null, anc.name + ' · ' + anc.title); h.id = 'anc-title'; left.append(h);
    head.append(left, el('span', 'anc-badge', 'Instantánea ' + data.asOf));
    const status = el('p', 'anc-status', anc.statusLabel);
    const copy = el('p', 'lifelong-memory-copy', anc.summary);
    const tiles = el('dl', 'anc-tiles');
    for (const t of anc.tiles) { const d = el('div'); d.append(el('dt', null, t.label), el('dd', null, t.value), el('small', null, t.hint)); tiles.append(d); }
    const flow = el('ol', 'anc-pipeline'); flow.setAttribute('aria-label', 'Recorrido de un episodio en ANC');
    for (const s of anc.pipeline) { const li = el('li'); li.append(el('strong', null, s.step), el('span', null, s.detail)); flow.append(li); }
    const cav = el('ul', 'anc-caveats'); for (const c of anc.caveats) cav.append(el('li', null, c));
    panel.append(head, status, copy, tiles, flow, cav, el('p', 'anc-note', data.note));
    return panel;
  }
  async function init() {
    let data;
    try { const r = await fetch('./assets/neural-status.json', { cache: 'no-cache' }); if (!r.ok) return; data = await r.json(); } catch { return; }
    const panel = render(data); if (!panel) return;
    const system = document.getElementById('system-status-grid');
    if (system) {
      panel.id = 'anc-system';
      const title = panel.querySelector('h2');
      if (title) title.id = 'anc-system-title';
      panel.setAttribute('aria-labelledby', 'anc-system-title');
      system.after(panel);
    }
  }
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
  root.SheilyNeuralStatus = Object.freeze({ render });
})(globalThis);
