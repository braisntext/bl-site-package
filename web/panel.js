// ============================================================
// PANEL CLIENT LOGIC — conectado a API real
// ============================================================

const state = {
  authenticated: false,
  currentSection: 'overview',
  messages: [],
  authToken: null,
  companyName: ''
};

// ── Auth ──────────────────────────────────────────────────────
async function authenticatePanel(password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();

    if (res.status === 503) {
      window.location.href = '/setup';
      return false;
    }
    if (!res.ok) {
      showLoginError(data.error || 'Contraseña incorrecta.');
      return false;
    }

    state.authToken = data.token;
    state.authenticated = true;
    state.companyName = data.companyName || '';

    document.getElementById('login-screen').hidden = true;
    document.getElementById('panel-app').hidden = false;

    if (state.companyName) {
      document.getElementById('company-name').textContent = state.companyName;
      const sc = document.getElementById('sidebar-company');
      if (sc) sc.textContent = state.companyName;
    }

    updateGreeting();
    loadBlogArticles();
    loadBlogStats();
    return true;
  } catch {
    showLoginError('Error de conexión. Intenta de nuevo.');
    return false;
  }
}

function showLoginError(msg) {
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = msg;
  errorEl.hidden = false;
  setTimeout(() => { errorEl.hidden = true; }, 4000);
}

function logout() {
  state.authenticated = false;
  state.authToken = null;
  state.messages = [];
  document.getElementById('login-screen').hidden = false;
  document.getElementById('panel-app').hidden = true;
  document.getElementById('panel-password').value = '';
  setTimeout(() => document.getElementById('panel-password').focus(), 50);
}

// ── Navigation ────────────────────────────────────────────────
function navigateToSection(sectionName) {
  document.querySelectorAll('[data-panel]').forEach(s => {
    s.hidden = true;
    s.classList.remove('active');
  });
  const section = document.querySelector(`[data-panel="${sectionName}"]`);
  if (section) {
    section.hidden = false;
    section.classList.add('active');
    state.currentSection = sectionName;
  }
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  if (sectionName === 'blog') loadBlogArticles();
}

// ── Chat ──────────────────────────────────────────────────────
function addChatMessage(text, isUser = false) {
  const msgDiv = document.createElement('div');
  msgDiv.className = isUser ? 'chat-message user-message' : 'chat-message agent-message';
  msgDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;
  const container = document.getElementById('chat-messages');
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
  state.messages.push({ text, isUser, timestamp: new Date() });
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  addChatMessage(text, true);
  input.value = '';

  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message agent-message';
  typingDiv.innerHTML = '<p style="color:var(--text-muted)">Escribiendo…</p>';
  document.getElementById('chat-messages').appendChild(typingDiv);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    typingDiv.remove();
    addChatMessage(data.reply || 'Sin respuesta.', false);
  } catch {
    typingDiv.remove();
    addChatMessage('Error al contactar el agente. Intenta de nuevo.', false);
  }
}

function preFillChat(prompt) {
  navigateToSection('chat');
  setTimeout(() => {
    const input = document.getElementById('chat-input');
    input.value = prompt;
    input.focus();
    input.setSelectionRange(prompt.length, prompt.length);
  }, 100);
}

