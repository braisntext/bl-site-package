/* Public site renderer — shared by all public pages */
var _siteConfig = null;

function getConfig(cb) {
  if (_siteConfig) return cb(_siteConfig);
  fetch("/api/site/config")
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      _siteConfig = data;
      cb(data);
    })
    .catch(function () {
      cb({});
    });
}

function logoHTML(cfg) {
  if (cfg.logo_ext) {
    return (
      '<img src="/uploads/logo.' +
      cfg.logo_ext +
      '" alt="' +
      (cfg.company_name || "") +
      '" class="site-logo-img">'
    );
  }
  return '<div class="site-logo-placeholder"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>';
}

function navHTML(active, cfg) {
  var company = cfg.company_name || "Mi empresa";
  var links = [
    { href: "/", label: "Inicio", key: "index" },
    { href: "/quienes-somos", label: "Quiénes somos", key: "quienes" },
    { href: "/servicios", label: "Servicios", key: "servicios" },
    { href: "/contacto", label: "Contacto", key: "contacto" },
    { href: "/blog", label: "Blog", key: "blog" },
  ];
  var linksHTML = links
    .map(function (l) {
      return (
        '<a href="' +
        l.href +
        '" class="site-nav-link' +
        (active === l.key ? " active" : "") +
        '">' +
        l.label +
        "</a>"
      );
    })
    .join("");
  return (
    '<nav class="site-nav"><div class="site-nav-inner"><a href="/" class="site-nav-brand">' +
    logoHTML(cfg) +
    "<span>" +
    company +
    '</span></a><button class="site-nav-toggle" aria-label="Menú" onclick="this.closest(\'nav\').querySelector(\'.site-nav-links\').classList.toggle(\'open\')"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button><div class="site-nav-links">' +
    linksHTML +
    "</div></div></nav>"
  );
}

function constructionHTML() {
  return '<div class="construction-wrap"><div class="construction-icon">🚧</div><h1>Página en construcción</h1><p>Estamos preparando esta página. Vuelve pronto.</p><a href="/" class="site-btn">Volver al inicio</a></div>';
}

function contactHTML(cfg) {
  var title = cfg.page_contacto_title || "Contacto";
  var subtitle =
    cfg.page_contacto_subtitle ||
    "Escríbenos y te responderemos lo antes posible.";
  var desc =
    cfg.page_contacto_desc ||
    "Cuéntanos qué necesitas y te contactaremos con una propuesta clara.";
  return (
    '<main class="site-page"><div class="site-page-inner"><h1>' +
    title +
    "</h1>" +
    '<p class="site-page-subtitle">' +
    subtitle +
    "</p>" +
    '<p class="site-page-desc">' +
    desc +
    "</p>" +
    '<form class="site-contact-form" id="contact-form">' +
    '<input type="text" id="contact-name" placeholder="Nombre" required>' +
    '<input type="email" id="contact-email" placeholder="Email" required>' +
    '<textarea rows="5" id="contact-message" placeholder="Mensaje" required></textarea>' +
    '<button type="submit" class="site-btn" id="contact-submit">Enviar</button>' +
    '<p class="site-form-msg" id="contact-form-msg" aria-live="polite"></p>' +
    "</form></div></main>"
  );
}

function footerHTML(cfg) {
  var company = cfg.company_name || "";
  var year = new Date().getFullYear();
  return (
    '<footer class="site-footer"><div class="site-footer-inner"><span>' +
    (company ? "© " + year + " " + company : "") +
    '</span><div class="site-footer-links"><a href="/quienes-somos">Quiénes somos</a><a href="/servicios">Servicios</a><a href="/contacto">Contacto</a><a href="/blog">Blog</a></div></div></footer>'
  );
}

