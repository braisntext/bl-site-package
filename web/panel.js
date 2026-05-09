document.addEventListener('DOMContentLoaded', function () {

  // ── AUTH ──────────────────────────────────────────────────────────
  var token = null;

  var loginScreen = document.getElementById('login-screen');
  var panelApp = document.getElementById('panel-app');
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var pwd = document.getElementById('panel-password').value;
    try {
      var res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      var data = await res.json();
      if (data.token) {
        token = data.token;
        loginScreen.hidden = true;
        panelApp.hidden = false;
        initPanel();
      } else {
        loginError.textContent = data.error || 'Contraseña incorrecta';
        loginError.hidden = false;
      }
    } catch {
      loginError.textContent = 'Error de conexión';
      loginError.hidden = false;
    }
  });

  function authHeaders() {
    return { 'Content-Type': 'application/json', 'x-panel-token': token };
  }

  // ── LOGOUT ───────────────────────────────────────────────────────
  function doLogout() {
    token = null;
    panelApp.hidden = true;
    loginScreen.hidden = false;
    document.getElementById('panel-password').value = '';
    loginError.hidden = true;
  }
  document.getElementById('panel-logout').addEventListener('click', doLogout);
  document.getElementById('sidebar-logout').addEventListener('click', doLogout);

  // ── NAVIGATION ───────────────────────────────────────────────────
  var navItems = document.querySelectorAll('.sidebar-nav-item');
  var sections = document.querySelectorAll('.panel-section');

  function showSection(name) {
    navItems.forEach(function(b){ b.classList.toggle('active', b.dataset.section === name); });
    sections.forEach(function(s){
      var active = s.dataset.panel === name;
      s.classList.toggle('active', active);
      s.hidden = !active;
    });
    if (name === 'blog') loadArticles();
    if (name === 'misite') initMiSite();
  }

  navItems.forEach(function(btn){
    btn.addEventListener('click', function(){ showSection(btn.dataset.section); });
  });

  // Quick action buttons
  document.querySelectorAll('.action-button').forEach(function(btn){
    btn.addEventListener('click', function(){
      var action = btn.dataset.action;
      if (action === 'create-article') { showSection('blog'); setTimeout(function(){ document.getElementById('new-article-btn').click(); }, 100); }
      else if (action === 'edit-texts') showSection('chat');
      else if (action === 'view-blog') showSection('blog');
    });
  });

  // ── INIT PANEL ───────────────────────────────────────────────────
  function initPanel() {
    // Greeting
    var h = new Date().getHours();
    var greet = h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
    document.getElementById('greeting').textContent = greet;

    // Company name from setup config
    fetch('/api/setup/status').then(function(r){ return r.json(); }).then(function(d){
      var name = d.company_name || '';
      if (name) {
        document.getElementById('company-name').textContent = name;
        document.getElementById('sidebar-company').textContent = name;
      }
    }).catch(function(){});

    // Stats
    fetch('/api/blog/posts').then(function(r){ return r.json(); }).then(function(d){
      var published = (d.posts||[]).filter(function(p){ return p.status==='published'; }).length;
      document.getElementById('stat-posts').textContent = published;
    }).catch(function(){});
  }

  // ── CHAT ─────────────────────────────────────────────────────────
  var chatMessages = document.getElementById('chat-messages');
  var chatInput = document.getElementById('chat-input');
  var chatSend = document.getElementById('chat-send');

  function appendMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'chat-message ' + (role === 'user' ? 'user-message' : 'agent-message');
    var p = document.createElement('p');
    p.textContent = text;
    div.appendChild(p);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendChat() {
    var msg = chatInput.value.trim();
    if (!msg) return;
    chatInput.value = '';
    chatSend.disabled = true;
    appendMessage('user', msg);
    try {
      var res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: msg })
      });
      var data = await res.json();
      appendMessage('agent', data.reply || 'Sin respuesta');
    } catch {
      appendMessage('agent', 'Error de conexión. Intenta de nuevo.');
    }
    chatSend.disabled = false;
    chatInput.focus();
  }

  chatSend.addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  });

  document.querySelectorAll('.suggestion-chip').forEach(function(chip){
    chip.addEventListener('click', function(){ chatInput.value = chip.dataset.prompt; chatInput.focus(); });
  });

  // ── BLOG ─────────────────────────────────────────────────────────
  var articleFormWrap = document.getElementById('article-form-wrap');
  var articleForm = document.getElementById('article-form');

  document.getElementById('new-article-btn').addEventListener('click', function(){
    document.getElementById('article-edit-id').value = '';
    document.getElementById('article-title-input').value = '';
    document.getElementById('article-content-input').value = '';
    document.getElementById('article-status-select').value = 'draft';
    document.getElementById('article-form-title').textContent = 'Nuevo artículo';
    articleFormWrap.hidden = false;
  });
  document.getElementById('article-form-close').addEventListener('click', function(){ articleFormWrap.hidden = true; });
  document.getElementById('article-form-cancel').addEventListener('click', function(){ articleFormWrap.hidden = true; });

  articleForm.addEventListener('submit', async function(e){
    e.preventDefault();
    var id = document.getElementById('article-edit-id').value;
    var body = {
      title: document.getElementById('article-title-input').value.trim(),
      content: document.getElementById('article-content-input').value.trim(),
      status: document.getElementById('article-status-select').value
    };
    var url = id ? '/api/blog/posts/' + id : '/api/blog/posts';
    var method = id ? 'PUT' : 'POST';
    try {
      var res = await fetch(url, { method: method, headers: authHeaders(), body: JSON.stringify(body) });
      var data = await res.json();
      if (data.success || data.id) {
        articleFormWrap.hidden = true;
        loadArticles();
      }
    } catch { /* silent */ }
  });

  function loadArticles() {
    fetch('/api/blog/posts').then(function(r){ return r.json(); }).then(function(data){
      var list = document.getElementById('articles-list');
      var posts = data.posts || [];
      if (!posts.length) { list.innerHTML = '<p style="color:var(--text-muted);padding:2rem 0">Aún no tienes artículos.</p>'; return; }
      list.innerHTML = posts.map(function(p){
        var badge = p.status === 'published'
          ? '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:20px;font-size:0.75rem;font-weight:600">Publicado</span>'
          : '<span style="background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:20px;font-size:0.75rem;font-weight:600">Borrador</span>';
        return '<div class="article-row"><div class="article-row-info"><span class="article-row-title">' + p.title + '</span>' + badge + '</div><div class="article-row-actions"><button class="btn-ghost-sm" data-edit="' + p.id + '">Editar</button><button class="btn-ghost-sm btn-danger" data-delete="' + p.id + '">Eliminar</button></div></div>';
      }).join('');
      list.querySelectorAll('[data-edit]').forEach(function(btn){
        btn.addEventListener('click', function(){
          var post = posts.find(function(p){ return p.id == btn.dataset.edit; });
          if (!post) return;
          document.getElementById('article-edit-id').value = post.id;
          document.getElementById('article-title-input').value = post.title;
          document.getElementById('article-content-input').value = post.content;
          document.getElementById('article-status-select').value = post.status;
          document.getElementById('article-form-title').textContent = 'Editar artículo';
          articleFormWrap.hidden = false;
        });
      });
      list.querySelectorAll('[data-delete]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          if (!confirm('¿Eliminar este artículo?')) return;
          await fetch('/api/blog/posts/' + btn.dataset.delete, { method: 'DELETE', headers: authHeaders() });
          loadArticles();
        });
      });
    }).catch(function(){});
  }

  // ── MI SITIO WEB ─────────────────────────────────────────────────
  var siteConfig = {};
  var activePage = 'index';

  function initMiSite() {
    // Load current config
    fetch('/api/site/config').then(function(r){ return r.json(); }).then(function(cfg){
      siteConfig = cfg;
      renderPageForm(activePage);
      // Logo preview
      if (cfg.logo_ext) {
        var img = document.getElementById('logo-preview');
        img.src = '/uploads/logo.' + cfg.logo_ext + '?t=' + Date.now();
        img.style.display = 'block';
        document.getElementById('logo-placeholder').style.display = 'none';
      }
      // Model
      if (cfg.ai_model && cfg.ai_model !== 'meta-llama/llama-3.1-8b-instruct:free') {
        var customLabel = document.getElementById('model-custom-label');
        var customInput = document.getElementById('model-custom');
        customInput.value = cfg.ai_model;
        document.getElementById('model-custom-name').textContent = cfg.ai_model.split('/').pop();
        document.getElementById('model-custom-desc').textContent = cfg.ai_model;
        customLabel.style.display = 'flex';
        customInput.checked = true;
        document.getElementById('model-free-label').classList.remove('selected');
        customLabel.classList.add('selected');
      }
    }).catch(function(){});

    // Internal tabs
    document.querySelectorAll('.misite-tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        document.querySelectorAll('.misite-tab').forEach(function(t){ t.classList.remove('active'); });
        tab.classList.add('active');
        document.querySelectorAll('.misite-panel').forEach(function(p){ p.style.display = 'none'; });
        document.getElementById('misite-' + tab.dataset.tab).style.display = 'block';
      });
    });

    // Page tabs
    document.querySelectorAll('.misite-page-tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        document.querySelectorAll('.misite-page-tab').forEach(function(t){ t.classList.remove('active'); });
        tab.classList.add('active');
        activePage = tab.dataset.page;
        renderPageForm(activePage);
      });
    });

    // Save page texts
    document.getElementById('save-page-texts').addEventListener('click', async function(){
      var msg = document.getElementById('save-page-msg');
      var payload = {};
      document.querySelectorAll('.misite-page-form [data-key]').forEach(function(el){
        payload[el.dataset.key] = el.value;
      });
      try {
        var res = await fetch('/api/site/texts', { method:'POST', headers: authHeaders(), body: JSON.stringify(payload) });
        var data = await res.json();
        msg.textContent = data.success ? '✓ Guardado' : (data.error || 'Error');
        msg.style.color = data.success ? 'var(--accent)' : 'var(--error)';
        msg.style.display = 'inline';
        setTimeout(function(){ msg.style.display = 'none'; }, 2500);
      } catch {
        msg.textContent = 'Error de conexión'; msg.style.display = 'inline';
      }
    });

    // Logo upload
    document.getElementById('logo-file-input').addEventListener('change', async function(){
      var file = this.files[0];
      if (!file) return;
      var msgEl = document.getElementById('logo-upload-msg');
      var formData = new FormData();
      formData.append('logo', file);
      try {
        var res = await fetch('/api/site/logo', { method:'POST', headers:{'x-panel-token': token}, body: formData });
        var data = await res.json();
        if (data.success) {
          var img = document.getElementById('logo-preview');
          img.src = data.path + '?t=' + Date.now();
          img.style.display = 'block';
          document.getElementById('logo-placeholder').style.display = 'none';
          msgEl.textContent = '✓ Logo actualizado';
          msgEl.style.color = 'var(--accent)';
        } else {
          msgEl.textContent = data.error || 'Error al subir';
          msgEl.style.color = 'var(--error)';
        }
        msgEl.style.display = 'block';
        setTimeout(function(){ msgEl.style.display = 'none'; }, 2500);
      } catch {
        msgEl.textContent = 'Error de conexión'; msgEl.style.display = 'block';
      }
    });

    // Model save
    document.getElementById('save-model-btn').addEventListener('click', async function(){
      var selected = document.querySelector('input[name="ai-model"]:checked');
      if (!selected) return;
      var msg = document.getElementById('save-model-msg');
      try {
        var res = await fetch('/api/site/texts', { method:'POST', headers: authHeaders(), body: JSON.stringify({ ai_model: selected.value }) });
        var data = await res.json();
        msg.textContent = data.success ? '✓ Guardado' : (data.error || 'Error');
        msg.style.color = data.success ? 'var(--accent)' : 'var(--error)';
        msg.style.display = 'inline';
        setTimeout(function(){ msg.style.display = 'none'; }, 2500);
      } catch {
        msg.textContent = 'Error'; msg.style.display = 'inline';
      }
    });

    // Model radio toggle
    document.getElementById('model-free').addEventListener('change', function(){
      document.getElementById('model-free-label').classList.add('selected');
      document.getElementById('model-custom-label').classList.remove('selected');
    });

    // Model search
    var KNOWN_MODELS = [
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', free: false, cost: 'bajo' },
      { id: 'openai/gpt-4o', name: 'GPT-4o', free: false, cost: 'alto' },
      { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', free: false, cost: 'bajo' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', free: false, cost: 'medio' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', free: false, cost: 'alto' },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', free: true, cost: null },
      { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', free: false, cost: 'medio' },
      { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', free: true, cost: null },
      { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', free: false, cost: 'bajo' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', free: true, cost: null },
      { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B', free: true, cost: null }
    ];

    var searchInput = document.getElementById('model-search');
    var searchResults = document.getElementById('model-search-results');

    searchInput.addEventListener('input', function(){
      var q = searchInput.value.trim().toLowerCase();
      if (!q) { searchResults.style.display = 'none'; return; }
      var matches = KNOWN_MODELS.filter(function(m){
        return m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
      });
      if (!matches.length) { searchResults.style.display = 'none'; return; }
      searchResults.innerHTML = matches.map(function(m){
        var badge = m.free
          ? '<span class="model-badge free">Gratis</span>'
          : (m.cost === 'alto' ? '<span class="model-badge paid-high">De pago</span>' : '<span class="model-badge paid">De pago</span>');
        return '<div class="model-result-item" data-id="' + m.id + '" data-name="' + m.name + '" data-free="' + m.free + '">'
          + '<span>' + m.name + ' ' + badge + '</span>'
          + '<span class="mri-id">' + m.id + '</span></div>';
      }).join('');
      searchResults.style.display = 'block';
      searchResults.querySelectorAll('.model-result-item').forEach(function(item){
        item.addEventListener('click', function(){
          var customLabel = document.getElementById('model-custom-label');
          var customInput = document.getElementById('model-custom');
          var isFree = item.dataset.free === 'true';
          customInput.value = item.dataset.id;
          document.getElementById('model-custom-name').textContent = item.dataset.name;
          document.getElementById('model-custom-desc').textContent = item.dataset.id;
          var badge = document.getElementById('model-custom-badge');
          badge.textContent = isFree ? 'Gratis' : 'De pago';
          badge.className = 'model-badge ' + (isFree ? 'free' : 'paid');
          customLabel.style.display = 'flex';
          customInput.checked = true;
          document.getElementById('model-free-label').classList.remove('selected');
          customLabel.classList.add('selected');
          searchInput.value = '';
          searchResults.style.display = 'none';
        });
      });
    });

    document.addEventListener('click', function(e){
      if (!searchResults.contains(e.target) && e.target !== searchInput) {
        searchResults.style.display = 'none';
      }
    });
  }

  var PAGE_FIELDS = {
    index: [
      { key: 'page_index_title', label: 'Título principal', placeholder: 'Ej: Soluciones para tu empresa', type: 'input' },
      { key: 'page_index_subtitle', label: 'Subtítulo', placeholder: 'Ej: Llevamos tu negocio al siguiente nivel', type: 'input' },
      { key: 'page_index_desc', label: 'Descripción', placeholder: 'Un párrafo breve sobre tu empresa...', type: 'textarea' }
    ],
    quienes: [
      { key: 'page_quienes_title', label: 'Título', placeholder: 'Ej: ¿Quiénes somos?', type: 'input' },
      { key: 'page_quienes_subtitle', label: 'Subtítulo', placeholder: 'Ej: Un equipo comprometido con tu éxito', type: 'input' },
      { key: 'page_quienes_desc', label: 'Texto de la página', placeholder: 'Cuéntanos la historia de tu empresa...', type: 'textarea' }
    ],
    servicios: [
      { key: 'page_servicios_title', label: 'Título', placeholder: 'Ej: Nuestros servicios', type: 'input' },
      { key: 'page_servicios_subtitle', label: 'Subtítulo', placeholder: 'Ej: Todo lo que necesitas en un solo lugar', type: 'input' },
      { key: 'page_servicios_desc', label: 'Descripción de servicios', placeholder: 'Describe tus servicios o productos...', type: 'textarea' }
    ],
    contacto: [
      { key: 'page_contacto_title', label: 'Título', placeholder: 'Ej: Contacta con nosotros', type: 'input' },
      { key: 'page_contacto_subtitle', label: 'Subtítulo', placeholder: 'Ej: Estamos aquí para ayudarte', type: 'input' },
      { key: 'page_contacto_desc', label: 'Texto introductorio', placeholder: 'Ej: Rellena el formulario y te respondemos en 24h', type: 'input' }
    ],
    blog: [
      { key: 'page_blog_title', label: 'Título del blog', placeholder: 'Ej: Noticias y consejos', type: 'input' },
      { key: 'page_blog_subtitle', label: 'Subtítulo', placeholder: 'Ej: Artículos sobre nuestro sector', type: 'input' }
    ]
  };

  function renderPageForm(page) {
    var fields = PAGE_FIELDS[page] || [];
    var html = fields.map(function(f){
      var val = (siteConfig[f.key] || '').replace(/"/g, '&quot;');
      if (f.type === 'textarea') {
        return '<div><label>' + f.label + '</label><textarea rows="4" data-key="' + f.key + '" placeholder="' + f.placeholder + '">' + (siteConfig[f.key] || '') + '</textarea></div>';
      }
      return '<div><label>' + f.label + '</label><input type="text" data-key="' + f.key + '" placeholder="' + f.placeholder + '" value="' + val + '"></div>';
    }).join('');
    document.getElementById('misite-page-form').innerHTML = html;
  }

});
