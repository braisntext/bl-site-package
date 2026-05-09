/* Public site renderer — shared by all public pages */
var _siteConfig = null;

function getConfig(cb) {
  if (_siteConfig) return cb(_siteConfig);
  fetch('/api/site/config')
    .then(function(r){ return r.json(); })
    .then(function(data){ _siteConfig = data; cb(data); })
    .catch(function(){ cb({}); });
}

function logoHTML(cfg) {
  if (cfg.logo_ext) {
    return '<img src="/uploads/logo.' + cfg.logo_ext + '" alt="' + (cfg.company_name || '') + '" class="site-logo-img">';
  }
  return '<div class="site-logo-placeholder"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>';
}

function navHTML(active, cfg) {
  var company = cfg.company_name || 'Mi empresa';
  var links = [
    { href: '/', label: 'Inicio', key: 'index' },
    { href: '/quienes-somos', label: 'Quiénes somos', key: 'quienes' },
    { href: '/servicios', label: 'Servicios', key: 'servicios' },
    { href: '/contacto', label: 'Contacto', key: 'contacto' },
    { href: '/blog', label: 'Blog', key: 'blog' }
  ];
  var linksHTML = links.map(function(l){
    return '<a href="' + l.href + '" class="site-nav-link' + (active === l.key ? ' active' : '') + '">' + l.label + '</a>';
  }).join('');
  return '<nav class="site-nav"><div class="site-nav-inner"><a href="/" class="site-nav-brand">' + logoHTML(cfg) + '<span>' + company + '</span></a><div class="site-nav-links">' + linksHTML + '</div></nav>';
}

function constructionHTML() {
  return '<div class="construction-wrap"><div class="construction-icon">🚧</div><h1>Página en construcción</h1><p>Estamos preparando esta página. Vuelve pronto.</p><a href="/" class="site-btn">Volver al inicio</a></div>';
}

function footerHTML(cfg) {
  var company = cfg.company_name || '';
  var year = new Date().getFullYear();
  return '<footer class="site-footer"><div class="site-footer-inner"><span>' + (company ? '© ' + year + ' ' + company : '') + '</span><div class="site-footer-links"><a href="/quienes-somos">Quiénes somos</a><a href="/servicios">Servicios</a><a href="/contacto">Contacto</a><a href="/blog">Blog</a></div></div></footer>';
}

window.renderPage = function(page) {
  getConfig(function(cfg) {
    var root = document.getElementById('site-root');
    var html = navHTML(page, cfg);
    var content = '';

    if (page === 'index') {
      document.title = cfg.company_name || 'Inicio';
      if (!cfg.page_index_title) {
        content = constructionHTML();
      } else {
        content = '<main class="site-hero"><div class="site-hero-inner"><h1>' + cfg.page_index_title + '</h1>' +
          (cfg.page_index_subtitle ? '<p class="site-hero-subtitle">' + cfg.page_index_subtitle + '</p>' : '') +
          (cfg.page_index_desc ? '<p class="site-hero-desc">' + cfg.page_index_desc + '</p>' : '') +
          '<div class="site-hero-actions"><a href="/servicios" class="site-btn">Ver servicios</a><a href="/contacto" class="site-btn-ghost">Contactar</a></div></div></main>';
      }
    } else if (page === 'quienes') {
      document.title = (cfg.page_quienes_title || 'Quiénes somos') + (cfg.company_name ? ' — ' + cfg.company_name : '');
      if (!cfg.page_quienes_title) {
        content = constructionHTML();
      } else {
        content = '<main class="site-page"><div class="site-page-inner"><h1>' + cfg.page_quienes_title + '</h1>' +
          (cfg.page_quienes_subtitle ? '<p class="site-page-subtitle">' + cfg.page_quienes_subtitle + '</p>' : '') +
          (cfg.page_quienes_desc ? '<div class="site-page-body">' + cfg.page_quienes_desc + '</div>' : '') +
          '</div></main>';
      }
    } else if (page === 'servicios') {
      document.title = (cfg.page_servicios_title || 'Servicios') + (cfg.company_name ? ' — ' + cfg.company_name : '');
      if (!cfg.page_servicios_title) {
        content = constructionHTML();
      } else {
        content = '<main class="site-page"><div class="site-page-inner"><h1>' + cfg.page_servicios_title + '</h1>' +
          (cfg.page_servicios_subtitle ? '<p class="site-page-subtitle">' + cfg.page_servicios_subtitle + '</p>' : '') +
          (cfg.page_servicios_desc ? '<div class="site-page-body">' + cfg.page_servicios_desc + '</div>' : '') +
          '</div></main>';
      }
    } else if (page === 'contacto') {
      document.title = (cfg.page_contacto_title || 'Contacto') + (cfg.company_name ? ' — ' + cfg.company_name : '');
      if (!cfg.page_contacto_title) {
        content = constructionHTML();
      } else {
        content = '<main class="site-page"><div class="site-page-inner"><h1>' + cfg.page_contacto_title + '</h1>' +
          (cfg.page_contacto_subtitle ? '<p class="site-page-subtitle">' + cfg.page_contacto_subtitle + '</p>' : '') +
          (cfg.page_contacto_desc ? '<p class="site-page-desc">' + cfg.page_contacto_desc + '</p>' : '') +
          '<form class="site-contact-form" onsubmit="return false;"><input type="text" placeholder="Tu nombre" required><input type="email" placeholder="Tu email" required><textarea rows="4" placeholder="Tu mensaje" required></textarea><button type="submit" class="site-btn">Enviar mensaje</button></form>' +
          '</div></main>';
      }
    } else if (page === 'blog') {
      document.title = (cfg.page_blog_title || 'Blog') + (cfg.company_name ? ' — ' + cfg.company_name : '');
      content = '<main class="site-page"><div class="site-page-inner"><h1>' + (cfg.page_blog_title || 'Blog') + '</h1>' +
        (cfg.page_blog_subtitle ? '<p class="site-page-subtitle">' + cfg.page_blog_subtitle + '</p>' : '') +
        '<div id="blog-posts-list"><p class="site-loading">Cargando artículos…</p></div></div></main>';
    }

    html += content + footerHTML(cfg);
    root.innerHTML = html;

    if (page === 'blog') loadBlogPosts();
  });
};