function updateHead(page, cfg, options) {
  var titles = {
    index: cfg.page_index_title || cfg.company_name || "Inicio",
    quienes: cfg.page_quienes_title || "Quiénes somos",
    servicios: cfg.page_servicios_title || "Servicios",
    contacto: cfg.page_contacto_title || "Contacto",
    blog: cfg.page_blog_title || "Blog",
  };
  var descs = {
    index: cfg.page_index_desc || cfg.page_index_subtitle || "",
    quienes: cfg.page_quienes_desc || cfg.page_quienes_subtitle || "",
    servicios: cfg.page_servicios_desc || cfg.page_servicios_subtitle || "",
    contacto: cfg.page_contacto_desc || cfg.page_contacto_subtitle || "",
    blog: cfg.page_blog_subtitle || "",
  };

  var company = cfg.company_name || "";
  var titleValue = options?.title || titles[page] || company;
  var desc = options?.description || descs[page] || "";
  var title = titleValue
    ? company
      ? titleValue + " | " + company
      : titleValue
    : company;

  document.title = title;

  var metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = desc;

  var ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    document.head.appendChild(ogTitle);
  }
  ogTitle.content = title;

  var ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement("meta");
    ogDesc.setAttribute("property", "og:description");
    document.head.appendChild(ogDesc);
  }
  ogDesc.content = desc;

  var ogType = document.querySelector('meta[property="og:type"]');
  if (!ogType) {
    ogType = document.createElement("meta");
    ogType.setAttribute("property", "og:type");
    document.head.appendChild(ogType);
  }
  ogType.content = "website";
}

window.renderPage = function (page) {
  getConfig(function (cfg) {
    updateHead(page, cfg);

    var root = document.getElementById("site-root");
    var html = navHTML(page, cfg);
    var content = "";

    if (page === "index") {
      if (!cfg.page_index_title) {
        content = constructionHTML();
      } else {
        content =
          '<main class="site-hero"><div class="site-hero-inner"><h1>' +
          cfg.page_index_title +
          "</h1>" +
          (cfg.page_index_subtitle
            ? '<p class="site-hero-subtitle">' +
              cfg.page_index_subtitle +
              "</p>"
            : "") +
          (cfg.page_index_desc
            ? '<p class="site-hero-desc">' + cfg.page_index_desc + "</p>"
            : "") +
          '<div class="site-hero-actions"><a href="/servicios" class="site-btn">Ver servicios</a><a href="/contacto" class="site-btn-ghost">Contactar</a></div></div></main>';
      }
    } else if (page === "quienes") {
      if (!cfg.page_quienes_title) {
        content = constructionHTML();
      } else {
        content =
          '<main class="site-page"><div class="site-page-inner"><h1>' +
          cfg.page_quienes_title +
          "</h1>" +
          (cfg.page_quienes_subtitle
            ? '<p class="site-page-subtitle">' +
              cfg.page_quienes_subtitle +
              "</p>"
            : "") +
          (cfg.page_quienes_desc
            ? '<div class="site-page-body">' + cfg.page_quienes_desc + "</div>"
            : "") +
          "</div></main>";
      }
    } else if (page === "servicios") {
      if (!cfg.page_servicios_title) {
        content = constructionHTML();
      } else {
        content =
          '<main class="site-page"><div class="site-page-inner"><h1>' +
          cfg.page_servicios_title +
          "</h1>" +
          (cfg.page_servicios_subtitle
            ? '<p class="site-page-subtitle">' +
              cfg.page_servicios_subtitle +
              "</p>"
            : "") +
          (cfg.page_servicios_desc
            ? '<div class="site-page-body">' +
              cfg.page_servicios_desc +
              "</div>"
            : "") +
          "</div></main>";
      }
    } else if (page === "contacto") {
      content = contactHTML(cfg);
    } else if (page === "blog") {
      content =
        '<main class="site-page"><div class="site-page-inner"><h1>' +
        (cfg.page_blog_title || "Blog") +
        "</h1>" +
        (cfg.page_blog_subtitle
          ? '<p class="site-page-subtitle">' + cfg.page_blog_subtitle + "</p>"
          : "") +
        '<div id="blog-posts-list"><p class="site-loading">Cargando artículos…</p></div></div></main>';
    }

    html += content + footerHTML(cfg);
    root.innerHTML = html;

    if (page === "contacto") initContactForm();
    if (page === "blog") loadBlogPosts();
  });
};

