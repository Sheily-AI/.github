'use strict';

/* Presentation only. Execution, approval and delivery remain Rust-owned. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./vendor/markdown-it.min.js'), require('./vendor/fflate.min.js'), require('./vendor/highlight.min.js'));
  } else {
    root.SheilyResults = factory(root.markdownit, root.fflate, root.hljs);
  }
})(globalThis, function (MarkdownIt, zipLibrary, highlighter) {
  const MAX_FILE_BYTES = 8 * 1024 * 1024;
  const MAX_BUNDLE_BYTES = 16 * 1024 * 1024;
  const MAX_FILES = 128;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const extensions = { python: 'py', javascript: 'js', typescript: 'ts', rust: 'rs', html: 'html', xml: 'xml', svg: 'svg', css: 'css', json: 'json', yaml: 'yaml', toml: 'toml', markdown: 'md', bash: 'sh', shell: 'sh', sql: 'sql', jsx: 'jsx', tsx: 'tsx', c: 'c', cpp: 'cpp', java: 'java', go: 'go', ruby: 'rb', php: 'php', text: 'txt', plaintext: 'txt' };
  const languageForExtension = { py: 'python', js: 'javascript', mjs: 'javascript', cjs: 'javascript', ts: 'typescript', rs: 'rust', sh: 'bash', md: 'markdown', yml: 'yaml', html: 'xml', svg: 'xml', htm: 'xml', jsx: 'javascript', tsx: 'typescript', rb: 'ruby', h: 'c' };
  const imageTypes = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };
  const mimeTypes = { html: 'text/html', htm: 'text/html', svg: 'image/svg+xml', md: 'text/markdown', json: 'application/json', csv: 'text/csv', pdf: 'application/pdf', zip: 'application/zip', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', mp4: 'video/mp4', webm: 'video/webm', ...imageTypes };
  const textExtensions = new Set(['txt', 'md', 'html', 'htm', 'svg', 'json', 'csv', 'tsv', 'xml', 'css', 'js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx', 'rs', 'py', 'sh', 'bash', 'yaml', 'yml', 'toml', 'sql', 'c', 'h', 'cpp', 'java', 'go', 'rb', 'php', 'ini', 'conf', 'log', 'tex', 'r', 'vue', 'svelte']);
  let workspace = null;
  let notify;
  let request = null;
  let active = null;
  let generation = 0;
  let focusReturn = null;
  let previewId = null;
  let blobUrls = [];

  function escape(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  }
  function externalUrl(value) {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }
  function extension(name) { return String(name).split('.').pop().toLowerCase(); }
  function safePath(value) {
    if (typeof value !== 'string' || !value || value.length > 240 || /[\\\x00-\x1f\x7f:]/.test(value) || value.startsWith('/') || value.endsWith('/')) throw new Error('Nombre de archivo no seguro.');
    const parts = value.split('/');
    if (parts.some((part) => !part || part === '.' || part === '..' || ['__proto__', 'constructor', 'prototype'].includes(part))) throw new Error('La ruta de un archivo no puede salir del proyecto.');
    return value;
  }
  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  function fenceMetadata(info, index) {
    const value = String(info).trim();
    const first = value.split(/\s+/)[0];
    const named = value.match(/(?:^|\s)(?:file|filename|path)=(?:"([^"]+)"|'([^']+)'|([^\s]+))/);
    let name = named ? (named[1] || named[2] || named[3]) : '';
    let language = first.toLowerCase();
    if (!name && /[/.]/.test(first) && !first.includes('=')) {
      name = first;
      language = languageForExtension[extension(name)] || extension(name);
    }
    const namedByAuthor = Boolean(name);
    if (name) safePath(name);
    if (!name) name = 'bloque-' + (index + 1) + '.' + (extensions[language] || 'txt');
    if (!/^[a-z0-9_+-]{0,32}$/.test(language)) language = '';
    return { name, language, namedByAuthor };
  }
  function highlight(code, language) {
    const text = String(code);
    if (text.length > 256 * 1024 || !language || !highlighter.getLanguage(language)) return escape(text);
    return highlighter.highlight(text, { language, ignoreIllegals: true }).value;
  }
  const markdown = new MarkdownIt({ html: false, linkify: true, breaks: false, typographer: false });
  markdown.validateLink = (url) => Boolean(externalUrl(url));
  const originalLink = markdown.renderer.rules.link_open || ((tokens, index, options, env, self) => self.renderToken(tokens, index, options));
  markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
    tokens[index].attrSet('target', '_blank');
    tokens[index].attrSet('rel', 'noopener noreferrer');
    return originalLink(tokens, index, options, env, self);
  };
  // Do not automatically request tracking images from a generated answer.
  markdown.renderer.rules.image = (tokens, index) => {
    const token = tokens[index];
    const url = externalUrl(token.attrGet('src'));
    return url ? '<a class="image-reference" href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">Imagen: ' + escape(token.content || new URL(url).hostname) + '</a>' : escape(token.content);
  };
  markdown.renderer.rules.fence = (tokens, index, options, env) => {
    const token = tokens[index];
    const number = env.codeIndex || 0;
    env.codeIndex = number + 1;
    let info;
    try { info = fenceMetadata(token.info, number); }
    catch { info = { name: 'bloque-' + (number + 1) + '.txt', language: '', namedByAuthor: false }; }
    return '<section class="code-block" data-code-index="' + number + '"><div class="code-toolbar"><span class="code-filename">' + escape(info.name) + '</span><span class="code-language">' + escape(info.language || 'texto') + '</span><button type="button" data-code-action="open">Abrir</button><button type="button" data-code-action="copy">Copiar</button><button type="button" data-code-action="download">Descargar</button></div><pre><code class="hljs">' + highlight(token.content, info.language) + '</code></pre></section>\n';
  };
  markdown.renderer.rules.table_open = () => '<div class="table-scroll" tabindex="0" role="region" aria-label="Tabla de la respuesta"><table>';
  markdown.renderer.rules.table_close = () => '</table></div>';
  function renderMarkdown(text) { return markdown.render(String(text ?? ''), { codeIndex: 0 }); }
  function codeFiles(text) {
    return markdown.parse(String(text ?? ''), {}).filter((token) => token.type === 'fence').map((token, index) => {
      const info = fenceMetadata(token.info, index);
      return { ...info, bytes: encoder.encode(token.content), origin: 'Código de la respuesta', mime: mimeTypes[extension(info.name)] || 'text/plain', text: token.content };
    });
  }
  function downloadUrl(artifact) {
    if (!artifact || typeof artifact.project_id !== 'string' || !/^[a-z0-9_.-]{1,128}$/i.test(artifact.project_id) ||
        typeof artifact.relative_path !== 'string' || !/^[a-f0-9]{64}$/i.test(artifact.sha256)) throw new Error('Faltan la referencia o el hash de la entrega.');
    safePath(artifact.relative_path);
    return '/api/artifacts/download?project_id=' + encodeURIComponent(artifact.project_id) +
      '&relative_path=' + encodeURIComponent(artifact.relative_path) + '&sha256=' + encodeURIComponent(artifact.sha256);
  }
  function artifactFile(artifact) {
    const name = artifact.relative_path || artifact.name;
    safePath(name);
    return { name, artifact, origin: 'Archivo entregado', mime: mimeTypes[extension(name)] || 'application/octet-stream', language: languageForExtension[extension(name)] || extension(name) };
  }
  function assertBundle(files) {
    if (!files.length || files.length > MAX_FILES) throw new Error('El paquete debe contener entre 1 y ' + MAX_FILES + ' archivos.');
    const seen = new Set();
    let total = 0;
    for (const file of files) {
      const name = safePath(file.name);
      if (seen.has(name)) throw new Error('Dos archivos se llaman «' + name + '». No se sobrescribirá ninguno.');
      seen.add(name);
      if (!(file.bytes instanceof Uint8Array)) throw new Error('El contenido del archivo no está cargado.');
      total += file.bytes.length;
      if (file.bytes.length > MAX_FILE_BYTES || total > MAX_BUNDLE_BYTES) throw new Error('El paquete supera el límite de memoria del visor. Descarga los archivos por separado.');
    }
  }
  function makeZip(files) {
    assertBundle(files);
    const entries = Object.create(null);
    for (const file of files) entries[file.name] = file.bytes;
    return zipLibrary.zipSync(entries, { level: 0 });
  }
  function unpackZip(bytes) {
    if (bytes.length > MAX_FILE_BYTES) throw new Error('El ZIP supera el límite del visor. Descárgalo para examinarlo.');
    let total = 0;
    let count = 0;
    const seen = new Set();
    const unpacked = zipLibrary.unzipSync(bytes, { filter: (entry) => {
      if (entry.name.endsWith('/')) return false;
      safePath(entry.name);
      total += entry.originalSize;
      if (++count > MAX_FILES || total > MAX_BUNDLE_BYTES || entry.originalSize > MAX_FILE_BYTES) throw new Error('El contenido expandido del ZIP supera el límite de seguridad.');
      if (seen.has(entry.name)) throw new Error('El ZIP contiene rutas duplicadas.');
      seen.add(entry.name);
      return true;
    } });
    const files = Object.entries(unpacked).map(([name, content]) => ({ name, bytes: content, origin: 'Contenido del ZIP', language: languageForExtension[extension(name)] || extension(name), mime: mimeTypes[extension(name)] || 'application/octet-stream' }));
    assertBundle(files);
    return files;
  }
  async function loadFile(file) {
    if (file.bytes) return file;
    if (!file.loading) file.loading = (async () => {
      const response = await fetch(downloadUrl(file.artifact), { credentials: 'same-origin', redirect: 'error' });
      if (!response.ok) throw new Error(response.status === 401 ? 'La sesión ha caducado.' : 'El servidor no ha podido verificar este archivo.');
      if (Number(response.headers.get('content-length')) > MAX_FILE_BYTES) {
        await response.body.cancel();
        throw new Error('El archivo supera los 8 MB del visor. Puedes descargarlo directamente.');
      }
      const reader = response.body.getReader();
      const chunks = [];
      let length = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > MAX_FILE_BYTES) { await reader.cancel(); throw new Error('El archivo supera el límite del visor.'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const actual = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
      if (actual !== file.artifact.sha256.toLowerCase()) throw new Error('El archivo recibido no coincide con el hash de la entrega.');
      file.bytes = bytes;
      file.verifiedHash = actual;
      return file;
    })();
    try { return await file.loading; } catch (error) { file.loading = null; throw error; }
  }
  function downloadBytes(bytes, name, mime) {
    const blob = new Blob([bytes], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name.split('/').pop();
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function downloadFile(file) {
    if (file.artifact) {
      const link = document.createElement('a');
      link.href = downloadUrl(file.artifact);
      link.download = file.name.split('/').pop();
      document.body.append(link);
      link.click();
      link.remove();
    } else downloadBytes(file.bytes, file.name, file.mime);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); notify('Copiado.'); }
    catch { notify('El navegador no permite copiar. Selecciona el texto para copiarlo.'); }
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, callback, className = 'result-button') {
    const node = element('button', className, text);
    node.type = 'button';
    node.addEventListener('click', () => {
      const result = callback();
      if (result && typeof result.catch === 'function') result.catch((error) => notify(error.message));
    });
    return node;
  }
  async function packageFiles(files, name = 'entrega.zip') {
    const loaded = [];
    let total = 0;
    for (const file of files) {
      await loadFile(file);
      total += file.bytes.length;
      if (total > MAX_BUNDLE_BYTES) throw new Error('La entrega es demasiado grande para empaquetarla en el navegador.');
      loaded.push(file);
    }
    downloadBytes(makeZip(loaded), name, 'application/zip');
    notify('ZIP preparado con ' + files.length + ' archivos.');
  }
  function attachResponse(container, text, artifacts = []) {
    let snippets = [];
    try { snippets = codeFiles(text); }
    catch (error) { container.append(element('p', 'result-warning', error.message + ' Se mantiene el texto; no se empaquetará con nombres inseguros.')); }
    container.querySelectorAll('[data-code-index]').forEach((block) => {
      const file = snippets[Number(block.dataset.codeIndex)];
      if (!file) { block.querySelectorAll('button').forEach((node) => { node.disabled = true; }); return; }
      block.querySelector('[data-code-action="copy"]').addEventListener('click', () => void copy(file.text));
      block.querySelector('[data-code-action="download"]').addEventListener('click', () => downloadFile(file));
      block.querySelector('[data-code-action="open"]').addEventListener('click', () => void open(snippets, Number(block.dataset.codeIndex)));
    });
    const files = [];
    for (const artifact of artifacts) {
      try { files.push(artifactFile(artifact)); }
      catch (error) { container.append(element('p', 'result-warning', error.message)); }
    }
    if (files.length) {
      const group = element('section', 'artifact-group');
      group.setAttribute('aria-label', 'Archivos de la entrega');
      const header = element('div', 'artifact-group-heading');
      header.append(element('span', '', files.length === 1 ? 'Archivo de la entrega' : files.length + ' archivos de la entrega'));
      if (files.length > 1) header.append(button('Descargar ZIP', () => packageFiles(files)));
      group.append(header);
      files.forEach((file, index) => {
        const card = element('article', 'artifact-card');
        const badge = element('span', 'artifact-type', extension(file.name).slice(0, 5).toUpperCase());
        const info = element('div', 'artifact-copy');
        info.append(element('strong', '', file.name), element('span', '', 'Archivo entregado · integridad SHA-256'));
        const controls = element('div', 'artifact-actions');
        controls.append(button('Abrir', () => open(files, index)), button('Descargar', () => downloadFile(file)));
        card.append(badge, info, controls);
        group.append(card);
      });
      container.append(group);
    }
    if (snippets.length) {
      const actions = element('div', 'response-actions');
      actions.append(button(snippets.length > 1 ? 'Empaquetar código · ZIP' : 'Abrir código', () => snippets.length > 1 ? packageFiles(snippets, 'codigo-respuesta.zip') : open(snippets, 0)));
      container.append(actions);
    }
  }
  function renderSources(container, sources) {
    if (!sources.length) return;
    const details = element('details', 'source-group');
    details.open = true;
    details.append(element('summary', '', 'Fuentes · ' + sources.length));
    const grid = element('div', 'source-grid');
    sources.forEach((source, index) => {
      const url = externalUrl(source.url);
      if (!url) return;
      const link = element('a', 'source-card');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.append(element('span', 'source-host', (index + 1) + ' · ' + new URL(url).hostname), element('strong', '', source.title || url));
      grid.append(link);
    });
    details.append(grid);
    container.append(details);
  }
  function releasePreview() {
    if (previewId) { void fetch('/api/previews/' + encodeURIComponent(previewId), { method: 'DELETE', credentials: 'same-origin', keepalive: true }).catch((error) => console.warn('La limpieza de la vista previa queda pendiente de su caducidad:', error.message)); previewId = null; }
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
    blobUrls = [];
  }
  function fileUrl(file) {
    const url = URL.createObjectURL(new Blob([file.bytes], { type: file.mime }));
    blobUrls.push(url);
    return url;
  }
  function fileText(file) { return file.text !== undefined ? file.text : decoder.decode(file.bytes); }
  function canPreview(file) {
    const ext = extension(file.name);
    return ['html', 'htm', 'md', 'svg', 'pdf', 'mp3', 'wav', 'ogg', 'mp4', 'webm'].includes(ext) || Boolean(imageTypes[ext]);
  }
  function relativeFile(base, reference, files) {
    if (!reference || /^[a-z][a-z\d+.-]*:|^\/\//i.test(reference) || reference.startsWith('/')) return null;
    const path = base.split('/').slice(0, -1);
    for (const part of reference.split(/[?#]/)[0].split('/')) {
      if (part === '..') { if (!path.length) return null; path.pop(); }
      else if (part && part !== '.') path.push(part);
    }
    return files.find((file) => file.name === path.join('/')) || null;
  }
  function dataUrl(file) {
    let binary = '';
    for (let index = 0; index < file.bytes.length; index += 8192) binary += String.fromCharCode(...file.bytes.subarray(index, index + 8192));
    return 'data:' + file.mime + ';base64,' + btoa(binary);
  }
  function buildHtmlPreview(entry, files) {
    const document = new DOMParser().parseFromString(fileText(entry), 'text/html');
    document.querySelectorAll('base,meta[http-equiv],iframe,frame,object,embed').forEach((node) => node.remove());
    const notices = new Set();
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const file = relativeFile(entry.name, link.getAttribute('href'), files);
      if (file && file.bytes) { const style = document.createElement('style'); style.textContent = fileText(file); link.replaceWith(style); }
      else { notices.add('Hojas de estilo externas o ausentes bloqueadas.'); link.remove(); }
    });
    document.querySelectorAll('script[src]').forEach((script) => {
      const file = relativeFile(entry.name, script.getAttribute('src'), files);
      if (file && file.bytes) { script.removeAttribute('src'); script.removeAttribute('integrity'); script.textContent = fileText(file); }
      else { notices.add('Scripts externos o ausentes bloqueados.'); script.remove(); }
    });
    document.querySelectorAll('img[src],source[src],video[src],audio[src]').forEach((node) => {
      const source = node.getAttribute('src');
      const file = relativeFile(entry.name, source, files);
      if (file && file.bytes) node.setAttribute('src', dataUrl(file));
      else if (!source.startsWith('data:')) { notices.add('Recursos externos o ausentes bloqueados.'); node.removeAttribute('src'); }
      node.removeAttribute('srcset');
    });
    return { html: '<!doctype html>\n' + document.documentElement.outerHTML, notices: [...notices] };
  }
  async function renderActive(mode) {
    const ticket = ++generation;
    releasePreview();
    const file = active.files[active.index];
    const stage = workspace.querySelector('#workspace-stage');
    stage.replaceChildren(element('p', 'workspace-empty', 'Cargando archivo…'));
    workspace.querySelector('#workspace-name').textContent = file.name;
    workspace.querySelector('#workspace-note').textContent = file.origin;
    workspace.querySelectorAll('[data-workspace-mode]').forEach((node) => node.setAttribute('aria-pressed', String(node.dataset.workspaceMode === mode)));
    workspace.querySelector('[data-workspace-mode="preview"]').disabled = !canPreview(file);
    try {
      await loadFile(file);
      if (ticket !== generation) return;
      const ext = extension(file.name);
      if (ext === 'zip' && mode !== 'source') {
        const children = unpackZip(file.bytes);
        active = { files: children, index: Math.max(0, children.findIndex((child) => /(^|\/)index\.html?$/i.test(child.name))), original: file };
        populateFiles();
        await renderActive(canPreview(active.files[active.index]) ? 'preview' : 'source');
        return;
      }
      stage.replaceChildren();
      workspace.querySelector('#workspace-note').textContent = file.origin + ' · ' + formatBytes(file.bytes.length) + (file.verifiedHash ? ' · SHA-256 comprobado' : '');
      if (mode === 'preview' && ['html', 'htm'].includes(ext)) {
        let totalBytes = 0;
        for (const sibling of active.files) {
          if (!sibling.bytes && sibling !== file) await loadFile(sibling);
          if (ticket !== generation) return;
          totalBytes += sibling.bytes.length;
          if (totalBytes > MAX_BUNDLE_BYTES) throw new Error('El proyecto supera el límite del visor. Descarga el paquete para abrirlo localmente.');
        }
        const result = buildHtmlPreview(file, active.files);
        const created = await request('/api/previews', { method: 'POST', body: JSON.stringify({ html: result.html }) });
        if (ticket !== generation) { void fetch('/api/previews/' + encodeURIComponent(created.id), { method: 'DELETE', credentials: 'same-origin' }).catch((error) => console.warn('La vista previa caducará automáticamente:', error.message)); return; }
        previewId = created.id;
        const frame = element('iframe', 'artifact-frame');
        frame.title = 'Vista previa aislada de ' + file.name;
        frame.setAttribute('sandbox', 'allow-scripts');
        frame.setAttribute('referrerpolicy', 'no-referrer');
        frame.src = '/api/previews/' + encodeURIComponent(created.id);
        stage.append(frame);
        workspace.querySelector('#workspace-note').textContent = 'Vista previa aislada; no es un despliegue. ' + result.notices.join(' ');
      } else if (mode === 'preview' && ext === 'md') {
        const view = element('article', 'document-preview message-body');
        view.innerHTML = renderMarkdown(fileText(file));
        view.querySelectorAll('.code-toolbar button').forEach((node) => node.remove());
        stage.append(view);
      } else if (mode === 'preview' && (imageTypes[ext] || ext === 'svg')) {
        const image = element('img', 'artifact-image');
        image.alt = file.name;
        image.src = fileUrl(file);
        stage.append(image);
      } else if (mode === 'preview' && ext === 'pdf') {
        if (new TextDecoder().decode(file.bytes.slice(0, 5)) !== '%PDF-') throw new Error('El contenido no tiene cabecera PDF. Descárgalo para inspeccionarlo.');
        const frame = element('iframe', 'artifact-frame');
        frame.title = 'PDF: ' + file.name;
        frame.src = fileUrl(file);
        stage.append(frame);
      } else if (mode === 'preview' && /^(audio|video)\//.test(file.mime)) {
        const player = element(file.mime.startsWith('audio/') ? 'audio' : 'video', 'artifact-media');
        player.controls = true;
        player.preload = 'metadata';
        player.src = fileUrl(file);
        stage.append(player);
      } else if (file.text !== undefined || textExtensions.has(ext) || file.mime.startsWith('text/')) {
        const pre = element('pre', 'workspace-code');
        const code = element('code', 'hljs');
        code.innerHTML = highlight(fileText(file), file.language || languageForExtension[ext] || ext);
        pre.append(code);
        stage.append(pre);
      } else {
        stage.append(element('p', 'workspace-empty', 'Este formato se entrega como archivo descargable. No se convierte ni se ejecuta dentro del chat.'));
      }
    } catch (error) {
      if (ticket !== generation) return;
      stage.replaceChildren(element('p', 'workspace-empty result-warning', error.message));
      workspace.querySelector('#workspace-note').textContent = 'Vista previa no disponible. El archivo original no se ha modificado.';
    }
  }
  function populateFiles() {
    const select = workspace.querySelector('#workspace-files');
    select.replaceChildren();
    active.files.forEach((file, index) => { const option = element('option', '', file.name); option.value = String(index); select.append(option); });
    select.value = String(active.index);
    workspace.querySelector('#workspace-bundle').hidden = active.files.length < 2 && !active.original;
  }
  async function open(files, index = 0) {
    if (!workspace) throw new Error('El visor no está inicializado.');
    focusReturn = document.activeElement;
    active = { files, index };
    workspace.hidden = false;
    document.body.classList.add('workspace-open');
    populateFiles();
    workspace.querySelector('#workspace-close').focus();
    const ext = extension(files[index].name);
    await renderActive(canPreview(files[index]) || ext === 'zip' ? 'preview' : 'source');
  }
  function close() {
    generation += 1;
    releasePreview();
    if (!workspace) return;
    workspace.hidden = true;
    workspace.querySelector('#workspace-stage').replaceChildren();
    document.body.classList.remove('workspace-open');
    active = null;
    if (focusReturn && focusReturn.isConnected) focusReturn.focus();
  }
  function init({ toast, apiRequest }) {
    notify = toast;
    request = apiRequest;
    workspace = document.getElementById('artifact-workspace');
    workspace.querySelector('#workspace-close').addEventListener('click', close);
    workspace.querySelector('#workspace-files').addEventListener('change', (event) => { if (!active) return; active.index = Number(event.target.value); void renderActive(canPreview(active.files[active.index]) ? 'preview' : 'source'); });
    workspace.querySelectorAll('[data-workspace-mode]').forEach((node) => node.addEventListener('click', () => { if (active) void renderActive(node.dataset.workspaceMode); }));
    workspace.querySelector('#workspace-download').addEventListener('click', () => { if (active) downloadFile(active.files[active.index]); });
    workspace.querySelector('#workspace-bundle').addEventListener('click', () => { if (active.original) downloadFile(active.original); else void packageFiles(active.files).catch((error) => notify(error.message)); });
    workspace.querySelector('#workspace-expand').addEventListener('click', () => { const expanded = document.body.classList.toggle('workspace-expanded'); workspace.querySelector('#workspace-expand').setAttribute('aria-pressed', String(expanded)); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && active && !document.querySelector('dialog[open]')) close(); });
    window.addEventListener('pagehide', releasePreview);
  }
  return { renderMarkdown, codeFiles, safePath, fenceMetadata, makeZip, unpackZip, formatBytes, externalUrl, downloadUrl, artifactFile, relativeFile, buildHtmlPreview, attachResponse, renderSources, init, open, close, highlight };
});
