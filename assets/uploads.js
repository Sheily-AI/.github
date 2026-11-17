(function (root) {
  'use strict';
  function scopeQuery(scope) {
    if (!scope || !scope.sessionId || !scope.conversationId) throw new Error('Falta la conversación del adjunto.');
    return new URLSearchParams({ session_id: scope.sessionId, conversation_id: scope.conversationId });
  }
  async function checked(response) {
    const raw = await response.text();
    let body = {};
    if (raw) {
      try { body = JSON.parse(raw); } catch { body = { error: raw.slice(0, 180) }; }
    }
    if (!response.ok) throw new Error(body.reason || body.failure_reason || body.error || 'No se ha podido guardar el adjunto.');
    return body;
  }
  async function upload(attachment, scope) {
    const scopeKey = JSON.stringify([scope.sessionId, scope.conversationId]);
    if (attachment.attachment_id && attachment.uploadScope === scopeKey) return attachment;
    const original = attachment.file instanceof Blob ? attachment.file : new Blob([String(attachment.content ?? '')], { type: attachment.type || 'text/plain' });
    const query = scopeQuery(scope);
    query.set('filename', attachment.name);
    query.set('media_type', original.type || 'application/octet-stream');
    const record = await checked(await fetch('/api/attachments?' + query, {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/octet-stream' }, body: original,
    }));
    if (!/^[a-f0-9]{32}$/.test(record.attachment_id) || !/^[a-f0-9]{64}$/.test(record.sha256) || record.size_bytes !== original.size) throw new Error('El recibo de carga no coincide con el archivo.');
    const hash = await digest(new Uint8Array(await original.arrayBuffer()));
    if (hash !== record.sha256) throw new Error('El archivo recibido no conserva el hash original.');
    Object.assign(attachment, record, { uploadScope: scopeKey });
    return attachment;
  }
  async function digest(bytes) {
    if (!root.crypto?.subtle) throw new Error('El navegador no dispone de verificación criptográfica.');
    const hash = new Uint8Array(await root.crypto.subtle.digest('SHA-256', bytes));
    return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  async function list(scope) {
    const result = await checked(await fetch('/api/attachments?' + scopeQuery(scope), { credentials: 'same-origin' }));
    return result.attachments;
  }
  async function original(attachment, scope) {
    let bytes;
    if (attachment.file instanceof Blob) bytes = new Uint8Array(await attachment.file.arrayBuffer());
    else if (attachment.attachment_id) {
      const response = await fetch('/api/attachments/' + encodeURIComponent(attachment.attachment_id) + '/original?' + scopeQuery(scope), { credentials: 'same-origin' });
      if (!response.ok) throw new Error('El original no está disponible en esta conversación.');
      bytes = new Uint8Array(await response.arrayBuffer());
    } else bytes = new TextEncoder().encode(String(attachment.content ?? ''));
    if (attachment.sha256 && await digest(bytes) !== attachment.sha256) throw new Error('La integridad del original no coincide.');
    return { name: attachment.name || attachment.filename, bytes, mime: attachment.type || attachment.media_type || 'application/octet-stream', origin: 'Original del usuario' };
  }
  root.SheilyUploads = Object.freeze({ upload, list, original, digest });
})(globalThis);