function initContactForm() {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var nameInput = document.getElementById("contact-name");
  var emailInput = document.getElementById("contact-email");
  var messageInput = document.getElementById("contact-message");
  var submitButton = document.getElementById("contact-submit");
  var msg = document.getElementById("contact-form-msg");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    submitButton.disabled = true;
    msg.textContent = "";

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        message: messageInput.value.trim(),
      }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data.success) {
          msg.textContent =
            result.data.error || "No se pudo enviar el mensaje.";
          msg.style.color = "var(--accent)";
          return;
        }

        form.reset();
        msg.textContent = "Gracias. Hemos recibido tu mensaje.";
        msg.style.color = "var(--accent)";
      })
      .catch(function () {
        msg.textContent = "No se pudo enviar el mensaje.";
        msg.style.color = "var(--accent)";
      })
      .finally(function () {
        submitButton.disabled = false;
      });
  });
}

function loadBlogPosts() {
  fetch("/api/blog/posts")
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      var list = document.getElementById("blog-posts-list");
      if (!list) return;
      var posts = (data.posts || []).filter(function (p) {
        return p.status === "published";
      });
      if (!posts.length) {
        list.innerHTML =
          '<p class="site-empty">Aún no hay artículos publicados.</p>';
        return;
      }
      list.innerHTML = posts
        .map(function (p) {
          return (
            '<article class="site-post-card"><h2><a href="/blog/' +
            p.slug +
            '">' +
            p.title +
            "</a></h2>" +
            (p.excerpt ? "<p>" + p.excerpt + "</p>" : "") +
            '<span class="site-post-date">' +
            new Date(p.created_at).toLocaleDateString("es-ES") +
            "</span></article>"
          );
        })
        .join("");
    })
    .catch(function () {
      var list = document.getElementById("blog-posts-list");
      if (list)
        list.innerHTML =
          '<p class="site-empty">No se pudieron cargar los artículos.</p>';
    });
}

// Render a single blog post — called from blog-post.html
window.renderBlogPost = function () {
  var slug = window.location.pathname.replace("/blog/", "").replace(/\//g, "");
  if (!slug) {
    window.location.href = "/blog";
    return;
  }

  fetch("/api/blog/posts/" + slug)
    .then(function (r) {
      if (!r.ok) throw new Error("not found");
      return r.json();
    })
    .then(function (post) {
      getConfig(function (cfg) {
        updateHead("blog", cfg, {
          title: post.title,
          description: post.excerpt || "",
        });
        var root = document.getElementById("site-root");
        var html = navHTML("blog", cfg);
        html +=
          '<main class="site-page"><div class="site-page-inner site-post-content">' +
          '<a href="/blog" class="site-back-link">← Volver al blog</a>' +
          "<h1>" +
          post.title +
          "</h1>" +
          '<span class="site-post-date">' +
          new Date(post.created_at).toLocaleDateString("es-ES") +
          "</span>" +
          '<div class="site-post-body">' +
          formatContent(post.content) +
          "</div>" +
          "</div></main>";
        html += footerHTML(cfg);
        root.innerHTML = html;
      });
    })
    .catch(function () {
      getConfig(function (cfg) {
        updateHead("blog", cfg, {
          title: "Artículo no encontrado",
          description: "",
        });
        var root = document.getElementById("site-root");
        root.innerHTML =
          navHTML("blog", cfg) +
          '<main class="site-page"><div class="site-page-inner"><h1>Artículo no encontrado</h1><a href="/blog" class="site-btn">Volver al blog</a></div></main>' +
          footerHTML(cfg);
      });
    });
};

// Convert plain text content to HTML paragraphs
function formatContent(text) {
  if (!text) return "";
  return text
    .split(/\n\n+/)
    .map(function (p) {
      return "<p>" + p.replace(/\n/g, "<br>") + "</p>";
    })
    .join("");
}
