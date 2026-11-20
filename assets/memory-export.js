'use strict';

/* Exports authored memory content, never the screen's abbreviated summaries. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./vendor/fflate.min.js'));
  else root.SheilyMemoryExport = factory(root.fflate);
})(globalThis, function (zip) {
  const encoder = new TextEncoder();
  const MAX_PACKAGE_BYTES = 64 * 1024 * 1024;
  const kinds = {
    episodic: 'Experiencia',
    semantic: 'Conocimiento',
    procedural: 'Procedimiento',
    failure: 'Fallo / Antipatrón',
    prospective: 'Prospectiva',
    autobiographical: 'Autobiográfica',
    implicit: 'Implícita'
  };
  const labels = { query: 'Tu mensaje', response: 'Respuesta guardada', content: 'Contenido', title: 'Título original', name: 'Nombre', definition: 'Definición', proposition: 'Afirmación', text: 'Texto', description: 'Descripción', context: 'Contexto', skill_name: 'Procedimiento', summary: 'Resumen guardado', properties: 'Datos estructurados', strategy: 'Procedimiento completo', steps: 'Pasos', objective: 'Objetivo', subject: 'Tema', predicate: 'Relación', value: 'Dato', scope: 'Ámbito', preconditions: 'Condiciones previas', postconditions: 'Resultado esperado', action: 'Acción', expected_result: 'Resultado esperado', verification: 'Comprobación', relations: 'Relaciones', source_quotes: 'Evidencia de origen' };
  const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  function hasContent(value) {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.some(hasContent);
    if (value && typeof value === 'object') return Object.values(value).some(hasContent);
    return value !== null && value !== undefined;
  }
  function requireDocument(doc) {
    if (!doc || typeof doc !== 'object' || !doc.content || typeof doc.content !== 'object' || Array.isArray(doc.content) || doc.content_truncated !== false || typeof doc.memory_id !== 'string' || !doc.memory_id) {
      throw new Error('El motor no ha entregado el contenido íntegro del recuerdo. No se exportará una lista de referencias.');
    }
  }
  function validate(body) {
    if (!body || body.schema !== 'shei.personal.memory_export/v2' || body.complete !== true || body.content_truncated !== false || !Array.isArray(body.memories) || body.count !== body.memories.length || !body.scope || typeof body.exported_at !== 'string' || !/^[a-f0-9]{64}$/.test(body.snapshot_sha256)) {
      throw new Error('La exportación no tiene un contrato completo y verificable. No se generará una copia parcial.');
    }
    const ids = new Set();
    for (const doc of body.memories) {
      requireDocument(doc);
      const key = doc.memory_kind + ':' + doc.memory_id;
      if (ids.has(key)) throw new Error('El motor ha devuelto identificadores duplicados. La exportación se ha detenido.');
      ids.add(key);
    }
    for (const kind of Object.keys(kinds)) {
      if (body.counts_by_kind?.[kind] !== body.memories.filter((doc) => doc.memory_kind === kind).length) throw new Error('Los recuentos de la exportación no coinciden con sus archivos.');
    }
    return body;
  }
  function readable(value, depth = 0) {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return 'No registrado';
    if (Array.isArray(value)) return value.map((item, index) => (index + 1) + '. ' + readable(item, depth + 1)).join('\n\n');
    if (typeof value === 'object') return Object.entries(value).map(([key, item]) => (labels[key] || key) + ': ' + readable(item, depth + 1)).join('\n');
    return String(value);
  }
  function verbatim(text) {
    const runs = String(text).match(/`+/g) || [];
    const fence = '`'.repeat(Math.max(3, ...runs.map((run) => run.length + 1)));
    return fence + 'text\n' + text + '\n' + fence;
  }
  function provenance(doc) {
    const p = doc.provenance || {};
    const rows = [
      ['Tipo', kinds[doc.memory_kind] || doc.memory_kind],
      ['Fecha registrada', doc.timestamp || 'No registrada'],
      ['Estado de validación', p.validation_status || p.epistemic_status || 'No evaluado; guardar un recuerdo no demuestra que sea cierto'],
      ['Sesión de origen', p.source_session_id || 'No registrada'],
      ['Revisión', p.revision ?? 'No registrada'],
      ['Identificador', doc.memory_id],
      ['Referencia canónica', p.canonical_ref || doc.canonical_ref || 'No registrada'],
    ];
    if (p.source_content_hash) rows.push(['Hash de contenido declarado por el motor', p.source_content_hash]);
    if (doc.export_content_sha256) rows.push(['Hash del contenido público exportado', doc.export_content_sha256]);
    if (p.source_memory_ids?.length) rows.push(['Recuerdos de origen', p.source_memory_ids.join(', ')]);
    if (doc.source_resolution?.some((source) => source.status === 'not_in_snapshot')) rows.push(['Referencias no incluidas', 'Algunas fuentes no están en esta copia. No se ha inventado su contenido.']);
    return rows;
  }
  function sections(doc) {
    requireDocument(doc);
    return Object.entries(doc.content).filter(([, value]) => hasContent(value)).map(([name, value]) => ({ title: labels[name] || name, text: readable(value) }));
  }
  function documentMarkdown(doc, level = 1) {
    const heading = '#'.repeat(level);
    const result = [heading + ' ' + String(doc.title || kinds[doc.memory_kind] || 'Recuerdo').replace(/\s+/g, ' ').trim()];
    for (const section of sections(doc)) result.push(heading + '# ' + section.title, verbatim(section.text));
    if (!hasContent(doc.content)) result.push('El motor no conserva contenido legible para este registro. Solo hay información de procedencia.');
    result.push(heading + '# Procedencia y detalles', ...provenance(doc).map(([name, value]) => name + ': ' + value));
    return result.join('\n\n') + '\n';
  }
  function reportMarkdown(body) {
    validate(body);
    return ['# Memoria de Sheily',
      'Fecha de la copia: ' + body.exported_at,
      'Ámbito: memoria principal recuperable. ' + body.count + ' registros.',
      'Esta copia contiene los textos guardados y su procedencia, no afirmaciones verificadas automáticamente. No es una copia de seguridad de todo Sheily ni un archivo de restauración.',
      ...body.memories.map((doc) => documentMarkdown(doc, 2)),
    ].join('\n\n');
  }
  function reportHtml(body) {
    validate(body);
    const entries = body.memories.map((doc, index) => {
      const content = sections(doc).map((section) => '<section><h3>' + escape(section.title) + '</h3><pre>' + escape(section.text) + '</pre></section>').join('');
      const details = provenance(doc).map(([name, value]) => '<dt>' + escape(name) + '</dt><dd>' + escape(value) + '</dd>').join('');
      const sources = (doc.source_memory_ids || []).map((id) => {
        const target = body.memories.findIndex((entry) => entry.memory_id === id);
        return target >= 0 ? '<a href="#recuerdo-' + target + '">' + escape(id) + '</a>' : '<span>' + escape(id) + ' (no incluido)</span>';
      }).join(' · ');
      return '<article id="recuerdo-' + index + '"><p class="kind">' + (index + 1) + ' · ' + escape(kinds[doc.memory_kind] || doc.memory_kind) + '</p><h2>' + escape(doc.title || 'Recuerdo') + '</h2>' + (content || '<p>No hay contenido legible registrado.</p>') + (sources ? '<p>Recuerdos de origen: ' + sources + '</p>' : '') + '<details><summary>Procedencia y detalles técnicos</summary><dl>' + details + '</dl></details></article>';
    }).join('');
    const excluded = (body.scope.excluded_stores || []).map((value) => '<li>' + escape(value) + '</li>').join('');
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>Memoria de Sheily</title><style>body{font:16px/1.7 system-ui,sans-serif;color:#292a25;background:#faf9f6;margin:auto;padding:48px 24px;max-width:900px}h1{font:48px/1.2 Georgia,serif}h2{font:28px/1.3 Georgia,serif}h3{font-size:14px;color:#526450;margin:28px 0 10px}article{border-top:1px solid #dddcd5;padding:35px 0}.kind,dt,footer{font-size:12px;color:#686c60}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.8 system-ui,sans-serif;margin:0}details{margin-top:24px}summary{cursor:pointer}dd{margin:0 0 12px;overflow-wrap:anywhere}a{color:#395e49}nav{padding:20px;background:#eeeee7;border-radius:12px}nav p{margin:0} @media print{body{max-width:none;padding:0}article{break-inside:auto}details{display:block}}</style></head><body><header><p>SHEILY · COPIA PERSONAL</p><h1>Tu memoria, completa y legible.</h1><p>' + body.count + ' registros · ' + escape(body.exported_at) + '</p><nav><p>Incluye experiencias, conocimientos y procedimientos recuperables. Es una copia de los contenidos guardados, no una certificación de que sean ciertos. No incluye:</p><ul>' + excluded + '</ul><p>Para buscar, utiliza la búsqueda del navegador. Este documento funciona sin conexión y no ejecuta código ni carga recursos externos.</p></nav></header>' + entries + '<footer>Datos privados. Las copias descargadas no se borran automáticamente cuando se olvida un recuerdo en Sheily.</footer></body></html>';
  }
  async function sha256(bytes) {
    const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  async function buildPackage(body) {
    validate(body);
    const files = Object.create(null);
    files['LEEME.txt'] = encoder.encode('MEMORIA PERSONAL DE SHEILY\n\nAbre recuerdos.html para leer el contenido sin conexión.\nrecuerdos.md contiene una copia legible en texto.\nmemoria.json conserva los contenidos públicos completos y la procedencia.\nmanifest.json declara alcance, recuentos y hashes SHA-256 de los archivos.\n\nNo es una copia de seguridad de todo Sheily. No hay un importador ni una restauración automática. Los registros olvidados, caducados y las revisiones sustituidas no se incluyen. Las credenciales y los metadatos internos de autoridad están excluidos.\n\nLa conservación y el hash no prueban que un recuerdo sea cierto. No se inventan textos ni fuentes ausentes. Esta descarga contiene datos privados; consérvala de forma segura. Olvidar un recuerdo en Sheily no elimina las copias ya descargadas.\n');
    files['recuerdos.html'] = encoder.encode(reportHtml(body));
    files['recuerdos.md'] = encoder.encode(reportMarkdown(body));
    files['memoria.json'] = encoder.encode(JSON.stringify(body, null, 2) + '\n');
    const total = Object.values(files).reduce((sum, bytes) => sum + bytes.length, 0);
    if (total > MAX_PACKAGE_BYTES) throw new Error('La copia supera 64 MiB. No se ha descargado un ZIP parcial.');
    const inventory = [];
    for (const [name, bytes] of Object.entries(files)) inventory.push({ name, size_bytes: bytes.length, sha256: await sha256(bytes) });
    const manifest = { schema: 'shei.personal.memory_package/v1', exported_at: body.exported_at, scope: body.scope, count: body.count, counts_by_kind: body.counts_by_kind, complete: true, source_snapshot_sha256: body.snapshot_sha256, files: inventory };
    files['manifest.json'] = encoder.encode(JSON.stringify(manifest, null, 2) + '\n');
    return { bytes: zip.zipSync(files, { level: 0 }), manifest, files };
  }
  function download(bytes, filename, mime) {
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return { validate, hasContent, sections, documentMarkdown, reportMarkdown, reportHtml, buildPackage, download, sha256 };
});