// ── Blog ──────────────────────────────────────────────────────
async function loadBlogArticles() {
  const container = document.getElementById('articles-list');
  if (!container) return;

  container.innerHTML = '<p style="color:var(--text-muted);font-size:1.4rem;padding:1rem 0">Cargando artículos…</p>';

  try {
    const res = await fetch('/api/blog', {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const articles = await res.json();

    if (!articles.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Todavía no tienes artículos.<br>¡Crea el primero con el botón de arriba!</p>
        </div>`;
      return;
    }

    container.innerHTML = articles.map(a => `
      <div class="blog-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap">
          <div style="flex:1">
            <h3 style="margin-bottom:.4rem">${escapeHtml(a.title)}</h3>
            <div class="blog-meta">
              <span class="blog-date">${new Date(a.created_at).toLocaleDateString('es-ES', {day:'numeric',month:'short',year:'numeric'})}</span>
              <span class="blog-status" style="background:${a.status === 'published' ? '#E8F5E9' : 'var(--bg-subtle)'};color:${a.status === 'published' ? '#2E7D32' : 'var(--text-muted)'}">
                ${a.status === 'published' ? 'Publicado' : 'Borrador'}
              </span>
            </div>
            ${a.content ? `<p class="blog-excerpt">${escapeHtml(a.content.slice(0, 140))}${a.content.length > 140 ? '…' : ''}</p>` : ''}
          </div>
          <div class="blog-actions" style="flex-shrink:0">
            <button class="link-btn" onclick="openEditArticle(${a.id}, ${JSON.stringify(escapeHtml(a.title))}, ${JSON.stringify(escapeHtml(a.content || ''))}, '${a.status}')">Editar</button>
            <button class="link-btn" onclick="toggleArticleStatus(${a.id}, '${a.status}')">${a.status === 'published' ? 'Despublicar' : 'Publicar'}</button>
            <button class="link-btn" style="color:#c0392b" onclick="deleteArticle(${a.id})">Eliminar</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p style="color:#c0392b;font-size:1.4rem">Error al cargar los artículos. Recarga la página.</p>';
  }
}

async function loadBlogStats() {
  const statEl = document.getElementById('stat-posts');
  if (!statEl) return;
  try {
    const res = await fetch('/api/blog', {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const articles = await res.json();
    const published = articles.filter(a => a.status === 'published').length;
    statEl.textContent = published;
  } catch { /* silencioso */ }
}

// ── Article Form ──────────────────────────────────────────────
function openNewArticle() {
  const wrap = document.getElementById('article-form-wrap');
  document.getElementById('article-form-title').textContent = 'Nuevo artículo';
  document.getElementById('article-edit-id').value = '';
  document.getElementById('article-title-input').value = '';
  document.getElementById('article-content-input').value = '';
  document.getElementById('article-status-select').value = 'draft';
  document.getElementById('article-form-submit').textContent = 'Guardar artículo';
  hideFormMsg();
  wrap.hidden = false;
  document.getElementById('article-title-input').focus();
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openEditArticle(id, title, content, status) {
  const wrap = document.getElementById('article-form-wrap');
  document.getElementById('article-form-title').textContent = 'Editar artículo';
  document.getElementById('article-edit-id').value = id;
  document.getElementById('article-title-input').value = title;
  document.getElementById('article-content-input').value = content;
  document.getElementById('article-status-select').value = status;
  document.getElementById('article-form-submit').textContent = 'Actualizar artículo';
  hideFormMsg();
  wrap.hidden = false;
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeArticleForm() {
  document.getElementById('article-form-wrap').hidden = true;
  document.getElementById('article-form').reset();
  document.getElementById('article-edit-id').value = '';
}

function showFormMsg(msg, isError = false) {
  const el = document.getElementById('article-form-msg');
  el.textContent = msg;
  el.style.color = isError ? '#c0392b' : '#2E7D32';
  el.hidden = false;
}

function hideFormMsg() {
  document.getElementById('article-form-msg').hidden = true;
}

async function submitArticleForm(e) {
  e.preventDefault();
  const id = document.getElementById('article-edit-id').value;
  const title = document.getElementById('article-title-input').value.trim();
  const content = document.getElementById('article-content-input').value.trim();
  const status = document.getElementById('article-status-select').value;

  if (!title) { showFormMsg('El título es obligatorio.', true); return; }

  const submitBtn = document.getElementById('article-form-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Guardando…';
  hideFormMsg();

  try {
    const url = id ? `/api/blog/${id}` : '/api/blog';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({ title, content, status })
    });

    if (!res.ok) {
      const data = await res.json();
      showFormMsg(data.error || 'Error al guardar.', true);
      return;
    }

    showFormMsg(id ? '¡Artículo actualizado!' : '¡Artículo creado!');
    setTimeout(() => {
      closeArticleForm();
      loadBlogArticles();
      loadBlogStats();
    }, 900);
  } catch {
    showFormMsg('Error de conexión.', true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = id ? 'Actualizar artículo' : 'Guardar artículo';
  }
}

async function toggleArticleStatus(id, currentStatus) {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';
  try {
    await fetch(`/api/blog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.authToken}` },
      body: JSON.stringify({ status: newStatus })
    });
    loadBlogArticles();
    loadBlogStats();
  } catch { /* silencioso */ }
}

async function deleteArticle(id) {
  if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return;
  try {
    await fetch(`/api/blog/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    loadBlogArticles();
    loadBlogStats();
  } catch { /* silencioso */ }
}

// ── UI Helpers ────────────────────────────────────────────────
function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Buenos días';
  if (hour >= 12 && hour < 20) greeting = 'Buenas tardes';
  if (hour >= 20) greeting = 'Buenas noches';
  const el = document.getElementById('greeting');
  if (el) el.textContent = greeting;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Initialize ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Redirigir a setup si no está configurado
  fetch('/api/setup/status')
    .then(r => r.json())
    .then(data => { if (!data.configured) window.location.href = '/setup'; })
    .catch(() => {});

  // Login
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('panel-password').value;
    if (!password) return;
    authenticatePanel(password);
  });

  // Logout
  document.getElementById('panel-logout')?.addEventListener('click', logout);
  document.getElementById('sidebar-logout')?.addEventListener('click', logout);

  // Sidebar navigation
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateToSection(btn.dataset.section));
  });

  // Chat
  document.getElementById('chat-send')?.addEventListener('click', sendChatMessage);
  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });

  // Quick actions (overview)
  document.querySelectorAll('.action-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'create-article') {
        navigateToSection('blog');
        setTimeout(openNewArticle, 150);
      } else if (action === 'edit-texts') {
        navigateToSection('chat');
      } else if (action === 'view-blog') {
        navigateToSection('blog');
      }
    });
  });

  // Botón nuevo artículo en blog
  document.getElementById('new-article-btn')?.addEventListener('click', openNewArticle);

  // Formulario de artículo
  document.getElementById('article-form')?.addEventListener('submit', submitArticleForm);
  document.getElementById('article-form-close')?.addEventListener('click', closeArticleForm);
  document.getElementById('article-form-cancel')?.addEventListener('click', closeArticleForm);

  // Suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      input.value = chip.dataset.prompt;
      input.focus();
    });
  });

  // Textos web → abrir chat
  document.querySelectorAll('.texto-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.text || '';
      preFillChat(`Quiero mejorar el texto de la sección "${section}" de mi web. `);
    });
  });

  // Focus en password al cargar
  document.getElementById('panel-password')?.focus();
});
