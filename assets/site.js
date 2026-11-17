'use strict';

const PERSONAL_CONVERSATION_KEY = 'sheily.personal.conversation.v1';
const PERSONAL_OWNER_SESSION = 'personal-owner-v1';
const MAX_TITLE_LENGTH = 72;

const state = {
  authenticated: false,
  ownerSetupRequired: false,
  busy: false,
  view: 'chat',
  sessionId: '',
  conversationId: '',
  conversationLoadId: 0,
  conversationTitle: 'Nueva conversación',
  conversations: [],
  conversationsRequestId: 0,
  query: '',
  memories: [],
  memoryQuery: '',
  memoryTab: 'notes',
  learningTab: 'sources',
  authEpoch: 0,
  notes: [],
  notesQuery: '',
  notesRequestId: 0,
  notesVerified: false,
  notesLoading: false,
  notesCapabilities: null,
  notesOwnerBinding: '',
  notesScope: '',
  notesOffset: 0,
  notesHasMore: false,
  notesIncludeHistory: false,
  notesSelected: [],
  noteRead: null,
  noteReadRequestId: 0,
  noteEditing: null,
  noteReplaces: [],
  noteEditorOwner: '',
  noteEditorScope: '',
  noteWriteRequest: null,
  noteWriteBusy: false,
  controlAccess: null,
  controlRequestId: 0,
  adminBusy: false,
  systemRequestId: 0,
  connectomeRequestId: 0,
  connectomePollTimer: null,
  inferenceSelection: null,
  inferenceOptions: [],
  inferenceVerified: false,
  inferenceOptionsVerified: false,
  inferenceScope: '',
  inferenceRequestId: 0,
  inferenceBusy: false,
  inferenceLoading: false,
  inferenceNeedsRefresh: true,
  lifelongMemorySourceQuery: '',
  lifelongMemorySourceMode: 'archive',
  lifelongMemoryCanonicalSelected: [],
  lifelongMemoryHistory: [],
  lifelongMemoryHistoryVersion: '',
  lifelongMemoryHistoryNext: 0,
  lifelongMemoryHistoryHasMore: false,
  lifelongMemoryHistoryRequestId: 0,
  lifelongMemoryJobRequestId: 0,
  tidexRequestId: 0, tidexPollTimer: null, tidexJob: null, tidexSources: [],
  tidexGroups: [], tidexOperation: null, tidexWriteRequest: null, tidexBusy: false,
  vaultStatusKnown: false,
  vaultStatusRequestId: 0,
  vaultReadGeneration: 0,
  vaultDeadlineTimer: null,
  vaultDiscardRecording: false,
  memoryKind: 'all',
  memoryRequestId: 0,
  memorySnapshot: null,
  memoryNextOffset: null,
  memoryDetailRequestId: 0,
  memorySearchTimer: null,
  lifelongMemoryStatus: null,
  lifelongMemorySources: [],
  lifelongMemorySelectedSources: [],
  lifelongMemoryRequestId: 0,
  lifelongMemorySourceRequestId: 0,
  lifelongMemoryTrainingBusy: false,
  lifelongMemoryTrainingRequest: null,
  lifelongMemoryReadSource: null,
  lifelongMemoryAttachBusy: false,
  conversationSearchTimer: null,
  vaultSearchTimer: null,
  toastTimer: null,
  renameConversationId: '',
  confirmResolve: null,
  cognitiveMode: 'balanced',
  attachments: [],
  vaultConfigured: false,
  vaultUnlocked: false,
  vaultPasscodeHint: '',
  vaultUpdatedAt: null,
  vaultItems: [],
  vaultCategory: 'all',
  vaultFolder: 'all',
  vaultContainers: [],
  vaultEditingContainerId: '',
  vaultSort: 'date_desc',
  vaultQuery: '',
  vaultPinnedOnly: false,
  vaultLayout: 'grid',
  vaultEditingId: '',
  vaultPendingFile: null,
  vaultRecording: false,
  vaultMediaRecorder: null,
  vaultAudioChunks: [],
  personalSettings: null,
  documents: [],
  documentsRequestId: 0,
  inspectorRequestId: 0,
  lastTurnCorrelationId: '',
  lastTurn: null,
};

const icons = {
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4-.8L19 8.2a2.1 2.1 0 0 0-3-3L5 16.2Z"/><path d="m14.5 6.5 3 3"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 20h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7"/><path d="M10 11v5m4-5v5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></svg>',
};

function $(id) {
  return typeof document === 'undefined' ? null : document.getElementById(id);
}

function randomId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'personal-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

function storageGet(key) {
  try {
    return globalThis.localStorage ? globalThis.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    if (globalThis.localStorage) globalThis.localStorage.setItem(key, value);
  } catch {
    // A private browsing policy may disable storage. The current session still works.
  }
}

function activeConversationId() {
  const existing = storageGet(PERSONAL_CONVERSATION_KEY);
  if (existing) return existing;
  const value = randomId();
  storageSet(PERSONAL_CONVERSATION_KEY, value);
  return value;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeExternalUrl(raw) {
  try {
    const value = new URL(raw, 'https://invalid.local');
    if (!['http:', 'https:'].includes(value.protocol)) return '';
    return raw;
  } catch {
    return '';
  }
}

function compactText(raw, max = MAX_TITLE_LENGTH) {
  const text = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

function formatRelativeDate(value, now = Date.now()) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const difference = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (difference < minute) return 'Ahora';
  if (difference < hour) return 'Hace ' + Math.max(1, Math.floor(difference / minute)) + ' min';
  if (difference < day) return 'Hace ' + Math.floor(difference / hour) + ' h';
  if (difference < 7 * day) return 'Hace ' + Math.floor(difference / day) + ' d';
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(new Date(timestamp));
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text };
  }
}

async function apiRequest(path, options = {}) {
  const authEpoch = state.authEpoch;
  const privateRead = path.startsWith('/api/tidex/') || path.startsWith('/api/admin/') || (path.startsWith('/api/vault/') && !['/api/vault/status', '/api/vault/setup', '/api/vault/unlock', '/api/vault/lock'].includes(path));
  const privateGeneration = state.vaultReadGeneration;
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await parseResponse(response);
  // A locked private control must not log the user out of the public SHEILY chat.
  // A later ordinary authenticated request can independently establish a lost console session.
  if (response.status === 401 && privateRead && authEpoch === state.authEpoch) {
    clearVaultSensitiveView('La zona privada necesita un nuevo desbloqueo.');
    const error = new Error('Desbloquea la zona privada para consultar o gestionar esta función.');
    error.code = 'PRIVATE_AUTH_REQUIRED';
    error.status = 401;
    throw error;
  }
  if (response.status === 401 || authEpoch !== state.authEpoch) {
    clearVaultSensitiveView('La sesión ha caducado. Vuelve a iniciar sesión.');
    const error = new Error('Necesitas iniciar sesión.');
    error.code = 'AUTH_REQUIRED';
    throw error;
  }
  if (path === '/api/chat' && response.status === 428 && deliveryKind(body) === 'confirmation') return body;
  if (!response.ok || body.ok === false) {
    const detail = body.error && typeof body.error === 'object' ? body.error : null;
    const message = typeof body.error === 'string' ? body.error : detail?.message;
    const error = new Error(message || body.reason || body.failure_reason || 'No se ha podido completar la solicitud.');
    const publicFailure = body.schema === 'shei.public.failure.envelope/v1';
    error.code = [body.code, detail?.code, publicFailure ? body.error : null]
      .find((value) => typeof value === 'string' && value.trim()) || 'REQUEST_FAILED';
    error.status = response.status;
    error.turnDisposition = response.headers?.get?.('x-sheily-turn-disposition') || '';
    // A rejected delivery does not establish whether execution started. Keep
    // the public API's evidence-backed fields separate from the HTTP status.
    error.terminalErrorCode = publicFailure && typeof body.terminal_error_code === 'string'
      ? body.terminal_error_code : '';
    error.failurePhase = publicFailure && typeof body.failure_phase === 'string'
      ? body.failure_phase : '';
    error.executionStarted = publicFailure && typeof body.execution_started === 'boolean'
      ? body.execution_started : null;
    error.correlationId = response.headers?.get?.('x-correlation-id') ||
      (typeof body.correlation_id === 'string' ? body.correlation_id : '');
    error.details = body.details || detail?.details || null;
    error.incidentId = typeof body.incident_id === 'string' ? body.incident_id :
      (typeof detail?.incident_id === 'string' ? detail.incident_id : '');
    if (privateRead && [401, 403, 423].includes(response.status)) clearVaultSensitiveView(error.message);
    throw error;
  }
  if (((privateRead || path.startsWith('/api/admin/')) && privateGeneration !== state.vaultReadGeneration) || (privateRead && !state.vaultUnlocked)) {
    const error = new Error('La autorización privada cambió durante la operación. Desbloquea de nuevo para consultarla.');
    error.code = 'PRIVATE_VIEW_INVALIDATED';
    throw error;
  }
  return body;
}

function showAccess(setupRequired = state.ownerSetupRequired) {
  state.ownerSetupRequired = Boolean(setupRequired);
  state.authEpoch++;
  state.authenticated = false;
  clearVaultSensitiveView();
  state.notesRequestId++; state.noteReadRequestId++; state.lifelongMemoryRequestId++; state.lifelongMemorySourceRequestId++;
  state.lifelongMemoryHistoryRequestId++; state.lifelongMemoryJobRequestId++; state.systemRequestId++; state.inferenceRequestId++;
  state.inferenceSelection = null; state.inferenceOptions = []; state.inferenceVerified = false; state.inferenceOptionsVerified = false; state.inferenceNeedsRefresh = true;
  renderInferenceSelection();
  state.notes = []; state.notesSelected = []; state.notesVerified = false; state.notesCapabilities = null; state.notesOwnerBinding = '';
  state.noteRead = null; state.noteEditing = null; state.noteReplaces = []; state.noteWriteRequest = null;
  state.lifelongMemoryHistory = []; state.lifelongMemoryReadSource = null; state.lifelongMemoryCanonicalSelected = []; state.lifelongMemorySelectedSources = [];
  for (const id of ['note-reader-dialog', 'note-editor-dialog']) if ($(id)?.open) $(id).close();
  for (const id of ['note-reader-text', 'notes-list', 'lifelong-memory-history-list', 'lifelong-memory-source-text', 'lifelong-memory-job-facts', 'note-versions-list']) $(id)?.replaceChildren();
  for (const id of ['note-editor-title', 'note-editor-text']) if ($(id)) $(id).value = '';
  $('app-shell').hidden = true;
  $('access-screen').hidden = false;
  $('access-title').textContent = state.ownerSetupRequired ? 'Crea tu contraseña' : 'Bienvenido a SHEILY';
  $('access-copy').textContent = state.ownerSetupRequired
    ? 'Es el primer acceso. Crea una contraseña personal de al menos 12 caracteres, con letras y números.'
    : 'Introduce tu contraseña personal para acceder. Se convertirá en una sesión segura y no se guardará en este navegador.';
  $('access-token-label').textContent = state.ownerSetupRequired ? 'Nueva contraseña' : 'Contraseña';
  $('access-token').autocomplete = state.ownerSetupRequired ? 'new-password' : 'current-password';
  $('access-confirm-wrap').hidden = !state.ownerSetupRequired;
  $('access-confirm').required = state.ownerSetupRequired;
  $('access-submit').textContent = state.ownerSetupRequired ? 'Crear contraseña y entrar' : 'Entrar en mi espacio';
  setTimeout(() => $('access-token').focus(), 0);
}

function showApp() {
  state.authenticated = true;
  $('access-screen').hidden = true;
  $('app-shell').hidden = false;
}

function toast(message) {
  const element = $('toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => element.classList.remove('is-visible'), 2600);
}

function setConnected(connected) {
  $('connection-label').textContent = connected ? 'Conectado' : 'Sin conexión';
  $('availability-label').textContent = connected ? 'Sesión conectada' : 'Sin conexión';
  $('availability').dataset.connected = String(connected);
}

function setView(view, options = {}) {
  if (!WORKSPACE_VIEWS.includes(view)) view = 'chat';
  state.view = view;
  if (view !== 'system' && state.connectomePollTimer) {
    clearTimeout(state.connectomePollTimer);
    state.connectomePollTimer = null;
  }
  if (view !== 'chat') {
    SheilyResults.close();
    closeContextInspector();
  }
  document.querySelectorAll('[data-page]').forEach((element) => {
    const active = element.dataset.page === view;
    element.hidden = !active;
    element.classList.toggle('is-active', active);
  });
  document.querySelectorAll('[data-view]').forEach((button) => {
    if (button.closest('.profile-button')) return;
    if (button.dataset.view === view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const labels = {chat: state.conversationTitle, conversations: 'Historial de conversaciones', memory: 'Memoria y versiones',
    documents: 'Documentos de esta conversación', learning: 'Aprendizaje', vault: 'Custodia Privada',
    system: 'Estado del sistema', admin: 'Administración', settings: 'Ajustes'};
  $('page-title').textContent = labels[view] || 'SHEILY';
  if ($('mode-selector-wrap')) $('mode-selector-wrap').hidden = view !== 'chat';
  document.title = 'SHEILY · ' + (labels[view] || 'Tu espacio personal');
  closeSidebar();
  const tabs = WORKSPACE_TABS[view];
  const tab = tabs ? (tabs.includes(options.tab) ? options.tab : state[view + 'Tab']) : '';
  if (options.address !== false) updateWorkspaceAddress(view, tab, options.replace === true);
  if (options.focus) $('page-title').focus({preventScroll: true});
  if (view === 'conversations') { renderConversationList(); void refreshConversationHistory(); }
  if (view === 'documents') void loadConversationDocuments();
  if (tabs) activateWorkspaceTab(view, tab, {address: false});
  if (view === 'learning') { void loadLifelongMemoryPanel(); void loadLifelongMemoryHistory(); void loadInferenceSelection(); }
  if (view === 'vault') void loadVaultView();
  if (view === 'system') { void loadSystemStatus(); void loadObservedConnectome(); }
  if (view === 'admin') void loadControlAccess();
  if (view === 'settings') void loadSettingsView();
}

function openSidebar() {
  if (matchMedia('(min-width: 821px)').matches) {
    document.body.classList.toggle('sidebar-collapsed');
    $('menu-button').setAttribute('aria-expanded', String(!document.body.classList.contains('sidebar-collapsed')));
  } else {
    document.body.classList.add('sidebar-open');
    $('menu-button').setAttribute('aria-expanded', 'true');
  }
}

function closeSidebar() {
  document.body.classList.remove('sidebar-open');
  if (!matchMedia('(min-width: 821px)').matches) $('menu-button').setAttribute('aria-expanded', 'false');
}

function setWelcomeVisible(visible) {
  $('welcome').hidden = !visible;
}

function historicalTurnNotice(status) {
  switch (status) {
    case 'REJECTED':
      return 'La solicitud no se completó. No hay una respuesta guardada. Puedes continuar el chat.';
    case 'ABANDONED':
      return 'La solicitud se interrumpió. No hay una respuesta guardada. Puedes continuar el chat.';
    case 'PENDING':
      return 'Este turno figura pendiente. Todavía no hay una respuesta guardada.';
    case 'DELIVERY_UNKNOWN':
      return 'Se perdió el canal de entrega. El turno pudo continuar, pero no hay una respuesta pública confirmada y no se reenviará automáticamente.';
    default:
      return '';
  }
}

function chatFailureDisposition(error, requestDispatchedWithoutResponse) {
  if (!requestDispatchedWithoutResponse) return 'FAILED';
  // The console only emits this header after it has received the upstream
  // response and durably classified the attempt as rejected.  A 5xx without
  // it remains ambiguous because the governed turn may still be executing.
  if (error?.turnDisposition === 'rejected') return 'FAILED';
  const code = String(error?.code || '');
  if (['AUTH_REQUIRED', 'PRIVATE_AUTH_REQUIRED', 'PRIVATE_VIEW_INVALIDATED'].includes(code)) {
    return 'FAILED';
  }
  const status = Number(error?.status);
  if (!Number.isFinite(status) || status >= 500 || [
    'upstream_unreachable',
    'upstream_invalid_json',
    'verified_journal_observer_busy',
    'console_shutting_down',
  ].includes(code)) {
    return 'DELIVERY_UNKNOWN';
  }
  return 'FAILED';
}

function operationalTurnCopy(status, error = null) {
  if (status === 'DELIVERY_UNKNOWN') {
    return {
      title: 'Entrega no confirmada',
      detail: 'Se perdió el canal de respuesta después de despachar el turno. SHEILY puede seguir ejecutándolo; no se reenviará automáticamente.',
      progress: 'Seguimiento verificado del turno activo…',
    };
  }
  if (error?.code === 'AUTH_REQUIRED') {
    return {
      title: 'Sesión caducada',
      detail: 'Vuelve a entrar para continuar.',
      progress: '',
    };
  }
  const statusCode = Number(error?.status);
  const safeCode = [error?.terminalErrorCode, error?.code]
    .find((value) => typeof value === 'string' && /^[a-z0-9][a-z0-9_.:-]{0,255}$/i.test(value)) || '';
  if (error?.turnDisposition === 'rejected') {
    const executionStarted = error.executionStarted === true;
    const admissionRejected = error.executionStarted === false && error.failurePhase === 'admission';
    return {
      title: executionStarted ? 'La respuesta no pudo completarse' :
        admissionRejected ? 'SHEILY rechazó la solicitud' : 'SHEILY finalizó el turno sin respuesta',
      detail: (executionStarted
        ? 'El turno inició la ejecución, pero finalizó sin una respuesta pública entregable.'
        : admissionRejected
          ? 'La solicitud fue rechazada antes de iniciar la ejecución.'
          : 'El turno terminó sin una respuesta pública entregable. La fase del fallo no está confirmada.') +
        (safeCode ? ' Código técnico: ' + safeCode + '.' : ''),
      progress: '',
    };
  }
  const safeDetail = Number.isFinite(statusCode) && statusCode < 500 && error?.message
    ? String(error.message)
    : 'La operación no pudo completarse. No se ha registrado este mensaje como una respuesta de SHEILY.';
  return {
    title: 'La solicitud no se completó',
    detail: safeDetail,
    progress: '',
  };
}

function createOperationalTurnElement(correlationId, status, error = null, options = {}) {
  const row = document.createElement('div');
  row.className = 'turn-operational-status';
  if (options.id) row.id = options.id;
  row.dataset.correlationId = correlationId || '';
  row.dataset.turnStatus = status;
  row.setAttribute('role', 'status');

  const copy = operationalTurnCopy(status, error);
  const body = document.createElement('div');
  body.className = 'turn-operational-card';
  const title = document.createElement('strong');
  title.className = 'turn-operational-title';
  title.textContent = copy.title;
  const detail = document.createElement('p');
  detail.className = 'turn-operational-detail';
  detail.textContent = copy.detail;
  body.append(title, detail);

  if (copy.progress) {
    const progress = document.createElement('p');
    progress.className = 'turn-operational-progress';
    const label = document.createElement('span');
    label.className = 'turn-activity-label';
    label.textContent = copy.progress;
    progress.append(label);
    body.append(progress);
  }

  if (error?.incidentId) {
    const incident = document.createElement('small');
    incident.className = 'turn-operational-incident';
    incident.textContent = 'Incidente: ' + String(error.incidentId).slice(0, 80);
    body.append(incident);
  }

  if (correlationId && (status === 'DELIVERY_UNKNOWN' || error?.turnDisposition === 'rejected')) {
    const report = document.createElement('button');
    report.type = 'button';
    report.className = 'action-btn turn-operational-report';
    report.textContent = 'Ver informe técnico';
    report.addEventListener('click', () => { void showVerifiedTurnReport(correlationId); });
    body.append(report);
  }

  row.append(body);
  return row;
}

function updateOperationalTurnTerminal(nodeId, terminalStatus) {
  const row = $(nodeId);
  if (!row?.classList.contains('turn-operational-status')) return;
  const title = row.querySelector('.turn-operational-title');
  const detail = row.querySelector('.turn-operational-detail');
  const label = row.querySelector('.turn-activity-label');
  const terminal = String(terminalStatus || 'UNCONFIRMED');
  row.dataset.terminal = terminal;

  if (terminal === 'COMMITTED') {
    if (title) title.textContent = 'Turno terminado; entrega pública no recuperada';
    if (detail) detail.textContent = 'El registro verificado llegó a COMMITTED, pero esta consola no recibió una entrega pública recuperable. No se reenviará automáticamente.';
    if (label) label.textContent = 'Seguimiento verificado finalizado.';
  } else if (terminal === 'FAILED' || terminal === 'BLOCKED') {
    if (title) title.textContent = 'Turno finalizado sin entrega';
    if (detail) detail.textContent = 'El registro verificado indica que la ejecución terminó sin una respuesta pública entregable.';
    if (label) label.textContent = 'Seguimiento verificado finalizado.';
  } else if (terminal === 'WAITING_FOR_CONFIRMATION') {
    if (title) title.textContent = 'Turno detenido a la espera de confirmación';
    if (detail) detail.textContent = 'La conexión de entrega se perdió y la confirmación debe recuperarse antes de continuar este turno.';
    if (label) label.textContent = 'Estado verificado: espera de confirmación.';
  } else if (terminal === 'DIAGNOSED') {
    if (title) title.textContent = 'Turno diagnosticado; entrega no recuperada';
    if (detail) detail.textContent = 'El registro terminó en diagnóstico, pero el texto diagnóstico no llegó por el canal público.';
    if (label) label.textContent = 'Seguimiento verificado finalizado.';
  }
}

function createMessageElement(role, text, options = {}) {
  const row = document.createElement('div');
  row.className = 'message-row ' + role;
  if (options.id) row.id = options.id;
  if (role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'S';
    avatar.setAttribute('aria-hidden', 'true');
    row.append(avatar);
  }
  const body = document.createElement('div');
  body.className = 'message-body';
  if (options.error) {
    body.classList.add('message-error');
    body.textContent = text;
  } else if (options.thinking) {
    body.innerHTML = '<span class="turn-activity" role="status"><span class="thinking" aria-hidden="true"><i></i><i></i><i></i></span><span class="turn-activity-label">Esperando la respuesta del motor…</span></span>';
  } else if (role === 'assistant' && options.liveReply && !replyShowsText(options.delivery)) {
    body.append(voiceOnlyNotice(text, options.delivery));
  } else if (role === 'assistant') {
    body.innerHTML = SheilyResults.renderMarkdown(text);
  } else {
    body.textContent = text;
  }
  const showLiveText = !options.liveReply || replyShowsText(options.delivery);
  if (role === 'assistant' && options.delivery && showLiveText) renderDelivery(body, options.delivery, options);
  if (role === 'assistant' && showLiveText && !options.error && !options.thinking && (!options.delivery || deliveryKind(options.delivery) === 'committed')) {
    SheilyResults.attachResponse(body, text, deliveredArtifacts(options.delivery));
    attachMessageActions(body, text);
  }
  row.append(body);
  // A failed turn does not invalidate the user's saved question. Keep the
  // operational notice separate from message content and assistant answers.
  if (role === 'user' && options.historical) {
    const notice = historicalTurnNotice(options.status);
    if (notice) {
      const status = document.createElement('p');
      status.className = 'message-turn-status';
      status.dataset.turnStatus = options.status;
      status.setAttribute('role', 'status');
      status.textContent = notice;
      row.append(status);
    }
  }
  return row;
}

function appendMessage(role, text, options = {}) {
  setWelcomeVisible(false);
  const row = createMessageElement(role, text, options);
  $('messages').append(row);
  $('message-scroll').scrollTo({ top: $('message-scroll').scrollHeight, behavior: 'smooth' });
  return row;
}

function queueHistoricalTimeline(message, row, conversationId) {
  const previous = state.historicalTimelineRestoreQueue || Promise.resolve();
  state.historicalTimelineRestoreQueue = previous.catch(() => {}).then(() => {
    if (state.conversationId !== conversationId || !row.isConnected) return;
    return restoreHistoricalTimeline(message, row, conversationId);
  });
}

function renderMessages(messages) {
  if (state.historicalTimelineObserver) state.historicalTimelineObserver.disconnect();
  $('messages').replaceChildren();
  const visible = Array.isArray(messages) ? messages.filter((message) => {
    return message && ['user', 'assistant'].includes(message.role);
  }) : [];
  setWelcomeVisible(visible.length === 0);
  const candidates = [];
  const historicalLastTurn = [...visible].reverse().find((message) =>
    typeof message.correlation_id === 'string' &&
    /^[a-zA-Z0-9_.:-]{1,160}$/.test(message.correlation_id));
  state.lastTurnCorrelationId = historicalLastTurn?.correlation_id || '';
  const conversationId = state.conversationId;
  visible.forEach((message) => {
    const row = createMessageElement(message.role, message.content, {
      delivery: message.delivery, historical: true, status: message.status,
    });
    $('messages').append(row);
    const unresolvedUserTurn = message.role === 'user' &&
      ['PENDING', 'DELIVERY_UNKNOWN', 'ABANDONED', 'REJECTED'].includes(message.status);
    if ((message.role === 'assistant' || unresolvedUserTurn) &&
        typeof message.correlation_id === 'string' &&
        /^[a-zA-Z0-9_.:-]{1,160}$/.test(message.correlation_id)) {
      candidates.push({ row, message });
    }
  });
  // Historical progress is reconstructed from the signed journal, not saved
  // locally by the browser. Only visible messages trigger an observer read.
  if (typeof globalThis.IntersectionObserver === 'function') {
    const candidateMap = new Map(candidates.map((candidate) => [candidate.row, candidate.message]));
    const observer = new globalThis.IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const message = candidateMap.get(entry.target);
        candidateMap.delete(entry.target);
        if (message) queueHistoricalTimeline(message, entry.target, conversationId);
      }
    }, { root: $('message-scroll'), rootMargin: '300px' });
    state.historicalTimelineObserver = observer;
    candidates.forEach(({ row }) => observer.observe(row));
  } else {
    state.historicalTimelineObserver = null;
    candidates.forEach(({ row, message }) => queueHistoricalTimeline(message, row, conversationId));
  }
  requestAnimationFrame(() => {
    $('message-scroll').scrollTop = $('message-scroll').scrollHeight;
  });
}

function scopedTurnUrl(correlationId, suffix, conversationId = state.conversationId) {
  return '/api/control/turns/' + encodeURIComponent(correlationId) + '/' + suffix +
    '?session_id=' + encodeURIComponent(state.sessionId) +
    '&conversation_id=' + encodeURIComponent(conversationId);
}

async function restoreHistoricalTimeline(message, anchorRow, conversationId) {
  const correlationId = message.correlation_id;
  try {
    const snapshot = await apiRequest(
      scopedTurnUrl(correlationId, 'snapshot', conversationId)
    );
    const timeline = timelineFromVerifiedSnapshot(snapshot, correlationId);
    if (!timeline || !anchorRow.isConnected || state.conversationId !== conversationId) return;
    const kind = deliveryKind(message.delivery);
    const terminal = kind === 'committed' && timeline.terminal === 'COMMITTED' ? 'COMMITTED' :
      kind === 'diagnostic' ? 'DIAGNOSED' :
      kind === 'confirmation' ? 'WAITING_FOR_CONFIRMATION' :
      ['FAILED', 'BLOCKED'].includes(timeline.terminal) ? timeline.terminal : 'UNCONFIRMED';
    anchorRow.before(createTimelineCard(correlationId, { ...timeline, terminal }));
  } catch {
    // An unavailable or invalid journal is not evidence of steps performed.
  }
}

function resizeComposer() {
  const input = $('message');
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 180) + 'px';
}

function setBusy(busy) {
  state.busy = busy;
  for (const id of ['send', 'new-chat', 'new-chat-mobile', 'message', 'attach-file-button', 'voice-input-button']) {
    const node = $(id);
    if (node) node.disabled = busy;
  }
  document.querySelectorAll('.chip-remove').forEach((node) => { node.disabled = busy; });
}

async function showStoredAttachmentLinks() {
  const scope = { sessionId: state.sessionId, conversationId: state.conversationId };
  const items = await SheilyUploads.list(scope);
  if (state.conversationId !== scope.conversationId || !items.length) return;
  const panel = document.createElement('div');
  panel.className = 'attachment-chips';
  panel.setAttribute('aria-label', 'Archivos conservados en esta conversación');
  for (const item of items) {
    const link = document.createElement('a');
    link.className = 'attachment-chip';
    link.textContent = item.filename + ' · original';
    link.href = '/api/attachments/' + encodeURIComponent(item.attachment_id) + '/original?' + new URLSearchParams({ session_id: scope.sessionId, conversation_id: scope.conversationId });
    link.download = item.filename;
    panel.append(link);
  }
  $('messages').append(panel);
}


// Evidence-based personal inspector. Fetch only when requested; never infer
// memory activation, privacy, or execution from presentation preferences.
function validStoredDocument(record) {
  return record && typeof record.attachment_id === 'string' &&
    /^[a-f0-9]{32}$/.test(record.attachment_id) &&
    typeof record.sha256 === 'string' && /^[a-f0-9]{64}$/.test(record.sha256) &&
    Number.isSafeInteger(record.size_bytes) && record.size_bytes >= 0;
}

function documentName(record) {
  const value = String(record?.filename || record?.name || '').trim();
  return value ? value.slice(0, 240) : 'Documento sin nombre';
}

async function loadConversationDocuments() {
  const id = ++state.documentsRequestId;
  const conversationId = state.conversationId;
  const scope = { sessionId: state.sessionId, conversationId };
  const status = $('documents-status');
  if (!status) return;
  status.textContent = 'Consultando los recibos de archivos del servidor…';
  try {
    const rows = await SheilyUploads.list(scope);
    if (id !== state.documentsRequestId || conversationId !== state.conversationId) return;
    if (!Array.isArray(rows)) throw new Error('El servidor no devolvió una colección de adjuntos.');
    state.documents = rows.filter(validStoredDocument);
    const rejected = rows.length - state.documents.length;
    status.textContent = state.documents.length + ' documentos con recibo SHA-256' +
      (rejected ? ' · ' + rejected + ' entradas excluidas por falta de verificación' : '') +
      ' · solo esta conversación.';
    renderConversationDocuments();
  } catch (error) {
    if (id !== state.documentsRequestId || conversationId !== state.conversationId) return;
    state.documents = [];
    $('documents-list').replaceChildren();
    $('documents-empty').hidden = true;
    status.textContent = 'No se ha podido comprobar el contenido de esta conversación: ' + error.message;
    if (error.code === 'AUTH_REQUIRED') showAccess();
  }
}

function selectStoredDocumentForChat(record, scope) {
  if (!validStoredDocument(record)) {
    toast('El archivo no tiene un recibo de integridad válido.');
    return false;
  }
  if (state.busy || state.sessionId !== scope.sessionId || state.conversationId !== scope.conversationId) {
    toast('Abre la conversación correspondiente antes de usar este documento.');
    return false;
  }
  const alreadySelected = state.attachments.some((item) => item.attachment_id === record.attachment_id);
  if (!alreadySelected && state.attachments.length >= 16) {
    toast('Máximo 16 archivos seleccionados para un mensaje.');
    return false;
  }
  if (!alreadySelected) {
    state.attachments.push({
      name: documentName(record),
      size: record.size_bytes,
      type: record.media_type || 'application/octet-stream',
      attachment_id: record.attachment_id,
      sha256: record.sha256,
      uploadScope: JSON.stringify([scope.sessionId, scope.conversationId]),
    });
  }
  renderAttachments();
  setView('chat');
  $('message')?.focus();
  return true;
}

function renderConversationDocuments() {
  const list = $('documents-list');
  if (!list) return;
  list.replaceChildren();
  $('documents-empty').hidden = state.documents.length !== 0;
  const scope = { sessionId: state.sessionId, conversationId: state.conversationId };
  for (const record of state.documents) {
    const row = document.createElement('article');
    row.className = 'document-item';
    const copy = document.createElement('div');
    copy.className = 'document-item-content';
    const title = document.createElement('strong');
    title.textContent = documentName(record);
    const detail = document.createElement('p');
    detail.textContent = formatFileSize(record.size_bytes) + ' · SHA-256 ' + record.sha256 +
      ' · recibido por el servidor; no implica lectura por el motor.';
    copy.append(title, detail);
    const actions = document.createElement('div');
    actions.className = 'document-item-actions';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'secondary-button';
    open.textContent = 'Abrir original';
    open.addEventListener('click', async () => {
      open.disabled = true;
      try {
        const original = await SheilyUploads.original({
          ...record, name: documentName(record),
          type: record.media_type || 'application/octet-stream',
        }, scope);
        if (state.conversationId !== scope.conversationId) return;
        await SheilyResults.open([original], 0);
      } catch (error) {
        toast('No se ha podido verificar y abrir el original: ' + error.message);
      } finally { open.disabled = false; }
    });
    const attach = document.createElement('button');
    attach.type = 'button';
    attach.className = 'secondary-button';
    attach.textContent = 'Usar en el chat';
    attach.addEventListener('click', () => selectStoredDocumentForChat(record, scope));
    actions.append(attach, open);
    row.append(copy, actions);
    list.append(row);
  }
}

function contextInspectorRow(label, value) {
  const row = document.createElement('div');
  row.className = 'context-inspector-kv';
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  description.textContent = String(value);
  row.append(term, description);
  return row;
}

function contextInspectorSection(title, rows) {
  const element = document.createElement('section');
  element.className = 'context-inspector-section';
  const heading = document.createElement('h3');
  heading.textContent = title;
  element.append(heading);
  for (const [key, value] of rows) element.append(contextInspectorRow(key, value));
  return element;
}

function contextModeDescription(mode) {
  return {
    fast: 'Respuesta breve (presentación, no aceleración del motor)',
    balanced: 'Presentación equilibrada',
    deep: 'Respuesta detallada (presentación, no razonamiento adicional certificado)',
  }[mode] || 'Modo sin correspondencia verificada';
}

function contextResult(result, property) {
  return result.status === 'fulfilled' ? (property ? result.value?.[property] : result.value) : null;
}

function closeContextInspector() {
  const panel = $('context-inspector-panel');
  if (panel) panel.hidden = true;
  const button = $('context-inspector-open');
  if (button) button.setAttribute('aria-expanded', 'false');
  ++state.inspectorRequestId;
}

async function toggleContextInspector() {
  const panel = $('context-inspector-panel');
  if (!panel) return;
  if (!panel.hidden) { closeContextInspector(); return; }
  if (state.view !== 'chat') setView('chat');
  panel.hidden = false;
  $('context-inspector-open').setAttribute('aria-expanded', 'true');
  await refreshContextInspector();
}

async function refreshContextInspector() {
  const panel = $('context-inspector-panel');
  if (!panel || panel.hidden || !state.authenticated) return;
  const id = ++state.inspectorRequestId;
  const conversationId = state.conversationId;
  const scope = { sessionId: state.sessionId, conversationId };
  $('context-inspector-status').textContent = 'Consultando ajustes, privacidad, memoria, bóveda y documentos…';
  $('context-inspector-refresh').disabled = true;
  const results = await Promise.allSettled([
    apiRequest('/api/settings'),
    apiRequest('/api/privacy?session_id=' + encodeURIComponent(state.sessionId)),
    apiRequest('/api/memories?kind=all&limit=1'),
    apiRequest('/api/vault/status'),
    SheilyUploads.list(scope),
  ]);
  if (id !== state.inspectorRequestId || conversationId !== state.conversationId || panel.hidden) return;
  const [settingsResult, privacyResult, memoryResult, vaultResult, documentsResult] = results;
  const settings = contextResult(settingsResult, 'settings');
  const privacy = contextResult(privacyResult);
  const memory = contextResult(memoryResult);
  const vault = contextResult(vaultResult);
  const documents = contextResult(documentsResult);
  const display = $('context-inspector-content');
  display.replaceChildren();
  display.append(contextInspectorSection('Conversación y entrega', [
    ['Sesión', state.sessionId || 'No verificable'],
    ['Conversación', conversationId || 'No seleccionada'],
    ['Modo del chat', contextModeDescription(state.cognitiveMode)],
    ['Último turno', state.lastTurn?.conversationId === conversationId
      ? state.lastTurn.status + (Number.isSafeInteger(state.lastTurn.elapsedMs)
        ? ' · ' + state.lastTurn.elapsedMs + ' ms hasta respuesta HTTP (incluye cargas)' : '')
      : (state.lastTurnCorrelationId ? 'Registro disponible para consulta' : 'Sin turno seleccionado')],
  ]));
  display.append(contextInspectorSection('Memorias y preferencias', [
    ['Recuerdos registrados', memory?.schema === 'shei.public.memory_list/v2' &&
      Number.isSafeInteger(memory.total_matches)
      ? memory.total_matches + ' disponibles; uso en el turno no determinado'
      : 'No verificable'],
    ['Uso de memoria en respuestas', 'Lo decide el motor cognitivo por turno; este panel no lo fuerza'],
    ['Fuentes y citas', 'Se exigen por contrato cuando el tipo de respuesta necesita evidencia externa'],
  ]));
  display.append(contextInspectorSection('Archivos y privacidad', [
    ['Documentos del chat', Array.isArray(documents)
      ? documents.filter(validStoredDocument).length + ' adjuntos con recibo verificable'
      : 'No verificable'],
    ['Custodia', vault && typeof vault.configured === 'boolean'
      ? (vault.configured ? (vault.unlocked ? 'Desbloqueada' : 'Bloqueada') : 'Sin configurar') +
        ' · el contenido no se incorpora automáticamente al chat'
      : 'No verificable'],
    ['Ámbito de red', typeof privacy?.network_scope === 'string' ? privacy.network_scope : 'No verificable'],
    ['Privacidad local', privacy?.network_scope === 'LOOPBACK_ONLY' && privacy?.private_space_active === true
      ? 'El servidor declara ámbito local y espacio privado activo'
      : 'No certificada en esta lectura'],
  ]));
  const failures = results.filter((result) => result.status !== 'fulfilled').length;
  $('context-inspector-status').textContent = failures
    ? 'Lectura parcial: ' + failures + ' fuentes no disponibles. No se infieren resultados faltantes.'
    : 'Cinco fuentes del servidor consultadas. No equivale a certificación de ejecución de memoria.';
  const receipt = state.lastTurnCorrelationId;
  $('context-inspector-report').disabled = !receipt ||
    !/^[a-zA-Z0-9_.:-]{1,160}$/.test(receipt);
  $('context-inspector-refresh').disabled = false;
}

function newConversation() {
  if (state.busy) return;
  SheilyResults.close();
  state.lastTurn = null;
  state.lastTurnCorrelationId = '';
  state.documents = [];
  state.attachments = [];
  renderAttachments();
  state.conversationId = randomId();
  storageSet(PERSONAL_CONVERSATION_KEY, state.conversationId);
  state.conversationTitle = 'Nueva conversación';
  $('messages').replaceChildren();
  setWelcomeVisible(true);
  $('message').value = '';
  resizeComposer();
  setView('chat');
  $('message').focus();
}

function conversationMatches(item, query) {
  if (!query) return true;
  const haystack = (item.title + ' ' + item.preview).toLocaleLowerCase('es');
  return haystack.includes(query.toLocaleLowerCase('es'));
}

function renderRecentConversations() {
  const container = $('recent-conversations');
  container.replaceChildren();
  const items = state.conversations.slice(0, 8);
  $('sidebar-recent').hidden = items.length === 0;
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'recent-chat';
    button.textContent = item.title;
    button.title = item.title;
    if (item.conversation_id === state.conversationId) button.setAttribute('aria-current', 'true');
    button.addEventListener('click', () => void openConversation(item.conversation_id));
    container.append(button);
  }
}

function renderConversationList() {
  const list = $('conversation-list');
  const filtered = state.conversations.filter((item) => conversationMatches(item, state.query));
  list.replaceChildren();
  $('conversation-empty').hidden = filtered.length !== 0 || Boolean(state.query);
  if (!filtered.length && state.query) {
    const result = document.createElement('div');
    result.className = 'empty-state';
    result.innerHTML = '<h2>Sin resultados</h2><p>Prueba con otras palabras.</p>';
    list.append(result);
    return;
  }
  filtered.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'conversation-item';
    row.dataset.conversationId = item.conversation_id;
    const open = document.createElement('button');
    open.className = 'conversation-open';
    open.type = 'button';
    open.innerHTML =
      '<span class="conversation-glyph">' + icons.chat + '</span>' +
      '<span class="conversation-copy"><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.preview || 'Conversación guardada') + '</span></span>' +
      '<span class="conversation-meta"><span>' + escapeHtml(formatRelativeDate(item.updated_at)) + '</span>' + icons.arrow + '</span>';
    open.addEventListener('click', () => void openConversation(item.conversation_id));
    const actions = document.createElement('div');
    actions.className = 'conversation-actions';
    const conversationActions = [];
    if (state.personalSettings?.private_chat_shortcut !== false) {
      conversationActions.push(conversationAction('Guardar en Custodia Privada', icons.lock, () => void saveConversationToVault(item)));
    }
    conversationActions.push(
      conversationAction('Renombrar', icons.edit, () => openRenameDialog(item)),
      conversationAction('Exportar', icons.download, () => void exportConversation(item.conversation_id)),
      conversationAction('Eliminar', icons.trash, () => void deleteConversation(item), true),
    );
    actions.append(...conversationActions);
    row.append(open, actions);
    list.append(row);
  });
}

function conversationAction(label, icon, handler, danger = false) {
  const button = document.createElement('button');
  button.className = 'conversation-action' + (danger ? ' danger' : '');
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.title = label;
  button.innerHTML = icon;
  button.addEventListener('click', handler);
  return button;
}

async function loadConversations(options = {}) {
  const requestId = ++state.conversationsRequestId;
  const sessionId = state.sessionId;
  const status = $('conversation-status');
  const refresh = $('conversation-refresh');
  if (status) status.textContent = 'Consultando el historial del servidor…';
  if (refresh) refresh.disabled = true;
  if (!state.conversations.length) $('conversation-empty').hidden = true;
  try {
    const body = await apiRequest('/api/conversations?session_id=' + encodeURIComponent(sessionId));
    if (requestId !== state.conversationsRequestId || sessionId !== state.sessionId) return state.conversations;
    if (!Array.isArray(body?.conversations)) throw new Error('El servidor no devolvió una colección de conversaciones.');
    state.conversations = body.conversations;
    $('conversation-count').textContent = String(state.conversations.length);
    renderRecentConversations();
    if (!options.quiet || state.view === 'conversations') renderConversationList();
    if (status) status.textContent = state.conversations.length + ' conversaciones consultadas en el servidor.';
    return state.conversations;
  } catch (error) {
    if (requestId === state.conversationsRequestId && sessionId === state.sessionId) {
      if (status) status.textContent = 'No se ha podido actualizar el historial. '
        + (state.conversations.length ? 'Se conserva la última lectura. ' : 'El contenido sigue sin verificar. ')
        + 'Puedes volver a consultar. ' + error.message;
      if (!state.conversations.length) $('conversation-empty').hidden = true;
    }
    throw error;
  } finally {
    if (requestId === state.conversationsRequestId && refresh) refresh.disabled = false;
  }
}

async function refreshConversationHistory() {
  try { await loadConversations(); }
  catch (error) { if (error.code === 'AUTH_REQUIRED') showAccess(); }
}

async function openConversation(conversationId) {
  if (state.busy) return;
  const ticket = ++state.conversationLoadId;
  try {
    const body = await apiRequest(
      '/api/conversations/' + encodeURIComponent(conversationId) +
      '?session_id=' + encodeURIComponent(state.sessionId),
    );
    if (ticket !== state.conversationLoadId) return;
    const conversation = body.conversation || {};
    SheilyResults.close();
    state.conversationId = conversationId;
    state.lastTurn = null;
    state.lastTurnCorrelationId = '';
    state.documents = [];
    storageSet(PERSONAL_CONVERSATION_KEY, conversationId);
    state.conversationTitle = compactText(conversation.title || 'Conversación');
    renderMessages(conversation.messages || []);
    state.attachments = [];
    renderAttachments();
    await showStoredAttachmentLinks();
    setView('chat');
  } catch (error) {
    toast(error.message);
  }
}

function confirmAction(title, copy, label) {
  $('confirm-title').textContent = title;
  $('confirm-copy').textContent = copy;
  $('confirm-action').textContent = label;
  $('confirm-dialog').showModal();
  return new Promise((resolve) => {
    state.confirmResolve = resolve;
  });
}

function openRenameDialog(item) {
  state.renameConversationId = item.conversation_id;
  $('rename-title').value = item.title || '';
  $('rename-error').textContent = '';
  $('rename-dialog').showModal();
  setTimeout(() => $('rename-title').select(), 0);
}

async function renameConversation(conversationId, title) {
  const body = await apiRequest('/api/conversations/' + encodeURIComponent(conversationId), {
    method: 'PATCH',
    body: JSON.stringify({ session_id: state.sessionId, title }),
  });
  if (state.conversationId === conversationId) {
    state.conversationTitle = body.title;
    if (state.view === 'chat') $('page-title').textContent = body.title;
  }
  await loadConversations();
  toast('Conversación renombrada.');
}

async function deleteConversation(item) {
  const confirmed = await confirmAction(
    'Eliminar conversación',
    'Se eliminarán este chat y sus mensajes del historial web. La memoria cognitiva de SHEILY es independiente y no se borra con esta acción.',
    'Eliminar chat',
  );
  if (!confirmed) return;
  try {
    await apiRequest(
      '/api/conversations/' + encodeURIComponent(item.conversation_id) +
      '?session_id=' + encodeURIComponent(state.sessionId),
      { method: 'DELETE' },
    );
    await loadConversations();
    if (state.conversationId === item.conversation_id) newConversation();
    toast('Conversación eliminada.');
  } catch (error) {
    toast(error.message);
  }
}

async function deleteAllConversations() {
  const count = state.conversations.length;
  const confirmed = await confirmAction(
    'Borrar el historial de este espacio',
    'Se eliminarán ' + count + ' conversaciones y sus mensajes del espacio personal activo. No se borrarán otras sesiones ni la memoria cognitiva separada de SHEILY.',
    'Borrar ' + count + (count === 1 ? ' conversación' : ' conversaciones'),
  );
  if (!confirmed) return;
  try {
    const body = await apiRequest(
      '/api/conversations?session_id=' + encodeURIComponent(state.sessionId),
      { method: 'DELETE' },
    );
    await loadConversations();
    newConversation();
    toast('Historial eliminado: ' + body.deleted_count + ' conversaciones.');
  } catch (error) {
    toast(error.message);
  }
}

async function downloadJson(path, filename) {
  const response = await fetch(path, { credentials: 'same-origin' });
  if (!response.ok) {
    const body = await parseResponse(response);
    throw new Error(body.error || 'No se ha podido exportar.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function exportConversation(conversationId) {
  try {
    const body = await apiRequest(
      '/api/conversations/' + encodeURIComponent(conversationId) +
      '?session_id=' + encodeURIComponent(state.sessionId),
    );
    const blob = new Blob([JSON.stringify({
      schema: 'shei.personal.conversation_export/v1',
      exported_at: new Date().toISOString(),
      conversation: body.conversation,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'conversacion-sheily.json';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast('Conversación exportada.');
  } catch (error) {
    toast(error.message);
  }
}

async function exportHistory() {
  try {
    await downloadJson(
      '/api/conversations/export?session_id=' + encodeURIComponent(state.sessionId),
      'conversaciones-sheily.json',
    );
    toast('Historial exportado.');
  } catch (error) {
    toast(error.message);
  }
}

function deliveryKind(body) {
  if (!body || typeof body !== 'object') return 'blocked';
  if (body.schema_version === 'shei.public.diagnostic_delivery/v1' &&
      body.response_disposition === 'DIAGNOSED' && body.turn_lifecycle === 'DIAGNOSED' &&
      body.delivery_status === 'DIAGNOSTIC' && body.diagnostic_verified === true &&
      body.success === false && body.answer_satisfied === false && body.output_committed === false &&
      typeof body.reply === 'string' && body.reply.trim() &&
      body.diagnostic_receipt?.schema === 'shei.public.diagnostic_receipt/v1' &&
      body.diagnostic_receipt.verified === true && body.diagnostic_receipt.factual_answer_committed === false &&
      ['workflow_execution_hash', 'language_output_hash', 'grounding_output_hash', 'reply_sha256'].every(
        (key) => typeof body.diagnostic_receipt[key] === 'string' && /^[a-f0-9]{64}$/i.test(body.diagnostic_receipt[key]),
      )) return 'diagnostic';
  if (body.success === true && body.answer_satisfied === true &&
      body.output_committed === true && body.delivery_status === 'COMMITTED') return 'committed';
  if (body.response_disposition === 'CONFIRMATION_REQUIRED' &&
      body.confirmation_required === true && body.success === false &&
      body.output_committed === false && body.turn_lifecycle === 'WAITING_FOR_CONFIRMATION' &&
      body.effect_summary === 'NOT_EXECUTED' &&
      typeof body.confirmation_challenge === 'string' && body.confirmation_challenge.trim() &&
      body.confirmation_challenge.length <= 512 &&
      typeof body.task_compilation_hash === 'string' && body.task_compilation_hash.trim()) return 'confirmation';
  return 'blocked';
}

function committedReply(body) {
  if (deliveryKind(body) !== 'committed') return '';
  const reply = body.reply || body.answer;
  return typeof reply === 'string' ? reply.trim() : '';
}

function deliveredArtifacts(body) {
  if (deliveryKind(body) !== 'committed') return [];
  const values = [...(Array.isArray(body.artifacts) ? body.artifacts : []), body.artifact];
  if (body.project_delivery && body.project_delivery.certified === true && body.project_delivery.delivery_verified === true) {
    values.push(body.project_delivery.artifact);
    if (Array.isArray(body.project_delivery.artifacts)) values.push(...body.project_delivery.artifacts);
  }
  const seen = new Set();
  return values.filter((artifact) => {
    if (!artifact || typeof artifact.project_id !== 'string' ||
        typeof artifact.relative_path !== 'string' || typeof artifact.sha256 !== 'string' ||
        !/^[a-f0-9]{64}$/i.test(artifact.sha256)) return false;
    try { SheilyResults.safePath(artifact.relative_path); }
    catch { return false; }
    const key = artifact.project_id + ':' + artifact.relative_path + ':' + artifact.sha256;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deliveredSources(body) {
  if (deliveryKind(body) !== 'committed' || !Array.isArray(body.sources)) return [];
  const seen = new Set();
  return body.sources.filter((source) => {
    if (!source || typeof source.url !== 'string') return false;
    try {
      const url = new URL(source.url);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || seen.has(url.href)) return false;
      seen.add(url.href);
      return true;
    } catch { return false; }
  });
}

function renderDelivery(container, body, options = {}) {
  const kind = deliveryKind(body);
  if (kind === 'blocked') return;
  const panel = document.createElement('div');
  panel.className = 'delivery-panel';
  if (kind === 'diagnostic') {
    const note = document.createElement('p');
    note.className = 'diagnostic-notice';
    note.textContent = 'Limitación explicada · la solicitud original no se ha completado.';
    panel.append(note);
    container.append(panel);
    return;
  }
  if (kind === 'confirmation') {
    const note = document.createElement('p');
    note.textContent = 'La acción todavía no se ha ejecutado.';
    panel.append(note);
    if (!options.historical) {
      const conversationId = state.conversationId;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'delivery-confirm';
      button.textContent = 'Confirmar esta acción';
      button.addEventListener('click', () => {
        if (state.busy || state.conversationId !== conversationId) return;
        button.disabled = true;
        // Confirmation travels through the ordinary native turn authority.
        // The browser does not grant effects or call an administrative route.
        void sendMessage('confirmo ' + body.confirmation_challenge).finally(() => {
          if (button.isConnected) button.disabled = false;
        });
      });
      panel.append(button);
    }
    container.append(panel);
    return;
  }
  const terminal = body.terminal_output;
  if (!committedReply(body) && terminal && terminal.verified === true) {
    const label = document.createElement('p');
    label.textContent = 'Resultado de la ejecución';
    panel.append(label);
  }
  SheilyResults.renderSources(panel, deliveredSources(body));
  if (terminal && terminal.verified === true) {
    const detail = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Evidencia de la ejecución';
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(terminal, null, 2);
    detail.append(summary, pre);
    panel.append(detail);
  }
  if (panel.childNodes.length) container.append(panel);
}

// These are interface activity labels, not assistant utterances. They change
// only in response to verified execution events for the current turn.
function turnProgressObservation(row, correlationId, lastSequence) {
  if (!row || row.schema !== 'shei.live_turn_event/v1' ||
      row.correlation_id !== correlationId || row.evidence?.verified !== true ||
      !Number.isSafeInteger(row.sequence) || row.sequence <= lastSequence) return null;
  const labels = {
    load_state: 'Recuperando el contexto de la conversación',
    read_continuity: 'Recuperando la continuidad de la conversación',
    appraise_situation: 'Evaluando la situación actual',
    pull_working: 'Recuperando el contexto de trabajo',
    observe_homeostasis: 'Comprobando el estado interno',
    build_world_state: 'Construyendo el estado de referencia',
    predict_world_outcome: 'Evaluando resultados posibles',
    retrieve_memory: 'Consultando la memoria relevante',
    retrieve_autobiographical: 'Consultando la continuidad autobiográfica',
    revise_beliefs: 'Revisando el conocimiento aplicable',
    update_beliefs: 'Actualizando el contexto de conocimiento',
    select_goal: 'Determinando el objetivo de la respuesta',
    process_values: 'Aplicando criterios y límites',
    decide_volition: 'Decidiendo la acción permitida',
    run_worker_lane: 'Procesando el trabajo auxiliar',
    frontier_plan: 'Explorando el plan de resolución',
    resolve_inference: 'Resolviendo la inferencia necesaria',
    plan_response: 'Preparando la tarea',
    prepare_continuity: 'Preparando la continuidad del turno',
    read_amygdala: 'Evaluando señales emocionales relevantes',
    read_quantum_qualia: 'Consultando el estado fenomenológico',
    read_neuromodulators: 'Consultando moduladores cognitivos',
    read_arousal: 'Evaluando el nivel de activación',
    detect_phenomena: 'Detectando señales fenomenológicas',
    read_qualia_vad: 'Evaluando valencia, activación y dominancia',
    resolve_self_knowledge: 'Consultando el autoconocimiento aplicable',
    decide_knowledge_freshness: 'Comprobando la vigencia del conocimiento',
    prepare_lookup: 'Preparando la búsqueda',
    fetch_world_evidence: 'Consultando fuentes externas',
    run_symbolic_reasoning: 'Ejecutando el razonamiento estructurado',
    generate_language: 'Redactando la respuesta',
    ground_response: 'Contrastando la respuesta con las fuentes',
    decide_epistemic_terminal: 'Determinando el estado verificable de la respuesta',
    realize_epistemic_limit: 'Explicando la limitación encontrada',
    ground_epistemic_limit: 'Comprobando la explicación de la limitación',
    audit_epistemic_limit: 'Verificando la entrega de la explicación',
    audit_output: 'Verificando la entrega',
    store_episode: 'Guardando la experiencia aceptada',
    save_state: 'Guardando el estado de la conversación',
    push_working: 'Actualizando el contexto de trabajo',
    commit_continuity: 'Confirmando la continuidad del turno',
  };
  if (row.event === 'workflow.plan.materialized' && row.status === 'OK') {
    const plan = verifiedWorkflowPlan(row.payload, labels);
    return { sequence: row.sequence, label: plan ? 'Plan de ejecución verificado' : '', plan };
  }
  const progress = row.payload?.result_summary?.public_progress;
  if (row.event === 'workflow.step.completed' && row.status === 'OK' &&
      row.payload?.capability_id === 'shei.research.query_expansion:v1' &&
      progress?.schema === 'shei.lookup.public_progress/v1' && progress.phase === 'plan_ready' &&
      progress.speech_act === 'announce_lookup_plan' && progress.is_final_answer === false &&
      typeof progress.text === 'string' && progress.text.trim() && progress.text.length <= 960 &&
      /^[0-9a-f]{64}$/.test(progress.plan_hash || '') && /^[0-9a-f]{64}$/.test(progress.receipt_hash || '')) {
    return { sequence: row.sequence, label: '', announcement: progress.text, planHash: progress.plan_hash };
  }
  let label = '';
  if (row.event === 'workflow.step.started' && row.status === 'RUNNING') {
    label = labels[row.payload?.step_name] || '';
  } else if (row.event === 'workflow.step.failed' && row.status === 'FAILED') {
    label = 'Se ha registrado un problema durante la ejecución';
  }
  return { sequence: row.sequence, label,
    step: ['workflow.step.started', 'workflow.step.completed', 'workflow.step.failed',
      'workflow.step.blocked', 'workflow.step.skipped', 'workflow.cleanup.started',
      'workflow.cleanup.completed', 'workflow.cleanup.failed'].includes(row.event) &&
      typeof row.payload?.step_name === 'string' ?
      { name: row.payload.step_name, event: row.event, status: row.status } : null,
    lookupStarted: row.event === 'workflow.step.started' && row.status === 'RUNNING' &&
      row.payload?.step_name === 'fetch_world_evidence' };
}

// Plans and transitions come only from the signed, verified turn journal.
// Neither the user's prompt nor a timer can create a displayed workflow step.
function verifiedWorkflowPlan(payload, labels = {}) {
  if (!payload || payload.activation_plan_verified !== true ||
      !/^[a-f0-9]{64}$/.test(payload.workflow_plan_hash || '') ||
      !Array.isArray(payload.active_steps) || payload.active_steps.length < 1 ||
      payload.active_steps.length > 80 || payload.step_count !== payload.active_steps.length) return null;
  const seen = new Set();
  const steps = [];
  for (const item of payload.active_steps) {
    if (!item || typeof item.step_name !== 'string' ||
        !/^[a-zA-Z0-9_.:-]{1,128}$/.test(item.step_name) || seen.has(item.step_name)) return null;
    seen.add(item.step_name);
    const purpose = typeof item.declared_purpose === 'string' ?
      item.declared_purpose.replace(/\s+/g, ' ').trim().slice(0, 160) : '';
    const label = purpose || labels[item.step_name] || item.step_name.replace(/[_-]/g, ' ');
    steps.push({
      name: item.step_name,
      label,
      capability: typeof item.capability_id === 'string' ? item.capability_id : '',
      status: 'pending',
    });
  }
  const research = steps.some((step) => /^shei\.research\.deep:/.test(step.capability)) ||
    (typeof payload.workflow_id === 'string' && /(^|[._])research[._]/.test(payload.workflow_id));
  return { hash: payload.workflow_plan_hash, title: research ? 'Investigación profunda' : 'Progreso de la respuesta',
    steps, terminal: '', lastSequence: 0 };
}

function advanceTurnTimeline(timeline, observation) {
  if (observation?.plan) return { ...observation.plan, lastSequence: observation.sequence };
  if (!timeline || !observation?.step || observation.sequence <= timeline.lastSequence) return timeline;
  const { name, event, status } = observation.step;
  const updated = timeline.steps.map((step) => {
    if (step.name !== name) return step;
    if (['workflow.step.started', 'workflow.cleanup.started'].includes(event) &&
        status === 'RUNNING' && step.status === 'pending') {
      return { ...step, status: 'running' };
    }
    if (['workflow.step.completed', 'workflow.cleanup.completed'].includes(event) && status === 'OK') {
      return { ...step, status: 'completed' };
    }
    if (['workflow.step.failed', 'workflow.step.blocked', 'workflow.cleanup.failed'].includes(event) &&
        ['FAILED', 'BLOCKED'].includes(status)) return { ...step, status: 'failed' };
    if (event === 'workflow.step.skipped' && status === 'SKIPPED') {
      return { ...step, status: 'skipped' };
    }
    return step;
  });
  return { ...timeline, steps: updated, lastSequence: observation.sequence };
}

function turnTimelineCounts(timeline) {
  if (!timeline) return { completed: 0, total: 0, failed: 0, skipped: 0 };
  return {
    completed: timeline.steps.filter((step) => step.status === 'completed').length,
    total: timeline.steps.length,
    failed: timeline.steps.filter((step) => step.status === 'failed').length,
    skipped: timeline.steps.filter((step) => step.status === 'skipped').length,
  };
}

function turnTimelineResolved(counts) {
  return counts.completed + counts.skipped;
}

function timelineFromVerifiedSnapshot(snapshot, correlationId) {
  if (snapshot?.exists !== true || !Array.isArray(snapshot.events) ||
      snapshot.correlation_id !== correlationId) return null;
  let sequence = 0;
  let timeline = null;
  for (const row of snapshot.events) {
    const observation = turnProgressObservation(row, correlationId, sequence);
    if (!observation) continue;
    sequence = observation.sequence;
    timeline = advanceTurnTimeline(timeline, observation);
  }
  if (!timeline) return null;
  return { ...timeline, terminal: snapshot.finished === true ?
    String(snapshot.terminal_status || 'UNCONFIRMED') : 'INTERRUPTED',
    retainedComplete: snapshot.retained_complete === true };
}

function turnTimelineTitle(timeline) {
  const titles = {
    COMMITTED: 'Entrega confirmada',
    DIAGNOSED: 'Respuesta con limitaciones',
    FAILED: 'No se pudo completar la respuesta',
    BLOCKED: 'Respuesta bloqueada',
    WAITING_FOR_CONFIRMATION: 'Confirmación pendiente',
    INTERRUPTED: 'Ejecución interrumpida',
    UNCONFIRMED: 'Entrega sin confirmar',
  };
  if (timeline.terminal) return titles[timeline.terminal] || 'Estado de la ejecución';
  return turnTimelineCounts(timeline).failed ? 'Se ha detectado una incidencia' : timeline.title;
}

function createTimelineCard(correlationId, timeline) {
  const row = document.createElement('section');
  row.className = 'turn-timeline-row';
  row.dataset.correlationId = correlationId;
  const card = document.createElement('div');
  card.className = 'turn-timeline-card';
  card.dataset.planHash = timeline.hash;
  card.setAttribute('role', 'region');
  card.setAttribute('aria-label', 'Progreso de la tarea');
  const heading = document.createElement('div');
  heading.className = 'turn-timeline-heading';
  const title = document.createElement('strong');
  title.className = 'turn-timeline-title';
  const detail = document.createElement('button');
  detail.type = 'button';
  detail.className = 'turn-timeline-detail';
  detail.textContent = 'Ver informe técnico';
  detail.addEventListener('click', () => void showVerifiedTurnReport(correlationId));
  heading.append(title, detail);
  const steps = document.createElement('ol');
  steps.className = 'turn-timeline-steps';
  const executionDetails = document.createElement('details');
  executionDetails.className = 'turn-timeline-details';
  const executionSummary = document.createElement('summary');
  executionSummary.textContent = 'Detalles de ejecución';
  executionDetails.append(executionSummary, steps);
  const meta = document.createElement('p');
  meta.className = 'turn-timeline-meta';
  meta.setAttribute('aria-live', 'polite');
  const bar = document.createElement('progress');
  bar.className = 'turn-timeline-bar';
  const status = document.createElement('p');
  status.className = 'turn-timeline-status';
  card.append(heading, meta, bar, status, executionDetails);
  row.append(card);
  updateTimelineCard(row, timeline);
  return row;
}

function updateTimelineCard(row, timeline) {
  if (!row || !timeline) return;
  row.querySelector('.turn-timeline-title').textContent = turnTimelineTitle(timeline);
  const list = row.querySelector('.turn-timeline-steps');
  const newSteps = timeline.steps.map((step) => {
    const item = document.createElement('li');
    item.dataset.stepName = step.name;
    item.dataset.status = step.status;
    const symbol = document.createElement('span');
    symbol.className = 'turn-timeline-symbol';
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = ({ pending: '○', running: '●', completed: '✓', failed: '!', skipped: '–' })[step.status];
    const label = document.createElement('span');
    label.className = 'turn-timeline-step-label';
    label.textContent = step.label;
    item.append(symbol, label);
    return item;
  });
  list.replaceChildren(...newSteps);
  const counts = turnTimelineCounts(timeline);
  const resolved = turnTimelineResolved(counts);
  row.querySelector('.turn-timeline-meta').textContent =
    resolved + ' de ' + counts.total + ' pasos resueltos' +
    (counts.completed ? ' · ' + counts.completed + ' ejecutados' : '') +
    (counts.failed ? ' · ' + counts.failed + ' con error' : '') +
    (counts.skipped ? ' · ' + counts.skipped + ' no aplicables' : '');
  const bar = row.querySelector('.turn-timeline-bar');
  bar.max = counts.total;
  bar.value = resolved;
  bar.setAttribute('aria-label', 'Pasos verificados resueltos');
  const statuses = {
    COMMITTED: 'Entrega verificada y registrada por el sistema',
    DIAGNOSED: 'Diagnóstico registrado; no se ha confirmado una respuesta final',
    FAILED: 'La ejecución falló y no se entregó una respuesta. Puedes consultar la causa en el informe técnico.',
    BLOCKED: 'Ejecución bloqueada',
    WAITING_FOR_CONFIRMATION: 'A la espera de confirmación',
    INTERRUPTED: 'Ejecución interrumpida o sin estado terminal observado',
    UNCONFIRMED: 'La entrega todavía no está confirmada',
  };
  const status = row.querySelector('.turn-timeline-status');
  status.textContent = statuses[timeline.terminal] || (timeline.terminal ?
    'Estado registrado: ' + timeline.terminal.slice(0, 80) : 'En ejecución · seguimiento de pasos reales');
  if (timeline.retainedComplete === false) status.textContent += ' · registro de eventos parcial';
  row.dataset.terminal = timeline.terminal || 'RUNNING';
}

function turnReportPresentation(report, correlationId) {
  const title = 'Informe de ejecución';
  if (report == null && correlationId == null) return { title, markdown: '' };
  if (!report || report.schema !== 'shei.live_turn_report/v2' ||
      report.correlation_id !== correlationId || report.exists !== true ||
      typeof report.markdown !== 'string') {
    throw new Error('No hay un informe de ejecución disponible para este turno.');
  }
  // This badge refers to the journal's integrity, not the truth of the reply.
  const integrityVerified = report.evidence_integrity === true &&
    report.retained_complete === true &&
    Number.isSafeInteger(report.event_count) && report.event_count > 0 &&
    report.verified_event_count === report.event_count;
  return {
    title: title + (integrityVerified ? ' · registro verificado' : ' · integridad sin confirmar'),
    markdown: report.markdown,
  };
}

async function showVerifiedTurnReport(correlationId) {
  let dialog = $('turn-report-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'turn-report-dialog';
    dialog.className = 'turn-report-dialog';
    const header = document.createElement('div');
    header.className = 'turn-report-header';
    const heading = document.createElement('strong');
    heading.id = 'turn-report-heading';
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Cerrar informe');
    close.textContent = 'Cerrar';
    close.addEventListener('click', () => dialog.close());
    header.append(heading, close);
    const report = document.createElement('div');
    report.className = 'turn-report-body';
    report.id = 'turn-report-body';
    dialog.append(header, report);
    document.body.append(dialog);
  }
  dialog.dataset.correlationId = correlationId;
  $('turn-report-heading').textContent = turnReportPresentation(null).title;
  $('turn-report-body').textContent = 'Consultando el registro de ejecución…';
  if (!dialog.open) dialog.showModal();
  try {
    const report = await apiRequest(scopedTurnUrl(correlationId, 'report'));
    const presentation = turnReportPresentation(report, correlationId);
    if (!dialog.open || dialog.dataset.correlationId !== correlationId) return;
    $('turn-report-heading').textContent = presentation.title;
    $('turn-report-body').innerHTML = SheilyResults.renderMarkdown(presentation.markdown);
  } catch (error) {
    if (dialog.open && dialog.dataset.correlationId === correlationId) {
      $('turn-report-heading').textContent = turnReportPresentation(null).title;
      $('turn-report-body').textContent = error.message;
    }
  }
}

function startTurnProgress(correlationId, thinkingId) {
  const source = new EventSource(scopedTurnUrl(correlationId, 'events'));
  let sequence = 0;
  let closed = false;
  let timeline = null;
  let timelineNode = null;
  let lookupStarted = false;
  let pendingAnnouncement = null;
  const close = () => { if (!closed) { closed = true; source.close(); } };
  source.addEventListener('turn_event', (event) => {
    let row;
    try { row = JSON.parse(event.data); } catch { close(); return; }
    const observation = turnProgressObservation(row, correlationId, sequence);
    if (!observation) return;
    sequence = observation.sequence;
    timeline = advanceTurnTimeline(timeline, observation);
    if (timeline) {
      if (!timelineNode) {
        const thinking = $(thinkingId);
        if (thinking?.parentElement) {
          timelineNode = createTimelineCard(correlationId, timeline);
          thinking.before(timelineNode);
        }
      } else {
        updateTimelineCard(timelineNode, timeline);
      }
    }
    const label = $(thinkingId)?.querySelector('.turn-activity-label');
    if (label && observation.label) label.textContent = observation.label;
    if (observation.announcement) pendingAnnouncement = observation;
    if (observation.lookupStarted === true) lookupStarted = true;
    // A model may choose present-tense wording. Do not publish that wording
    // until the actual corresponding search has started in this same turn.
    if (label && lookupStarted && pendingAnnouncement) {
      const body = label.closest('.message-body');
      if (body && !body.querySelector('.turn-plan-announcement')) {
        const announcement = document.createElement('p');
        announcement.className = 'turn-plan-announcement';
        announcement.dataset.planHash = pendingAnnouncement.planHash;
        announcement.textContent = pendingAnnouncement.announcement;
        body.prepend(announcement);
      }
    }
  });
  source.addEventListener('turn_complete', (event) => {
    try {
      const value = JSON.parse(event.data);
      if (value.correlation_id === correlationId) {
        const terminal = String(value.terminal_status || 'UNCONFIRMED');
        if (timeline) {
          timeline = { ...timeline, terminal,
            retainedComplete: value.retained_complete === true };
          updateTimelineCard(timelineNode, timeline);
        }
        updateOperationalTurnTerminal(thinkingId, terminal);
      }
    } catch { /* The verified turn snapshot remains the authoritative source. */ }
    close();
  });
  source.addEventListener('stream_error', (event) => {
    const node = $(thinkingId);
    const label = node?.querySelector('.turn-activity-label');
    let code = '';
    try {
      code = String(JSON.parse(event.data)?.error?.code || '');
    } catch { /* Keep the operational message generic. */ }
    if (label) {
      label.textContent = code === 'turn_not_observed'
        ? 'No se observó ejecución en el registro verificado durante la ventana de seguimiento.'
        : 'El seguimiento verificado ya no está disponible.';
    }
    if (code === 'turn_not_observed' && node?.classList.contains('turn-operational-status')) {
      const title = node.querySelector('.turn-operational-title');
      const detail = node.querySelector('.turn-operational-detail');
      if (title) title.textContent = 'Turno no observado';
      if (detail) detail.textContent = 'La solicitud no apareció en el registro verificado durante la ventana de observación. No se ha inventado una respuesta ni se ha reenviado automáticamente.';
    }
    close();
  });
  return {
    close,
    async finish(delivery) {
      close();
      // Short turns may finish before the SSE observation interval. Re-read
      // their signed journal once, rather than inventing missing plan steps.
      try {
        const snapshot = await apiRequest(
              scopedTurnUrl(correlationId, 'snapshot')
        );
        const verified = timelineFromVerifiedSnapshot(snapshot, correlationId);
        if (verified) timeline = verified;
      } catch { /* Preserve the live evidence already observed. */ }
      if (!timeline) return;
      const terminal = delivery === 'committed' && timeline.terminal === 'COMMITTED' ? 'COMMITTED' :
        delivery === 'diagnostic' ? 'DIAGNOSED' :
        delivery === 'confirmation' ? 'WAITING_FOR_CONFIRMATION' :
        ['FAILED', 'BLOCKED'].includes(timeline.terminal) ? timeline.terminal : 'UNCONFIRMED';
      timeline = { ...timeline, terminal };
      if (!timelineNode) {
        // The answer is already visible: never delay it for an extra snapshot
        // request. Use the committed row as a stable anchor after replacement.
        const anchor = $(thinkingId) ||
          document.querySelector('.message-row.assistant[data-correlation-id="' + correlationId + '"]');
        if (anchor?.parentElement) {
          timelineNode = createTimelineCard(correlationId, timeline);
          anchor.before(timelineNode);
        }
      } else {
        updateTimelineCard(timelineNode, timeline);
      }
    },
  };
}

function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || bytes < 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const SheilyVoice = {
  activeVoiceId: null,
  defaultVoiceId: 'automatic',
  fallbackVoices: { es: 'es-ES-XimenaNeural', en: 'en-US-JennyNeural' },
  styles: [
    { id: 'automatic', name: 'Automático', description: 'Estado interno real de Sheily' },
    { id: 'warm', name: 'Cálida', description: 'Cercana y serena' },
    { id: 'calm', name: 'Calmada', description: 'Lenta y suave' },
    { id: 'direct', name: 'Directa', description: 'Clara y firme' },
    { id: 'empathetic', name: 'Empática', description: 'Cuidadosa y acogedora' },
    { id: 'enthusiastic', name: 'Entusiasta', description: 'Viva y enérgica' },
    { id: 'serious', name: 'Seria', description: 'Sobria y contenida' },
    { id: 'technical', name: 'Técnica', description: 'Precisa y estable' },
    { id: 'soft', name: 'Suave', description: 'Baja intensidad' },
    { id: 'urgent', name: 'Urgente', description: 'Rápida y firme' },
  ],
  // [pitch, rate, volume]. These are deliberately separated enough to be
  // perceptible on both Web Speech and the Edge MP3 fallback.
  styleProfiles: {
    warm: [1.10, 0.93, 0.92],
    calm: [0.90, 0.78, 0.78],
    direct: [0.97, 1.06, 1.00],
    empathetic: [1.08, 0.84, 0.86],
    enthusiastic: [1.24, 1.15, 1.00],
    serious: [0.80, 0.86, 0.94],
    technical: [0.96, 0.97, 0.90],
    soft: [0.86, 0.74, 0.68],
    urgent: [0.88, 1.28, 1.00],
  },
  isSpeaking: false,
  currentStopHandler: null,
  currentAudio: null,

  rememberedVoiceId() {
    const saved = storageGet('sheily.voice.id') || this.activeVoiceId || this.defaultVoiceId;
    if (!this.styles.some((style) => style.id === saved)) {
      storageSet('sheily.voice.id', this.defaultVoiceId);
      return this.defaultVoiceId;
    }
    return saved;
  },

  voiceCaption(voiceId) {
    const style = this.styles.find((item) => item.id === voiceId);
    return style ? `${style.name} — ${style.description}` : 'Automático — estado interno real de Sheily';
  },

  profileCaption(styleId) {
    if (styleId === 'automatic') {
      return 'Automático: tono, ritmo y volumen derivados del estado sellado del turno.';
    }
    const profile = this.styleProfiles[styleId];
    if (!profile) return '';
    return `Modulación forzada: tono ${profile[0].toFixed(2)}× · ritmo ${profile[1].toFixed(2)}× · volumen ${Math.round(profile[2] * 100)}%.`;
  },

  renderProfileCaption(styleId = this.rememberedVoiceId()) {
    const node = $('voice-style-profile');
    if (node) node.textContent = this.profileCaption(styleId);
  },

  async init() {
    this.activeVoiceId = this.rememberedVoiceId();
    this.populateSettingsSelector();
    this.renderProfileCaption();
    const languageSelect = $('setting-voice-language');
    if (languageSelect) languageSelect.value = this.language();
  },

  populateSettingsSelector() {
    const select = $('setting-voice-select');
    if (!select) return;

    select.replaceChildren();

    const optGroupNeural = document.createElement('optgroup');
    optGroupNeural.label = 'Automático o estilo forzado';

    const currentId = this.rememberedVoiceId();
    this.activeVoiceId = currentId;

    this.styles.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.name} — ${v.description}`;
      if (v.id === currentId) opt.selected = true;
      optGroupNeural.append(opt);
    });
    select.append(optGroupNeural);

  },

  cleanTextForSpeech(raw) {
    let text = String(raw || '');

    // 1. Remove fenced code blocks ```...```
    text = text.replace(/```[\s\S]*?```/g, ' , bloque de código omitido , ');

    // 2. Remove inline backticks `code` -> code
    text = text.replace(/`([^`]+)`/g, '$1');

    // 3. Remove markdown images ![alt](url) -> ''
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

    // 4. Remove markdown links [label](url) -> label
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // 5. CRITICAL: Phonetically convert SHEILY -> Shéili
    // Prevents TTS from spelling S - H - E - I - L - Y letter by letter!
    text = text.replace(/\bSHEILY\b/g, 'Shéili');
    text = text.replace(/\bSheily\b/g, 'Shéili');
    text = text.replace(/\bsheily\b/g, 'shéili');

    // 6. Strip all formatting and technical symbols so TTS NEVER reads them aloud
    text = text.replace(/[*#_~>|`^$%@&=<>{}\[\]\\]/g, ' ');

    // 7. Replace dashes, bullets, slashes with natural breathing pauses
    text = text.replace(/^\s*[-*+]\s+/gm, ', ');
    text = text.replace(/^\s*\d+\.\s+/gm, ', ');
    text = text.replace(/\s+[-/]\s+/g, ', ');
    text = text.replace(/https?:\/\/[^\s]+/g, 'enlace web');

    // 8. Collapse spaces and repeated punctuation
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/,\s*,/g, ',');
    text = text.replace(/\.\s*\./g, '.');

    return text.trim();
  },

  analyzeSegmentProsody(sentence, projection = null) {
    const text = sentence.trim();
    const userPitch = Number.parseFloat(storageGet('sheily.voice.pitch') || '1.00');
    const userSpeed = Number.parseFloat(storageGet('sheily.voice.speed') || '1.00');
    const selected = this.rememberedVoiceId();
    const fixed = this.styleProfiles[selected];
    let pitchMultiplier = fixed?.[0] ?? 1.0;
    let rateMultiplier = fixed?.[1] ?? 1.0;
    let volume = fixed?.[2] ?? 0.92;
    if (selected === 'automatic' && projection?.schema === 'shei.expression.voice_projection/v1') {
      const clamp = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : fallback;
      const warmth = clamp(projection.warmth, 0.5);
      const arousal = clamp(projection.arousal, 0.5);
      const confidence = clamp(projection.confidence, 0.5);
      const empathy = clamp(projection.empathy, 0.5);
      const intensity = clamp(projection.expression_intensity, 0.5);
      pitchMultiplier = 0.91 + (0.12 * warmth) + (0.08 * arousal) + (0.04 * empathy);
      rateMultiplier = 0.88 + (0.17 * arousal) + (0.07 * confidence) + (0.04 * intensity);
      volume = 0.72 + (0.18 * intensity) + (0.10 * confidence);
    }

    const finalPitch = Math.max(0.6, Math.min(1.8, userPitch * pitchMultiplier));
    const finalRate = Math.max(0.7, Math.min(1.4, userSpeed * rateMultiplier));

    return {
      text,
      pitch: Number(finalPitch.toFixed(2)),
      rate: Number(finalRate.toFixed(2)),
      volume: Number(Math.max(0.55, Math.min(1, volume)).toFixed(2)),
      pauseAfterMs: 140,
    };
  },

  language() {
    const value = storageGet('sheily.voice.language') || 'es';
    return value === 'en' ? 'en' : 'es';
  },

  browserFemaleVoice(language) {
    if (!globalThis.speechSynthesis) return null;
    const femaleNames = language === 'es'
      ? /\b(ximena|elvira|helena|sabina|monica|paulina|female|mujer)\b/i
      : /\b(jenny|zira|samantha|victoria|karen|moira|female|ava)\b/i;
    const prefix = language === 'en' ? 'en' : 'es';
    return globalThis.speechSynthesis.getVoices().find((voice) =>
      String(voice.lang || '').toLowerCase().startsWith(prefix) && femaleNames.test(String(voice.name || ''))
    ) || null;
  },

  splitIntoExpressiveSegments(rawText) {
    const clean = this.cleanTextForSpeech(rawText);
    if (!clean) return [];

    const rawMatches = clean.match(/[^.!?¡¿;:\n]+[.!?¡¿;:\n]+|[^.!?¡¿;:\n]+$/g) || [clean];
    const segments = [];

    for (let part of rawMatches) {
      part = part.trim();
      if (!part) continue;
      if (part.length > 170 && part.includes(',')) {
        const sub = part.split(/,(?=\s)/);
        sub.forEach((sp, idx) => {
          const s = sp.trim();
          if (s) segments.push(s + (idx < sub.length - 1 ? ',' : ''));
        });
      } else {
        segments.push(part);
      }
    }

    return segments.map((s) => this.analyzeSegmentProsody(s));
  },

  async speak(text, onStart, onEnd, projection = null) {
    this.stop();

    const selectedId = this.rememberedVoiceId();
    this.activeVoiceId = selectedId;
    const language = this.language();

    const clean = this.cleanTextForSpeech(text);
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }

    this.isSpeaking = true;
    if (onStart) onStart();

    const shaped = this.analyzeSegmentProsody(clean, projection);
    const browserVoice = this.browserFemaleVoice(language);
    if (browserVoice && typeof globalThis.SpeechSynthesisUtterance === 'function') {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.voice = browserVoice;
      utterance.lang = language === 'en' ? 'en-US' : 'es-ES';
      utterance.rate = shaped.rate;
      utterance.pitch = shaped.pitch;
      utterance.volume = shaped.volume;
      let failed = false;
      this.currentStopHandler = () => { globalThis.speechSynthesis.cancel(); this.isSpeaking = false; this.currentStopHandler = null; if (onEnd) onEnd(); };
      utterance.onend = () => { if (!failed) { this.isSpeaking = false; this.currentStopHandler = null; if (onEnd) onEnd(); } };
      utterance.onerror = () => { failed = true; this.currentStopHandler = null; void this.speakMp3Fallback(clean, language, shaped, onEnd); };
      globalThis.speechSynthesis.cancel();
      globalThis.speechSynthesis.speak(utterance);
      return;
    }
    await this.speakMp3Fallback(clean, language, shaped, onEnd);
  },

  async speakMp3Fallback(clean, language, shaped, onEnd) {
    try {
        const userSpeed = shaped.rate;
        const userPitch = shaped.pitch;
        const speedPercent = Math.round((userSpeed - 1.0) * 100);
        const pitchHz = Math.round((userPitch - 1.0) * 20);
        const volumePercent = Math.round((shaped.volume - 1.0) * 100);

        const rateStr = (speedPercent >= 0 ? '+' : '') + speedPercent + '%';
        const pitchStr = (pitchHz >= 0 ? '+' : '') + pitchHz + 'Hz';
        const volumeStr = (volumePercent >= 0 ? '+' : '') + volumePercent + '%';

        const res = await fetch('/api/tts/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: clean,
            voice: this.fallbackVoices[language],
            rate: rateStr,
            pitch: pitchStr,
            volume: volumeStr,
          }),
        });

        if (!res.ok) {
          throw new Error('TTS server error: ' + res.status);
        }

        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        let stopped = false;
        this.currentStopHandler = () => {
          stopped = true;
          try {
            audio.pause();
            audio.currentTime = 0;
            URL.revokeObjectURL(audioUrl);
          } catch (_) {}
          this.isSpeaking = false;
          this.currentAudio = null;
          this.currentStopHandler = null;
          if (onEnd) onEnd();
        };

        audio.onended = () => {
          if (!stopped) {
            URL.revokeObjectURL(audioUrl);
            this.isSpeaking = false;
            this.currentAudio = null;
            this.currentStopHandler = null;
            if (onEnd) onEnd();
          }
        };

        audio.onerror = () => {
          if (!stopped) {
            URL.revokeObjectURL(audioUrl);
            this.isSpeaking = false;
            this.currentAudio = null;
            this.currentStopHandler = null;
            if (onEnd) onEnd();
          }
        };

        await audio.play();
        return;
      } catch (err) {
        console.warn('Neural TTS synthesis failed:', err);
      }
    this.isSpeaking = false;
    this.currentStopHandler = null;
    toast('La voz de Sheily no está disponible en este momento.');
    if (onEnd) onEnd();
  },

  stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }
    if (this.currentStopHandler) {
      this.currentStopHandler();
    }
    this.isSpeaking = false;
  }
};

function browserSpeechRecognitionConsent() {
  if (storageGet('sheily.voice.recognition-consent') === 'v1') return true;
  if (typeof globalThis.confirm !== 'function') return false;
  const accepted = globalThis.confirm(
    'El reconocimiento de voz del navegador puede enviar audio a su proveedor (por ejemplo, Google). ¿Quieres permitirlo al usar dictado o manos libres?'
  );
  if (accepted) storageSet('sheily.voice.recognition-consent', 'v1');
  return accepted;
}

const HandsfreeEngine = {
  isActive: false,
  isProcessing: false,
  recognition: null,
  silenceTimer: null,
  currentTranscript: '',

  init() {
    const handsfreeBtn = $('handsfree-voice-button');
    if (handsfreeBtn) {
      handsfreeBtn.addEventListener('click', () => this.toggle());
    }

    const stopBtn = $('handsfree-stop-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stop());
    }

    const settingHandsfree = $('setting-voice-handsfree');
    if (settingHandsfree) {
      settingHandsfree.checked = storageGet('sheily.voice.handsfree') === 'true';
      settingHandsfree.addEventListener('change', () => {
        if (settingHandsfree.checked) {
          this.start();
        } else {
          this.stop();
        }
      });
    }

    // Global Shortcut: Alt + V to toggle handsfree mode
    window.addEventListener('keydown', (e) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.repeat || e.isComposing) return;
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        this.toggle();
      }
    });
  },

  toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
  },

  start() {
    const SpeechRec = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    if (!SpeechRec) {
      toast('⚠️ Tu navegador no soporta reconocimiento continuo de voz.');
      return;
    }
    if (!browserSpeechRecognitionConsent()) {
      toast('El modo manos libres no se ha activado.');
      return;
    }

    this.isActive = true;
    storageSet('sheily.voice.handsfree', 'true');
    const btn = $('handsfree-voice-button');
    if (btn) btn.classList.add('is-active');
    const hud = $('handsfree-hud');
    if (hud) hud.hidden = false;
    const settingHandsfree = $('setting-voice-handsfree');
    if (settingHandsfree) settingHandsfree.checked = true;

    toast('🎙️ Modo Manos Libres activado. Habla con naturalidad.');
    this.startListening();
  },

  stop() {
    this.isActive = false;
    this.isProcessing = false;
    storageSet('sheily.voice.handsfree', 'false');
    const btn = $('handsfree-voice-button');
    if (btn) btn.classList.remove('is-active');
    const hud = $('handsfree-hud');
    if (hud) hud.hidden = true;
    const settingHandsfree = $('setting-voice-handsfree');
    if (settingHandsfree) settingHandsfree.checked = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try { this.recognition.abort(); } catch (_) {}
      this.recognition = null;
    }
    SheilyVoice.stop();
    toast('⏹️ Modo Manos Libres desactivado.');
  },

  updateHud(state, text) {
    const hud = $('handsfree-hud');
    const label = $('handsfree-status-text');
    if (!hud || !label) return;

    hud.classList.remove('is-speaking', 'is-thinking');
    if (state === 'speaking') {
      hud.classList.add('is-speaking');
    } else if (state === 'thinking') {
      hud.classList.add('is-thinking');
    }
    label.textContent = text;
  },

  startListening() {
    if (!this.isActive || this.isProcessing) return;

    if (this.recognition) {
      try { this.recognition.abort(); } catch (_) {}
      this.recognition = null;
    }

    const SpeechRec = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      this.recognition = new SpeechRec();
      this.recognition.lang = SheilyVoice.language() === 'en' ? 'en-US' : 'es-ES';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.updateHud('listening', '🟢 Escuchando... Habla cuando quieras');

      this.recognition.onresult = (event) => {
        // Natural Barge-In: If Sheily is speaking and user speaks, stop Sheily immediately!
        if (SheilyVoice.isSpeaking) {
          SheilyVoice.stop();
        }

        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript + ' ';
          } else {
            interim += item[0].transcript;
          }
        }

        const heard = (final || interim).trim();
        if (heard) {
          this.currentTranscript = heard;
          this.updateHud('listening', `🎙️ "${heard}"`);
          const msgInput = $('message');
          if (msgInput) {
            msgInput.value = heard;
            resizeComposer();
          }

          // Voice Activity Detection: 1.4s silence auto-commits
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            this.commitSpokenMessage();
          }, 1400);
        }
      };

      this.recognition.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('Handsfree recognition warning:', e.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isActive && !this.isProcessing && !SheilyVoice.isSpeaking) {
          setTimeout(() => {
            if (this.isActive && !this.isProcessing && !SheilyVoice.isSpeaking) {
              this.startListening();
            }
          }, 250);
        }
      };

      this.recognition.start();
    } catch (err) {
      console.warn('Failed to start handsfree recognition:', err);
    }
  },

  commitSpokenMessage() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    const text = this.currentTranscript.trim();
    if (!text || this.isProcessing) return;

    this.currentTranscript = '';
    this.isProcessing = true;
    this.updateHud('thinking', '🟣 Enviando y pensando...');

    if (this.recognition) {
      try { this.recognition.abort(); } catch (_) {}
      this.recognition = null;
    }

    const msgInput = $('message');
    if (msgInput) msgInput.value = '';

    void (async () => {
      try {
        await sendMessage(text);
      } finally {
        if (this.isActive && this.isProcessing) {
          this.isProcessing = false;
          this.updateHud('listening', '🟢 Escuchando... Tu turno');
          this.startListening();
        }
      }
    })();
  },

  onAssistantReplyReady(replyText, expressionForVoice = null) {
    if (!this.isActive) return;

    this.isProcessing = false;
    this.updateHud('speaking', '🔊 Sheily hablando (puedes interrumpirme)');

    SheilyVoice.speak(
      replyText,
      () => {
        this.updateHud('speaking', '🔊 Sheily hablando (interrúmpeme cuando quieras)');
        this.startBargeInListener();
      },
      () => {
        if (this.isActive) {
          this.updateHud('listening', '🟢 Escuchando... Tu turno');
          setTimeout(() => {
            if (this.isActive && !SheilyVoice.isSpeaking) {
              this.startListening();
            }
          }, 300);
        }
      },
      expressionForVoice
    );
  },

  startBargeInListener() {
    if (!this.isActive) return;
    const SpeechRec = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      if (this.recognition) {
        try { this.recognition.abort(); } catch (_) {}
      }
      this.recognition = new SpeechRec();
      this.recognition.lang = 'es-ES';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = () => {
        SheilyVoice.stop();
        this.startListening();
      };
      this.recognition.start();
    } catch (_) {}
  }
};

function attachMessageActions(body, text) {
  if (typeof document === 'undefined' || !body || !text) return;
  if (body.querySelector('.message-actions')) return;
  const actions = document.createElement('div');
  actions.className = 'message-actions';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'action-btn copy-btn';
  copyBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copiar</span>';
  copyBtn.addEventListener('click', async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.append(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      copyBtn.classList.add('is-copied');
      const label = copyBtn.querySelector('span');
      if (label) label.textContent = '¡Copiado!';
      setTimeout(() => {
        copyBtn.classList.remove('is-copied');
        if (label) label.textContent = 'Copiar';
      }, 2000);
    } catch {
      toast('No se ha podido copiar.');
    }
  });

  const speakBtn = document.createElement('button');
  speakBtn.type = 'button';
  speakBtn.className = 'action-btn speak-btn';
  speakBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg><span>Escuchar</span>';
  speakBtn.addEventListener('click', () => {
    const label = speakBtn.querySelector('span');
    if (speakBtn.classList.contains('is-speaking') || SheilyVoice.isSpeaking) {
      SheilyVoice.stop();
      speakBtn.classList.remove('is-speaking');
      if (label) label.textContent = 'Escuchar';
      return;
    }

    document.querySelectorAll('.speak-btn.is-speaking').forEach((btn) => {
      btn.classList.remove('is-speaking');
      const l = btn.querySelector('span');
      if (l) l.textContent = 'Escuchar';
    });

    SheilyVoice.speak(
      text,
      () => {
        speakBtn.classList.add('is-speaking');
        if (label) label.textContent = 'Detener';
      },
      () => {
        speakBtn.classList.remove('is-speaking');
        if (label) label.textContent = 'Escuchar';
      }
    );
  });

  const vaultBtn = document.createElement('button');
  vaultBtn.type = 'button';
  vaultBtn.className = 'action-btn vault-save-btn';
  vaultBtn.innerHTML = icons.lock + '<span>Guardar en Custodia</span>';
  vaultBtn.addEventListener('click', () => {
    void quickSaveMessageToVault(text);
  });

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'action-btn';
  saveBtn.textContent = 'Guardar .md';
  saveBtn.addEventListener('click', () => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'respuesta.md';
    link.click();
    URL.revokeObjectURL(url);
  });

  const messageActions = [copyBtn, saveBtn, speakBtn];
  if (state.personalSettings?.private_chat_shortcut !== false) messageActions.push(vaultBtn);
  actions.append(...messageActions);
  body.append(actions);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader no soportado'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function handleFiles(fileList) {
  if (!fileList || !fileList.length) return;
  const maxFiles = 16;
  for (const file of fileList) {
    if (state.attachments.length >= maxFiles) {
      toast('Máximo ' + maxFiles + ' archivos simultáneos.');
      break;
    }
    try {
      state.attachments.push({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        file,
      });
      toast('Archivo listo: ' + file.name + ' (' + formatFileSize(file.size) + ')');
    } catch {
      toast('No se ha podido leer el archivo ' + file.name);
    }
  }
  renderAttachments();
}

function renderAttachments() {
  const tray = $('attachment-tray');
  const chips = $('attachment-chips');
  if (!tray || !chips) return;
  chips.replaceChildren();
  if (!state.attachments.length) {
    tray.hidden = true;
    return;
  }
  tray.hidden = false;
  state.attachments.forEach((item, index) => {
    const chip = document.createElement('div');
    chip.className = 'attachment-chip';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip-preview-btn';
    btn.textContent = '📄 ' + item.name;
    btn.title = 'Previsualizar en el espacio de trabajo';
    btn.addEventListener('click', () => {
      if (globalThis.SheilyResults && typeof globalThis.SheilyResults.open === 'function') {
        void SheilyUploads.original(item, { sessionId: state.sessionId, conversationId: state.conversationId }).then((file) => SheilyResults.open([file], 0)).catch((error) => toast(error.message));
      }
    });
    const size = document.createElement('span');
    size.className = 'chip-size';
    size.textContent = formatFileSize(item.size);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'chip-remove';
    remove.setAttribute('aria-label', 'Eliminar adjunto');
    remove.textContent = '✕';
    remove.disabled = state.busy;
    remove.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.busy) return;
      state.attachments.splice(index, 1);
      renderAttachments();
    });
    chip.append(btn, size, remove);
    chips.append(chip);
  });
}

let voiceMediaRecorder = null;
let voiceAudioChunks = [];
let isVoiceListening = false;
let speechRecognizer = null;

function setupVoiceInput() {
  const voiceBtn = $('voice-input-button');
  if (!voiceBtn) return;
  voiceBtn.addEventListener('click', async () => {
    if (isVoiceListening) {
      stopVoiceCapture();
      return;
    }
    await startVoiceCapture();
  });
}

async function startVoiceCapture() {
  const voiceBtn = $('voice-input-button');
  if (!voiceBtn) return;

  if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    toast('Acceso a micrófono no disponible en este entorno.');
    return;
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      toast('Permiso de micrófono denegado. Habilita el acceso al micrófono en el navegador.');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      toast('No se encontró ningún micrófono conectado en tu equipo.');
    } else {
      toast('No se pudo abrir el micrófono: ' + (err.message || err.name));
    }
    return;
  }

  isVoiceListening = true;
  voiceBtn.classList.add('is-listening');
  voiceBtn.setAttribute('aria-pressed', 'true');
  toast('🎤 Escuchando… habla con claridad. Pulsa de nuevo para finalizar.');

  voiceAudioChunks = [];
  try {
    voiceMediaRecorder = new MediaRecorder(stream);
    voiceMediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) voiceAudioChunks.push(event.data);
    };
    voiceMediaRecorder.start();
  } catch {
    voiceMediaRecorder = null;
  }

  const SpeechRec = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (SpeechRec && browserSpeechRecognitionConsent()) {
    try {
      speechRecognizer = new SpeechRec();
      speechRecognizer.lang = 'es-ES';
      speechRecognizer.continuous = true;
      speechRecognizer.interimResults = true;
      const input = $('message');
      const startValue = input ? input.value.trim() : '';

      speechRecognizer.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (input && transcript) {
          input.value = startValue ? startValue + ' ' + transcript : transcript;
          resizeComposer();
        }
      };
      speechRecognizer.onerror = (err) => {
        if (err.error === 'network' || err.error === 'service-not-allowed') {
          console.warn('SpeechRecognition online service unavailable, using audio note recording.');
        }
      };
      speechRecognizer.start();
    } catch {
      speechRecognizer = null;
    }
  }

  voiceBtn._activeStream = stream;
}

function stopVoiceCapture() {
  const voiceBtn = $('voice-input-button');
  if (!voiceBtn || !isVoiceListening) return;

  isVoiceListening = false;
  voiceBtn.classList.remove('is-listening');
  voiceBtn.setAttribute('aria-pressed', 'false');

  if (speechRecognizer) {
    try { speechRecognizer.stop(); } catch {}
    speechRecognizer = null;
  }

  if (voiceMediaRecorder) {
    voiceMediaRecorder.onstop = () => {
      const input = $('message');
      if (!input || !input.value.trim()) {
        const audioBlob = new Blob(voiceAudioChunks, { type: 'audio/webm' });
        if (audioBlob.size > 800) {
          const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
          const audioName = 'nota-de-voz-' + timestamp + '.webm';
          state.attachments.push({
            name: audioName,
            size: audioBlob.size,
            type: 'audio/webm',
            file: audioBlob,
          });
          renderAttachments();
          if (input) {
            input.value = 'Transcribe y analiza esta nota de voz.';
            resizeComposer();
          }
          toast('🎤 Nota de voz grabada y lista para enviar.');
        }
      } else {
        toast('Dictado completado.');
      }
      voiceAudioChunks = [];
    };
    try { voiceMediaRecorder.stop(); } catch {}
  }

  if (voiceBtn._activeStream) {
    voiceBtn._activeStream.getTracks().forEach((track) => track.stop());
    voiceBtn._activeStream = null;
  }
}

const REPLY_DELIVERY_KEY = 'sheily.reply.delivery';

function replyDeliveryMode() {
  const saved = storageGet(REPLY_DELIVERY_KEY);
  return saved === 'text' || saved === 'voice' || saved === 'both' ? saved : 'both';
}

function replyShowsText(deliveryBody) {
  if (replyDeliveryMode() !== 'voice') return true;
  return !deliveryBody || deliveryKind(deliveryBody) !== 'committed';
}

function replySpeaks() {
  const mode = replyDeliveryMode();
  if (mode === 'text') return false;
  if (mode === 'voice') return true;
  if (state.personalSettings && typeof state.personalSettings.voice_tts_autoplay === 'boolean') {
    return state.personalSettings.voice_tts_autoplay;
  }
  return storageGet('sheily.voice.autoplay') === 'true';
}

function voiceOnlyNotice(text, deliveryBody) {
  const wrap = document.createElement('div');
  wrap.className = 'voice-only-note';
  const label = document.createElement('p');
  label.textContent = 'Sheily respondió por voz.';
  const reveal = document.createElement('button');
  reveal.type = 'button';
  reveal.className = 'action-btn';
  reveal.textContent = 'Ver texto';
  reveal.addEventListener('click', () => {
    const body = wrap.parentElement;
    if (!body) return;
    body.innerHTML = SheilyResults.renderMarkdown(text);
    if (deliveryBody) renderDelivery(body, deliveryBody);
    SheilyResults.attachResponse(body, text, deliveredArtifacts(deliveryBody));
    attachMessageActions(body, text);
  });
  wrap.append(label, reveal);
  return wrap;
}

function speakAssistantReply(text, body, deliveryBody = null) {
  if (!text) return;
  if (typeof HandsfreeEngine !== 'undefined' && HandsfreeEngine.isActive) {
    if (replySpeaks()) {
      HandsfreeEngine.onAssistantReplyReady(text, deliveryBody?.expression_for_voice || null);
    } else if (HandsfreeEngine.isProcessing) {
      HandsfreeEngine.isProcessing = false;
      HandsfreeEngine.updateHud('listening', '🟢 Escuchando... Tu turno');
      HandsfreeEngine.startListening();
    }
    return;
  }
  if (!replySpeaks()) return;
  const speakBtn = body ? body.querySelector('.speak-btn') : null;
  const label = speakBtn ? speakBtn.querySelector('span') : null;
  SheilyVoice.speak(
    text,
    () => {
      if (speakBtn) speakBtn.classList.add('is-speaking');
      if (label) label.textContent = 'Detener';
    },
    () => {
      if (speakBtn) speakBtn.classList.remove('is-speaking');
      if (label) label.textContent = 'Escuchar';
    },
    deliveryBody?.expression_for_voice || null
  );
}

// Do not simulate a streaming model with browser-side timers. Native turn
// events remain available independently; actual answer text is committed once.
function streamAssistantReply(thinkingNode, text, deliveryBody) {
  if (typeof document === 'undefined' || !thinkingNode) return Promise.resolve();
  const complete = createMessageElement('assistant', text, { delivery: deliveryBody, liveReply: true });
  if (thinkingNode.dataset?.correlationId) {
    complete.dataset.correlationId = thinkingNode.dataset.correlationId;
  }
  thinkingNode.replaceWith(complete);
  speakAssistantReply(text, complete.querySelector('.message-body'), deliveryBody);
  return Promise.resolve();
}

async function sendMessage(message) {
  const text = String(message || '').trim();
  if (state.busy) return;
  if (!text) {
    if (!state.attachments.length) return;
    return sendMessage('Revisa los archivos adjuntos.');
  }
  if (state.conversationTitle === 'Nueva conversación') {
    state.conversationTitle = compactText(text);
    $('page-title').textContent = state.conversationTitle;
  }
  appendMessage('user', text);
  const thinkingId = 'thinking-' + randomId();
  appendMessage('assistant', '', { thinking: true, id: thinkingId });
  setBusy(true);
  const requestStartedAt = Date.now();
  const correlationId = randomId();
  const sentAttachments = state.attachments.slice();
  let chatDispatched = false;
  let chatResponseReceived = false;
  let keepProgressOpen = false;
  let progress = {
    close() {},
    finish() { return Promise.resolve(); },
  };
  state.lastTurnCorrelationId = correlationId;
  state.lastTurn = {
    correlationId,
    conversationId: state.conversationId,
    status: 'PENDING',
    attachmentCount: sentAttachments.length,
  };
  const thinkingNode = $(thinkingId);
  if (thinkingNode) thinkingNode.dataset.correlationId = correlationId;

  try {
    // Presentation mode is a bounded request field, never a prefix that changes
    // the user's intent or becomes a forged system instruction.
    const outboundText = text;
    const uploadScope = { sessionId: state.sessionId, conversationId: state.conversationId };
    for (const attachment of sentAttachments) {
      await SheilyUploads.upload(attachment, uploadScope);
    }

    // A verified turn stream must not start while attachments are still being
    // uploaded: a slow upload can otherwise exhaust the observation grace
    // before /api/chat has even persisted the user attempt.
    try {
      progress = startTurnProgress(correlationId, thinkingId);
    } catch {
      // Progress is observational. Its unavailability must never block the
      // governed chat dispatch itself.
    }

    chatDispatched = true;
    const body = await apiRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: outboundText,
        cognitive_mode: state.cognitiveMode,
        attachment_ids: sentAttachments.length ? sentAttachments.map((item) => item.attachment_id) : undefined,
        session_id: state.sessionId,
        conversation_id: state.conversationId,
        correlation_id: correlationId,
      }),
    });
    chatResponseReceived = true;
    const kind = deliveryKind(body);
    state.lastTurn = {
      correlationId, conversationId: state.conversationId, status: kind,
      elapsedMs: Math.max(0, Date.now() - requestStartedAt),
      attachmentCount: sentAttachments.length,
    };
    // The signed journal is still fetched, but its extra round-trip must not
    // postpone a response that the upstream delivery already certified.
    void progress.finish(kind).catch(() => {});
    if (kind === 'blocked') {
      const blocked = new Error(
        body.failure_reason || body.reason || 'SHEILY no ha confirmado una respuesta completa.'
      );
      blocked.code = 'DELIVERY_BLOCKED';
      blocked.status = 422;
      throw blocked;
    }
    const reply = kind === 'confirmation' || kind === 'diagnostic'
      ? String(body.reply || '')
      : committedReply(body);
    const hasResult = body.terminal_output && body.terminal_output.verified === true;
    if (!reply && !hasResult && !deliveredArtifacts(body).length) {
      const invalid = new Error('La entrega no contiene texto, un resultado verificado ni archivos.');
      invalid.code = 'INVALID_PUBLIC_DELIVERY';
      invalid.status = 500;
      throw invalid;
    }
    state.attachments = state.attachments.filter((item) => !sentAttachments.includes(item));
    renderAttachments();
    const thinking = $(thinkingId);
    if (thinking) {
      await streamAssistantReply(thinking, reply, body);
    }
    await loadConversations({ quiet: true });
  } catch (error) {
    const requestDispatchedWithoutResponse = chatDispatched && !chatResponseReceived;
    const disposition = chatFailureDisposition(error, requestDispatchedWithoutResponse);
    const deliveryUnknown = disposition === 'DELIVERY_UNKNOWN';
    state.lastTurn = {
      correlationId,
      conversationId: state.conversationId,
      status: disposition,
      elapsedMs: Math.max(0, Date.now() - requestStartedAt),
      attachmentCount: sentAttachments.length,
    };

    if (deliveryUnknown) {
      // The server may have accepted the uploaded attachments and the governed
      // turn. Clear the composer-side attachment queue to avoid an accidental
      // duplicate on the next independent message.
      state.attachments = state.attachments.filter((item) => !sentAttachments.includes(item));
      renderAttachments();
      keepProgressOpen = true;
    } else {
      void progress.finish('blocked').catch(() => {});
    }

    const thinking = $(thinkingId);
    if (thinking) {
      thinking.replaceWith(createOperationalTurnElement(
        correlationId,
        disposition,
        error,
        { id: thinkingId },
      ));
    }

    // Only a request that is known not to have an ambiguous delivery is copied
    // back into the composer. Unknown delivery is intentionally not offered as
    // an implicit retry because the original effect may still have executed.
    if (!deliveryUnknown) {
      const composer = $('message');
      if (composer && !composer.value.trim()) {
        composer.value = text;
        resizeComposer();
      }
    }
    if (error.code === 'AUTH_REQUIRED') showAccess();
  } finally {
    if (!keepProgressOpen) progress.close();
    setBusy(false);
    if ($('context-inspector-panel')?.hidden === false) void refreshContextInspector();
    $('message').focus();
    $('message-scroll').scrollTo({ top: $('message-scroll').scrollHeight, behavior: 'smooth' });
  }
}

function memoryKind(record) {
  const raw = String(record?.memory_kind || record?.record_kind || '').toLocaleLowerCase('es');
  if (raw.includes('semantic')) return 'semantic';
  if (raw.includes('procedural')) return 'procedural';
  if (raw.includes('failure')) return 'failure';
  if (raw.includes('prospective')) return 'prospective';
  if (raw.includes('autobiographical')) return 'autobiographical';
  if (raw.includes('implicit')) return 'implicit';
  return 'episodic';
}

function memoryKindLabel(kind) {
  return {
    semantic: 'Conocimiento',
    procedural: 'Procedimiento',
    episodic: 'Experiencia',
    failure: 'Fallo / Antipatrón',
    prospective: 'Prospectiva',
    autobiographical: 'Autobiográfica',
    implicit: 'Implícita'
  }[kind] || 'Recuerdo';
}

function memoryTitle(record) {
  if (record?.title) return compactText(record.title, 100);
  const kind = memoryKind(record);
  if (kind === 'semantic') return compactText(record.name || record.proposition || 'Conocimiento guardado', 100);
  if (kind === 'procedural') return compactText(record.name || record.skill_name || 'Procedimiento aprendido', 100);
  if (kind === 'failure') return compactText(record.failure_kind || record.signature || 'Fallo detectado', 100);
  if (kind === 'prospective') return compactText(record.trigger_type || record.intention || 'Recordatorio prospectivo', 100);
  if (kind === 'autobiographical') return compactText(record.concept || record.name || 'Hito autobiográfico', 100);
  if (kind === 'implicit') return compactText(record.preference_key || record.pattern || 'Patrón observado', 100);
  return compactText(record.query || record.title || 'Experiencia recordada', 100);
}

function memoryPreview(record) {
  if (record?.preview) return compactText(record.preview, 280);
  const kind = memoryKind(record);
  const value = kind === 'semantic'
    ? (record.definition || record.proposition || record.text)
    : kind === 'procedural'
      ? (record.description || record.context || record.steps)
      : kind === 'failure'
        ? (record.replan_hint || record.detail || record.content)
        : kind === 'prospective'
          ? (record.action_payload || record.context_predicate || record.content)
          : kind === 'autobiographical'
            ? (record.definition || record.value || record.content)
            : kind === 'implicit'
              ? (record.observation || record.observed_value || record.content)
              : (record.response || record.content || record.query);
  const text = typeof value === 'string' ? value : value ? JSON.stringify(value) : '';
  return compactText(text || 'Sin vista previa disponible.', 280);
}

function memoryOrigin(record) {
  const storedDetails = record && typeof record['metadata'] === 'object' && record['metadata'] ? record['metadata'] : {};
  return storedDetails.source_session_id || record.source_session_id || storedDetails.writer_actor || record.created_by || 'Origen registrado por el motor';
}

function memoryIdentifier(record) {
  return String(record?.memory_id || record?.storage_record_id || '').trim();
}

function renderMemoryList() {
  const list = $('memory-list');
  list.replaceChildren();
  const empty = state.memories.length === 0;
  $('memory-empty').hidden = !empty;
  $('memory-empty-copy').textContent = state.memoryQuery
    ? 'No hay recuerdos que coincidan con esta búsqueda.'
    : 'SHEILY todavía no conserva recuerdos cognitivos de este tipo en tu espacio.';
  for (const record of state.memories) {
    const id = memoryIdentifier(record);
    const kind = memoryKind(record);
    const row = document.createElement('article');
    row.className = 'memory-item';

    const glyph = document.createElement('span');
    glyph.className = 'memory-kind-icon';
    glyph.textContent = {
      semantic: 'C', procedural: 'P', episodic: 'E', failure: 'F',
      prospective: '↗', autobiographical: 'A', implicit: 'I',
    }[kind] || 'M';
    glyph.setAttribute('aria-hidden', 'true');

    const copy = document.createElement('div');
    copy.className = 'memory-copy';
    const title = document.createElement('h3');
    title.textContent = memoryTitle(record);
    const preview = document.createElement('p');
    preview.textContent = memoryPreview(record);
    const meta = document.createElement('div');
    meta.className = 'memory-meta';
    const labels = [memoryKindLabel(kind)];
    if (record.validation_status === 'user_declared') labels.push('Aportado por ti · sin verificación independiente');
    if (record.validation_status === 'unverified') labels.push('Sin verificación independiente');
    if (record.validation_status === 'learned_verified') labels.push('Con evidencia contrastada');
    const timestamp = record.timestamp || record.created_at;
    if (timestamp) labels.push(formatRelativeDate(timestamp));
    if (typeof record.confidence === 'number') labels.push('Estimación del motor: ' + Math.round(record.confidence * 100) + '% · no es verificación');
    labels.forEach((label) => {
      const chip = document.createElement('span');
      chip.textContent = label;
      meta.append(chip);
    });
    const details = document.createElement('details');
    details.className = 'memory-details';
    const summary = document.createElement('summary');
    summary.textContent = record.structured ? 'Ver contenido y procedencia' : 'Ver procedencia';
    const values = document.createElement('dl');
    const detailRows = [
      ['Origen', memoryOrigin(record)],
      ['Identificador', id || 'No disponible'],
      ['Referencia', record.canonical_ref || 'No disponible'],
      ['Estado', record.lifecycle_status || 'ACTIVE'],
    ];
    if (Array.isArray(record.source_memory_ids) && record.source_memory_ids.length) {
      detailRows.push(['Recuerdos de origen', record.source_memory_ids.join(', ')]);
    }
    if (record.structured && typeof record.structured === 'object') {
      const data = record.structured;
      for (const [key, label] of [['subject', 'Tema'], ['predicate', 'Relación'], ['value', 'Dato'], ['scope', 'Ámbito'], ['objective', 'Objetivo']]) {
        if (data[key]) detailRows.push([label, data[key]]);
      }
      for (const [key, label] of [['preconditions', 'Condiciones previas'], ['steps', 'Pasos'], ['postconditions', 'Resultado esperado']]) {
        if (Array.isArray(data[key]) && data[key].length) {
          detailRows.push([label, data[key].map((item, index) => {
            const text = typeof item === 'string' ? item : [item.action, item.expected_result, item.verification].filter(Boolean).join(' · ');
            return (index + 1) + '. ' + text;
          }).join('\n')]);
        }
      }
    }
    detailRows.forEach(([label, value]) => {
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = String(value);
      values.append(term, description);
    });
    details.append(summary, values);
    const read = document.createElement('button');
    read.type = 'button';
    read.className = 'secondary-button memory-read';
    read.textContent = 'Leer completo';
    read.disabled = !id;
    read.addEventListener('click', () => void openMemoryDocument(id, read));
    preview.setAttribute('aria-label', 'Resumen abreviado del recuerdo');
    copy.append(title, preview, meta, read, details);

    const forget = document.createElement('button');
    forget.type = 'button';
    forget.className = 'danger-button memory-forget';
    forget.textContent = 'Olvidar';
    forget.disabled = !id;
    forget.setAttribute('aria-label', 'Olvidar ' + memoryTitle(record));
    forget.addEventListener('click', () => void forgetMemory(record));
    row.append(glyph, copy, forget);
    list.append(row);
  }
}

async function openMemoryDocument(id, button) {
  const requestId = ++state.memoryDetailRequestId;
  button.disabled = true;
  button.textContent = 'Leyendo contenido…';
  try {
    const body = await apiRequest('/api/memories/' + encodeURIComponent(id));
    if (requestId !== state.memoryDetailRequestId || state.view !== 'memory' || !state.authenticated) return;
    const doc = body.memory;
    const markdown = SheilyMemoryExport.documentMarkdown(doc);
    const json = JSON.stringify(doc, null, 2) + '\n';
    await SheilyResults.open([
      { name: 'recuerdo.md', text: markdown, bytes: new TextEncoder().encode(markdown), mime: 'text/markdown', origin: 'Contenido completo guardado · no implica veracidad' },
      { name: 'recuerdo.json', text: json, bytes: new TextEncoder().encode(json), mime: 'application/json', origin: 'Datos públicos del recuerdo y su procedencia' },
    ]);
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = 'Leer completo'; }
}

async function loadMemories(append = false) {
  const requestId = ++state.memoryRequestId;
  const params = new URLSearchParams({ kind: state.memoryKind, limit: '50' });
  if (state.memoryQuery) params.set('query', state.memoryQuery);
  if (append) {
    if (state.memoryNextOffset === null) return;
    params.set('offset', String(state.memoryNextOffset));
    params.set('snapshot', state.memorySnapshot);
  }
  const more = $('memory-load-more');
  more.disabled = true;
  try {
    const body = await apiRequest('/api/memories?' + params.toString());
    if (requestId !== state.memoryRequestId) return;
    if (body.schema !== 'shei.public.memory_list/v2' || !Array.isArray(body.memories)) throw new Error('La API de memoria todavía no ofrece lectura completa y paginación.');
    state.memories = append ? state.memories.concat(body.memories) : body.memories;
    state.memorySnapshot = body.snapshot;
    state.memoryNextOffset = body.next_offset;
    $('memory-summary').textContent = 'Mostrando ' + state.memories.length + ' de ' + body.total_matches + ' recuerdos' + (state.memoryQuery ? ' encontrados.' : ' disponibles.');
    const counts = body.counts_by_kind || {};
    const parts = [
      (counts.episodic || 0) + ' experiencias',
      (counts.semantic || 0) + ' conocimientos',
      (counts.procedural || 0) + ' procedimientos'
    ];
    if (counts.failure) parts.push(counts.failure + ' fallos');
    if (counts.prospective) parts.push(counts.prospective + ' prospectivos');
    if (counts.autobiographical) parts.push(counts.autobiographical + ' autobiográficos');
    if (counts.implicit) parts.push(counts.implicit + ' implícitos');
    $('memory-counts').textContent = parts.join(' · ');
    more.hidden = !body.has_more;
    renderMemoryList();
  } finally { if (requestId === state.memoryRequestId) more.disabled = false; }
}


const WORKSPACE_VIEWS = Object.freeze(['chat', 'conversations', 'documents', 'memory', 'learning', 'vault', 'system', 'admin', 'settings']);
const WORKSPACE_TABS = Object.freeze({memory: ['notes', 'recovered'], learning: ['sources', 'training', 'jobs']});

function currentWorkspaceRoute() {
  const pieces = String(globalThis.location?.hash || '').replace(/^#/, '').split('/');
  return {view: WORKSPACE_VIEWS.includes(pieces[0]) ? pieces[0] : 'chat', tab: pieces[1] || ''};
}

function updateWorkspaceAddress(view, tab = '', replace = false) {
  if (!globalThis.location || !globalThis.history?.replaceState) return;
  const fragment = '#' + view + (tab ? '/' + tab : '');
  if (globalThis.location.hash === fragment) return;
  const method = replace ? 'replaceState' : 'pushState';
  globalThis.history[method]({view, tab}, '', fragment);
}

function activateWorkspaceTab(group, tab, options = {}) {
  const allowed = WORKSPACE_TABS[group];
  if (!allowed || !allowed.includes(tab)) return false;
  state[group + 'Tab'] = tab;
  const bar = document.querySelector('[data-section-tabs="' + group + '"]');
  if (!bar) return false;
  bar.querySelectorAll('[data-tab]').forEach((button) => {
    const active = button.dataset.tab === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    if (active && options.focus) button.focus();
  });
  document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
    if (panel.dataset.tabPanel.startsWith(group + ':')) panel.hidden = panel.dataset.tabPanel !== group + ':' + tab;
  });
  if (state.view === group && options.address !== false) updateWorkspaceAddress(group, tab, options.replace === true);
  if (options.load !== false) {
    if (group === 'memory' && tab === 'notes') void loadCanonicalNotes();
    if (group === 'memory' && tab === 'recovered') void loadMemoryStatus();
  }
  return true;
}

function bindWorkspaceTabs() {
  document.querySelectorAll('[data-section-tabs]').forEach((bar) => {
    const group = bar.dataset.sectionTabs;
    bar.querySelectorAll('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => activateWorkspaceTab(group, button.dataset.tab));
      button.addEventListener('keydown', (event) => {
        const tabs = WORKSPACE_TABS[group];
        const index = tabs.indexOf(button.dataset.tab);
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        activateWorkspaceTab(group, tabs[next], {focus: true});
      });
    });
  });
}

function personalScopeQuery(extra = {}) {
  if (!state.sessionId || !state.conversationId) throw new Error('Abre una conversación antes de gestionar sus datos.');
  return new URLSearchParams({session_id: state.sessionId, conversation_id: state.conversationId, ...extra});
}

function noteId(value) {
  return typeof value === 'string' && /^sem_[a-f0-9]{32}$/.test(value) ? value : '';
}

function validNoteSummary(note) {
  return !!note && !!noteId(note.memory_id) && Number.isSafeInteger(note.revision) && note.revision > 0
    && typeof note.title === 'string' && typeof note.lifecycle_status === 'string'
    && /^[a-f0-9]{64}$/.test(note.text_sha256 || '');
}

function notesPermission(action) {
  return state.notesVerified === true && state.notesCapabilities?.[action] === true;
}

function noteIsEditable(note) {
  return validNoteSummary(note) && note.lifecycle_status === 'ACTIVE' && note.is_current === true
    && note.can_edit === true && notesPermission('revise');
}

function updateNotesSelection() {
  const selected = state.notes.filter((note) => state.notesSelected.includes(note.memory_id) && note.lifecycle_status === 'ACTIVE' && note.is_current === true && note.can_edit === true);
  state.notesSelected = selected.map((note) => note.memory_id);
  $('notes-selection-bar').hidden = selected.length === 0;
  $('notes-selected-count').textContent = selected.length + (selected.length === 1 ? ' nota vigente seleccionada' : ' notas vigentes seleccionadas');
  $('notes-merge').disabled = !notesPermission('atomic_supersede') || selected.length > (state.notesCapabilities?.max_replacements || 6);
  $('note-new').disabled = !notesPermission('create');
}

function renderCanonicalNotes() {
  const list = $('notes-list');
  list.replaceChildren();
  const query = state.notesQuery.toLocaleLowerCase('es');
  const visible = state.notes.filter((note) => [note.title, note.preview, note.memory_id].join(' ').toLocaleLowerCase('es').includes(query));
  for (const note of visible) {
    const card = document.createElement('article');
    card.className = 'note-card' + (note.lifecycle_status === 'ACTIVE' ? '' : ' is-historical');
    const heading = document.createElement('div'); heading.className = 'note-card-heading';
    const select = document.createElement('input'); select.type = 'checkbox'; select.value = note.memory_id;
    select.checked = state.notesSelected.includes(note.memory_id); select.disabled = !noteIsEditable(note) || !notesPermission('atomic_supersede');
    select.setAttribute('aria-label', 'Seleccionar para sustituir: ' + note.title);
    select.addEventListener('change', () => {
      if (!noteIsEditable(note) || !notesPermission('atomic_supersede')) { select.checked = false; return; }
      const maximum = state.notesCapabilities.max_replacements || 6;
      if (select.checked && state.notesSelected.length >= maximum) { select.checked = false; toast('Puedes sustituir hasta ' + maximum + ' notas en una operación.'); return; }
      state.notesSelected = select.checked ? [...new Set([...state.notesSelected, note.memory_id])] : state.notesSelected.filter((id) => id !== note.memory_id);
      updateNotesSelection();
    });
    const title = document.createElement('h3'); title.textContent = note.title;
    heading.append(select, title);
    const meta = document.createElement('p'); meta.className = 'note-meta';
    meta.textContent = 'Versión ' + note.revision + ' · ' + (note.lifecycle_status === 'ACTIVE' ? 'Vigente' : note.lifecycle_status === 'SUPERSEDED' ? 'Sustituida' : 'No disponible para uso activo');
    const preview = document.createElement('p'); preview.className = 'note-preview'; preview.textContent = String(note.preview || '');
    const actions = document.createElement('div'); actions.className = 'head-actions';
    const read = document.createElement('button'); read.type = 'button'; read.className = 'secondary-button'; read.textContent = 'Leer y ver versiones';
    read.addEventListener('click', () => void openCanonicalNote(note.memory_id));
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'secondary-button'; edit.textContent = 'Editar'; edit.disabled = !noteIsEditable(note);
    edit.addEventListener('click', () => void editCanonicalNote(note.memory_id));
    actions.append(read, edit); card.append(heading, meta, preview, actions); list.append(card);
  }
  if (!visible.length && state.notesVerified) {
    const empty = document.createElement('div'); empty.className = 'empty-state compact';
    const title = document.createElement('h3'); title.textContent = state.notes.length ? 'No hay coincidencias en las notas cargadas' : 'Todavía no hay notas en este ámbito';
    const copy = document.createElement('p'); copy.textContent = 'Las notas que guardes aparecerán aquí con su versión y procedencia.';
    empty.append(title, copy); list.append(empty);
  }
  updateNotesSelection();
}

async function loadCanonicalNotes(append = false) {
  const requestId = ++state.notesRequestId;
  const scopeKey = JSON.stringify([state.sessionId, state.conversationId]);
  const previous = append ? state.notes.slice() : [];
  state.notesLoading = true; state.notesVerified = false;
  if (state.notesScope && state.notesScope !== scopeKey) {
    state.notes = []; state.notesSelected = []; state.notesOwnerBinding = ''; state.lifelongMemoryCanonicalSelected = [];
  }
  state.notesScope = scopeKey;
  renderCanonicalNotes();
  $('notes-status').textContent = 'Consultando notas y versiones…'; $('notes-refresh').disabled = true;
  try {
    const offset = append ? state.notesOffset : 0;
    const body = await apiRequest('/api/memories/notes?' + personalScopeQuery({offset: String(offset), limit: '50', include_superseded: String(state.notesIncludeHistory)}));
    if (requestId !== state.notesRequestId || scopeKey !== JSON.stringify([state.sessionId, state.conversationId])) return;
    if (body.schema !== 'shei.personal_notes/v1' || !Array.isArray(body.notes) || typeof body.owner_binding !== 'string' || !body.capabilities) throw new Error('El servidor no devolvió el contrato de notas verificable.');
    if (body.notes.some((note) => !validNoteSummary(note))) throw new Error('Una nota no tiene identidad o revisión válida.');
    if (append && state.notesOwnerBinding && body.owner_binding !== state.notesOwnerBinding) throw new Error('El propietario de la memoria cambió. Actualiza el listado.');
    state.notes = [...new Map([...previous, ...body.notes].map((note) => [note.memory_id, note])).values()];
    state.notesOwnerBinding = body.owner_binding;
    state.notesCapabilities = body.capabilities; state.notesVerified = true;
    const pagination = body.pagination || body;
    state.notesOffset = Number.isSafeInteger(pagination.next_offset) ? pagination.next_offset : (Number.isSafeInteger(pagination.offset) ? pagination.offset : offset) + body.notes.length;
    state.notesHasMore = pagination.has_more === true;
    $('notes-more').hidden = !state.notesHasMore;
    $('notes-scope').textContent = 'Memoria personal · propietario verificado por SHEILY';
    const total = Number.isSafeInteger(pagination.total) ? ' de ' + pagination.total : '';
    $('notes-status').textContent = state.notes.length + total + ' notas consultadas. Los resúmenes no sustituyen al original.';
    renderCanonicalNotes();
    renderCanonicalTrainingSources();
    updateLifelongMemoryTrainingControls();
  } catch (error) {
    if (requestId !== state.notesRequestId) return;
    state.notesVerified = false;
    $('notes-status').textContent = 'No se ha podido verificar el listado: ' + error.message + (state.notes.length ? ' Se conserva la última lectura, sin habilitar edición.' : '');
    $('notes-scope').textContent = 'Ámbito sin verificar';
    renderCanonicalNotes();
    renderCanonicalTrainingSources();
    updateLifelongMemoryTrainingControls();
    if (error.code === 'AUTH_REQUIRED') showAccess();
  } finally {
    if (requestId === state.notesRequestId) { state.notesLoading = false; $('notes-refresh').disabled = false; }
  }
}

async function verifiedNoteOriginal(id, revision) {
  if (!noteId(id) || (revision !== undefined && (!Number.isSafeInteger(revision) || revision < 1))) throw new Error('La identidad de la nota no es válida.');
  const scopeKey = JSON.stringify([state.sessionId, state.conversationId]);
  const query = personalScopeQuery(revision === undefined ? {} : {revision: String(revision)});
  const body = await apiRequest('/api/memories/notes/' + encodeURIComponent(id) + '?' + query);
  if (scopeKey !== JSON.stringify([state.sessionId, state.conversationId])) throw new Error('La conversación cambió durante la lectura.');
  const note = body.note;
  if (body.schema !== 'shei.personal_notes/v1' || !validNoteSummary(note) || note.memory_id !== id || typeof note.text !== 'string' || (revision !== undefined && note.revision !== revision)) throw new Error('El original no coincide con la nota solicitada.');
  const bytes = new TextEncoder().encode(note.text);
  if (Number.isSafeInteger(note.text_bytes) && note.text_bytes !== bytes.byteLength) throw new Error('El tamaño del original no coincide con su recibo.');
  if (!globalThis.SheilyUploads?.digest) throw new Error('No está disponible el verificador del original.');
  const measured = await SheilyUploads.digest(bytes);
  if (measured !== note.text_sha256) throw new Error('La integridad del original de la nota no coincide.');
  if (scopeKey !== JSON.stringify([state.sessionId, state.conversationId]) || (state.notesOwnerBinding && body.owner_binding !== state.notesOwnerBinding)) throw new Error('El ámbito de memoria cambió durante la verificación.');
  return {body, note};
}

async function openCanonicalNote(id, revision) {
  const requestId = ++state.noteReadRequestId;
  $('notes-status').textContent = 'Leyendo y verificando el original…';
  try {
    const {note} = await verifiedNoteOriginal(id, revision);
    if (requestId !== state.noteReadRequestId) return;
    state.noteRead = note;
    $('note-reader-title').textContent = note.title;
    $('note-reader-text').textContent = note.text;
    $('note-reader-meta').textContent = 'Versión ' + note.revision + ' · ' + (note.lifecycle_status === 'ACTIVE' && note.is_current === true ? 'Vigente' : 'Histórica') + ' · Integridad del original verificada';
    $('note-reader-edit').disabled = !noteIsEditable(note);
    $('note-versions-list').replaceChildren();
    if (!$('note-reader-dialog').open) $('note-reader-dialog').showModal();
    $('notes-status').textContent = 'Original verificado y abierto.';
  } catch (error) {
    $('notes-status').textContent = 'No se ha abierto la nota: ' + error.message;
    if (error.code === 'AUTH_REQUIRED') showAccess();
  }
}

async function editCanonicalNote(id) {
  try {
    const {note} = await verifiedNoteOriginal(id);
    if (!noteIsEditable(note)) throw new Error('Esta versión no admite edición. Actualiza sus permisos o consulta su historial.');
    $('note-reader-dialog').close();
    openNoteEditor(note);
  } catch (error) {
    $('notes-status').textContent = 'No se puede editar: ' + error.message;
    if (error.code === 'AUTH_REQUIRED') showAccess();
  }
}

function openNoteEditor(note = null, replaces = []) {
  if (note ? !noteIsEditable(note) : !notesPermission('create')) { toast('La escritura de notas no está autorizada o verificada.'); return; }
  state.noteEditing = note;
  state.noteReplaces = replaces.map((item) => ({memory_id: item.memory_id, expected_revision: item.revision}));
  state.noteEditorOwner = state.notesOwnerBinding;
  state.noteEditorScope = JSON.stringify([state.sessionId, state.conversationId]);
  state.noteWriteRequest = null;
  $('note-editor-heading').textContent = note ? 'Editar nota' : replaces.length ? 'Sustituir notas por una nueva' : 'Nueva nota';
  $('note-editor-title').value = note?.title || '';
  $('note-editor-text').value = note?.text || '';
  $('note-editor-context').textContent = note ? 'Editas la versión ' + note.revision + '. Si cambió en otra sesión, SHEILY rechazará la escritura para proteger el original.' : 'Se guardará en tu memoria personal, conservando el contenido completo.';
  $('note-editor-replaces').textContent = replaces.length ? 'Se sustituirán de forma atómica: ' + replaces.map((item) => item.title + ' (v' + item.revision + ')').join(' · ') + '. Los originales se conservarán como historial.' : '';
  $('note-editor-status').textContent = ''; $('note-conflict-open-current').hidden = true;
  $('note-editor-save').disabled = false;
  if (!$('note-editor-dialog').open) $('note-editor-dialog').showModal();
  $('note-editor-title').focus();
}

async function submitCanonicalNote(event) {
  event.preventDefault();
  if (state.noteWriteBusy) return;
  const status = $('note-editor-status');
  const current = state.noteEditing;
  try {
    if (state.noteEditorScope !== JSON.stringify([state.sessionId, state.conversationId]) || state.noteEditorOwner !== state.notesOwnerBinding) throw new Error('El ámbito cambió. Cierra este editor y vuelve a abrir la nota en el ámbito actual.');
    if (current ? !notesPermission('revise') : !notesPermission('create')) throw new Error('La escritura no está autorizada.');
    const title = $('note-editor-title').value;
    const text = $('note-editor-text').value;
    if (!title.trim() || !text.trim()) throw new Error('Escribe un título y un contenido.');
    if (Array.from(title).length > (state.notesCapabilities.max_title_chars || 256)) throw new Error('El título supera el límite permitido.');
    if (new TextEncoder().encode(text).byteLength > (state.notesCapabilities.max_text_bytes || 1048576)) throw new Error('El contenido supera el tamaño permitido por el servidor.');
    const payload = {title, text, replaces: current ? [] : state.noteReplaces};
    if (current) payload.expected_revision = current.revision;
    if (!current && payload.replaces.length && (!notesPermission('atomic_supersede') || payload.replaces.length > (state.notesCapabilities.max_replacements || 6))) throw new Error('La sustitución de estas notas no está autorizada.');
    const fingerprint = JSON.stringify([state.noteEditorOwner, state.noteEditorScope, current?.memory_id || '', payload]);
    if (!state.noteWriteRequest || state.noteWriteRequest.fingerprint !== fingerprint) {
      if (typeof globalThis.crypto?.randomUUID !== 'function') throw new Error('El navegador no permite crear un identificador seguro de solicitud.');
      state.noteWriteRequest = {fingerprint, request_id: globalThis.crypto.randomUUID()};
    }
    payload.request_id = state.noteWriteRequest.request_id;
    const route = '/api/memories/notes' + (current ? '/' + encodeURIComponent(current.memory_id) + '/revisions' : '');
    state.noteWriteBusy = true; $('note-editor-save').disabled = true;
    status.textContent = 'Guardando la solicitud…';
    const body = await apiRequest(route + '?' + personalScopeQuery(), {method: 'POST', body: JSON.stringify(payload)});
    if (body.schema !== 'shei.personal_notes/v1' || !validNoteSummary(body.note) || !body.receipt) throw new Error('No se recibió un recibo de nota verificable. Puedes reintentar la misma solicitud.');
    const saved = await verifiedNoteOriginal(body.note.memory_id, body.note.revision);
    if (saved.note.text !== text || saved.note.title !== title) throw new Error('La nota guardada no coincide literalmente con el contenido enviado.');
    $('note-editor-dialog').close(); state.notesSelected = []; state.noteReplaces = []; state.noteWriteRequest = null;
    toast(body.replayed === true ? 'La solicitud ya estaba guardada. Se ha recuperado su recibo.' : 'Nota guardada y original verificado.');
    await loadCanonicalNotes();
  } catch (error) {
    status.textContent = (error.status === 409 ? 'Conflicto de versión. Tu borrador sigue intacto. ' : 'No se ha confirmado el guardado. Reintentar conserva la misma solicitud. ') + error.message;
    $('note-conflict-open-current').hidden = !(state.noteEditing && error.status === 409);
    if (error.code === 'AUTH_REQUIRED') showAccess();
  } finally { state.noteWriteBusy = false; $('note-editor-save').disabled = false; }
}

async function loadCanonicalNoteVersions() {
  const current = state.noteRead;
  if (!current || !noteId(current.memory_id)) return;
  const list = $('note-versions-list'); list.replaceChildren();
  $('note-reader-meta').textContent = 'Consultando versiones…';
  try {
    const body = await apiRequest('/api/memories/notes/' + encodeURIComponent(current.memory_id) + '/versions?' + personalScopeQuery());
    if (state.noteRead?.memory_id !== current.memory_id) return;
    if (body.schema !== 'shei.personal_notes/v1' || !Array.isArray(body.notes) || body.notes.some((note) => !validNoteSummary(note))) throw new Error('El historial no cumple el contrato de versiones.');
    for (const note of body.notes) {
      const row = document.createElement('button'); row.type = 'button'; row.className = 'note-version-button';
      row.textContent = 'Versión ' + note.revision + ' · ' + (note.is_current ? 'Actual' : 'Histórica') + ' · ' + note.title;
      row.addEventListener('click', () => void openCanonicalNote(note.memory_id, note.revision)); list.append(row);
    }
    $('note-reader-meta').textContent = body.notes.length + ' versiones disponibles. Cada original se verifica al abrirlo.';
  } catch (error) { $('note-reader-meta').textContent = 'No se pudieron consultar las versiones: ' + error.message; }
}

function accessReason(code) {
  const reasons = {
    owner_authentication_required: 'Inicia sesión con la cuenta propietaria para utilizar estos controles.',
    private_vault_not_configured: 'Configura la zona privada para autorizar estas operaciones.',
    private_session_locked: 'Desbloquea la zona privada para autorizar estas operaciones.',
    local_operator_connection_required: 'Este acceso permite consultar tu espacio personal. La administración del motor requiere una conexión local autorizada.',
    operator_origin_not_authorized: 'El servidor no ha autorizado esta dirección para administrar el motor. Utiliza el acceso HTTPS autorizado o la consola local.',
    admin_backend_not_configured: 'El servicio de administración no está configurado.',
    training_disabled_by_operator: 'La creación de candidatos está deshabilitada en la configuración del servicio.',
    delegate_not_configured: 'El subsistema de aprendizaje no está configurado.',
    delegate_configuration_invalid: 'El servidor ha detectado una configuración de aprendizaje que requiere revisión.',
    vault_locked: 'Desbloquea la zona privada para autorizar estas operaciones.',
    private_unlock_required: 'Desbloquea la zona privada para autorizar estas operaciones.',
    direct_local_required: 'Esta operación sólo está disponible desde el acceso local autorizado.',
    local_origin_required: 'Esta operación requiere el origen local autorizado.',
    admin_upstream_unconfigured: 'El acceso de administración no está configurado en el servidor.',
    admin_unavailable: 'El servicio de administración no está disponible.',
  };
  return reasons[code] || (typeof code === 'string' && code ? code : 'El servidor no ha confirmado el permiso para esta operación.');
}

async function loadControlAccess() {
  const requestId = ++state.controlRequestId;
  try {
    const body = await apiRequest('/api/control/access');
    if (requestId !== state.controlRequestId) return null;
    if (body.schema !== 'shei.console.control_access/v1') throw new Error('El servidor no devolvió permisos de control verificables.');
    if (state.vaultUnlocked && body.vault?.unlocked === false) clearVaultSensitiveView('La zona privada está bloqueada.');
    state.controlAccess = body;
    renderControlAccess();
    return body;
  } catch (error) {
    if (requestId !== state.controlRequestId) return null;
    state.controlAccess = null; renderControlAccess();
    if ($('admin-access-notice')) $('admin-access-notice').textContent = 'No se ha podido verificar el acceso: ' + error.message;
    if (error.code === 'AUTH_REQUIRED') showAccess();
    return null;
  }
}

function renderControlAccess() {
  const access = state.controlAccess;
  const admin = access?.administration?.allowed === true;
  if ($('admin-access-notice')) $('admin-access-notice').textContent = admin
    ? 'Acceso de administración autorizado por el servidor. Cada operación vuelve a comprobar el permiso.'
    : accessReason(access?.administration?.reason);
  if ($('admin-workspace')) $('admin-workspace').hidden = !admin;
  for (const [action, button, reason] of [['runtime_tick', 'admin-runtime-tick', 'admin-runtime-tick-reason'], ['sleep_consolidation', 'admin-consolidate', 'admin-consolidate-reason']]) {
    const policy = access?.actions?.[action];
    if ($(button)) $(button).disabled = !admin || policy?.allowed !== true || state.adminBusy;
    if ($(reason)) $(reason).textContent = policy?.allowed === true ? 'Disponible con confirmación.' : accessReason(policy?.reason);
  }
  if ($('learning-access-notice')) $('learning-access-notice').textContent = access?.learning?.allowed === true
    ? 'Acceso de aprendizaje autorizado. Sólo se habilitan las operaciones disponibles para estas fuentes.'
    : accessReason(access?.learning?.reason);
  updateLifelongMemoryTrainingControls();
}

async function executeAdminAction(action) {
  const actions = {
    runtime_tick: {path: '/api/admin/runtime/tick', title: 'Ejecutar ciclo del motor', copy: 'Se solicitará un ciclo al motor activo. El resultado quedará identificado por el recibo del servicio.'},
    sleep_consolidation: {path: '/api/admin/runtime/sleep-consolidation', title: 'Solicitar consolidación', copy: 'El motor procesará su consolidación de memoria. Revisa el estado y el recibo antes de volver a solicitarla.'},
  };
  if (!actions[action] || state.adminBusy) return;
  const access = await loadControlAccess();
  if (access?.administration?.allowed !== true || access?.actions?.[action]?.allowed !== true) return;
  const chosen = actions[action];
  if (!await confirmAction(chosen.title, chosen.copy, 'Confirmar operación')) return;
  state.adminBusy = true; renderControlAccess();
  $('admin-action-status').textContent = 'Solicitud en curso. No se repetirá automáticamente.';
  $('admin-action-receipt').hidden = true;
  try {
    const body = await apiRequest(chosen.path, {method: 'POST', body: '{}'});
    if (body.ok !== true || typeof body.correlation_id !== 'string' || !Object.hasOwn(body, 'data')) throw new Error('La respuesta no incluye el recibo esperado.');
    $('admin-action-status').textContent = 'Respuesta del servicio recibida. Consulta el resultado de la operación en su recibo.';
    $('admin-action-receipt').textContent = JSON.stringify({correlation_id: body.correlation_id, status: body.admin_http_status, result: body.data}, null, 2);
    $('admin-action-receipt').hidden = false;
  } catch (error) {
    $('admin-action-status').textContent = 'Resultado sin confirmar: ' + error.message + ' No se reintentó automáticamente.';
    if (error.code === 'AUTH_REQUIRED') showAccess();
  } finally { state.adminBusy = false; await loadControlAccess(); }
}

async function loadAdminObservation() {
  const paths = {health: '/api/admin/health', homeostasis: '/api/admin/runtime/homeostasis', memory: '/api/admin/memory/stats', pending: '/api/admin/control/multi-turn-consolidations/pending', incidents: '/api/admin/globus/incidents'};
  const key = $('admin-observation-kind').value;
  if (!paths[key]) return;
  const access = await loadControlAccess();
  if (access?.administration?.allowed !== true) return;
  $('admin-observation-refresh').disabled = true; $('admin-observation-status').textContent = 'Consultando el servicio…';
  try {
    const body = await apiRequest(paths[key]);
    $('admin-observation').textContent = JSON.stringify(body.data ?? body, null, 2);
    $('admin-observation').hidden = false;
    $('admin-observation-status').textContent = 'Observación recibida a las ' + new Date().toLocaleTimeString('es') + '.';
  } catch (error) {
    $('admin-observation').hidden = true;
    $('admin-observation-status').textContent = 'No se ha podido comprobar: ' + error.message;
  } finally { $('admin-observation-refresh').disabled = false; }
}

async function readRuntimeObservation(path) {
  const response = await fetch(path, {credentials: 'same-origin'});
  const body = await parseResponse(response);
  if (response.status === 401) { const error = new Error('Necesitas iniciar sesión.'); error.code = 'AUTH_REQUIRED'; throw error; }
  return {status: response.status, body};
}

function runtimeCard(title, stateLabel, description, verified = false) {
  const card = document.createElement('section'); card.className = 'workspace-card runtime-card';
  const heading = document.createElement('h2'); heading.textContent = title;
  const label = document.createElement('strong'); label.className = 'runtime-state' + (verified ? ' positive' : ''); label.textContent = stateLabel;
  const copy = document.createElement('p'); copy.textContent = description;
  card.append(heading, label, copy); return card;
}

function connectomeAssessmentLabel(state) {
  const labels = {
    FLOW_COMPLETE: 'Flujo obligatorio completo',
    FLOW_INCOMPLETE: 'Flujo incompleto',
    FLOW_FAILED: 'Flujo fallido',
    FLOW_ORDER_INVALID: 'Orden de etapas inválido',
    UNDECLARED_SYSTEMS: 'El diario contiene sistemas sin declarar',
    JOURNAL_NOT_VERIFIED: 'Diario sin verificar',
    NO_LIVE_TURNS: 'No hay turnos observados',
  };
  return labels[state] || String(state || 'Estado desconocido');
}

function renderObservedConnectome(snapshot) {
  const graph = $('connectome-graph');
  if (!graph || typeof document.createElementNS !== 'function') return;
  const svgNs = 'http://www.w3.org/2000/svg';
  const nodes = Array.isArray(snapshot?.nodes)
    ? snapshot.nodes.filter((node) => node && node.declared === true && typeof node.node_id === 'string')
    : [];
  const nodeIds = new Set(nodes.map((node) => node.node_id));
  const governing = snapshot?.governing_connectome;
  const canonicalEdges = Array.isArray(governing?.edges)
    ? governing.edges.filter((edge) => edge?.enforced === true && nodeIds.has(edge.source) && nodeIds.has(edge.target))
    : [];
  const observedEdges = Array.isArray(snapshot?.edges)
    ? snapshot.edges.filter((edge) => edge?.verified === true && nodeIds.has(edge.source) && nodeIds.has(edge.target))
    : [];
  const columns = 4;
  const cellWidth = 226;
  const rowHeight = 112;
  const rows = Math.max(1, Math.ceil(nodes.length / columns));
  const width = columns * cellWidth;
  const height = rows * rowHeight + 28;
  const positions = new Map();
  nodes.forEach((node, index) => {
    positions.set(node.node_id, {
      x: cellWidth / 2 + (index % columns) * cellWidth,
      y: 34 + Math.floor(index / columns) * rowHeight,
    });
  });
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', nodes.length + ' sistemas declarados; ' + canonicalEdges.length + ' conexiones obligatorias y ' + observedEdges.length + ' conexiones observadas.');
  const defs = document.createElementNS(svgNs, 'defs');
  const marker = document.createElementNS(svgNs, 'marker');
  marker.setAttribute('id', 'connectome-arrow');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '8');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '6');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('orient', 'auto-start-reverse');
  const arrow = document.createElementNS(svgNs, 'path');
  arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
  arrow.setAttribute('class', 'connectome-arrow');
  marker.append(arrow);
  defs.append(marker);
  svg.append(defs);
  const drawEdge = (edge, kind) => {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    if (!source || !target) return;
    const line = document.createElementNS(svgNs, 'line');
    line.setAttribute('x1', String(source.x));
    line.setAttribute('y1', String(source.y));
    line.setAttribute('x2', String(target.x));
    line.setAttribute('y2', String(target.y));
    const flowing = kind === 'observed' && edge.in_latest_turn === true;
    line.setAttribute('class', 'connectome-edge ' + kind + (flowing ? ' is-flowing' : ''));
    line.setAttribute('marker-end', 'url(#connectome-arrow)');
    line.setAttribute('aria-label', edge.source + ' → ' + edge.target);
    const title = document.createElementNS(svgNs, 'title');
    title.textContent = kind === 'canonical'
      ? 'Etapa obligatoria declarada'
      : 'Transición observada ' + String(edge.observed_count || 0) + ' veces; relación: ' + String(edge.canonical_relation || 'sin clasificar');
    line.append(title);
    svg.append(line);
  };
  canonicalEdges.forEach((edge) => drawEdge(edge, 'canonical'));
  observedEdges.forEach((edge) => drawEdge(edge, 'observed'));
  const latest = snapshot?.latest_turn || {};
  const terminal = String(latest.terminal_status || '').toUpperCase();
  const activeStatuses = new Set(['RUNNING', 'STARTED', 'IN_PROGRESS', 'ACTIVE']);
  const completedStatuses = new Set(['OK', 'COMPLETED', 'SUCCEEDED', 'COMMITTED']);
  nodes.forEach((node) => {
    const point = positions.get(node.node_id);
    const group = document.createElementNS(svgNs, 'g');
    const state = node.latest_turn_state || {};
    const phaseStatus = String(state.status || '').toUpperCase();
    const current = node.latest_turn_observed === true;
    const active = terminal === 'RUNNING' && current && activeStatuses.has(phaseStatus);
    const failed = phaseStatus === 'FAILED';
    const visited = current && completedStatuses.has(phaseStatus);
    const canonical = Number.isInteger(node.flow_stage_index);
    group.setAttribute('class', 'connectome-node' + (canonical ? ' is-canonical' : '') + (active ? ' is-active' : '') + (failed ? ' is-failed' : '') + (visited ? ' is-visited' : ''));
    const rect = document.createElementNS(svgNs, 'rect');
    rect.setAttribute('x', String(point.x - 91));
    rect.setAttribute('y', String(point.y - 26));
    rect.setAttribute('width', '182');
    rect.setAttribute('height', '52');
    rect.setAttribute('rx', '12');
    const label = document.createElementNS(svgNs, 'text');
    label.setAttribute('x', String(point.x));
    label.setAttribute('y', String(point.y + 4));
    label.setAttribute('text-anchor', 'middle');
    label.textContent = String(node.name || node.node_id).slice(0, 25);
    const title = document.createElementNS(svgNs, 'title');
    title.textContent = node.node_id + ' · ' + String(node.path || 'ruta no declarada') + ' · ' + (current ? phaseStatus : 'sin observar en el último turno');
    group.append(rect, label, title);
    svg.append(group);
  });
  graph.replaceChildren(svg);
  graph.setAttribute('aria-label', svg.getAttribute('aria-label'));

  const pathList = $('connectome-source-paths');
  if (pathList) {
    pathList.replaceChildren();
    nodes.forEach((node) => {
      const item = document.createElement('li');
      item.textContent = node.node_id + ' → ' + String(node.path || 'RUTA NO DECLARADA');
      pathList.append(item);
    });
  }
}

async function loadObservedConnectome() {
  const status = $('connectome-status');
  const graph = $('connectome-graph');
  if (!status || !graph) return;
  const requestId = ++state.connectomeRequestId;
  status.textContent = 'Consultando diario nativo y catálogo de sistemas…';
  const alert = $('connectome-alert');
  if (alert) { alert.hidden = true; alert.textContent = ''; }
  try {
    const snapshot = await apiRequest('/api/connectome/observed');
    if (requestId !== state.connectomeRequestId || state.view !== 'system') return;
    if (snapshot?.schema !== 'shei.console.observed_connectome/v1') {
      throw new Error('connectome_schema_invalid');
    }
    renderObservedConnectome(snapshot);
    const assessment = snapshot.assessment || {};
    const timestamp = snapshot.generated_at ? new Date(snapshot.generated_at).toLocaleTimeString('es') : 'hora no indicada';
    const latest = snapshot.latest_turn || {};
    const correlation = latest.correlation_id ? ' · turno ' + String(latest.correlation_id).slice(0, 12) : '';
    const terminal = latest.terminal_status ? ' · ' + String(latest.terminal_status) : '';
    status.textContent = connectomeAssessmentLabel(assessment.state) + ' · ' +
      String(snapshot.node_count || 0) + ' nodos declarados · ' +
      String(snapshot.coverage?.flow_stages_observed || 0) + '/' +
      String(snapshot.coverage?.flow_stages_total || 0) + ' etapas observadas · actualizado ' + timestamp + correlation + terminal;
    const unknown = Array.isArray(snapshot.drift?.unknown_observed_system_ids_latest)
      ? snapshot.drift.unknown_observed_system_ids_latest
      : [];
    const topologyError = snapshot.canonical_topology?.error;
    const warnings = [];
    if (topologyError) warnings.push('Catálogo inválido: ' + String(topologyError));
    if (unknown.length) warnings.push('IDs runtime sin declarar: ' + unknown.join(', '));
    if ((snapshot.drift?.out_of_order_transitions_latest || 0) > 0) {
      warnings.push('Transiciones fuera de orden: ' + String(snapshot.drift.out_of_order_transitions_latest));
    }
    if (alert && warnings.length) {
      alert.textContent = warnings.join(' · ');
      alert.hidden = false;
    }
  } catch (error) {
    if (requestId !== state.connectomeRequestId) return;
    graph.replaceChildren();
    status.textContent = 'No se pudo leer el conectome: ' + String(error?.message || error);
    if (alert) { alert.textContent = 'No hay evidencia suficiente para dibujar un recorrido.'; alert.hidden = false; }
  } finally {
    if (requestId === state.connectomeRequestId) scheduleConnectomeRefresh();
  }
}

function scheduleConnectomeRefresh() {
  if (state.connectomePollTimer) clearTimeout(state.connectomePollTimer);
  state.connectomePollTimer = null;
  if (state.view !== 'system' || !$('connectome-graph')) return;
  state.connectomePollTimer = setTimeout(() => {
    state.connectomePollTimer = null;
    if (state.view === 'system') void loadObservedConnectome();
  }, 5000);
}

async function loadSystemStatus() {
  const requestId = ++state.systemRequestId;
  $('system-refresh').disabled = true;
  $('system-observed').textContent = 'Consultando estado real…';
  const scope = 'session_id=' + encodeURIComponent(state.sessionId) + '&conversation_id=' + encodeURIComponent(state.conversationId);
  // Read-only observations. A successful endpoint does not certify migration or rollback.
  const observations = await Promise.allSettled([
    readRuntimeObservation('/health'), readRuntimeObservation('/ready'),
    apiRequest('/api/privacy?session_id=' + encodeURIComponent(state.sessionId)),
    apiRequest('/api/lifelong-memory/status'),
    apiRequest('/api/memories/notes?' + scope + '&limit=1'),
    apiRequest('/api/inference/session-selection?' + scope),
    apiRequest('/api/lifelong-memory/history?offset=0&limit=1'),
    apiRequest('/api/lifelong-memory/jobs?offset=0&limit=1'),
    tidexAllowed() ? apiRequest('/api/tidex/status') : Promise.reject(new Error('private_access_required')),
  ]);
  if (requestId !== state.systemRequestId) return;
  const [health, readiness, privacy, lifelongMemory, notes, selection, history, jobs, tidex] = observations;
  const grid = $('system-status-grid'); grid.replaceChildren();
  const healthy = health.status === 'fulfilled' && health.value.status === 200 && health.value.body.status === 'alive';
  grid.append(runtimeCard('Consola', healthy ? 'Disponible' : 'Sin confirmar', healthy ? 'El servicio de la interfaz responde.' : 'No se ha recibido una respuesta saludable.', healthy));
  const ready = readiness.status === 'fulfilled' && readiness.value.status === 200 && readiness.value.body.ready === true;
  grid.append(runtimeCard('Preparación operativa', ready ? 'Preparada' : readiness.status === 'fulfilled' ? 'Requiere atención' : 'Sin verificar', readiness.status === 'fulfilled' ? 'Estado comunicado por /ready: HTTP ' + readiness.value.status + '. El proceso activo y la preparación completa se comprueban por separado.' : 'No se pudo consultar la preparación.', ready));
  const privateBody = privacy.status === 'fulfilled' ? privacy.value : null;
  const network = privateBody?.network_scope;
  const publicPagesBridge = Boolean(globalThis.SheilyPagesTransport);
  grid.append(runtimeCard('Acceso y privacidad',
    publicPagesBridge ? 'Pasarela HTTPS · núcleo local' : network === 'LOOPBACK_ONLY' ? 'Acceso local' : network ? String(network) : 'Sin verificar',
    publicPagesBridge
      ? 'La consola y los datos siguen en el servidor privado. Este acceso HTTPS tiene sesión de propietario y no habilita administración, bóveda ni TIDEX.'
      : privateBody ? 'Ámbito comunicado por el servidor. La bóveda tiene su desbloqueo independiente.' : 'No se pudo verificar el ámbito de acceso.',
    publicPagesBridge ? privateBody !== null : network === 'LOOPBACK_ONLY'));
  const mb = lifelongMemory.status === 'fulfilled' ? lifelongMemory.value : null;
  grid.append(runtimeCard('Lifelong Memory', mb?.available === true ? 'Conectado' : mb?.enabled === false ? 'Desactivado' : 'Sin verificar', mb?.available === true ? 'Fuentes y trabajos disponibles mediante SHEILY.' : 'La integración no ha confirmado disponibilidad.', mb?.available === true));
  const checks = $('system-integration-checks'); checks.replaceChildren();
  const valueOrUnknown = (observation, check) => observation.status === 'fulfilled' ? check(observation.value) === true : null;
  const notesReachable = valueOrUnknown(notes, body => body?.schema === 'shei.personal_notes/v1' && Array.isArray(body.notes) && body?.capabilities?.atomic_supersede === true);
  const sessionScoped = valueOrUnknown(selection, body => body?.schema === 'shei.llm_session_selection/v1' && body.scope === 'authenticated_owner_conversation' && /^[a-f0-9]{64}$/.test(body.owner_binding || '') && /^[a-f0-9]{64}$/.test(body.session_binding || ''));
  const historyReachable = valueOrUnknown(history, body => body?.read_only === true && Array.isArray(body.turns) && /^[a-f0-9]{64}$/.test(body.history_version || ''));
  const jobsReachable = valueOrUnknown(jobs, body => body?.ok === true && Array.isArray(body.jobs));
  const tidexReachable = publicPagesBridge
    ? 'restricted'
    : valueOrUnknown(tidex, body => body?.schema === 'tidex.lifelong_memory_status/v1' && body.ok === true);
  const entries = [
    ['Consola y API SHEILY preparadas', ready === true ? true : readiness.status === 'fulfilled' ? false : null],
    ['Fuentes originales de Lifelong Memory íntegras', mb?.archive?.integrity?.verified ?? null],
    ['Notas con versiones y sustitución atómica accesibles', notesReachable],
    ['Historial original Lifelong Memory consultable', historyReachable],
    ['Trabajos Lifelong Memory consultables sin ejecutarlos', jobsReachable],
    ['Selección vinculada al sujeto y conversación', sessionScoped],
    ['Servicio de evaluación y promoción TIDEX consultable', tidexReachable],
    ['Entrenador de fuentes canónicas preparado', mb?.training?.canonical_enabled === true ? true : mb?.training?.canonical_enabled === false ? false : null],
  ];
  for (const [label, result] of entries) {
    const row = document.createElement('div'); row.className = 'check-row';
    const name = document.createElement('span'); name.textContent = label;
    const value = document.createElement('strong'); value.textContent =
      result === true ? 'Comprobado'
      : result === false ? 'Pendiente'
      : result === 'restricted' ? 'Restringido en web pública' : 'No verificado';
    row.append(name, value); checks.append(row);
  }
  const checked = entries.filter(([, result]) => result === true).length;
  $('system-cutover-verdict').textContent = checked + ' de ' + entries.length + ' conexiones comprobadas en esta consulta.'
    + (publicPagesBridge
      ? ' TIDEX y los controles privados no están disponibles desde GitHub Pages; compruébalos en la consola administrativa local.'
      : tidexAllowed() ? '' : ' Desbloquea la zona privada desde un acceso autorizado para comprobar también TIDEX.')
    + ' La verificación de migración y recuperación se documenta en el informe de instalación.';
  $('system-observed').textContent = 'Última consulta: ' + new Date().toLocaleString('es') + '. Cada operación devuelve su propio resultado.';
  $('system-refresh').disabled = false;
  if (observations.some((result) => result.status === 'rejected' && result.reason.code === 'AUTH_REQUIRED')) showAccess();
}

function clearVaultSensitiveView(message = '') {
  clearTidexControl();
  state.vaultUnlocked = false; state.vaultItems = []; state.vaultContainers = [];
  state.vaultPendingFile = null; state.vaultEditingId = ''; state.vaultEditingContainerId = ''; state.vaultReadGeneration++;
  state.vaultQuery = ''; state.vaultFolder = 'all';
  clearTimeout(state.vaultDeadlineTimer); state.vaultDeadlineTimer = null;
  state.vaultDiscardRecording = true;
  if (state.vaultMediaRecorder?.state === 'recording') state.vaultMediaRecorder.stop();
  state.vaultRecording = false; state.vaultAudioChunks = [];
  vaultPreviewActiveItem = null; vaultPreviewActiveText = '';
  for (const id of ['vault-items-grid', 'vault-preview-body', 'vault-preview-toolbar', 'vault-preview-title', 'vault-preview-meta', 'vault-preview-hash', 'vault-preview-status', 'vault-file-picked-label', 'vault-containers-list']) $(id)?.replaceChildren();
  for (const id of ['vault-item-dialog', 'vault-preview-dialog', 'vault-containers-dialog']) if ($(id)?.open) $(id).close();
  for (const id of ['vault-item-id', 'vault-item-title', 'vault-item-text', 'vault-item-file', 'vault-quick-file-input', 'vault-item-secret', 'vault-item-username', 'vault-item-url', 'vault-item-tags', 'vault-passcode-input', 'vault-search', 'setting-current-passcode', 'setting-new-passcode', 'vcontainer-id', 'vcontainer-name', 'vcontainer-description', 'vcontainer-extensions']) if ($(id)) $(id).value = '';
  if ($('vault-item-sensitivity')) $('vault-item-sensitivity').value = 'confidencial';
  if ($('vault-item-memory-policy')) $('vault-item-memory-policy').value = 'no_memoria_no_aprendizaje';
  for (const id of ['vault-folder-filter', 'vault-item-folder']) $(id)?.replaceChildren();
  for (const id of ['vault-stat-total', 'vault-stat-size', 'vault-stat-folders', 'vault-stat-pinned', 'vcount-all', 'vcount-photo', 'vcount-video', 'vcount-audio', 'vcount-password', 'vcount-bookmark', 'vcount-chat', 'vcount-note', 'vcount-file']) if ($(id)) $(id).textContent = '—';
  if ($('vault-preview-download-link')) $('vault-preview-download-link').removeAttribute('href');
  if ($('vault-workspace')) $('vault-workspace').hidden = true;
  if ($('vault-gate')) $('vault-gate').hidden = false;
  if (message && $('vault-auth-error')) $('vault-auth-error').textContent = message;
  if ($('vault-auth-submit')) $('vault-auth-submit').disabled = !state.vaultStatusKnown;
  state.controlRequestId++; state.controlAccess = null;
  state.inferenceRequestId++; state.inferenceVerified = false; state.inferenceNeedsRefresh = true; state.inferenceLoading = false;
  if ($('inference-option')) updateInferenceControls();
  if ($('admin-workspace')) $('admin-workspace').hidden = true;
  if ($('admin-observation')) { $('admin-observation').textContent = ''; $('admin-observation').hidden = true; }
  if ($('admin-action-receipt')) { $('admin-action-receipt').textContent = ''; $('admin-action-receipt').hidden = true; }
  updateSidebarVaultButton();
  if ($('lifelong-memory-training-fields')) updateLifelongMemoryTrainingControls();
}

function scheduleVaultVisibilityExpiry(body) {
  clearTimeout(state.vaultDeadlineTimer); state.vaultDeadlineTimer = null;
  if (body?.unlocked !== true) return;
  const remaining = body.idle_remaining_seconds;
  if (!Number.isFinite(remaining) || remaining < 0) return;
  state.vaultDeadlineTimer = setTimeout(() => {
    state.vaultStatusRequestId++;
    clearVaultSensitiveView('La autorización de la zona privada ha caducado. Vuelve a desbloquearla.');
    void apiRequest('/api/vault/lock', {method: 'POST', body: '{}'}).catch(() => {});
  }, Math.min(remaining * 1000, 2147483647));
}

function bindProfessionalWorkspace() {
  bindWorkspaceTabs();
  document.querySelector('.skip-link')?.addEventListener('click', (event) => { event.preventDefault(); $('page-title').focus({preventScroll: true}); });
  $('vault-status-refresh').addEventListener('click', () => void loadVaultView());
  $('notes-refresh').addEventListener('click', () => void loadCanonicalNotes());
  $('notes-more').addEventListener('click', () => void loadCanonicalNotes(true));
  $('notes-search').addEventListener('input', (event) => { state.notesQuery = event.target.value; renderCanonicalNotes(); });
  $('notes-include-history').addEventListener('change', (event) => { state.notesIncludeHistory = event.target.checked; void loadCanonicalNotes(); });
  $('note-new').addEventListener('click', () => openNoteEditor());
  $('notes-clear-selection').addEventListener('click', () => { state.notesSelected = []; renderCanonicalNotes(); });
  $('notes-merge').addEventListener('click', () => openNoteEditor(null, state.notes.filter((note) => state.notesSelected.includes(note.memory_id) && noteIsEditable(note))));
  $('note-editor-form').addEventListener('submit', submitCanonicalNote);
  $('note-editor-cancel').addEventListener('click', () => $('note-editor-dialog').close());
  $('note-reader-close').addEventListener('click', () => $('note-reader-dialog').close());
  $('note-reader-edit').addEventListener('click', () => { if (state.noteRead) void editCanonicalNote(state.noteRead.memory_id); });
  $('note-reader-versions').addEventListener('click', loadCanonicalNoteVersions);
  $('note-conflict-open-current').addEventListener('click', () => { if (state.noteEditing) void openCanonicalNote(state.noteEditing.memory_id); });
  $('lifelong-memory-go-training').addEventListener('click', () => activateWorkspaceTab('learning', 'training', {focus: true}));
  document.querySelectorAll('[name="lifelong-memory-source-mode"]').forEach((radio) => radio.addEventListener('change', () => { if (radio.checked) selectLifelongMemorySourceMode(radio.value); }));
  $('lifelong-memory-canonical-refresh').addEventListener('click', () => void loadCanonicalNotes());
  $('lifelong-memory-history-refresh').addEventListener('click', () => void loadLifelongMemoryHistory());
  $('lifelong-memory-history-more').addEventListener('click', () => void loadLifelongMemoryHistory(true));
  $('lifelong-memory-job-close').addEventListener('click', () => { state.lifelongMemoryJobRequestId++; $('lifelong-memory-job-reader').hidden = true; clearTidexControl(); });
  $('tidex-close').addEventListener('click', clearTidexControl);
  $('tidex-refresh').addEventListener('click', () => void refreshTidexJob());
  $('tidex-add-case').addEventListener('click', addTidexCase);
  $('tidex-evaluate').addEventListener('click', () => void submitTidexAction('evaluate'));
  $('tidex-promote').addEventListener('click', () => void submitTidexAction('promote'));
  $('tidex-register').addEventListener('click', () => void registerTidexSelection());
  $('lifelong-memory-source-search').addEventListener('input', (event) => { state.lifelongMemorySourceQuery = event.target.value; renderLifelongMemorySources(state.lifelongMemorySources); });
  $('inference-refresh').addEventListener('click', () => void loadInferenceSelection());
  $('inference-option').addEventListener('change', updateInferenceControls);
  $('inference-apply').addEventListener('click', () => void changeInferenceSelection(false));
  $('inference-inherit').addEventListener('click', () => void changeInferenceSelection(true));
  $('system-refresh').addEventListener('click', loadSystemStatus);
  $('connectome-refresh').addEventListener('click', () => void loadObservedConnectome());
  $('admin-refresh').addEventListener('click', loadControlAccess);
  $('admin-runtime-tick').addEventListener('click', () => void executeAdminAction('runtime_tick'));
  $('admin-consolidate').addEventListener('click', () => void executeAdminAction('sleep_consolidation'));
  $('admin-observation-refresh').addEventListener('click', loadAdminObservation);
  globalThis.addEventListener?.('popstate', () => { const route = currentWorkspaceRoute(); setView(route.view, {address: false, focus: true, tab: route.tab}); });
  globalThis.addEventListener?.('hashchange', () => { const route = currentWorkspaceRoute(); if (route.view !== state.view || route.tab !== state[route.view + 'Tab']) setView(route.view, {address: false, focus: true, tab: route.tab}); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.vaultUnlocked) void loadVaultStatus();
  });
}




function validInferenceSelection(body) {
  return body?.schema === 'shei.llm_session_selection/v1' && body.scope === 'authenticated_owner_conversation'
    && ['inherit', 'tidex', 'base'].includes(body.mode) && Number.isSafeInteger(body.revision) && body.revision >= 0
    && typeof body.can_select === 'boolean' && typeof body.can_clear === 'boolean' && body.applies_to === 'new_turns';
}

function inferenceSnapshotLabel(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return 'Nombre no comunicado';
  const model = typeof snapshot.model === 'string' && snapshot.model ? snapshot.model : 'Modelo sin nombre comunicado';
  const adapter = typeof snapshot.governance?.adapter_id === 'string' ? ' · Adaptador ' + snapshot.governance.adapter_id : '';
  return model + adapter;
}

function inferenceScopeCurrent() {
  return state.inferenceScope === JSON.stringify([state.sessionId, state.conversationId]);
}

function inferenceOptionAuthorized(option) {
  return option?.kind === 'base'
    ? option.selection_id === 'base' && option.base_configuration_verified === true
    : option?.governed_receipt_verified === true;
}

function currentInferenceOption() {
  if (state.inferenceSelection?.mode === 'base') return 'base';
  const sha = state.inferenceSelection?.selection?.selection_sha256;
  return typeof sha === 'string' ? state.inferenceOptions.find((option) => option.selection?.selection_sha256 === sha)?.selection_id || '' : '';
}

function updateInferenceControls() {
  const current = state.inferenceSelection;
  const valid = state.inferenceVerified && inferenceScopeCurrent() && !state.inferenceNeedsRefresh && !state.inferenceBusy;
  const chosen = state.inferenceOptions.find((option) => option.selection_id === $('inference-option').value);
  const available = valid && current?.can_select === true && state.inferenceOptionsVerified && state.inferenceOptions.length > 0;
  $('inference-option').disabled = !available;
  $('inference-apply').disabled = !available || !inferenceOptionAuthorized(chosen)
    || (['tidex', 'base'].includes(current.mode) && chosen.selection_id === currentInferenceOption());
  $('inference-inherit').disabled = !valid || current?.can_clear !== true || !['tidex', 'base'].includes(current.mode);
  $('inference-refresh').disabled = state.inferenceBusy || state.inferenceLoading;
}

function renderInferenceSelection() {
  const current = state.inferenceSelection;
  const verified = state.inferenceVerified && inferenceScopeCurrent();
  const effective = current?.effective_selection;
  $('inference-current-summary').textContent = !current ? 'Selección pendiente de consultar'
    : (verified ? '' : 'Última lectura · ') + (current.mode === 'inherit' ? 'Selección general' : current.mode === 'base' ? 'Modelo base en esta conversación' : 'Selección de esta conversación')
      + (effective ? ' · ' + inferenceSnapshotLabel(effective) : ' · Resultado efectivo sin confirmar');
  $('inference-selection-current').textContent = !current ? 'Todavía no se ha consultado la selección del servidor.'
    : !verified ? 'Última observación: revisión ' + current.revision + '. La selección vigente necesita otra consulta.'
    : 'Revisión ' + current.revision + ' · ' + (current.mode === 'inherit' ? 'Hereda la selección general.' : current.mode === 'base' ? 'Usa la base del servicio para los nuevos turnos.' : 'Tiene una selección propia para nuevos turnos.')
      + (current.selection ? ' Selección registrada: ' + inferenceSnapshotLabel(current.selection) + '.' : '');
  $('inference-permission').textContent = !verified ? 'El acceso a cambios está pendiente de verificar.'
    : current.can_select === true || current.can_clear === true ? 'El servidor autoriza cambios dentro de esta conversación.'
      : accessReason(current.reason);
  $('inference-readiness').textContent = current?.effective_selection_error
    ? 'El servidor no ha podido resolver la selección efectiva: ' + String(current.effective_selection_error)
    : 'La disponibilidad del modelo elegido se comprueba al iniciar el turno.';
  const select = $('inference-option');
  const previous = select.value;
  select.replaceChildren();
  const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Elige una opción autorizada'; select.append(placeholder);
  for (const option of state.inferenceOptions) {
    const item = document.createElement('option'); item.value = option.selection_id;
    item.textContent = typeof option.display_name === 'string' && option.display_name
      ? option.display_name + (option.adapter_id ? ' · Adaptador ' + option.adapter_id : '')
      : inferenceSnapshotLabel(option.selection);
    item.disabled = !inferenceOptionAuthorized(option); select.append(item);
  }
  select.value = state.inferenceOptions.some((option) => option.selection_id === previous) ? previous : currentInferenceOption();
  if (!select.value) select.value = '';
  $('inference-options-note').textContent = !state.inferenceOptionsVerified ? 'Las opciones disponibles no se han verificado.'
    : state.inferenceOptions.length ? state.inferenceOptions.length + ' opciones publicadas por el servicio. Sólo se pueden seleccionar las que tienen autorización comprobada.'
      : 'El servidor no ofrece opciones autorizadas para esta conversación.';
  updateInferenceControls();
}

async function loadInferenceSelection() {
  const requestId = ++state.inferenceRequestId;
  const scope = JSON.stringify([state.sessionId, state.conversationId]);
  if (state.inferenceScope !== scope) {
    state.inferenceSelection = null; state.inferenceOptions = []; state.inferenceOptionsVerified = false;
  }
  state.inferenceScope = scope;
  state.inferenceVerified = false; state.inferenceLoading = true;
  renderInferenceSelection(); $('inference-status').textContent = 'Consultando selección y opciones autorizadas…';
  try {
    const query = personalScopeQuery();
    const [selection, options] = await Promise.allSettled([
      apiRequest('/api/inference/session-selection?' + query),
      apiRequest('/api/inference/session-selection/options?' + query),
    ]);
    if (requestId !== state.inferenceRequestId || scope !== JSON.stringify([state.sessionId, state.conversationId])) return;
    if (selection.status === 'rejected') throw selection.reason;
    if (!validInferenceSelection(selection.value)) throw new Error('El servicio no devolvió una selección de conversación verificable.');
    state.inferenceSelection = selection.value; state.inferenceVerified = true; state.inferenceNeedsRefresh = false;
    state.inferenceOptionsVerified = false; state.inferenceOptions = [];
    if (options.status === 'fulfilled' && options.value.schema === 'shei.llm_session_selection_options/v1' && Array.isArray(options.value.options)
      && options.value.options.every((option) => typeof option.selection_id === 'string' && option.selection_id.length > 0 && option.selection_id.length <= 512 && option.selection && typeof option.selection === 'object')) {
      state.inferenceOptions = [...new Map(options.value.options.map((option) => [option.selection_id, option])).values()];
      state.inferenceOptionsVerified = true;
    }
    renderInferenceSelection();
    $('inference-status').textContent = state.inferenceOptionsVerified
      ? 'Selección consultada. Los cambios afectan a los próximos turnos de esta conversación.'
      : 'Se ha leído la selección actual, pero no se han podido verificar las opciones. Puedes volver a consultar.';
    if (options.status === 'rejected' && options.reason.code === 'AUTH_REQUIRED') showAccess();
  } catch (error) {
    if (requestId !== state.inferenceRequestId) return;
    state.inferenceVerified = false; state.inferenceOptionsVerified = false; state.inferenceNeedsRefresh = true;
    renderInferenceSelection(); $('inference-status').textContent = 'No se ha podido verificar la selección: ' + error.message;
    if (error.code === 'AUTH_REQUIRED') showAccess();
  } finally {
    if (requestId === state.inferenceRequestId) { state.inferenceLoading = false; updateInferenceControls(); }
  }
}

async function changeInferenceSelection(inherit = false) {
  const current = state.inferenceSelection;
  const scope = JSON.stringify([state.sessionId, state.conversationId]);
  if (!state.inferenceVerified || !inferenceScopeCurrent() || state.inferenceNeedsRefresh || state.inferenceBusy) return;
  const option = state.inferenceOptions.find((entry) => entry.selection_id === $('inference-option').value);
  if (inherit ? current?.can_clear !== true || !['tidex', 'base'].includes(current.mode)
    : current?.can_select !== true || !state.inferenceOptionsVerified || !inferenceOptionAuthorized(option)) return;
  const expectedRevision = current.revision;
  const owner = current.owner_binding;
  state.inferenceBusy = true; updateInferenceControls();
  try {
    const confirmed = await confirmAction(
      inherit ? 'Volver a la selección general' : 'Cambiar el modelo de esta conversación',
      inherit ? 'Los próximos turnos volverán a usar la selección general del sistema. Esto no revoca ni desactiva adaptadores en otras conversaciones.'
        : 'Se solicitará ' + inferenceSnapshotLabel(option.selection) + ' para los próximos turnos de esta conversación. Los mensajes anteriores se conservan.',
      inherit ? 'Volver a selección general' : 'Aplicar a nuevos turnos',
    );
    if (!confirmed) return;
    if (!state.inferenceVerified || !inferenceScopeCurrent() || scope !== JSON.stringify([state.sessionId, state.conversationId]) || state.inferenceSelection?.owner_binding !== owner) throw new Error('El ámbito o el acceso cambió. Consulta de nuevo la selección.');
    const payload = inherit ? {expected_revision: expectedRevision} : {expected_revision: expectedRevision, selection_id: option.selection_id};
    $('inference-status').textContent = 'Solicitando el cambio. No se repetirá automáticamente.';
    const body = await apiRequest('/api/inference/session-selection?' + personalScopeQuery(), {method: inherit ? 'DELETE' : 'PUT', body: JSON.stringify(payload)});
    if (scope !== JSON.stringify([state.sessionId, state.conversationId])) return;
    if (body.committed === true && body.confirmed === false) {
      state.inferenceVerified = false; state.inferenceNeedsRefresh = true; renderInferenceSelection();
      const committed = Number.isSafeInteger(body.committed_revision) && body.committed_revision > expectedRevision
        ? 'El servicio informa de que la solicitud quedó registrada en la revisión ' + body.committed_revision + '. ' : '';
      $('inference-status').textContent = committed + 'La selección vigente no se ha podido confirmar. Consulta la selección actual antes de otra solicitud. No se repetirá automáticamente.';
      return;
    }
    if (body.committed === true) {
      if (body.confirmed !== true || !Number.isSafeInteger(body.committed_revision) || body.committed_revision <= expectedRevision
        || typeof body.committed_selection_is_current !== 'boolean') throw new Error('El recibo no distingue el cambio registrado de la selección vigente.');
      if (body.committed_selection_is_current === false) {
        if (!validInferenceSelection(body) || body.owner_binding !== owner || body.revision <= body.committed_revision) throw new Error('La lectura posterior no confirma la revisión vigente.');
        state.inferenceSelection = body; state.inferenceVerified = true; state.inferenceNeedsRefresh = false; renderInferenceSelection();
        $('inference-status').textContent = 'Tu solicitud quedó registrada en la revisión ' + body.committed_revision
          + ', pero otra operación produjo la revisión ' + body.revision + '. La selección mostrada corresponde a esa última lectura, no al cambio de tu solicitud.';
        return;
      }
      if (body.revision !== body.committed_revision) throw new Error('La revisión leída no coincide con el cambio confirmado.');
    }
    const expectedMode = inherit ? 'inherit' : option.kind === 'base' ? 'base' : 'tidex';
    const selectedSnapshot = body.selection || (expectedMode === 'base' ? body.effective_selection : null);
    if (!validInferenceSelection(body) || body.owner_binding !== owner || body.revision <= expectedRevision || body.mode !== expectedMode
      || (inherit ? body.selection !== null : selectedSnapshot?.selection_sha256 !== option.selection?.selection_sha256)) throw new Error('La respuesta no confirma la revisión solicitada.');
    state.inferenceSelection = body; state.inferenceVerified = true; state.inferenceNeedsRefresh = false;
    renderInferenceSelection();
    $('inference-status').textContent = 'Cambio registrado en la revisión ' + body.revision + '. Se aplicará a los próximos turnos de esta conversación.';
  } catch (error) {
    if (scope !== JSON.stringify([state.sessionId, state.conversationId])) return;
    state.inferenceVerified = false; state.inferenceNeedsRefresh = true; renderInferenceSelection();
    $('inference-status').textContent = (error.status === 409 ? 'La selección cambió en otra sesión. ' : 'No se ha confirmado el cambio. ')
      + 'Consulta la selección actual antes de volver a solicitarlo. ' + error.message;
    if (error.code === 'AUTH_REQUIRED') showAccess();
  } finally { state.inferenceBusy = false; updateInferenceControls(); }
}


function canonicalTrainingAvailable() {
  return state.lifelongMemoryStatus?.training?.canonical_enabled === true && state.notesVerified === true;
}

function renderCanonicalTrainingSources() {
  const list = $('lifelong-memory-canonical-sources');
  if (!list) return;
  list.replaceChildren();
  const eligible = state.notes.filter((note) => note.lifecycle_status === 'ACTIVE' && note.is_current === true);
  state.lifelongMemoryCanonicalSelected = state.lifelongMemoryCanonicalSelected.filter((ref) => eligible.some((note) => note.memory_id === ref.memory_id && note.revision === ref.expected_revision));
  for (const note of eligible) {
    const label = document.createElement('label'); label.className = 'canonical-source-choice';
    const box = document.createElement('input'); box.type = 'checkbox'; box.value = note.memory_id;
    box.checked = state.lifelongMemoryCanonicalSelected.some((ref) => ref.memory_id === note.memory_id);
    box.disabled = !canonicalTrainingAvailable() || state.lifelongMemoryTrainingBusy || state.controlAccess?.learning?.allowed !== true;
    box.addEventListener('change', () => {
      if (!canonicalTrainingAvailable() || state.controlAccess?.learning?.allowed !== true || state.lifelongMemoryTrainingBusy) { box.checked = false; return; }
      const refs = state.lifelongMemoryCanonicalSelected.filter((ref) => ref.memory_id !== note.memory_id);
      if (box.checked) refs.push({memory_id: note.memory_id, expected_revision: note.revision});
      const maximum = state.lifelongMemoryStatus?.training?.max_sources;
      if (Number.isSafeInteger(maximum) && refs.length > maximum) { box.checked = false; toast('La selección supera el límite de fuentes del servidor.'); return; }
      state.lifelongMemoryCanonicalSelected = refs;
      updateLifelongMemoryTrainingControls();
    });
    const copy = document.createElement('span');
    const title = document.createElement('strong'); title.textContent = note.title;
    const meta = document.createElement('small'); meta.textContent = 'Versión ' + note.revision + ' · Original recuperado por SHEILY al registrar la solicitud';
    copy.append(title, meta); label.append(box, copy); list.append(label);
  }
  $('lifelong-memory-canonical-status').textContent = !state.notesVerified ? 'Consulta las notas para verificar las revisiones disponibles.'
    : eligible.length ? eligible.length + ' notas vigentes en esta página. Puedes consultar más en Memoria y versiones.'
    : 'No hay notas vigentes disponibles en las páginas consultadas.';
}

function selectLifelongMemorySourceMode(mode) {
  if (!['archive', 'canonical'].includes(mode)) return;
  state.lifelongMemorySourceMode = mode;
  $('lifelong-memory-archive-selection-note').hidden = mode !== 'archive';
  $('lifelong-memory-canonical-controls').hidden = mode !== 'canonical';
  if (mode === 'canonical') {
    if (!state.notesVerified) void loadCanonicalNotes();
    renderCanonicalTrainingSources();
  }
  updateLifelongMemoryTrainingControls();
}

async function verifyLifelongMemoryHistoryTurn(turn) {
  const turnId = typeof turn?.turn_id === 'string' && turn.turn_id
    ? turn.turn_id
    : Number.isSafeInteger(turn?.turn_id) && turn.turn_id > 0 ? String(turn.turn_id) : '';
  if (!turnId || !Array.isArray(turn.messages) || !['REPLY_RECORDED', 'USER_ONLY'].includes(turn.record_state) || turn.delivery_verified !== false) throw new Error('Un turno no tiene un estado de archivo verificable.');
  for (const message of turn.messages) {
    const source = message?.source;
    if (!['user', 'assistant'].includes(message?.role) || typeof message.text !== 'string' || !source || !/^[a-f0-9]{64}$/.test(source.sha256 || '')) throw new Error('La procedencia de un mensaje no es válida.');
    const bytes = new TextEncoder().encode(message.text);
    if (!Number.isSafeInteger(source.bytes) || source.bytes !== bytes.byteLength) throw new Error('Un mensaje no coincide con el tamaño de su original.');
    if (!globalThis.SheilyUploads?.digest) throw new Error('No está disponible la comprobación de integridad del historial.');
    if (await SheilyUploads.digest(bytes) !== source.sha256) throw new Error('Un mensaje no coincide con su huella de origen.');
  }
  return {...turn, turn_id: turnId};
}

function renderLifelongMemoryHistory() {
  const list = $('lifelong-memory-history-list'); list.replaceChildren();
  for (const turn of state.lifelongMemoryHistory) {
    if (turn.overflow) { list.append(renderOversizedLifelongMemoryTurn(turn)); continue; }
    const article = document.createElement('details'); article.className = 'archive-turn';
    const summary = document.createElement('summary');
    const heading = document.createElement('span'); heading.textContent = compactText(turn.messages.find((message) => message.role === 'user')?.text || turn.turn_id, 90);
    const stateLabel = document.createElement('small'); stateLabel.textContent = turn.record_state === 'REPLY_RECORDED' ? 'Respuesta registrada · entrega no verificada' : 'Entrada conservada · sin respuesta registrada';
    summary.append(heading, stateLabel); article.append(summary);
    if (typeof turn.created === 'string') { const created = document.createElement('p'); created.className = 'section-status'; created.textContent = 'Registro original: ' + turn.created; article.append(created); }
    for (const message of turn.messages) {
      const section = document.createElement('section'); section.className = 'archive-message';
      const title = document.createElement('h4'); title.textContent = message.role === 'user' ? 'Usuario' : 'Lifelong Memory';
      const original = document.createElement('pre'); original.textContent = message.text; original.tabIndex = 0;
      const provenance = document.createElement('p'); provenance.className = 'source-provenance';
      provenance.textContent = 'Original verificado · ' + String(message.source.id || message.source.source_id || 'Fuente archivada') + ' · ' + message.source.bytes + ' bytes · SHA-256 ' + message.source.sha256;
      section.append(title, original, provenance); article.append(section);
    }
    list.append(article);
  }
  $('lifelong-memory-history-more').hidden = !state.lifelongMemoryHistoryHasMore;
  $('lifelong-memory-history-more').textContent = state.lifelongMemoryHistory.at(-1)?.overflow ? 'Continuar después de este turno' : 'Cargar más turnos';
}

function renderOversizedLifelongMemoryTurn(turn) {
  const article = document.createElement('article'); article.className = 'workspace-card archive-overflow';
  const title = document.createElement('h4'); title.textContent = 'Turno conservado en originales individuales';
  const copy = document.createElement('p'); copy.className = 'section-status'; copy.textContent = 'Este turno supera el tamaño de una página. Puedes abrir cada fuente íntegra. El contenido no se ha truncado ni cuenta como una respuesta entregada.';
  const actions = document.createElement('div'); actions.className = 'head-actions';
  for (const id of turn.source_ids) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary-button'; button.textContent = 'Abrir original ' + id;
    button.addEventListener('click', () => void loadLifelongMemorySource(id, button)); actions.append(button);
  }
  article.append(title, copy, actions); return article;
}

async function loadLifelongMemoryHistory(append = false) {
  const requestId = ++state.lifelongMemoryHistoryRequestId;
  const epoch = state.authEpoch;
  $('lifelong-memory-history-refresh').disabled = true; $('lifelong-memory-history-more').disabled = true;
  $('lifelong-memory-history-status').textContent = 'Consultando y verificando los originales del historial…';
  try {
    const query = new URLSearchParams({offset: String(append ? state.lifelongMemoryHistoryNext : 0), limit: '20'});
    if (append && state.lifelongMemoryHistoryVersion) query.set('expected_version', state.lifelongMemoryHistoryVersion);
    const body = await apiRequest('/api/lifelong-memory/history?' + query);
    if (body.read_only !== true || !Array.isArray(body.turns) || !/^[a-f0-9]{64}$/.test(body.history_version || '')) throw new Error('El servicio no devolvió un archivo de historial verificable.');
    if (append && body.history_version !== state.lifelongMemoryHistoryVersion) throw new Error('El archivo cambió. Actualiza desde el principio.');
    const turns = await Promise.all(body.turns.map(verifyLifelongMemoryHistoryTurn));
    if (requestId !== state.lifelongMemoryHistoryRequestId || epoch !== state.authEpoch) return;
    const previous = append ? state.lifelongMemoryHistory : [];
    state.lifelongMemoryHistory = [...new Map([...previous, ...turns].map((turn) => [turn.turn_id, turn])).values()];
    state.lifelongMemoryHistoryVersion = body.history_version;
    state.lifelongMemoryHistoryHasMore = body.has_more === true && Number.isSafeInteger(body.next_offset);
    state.lifelongMemoryHistoryNext = state.lifelongMemoryHistoryHasMore ? body.next_offset : 0;
    renderLifelongMemoryHistory();
    $('lifelong-memory-history-status').textContent = state.lifelongMemoryHistory.length
      ? state.lifelongMemoryHistory.length + ' turnos archivados consultados. ' + (state.lifelongMemoryHistory.some((turn) => turn.overflow)
        ? 'Hay turnos que requieren abrir sus fuentes individuales. La verificación indicada corresponde a los mensajes mostrados completos; la entrega sigue sin confirmar.'
        : 'Los originales mostrados coinciden con su procedencia; esto no prueba que la respuesta se entregara.')
      : 'El archivo consultado no contiene turnos.';
  } catch (error) {
    if (requestId !== state.lifelongMemoryHistoryRequestId) return;
    state.lifelongMemoryHistoryHasMore = false; $('lifelong-memory-history-more').hidden = true;
    const detail = error.details;
    const overflowTurnId = typeof detail?.turn_id === 'string' && detail.turn_id
      ? detail.turn_id
      : Number.isSafeInteger(detail?.turn_id) && detail.turn_id > 0 ? String(detail.turn_id) : '';
    if (error.code === 'TURN_TOO_LARGE' && detail && overflowTurnId
      && /^[a-f0-9]{64}$/.test(detail.history_version || '') && Array.isArray(detail.source_ids)
      && detail.source_ids.length && detail.source_ids.every((id) => lifelongMemorySourceId({source_id: id}))) {
      const previous = append ? state.lifelongMemoryHistory : [];
      const entry = {turn_id: overflowTurnId, source_ids: detail.source_ids, overflow: true};
      state.lifelongMemoryHistory = [...new Map([...previous, entry].map((turn) => [turn.turn_id, turn])).values()];
      state.lifelongMemoryHistoryVersion = detail.history_version;
      state.lifelongMemoryHistoryHasMore = Number.isSafeInteger(detail.next_offset) && detail.next_offset > (Number.isSafeInteger(detail.offset) ? detail.offset : 0);
      state.lifelongMemoryHistoryNext = state.lifelongMemoryHistoryHasMore ? detail.next_offset : 0;
      renderLifelongMemoryHistory();
      $('lifelong-memory-history-status').textContent = 'Hay un turno que debe consultarse por sus fuentes individuales. La continuación del historial requiere tu acción.';
      return;
    }
    $('lifelong-memory-history-status').textContent = error.code === 'HISTORY_CHANGED' || error.status === 409
      ? 'El archivo cambió durante la consulta. Pulsa Consultar historial para cargar la versión actual.'
      : 'No se ha podido verificar el historial: ' + error.message + (state.lifelongMemoryHistory.length ? ' Se conserva la última lectura verificada.' : '');
    if (error.code === 'AUTH_REQUIRED') showAccess();
  } finally {
    if (requestId === state.lifelongMemoryHistoryRequestId) { $('lifelong-memory-history-refresh').disabled = false; $('lifelong-memory-history-more').disabled = false; }
  }
}

function lifelongMemoryJobIdentity(job) {
  return job && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/.test(job.job_id || '') && ['sheily', 'archive'].includes(job.job_namespace);
}

function appendJobFact(label, value) {
  const row = document.createElement('div');
  const term = document.createElement('dt'); term.textContent = label;
  const description = document.createElement('dd'); description.textContent = value === null || value === undefined ? 'No verificado' : String(value);
  row.append(term, description); $('lifelong-memory-job-facts').append(row);
}

function observedBoolean(value, positive, negative) {
  return value === true ? positive : value === false ? negative : 'No evaluado';
}

async function openLifelongMemoryJob(job) {
  if (!lifelongMemoryJobIdentity(job)) return;
  clearTidexControl();
  const requestId = ++state.lifelongMemoryJobRequestId;
  $('lifelong-memory-job-reader').hidden = false; $('lifelong-memory-job-title').textContent = 'Trabajo ' + job.job_id;
  $('lifelong-memory-job-status').textContent = 'Consultando el trabajo y sus comprobaciones…';
  $('lifelong-memory-job-facts').replaceChildren(); $('lifelong-memory-job-warnings').replaceChildren(); $('lifelong-memory-job-actions').replaceChildren();
  try {
    const body = await apiRequest('/api/lifelong-memory/jobs/' + encodeURIComponent(job.job_id) + '?archive=' + String(job.job_namespace === 'archive'));
    if (requestId !== state.lifelongMemoryJobRequestId) return;
    const detail = body.job;
    if (!lifelongMemoryJobIdentity(detail) || detail.job_id !== job.job_id || detail.job_namespace !== job.job_namespace) throw new Error('El detalle no coincide con el trabajo solicitado.');
    $('lifelong-memory-job-status').textContent = 'Lectura del trabajo recibida. Consultarlo no lo reanuda ni activa el candidato.';
    appendJobFact('Procedencia', detail.job_namespace === 'archive' ? 'Archivo de Lifelong Memory' : 'Trabajo solicitado desde SHEILY');
    appendJobFact('Estado comunicado', detail.status);
    appendJobFact('Etapa persistida', detail.persisted_status);
    appendJobFact('Proceso observado', observedBoolean(detail.worker_running, 'En ejecución', 'No observado en ejecución'));
    const steps = detail.steps_total ?? detail.max_steps;
    appendJobFact('Pasos registrados', Number.isSafeInteger(detail.step) && Number.isSafeInteger(steps) && steps > 0 ? detail.step + ' / ' + steps : null);
    appendJobFact('Instantánea de fuentes', observedBoolean(detail.source_snapshot_verified, 'Verificada', 'No verificada'));
    appendJobFact('Fuentes todavía vigentes', observedBoolean(detail.sources_current, 'Vigentes', 'Han cambiado'));
    appendJobFact('Integridad del adaptador', observedBoolean(detail.artifact_integrity_verified, 'Verificada', 'No verificada'));
    appendJobFact('Identidad del modelo base de entrenamiento', observedBoolean(detail.hf_base_manifest_verified, 'Manifiesto verificado', 'Sin verificar'));
    appendJobFact('Base comprobada durante el entrenamiento', observedBoolean(detail.hf_base_training_verified, 'Verificada antes de cargar y después de entrenar', 'Sin comprobación completa'));
    appendJobFact('Base de entrenamiento actual', detail.hf_base_current_verified === true ? 'Verificada por el servicio' : 'No comprobada en esta consulta');
    if (typeof detail.hf_base_manifest_sha256 === 'string' && /^[a-f0-9]{64}$/.test(detail.hf_base_manifest_sha256)) appendJobFact('SHA-256 del manifiesto de la base', detail.hf_base_manifest_sha256);
    appendJobFact('Certificación', observedBoolean(detail.certified, 'Informada por el servicio', 'Sin certificar'));
    appendJobFact('Activación', observedBoolean(detail.active, 'Informada por el servicio', 'Sin activar'));
    if (detail.updated_at) appendJobFact('Última actualización registrada', detail.updated_at);
    const warnings = [
      typeof detail.error === 'string' && detail.error ? detail.error : null,
      typeof detail.certification_warning === 'string' ? detail.certification_warning : null,
      typeof detail.source_integrity_warning === 'string' ? detail.source_integrity_warning : null,
      typeof detail.hf_base_warning === 'string' ? detail.hf_base_warning : null,
      detail.hf_base_manifest_verified !== true ? 'Este trabajo no aporta una identidad verificada del modelo base usado para entrenar. Los trabajos históricos no adquieren esa prueba por volver a consultarlos.' : null,
      detail.sources_current === null || detail.sources_current === undefined ? 'La vigencia actual de las fuentes no ha sido evaluada. La instantánea usada para entrenar y la memoria actual son comprobaciones distintas.' : null,
      'Este trabajo no ofrece activación directa. La activación requiere una evaluación separada y una promoción verificada por TIDEX.',
    ].filter(Boolean);
    for (const message of warnings) { const item = document.createElement('p'); item.className = 'access-notice'; item.textContent = message; $('lifelong-memory-job-warnings').append(item); }
    for (const [label, data] of [['Solicitud original', detail.request], ['Comparación observada', detail.probe], ['Control negativo', detail.negative_control_audit], ['Evaluación local', detail.local_evaluation], ['Recibo de la base de entrenamiento', detail.hf_base_verification]]) {
      if (!data || typeof data !== 'object') continue;
      const section = document.createElement('details'); section.className = 'job-evidence';
      const summary = document.createElement('summary'); summary.textContent = label;
      const original = document.createElement('pre'); original.className = 'technical-receipt'; original.textContent = JSON.stringify(data, null, 2); original.tabIndex = 0;
      section.append(summary, original); $('lifelong-memory-job-warnings').append(section);
    }
    const refresh = document.createElement('button'); refresh.type = 'button'; refresh.className = 'secondary-button'; refresh.textContent = 'Actualizar este trabajo';
    refresh.addEventListener('click', () => void openLifelongMemoryJob(job)); $('lifelong-memory-job-actions').append(refresh);
    if (detail.job_namespace === 'sheily' && detail.request?.source_origin === 'sheily_canonical') {
      const evaluate=document.createElement('button'); evaluate.type='button';evaluate.className='primary-button';evaluate.textContent='Evaluación y promoción';
      evaluate.addEventListener('click',()=>void openTidexControl(detail));$('lifelong-memory-job-actions').append(evaluate);
    }
    $('lifelong-memory-job-reader').scrollIntoView({block: 'nearest', behavior: 'smooth'});
  } catch (error) {
    if (requestId !== state.lifelongMemoryJobRequestId) return;
    $('lifelong-memory-job-status').textContent = 'No se pudo verificar el trabajo: ' + error.message;
    if (error.code === 'AUTH_REQUIRED') showAccess();
  }
}


// TIDEX owns evaluation and promotion; this view never infers approval from loss.
function clearTidexControl() {
  state.tidexRequestId++;
  clearTimeout(state.tidexPollTimer); state.tidexPollTimer = null;
  state.tidexJob = null; state.tidexSources = []; state.tidexGroups = [];
  state.tidexOperation = null; state.tidexWriteRequest = null; state.tidexBusy = false;
  for (const id of ['tidex-cases', 'tidex-operations', 'tidex-result', 'tidex-blockers']) $(id)?.replaceChildren();
  if ($('tidex-control')) $('tidex-control').hidden = true;
  if ($('tidex-evaluate')) $('tidex-evaluate').disabled = true;
  if ($('tidex-promote')) $('tidex-promote').disabled = true;
  if ($('tidex-register')) { $('tidex-register').disabled = true; $('tidex-register').hidden = true; }
}
function tidexAllowed() {
  return state.vaultUnlocked && state.controlAccess?.administration?.allowed === true;
}
function tidexCurrent(epoch, jobId) {
  return epoch === state.tidexRequestId && state.tidexJob?.job_id === jobId && tidexAllowed();
}
function tidexPromotionEligible(operation) {
  return operation?.schema === 'tidex.lifelong_memory_operation/v1'
    && String(operation.state).toLowerCase() === 'succeeded'
    && operation.action === 'evaluate' && operation.result?.promotion_eligible === true
    && Array.isArray(operation.blockers) && operation.blockers.length === 0;
}

function tidexPromoted(operation) {
  return operation?.schema === 'tidex.lifelong_memory_operation/v1' && operation.action === 'promote'
    && String(operation.state).toLowerCase() === 'succeeded'
    && operation.result?.promoted === true && operation.result?.receipt_verified === true;
}
async function registerTidexSelection() {
  if (!tidexAllowed() || !state.tidexJob || state.tidexBusy || !tidexPromoted(state.tidexOperation)) return;
  const epoch=state.tidexRequestId, jobId=state.tidexJob.job_id, operationId=state.tidexOperation.operator_job_id;
  const scope=JSON.stringify([state.sessionId,state.conversationId]);
  state.tidexBusy=true;updateTidexControls();
  $('tidex-status').textContent='Comprobando la promoción y registrando el adaptador para tu usuario…';
  try {
    const body=await apiRequest('/api/tidex/lifelong-memory/operations/'+operationId+'/register-selection?'+personalScopeQuery(),{method:'POST',body:'{}'});
    if (!tidexCurrent(epoch,jobId) || scope!==JSON.stringify([state.sessionId,state.conversationId])) return;
    if (body.schema!=='shei.llm_session_selection_registration/v1' || body.registered!==true
      || body.operator_job_id!==operationId || body.job_id!==jobId || !/^[a-f0-9]{64}$/.test(body.selection_id||'')
      || body.conversation_selection_changed!==false) throw new Error('El registro no se pudo confirmar.');
    await loadInferenceSelection();
    if (!tidexCurrent(epoch,jobId) || scope!==JSON.stringify([state.sessionId,state.conversationId])) return;
    $('tidex-status').textContent='Adaptador registrado para tu usuario. Puedes elegirlo en «Modelo de esta conversación»; la selección actual se conserva.';
  } catch(error) {
    if (!tidexCurrent(epoch,jobId)) return;
    $('tidex-status').textContent='El registro no se ha confirmado: '+error.message+'. Consulta tus adaptadores antes de repetir la solicitud.';
  } finally {
    if (tidexCurrent(epoch,jobId)) {state.tidexBusy=false;updateTidexControls();}
  }
}

function updateTidexControls() {
  const available = tidexAllowed() && state.tidexJob && state.tidexSources.length > 0 && !state.tidexBusy;
  if ($('tidex-refresh')) $('tidex-refresh').disabled = state.tidexBusy;
  if ($('tidex-add-case')) $('tidex-add-case').disabled = !available || state.tidexGroups.length >= 24;
  if ($('tidex-evaluate')) $('tidex-evaluate').disabled = !available || !state.tidexGroups.length;
  if ($('tidex-promote')) $('tidex-promote').disabled = !available || !tidexPromotionEligible(state.tidexOperation);
  if ($('tidex-register')) { $('tidex-register').hidden = !tidexPromoted(state.tidexOperation); $('tidex-register').disabled = !available || !tidexPromoted(state.tidexOperation); }
}
function tidexField(label, tag, maxLength) {
  const container = document.createElement('label'); container.textContent = label;
  const input = document.createElement(tag); if (tag === 'textarea') input.rows = 2;
  input.required = true; if (maxLength) input.maxLength = maxLength;
  container.append(input); return {container, input};
}
function addTidexCase() {
  if (!tidexAllowed() || !state.tidexSources.length || state.tidexGroups.length >= 24) return;
  const card = document.createElement('fieldset'); card.className = 'tidex-case workspace-card';
  const legend = document.createElement('legend'); legend.textContent = 'Comprobación ' + (state.tidexGroups.length + 1); card.append(legend);
  const phase = tidexField('Momento de la evaluación', 'select');
  for (const [value, label] of [['petfc_midpoint','Trayecto · adaptación al 50 %'],['petfc_candidate','Trayecto · candidato completo'],['gate','Admisión del candidato'],['canary_one','Prueba controlada inicial'],['canary_two','Prueba controlada ampliada']]) {
    const option = document.createElement('option'); option.value = value; option.textContent = label; phase.input.append(option);
  }
  phase.input.value = 'gate'; card.append(phase.container);
  const source = tidexField('Fuente de conocimiento', 'select');
  for (const item of state.tidexSources) {
    const option = document.createElement('option'); option.value = item.source_id;
    const note = state.notes.find((note) => note.memory_id === item.memory_id);
    option.textContent = (note?.title || 'Nota ' + item.memory_id.slice(-8)) + ' · revisión ' + item.revision;
    source.input.append(option);
  }
  source.input.value = state.tidexSources[0].source_id; card.append(source.container);
  const fields = {phase:phase.input, source:source.input};
  for (const [key, label, max] of [
    ['qualityPrompt','Pregunta nueva sobre el conocimiento aprendido',2000],
    ['qualityExpected','Respuesta que debe aparecer y que consta en la fuente',300],
    ['preservationPrompt','Pregunta sobre una capacidad que debe conservar',2000],
    ['preservationExpected','Respuesta correcta para el control de conservación',300],
    ['negativePrompt','Pregunta en la que no debe revelar el dato aprendido',2000],
    ['negativeForbidden','Dato aprendido que no debe aparecer en ese control',300]]) {
    const field = tidexField(label,'textarea',max); fields[key] = field.input; card.append(field.container);
  }
  const group = {card, fields}; state.tidexGroups.push(group);
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'secondary-button'; remove.textContent = 'Quitar comprobación';
  remove.addEventListener('click', () => { state.tidexGroups = state.tidexGroups.filter((item) => item !== group); card.remove(); updateTidexControls(); });
  card.append(remove); $('tidex-cases').append(card); updateTidexControls();
}
function tidexSuite() {
  if (!state.tidexGroups.length || state.tidexGroups.length > 24) throw new Error('Añade entre una y 24 comprobaciones.');
  const groups = state.tidexGroups.map(({fields:f}) => {
    const text = (key, max) => { const value = f[key].value.trim(); if (!value || value.length > max) throw new Error('Completa las preguntas y respuestas de cada comprobación.'); return value; };
    if (!state.tidexSources.some((source) => source.source_id === f.source.value)) throw new Error('La fuente elegida ya no está verificada.');
    return {phase:f.phase.value, source_id:f.source.value,
      quality:{prompt:text('qualityPrompt',2000),expected:text('qualityExpected',300)},
      preservation:[{prompt:text('preservationPrompt',2000),expected:text('preservationExpected',300)}],
      negative:[{prompt:text('negativePrompt',2000),forbidden:text('negativeForbidden',300)}]};
  });
  return {schema:'tidex.lifelong_memory_test_suite/v1',groups};
}
function renderTidexOperation(operation) {
  const result = $('tidex-result'); result.replaceChildren(); $('tidex-blockers').replaceChildren();
  const facts = [['Operación',operation.action === 'evaluate'?'Evaluación comparativa':'Solicitud de promoción'],['Estado observado',operation.state],['Apta para solicitar promoción',operation.result?.promotion_eligible === true?'Sí':operation.result?.promotion_eligible === false?'No':'No verificado'],['Promoción registrada',operation.result?.promoted === true && operation.result?.receipt_verified === true?'Recibo verificado':'No confirmada']];
  for (const [label,value] of facts) { const row=document.createElement('div');const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=String(value??'No observado');row.append(dt,dd);result.append(row); }
  const blockers = Array.isArray(operation.blockers) ? operation.blockers : [];
  for (const blocker of blockers) {const item=document.createElement('p');item.className='access-notice';item.textContent=typeof blocker==='string'?blocker:String(blocker.message||blocker.code||'Comprobación pendiente');$('tidex-blockers').append(item);}
  if (operation.error) {const item=document.createElement('p');item.className='access-notice';item.textContent=typeof operation.error==='string'?operation.error:'La operación no pudo completarse.';$('tidex-blockers').append(item);}
  $('tidex-status').textContent = 'Resultado consultado en el servidor. La selección de esta conversación se comprueba por separado.';
  if (operation.result?.promoted === true && operation.result?.receipt_verified === true) void loadInferenceSelection();
  updateTidexControls();
}
async function loadTidexOperation(id) {
  if (!/^[a-f0-9]{64}$/.test(id) || !tidexAllowed() || !state.tidexJob) return;
  clearTimeout(state.tidexPollTimer); state.tidexPollTimer=null;
  const epoch=state.tidexRequestId, jobId=state.tidexJob.job_id;
  try {
    const body=await apiRequest('/api/tidex/lifelong-memory/operations/'+id);
    if (!tidexCurrent(epoch,jobId)) return;
    if (body.schema!=='tidex.lifelong_memory_operation/v1' || body.operator_job_id!==id || body.job_id!==jobId) throw new Error('La operación recibida no corresponde a este trabajo.');
    state.tidexOperation=body;renderTidexOperation(body);
    if (['queued','running'].includes(String(body.state).toLowerCase())) state.tidexPollTimer=setTimeout(()=>void loadTidexOperation(id),3000);
  } catch(error) {
    if (!tidexCurrent(epoch,jobId)) return;
    state.tidexOperation=null;updateTidexControls();
    $('tidex-status').textContent='No se pudo confirmar la operación: '+error.message+'. Puedes volver a consultar el trabajo; no se reintentará la promoción automáticamente.';
  }
}
async function refreshTidexJob() {
  if (!state.tidexJob || state.tidexBusy) return;
  const epoch=++state.tidexRequestId, jobId=state.tidexJob.job_id;
  state.tidexSources=[];updateTidexControls();
  try {
    await loadControlAccess();
    if (epoch!==state.tidexRequestId || state.tidexJob?.job_id!==jobId) return;
    if (!tidexAllowed()) { $('tidex-status').textContent=accessReason(state.controlAccess?.administration?.reason);return; }
    const body=await apiRequest('/api/tidex/lifelong-memory/jobs/'+jobId+'/operations');
    if (!tidexCurrent(epoch,jobId)) return;
    if (body.schema!=='tidex.lifelong_memory_operations/v1' || body.job_id!==jobId || !Array.isArray(body.operations)) throw new Error('El servidor no devolvió un inventario verificable.');
    const validSource=(s)=>/^[a-f0-9]{32}$/.test(s?.source_id||'') && /^sem_[a-f0-9]{32}$/.test(s?.memory_id||'') && Number.isSafeInteger(s.revision) && s.revision>0;
    state.tidexSources=body.integrity_verified===true && Array.isArray(body.canonical_sources) && body.canonical_sources.length<=8 && body.canonical_sources.every(validSource)?body.canonical_sources:[];
    $('tidex-operations').replaceChildren();$('tidex-blockers').replaceChildren();
    for (const blocker of body.blockers||[]) {const item=document.createElement('p');item.className='access-notice';item.textContent=typeof blocker==='string'?blocker:String(blocker.message||blocker.code||'Comprobación pendiente');$('tidex-blockers').append(item);}
    for (const op of body.operations) {
      if (!/^[a-f0-9]{64}$/.test(op.operator_job_id||'')) continue;
      const button=document.createElement('button');button.type='button';button.className='secondary-button';button.textContent=(op.action==='evaluate'?'Evaluación':'Promoción')+' · '+String(op.state||'Estado pendiente');
      button.addEventListener('click',()=>void loadTidexOperation(op.operator_job_id));$('tidex-operations').append(button);
    }
    $('tidex-status').textContent=state.tidexSources.length?'Fuentes y operaciones verificadas. Puedes preparar comprobaciones nuevas o consultar una evaluación anterior.':'Este trabajo no aporta las fuentes canónicas verificadas necesarias para la promoción.';
    if (!state.tidexGroups.length && state.tidexSources.length) addTidexCase();
    updateTidexControls();
  } catch(error) {
    if (epoch!==state.tidexRequestId || state.tidexJob?.job_id!==jobId) return;
    $('tidex-status').textContent='No se pudo consultar TIDEX: '+error.message;
    state.tidexSources=[];state.tidexOperation=null;updateTidexControls();
  }
}
async function openTidexControl(job) {
  clearTidexControl();state.tidexJob=job;$('tidex-control').hidden=false;
  $('tidex-heading').textContent='Evaluar el candidato · '+job.job_id.slice(0,8);
  $('tidex-status').textContent='Comprobando autoridad y fuentes…';
  await refreshTidexJob();
  if (state.tidexJob?.job_id===job.job_id) $('tidex-control').scrollIntoView({block:'nearest',behavior:'smooth'});
}
async function submitTidexAction(action) {
  if (!tidexAllowed() || !state.tidexJob || state.tidexBusy) return;
  const epoch=state.tidexRequestId, jobId=state.tidexJob.job_id;
  try {
    const payload={job_id:jobId,action};
    if (action==='evaluate') payload.tests=tidexSuite();
    else {
      if (!tidexPromotionEligible(state.tidexOperation)) throw new Error('Hace falta una evaluación aprobada y comprobada por el servidor.');
      const accepted=await confirmAction('Solicitar promoción','Se volverán a comprobar las fuentes, la evaluación y los permisos. La promoción no cambia por sí sola el modelo de esta conversación.','Solicitar promoción');
      if (!accepted || !tidexCurrent(epoch,jobId)) return;
      payload.evaluation_job_id=state.tidexOperation.operator_job_id;
    }
    const identity=JSON.stringify(payload);
    if (state.tidexWriteRequest?.identity!==identity) state.tidexWriteRequest={identity,request_id:globalThis.crypto.randomUUID()};
    payload.request_id=state.tidexWriteRequest.request_id;
    state.tidexBusy=true;updateTidexControls();$('tidex-status').textContent='Enviando solicitud. Conserva esta vista hasta conocer su estado.';
    const body=await apiRequest('/api/tidex/lifelong-memory/actions',{method:'POST',body:JSON.stringify(payload)});
    if (!tidexCurrent(epoch,jobId)) return;
    if (body.schema!=='tidex.lifelong_memory_action_result/v1' || body.job_id!==jobId || body.action!==action || !/^[a-f0-9]{64}$/.test(body.operator_job_id||'')) throw new Error('No se ha podido verificar el recibo de la solicitud.');
    state.tidexWriteRequest=null;
    await loadTidexOperation(body.operator_job_id);
  } catch(error) {
    if (epoch!==state.tidexRequestId || state.tidexJob?.job_id!==jobId) return;
    $('tidex-status').textContent='La solicitud no se ha confirmado: '+error.message+'. Si la repites sin cambiarla, conservará su identificador.';
  } finally {
    if (epoch===state.tidexRequestId && state.tidexJob?.job_id===jobId) {state.tidexBusy=false;updateTidexControls();}
  }
}

function lifelongMemoryCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString('es') : 'No medido';
}

function lifelongMemorySourceId(source) {
  const id = source && typeof source.source_id === 'string' ? source.source_id : '';
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/.test(id) ? id : '';
}

function lifelongMemorySelectableSource(source) {
  return Boolean(lifelongMemorySourceId(source))
    && source?.integrity_verified === true
    && source?.is_current === true
    && source?.provenance === 'preserved_lifelong_archive'
    && ['user', 'document', 'note'].includes(source?.kind);
}

function lifelongMemoryTrainingAllowed(status = state.lifelongMemoryStatus) {
  return status?.enabled === true && status?.available === true
    && status?.source_authority === 'sheily' && status?.training?.enabled === true
    && state.controlAccess?.learning?.allowed === true
    && (state.lifelongMemorySourceMode !== 'canonical' || canonicalTrainingAvailable());
}

function lifelongMemoryIntegrity(value) {
  if (value === true || value?.verified === true || value?.ok === true || value === 'VERIFIED') return 'Verificada';
  if (value === false || value?.verified === false || value?.ok === false || value === 'FAILED') return 'Falló la comprobación';
  return 'Sin verificar';
}

function updateLifelongMemoryTrainingControls() {
  const allowed = lifelongMemoryTrainingAllowed() && !state.lifelongMemoryTrainingBusy;
  $('lifelong-memory-training-fields').disabled = !allowed;
  $('lifelong-memory-train-submit').disabled = !allowed;
  const total = state.lifelongMemorySourceMode === 'canonical' ? state.lifelongMemoryCanonicalSelected.length : state.lifelongMemorySelectedSources.length;
  $('lifelong-memory-selected-count').textContent = total
    ? total + (total === 1 ? ' fuente seleccionada.' : ' fuentes seleccionadas.')
    : state.lifelongMemorySourceMode === 'canonical' ? 'Selecciona las notas vigentes que quieras usar.' : 'Selecciona las fuentes que quieras usar en Fuentes e historial.';
  $('lifelong-memory-training-policy').textContent = state.lifelongMemoryTrainingBusy
    ? 'Registrando la solicitud. Espera a conocer su resultado antes de repetirla.'
    : lifelongMemoryTrainingAllowed()
      ? 'Disponible para crear un candidato con las fuentes que selecciones.'
      : accessReason(state.controlAccess?.learning?.reason);
  const steps = $('lifelong-memory-max-steps');
  const maximum = state.lifelongMemoryStatus?.training?.max_steps;
  if (Number.isSafeInteger(maximum) && maximum > 0) steps.max = String(maximum);
  else steps.removeAttribute('max');
  const defaultSteps = state.lifelongMemoryStatus?.training?.default_max_steps;
  if (!steps.value && Number.isSafeInteger(defaultSteps) && defaultSteps > 0
      && (!Number.isSafeInteger(maximum) || defaultSteps <= maximum)) steps.value = String(defaultSteps);
  $('lifelong-memory-sources').querySelectorAll('input[type="checkbox"]').forEach((box) => {
    const source = state.lifelongMemorySources.find((entry) => lifelongMemorySourceId(entry) === box.value);
    box.disabled = !allowed || !lifelongMemorySelectableSource(source) || state.lifelongMemorySourceMode !== 'archive';
  });
  if ($('lifelong-memory-canonical-mode')) $('lifelong-memory-canonical-mode').disabled = state.lifelongMemoryStatus?.training?.canonical_enabled !== true;
  $('lifelong-memory-canonical-sources')?.querySelectorAll('input[type="checkbox"]').forEach((box) => { box.disabled = !allowed || state.lifelongMemorySourceMode !== 'canonical'; });
}

function renderLifelongMemoryStatus(body) {
  const observed = body && typeof body === 'object' ? body : null;
  state.lifelongMemoryStatus = observed;
  const status = $('lifelong-memory-status');
  const available = observed?.enabled === true && observed?.available === true;
  status.classList.toggle('positive', available);
  status.textContent = !observed ? 'Estado no disponible'
    : observed.enabled === false ? 'Integración desactivada'
      : observed.available === false ? 'Lifelong Memory no disponible'
        : available ? 'Lifelong Memory disponible en SHEILY' : 'Disponibilidad sin verificar';
  $('lifelong-memory-summary').textContent = typeof observed?.error === 'string' && observed.error
    ? observed.error
    : available ? 'Fuentes, historial y trabajos de Lifelong Memory integrados en SHEILY.'
      : 'No se ha confirmado la disponibilidad del subsistema. Los recuerdos principales se consultan por separado.';
  $('lifelong-memory-source-count').textContent = lifelongMemoryCount(observed?.archive?.sources);
  $('lifelong-memory-turn-count').textContent = lifelongMemoryCount(observed?.archive?.turns);
  $('lifelong-memory-integrity').textContent = lifelongMemoryIntegrity(observed?.archive?.integrity);
  const authority = observed?.source_authority === 'sheily'
    ? 'SHEILY controla el acceso a estas fuentes.' : 'Autoridad de acceso sin verificar.';
  const standalone = observed?.standalone_ui === false
    ? 'La interfaz independiente está retirada.'
    : observed?.standalone_ui === true ? 'La interfaz independiente todavía está activa.'
      : 'La retirada de la interfaz independiente no está verificada.';
  $('lifelong-memory-integration-note').textContent = authority + ' ' + standalone;
  updateLifelongMemoryTrainingControls();
}

function renderLifelongMemorySources(sources) {
  const list = $('lifelong-memory-sources');
  list.replaceChildren();
  state.lifelongMemorySources = sources;
  const known = new Set(sources.map(lifelongMemorySourceId).filter(Boolean));
  state.lifelongMemorySelectedSources = state.lifelongMemorySelectedSources.filter((id) => known.has(id));
  const query = state.lifelongMemorySourceQuery.toLocaleLowerCase('es');
  for (const entry of sources.filter((source) => [source.label, source.source_id, source.kind].join(' ').toLocaleLowerCase('es').includes(query))) {
    const source = entry && typeof entry === 'object' ? entry : {};
    const id = lifelongMemorySourceId(source);
    const row = document.createElement('article');
    row.className = 'lifelong-memory-source';
    const select = document.createElement('input');
    select.type = 'checkbox';
    select.value = id;
    select.checked = state.lifelongMemorySelectedSources.includes(id);
    select.disabled = !lifelongMemorySelectableSource(source) || !lifelongMemoryTrainingAllowed() || state.lifelongMemoryTrainingBusy || state.lifelongMemorySourceMode !== 'archive';
    select.setAttribute('aria-label', 'Seleccionar para aprendizaje: ' + (source.label || id || 'Fuente sin identificador'));
    select.addEventListener('change', () => {
      if (!lifelongMemorySelectableSource(source) || !lifelongMemoryTrainingAllowed() || state.lifelongMemoryTrainingBusy || state.lifelongMemorySourceMode !== 'archive') {
        select.checked = state.lifelongMemorySelectedSources.includes(id);
        return;
      }
      state.lifelongMemorySelectedSources = select.checked
        ? Array.from(new Set([...state.lifelongMemorySelectedSources, id]))
        : state.lifelongMemorySelectedSources.filter((value) => value !== id);
      updateLifelongMemoryTrainingControls();
    });
    const copy = document.createElement('div');
    copy.className = 'lifelong-memory-source-copy';
    const title = document.createElement('h4');
    title.textContent = String(source.label || id || 'Fuente sin nombre');
    const details = document.createElement('p');
    const imported = source.integrity_verified === true && source.provenance === 'preserved_lifelong_archive'
      ? 'Original archivado verificado'
      : source.imported === true ? 'Importada a SHEILY'
        : source.imported === false ? 'Heredada de Lifelong Memory' : 'Procedencia sin verificar';
    const size = Number.isSafeInteger(source.bytes) && source.bytes >= 0
      ? lifelongMemoryCount(source.bytes) + ' bytes' : 'Tamaño no medido';
    details.textContent = imported + ' · ' + String(source.kind || 'Tipo sin indicar') + ' · ' + size;
    copy.append(title, details);
    const read = document.createElement('button');
    read.type = 'button';
    read.className = 'secondary-button';
    read.textContent = 'Leer íntegra';
    read.disabled = !id;
    read.addEventListener('click', () => loadLifelongMemorySource(id, read));
    row.append(select, copy, read);
    list.append(row);
  }
  updateLifelongMemoryTrainingControls();
}

function renderLifelongMemoryJobs(jobs) {
  const list = $('lifelong-memory-jobs');
  list.replaceChildren();
  for (const entry of jobs) {
    const job = entry && typeof entry === 'object' ? entry : {};
    const row = document.createElement('article');
    row.className = 'lifelong-memory-job';
    const title = document.createElement('h4');
    title.textContent = String(job.label || job.job_id || 'Trabajo sin identificador');
    const details = document.createElement('p');
    const status = String(job.status || 'Estado no comunicado');
    const uncertain = status === 'LAUNCH_UNCONFIRMED' || status === 'WORKER_NOT_OBSERVED';
    const label = status === 'LAUNCH_UNCONFIRMED' ? 'Lanzamiento sin confirmar'
      : status === 'WORKER_NOT_OBSERVED' ? 'Proceso sin confirmar' : status;
    const progress = Number.isSafeInteger(job.step) && job.step >= 0
      && Number.isSafeInteger(job.max_steps) && job.max_steps > 0
      ? (uncertain ? ' · Últimos pasos registrados: ' : ' · Pasos registrados: ')
        + job.step + '/' + job.max_steps : ' · Pasos no medidos';
    details.textContent = label + progress;
    row.append(title, details);
    if (uncertain) {
      const observation = document.createElement('p');
      observation.textContent = 'Última etapa registrada: '
        + String(job.persisted_status || 'No comunicada')
        + '. El proceso y su avance actual no están confirmados. Esta consulta no reintenta el trabajo ni activa el candidato.';
      row.append(observation);
    }
    const activation = document.createElement('p');
    activation.textContent = job.active === true ? 'Activación informada por el servicio.'
      : job.active === false ? 'Candidato sin activar.' : 'Activación no verificada.';
    row.append(activation);
    if (lifelongMemoryJobIdentity(job)) {
      const read = document.createElement('button'); read.type = 'button'; read.className = 'secondary-button';
      read.textContent = 'Ver detalle y evaluación';
      read.addEventListener('click', () => void openLifelongMemoryJob(job)); row.append(read);
    }
    list.append(row);
  }
}

async function loadLifelongMemoryPanel() {
  const requestId = ++state.lifelongMemoryRequestId;
  $('lifelong-memory-refresh').disabled = true;
  renderLifelongMemoryStatus(null);
  $('lifelong-memory-status').textContent = 'Consultando Lifelong Memory…';
  const results = await Promise.allSettled([
    apiRequest('/api/lifelong-memory/status'), apiRequest('/api/lifelong-memory/sources'), apiRequest('/api/lifelong-memory/jobs?namespace=all'), loadControlAccess(),
  ]);
  if (requestId !== state.lifelongMemoryRequestId) return;
  const [status, sources, jobs] = results;
  renderLifelongMemoryStatus(status.status === 'fulfilled' ? status.value : null);
  if (status.status === 'rejected') {
    $('lifelong-memory-summary').textContent = 'No se ha podido comprobar Lifelong Memory: ' + status.reason.message;
  }
  if (sources.status === 'fulfilled' && Array.isArray(sources.value.sources)) {
    renderLifelongMemorySources(sources.value.sources);
    $('lifelong-memory-sources-status').textContent = sources.value.sources.length
      ? sources.value.sources.length + ' fuentes en este listado.'
      : 'No hay fuentes disponibles en el ámbito consultado.';
  } else {
    renderLifelongMemorySources([]);
    $('lifelong-memory-sources-status').textContent = 'No se han podido consultar las fuentes. No se ha confirmado que estén vacías.';
  }
  if (jobs.status === 'fulfilled' && Array.isArray(jobs.value.jobs)) {
    renderLifelongMemoryJobs(jobs.value.jobs);
    $('lifelong-memory-jobs-status').textContent = jobs.value.jobs.length
      ? jobs.value.jobs.length + ' trabajos consultados. El estado mostrado procede del servicio.'
      : 'No hay trabajos en el ámbito consultado.';
  } else {
    renderLifelongMemoryJobs([]);
    $('lifelong-memory-jobs-status').textContent = 'No se han podido consultar los trabajos. No se ha confirmado que no existan.';
  }
  $('lifelong-memory-refresh').disabled = false;
  if (results.some((result) => result.status === 'rejected' && result.reason.code === 'AUTH_REQUIRED')) showAccess();
}

async function loadLifelongMemorySource(id, button) {
  if (!lifelongMemorySourceId({source_id: id})) return;
  const requestId = ++state.lifelongMemorySourceRequestId;
  button.disabled = true;
  button.textContent = 'Leyendo…';
  try {
    const body = await apiRequest('/api/lifelong-memory/source/' + encodeURIComponent(id));
    if (requestId !== state.lifelongMemorySourceRequestId) return;
    const source = body.source;
    if (!source || source.source_id !== id || typeof source.text !== 'string') {
      throw new Error('La fuente recibida no contiene el texto completo y la identidad solicitada.');
    }
    $('lifelong-memory-source-title').textContent = String(source.label || id);
    $('lifelong-memory-source-text').textContent = source.text;
    state.lifelongMemoryReadSource = {source_id: id, sha256: source.sha256, bytes: source.bytes};
    $('lifelong-memory-source-attach').disabled = state.lifelongMemoryAttachBusy || !lifelongMemoryAttachableSource(state.lifelongMemoryReadSource);
    const hash = typeof source.sha256 === 'string' && /^[a-fA-F0-9]{64}$/.test(source.sha256)
      ? ' · Huella registrada: ' + source.sha256 : ' · Huella no disponible';
    $('lifelong-memory-source-detail').textContent = String(source.kind || 'Fuente conservada') + hash;
    $('lifelong-memory-source-reader').hidden = false;
    $('lifelong-memory-source-reader').scrollIntoView?.({behavior: 'smooth', block: 'nearest'});
  } catch (error) {
    if (requestId === state.lifelongMemorySourceRequestId) {
      $('lifelong-memory-sources-status').textContent = 'No se ha podido leer la fuente: ' + error.message;
      if (error.code === 'AUTH_REQUIRED') showAccess();
    }
  } finally {
    button.disabled = false;
    button.textContent = 'Leer íntegra';
  }
}

function lifelongMemoryAttachableSource(source) {
  return Boolean(source && lifelongMemorySourceId(source) && /^[a-f0-9]{64}$/.test(source.sha256 || '')
    && Number.isSafeInteger(source.bytes) && source.bytes >= 0);
}

async function attachLifelongMemorySource() {
  const source = state.lifelongMemoryReadSource;
  const button = $('lifelong-memory-source-attach');
  if (!lifelongMemoryAttachableSource(source) || state.busy
      || !state.sessionId || !state.conversationId || state.lifelongMemoryAttachBusy) return;
  const scope = {sessionId: state.sessionId, conversationId: state.conversationId};
  state.lifelongMemoryAttachBusy = true;
  button.disabled = true;
  button.textContent = 'Guardando en la conversación…';
  try {
    const record = await apiRequest('/api/lifelong-memory/source/' + encodeURIComponent(source.source_id) + '/attach', {
      method: 'POST',
      body: JSON.stringify({session_id: scope.sessionId, conversation_id: scope.conversationId}),
    });
    if (!validStoredDocument(record) || record.sha256 !== source.sha256 || record.size_bytes !== source.bytes) {
      throw new Error('El recibo no coincide con la fuente que acabas de leer.');
    }
    if (state.sessionId !== scope.sessionId || state.conversationId !== scope.conversationId) {
      toast('Fuente guardada en la conversación de origen. Ábrela en Documentos para usarla.');
      return;
    }
    selectStoredDocumentForChat(record, scope);
  } catch (error) {
    $('lifelong-memory-sources-status').textContent = 'No se ha podido incorporar la fuente: ' + error.message;
    if (error.code === 'AUTH_REQUIRED') showAccess();
  } finally {
    state.lifelongMemoryAttachBusy = false;
    button.disabled = !lifelongMemoryAttachableSource(state.lifelongMemoryReadSource);
    button.textContent = 'Usar en esta conversación';
  }
}

function lifelongMemoryTrainingPayload() {
  if (!lifelongMemoryTrainingAllowed() || state.lifelongMemoryTrainingBusy) throw new Error('La creación de candidatos no está habilitada.');
  let selected;
  const maxSources = state.lifelongMemoryStatus.training.max_sources;
  if (state.lifelongMemorySourceMode === 'canonical') {
    const memory_sources = state.lifelongMemoryCanonicalSelected.map((ref) => ({memory_id: ref.memory_id, expected_revision: ref.expected_revision})).sort((a, b) => a.memory_id.localeCompare(b.memory_id));
    if (!canonicalTrainingAvailable() || !memory_sources.length || memory_sources.some((ref) => !state.notes.some((note) =>
      note.memory_id === ref.memory_id && note.revision === ref.expected_revision && note.is_current === true && note.lifecycle_status === 'ACTIVE'))) throw new Error('Consulta y selecciona al menos una nota vigente para entrenar.');
    if (Number.isSafeInteger(maxSources) && memory_sources.length > maxSources) throw new Error('La selección supera el límite de fuentes permitido.');
    selected = {memory_sources};
  } else {
    const known = new Set(state.lifelongMemorySources.filter(lifelongMemorySelectableSource).map(lifelongMemorySourceId));
    const source_ids = [...new Set(state.lifelongMemorySelectedSources)].sort();
    if (!source_ids.length || source_ids.some((id) => !known.has(id))) throw new Error('Selecciona al menos una fuente disponible.');
    if (Number.isSafeInteger(maxSources) && source_ids.length > maxSources) throw new Error('La selección supera el límite de fuentes permitido.');
    selected = {source_ids};
  }
  const train_question = $('lifelong-memory-train-question').value.trim();
  const expected_answer = $('lifelong-memory-expected-answer').value.trim();
  const validation_question = $('lifelong-memory-validation-question').value.trim();
  if (!train_question || !expected_answer || !validation_question) throw new Error('Completa las preguntas y la respuesta esperada.');
  const max_steps = Number($('lifelong-memory-max-steps').value);
  const maximum = state.lifelongMemoryStatus.training.max_steps;
  if (!Number.isSafeInteger(max_steps) || max_steps < 1
      || (Number.isSafeInteger(maximum) && max_steps > maximum)) throw new Error('Indica un límite de pasos válido para este servicio.');
  return {...selected, train_question, expected_answer, validation_question, max_steps};
}

async function submitLifelongMemoryTraining(event) {
  event.preventDefault();
  let payload;
  let trainingPath;
  try {
    payload = lifelongMemoryTrainingPayload();
    trainingPath = state.lifelongMemorySourceMode === 'canonical' ? '/api/lifelong-memory/train-canonical?' + personalScopeQuery() : '/api/lifelong-memory/train';
    const signature = JSON.stringify([trainingPath, payload]);
    if (state.lifelongMemoryTrainingRequest?.signature !== signature) {
      if (typeof globalThis.crypto?.randomUUID !== 'function') throw new Error('El navegador no permite crear un identificador seguro de solicitud.');
      state.lifelongMemoryTrainingRequest = {signature, requestId: globalThis.crypto.randomUUID()};
    }
    payload.request_id = state.lifelongMemoryTrainingRequest.requestId;
  } catch (error) { $('lifelong-memory-training-result').textContent = error.message; return; }
  state.lifelongMemoryTrainingBusy = true;
  updateLifelongMemoryTrainingControls();
  $('lifelong-memory-training-result').textContent = 'Enviando la solicitud…';
  try {
    const body = await apiRequest(trainingPath, {method: 'POST', body: JSON.stringify(payload)});
    if (body.ok !== true || typeof body.job_id !== 'string' || !body.job_id) {
      throw new Error('El servicio no devolvió un identificador de trabajo confirmado.');
    }
    $('lifelong-memory-training-result').textContent = 'Solicitud registrada: ' + body.job_id
      + '. Consulta su evaluación en Trabajos de aprendizaje. El candidato no se activa automáticamente.';
    await loadLifelongMemoryPanel();
  } catch (error) {
    $('lifelong-memory-training-result').textContent = 'No se ha confirmado el registro: ' + error.message
      + ' Actualiza los trabajos antes de repetir la solicitud.';
    if (error.code === 'AUTH_REQUIRED') showAccess();
  } finally {
    state.lifelongMemoryTrainingBusy = false;
    updateLifelongMemoryTrainingControls();
  }
}

async function loadMemoryStatus() {
  const status = $('memory-status');
  status.classList.remove('positive');
  status.innerHTML = '<i></i>Comprobando';
  $('memory-summary').textContent = 'Comprobando recuerdos guardados…';
  try {
    await loadMemories();
    status.classList.add('positive');
    status.innerHTML = '<i></i>Memoria disponible';
  } catch (error) {
    state.memories = [];
    renderMemoryList();
    status.innerHTML = '<i></i>No disponible';
    $('memory-summary').textContent = 'No se ha podido acceder a tus recuerdos. No se ha confirmado que la memoria esté vacía.';
    $('memory-empty').hidden = true;
    $('memory-load-more').hidden = true;
    $('memory-counts').textContent = '';
    if (error.code === 'AUTH_REQUIRED') showAccess();
    else toast(error.message);
  }
}

async function forgetMemory(record) {
  const id = memoryIdentifier(record);
  if (!id) return;
  const confirmed = await confirmAction(
    'Olvidar recuerdo',
    'SHEILY dejará de recuperar “' + memoryTitle(record) + '” y bloqueará los recuerdos que dependan de él. Se conservará únicamente la prueba técnica de que el olvido se aplicó.',
    'Olvidar recuerdo',
  );
  if (!confirmed) return;
  try {
    await apiRequest('/api/memories/' + encodeURIComponent(id), { method: 'DELETE' });
    await loadMemories();
    toast('Recuerdo olvidado. Ya no se utilizará en respuestas futuras.');
  } catch (error) {
    toast(error.message);
  }
}

async function exportMemory() {
  const button = $('export-memory');
  const status = $('memory-export-status');
  if (button.disabled) return;
  button.disabled = true;
  status.textContent = 'Leyendo el contenido completo desde la memoria canónica…';
  try {
    const body = await apiRequest('/api/memories/export');
    SheilyMemoryExport.validate(body);
    status.textContent = 'Preparando ' + body.count + ' recuerdos y comprobando los archivos…';
    const result = await SheilyMemoryExport.buildPackage(body);
    if (!state.authenticated) return;
    const date = body.exported_at.slice(0, 10);
    SheilyMemoryExport.download(result.bytes, 'memoria-sheily-' + date + '.zip', 'application/zip');
    status.textContent = 'Copia preparada: ' + body.count + ' recuerdos completos. Abre recuerdos.html dentro del ZIP para leerlos.';
    toast('Descarga preparada con contenido completo y lector sin conexión.');
  } catch (error) {
    status.textContent = 'No se ha exportado: ' + error.message;
    toast(error.message);
  } finally { button.disabled = false; }
}

async function loadPrivacyStatus() {
  const status = $('privacy-status');
  if (!status) return;
  status.classList.remove('positive');
  status.innerHTML = '<i></i>Comprobando';
  try {
    const body = await apiRequest('/api/privacy?session_id=' + encodeURIComponent(state.sessionId));
    const active = body.private_space_active === true && body.network_scope === 'LOOPBACK_ONLY';
    status.classList.toggle('positive', active);
    status.innerHTML = '<i></i>' + (active ? 'Privado activo' : 'Revisar exposición');
    if ($('privacy-detail')) {
      $('privacy-detail').textContent = active
        ? 'Acceso limitado a este ordenador, sesión en cookie protegida y ' + (Number.isSafeInteger(body.history?.conversation_count) ? body.history.conversation_count : 'un número no medido de') + ' conversaciones locales.'
        : 'El servidor informa de una exposición de red que requiere revisión.';
    }
    const network = $('telemetry-network-scope');
    if (network) {
      network.textContent = body.network_scope === 'LOOPBACK_ONLY'
        ? '127.0.0.1 (Loopback estricto)'
        : String(body.network_scope || 'Desconocido');
    }
    const conversations = $('telemetry-conv-count');
    if (conversations) {
      const count = body.history && body.history.conversation_count;
      conversations.textContent = Number.isSafeInteger(count) ? count + ' conversaciones' : 'Conversaciones no medidas';
    }
    const closure = $('telemetry-workspace-closure');
    if (closure) {
      try {
        const snapshot = await apiRequest('/api/workspace/closure');
        closure.textContent = snapshot.complete === true ? 'Cerrado' : 'Incompleto';
      } catch {
        closure.textContent = 'No verificable';
      }
    }
  } catch (error) {
    status.innerHTML = '<i></i>No verificable';
    if ($('privacy-detail')) $('privacy-detail').textContent = 'No se ha podido verificar el estado de privacidad.';
    if (error.code === 'AUTH_REQUIRED') showAccess();
  }
}

function validatePasscode8(raw) {
  const value = String(raw || '').trim();
  const len8 = value.length === 8;
  const alnum = /^[A-Za-z0-9]+$/.test(value);
  const hasLetter = /[A-Za-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  return {
    value,
    len8,
    alnum,
    hasLetter,
    hasDigit,
    valid: len8 && alnum && hasLetter && hasDigit,
  };
}

function updateVaultPinSlots(raw) {
  const check = validatePasscode8(raw);
  const container = $('vault-pin-slots');
  const input = $('vault-passcode-input');
  const isPlain = input ? input.type === 'text' : false;
  if (container) {
    const slots = container.querySelectorAll('span');
    const val = check.value;
    slots.forEach((slot, index) => {
      const hasChar = index < val.length;
      const isCurrent = index === val.length && val.length < 8;
      slot.classList.toggle('is-filled', hasChar);
      slot.classList.toggle('is-active', isCurrent);
      if (hasChar) {
        slot.textContent = isPlain ? val[index] : '•';
      } else {
        slot.textContent = '';
      }
    });
    container.classList.toggle('is-valid', check.valid);
  }
  const ruleLen = $('vault-rule-len');
  const ruleLetter = $('vault-rule-alpha');
  const ruleDigit = $('vault-rule-num');
  if (ruleLen) {
    ruleLen.classList.toggle('is-ok', check.len8 && check.alnum);
    ruleLen.innerHTML = '<i></i>8 caracteres exactos (' + check.value.length + '/8)';
  }
  if (ruleLetter) ruleLetter.classList.toggle('is-ok', check.hasLetter);
  if (ruleDigit) ruleDigit.classList.toggle('is-ok', check.hasDigit);
}

function updateSidebarVaultButton() {
  const btn = $('private-vault-trigger');
  const sub = $('vault-sidebar-subtitle');
  const pill = $('vault-sidebar-pill');
  if (!btn) return;
  btn.classList.toggle('is-unlocked', state.vaultUnlocked);
  if (sub) {
    if (!state.vaultStatusKnown) {
      sub.textContent = 'Consulta el estado de acceso';
    } else if (!state.vaultConfigured) {
      sub.textContent = 'Pulsa para crear tu clave de 8 caracteres';
    } else if (state.vaultUnlocked) {
      sub.textContent = state.vaultItems.length + (state.vaultItems.length === 1 ? ' elemento privado activo' : ' elementos privados activos');
    } else {
      sub.textContent = 'Protegido con clave alfanumérica (8)';
    }
  }
  if (pill) {
    pill.textContent = !state.vaultStatusKnown ? 'Verificar' : !state.vaultConfigured ? 'Configurar' : (state.vaultUnlocked ? 'Abierto' : 'Entrar');
  }
}

async function loadVaultStatus() {
  const requestId = ++state.vaultStatusRequestId;
  try {
    const body = await apiRequest('/api/vault/status');
    if (requestId !== state.vaultStatusRequestId) return null;
    if (typeof body.configured !== 'boolean' || typeof body.unlocked !== 'boolean') throw new Error('Estado privado no verificable.');
    state.vaultStatusKnown = true;
    state.vaultConfigured = body.configured;
    if (!body.unlocked) clearVaultSensitiveView();
    state.vaultUnlocked = body.unlocked;
    state.vaultPasscodeHint = body.passcode_hint || '';
    state.vaultUpdatedAt = body.updated_at || null;
    if ($('vault-autolock-badge')) $('vault-autolock-badge').textContent = Number.isSafeInteger(body.auto_lock_minutes) && body.auto_lock_minutes > 0
      ? 'Auto-bloqueo: ' + body.auto_lock_minutes + ' min' : 'Auto-bloqueo: sin verificar';
    scheduleVaultVisibilityExpiry(body);
    updateSidebarVaultButton();
    return body;
  } catch (error) {
    if (requestId !== state.vaultStatusRequestId) return null;
    state.vaultStatusKnown = false;
    clearVaultSensitiveView('No se pudo verificar el acceso privado: ' + error.message);
    return null;
  }
}

async function loadVaultView() {
  const status = await loadVaultStatus();
  const gate = $('vault-gate');
  const workspace = $('vault-workspace');
  if (!gate || !workspace) return;
  if (!status) {
    workspace.hidden = true; gate.hidden = false;
    $('vault-auth-submit').disabled = true;
    $('vault-gate-title').textContent = 'Acceso sin verificar';
    $('vault-gate-copy').textContent = 'No se ha podido comprobar la zona privada. Vuelve a abrir esta sección para reintentar.';
    return;
  }
  if ($('vault-auth-error')) $('vault-auth-error').textContent = '';
  $('vault-auth-submit').disabled = false;

  if (state.vaultConfigured && state.vaultUnlocked) {
    gate.hidden = true;
    workspace.hidden = false;
    await loadVaultItems();
    return;
  }

  workspace.hidden = true;
  gate.hidden = false;
  const input = $('vault-passcode-input');
  if (input) {
    input.value = '';
    updateVaultPinSlots('');
  }
  const hintWrap = $('vault-hint-field-wrap');
  const hintDisplay = $('vault-hint-display');
  if (!state.vaultConfigured) {
    if ($('vault-gate-eyebrow')) $('vault-gate-eyebrow').textContent = 'CREA TU CONTRASEÑA · 8 CARACTERES ALFANUMÉRICOS';
    if ($('vault-gate-title')) $('vault-gate-title').textContent = 'Configura tu Custodia Privada';
    if ($('vault-gate-copy')) {
      $('vault-gate-copy').innerHTML = 'Elige una contraseña de <strong>exactamente 8 caracteres combinando letras y números</strong> (ej: <code>Sheily26</code>). Aquí podrás custodiar fotos, vídeos, audios, contraseñas, webs, chats, apuntes y archivos con total soberanía.';
    }
    if ($('vault-auth-submit')) $('vault-auth-submit').textContent = 'Crear contraseña y abrir Custodia Privada';
    if (hintWrap) hintWrap.hidden = false;
    if (hintDisplay) hintDisplay.hidden = true;
  } else {
    if ($('vault-gate-eyebrow')) $('vault-gate-eyebrow').textContent = 'ESPACIO PERSONAL PROTEGIDO';
    if ($('vault-gate-title')) $('vault-gate-title').textContent = 'Desbloquear Custodia Privada';
    if ($('vault-gate-copy')) {
      const itemCount = status && (typeof status.item_count === 'number' ? status.item_count : status.total_items);
      const countText = typeof itemCount === 'number' && itemCount > 0
        ? 'Tu bóveda custodia <strong>' + itemCount + (itemCount === 1 ? ' elemento privado' : ' elementos privados') + '</strong> (' + formatFileSize(status.total_bytes || 0) + '). '
        : '';
      $('vault-gate-copy').innerHTML = countText + 'Introduce tu contraseña alfanumérica de <strong>exactamente 8 caracteres</strong> para entrar.';
    }
    if ($('vault-auth-submit')) $('vault-auth-submit').textContent = 'Desbloquear Custodia Privada';
    if (hintWrap) hintWrap.hidden = true;
    if (hintDisplay) {
      if (state.vaultPasscodeHint) {
        hintDisplay.hidden = false;
        hintDisplay.textContent = '💡 Pista de tu contraseña: ' + state.vaultPasscodeHint;
      } else {
        hintDisplay.hidden = true;
      }
    }
  }
  setTimeout(() => input?.focus(), 60);
}

async function handleVaultAuthSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();
  const input = $('vault-passcode-input');
  const errEl = $('vault-auth-error');
  const submit = $('vault-auth-submit');
  if (!input || !errEl) return;
  if (!state.vaultStatusKnown) { errEl.textContent = 'Verifica primero el estado de la zona privada.'; return; }
  errEl.textContent = '';
  const check = validatePasscode8(input.value);
  if (!check.valid) {
    errEl.textContent = 'La contraseña debe tener exactamente 8 caracteres alfanuméricos combinando letras y números (ej: Sheily26).';
    input.focus();
    return;
  }
  if (submit) submit.disabled = true;
  try {
    if (!state.vaultConfigured) {
      const hint = $('vault-passcode-hint-input')?.value.trim() || '';
      await apiRequest('/api/vault/setup', {
        method: 'POST',
        body: JSON.stringify({ passcode: check.value, hint }),
      });
      toast('🔐 Contraseña de 8 caracteres creada. Custodia Privada abierta.');
    } else {
      await apiRequest('/api/vault/unlock', {
        method: 'POST',
        body: JSON.stringify({ passcode: check.value }),
      });
      toast('🔓 Custodia Privada desbloqueada con éxito.');
    }
    // A renewed private session must not reuse observations or pending reads
    // made with the preceding cookie. Re-read its status before showing data.
    clearVaultSensitiveView();
    input.value = '';
    updateVaultPinSlots('');
    await loadVaultView();
  } catch (error) {
    errEl.textContent = error.message;
  } finally {
    if (submit) submit.disabled = !state.vaultStatusKnown;
  }
}

async function lockVault() {
  state.vaultStatusRequestId++;
  clearVaultSensitiveView();
  try {
    await apiRequest('/api/vault/lock', {method: 'POST', body: '{}'});
    if (state.view === 'vault') await loadVaultView();
    toast('Custodia Privada bloqueada.');
  } catch (error) {
    $('vault-auth-error').textContent = 'Contenido oculto. No se pudo confirmar el bloqueo del servidor: ' + error.message;
    toast('No se ha confirmado el bloqueo del servidor.');
  }
}

function vaultCategoryLabel(cat) {
  const map = {
    photo: 'Foto',
    video: 'Vídeo',
    audio: 'Audio',
    password: 'Contraseña',
    bookmark: 'Web / URL',
    chat: 'Chat privado',
    note: 'Apunte / Dato',
    file: 'Archivo',
  };
  return map[cat] || 'Archivo';
}

function vaultCategoryIcon(cat) {
  const map = {
    photo: '📸',
    video: '🎬',
    audio: '🎙️',
    password: '🔑',
    bookmark: '🌐',
    chat: '💬',
    note: '📝',
    file: '📦',
  };
  return map[cat] || '📦';
}

function resolveVaultContainerForFilename(fileName) {
  if (!fileName) return 'Archivos';
  const name = String(fileName).trim().toLowerCase();
  const containers = Array.isArray(state.vaultContainers) ? state.vaultContainers : [];
  const parts = name.split('.');
  if (parts.length > 2) {
    const compound = parts[parts.length - 2] + '.' + parts[parts.length - 1];
    for (const c of containers) {
      if (Array.isArray(c.extensions) && c.extensions.some((ext) => String(ext).toLowerCase().replace(/^\./, '') === compound)) {
        return c.name;
      }
    }
  }
  if (parts.length > 1) {
    const ext = parts[parts.length - 1];
    for (const c of containers) {
      if (Array.isArray(c.extensions) && c.extensions.some((extItem) => String(extItem).toLowerCase().replace(/^\./, '') === ext)) {
        return c.name;
      }
    }
  }
  const defaultC = containers.find((c) => c.is_default || c.name.toLowerCase() === 'archivos');
  return defaultC ? defaultC.name : 'Archivos';
}

function populateVaultContainersInDropdowns() {
  const containers = Array.isArray(state.vaultContainers) && state.vaultContainers.length > 0
    ? state.vaultContainers
    : [
        { id: 'archivos', name: 'Archivos', icon: '📁', is_default: true, description: 'Contenedor general y predeterminado.' },
        { id: 'diagramas', name: 'Diagramas', icon: '📊', extensions: ['drawio', 'mermaid', 'excalidraw', 'puml', 'vsdx', 'svg'] },
        { id: 'documentos', name: 'Documentos', icon: '📄', extensions: ['pdf', 'docx', 'xlsx', 'txt', 'md'] },
        { id: 'codigo', name: 'Código', icon: '💻', extensions: ['rs', 'py', 'js', 'ts', 'html', 'css', 'json'] },
        { id: 'multimedia', name: 'Multimedia', icon: '🎬', extensions: ['png', 'jpg', 'mp4', 'mp3'] },
        { id: 'credenciales', name: 'Credenciales', icon: '🔑', extensions: ['key', 'pem', 'env'] },
        { id: 'apuntes', name: 'Apuntes y Notas', icon: '📝', extensions: [] },
      ];

  const itemFolderSelect = $('vault-item-folder');
  if (itemFolderSelect) {
    const prevVal = itemFolderSelect.value;
    itemFolderSelect.replaceChildren();
    containers.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = (c.icon || '📁') + ' ' + c.name + (c.is_default ? ' (Predeterminado)' : '');
      itemFolderSelect.append(opt);
    });
    if (prevVal && containers.some((c) => c.name === prevVal)) {
      itemFolderSelect.value = prevVal;
    }
  }

  const filterSelect = $('vault-folder-filter');
  if (filterSelect) {
    const current = state.vaultFolder;
    filterSelect.replaceChildren();
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = '📁 Todas las carpetas';
    filterSelect.append(allOpt);
    containers.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = (c.icon || '📁') + ' ' + c.name;
      filterSelect.append(opt);
    });
    filterSelect.value = containers.some((c) => c.name === current) ? current : 'all';
    state.vaultFolder = filterSelect.value;
  }
}

async function loadVaultContainers() {
  try {
    const body = await apiRequest('/api/vault/containers');
    if (Array.isArray(body.containers)) {
      state.vaultContainers = body.containers;
      populateVaultContainersInDropdowns();
      renderVaultContainersList();
    }
  } catch (error) {
    clearVaultSensitiveView('No se pudieron verificar los contenedores privados: ' + error.message);
  }
}

function openVaultContainersModal() {
  const dialog = $('vault-containers-dialog');
  if (!dialog) return;
  resetVaultContainerForm();
  renderVaultContainersList();
  dialog.showModal();
}

function resetVaultContainerForm() {
  state.vaultEditingContainerId = '';
  if ($('vcontainer-id')) $('vcontainer-id').value = '';
  if ($('vcontainer-form-title')) $('vcontainer-form-title').textContent = 'Nuevo Contenedor';
  if ($('vcontainer-name')) $('vcontainer-name').value = '';
  if ($('vcontainer-icon')) $('vcontainer-icon').value = '📁';
  if ($('vcontainer-extensions')) $('vcontainer-extensions').value = '';
  if ($('vcontainer-description')) $('vcontainer-description').value = '';
  if ($('vcontainer-error')) $('vcontainer-error').textContent = '';
  if ($('vcontainer-submit-btn')) $('vcontainer-submit-btn').textContent = 'Guardar Contenedor';
}

function renderVaultContainersList() {
  const listEl = $('vault-containers-list');
  if (!listEl) return;
  listEl.replaceChildren();

  const containers = Array.isArray(state.vaultContainers) && state.vaultContainers.length > 0
    ? state.vaultContainers
    : [];

  if (containers.length === 0) {
    const empty = document.createElement('p');
    empty.style.fontSize = '12px';
    empty.style.color = 'var(--muted)';
    empty.textContent = 'No hay contenedores registrados.';
    listEl.append(empty);
    return;
  }

  containers.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'vault-container-card';

    const head = document.createElement('div');
    head.className = 'vault-container-card-head';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'vault-container-name';
    nameSpan.textContent = (c.icon || '📁') + ' ' + c.name;
    if (c.is_default) {
      const defBadge = document.createElement('span');
      defBadge.className = 'vault-ext-pill';
      defBadge.style.color = 'var(--forest-3, #34d399)';
      defBadge.textContent = 'Predeterminado';
      nameSpan.append(defBadge);
    }
    head.append(nameSpan);

    const btnGroup = document.createElement('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '4px';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'vault-mini-btn';
    editBtn.textContent = '✏️ Editar';
    editBtn.addEventListener('click', () => editVaultContainer(c));
    btnGroup.append(editBtn);

    if (!c.is_default && c.name.toLowerCase() !== 'archivos') {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'vault-mini-btn danger';
      delBtn.textContent = '🗑️';
      delBtn.title = 'Eliminar contenedor (sus archivos se moverán a Archivos)';
      delBtn.addEventListener('click', () => void deleteVaultContainer(c));
      btnGroup.append(delBtn);
    }

    head.append(btnGroup);
    card.append(head);

    if (c.description) {
      const desc = document.createElement('div');
      desc.className = 'vault-container-desc';
      desc.textContent = c.description;
      card.append(desc);
    }

    if (Array.isArray(c.extensions) && c.extensions.length > 0) {
      const extsWrap = document.createElement('div');
      extsWrap.className = 'vault-container-exts';
      c.extensions.forEach((ext) => {
        const pill = document.createElement('span');
        pill.className = 'vault-ext-pill';
        pill.textContent = '.' + ext;
        extsWrap.append(pill);
      });
      card.append(extsWrap);
    }

    listEl.append(card);
  });
}

function editVaultContainer(c) {
  state.vaultEditingContainerId = c.id;
  if ($('vcontainer-id')) $('vcontainer-id').value = c.id;
  if ($('vcontainer-form-title')) $('vcontainer-form-title').textContent = 'Editar Contenedor: ' + c.name;
  if ($('vcontainer-name')) $('vcontainer-name').value = c.name;
  if ($('vcontainer-icon')) $('vcontainer-icon').value = c.icon || '📁';
  if ($('vcontainer-extensions')) $('vcontainer-extensions').value = Array.isArray(c.extensions) ? c.extensions.join(', ') : '';
  if ($('vcontainer-description')) $('vcontainer-description').value = c.description || '';
  if ($('vcontainer-error')) $('vcontainer-error').textContent = '';
  if ($('vcontainer-submit-btn')) $('vcontainer-submit-btn').textContent = 'Actualizar Contenedor';
  $('vcontainer-name')?.focus();
}

async function handleVaultContainerFormSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();
  const errEl = $('vcontainer-error');
  const submitBtn = $('vcontainer-submit-btn');
  if (errEl) errEl.textContent = '';

  const id = state.vaultEditingContainerId;
  const name = $('vcontainer-name')?.value.trim() || '';
  const icon = $('vcontainer-icon')?.value.trim() || '📁';
  const extsRaw = $('vcontainer-extensions')?.value || '';
  const extensions = extsRaw
    .split(',')
    .map((e) => e.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
  const description = $('vcontainer-description')?.value.trim() || '';

  if (!name) {
    if (errEl) errEl.textContent = 'El nombre del contenedor es obligatorio.';
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  try {
    const payload = {
      name,
      icon,
      extensions,
      description,
    };
    if (id) {
      await apiRequest('/api/vault/containers/' + encodeURIComponent(id), {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast('✓ Contenedor “' + name + '” actualizado.');
    } else {
      await apiRequest('/api/vault/containers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast('✓ Contenedor “' + name + '” creado.');
    }
    resetVaultContainerForm();
    await loadVaultContainers();
    await loadVaultItems();
  } catch (error) {
    if (errEl) errEl.textContent = error.message;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function deleteVaultContainer(c) {
  const confirmed = await confirmAction(
    'Eliminar Contenedor',
    '¿Seguro que deseas eliminar el contenedor “' + c.name + '”? Todos los elementos guardados en él se trasladarán de forma segura al contenedor “Archivos”.',
    'Eliminar contenedor',
  );
  if (!confirmed) return;
  try {
    await apiRequest('/api/vault/containers/' + encodeURIComponent(c.id), {
      method: 'DELETE',
    });
    toast('🗑️ Contenedor eliminado. Elementos migrados a Archivos.');
    if (state.vaultEditingContainerId === c.id) {
      resetVaultContainerForm();
    }
    await loadVaultContainers();
    await loadVaultItems();
  } catch (error) {
    toast(error.message);
  }
}

async function loadVaultItems() {
  const generation = state.vaultReadGeneration;
  try {
    const body = await apiRequest('/api/vault/items');
    if (generation !== state.vaultReadGeneration || !state.vaultUnlocked) return;
    if (!Array.isArray(body.items)) throw new Error('No se ha recibido un listado privado válido.');
    state.vaultItems = body.items;
    if (Array.isArray(body.containers) && body.containers.length > 0) {
      state.vaultContainers = body.containers;
      populateVaultContainersInDropdowns();
    } else if (!state.vaultContainers || state.vaultContainers.length === 0) {
      await loadVaultContainers();
    }
    if (generation !== state.vaultReadGeneration || !state.vaultUnlocked) return;
    const counts = body.counts_by_category || {};
    const total = Number.isSafeInteger(body.total_items) ? body.total_items : state.vaultItems.length;
    const totalBytes = Number.isSafeInteger(body.total_bytes) ? body.total_bytes : null;
    const pinnedCount = state.vaultItems.filter((item) => item.pinned).length;
    const foldersSet = new Set(state.vaultItems.map((item) => item.folder || 'Archivos').filter(Boolean));

    if ($('vault-stat-total')) $('vault-stat-total').textContent = String(total);
    if ($('vault-stat-size')) $('vault-stat-size').textContent = totalBytes === null ? 'No medido' : formatFileSize(totalBytes);
    if ($('vault-stat-folders')) $('vault-stat-folders').textContent = String(state.vaultContainers.length || foldersSet.size);
    if ($('vault-stat-pinned')) $('vault-stat-pinned').textContent = String(pinnedCount);

    if ($('vcount-all')) $('vcount-all').textContent = String(total);
    for (const cat of ['photo', 'video', 'audio', 'password', 'bookmark', 'chat', 'note', 'file']) {
      const badge = $('vcount-' + cat);
      if (badge) badge.textContent = Number.isSafeInteger(counts[cat]) ? String(counts[cat]) : '—';
    }

    const folderSelect = $('vault-folder-filter');
    if (folderSelect) {
      const current = state.vaultFolder;
      folderSelect.replaceChildren();
      const allOpt = document.createElement('option');
      allOpt.value = 'all';
      allOpt.textContent = '📁 Todas las carpetas';
      folderSelect.append(allOpt);

      const containers = Array.isArray(state.vaultContainers) && state.vaultContainers.length > 0
        ? state.vaultContainers
        : Array.from(foldersSet).map((f) => ({ name: f, icon: '📁' }));

      containers.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = (c.icon || '📁') + ' ' + c.name;
        folderSelect.append(opt);
      });
      folderSelect.value = containers.some((c) => c.name === current) ? current : 'all';
      state.vaultFolder = folderSelect.value;
    }

    updateSidebarVaultButton();
    renderVaultItems();
    await loadVaultStatus();
  } catch (error) {
    if (generation !== state.vaultReadGeneration) return;
    clearVaultSensitiveView('No se pudo verificar el contenido privado: ' + error.message);
    if (error.code === 'AUTH_REQUIRED') showAccess();
  }
}

function renderVaultItems() {
  const grid = $('vault-items-grid');
  const empty = $('vault-empty');
  if (!grid || !empty) return;
  grid.classList.toggle('is-list', state.vaultLayout === 'list');
  grid.replaceChildren();

  const query = state.vaultQuery.toLocaleLowerCase('es');
  const filtered = state.vaultItems.filter((item) => {
    if (state.vaultCategory !== 'all' && item.category !== state.vaultCategory) return false;
    if (state.vaultFolder !== 'all' && item.folder !== state.vaultFolder) return false;
    if (state.vaultPinnedOnly && !item.pinned) return false;
    if (!query) return true;
    const haystack = [
      item.title,
      item.content,
      item.url,
      item.username,
      item.folder,
      item.file_name,
      ...(Array.isArray(item.tags) ? item.tags : []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('es');
    return haystack.includes(query);
  });

  filtered.sort((a, b) => {
    if (state.vaultSort === 'pinned' || state.vaultSort === 'pinned_first') {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at));
    }
    if (state.vaultSort === 'date_asc') {
      return String(a.created_at).localeCompare(String(b.created_at));
    }
    if (state.vaultSort === 'title_asc') {
      return String(a.title).localeCompare(String(b.title), 'es');
    }
    if (state.vaultSort === 'size_desc') {
      return (b.size_bytes || 0) - (a.size_bytes || 0);
    }
    return String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at));
  });

  if (filtered.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  filtered.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'vault-card' + (item.pinned ? ' is-pinned' : '');

    const top = document.createElement('div');
    top.className = 'vault-card-top';

    const badgeGroup = document.createElement('div');
    badgeGroup.style.display = 'flex';
    badgeGroup.style.flexWrap = 'wrap';
    badgeGroup.style.gap = '6px';
    badgeGroup.style.alignItems = 'center';

    const badge = document.createElement('span');
    badge.className = 'vault-cat-badge';
    badge.dataset.cat = item.category;
    badge.textContent = vaultCategoryIcon(item.category) + ' ' + vaultCategoryLabel(item.category);
    badgeGroup.append(badge);

    if (item.folder) {
      const folderBadge = document.createElement('span');
      folderBadge.className = 'vault-folder-badge';
      folderBadge.textContent = '📁 ' + item.folder;
      badgeGroup.append(folderBadge);
    }

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = 'vault-pin-btn' + (item.pinned ? ' is-pinned' : '');
    pinBtn.title = item.pinned ? 'Quitar fijación' : 'Fijar como favorito';
    pinBtn.textContent = item.pinned ? '📌' : '📍';
    pinBtn.addEventListener('click', () => void toggleVaultItemPin(item));

    top.append(badgeGroup, pinBtn);

    const title = document.createElement('h3');
    title.className = 'vault-card-title';
    title.textContent = item.title;
    title.style.cursor = 'pointer';
    title.title = 'Haz clic para ver este archivo';
    title.addEventListener('click', () => void openVaultItemPreview(item));

    const meta = document.createElement('div');
    meta.className = 'vault-card-meta';
    const dateSpan = document.createElement('span');
    dateSpan.textContent = '🗓️ ' + formatRelativeDate(item.updated_at || item.created_at);
    const sizeSpan = document.createElement('span');
    sizeSpan.textContent = '⚖️ ' + formatFileSize(item.size_bytes || 0);
    meta.append(dateSpan, sizeSpan);
    if (item.file_name) {
      const fileSpan = document.createElement('span');
      fileSpan.textContent = '📎 ' + compactText(item.file_name, 28);
      meta.append(fileSpan);
    }

    card.append(top, title, meta);

    const mediaUrl = '/api/vault/items/' + encodeURIComponent(item.id) + '/media';
    if (item.has_binary && (item.category === 'photo' || (item.mime_type && item.mime_type.startsWith('image/')))) {
      const mediaBox = document.createElement('div');
      mediaBox.className = 'vault-media-preview';
      const img = document.createElement('img');
      img.src = mediaUrl;
      img.alt = item.title;
      img.loading = 'lazy';
      img.style.cursor = 'pointer';
      img.title = 'Haz clic para ver en tamaño completo';
      img.addEventListener('click', () => void openVaultItemPreview(item));
      mediaBox.append(img);
      card.append(mediaBox);
    } else if (item.has_binary && (item.category === 'video' || (item.mime_type && item.mime_type.startsWith('video/')))) {
      const mediaBox = document.createElement('div');
      mediaBox.className = 'vault-media-preview';
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.controls = true;
      video.preload = 'metadata';
      mediaBox.append(video);
      card.append(mediaBox);
    } else if (item.has_binary && (item.category === 'audio' || (item.mime_type && item.mime_type.startsWith('audio/')))) {
      const mediaBox = document.createElement('div');
      mediaBox.className = 'vault-media-preview audio-preview';
      const audio = document.createElement('audio');
      audio.src = mediaUrl;
      audio.controls = true;
      audio.preload = 'metadata';
      mediaBox.append(audio);
      card.append(mediaBox);
    }

    if (item.category === 'password' || item.secret_value || item.username) {
      const secretBox = document.createElement('div');
      secretBox.className = 'vault-secret-box';
      if (item.username) {
        const userRow = document.createElement('div');
        userRow.className = 'vault-secret-row';
        const uLabel = document.createElement('span');
        uLabel.style.fontSize = '12px';
        uLabel.innerHTML = '👤 <strong>' + escapeHtml(item.username) + '</strong>';
        const copyUserBtn = document.createElement('button');
        copyUserBtn.type = 'button';
        copyUserBtn.className = 'vault-mini-btn';
        copyUserBtn.textContent = 'Copiar usuario';
        copyUserBtn.addEventListener('click', () => {
          void navigator.clipboard?.writeText(item.username);
          toast('Usuario copiado al portapapeles.');
        });
        userRow.append(uLabel, copyUserBtn);
        secretBox.append(userRow);
      }
      if (item.secret_value) {
        const passRow = document.createElement('div');
        passRow.className = 'vault-secret-row';
        const valSpan = document.createElement('span');
        valSpan.className = 'vault-secret-val';
        let revealed = false;
        valSpan.textContent = '••••••••••••';
        const btnWrap = document.createElement('div');
        btnWrap.style.display = 'flex';
        btnWrap.style.gap = '4px';
        const revealBtn = document.createElement('button');
        revealBtn.type = 'button';
        revealBtn.className = 'vault-mini-btn';
        revealBtn.textContent = 'Ver';
        revealBtn.addEventListener('click', () => {
          revealed = !revealed;
          valSpan.textContent = revealed ? item.secret_value : '••••••••••••';
          revealBtn.textContent = revealed ? 'Ocultar' : 'Ver';
        });
        const copyPassBtn = document.createElement('button');
        copyPassBtn.type = 'button';
        copyPassBtn.className = 'vault-mini-btn';
        copyPassBtn.textContent = 'Copiar clave';
        copyPassBtn.addEventListener('click', () => {
          void navigator.clipboard?.writeText(item.secret_value);
          toast('🔑 Contraseña copiada al portapapeles.');
        });
        btnWrap.append(revealBtn, copyPassBtn);
        passRow.append(valSpan, btnWrap);
        secretBox.append(passRow);
      }
      card.append(secretBox);
    }

    const safeUrl = safeExternalUrl(item.url);
    if (safeUrl) {
      const link = document.createElement('a');
      link.className = 'vault-bookmark-link';
      link.href = safeUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '🔗 ' + item.url;
      card.append(link);
    }

    if (item.content && item.content.trim()) {
      const body = document.createElement('div');
      body.className = 'vault-card-body';
      body.textContent = compactText(item.content, 360);
      card.append(body);
    }

    if (Array.isArray(item.tags) && item.tags.length > 0) {
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'vault-tags';
      item.tags.forEach((t) => {
        const tag = document.createElement('span');
        tag.className = 'vault-tag';
        tag.textContent = '#' + t;
        tagsWrap.append(tag);
      });
      card.append(tagsWrap);
    }

    const actions = document.createElement('div');
    actions.className = 'vault-card-actions';

    const sendChatBtn = document.createElement('button');
    sendChatBtn.type = 'button';
    sendChatBtn.className = 'vault-mini-btn primary';
    sendChatBtn.textContent = '↗ Enviar al Chat';
    sendChatBtn.title = 'Cargar este elemento privado en el chat con SHEILY';
    sendChatBtn.addEventListener('click', () => sendVaultItemToChat(item));

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'vault-mini-btn';
    editBtn.textContent = 'Editar / Organizar';
    editBtn.addEventListener('click', () => openVaultItemModal(item.category, item));

    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'vault-mini-btn';
    downloadBtn.textContent = 'Descargar';
    downloadBtn.addEventListener('click', () => downloadVaultItem(item));

    const previewBtn = document.createElement('button');
    previewBtn.type = 'button';
    previewBtn.className = 'vault-mini-btn preview-btn';
    previewBtn.textContent = '👁️ Ver archivo';
    previewBtn.title = 'Abrir vista previa completa de este archivo';
    previewBtn.addEventListener('click', () => void openVaultItemPreview(item));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'vault-mini-btn danger';
    delBtn.textContent = 'Borrar';
    delBtn.addEventListener('click', () => void deleteVaultItem(item));

    actions.append(previewBtn, sendChatBtn, editBtn, downloadBtn, delBtn);
    card.append(actions);
    grid.append(card);
  });
}

async function toggleVaultItemPin(item) {
  try {
    await apiRequest('/api/vault/items/' + encodeURIComponent(item.id), {
      method: 'PATCH',
      body: JSON.stringify({ pinned: !item.pinned }),
    });
    await loadVaultItems();
    toast(item.pinned ? 'Elemento desfijado.' : '📌 Elemento fijado en tu Custodia Privada.');
  } catch (error) {
    toast(error.message);
  }
}

async function sendVaultItemToChat(item) {
  try {
    const parts = ['[Elemento de mi Custodia Privada · ' + vaultCategoryLabel(item.category) + ': "' + item.title + '"]'];
    if (item.url) parts.push('URL: ' + item.url);
    if (item.username) parts.push('Usuario: ' + item.username);
    if (item.content) parts.push(item.content);
    const attachment = {
      name: item.file_name || (item.title.replace(/[^a-zA-Z0-9_-]/g, '_') + '.txt'),
      size: item.size_bytes || parts.join('\n').length,
      type: item.mime_type || 'text/plain',
      content: parts.join('\n\n'),
    };
    if (item.has_binary) {
      const response = await fetch('/api/vault/items/' + encodeURIComponent(item.id) + '/media', { credentials: 'same-origin' });
      if (!response.ok) {
        toast('No se ha podido leer el archivo privado.');
        return;
      }
      const blob = await response.blob();
      attachment.file = blob;
      attachment.size = blob.size;
      if (blob.type) attachment.type = blob.type;
    }
    state.attachments.push(attachment);
    renderAttachments();
    setView('chat');
    const input = $('message');
    if (input) {
      if (!input.value.trim()) {
        input.value = 'Analiza este elemento de mi Custodia Privada: ' + item.title;
      }
      resizeComposer();
      input.focus();
    }
    toast('↗ Elemento cargado en el chat con SHEILY.');
  } catch (error) {
    toast('No se ha podido cargar el elemento privado en el chat: ' + error.message);
  }
}

function downloadVaultItem(item) {
  if (item.has_binary) {
    const a = document.createElement('a');
    a.href = '/api/vault/items/' + encodeURIComponent(item.id) + '/media';
    a.download = item.file_name || (item.title + '.bin');
    document.body.append(a);
    a.click();
    a.remove();
    toast('Descargando archivo privado…');
    return;
  }
  const payload = {
    schema: 'shei.personal.vault_item/v1',
    exported_at: new Date().toISOString(),
    item,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'elemento-privado') + '.json';
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Elemento privado descargado.');
}

let vaultPreviewActiveItem = null;
let vaultPreviewActiveText = '';

function generateHexDump(bytes, maxBytes = 4096) {
  const len = Math.min(bytes.length, maxBytes);
  const lines = [];
  for (let i = 0; i < len; i += 16) {
    const offset = i.toString(16).padStart(8, '0');
    const chunk = bytes.slice(i, Math.min(i + 16, len));
    const hexParts = [];
    const asciiParts = [];
    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hexParts.push(b.toString(16).padStart(2, '0'));
        asciiParts.push(b >= 32 && b <= 126 ? String.fromCharCode(b) : '.');
      } else {
        hexParts.push('  ');
      }
    }
    const hexStr = hexParts.slice(0, 8).join(' ') + '  ' + hexParts.slice(8).join(' ');
    lines.push(
      '<span class="hex-offset">' + offset + '</span>' +
      '<span class="hex-bytes">' + hexStr + '</span>' +
      '<span class="hex-ascii">' + escapeHtml(asciiParts.join('')) + '</span>'
    );
  }
  if (bytes.length > maxBytes) {
    lines.push('<span class="hex-offset">...</span><span class="hex-bytes">Mostrando los primeros ' + formatFileSize(maxBytes) + ' de ' + formatFileSize(bytes.length) + '</span>');
  }
  return lines.join('\n');
}

function parseCsvRows(text, delimiter = ',') {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField);
      if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

function renderCsvViewer(text, delimiter = ',') {
  const container = document.createElement('div');
  container.className = 'vault-preview-table-wrap';

  const rows = parseCsvRows(text, delimiter);
  if (!rows.length) {
    const emptyP = document.createElement('p');
    emptyP.style.color = 'var(--muted)';
    emptyP.style.padding = '20px';
    emptyP.textContent = 'El archivo tabular está vacío.';
    container.append(emptyP);
    return container;
  }

  const searchBox = document.createElement('div');
  searchBox.style.marginBottom = '12px';
  searchBox.style.display = 'flex';
  searchBox.style.justifyContent = 'space-between';
  searchBox.style.alignItems = 'center';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = '🔍 Filtrar filas en tiempo real…';
  searchInput.className = 'settings-field';
  searchInput.style.maxWidth = '360px';
  searchInput.style.fontSize = '12px';
  searchInput.style.padding = '6px 12px';

  const countBadge = document.createElement('span');
  countBadge.style.fontSize = '11.5px';
  countBadge.style.color = 'var(--muted)';
  countBadge.textContent = 'Total: ' + (rows.length - 1) + ' registros (' + rows[0].length + ' columnas)';

  searchBox.append(searchInput, countBadge);
  container.append(searchBox);

  const table = document.createElement('table');
  table.className = 'vault-preview-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const headers = rows[0];
  headers.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement('tbody');
  const dataRows = rows.slice(1);

  const renderRows = (filter = '') => {
    tbody.replaceChildren();
    const query = filter.trim().toLowerCase();
    let shown = 0;
    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      if (query && !row.some((cell) => cell.toLowerCase().includes(query))) continue;
      const tr = document.createElement('tr');
      row.forEach((cell) => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.append(td);
      });
      tbody.append(tr);
      shown++;
      if (shown >= 250) {
        const trMore = document.createElement('tr');
        const tdMore = document.createElement('td');
        tdMore.colSpan = headers.length;
        tdMore.style.textAlign = 'center';
        tdMore.style.color = 'var(--muted)';
        tdMore.style.padding = '12px';
        tdMore.textContent = '… y ' + (dataRows.length - shown) + ' filas más (descarga el archivo para ver la hoja íntegra).';
        trMore.append(tdMore);
        tbody.append(trMore);
        break;
      }
    }
  };

  renderRows('');
  searchInput.addEventListener('input', (e) => renderRows(e.target.value));

  table.append(tbody);
  container.append(table);
  return container;
}

function renderStl3DViewer(arrayBuffer) {
  const wrap = document.createElement('div');
  wrap.className = 'vault-preview-3d-wrap';

  const canvas = document.createElement('canvas');
  canvas.className = 'vault-preview-3d-canvas';
  wrap.append(canvas);

  const hint = document.createElement('div');
  hint.style.position = 'absolute';
  hint.style.bottom = '24px';
  hint.style.background = 'rgba(0,0,0,0.6)';
  hint.style.color = '#fff';
  hint.style.padding = '4px 12px';
  hint.style.borderRadius = '20px';
  hint.style.fontSize = '11px';
  hint.style.pointerEvents = 'none';
  hint.textContent = '🖱️ Arrastra con el ratón para rotar el modelo en 3D';
  wrap.append(hint);

  setTimeout(() => {
    try {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      canvas.width = (rect.width || 600) * dpr;
      canvas.height = (rect.height || 500) * dpr;
      ctx.scale(dpr, dpr);

      const triangles = [];
      const dataView = new DataView(arrayBuffer);
      const isBinary = arrayBuffer.byteLength >= 84 && (84 + dataView.getUint32(80, true) * 50 === arrayBuffer.byteLength);

      if (isBinary) {
        const count = dataView.getUint32(80, true);
        const limit = Math.min(count, 12000);
        let offset = 84;
        for (let i = 0; i < limit; i++) {
          const v1 = [dataView.getFloat32(offset + 12, true), dataView.getFloat32(offset + 16, true), dataView.getFloat32(offset + 20, true)];
          const v2 = [dataView.getFloat32(offset + 24, true), dataView.getFloat32(offset + 28, true), dataView.getFloat32(offset + 32, true)];
          const v3 = [dataView.getFloat32(offset + 36, true), dataView.getFloat32(offset + 40, true), dataView.getFloat32(offset + 44, true)];
          triangles.push([v1, v2, v3]);
          offset += 50;
        }
      } else {
        const text = new TextDecoder().decode(arrayBuffer);
        const lines = text.split('\n');
        let currentTri = [];
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('vertex')) {
            const parts = trimmed.split(/\s+/).slice(1).map(Number);
            if (parts.length === 3) currentTri.push(parts);
            if (currentTri.length === 3) {
              triangles.push(currentTri);
              currentTri = [];
              if (triangles.length >= 12000) break;
            }
          }
        }
      }

      if (!triangles.length) {
        ctx.fillStyle = '#999';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Modelo 3D sin mallas reconocidas.', rect.width / 2, rect.height / 2);
        return;
      }

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
      triangles.forEach((t) => {
        t.forEach((v) => {
          minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
          minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
          minZ = Math.min(minZ, v[2]); maxZ = Math.max(maxZ, v[2]);
        });
      });
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const cz = (minZ + maxZ) / 2;
      const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
      const scale = ((Math.min(rect.width, rect.height) || 400) * 0.42) / maxDim;

      let rotX = -0.4;
      let rotY = 0.6;
      let dragging = false;
      let lastX = 0, lastY = 0;

      const draw = () => {
        const w = rect.width || 600;
        const h = rect.height || 500;
        ctx.clearRect(0, 0, w, h);

        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

        const projectedTriangles = triangles.map((t) => {
          const pts = t.map((v) => {
            const x = v[0] - cx;
            const y = v[1] - cy;
            const z = v[2] - cz;
            const x1 = x * cosY + z * sinY;
            const z1 = -x * sinY + z * cosY;
            const y2 = y * cosX - z1 * sinX;
            const z2 = y * sinX + z1 * cosX;
            return {
              x: w / 2 + x1 * scale,
              y: h / 2 - y2 * scale,
              z: z2,
            };
          });
          const avgZ = (pts[0].z + pts[1].z + pts[2].z) / 3;
          return { pts, avgZ };
        });

        projectedTriangles.sort((a, b) => a.avgZ - b.avgZ);

        projectedTriangles.forEach((item) => {
          const [p1, p2, p3] = item.pts;
          const normalZ = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
          if (normalZ <= 0) return;

          const intensity = Math.min(1, Math.max(0.18, normalZ / 800));
          const colVal = Math.floor(60 + intensity * 155);
          ctx.fillStyle = `rgb(${colVal - 10}, ${colVal + 15}, ${colVal + 30})`;
          ctx.strokeStyle = `rgba(16, 185, 129, 0.25)`;
          ctx.lineWidth = 0.5;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      };

      draw();

      canvas.addEventListener('pointerdown', (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        rotY += dx * 0.01;
        rotX += dy * 0.01;
        lastX = e.clientX;
        lastY = e.clientY;
        draw();
      });
      const endDrag = (e) => {
        if (dragging) {
          dragging = false;
          try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);
    } catch (_) {}
  }, 50);

  return wrap;
}

function renderCodeViewer(text, language = 'plaintext') {
  const container = document.createElement('div');
  container.className = 'vault-preview-code-container';

  const lines = text.split('\n');
  const gutter = document.createElement('div');
  gutter.className = 'vault-preview-gutter';
  const gutterNums = [];
  for (let i = 1; i <= lines.length; i++) {
    gutterNums.push(i);
  }
  gutter.textContent = gutterNums.join('\n');

  const contentPre = document.createElement('pre');
  contentPre.className = 'vault-preview-code-content';

  if (SheilyResults && typeof SheilyResults.highlight === 'function') {
    try {
      contentPre.innerHTML = SheilyResults.highlight(text, language);
    } catch (_) {
      contentPre.textContent = text;
    }
  } else {
    contentPre.textContent = text;
  }

  container.append(gutter, contentPre);
  return container;
}

function renderDrawioViewer(xmlText) {
  const wrap = document.createElement('div');
  wrap.className = 'vault-preview-diagram-wrap';

  let diagrams = [];
  let vertexCount = 0;
  let edgeCount = 0;
  const nodesList = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    diagrams = doc.querySelectorAll('diagram');
    const cells = doc.querySelectorAll('mxCell');
    cells.forEach((c) => {
      if (c.getAttribute('vertex') === '1') vertexCount++;
      if (c.getAttribute('edge') === '1') edgeCount++;
      const val = c.getAttribute('value');
      if (val && val.trim().length > 0 && val.trim().length < 50 && !val.includes('<') && nodesList.length < 16) {
        nodesList.push(val.trim());
      }
    });
  } catch (_) {}

  const card = document.createElement('div');
  card.className = 'vault-container-card';
  card.style.padding = '16px';
  card.style.background = 'var(--surface-soft, rgba(0,0,0,0.06))';

  const titleH3 = document.createElement('h3');
  titleH3.style.margin = '0 0 8px 0';
  titleH3.textContent = '📊 Diagrama Draw.io (Estructura de Arquitectura)';

  const infoP = document.createElement('p');
  infoP.style.margin = '0 0 12px 0';
  infoP.style.fontSize = '12px';
  infoP.style.color = 'var(--muted)';
  infoP.textContent = 'Páginas: ' + (diagrams.length || 1) + ' · Nodos de Arquitectura: ' + vertexCount + ' · Relaciones/Conexiones: ' + edgeCount;

  card.append(titleH3, infoP);

  if (nodesList.length > 0) {
    const nodesWrap = document.createElement('div');
    nodesWrap.style.display = 'flex';
    nodesWrap.style.flexWrap = 'wrap';
    nodesWrap.style.gap = '6px';
    nodesWrap.style.marginBottom = '14px';
    nodesList.forEach((n) => {
      const pill = document.createElement('span');
      pill.className = 'vault-ext-pill';
      pill.style.background = 'var(--surface)';
      pill.textContent = '🔹 ' + n;
      nodesWrap.append(pill);
    });
    card.append(nodesWrap);
  }

  wrap.append(card);

  const codeHeading = document.createElement('h4');
  codeHeading.style.margin = '10px 0 6px 0';
  codeHeading.style.fontSize = '13px';
  codeHeading.textContent = 'Estructura XML del Modelo:';
  wrap.append(codeHeading);

  const codeView = renderCodeViewer(xmlText, 'xml');
  wrap.append(codeView);

  return wrap;
}

async function openVaultItemPreview(item) {
  if (!state.vaultUnlocked) return;
  const generation = state.vaultReadGeneration;
  const dialog = $('vault-preview-dialog');
  if (!dialog) return;

  vaultPreviewActiveItem = item;
  vaultPreviewActiveText = '';

  const iconEl = $('vault-preview-icon');
  const titleEl = $('vault-preview-title');
  const metaEl = $('vault-preview-meta');
  const bodyEl = $('vault-preview-body');
  const toolbarEl = $('vault-preview-toolbar');
  const hashEl = $('vault-preview-hash');
  const statusEl = $('vault-preview-status');
  const downloadLink = $('vault-preview-download-link');

  if (iconEl) iconEl.textContent = vaultCategoryIcon(item.category);
  if (titleEl) titleEl.textContent = item.title || item.file_name || 'Archivo';

  if (metaEl) {
    metaEl.replaceChildren();
    if (item.folder) {
      const pill = document.createElement('span');
      pill.className = 'vault-ext-pill';
      pill.textContent = '📁 ' + item.folder;
      metaEl.append(pill);
    }
    const catPill = document.createElement('span');
    catPill.className = 'vault-ext-pill';
    catPill.textContent = vaultCategoryLabel(item.category);
    metaEl.append(catPill);

    const sizePill = document.createElement('span');
    sizePill.textContent = '⚖️ ' + formatFileSize(item.size_bytes || item.byte_size || 0);
    metaEl.append(sizePill);

    if (item.file_name) {
      const fnPill = document.createElement('span');
      fnPill.textContent = '📎 ' + item.file_name;
      metaEl.append(fnPill);
    }
  }

  if (hashEl) {
    hashEl.textContent = item.sha256 ? 'SHA-256: ' + item.sha256 : 'Custodiado en almacenamiento privado';
  }
  if (statusEl) {
    statusEl.textContent = 'Original de la zona privada';
  }

  const mediaUrl = '/api/vault/items/' + encodeURIComponent(item.id) + '/media';
  if (downloadLink) {
    downloadLink.href = mediaUrl + '?download=1';
    downloadLink.download = item.file_name || (item.title + '.bin');
  }

  if (toolbarEl) {
    toolbarEl.hidden = true;
    toolbarEl.replaceChildren();
  }

  if (bodyEl) {
    bodyEl.replaceChildren();
    const loading = document.createElement('div');
    loading.style.padding = '40px';
    loading.style.textAlign = 'center';
    loading.style.color = 'var(--muted)';
    loading.textContent = 'Cargando vista previa…';
    bodyEl.append(loading);
  }

  dialog.showModal();

  const fileName = (item.file_name || item.title || '').toLowerCase();
  const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
  const isImage = item.category === 'photo' || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'ico'].includes(ext) || (item.mime_type && item.mime_type.startsWith('image/'));
  const isVideo = item.category === 'video' || ['mp4', 'webm', 'mov', 'mkv'].includes(ext) || (item.mime_type && item.mime_type.startsWith('video/'));
  const isAudio = item.category === 'audio' || ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext) || (item.mime_type && item.mime_type.startsWith('audio/'));
  const isPdf = ext === 'pdf' || (item.mime_type && item.mime_type === 'application/pdf');

  // 1. PDF via native viewer iframe
  if (isPdf) {
    bodyEl.replaceChildren();
    const iframe = document.createElement('iframe');
    iframe.className = 'vault-preview-pdf';
    iframe.src = mediaUrl + '#toolbar=1';
    iframe.title = item.title;
    bodyEl.append(iframe);
    return;
  }

  // 2. Images
  if (isImage && ext !== 'svg') {
    bodyEl.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'vault-preview-image-wrap';
    const img = document.createElement('img');
    img.src = mediaUrl;
    img.alt = item.title;
    img.addEventListener('load', () => {
      if (statusEl) {
        statusEl.textContent = 'Dimensiones: ' + img.naturalWidth + ' × ' + img.naturalHeight + ' px';
      }
    });
    wrap.append(img);
    bodyEl.append(wrap);
    return;
  }

  // 3. Video
  if (isVideo) {
    bodyEl.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'vault-preview-media-player-wrap';
    const video = document.createElement('video');
    video.src = mediaUrl;
    video.controls = true;
    video.autoplay = false;
    wrap.append(video);
    bodyEl.append(wrap);
    return;
  }

  // 4. Audio
  if (isAudio) {
    bodyEl.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'vault-preview-media-player-wrap';
    const audio = document.createElement('audio');
    audio.src = mediaUrl;
    audio.controls = true;
    wrap.append(audio);
    bodyEl.append(wrap);
    return;
  }

  // 5. Fetch content for text / code / diagrams / tables / 3D / binary
  try {
    let rawText = item.text_content || item.content || '';
    let arrayBuffer = null;

    if (item.has_binary || item.has_blob || (!rawText && item.has_binary)) {
      const resp = await fetch(mediaUrl, {
        credentials: 'same-origin',
      });
      if (!resp.ok) throw new Error('No se pudo descargar el archivo privado (' + resp.status + ').');
      arrayBuffer = await resp.arrayBuffer();
      if (generation !== state.vaultReadGeneration || !state.vaultUnlocked || !dialog.open) return;
      try {
        rawText = new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer);
      } catch (_) {
        rawText = '';
      }
    }

    vaultPreviewActiveText = rawText;
    bodyEl.replaceChildren();

    // 5.1 3D STL models
    if (ext === 'stl' && arrayBuffer) {
      bodyEl.append(renderStl3DViewer(arrayBuffer));
      if (statusEl) statusEl.textContent = 'Modelo 3D STL (Renderizado interactivo en Canvas)';
      return;
    }

    // 5.2 CSV / TSV
    if (ext === 'csv' || ext === 'tsv' || (item.mime_type && item.mime_type.includes('csv'))) {
      const delim = ext === 'tsv' ? '\t' : (rawText.includes(';') && !rawText.includes(',') ? ';' : ',');
      bodyEl.append(renderCsvViewer(rawText, delim));
      return;
    }

    // 5.3 Draw.io diagram
    if (ext === 'drawio' || (rawText && (rawText.includes('<mxfile') || rawText.includes('<diagram')))) {
      bodyEl.append(renderDrawioViewer(rawText));
      return;
    }

    // 5.4 SVG
    if (ext === 'svg' || (item.mime_type && item.mime_type.includes('svg'))) {
      const wrap = document.createElement('div');
      wrap.className = 'vault-preview-diagram-wrap';
      const previewCard = document.createElement('div');
      previewCard.className = 'vault-preview-image-wrap';
      previewCard.style.minHeight = '320px';
      previewCard.style.maxHeight = '480px';
      const img = document.createElement('img');
      img.src = mediaUrl;
      previewCard.append(img);
      wrap.append(previewCard);

      const codeTitle = document.createElement('h4');
      codeTitle.style.margin = '10px 0 6px 0';
      codeTitle.textContent = 'Código Vectorial SVG:';
      wrap.append(codeTitle);
      wrap.append(renderCodeViewer(rawText, 'xml'));
      bodyEl.append(wrap);
      return;
    }

    // 5.5 Markdown
    if (ext === 'md' || (item.mime_type && item.mime_type.includes('markdown'))) {
      const wrap = document.createElement('div');
      wrap.style.padding = '24px 32px';
      wrap.style.lineHeight = '1.6';
      wrap.className = 'message-body';
      if (SheilyResults && typeof SheilyResults.renderMarkdown === 'function') {
        wrap.innerHTML = SheilyResults.renderMarkdown(rawText);
      } else {
        wrap.textContent = rawText;
      }
      bodyEl.append(wrap);
      return;
    }

    // 5.6 JSON
    if (ext === 'json' || (item.mime_type && item.mime_type.includes('json'))) {
      try {
        const parsed = JSON.parse(rawText);
        rawText = JSON.stringify(parsed, null, 2);
        vaultPreviewActiveText = rawText;
      } catch (_) {}
      bodyEl.append(renderCodeViewer(rawText, 'json'));
      return;
    }

    // 5.7 General text or source code
    if (rawText && rawText.length > 0) {
      const lang = ext || 'plaintext';
      bodyEl.append(renderCodeViewer(rawText, lang));
      if (statusEl) statusEl.textContent = 'Líneas: ' + rawText.split('\n').length + ' · Caracteres: ' + rawText.length;
      return;
    }

    // 5.8 Arbitrary binary format (Hex Dump)
    if (arrayBuffer && arrayBuffer.byteLength > 0) {
      const bytes = new Uint8Array(arrayBuffer);
      const pre = document.createElement('pre');
      pre.className = 'vault-preview-hexdump';
      pre.innerHTML = generateHexDump(bytes, 4096);
      bodyEl.append(pre);
      if (statusEl) statusEl.textContent = 'Inspección Binaria Hexadecimal · ' + formatFileSize(bytes.length);
      return;
    }

    // Fallback: empty
    const emptyP = document.createElement('p');
    emptyP.style.color = 'var(--muted)';
    emptyP.style.padding = '30px';
    emptyP.textContent = 'No hay contenido para previsualizar en este elemento.';
    bodyEl.append(emptyP);

  } catch (err) {
    if (generation !== state.vaultReadGeneration || !state.vaultUnlocked || !dialog.open) return;
    bodyEl.replaceChildren();
    const errP = document.createElement('p');
    errP.className = 'form-error';
    errP.style.padding = '20px';
    errP.textContent = 'Error al previsualizar archivo: ' + err.message;
    bodyEl.append(errP);
  }
}

async function deleteVaultItem(item) {
  const confirmed = await confirmAction(
    'Borrar de Custodia Privada',
    '¿Seguro que deseas eliminar permanentemente “' + item.title + '” de tu Custodia Privada? Esta acción borrará también cualquier archivo adjunto en disco.',
    'Borrar permanentemente',
  );
  if (!confirmed) return;
  try {
    await apiRequest('/api/vault/items/' + encodeURIComponent(item.id), { method: 'DELETE' });
    await loadVaultItems();
    toast('🗑️ Elemento eliminado de Custodia Privada.');
  } catch (error) {
    toast(error.message);
  }
}

function updateVaultModalFieldsForCategory(category) {
  const urlField = $('vault-url-field');
  const credFields = $('vault-credentials-fields');
  const fileField = $('vault-file-field');
  if (urlField) urlField.hidden = !['bookmark', 'password', 'note'].includes(category);
  if (credFields) credFields.hidden = category !== 'password';
  if (fileField) fileField.hidden = ['password', 'bookmark'].includes(category);
}

function openVaultItemModal(defaultCategory = 'note', existingItem = null) {
  const dialog = $('vault-item-dialog');
  if (!dialog) return;
  state.vaultEditingId = existingItem ? existingItem.id : '';
  state.vaultPendingFile = null;
  if ($('vault-item-error')) $('vault-item-error').textContent = '';
  const cat = existingItem ? (existingItem.category || existingItem.kind) : (defaultCategory === 'all' ? 'note' : defaultCategory);

  populateVaultContainersInDropdowns();

  if ($('vault-dialog-title')) {
    $('vault-dialog-title').textContent = existingItem
      ? 'Editar / Organizar en Custodia Privada'
      : 'Nuevo elemento';
  }
  if ($('vault-item-id')) $('vault-item-id').value = existingItem ? existingItem.id : '';
  if ($('vault-item-kind')) $('vault-item-kind').value = cat;

  const defaultFolder = state.vaultFolder !== 'all' ? state.vaultFolder : 'Archivos';
  if ($('vault-item-folder')) {
    $('vault-item-folder').value = existingItem ? (existingItem.folder || 'Archivos') : defaultFolder;
  }
  if ($('vault-item-title')) $('vault-item-title').value = existingItem ? (existingItem.title || '') : '';
  if ($('vault-item-sensitivity')) $('vault-item-sensitivity').value = existingItem?.sensitivity || 'confidencial';
  if ($('vault-item-memory-policy')) $('vault-item-memory-policy').value = existingItem?.memory_policy || 'no_memoria_no_aprendizaje';
  if ($('vault-item-url')) $('vault-item-url').value = existingItem ? (existingItem.url || '') : '';
  if ($('vault-item-username')) $('vault-item-username').value = existingItem ? (existingItem.username || '') : '';
  if ($('vault-item-secret')) $('vault-item-secret').value = existingItem ? (existingItem.secret_value || '') : '';
  if ($('vault-item-text')) $('vault-item-text').value = existingItem ? (existingItem.content || existingItem.text_content || '') : '';
  if ($('vault-item-tags')) {
    $('vault-item-tags').value = existingItem && Array.isArray(existingItem.tags)
      ? existingItem.tags.join(', ')
      : '';
  }
  if ($('vault-item-pinned')) $('vault-item-pinned').checked = existingItem ? Boolean(existingItem.pinned) : false;
  if ($('vault-item-file')) $('vault-item-file').value = '';
  if ($('vault-file-picked-label')) {
    const size = existingItem ? (existingItem.size_bytes || existingItem.byte_size || 0) : 0;
    $('vault-file-picked-label').textContent = existingItem && existingItem.file_name
      ? 'Archivo actual: ' + existingItem.file_name + ' (' + formatFileSize(size) + ') · Selecciona otro para reemplazarlo'
      : '';
  }

  updateVaultModalFieldsForCategory(cat);
  dialog.showModal();
  setTimeout(() => $('vault-item-title')?.focus(), 30);
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function inferVaultCategoryFromFile(file) {
  const mime = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|avif|bmp)$/.test(name)) return 'photo';
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/.test(name)) return 'video';
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/.test(name)) return 'audio';
  if (/\.(md|txt)$/.test(name)) return 'note';
  return 'file';
}

async function handleVaultModalSubmit(event) {
  event.preventDefault();
  const errEl = $('vault-item-error');
  const submit = $('vault-item-submit');
  if (errEl) errEl.textContent = '';

  const category = $('vault-item-kind')?.value || 'file';
  let folder = $('vault-item-folder')?.value.trim() || 'Archivos';
  if (folder === 'all') folder = 'Archivos';
  const title = $('vault-item-title')?.value.trim() || '';
  const url = $('vault-item-url')?.value.trim() || '';
  const username = $('vault-item-username')?.value.trim() || '';
  const secretValue = $('vault-item-secret')?.value || '';
  const content = $('vault-item-text')?.value || '';
  const tagsRaw = $('vault-item-tags')?.value || '';
  const tags = tagsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const pinned = Boolean($('vault-item-pinned')?.checked);
  const sensitivity = $('vault-item-sensitivity')?.value || 'confidencial';
  const memoryPolicy = $('vault-item-memory-policy')?.value || 'no_memoria_no_aprendizaje';

  if (!title) {
    if (errEl) errEl.textContent = 'Escribe un título identificativo.';
    return;
  }

  if (submit) submit.disabled = true;
  try {
    const payload = {
      kind: category,
      category,
      folder: folder || 'Archivos',
      title,
      url,
      username,
      secret_value: secretValue,
      content,
      text_content: content,
      tags,
      pinned,
      sensitivity,
      memory_policy: memoryPolicy,
    };

    if (state.vaultPendingFile) {
      const b64 = await readFileAsBase64(state.vaultPendingFile);
      payload.data_base64 = b64;
      payload.file_name = state.vaultPendingFile.name;
      payload.mime_type = state.vaultPendingFile.type || 'application/octet-stream';
      if (!folder || folder === 'Archivos') {
        payload.folder = resolveVaultContainerForFilename(state.vaultPendingFile.name);
      }
    }

    if (state.vaultEditingId) {
      await apiRequest('/api/vault/items/' + encodeURIComponent(state.vaultEditingId), {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast('✓ Elemento actualizado en tu Custodia Privada.');
    } else {
      await apiRequest('/api/vault/items', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast('🔒 Guardado en tu Custodia Privada.');
    }

    $('vault-item-dialog')?.close();
    await loadVaultItems();
  } catch (error) {
    if (errEl) errEl.textContent = error.message;
  } finally {
    if (submit) submit.disabled = false;
  }
}

async function handleVaultQuickFiles(fileList) {
  if (!fileList || !fileList.length) return;
  let uploaded = 0;
  for (const file of fileList) {
    try {
      const category = inferVaultCategoryFromFile(file);
      const folder = state.vaultFolder !== 'all' ? state.vaultFolder : resolveVaultContainerForFilename(file.name);
      const b64 = await readFileAsBase64(file);
      await apiRequest('/api/vault/items', {
        method: 'POST',
        body: JSON.stringify({
          kind: category,
          category,
          folder: folder || 'Archivos',
          title: file.name,
          content: 'Archivo subido directamente a Custodia Privada (' + formatFileSize(file.size) + ').',
          text_content: 'Archivo subido directamente a Custodia Privada (' + formatFileSize(file.size) + ').',
          file_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          data_base64: b64,
          tags: [category, folder.toLowerCase()],
          pinned: false,
          sensitivity: 'confidencial',
          memory_policy: 'no_memoria_no_aprendizaje',
        }),
      });
      uploaded++;
    } catch (error) {
      toast('Error al subir ' + file.name + ': ' + error.message);
    }
  }
  if (uploaded > 0) {
    await loadVaultItems();
    toast('🔒 ' + uploaded + (uploaded === 1 ? ' archivo guardado' : ' archivos guardados') + ' en Custodia Privada.');
  }
}

async function toggleVaultAudioRecording() {
  if (!state.vaultUnlocked) return;
  const generation = state.vaultReadGeneration;
  const btn = $('vault-record-audio-btn');
  if (!btn) return;
  if (state.vaultRecording) {
    state.vaultRecording = false;
    btn.textContent = '🎙️ Grabar nota de voz';
    if (state.vaultMediaRecorder) {
      try { state.vaultMediaRecorder.stop(); } catch {}
    }
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast('Tu navegador no permite grabar audio desde el micrófono.');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!state.vaultUnlocked || generation !== state.vaultReadGeneration) { stream.getTracks().forEach((track) => track.stop()); return; }
    state.vaultDiscardRecording = false;
    state.vaultAudioChunks = [];
    const recorder = new MediaRecorder(stream);
    state.vaultMediaRecorder = recorder;
    state.vaultRecording = true;
    btn.textContent = '⏹️ Detener y guardar audio';
    toast('🎙️ Grabando nota de voz privada… Pulsa de nuevo para guardar.');
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) state.vaultAudioChunks.push(e.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (state.vaultDiscardRecording || !state.vaultUnlocked || generation !== state.vaultReadGeneration) { state.vaultAudioChunks = []; return; }
      const blob = new Blob(state.vaultAudioChunks, { type: 'audio/webm' });
      state.vaultAudioChunks = [];
      if (blob.size < 400) return;
      const stamp = new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/:/g, '-');
      const file = new File([blob], 'audio-privado-' + stamp + '.webm', { type: 'audio/webm' });
      try {
        const b64 = await readFileAsBase64(file);
        if (!state.vaultUnlocked || generation !== state.vaultReadGeneration) return;
        await apiRequest('/api/vault/items', {
          method: 'POST',
          body: JSON.stringify({
            category: 'audio',
            folder: 'Notas de voz',
            title: 'Grabación de voz · ' + stamp,
            content: 'Nota de voz grabada directamente en Custodia Privada.',
            file_name: file.name,
            mime_type: 'audio/webm',
            data_base64: b64,
            tags: ['audio', 'voz'],
            pinned: false,
          }),
        });
        await loadVaultItems();
        toast('🎙️ Nota de voz guardada en tu Custodia Privada.');
      } catch (error) {
        toast(error.message);
      }
    };
    recorder.start();
  } catch {
    toast('No se pudo acceder al micrófono para grabar.');
  }
}

async function quickSaveMessageToVault(text) {
  await loadVaultStatus();
  if (!state.vaultConfigured || !state.vaultUnlocked) {
    toast('Desbloquea primero tu Custodia Privada con tu clave de 8 caracteres.');
    setView('vault');
    return;
  }
  try {
    await apiRequest('/api/vault/items', {
      method: 'POST',
      body: JSON.stringify({
        category: 'chat',
        folder: 'Chats de SHEILY',
        title: compactText(state.conversationTitle + ' · ' + text, 68),
        content: text,
        tags: ['chat', 'sheily'],
        pinned: false,
      }),
    });
    await loadVaultStatus();
    toast('🔒 Mensaje guardado en tu Custodia Privada.');
  } catch (error) {
    toast(error.message);
  }
}

async function saveConversationToVault(item) {
  await loadVaultStatus();
  if (!state.vaultConfigured || !state.vaultUnlocked) {
    toast('Desbloquea primero tu Custodia Privada con tu clave de 8 caracteres.');
    setView('vault');
    return;
  }
  try {
    const body = await apiRequest(
      '/api/conversations/' + encodeURIComponent(item.conversation_id) +
      '?session_id=' + encodeURIComponent(state.sessionId),
    );
    const conv = body.conversation || {};
    const transcript = Array.isArray(conv.messages)
      ? conv.messages.map((m) => (m.role === 'user' ? '👤 Tú: ' : '🤖 SHEILY: ') + m.content).join('\n\n---\n\n')
      : (item.preview || '');
    await apiRequest('/api/vault/items', {
      method: 'POST',
      body: JSON.stringify({
        category: 'chat',
        folder: 'Conversaciones Completas',
        title: conv.title || item.title || 'Conversación privada',
        content: transcript,
        tags: ['conversacion', 'historial'],
        pinned: true,
      }),
    });
    await loadVaultStatus();
    toast('🔒 Conversación completa guardada en tu Custodia Privada.');
  } catch (error) {
    toast(error.message);
  }
}

async function exportVaultBackup() {
  await loadVaultStatus();
  if (!state.vaultConfigured || !state.vaultUnlocked) {
    toast('Debes desbloquear Custodia Privada antes de exportar su copia.');
    setView('vault');
    return;
  }
  try {
    await downloadJson('/api/vault/export', 'espacio-privado-sheily.json');
    toast('📦 Copia completa de Custodia Privada exportada.');
  } catch (error) {
    toast(error.message);
  }
}

// ---------------------------------------------------------------------------
// Settings View ("Ajustes y Control del Espacio")
// ---------------------------------------------------------------------------

function applyPersonalSettingsToDOM(settings) {
  if (!settings || typeof settings !== 'object') return;
  state.personalSettings = settings;

  // Theme
  if (settings.theme === 'dark' || settings.theme === 'light') {
    document.documentElement.dataset.theme = settings.theme;
    storageSet('sheily.ui.theme', settings.theme);
  } else if (settings.theme === 'system' && typeof matchMedia === 'function') {
    document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Density & Font Scale
  document.body.dataset.density = settings.ui_density || 'comfortable';
  document.body.dataset.fontScale = settings.font_scale || 'normal';

  // Cognitive Mode
  if (settings.cognitive_mode) {
    state.cognitiveMode = settings.cognitive_mode;
    storageSet('sheily.ui.cognitive_mode', state.cognitiveMode);
    if ($('cognitive-mode')) $('cognitive-mode').value = state.cognitiveMode;
  }

  // Update sidebar profile button with owner name & role
  const profileBtn = document.querySelector('#sidebar .profile-button');
  if (profileBtn) {
    const avatar = profileBtn.querySelector('.avatar');
    const nameStrong = profileBtn.querySelector('strong');
    const roleSmall = profileBtn.querySelector('small');
    const name = String(settings.display_name || 'Propietario').trim() || 'Propietario';
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
    if (nameStrong) nameStrong.textContent = name;
    if (roleSmall) roleSmall.textContent = settings.role_label || 'Ajustes y privacidad';
  }

  // Populate settings inputs if present
  if ($('setting-display-name')) $('setting-display-name').value = settings.display_name || '';
  if ($('setting-email-hint')) $('setting-email-hint').value = settings.email_hint || '';
  if ($('setting-role-label')) $('setting-role-label').value = settings.role_label || '';
  if ($('setting-language')) $('setting-language').value = settings.language || 'es';
  if ($('setting-vault-autolock')) $('setting-vault-autolock').value = String(settings.private_vault_auto_lock_minutes ?? 15);
  if ($('setting-cognitive-mode')) $('setting-cognitive-mode').value = settings.cognitive_mode || 'balanced';
  if ($('setting-response-style')) $('setting-response-style').value = settings.response_style || 'balanced';
  if ($('setting-voice-autoplay')) $('setting-voice-autoplay').checked = Boolean(settings.voice_tts_autoplay);
  storageSet('sheily.voice.autoplay', String(Boolean(settings.voice_tts_autoplay)));
  if ($('setting-voice-dictation')) $('setting-voice-dictation').checked = settings.voice_dictation_enabled !== false;
  const mic = $('voice-input-button');
  if (mic) mic.hidden = settings.voice_dictation_enabled === false;
  if ($('setting-theme')) $('setting-theme').value = settings.theme || 'system';
  if ($('setting-ui-density')) $('setting-ui-density').value = settings.ui_density || 'comfortable';
  if ($('setting-font-scale')) $('setting-font-scale').value = settings.font_scale || 'normal';
  if ($('setting-private-chat-shortcut')) $('setting-private-chat-shortcut').checked = settings.private_chat_shortcut !== false;
  if ($('settings-owner-heading')) $('settings-owner-heading').textContent = settings.display_name || '';
  if ($('settings-owner-subheading')) $('settings-owner-subheading').textContent = settings.role_label || '';
  if ($('settings-avatar-preview')) $('settings-avatar-preview').textContent = String(settings.display_name || '').charAt(0).toUpperCase();
}

async function loadPersonalSettings() {
  try {
    const body = await apiRequest('/api/settings');
    if (body.settings) {
      applyPersonalSettingsToDOM(body.settings);
    }
  } catch {
    // Non-fatal during initial load
  }
}

async function loadSettingsView() {
  await Promise.all([
    loadPrivacyStatus(),
    loadPersonalSettings(),
    loadVaultStatus(),
  ]);

  const pill = $('settings-vault-pill');
  const currentWrap = $('setting-current-passcode-wrap');
  if (pill) {
    pill.classList.toggle('positive', state.vaultConfigured);
    pill.innerHTML = '<i></i>' + (
      !state.vaultConfigured
        ? 'Sin clave (configúrala aquí)'
        : (state.vaultUnlocked ? 'Configurado · Abierto' : 'Configurado · Protegido (8 chars)')
    );
  }
  if (currentWrap) {
    currentWrap.hidden = !state.vaultConfigured;
  }
  if ($('setting-vault-hint')) {
    $('setting-vault-hint').value = state.vaultPasscodeHint || '';
  }
  const vaultCount = $('telemetry-vault-count');
  if (vaultCount) {
    vaultCount.textContent = state.vaultConfigured
      ? 'Activa · ' + state.vaultItems.length + ' elementos'
      : 'Pendiente de clave';
  }
}

// The persisted Rust PersonalSettings schema is the only authority for
// settings. Save a complete round-trip of that object, not an incompatible
// collection of earlier UI aliases or an invented owner identity.
function personalSettingsPayloadFromForm(current) {
  if (!current || current.schema !== 'shei.console.personal_settings/v1') {
    throw new Error('No están disponibles los Ajustes guardados de este espacio.');
  }
  const selected = (id, fallback) => $(id)?.value ?? fallback;
  const checked = (id, fallback) => $(id)?.checked ?? fallback;
  const displayName = String(selected('setting-display-name', current.display_name)).trim();
  if (!displayName) {
    throw new Error('Introduce un nombre visible en Ajustes.');
  }
  const rawAutolock = Number.parseInt(selected('setting-vault-autolock', current.private_vault_auto_lock_minutes), 10);
  const autoLock = Number.isInteger(rawAutolock) && rawAutolock >= 1 && rawAutolock <= 240
    ? rawAutolock : current.private_vault_auto_lock_minutes;
  return {
    ...current,
    display_name: displayName,
    role_label: String(selected('setting-role-label', current.role_label)).trim(),
    email_hint: String(selected('setting-email-hint', current.email_hint)).trim(),
    language: selected('setting-language', current.language),
    theme: selected('setting-theme', current.theme),
    ui_density: selected('setting-ui-density', current.ui_density),
    font_scale: selected('setting-font-scale', current.font_scale),
    cognitive_mode: selected('setting-cognitive-mode', current.cognitive_mode),
    response_style: selected('setting-response-style', current.response_style),
    voice_tts_autoplay: checked('setting-voice-autoplay', current.voice_tts_autoplay),
    voice_dictation_enabled: checked('setting-voice-dictation', current.voice_dictation_enabled),
    memory_auto_context: current.memory_auto_context,
    citation_strict_mode: current.citation_strict_mode,
    private_chat_shortcut: checked('setting-private-chat-shortcut', current.private_chat_shortcut),
    private_vault_auto_lock_minutes: autoLock,
  };
}

async function savePersonalSettingsFromForm() {
  const statusEl = $('settings-save-status');
  try {
    if (!state.personalSettings) await loadPersonalSettings();
    const payload = personalSettingsPayloadFromForm(state.personalSettings);
    const body = await apiRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!body.ok || !body.settings) throw new Error('Ajustes no confirmados por el servidor.');
    applyPersonalSettingsToDOM(body.settings);
    if ($('conversation-list')) renderConversationList();
    if (statusEl) statusEl.textContent = 'Guardado en disco (' + new Date().toLocaleTimeString('es') + ')';
    toast('Ajustes guardados y aplicados.');
  } catch (error) {
    if (statusEl) statusEl.textContent = 'Error: ' + error.message;
    toast(error.message);
  }
}

async function saveVaultPasscodeFromSettings() {
  const currentPass = $('setting-current-passcode')?.value.trim() || '';
  const newPass = $('setting-new-passcode')?.value.trim() || '';
  const msg = $('setting-passcode-feedback');
  if (msg) {
    msg.style.color = '';
    msg.textContent = '';
  }

  const check = validatePasscode8(newPass);
  if (!check.valid) {
    if (msg) msg.textContent = 'La nueva contraseña debe tener exactamente 8 caracteres y combinar letras y números.';
    toast('La clave debe tener 8 caracteres con letras y números.');
    return;
  }

  try {
    if (!state.vaultConfigured) {
      await apiRequest('/api/vault/setup', {
        method: 'POST',
        body: JSON.stringify({ passcode: check.value }),
      });
    } else {
      await apiRequest('/api/vault/passcode', {
        method: 'POST',
        body: JSON.stringify({
          current_passcode: currentPass,
          new_passcode: check.value,
        }),
      });
    }
    if ($('setting-current-passcode')) $('setting-current-passcode').value = '';
    if ($('setting-new-passcode')) $('setting-new-passcode').value = '';
    if (msg) {
      msg.style.color = 'var(--success)';
      msg.textContent = '✓ Contraseña de 8 caracteres actualizada y Custodia Privada activa.';
    }
    await loadSettingsView();
    toast('🔐 Contraseña de 8 caracteres guardada.');
  } catch (error) {
    if (msg) msg.textContent = error.message;
    toast(error.message);
  }
}

async function authenticateWithToken(token) {
  const response = await fetch(state.ownerSetupRequired ? '/api/auth/setup' : '/api/auth/session', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    const body = await parseResponse(response);
    throw new Error(body.error || 'La clave no es correcta.');
  }
}

async function signOut() {
  try {
    await fetch('/api/auth/session', { method: 'DELETE', credentials: 'same-origin' });
  } finally {
    showAccess();
    $('access-token').value = '';
    $('access-error').textContent = '';
  }
}

function bindEvents() {
  SheilyResults.init({ toast, apiRequest });
  bindProfessionalWorkspace();
  const applyTheme = (dark) => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('theme-toggle').setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
  };
  const savedTheme = storageGet('sheily.ui.theme');
  applyTheme(savedTheme ? savedTheme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  $('theme-toggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme !== 'dark');
    storageSet('sheily.ui.theme', document.documentElement.dataset.theme);
  });
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view, {focus: true}));
  });
  document.querySelectorAll('[data-new-chat]').forEach((button) => button.addEventListener('click', newConversation));
  $('new-chat').addEventListener('click', newConversation);
  $('new-chat-mobile').addEventListener('click', newConversation);
  $('menu-button').addEventListener('click', openSidebar);
  $('context-inspector-open').addEventListener('click', () => void toggleContextInspector());
  $('context-inspector-close').addEventListener('click', closeContextInspector);
  $('context-inspector-refresh').addEventListener('click', () => void refreshContextInspector());
  $('context-inspector-report').addEventListener('click', () => {
    if (state.lastTurnCorrelationId) void showVerifiedTurnReport(state.lastTurnCorrelationId);
  });
  $('context-inspector-memory').addEventListener('click', () => setView('memory'));
  $('context-inspector-documents').addEventListener('click', () => setView('documents'));
  $('context-inspector-vault').addEventListener('click', () => setView('vault'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeContextInspector();
  });
  $('lifelong-memory-refresh').addEventListener('click', () => void loadLifelongMemoryPanel());
  $('lifelong-memory-source-close').addEventListener('click', () => {
    state.lifelongMemorySourceRequestId++;
    $('lifelong-memory-source-reader').hidden = true;
    $('lifelong-memory-source-text').textContent = '';
    state.lifelongMemoryReadSource = null;
    $('lifelong-memory-source-attach').disabled = true;
  });
  $('lifelong-memory-source-attach').addEventListener('click', attachLifelongMemorySource);
  $('lifelong-memory-training-form').addEventListener('submit', submitLifelongMemoryTraining);
  $('documents-refresh').addEventListener('click', () => void loadConversationDocuments());
  $('documents-upload').addEventListener('click', () => {
    setView('chat');
    $('file-attachment-input').click();
  });
  $('sidebar-close').addEventListener('click', closeSidebar);
  $('mobile-scrim').addEventListener('click', closeSidebar);
  $('message').addEventListener('input', resizeComposer);
  $('message').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      $('chat-form').requestSubmit();
    }
  });
  $('chat-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = $('message').value.trim();
    if (state.busy) return;
    if (!text && !state.attachments.length) return;
    $('message').value = '';
    resizeComposer();
    void sendMessage(text);
  });
  const modeSelect = $('cognitive-mode');
  if (modeSelect) {
    state.cognitiveMode = storageGet('sheily.ui.cognitive_mode') || 'balanced';
    modeSelect.value = state.cognitiveMode;
    modeSelect.addEventListener('change', () => {
      state.cognitiveMode = modeSelect.value;
      storageSet('sheily.ui.cognitive_mode', state.cognitiveMode);
    });
  }
  const attachBtn = $('attach-file-button');
  const fileInput = $('file-attachment-input');
  if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
      void handleFiles(event.target.files);
      fileInput.value = '';
    });
  }
  const dropOverlay = $('drop-overlay');
  if (dropOverlay) {
    let dragDepth = 0;
    window.addEventListener('dragenter', (event) => {
      if (event.dataTransfer && event.dataTransfer.types && Array.from(event.dataTransfer.types).includes('Files')) {
        dragDepth++;
        dropOverlay.hidden = false;
      }
    });
    window.addEventListener('dragleave', () => {
      dragDepth--;
      if (dragDepth <= 0) {
        dragDepth = 0;
        dropOverlay.hidden = true;
      }
    });
    window.addEventListener('dragover', (event) => { event.preventDefault(); });
    window.addEventListener('drop', (event) => {
      event.preventDefault();
      dragDepth = 0;
      dropOverlay.hidden = true;
      if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
        if (state.view === 'vault' && state.vaultUnlocked) {
          void handleVaultQuickFiles(event.dataTransfer.files);
        } else {
          void handleFiles(event.dataTransfer.files);
        }
      }
    });
  }
  setupVoiceInput();
  $('conversation-search').addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    clearTimeout(state.conversationSearchTimer);
    state.conversationSearchTimer = setTimeout(renderConversationList, 220);
  });
  $('memory-search').addEventListener('input', (event) => {
    state.memoryQuery = event.target.value.trim();
    clearTimeout(state.memorySearchTimer);
    state.memorySearchTimer = setTimeout(() => void loadMemoryStatus(), 280);
  });
  $('memory-kind').addEventListener('change', (event) => {
    state.memoryKind = event.target.value;
    void loadMemoryStatus();
  });
  $('access-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = $('access-token').value;
    const confirmation = $('access-confirm').value;
    const submit = event.submitter || $('access-form')?.querySelector('[type="submit"]');
    $('access-error').textContent = '';
    if (submit) submit.disabled = true;
    try {
      if (state.ownerSetupRequired && token !== confirmation) throw new Error('Las dos contraseñas no coinciden.');
      await authenticateWithToken(token);
      $('access-token').value = '';
      $('access-confirm').value = '';
      state.ownerSetupRequired = false;
      await startAuthenticatedApp();
    } catch (error) {
      $('access-error').textContent = error.message;
    } finally {
      if (submit) submit.disabled = false;
    }
  });
  $('toggle-token').addEventListener('click', () => {
    const input = $('access-token');
    input.type = input.type === 'password' ? 'text' : 'password';
    $('toggle-token').textContent = input.type === 'password' ? 'Ver' : 'Ocultar';
  });
  $('sign-out').addEventListener('click', () => void signOut());
  $('conversation-refresh').addEventListener('click', () => void refreshConversationHistory());
  $('export-history').addEventListener('click', () => void exportHistory());
  $('export-history-settings').addEventListener('click', () => void exportHistory());
  $('export-memory').addEventListener('click', () => void exportMemory());
  const exportMemoryButton = $('export-memory-settings') || $('setting-export-memory-btn');
  if (exportMemoryButton) exportMemoryButton.addEventListener('click', () => void exportMemory());
  const exportVaultButton = $('export-vault-settings') || $('setting-export-vault-btn');
  if (exportVaultButton) exportVaultButton.addEventListener('click', () => void exportVaultBackup());
  $('memory-load-more').addEventListener('click', () => void loadMemories(true).catch((error) => toast(error.message)));
  $('delete-history').addEventListener('click', () => void deleteAllConversations());
  $('confirm-dialog').addEventListener('close', () => {
    if (state.confirmResolve) state.confirmResolve($('confirm-dialog').returnValue === 'confirm');
    state.confirmResolve = null;
  });
  $('rename-cancel').addEventListener('click', () => $('rename-dialog').close());
  $('rename-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = $('rename-title').value.trim();
    if (!title) return;
    const submit = event.submitter || $('rename-form')?.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    $('rename-error').textContent = '';
    try {
      await renameConversation(state.renameConversationId, title);
      $('rename-dialog').close();
    } catch (error) {
      $('rename-error').textContent = error.message;
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  // Private Vault Gate & Workspace Events
  const pinSlotsContainer = $('vault-pin-slots');
  const passInput = $('vault-passcode-input');
  if (pinSlotsContainer && passInput) {
    pinSlotsContainer.addEventListener('click', () => {
      passInput.focus();
    });
  }
  if (passInput) {
    passInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
      updateVaultPinSlots(e.target.value);
    });
  }
  if ($('vault-passcode-toggle') && passInput) {
    $('vault-passcode-toggle').addEventListener('click', () => {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
      $('vault-passcode-toggle').textContent = passInput.type === 'password' ? 'Ver' : 'Ocultar';
      updateVaultPinSlots(passInput.value);
    });
  }
  if ($('vault-auth-form')) {
    $('vault-auth-form').addEventListener('submit', (e) => void handleVaultAuthSubmit(e));
  }
  if ($('vault-lock-btn')) {
    $('vault-lock-btn').addEventListener('click', () => void lockVault());
  }
  if ($('vault-export-btn')) {
    $('vault-export-btn').addEventListener('click', () => void exportVaultBackup());
  }
  const openNewItem = () => openVaultItemModal(state.vaultCategory);
  if ($('vault-new-item-btn')) $('vault-new-item-btn').addEventListener('click', openNewItem);
  if ($('vault-add-item-btn')) $('vault-add-item-btn').addEventListener('click', openNewItem);
  if ($('vault-empty-new-btn')) $('vault-empty-new-btn').addEventListener('click', openNewItem);
  if ($('vault-empty-add-btn')) $('vault-empty-add-btn').addEventListener('click', openNewItem);

  const triggerUpload = () => $('vault-quick-file-input')?.click();
  if ($('vault-quick-upload-btn')) $('vault-quick-upload-btn').addEventListener('click', triggerUpload);
  if ($('vault-empty-upload-btn')) $('vault-empty-upload-btn').addEventListener('click', triggerUpload);
  if ($('vault-quick-file-input')) {
    $('vault-quick-file-input').addEventListener('change', (e) => {
      void handleVaultQuickFiles(e.target.files);
      e.target.value = '';
    });
  }

  if ($('vault-record-audio-btn')) {
    $('vault-record-audio-btn').addEventListener('click', () => void toggleVaultAudioRecording());
  }

  const catBar = $('vault-category-tabs') || $('vault-category-bar');
  if (catBar) {
    catBar.querySelectorAll('.vault-cat-tab, [data-vault-kind], [data-vault-cat]').forEach((tab) => {
      tab.addEventListener('click', () => {
        state.vaultCategory = tab.dataset.vaultKind || tab.dataset.vaultCat || 'all';
        catBar.querySelectorAll('.vault-cat-tab, [data-vault-kind], [data-vault-cat]').forEach((t) => {
          t.classList.toggle('is-active', t === tab);
        });
        renderVaultItems();
      });
    });
  }

  if ($('vault-search')) {
    $('vault-search').addEventListener('input', (e) => {
      state.vaultQuery = e.target.value.trim();
      clearTimeout(state.vaultSearchTimer);
      state.vaultSearchTimer = setTimeout(renderVaultItems, 220);
    });
  }
  if ($('vault-folder-filter')) {
    $('vault-folder-filter').addEventListener('change', (e) => {
      state.vaultFolder = e.target.value;
      renderVaultItems();
    });
  }
  if ($('vault-sort')) {
    $('vault-sort').addEventListener('change', (e) => {
      state.vaultSort = e.target.value;
      renderVaultItems();
    });
  }
  const pinnedToggle = $('vault-pinned-toggle') || $('vault-filter-pinned');
  if (pinnedToggle) {
    pinnedToggle.addEventListener('click', () => {
      state.vaultPinnedOnly = !state.vaultPinnedOnly;
      pinnedToggle.setAttribute('aria-pressed', String(state.vaultPinnedOnly));
      renderVaultItems();
    });
  }
  if ($('vault-layout-toggle')) {
    $('vault-layout-toggle').addEventListener('click', () => {
      state.vaultLayout = state.vaultLayout === 'grid' ? 'list' : 'grid';
      renderVaultItems();
    });
  }

  // Vault Item Modal Events
  if ($('vault-item-kind')) {
    $('vault-item-kind').addEventListener('change', (e) => updateVaultModalFieldsForCategory(e.target.value));
  }
  if ($('vault-item-file')) {
    $('vault-item-file').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      state.vaultPendingFile = file;
      if ($('vault-file-picked-label')) {
        $('vault-file-picked-label').textContent = '📎 Seleccionado: ' + file.name + ' (' + formatFileSize(file.size) + ')';
      }
      if ($('vault-item-title') && !$('vault-item-title').value.trim()) {
        $('vault-item-title').value = file.name;
      }
      const detectedCat = inferVaultCategoryFromFile(file);
      if ($('vault-item-kind')) {
        $('vault-item-kind').value = detectedCat;
        updateVaultModalFieldsForCategory(detectedCat);
      }
      const resolvedContainer = resolveVaultContainerForFilename(file.name);
      if ($('vault-item-folder') && resolvedContainer) {
        $('vault-item-folder').value = resolvedContainer;
      }
    });
  }
  if ($('vault-item-cancel')) {
    $('vault-item-cancel').addEventListener('click', () => $('vault-item-dialog')?.close());
  }
  if ($('vault-item-form')) {
    $('vault-item-form').addEventListener('submit', (e) => void handleVaultModalSubmit(e));
  }

  // Vault Containers Dialog Events
  if ($('vault-open-containers-btn')) {
    $('vault-open-containers-btn').addEventListener('click', () => openVaultContainersModal());
  }
  if ($('vault-item-manage-containers-shortcut')) {
    $('vault-item-manage-containers-shortcut').addEventListener('click', () => openVaultContainersModal());
  }
  if ($('vault-containers-close-btn')) {
    $('vault-containers-close-btn').addEventListener('click', () => $('vault-containers-dialog')?.close());
  }
  if ($('vault-container-form')) {
    $('vault-container-form').addEventListener('submit', (e) => void handleVaultContainerFormSubmit(e));
  }
  if ($('vcontainer-cancel-btn')) {
    $('vcontainer-cancel-btn').addEventListener('click', () => resetVaultContainerForm());
  }

  // Vault Universal Preview Dialog Events
  if ($('vault-preview-close-btn')) {
    $('vault-preview-close-btn').addEventListener('click', () => $('vault-preview-dialog')?.close());
  }
  if ($('vault-preview-chat-btn')) {
    $('vault-preview-chat-btn').addEventListener('click', () => {
      if (vaultPreviewActiveItem) {
        $('vault-preview-dialog')?.close();
        sendVaultItemToChat(vaultPreviewActiveItem);
      }
    });
  }
  if ($('vault-preview-copy-btn')) {
    $('vault-preview-copy-btn').addEventListener('click', () => {
      if (vaultPreviewActiveText) {
        void navigator.clipboard?.writeText(vaultPreviewActiveText);
        toast('📋 Contenido copiado al portapapeles.');
      } else if (vaultPreviewActiveItem && vaultPreviewActiveItem.content) {
        void navigator.clipboard?.writeText(vaultPreviewActiveItem.content);
        toast('📋 Contenido copiado al portapapeles.');
      } else {
        toast('No hay texto para copiar en este elemento.');
      }
    });
  }

  // Settings Control Center Events
  if ($('save-settings-btn')) {
    $('save-settings-btn').addEventListener('click', () => void savePersonalSettingsFromForm());
  }
  if ($('setting-save-passcode-btn')) {
    $('setting-save-passcode-btn').addEventListener('click', () => void saveVaultPasscodeFromSettings());
  }
  const openVault = $('settings-open-vault-btn') || $('setting-open-vault-btn');
  if (openVault) openVault.addEventListener('click', () => setView('vault'));
  if ($('setting-lock-vault-btn')) {
    $('setting-lock-vault-btn').addEventListener('click', () => void lockVault());
  }
  if ($('setting-theme')) {
    $('setting-theme').addEventListener('change', () => void savePersonalSettingsFromForm());
  }
  if ($('setting-ui-density')) {
    $('setting-ui-density').addEventListener('change', () => void savePersonalSettingsFromForm());
  }
  if ($('setting-font-scale')) {
    $('setting-font-scale').addEventListener('change', () => void savePersonalSettingsFromForm());
  }

  // Expressive Female Voice Settings Events
  SheilyVoice.init();
  HandsfreeEngine.init();
  const replyDelivery = $('reply-delivery');
  if (replyDelivery) {
    replyDelivery.value = replyDeliveryMode();
    replyDelivery.addEventListener('change', () => {
      const mode = replyDelivery.value === 'text' || replyDelivery.value === 'voice' ? replyDelivery.value : 'both';
      storageSet(REPLY_DELIVERY_KEY, mode);
      if (mode === 'text') SheilyVoice.stop();
    });
  }
  const voiceSelect = $('setting-voice-select');
  if (voiceSelect) {
    voiceSelect.addEventListener('change', () => {
      const selectedId = voiceSelect.value;
      const knownStyle = SheilyVoice.styles.some((style) => style.id === selectedId);
      if (!knownStyle) {
        voiceSelect.value = SheilyVoice.defaultVoiceId;
        storageSet('sheily.voice.id', SheilyVoice.defaultVoiceId);
        SheilyVoice.activeVoiceId = SheilyVoice.defaultVoiceId;
        toast('La voz seleccionada ya no está disponible.');
        return;
      }
      storageSet('sheily.voice.id', selectedId);
      SheilyVoice.activeVoiceId = selectedId;
      SheilyVoice.renderProfileCaption(selectedId);
      toast('Voz de Sheily: ' + SheilyVoice.voiceCaption(selectedId));
    });
  }
  const voiceLanguage = $('setting-voice-language');
  if (voiceLanguage) {
    voiceLanguage.value = SheilyVoice.language();
    voiceLanguage.addEventListener('change', () => {
      const language = voiceLanguage.value === 'en' ? 'en' : 'es';
      storageSet('sheily.voice.language', language);
      toast(language === 'en' ? 'Sheily hablará en inglés.' : 'Sheily hablará en español.');
    });
  }
  const pitchRange = $('setting-voice-pitch');
  if (pitchRange) {
    const savedPitch = storageGet('sheily.voice.pitch') || '1.00';
    pitchRange.value = savedPitch;
    if ($('voice-pitch-label')) $('voice-pitch-label').textContent = Number(savedPitch).toFixed(2) + 'x';
    pitchRange.addEventListener('input', (e) => {
      const val = Number.parseFloat(e.target.value).toFixed(2);
      if ($('voice-pitch-label')) $('voice-pitch-label').textContent = val + 'x';
      storageSet('sheily.voice.pitch', val);
    });
  }
  const speedRange = $('setting-voice-speed');
  if (speedRange) {
    const savedSpeed = storageGet('sheily.voice.speed') || '1.00';
    speedRange.value = savedSpeed;
    if ($('voice-speed-label')) $('voice-speed-label').textContent = Number(savedSpeed).toFixed(2) + 'x';
    speedRange.addEventListener('input', (e) => {
      const val = Number.parseFloat(e.target.value).toFixed(2);
      if ($('voice-speed-label')) $('voice-speed-label').textContent = val + 'x';
      storageSet('sheily.voice.speed', val);
    });
  }
  const expressiveCheck = $('setting-voice-expressive');
  if (expressiveCheck) {
    expressiveCheck.checked = true;
  }
  const voiceAutoplayCheck = $('setting-voice-autoplay');
  if (voiceAutoplayCheck) {
    voiceAutoplayCheck.checked = storageGet('sheily.voice.autoplay') === 'true';
    voiceAutoplayCheck.addEventListener('change', () => {
      storageSet('sheily.voice.autoplay', String(voiceAutoplayCheck.checked));
      if (state.personalSettings) state.personalSettings.voice_tts_autoplay = voiceAutoplayCheck.checked;
    });
  }
  const testVoiceBtn = $('setting-test-voice-btn');
  if (testVoiceBtn) {
    testVoiceBtn.addEventListener('click', () => {
      if (SheilyVoice.isSpeaking) {
        SheilyVoice.stop();
        testVoiceBtn.textContent = '🔊 Probar voz expresiva';
        return;
      }
      testVoiceBtn.textContent = '⏹️ Detener prueba';
      const sample = '¡Hola usuario! Soy Sheily. Ahora mi voz es completamente femenina, viva y expresiva. Modularé con entusiasmo cuando tengamos buenas noticias, hablaré con calma en temas privados, y haré preguntas con entonación natural. ¿Qué te parece cómo suena mi voz ahora?';
      SheilyVoice.speak(
        sample,
        () => {
          testVoiceBtn.textContent = '⏹️ Detener prueba';
        },
        () => {
          testVoiceBtn.textContent = '🔊 Probar voz expresiva';
        }
      );
    });
  }
}

async function startAuthenticatedApp() {
  const initialRoute = currentWorkspaceRoute();
  showApp();
  setConnected(true);
  void loadPersonalSettings();
  void loadVaultStatus();
  try {
    await loadConversations();
    const selected = state.conversations.find((item) => item.conversation_id === state.conversationId);
    if (selected) await openConversation(selected.conversation_id);
    else newConversation();
    if (initialRoute.view !== 'chat') setView(initialRoute.view, {tab: initialRoute.tab, replace: true});
  } catch (error) {
    if (error.code === 'AUTH_REQUIRED') showAccess();
    else {
      setConnected(false);
      toast(error.message);
    }
  }
}

async function bootstrap() {
  state.sessionId = PERSONAL_OWNER_SESSION;
  state.conversationId = activeConversationId();
  bindEvents();
  resizeComposer();
  try {
    // A private mobile gateway can authorize ordinary API access without an
    // owner password. Check the actual access first; setup is only relevant
    // when the ordinary request is rejected.
    await apiRequest('/api/conversations?session_id=' + encodeURIComponent(state.sessionId));
    await startAuthenticatedApp();
  } catch (error) {
    if (error.code !== 'AUTH_REQUIRED') {
      setConnected(false);
      showApp();
      toast(error.message);
      return;
    }
    try {
      const statusResponse = await fetch('/api/auth/status', { credentials: 'same-origin' });
      const status = await parseResponse(statusResponse);
      showAccess(statusResponse.ok && status.configured === false);
    } catch {
      setConnected(false);
      showAccess(false);
    }
  }
}

// Surface unexpected interface faults instead of failing silently. This does
// not invent results: it only reports that a browser-side error occurred.
let lastRuntimeFaultAt = 0;
function reportRuntimeFault(message) {
  const now = Date.now();
  if (now - lastRuntimeFaultAt < 4000) return;
  lastRuntimeFaultAt = now;
  toast('Error de la interfaz: ' + compactText(String(message || 'desconocido'), 140));
}

if (typeof document !== 'undefined' && typeof globalThis.addEventListener === 'function') {
  globalThis.addEventListener('error', (event) => {
    reportRuntimeFault(event?.message);
  });
  globalThis.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    reportRuntimeFault(reason?.message || reason);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => void bootstrap());
}
