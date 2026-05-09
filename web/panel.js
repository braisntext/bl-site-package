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
    document.getElementById('login-screen').classList.remove('visible');
    document.getElementById('login-screen').hidden = true;
    document.getElementById('panel-app').hidden = false;
    updateGreeting();
    loadBlogArticles();
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
  document.getElementById('login-screen').classList.add('visible');
  document.getElementById('login-screen').hidden = false;
  document.getElementById('panel-app').hidden = true;
  document.getElementById('panel-password').value = '';
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
  typingDiv.className = 'chat-message agent-message typing-indicator';
  typingDiv.innerHTML = '<p>…</p>';
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
    document.getElementById('chat-input').value = prompt;
    document.getElementById('chat-input').focus();
  }, 100);
}

// ── Blog ──────────────────────────────────────────────────────
async function loadBlogArticles() {
  const container = document.getElementById('articles-list');
  if (!container) return;

  container.innerHTML = '<p style="color:var(--color-text-muted)">Cargando artículos…</p>';

  try {
    const res = await fetch('/api/blog', {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const articles = await res.json();

    if (!articles.length) {
      container.innerHTML = '<p style="color:var(--color-text-muted)">No hay artículos todavía. ¡Crea el primero!</p>';
      return;
    }

    container.innerHTML = articles.map(a => `
      <div class="article-item" style="padding:1rem;border:1px solid var(--color-border);border-radius:8px;margin-bottom:0.75rem;">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:1rem;">
          <div>
            <strong style="color:var(--color-text)">${escapeHtml(a.title)}</strong>
            <span style="margin-left:0.5rem;font-size:0.75rem;padding:2px 8px;border-radius:99px;background:${a.status === 'published' ? '#01696f22' : 'var(--color-surface-offset)'};color:${a.status === 'published' ? '#4f98a3' : 'var(--color-text-muted)'}">${a.status === 'published' ? 'Publicado' : 'Borrador'}</span>
            <div style="font-size:0.8125rem;color:var(--color-text-muted);margin-top:0.25rem">${new Date(a.created_at).toLocaleDateString('es-ES')}</div>
          </div>
          <div style="display:flex;gap:0.5rem;flex-shrink:0">
            <button onclick="toggleArticleStatus(${a.id}, '${a.status}')" style="font-size:0.75rem;padding:4px 10px;background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:6px;color:var(--color-text-muted);cursor:pointer">
              ${a.status === 'published' ? 'Despublicar' : 'Publicar'}
            </button>
            <button onclick="deleteArticle(${a.id})" style="font-size:0.75rem;padding:4px 10px;background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:6px;color:#d163a7;cursor:pointer">Eliminar</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p style="color:#d163a7">Error al cargar los artículos.</p>';
  }
}

async function toggleArticleStatus(id, currentStatus) {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';
  await fetch(`/api/blog/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.authToken}` },
    body: JSON.stringify({ status: newStatus })
  });
  loadBlogArticles();
}

async function deleteArticle(id) {
  if (!confirm('¿Eliminar este artículo?')) return;
  await fetch(`/api/blog/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${state.authToken}` }
  });
  loadBlogArticles();
}

// ── UI Helpers ────────────────────────────────────────────────
function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Buenos días';
  if (hour >= 12 && hour < 18) greeting = 'Buenas tardes';
  if (hour >= 18) greeting = 'Buenas noches';
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
  // Check setup status
  fetch('/api/setup/status')
    .then(r => r.json())
    .then(data => { if (!data.configured) window.location.href = '/setup'; })
    .catch(() => {});

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('panel-password').value;
    authenticatePanel(password);
  });

  document.getElementById('panel-logout')?.addEventListener('click', logout);
  document.getElementById('sidebar-logout')?.addEventListener('click', logout);

  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateToSection(btn.dataset.section));
  });

  document.getElementById('chat-send')?.addEventListener('click', sendChatMessage);
  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });

  document.querySelectorAll('.action-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'create-article') preFillChat('Quiero crear un nuevo artículo para el blog. El tema es: ');
      else if (action === 'edit-texts') navigateToSection('textos');
      else if (action === 'view-blog') navigateToSection('blog');
    });
  });

  document.getElementById('new-article-btn')?.addEventListener('click', () => {
    preFillChat('Quiero crear un nuevo artículo para el blog. El tema es: ');
  });

  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('chat-input').value = chip.dataset.prompt;
      document.getElementById('chat-input').focus();
    });
  });

  document.querySelectorAll('.texto-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const textContent = btn.parentElement.querySelector('h3')?.textContent || '';
      preFillChat(`Mejora este texto: "${textContent}". `);
    });
  });

  document.querySelectorAll('.history-view').forEach(btn => {
    btn.addEventListener('click', () => navigateToSection('chat'));
  });

  document.getElementById('panel-password')?.focus();
});