function loadBlogPosts() {
  fetch('/api/blog/posts')
    .then(function(r){ return r.json(); })
    .then(function(data) {
      var list = document.getElementById('blog-posts-list');
      if (!list) return;
      var posts = (data.posts || []).filter(function(p){ return p.status === 'published'; });
      if (!posts.length) {
        list.innerHTML = '<p class="site-empty">Aún no hay artículos publicados.</p>';
        return;
      }
      list.innerHTML = posts.map(function(p){
        return '<article class="site-post-card"><h2><a href="/blog/' + p.slug + '">' + p.title + '</a></h2>' +
          (p.excerpt ? '<p>' + p.excerpt + '</p>' : '') +
          '<span class="site-post-date">' + new Date(p.created_at).toLocaleDateString('es-ES') + '</span></article>';
      }).join('');
    })
    .catch(function(){
      var list = document.getElementById('blog-posts-list');
      if (list) list.innerHTML = '<p class="site-empty">No se pudieron cargar los artículos.</p>';
    });
}

// Render a single blog post — called from blog-post.html
window.renderBlogPost = function() {
  var slug = window.location.pathname.replace('/blog/', '').replace(/\//g, '');
  if (!slug) { window.location.href = '/blog'; return; }

  fetch('/api/blog/posts/' + slug)
    .then(function(r){
      if (!r.ok) throw new Error('not found');
      return r.json();
    })
    .then(function(post) {
      getConfig(function(cfg) {
        document.title = post.title + (cfg.company_name ? ' — ' + cfg.company_name : '');
        var root = document.getElementById('site-root');
        var html = navHTML('blog', cfg);
        html += '<main class="site-page"><div class="site-page-inner site-post-content">' +
          '<a href="/blog" class="site-back-link">← Volver al blog</a>' +
          '<h1>' + post.title + '</h1>' +
          '<span class="site-post-date">' + new Date(post.created_at).toLocaleDateString('es-ES') + '</span>' +
          '<div class="site-post-body">' + formatContent(post.content) + '</div>' +
          '</div></main>';
        html += footerHTML(cfg);
        root.innerHTML = html;
      });
    })
    .catch(function() {
      getConfig(function(cfg) {
        var root = document.getElementById('site-root');
        root.innerHTML = navHTML('blog', cfg) +
          '<main class="site-page"><div class="site-page-inner"><h1>Artículo no encontrado</h1><a href="/blog" class="site-btn">Volver al blog</a></div></main>' +
          footerHTML(cfg);
      });
    });
};

// Convert plain text content to HTML paragraphs
function formatContent(text) {
  if (!text) return '';
  return text.split(/\n\n+/).map(function(p){
    return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
  }).join('');
}
