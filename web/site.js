/* Public site renderer — shared by all public pages */
var _siteConfig = null;

/* THEME (dark mode) */
var ICON_MOON =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>';
var ICON_SUN =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>';

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  var b = document.getElementById("theme-toggle");
  if (!b) return;
  b.innerHTML = t === "dark" ? ICON_SUN : ICON_MOON;
  b.setAttribute(
    "aria-label",
    t === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
  );
}

function initTheme() {
  var s = localStorage.getItem("bl-theme");
  var d = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(s || (d ? "dark" : "light"));
  var b = document.getElementById("theme-toggle");
  if (b && !b._ready) {
    b._ready = true;
    b.addEventListener("click", function () {
      var c = document.documentElement.dataset.theme;
      var n = c === "dark" ? "light" : "dark";
      localStorage.setItem("bl-theme", n);
      setTheme(n);
    });
  }
}

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
    '</span></a><div class="site-nav-actions"><button id="theme-toggle" class="site-nav-icon-btn" aria-label="Cambiar tema"></button><button class="site-nav-toggle" aria-label="Menú" onclick="this.closest(\'nav\').querySelector(\'.site-nav-links\').classList.toggle(\'open\')"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button></div><div class="site-nav-links">' +
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
    '<main class="site-page"><div class="site-page-inner"><h1 class="reveal">' +
    title +
    "</h1>" +
    '<p class="site-page-subtitle reveal">' +
    subtitle +
    "</p>" +
    '<p class="site-page-desc reveal">' +
    desc +
    "</p>" +
    '<form class="site-contact-form reveal" id="contact-form">' +
    '<input type="text" id="contact-name" placeholder="Nombre" required>' +
    '<input type="email" id="contact-email" placeholder="Email" required>' +
    '<textarea rows="5" id="contact-message" placeholder="Mensaje" required></textarea>' +
    '<button type="submit" class="site-btn" id="contact-submit">Enviar</button>' +
    '<p class="site-form-msg" id="contact-form-msg" aria-live="polite"></p>' +
    "</form></div></main>"
  );
}

function whatsappHTML(cfg) {
  if (!cfg.whatsapp_number) return "";
  var prefill = encodeURIComponent(
    "Hola, me interesa " + (cfg.company_name || "vuestra empresa"),
  );
  return (
    '<a href="https://wa.me/' +
    cfg.whatsapp_number +
    "?text=" +
    prefill +
    '" target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp" class="whatsapp-float"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp</a>'
  );
}

function footerHTML(cfg) {
  var company = cfg.company_name || "";
  var year = new Date().getFullYear();
  return (
    '<footer class="site-footer"><div class="site-footer-inner"><span>' +
    (company ? "© " + year + " " + company : "") +
    '</span><div class="site-footer-links"><a href="/quienes-somos">Quiénes somos</a><a href="/servicios">Servicios</a><a href="/contacto">Contacto</a><a href="/blog">Blog</a></div></div></footer>' +
    '<div id="cookie-banner" role="dialog" aria-live="polite" aria-label="Aviso de cookies"><p>Usamos cookies propias para mejorar tu experiencia. Sin tracking de terceros.</p><button id="cookie-accept" class="site-btn">Aceptar</button></div>'
  );
}

var _revealObserver = null;
function initReveals() {
  if (_revealObserver) _revealObserver.disconnect();
  _revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          _revealObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll(".reveal").forEach(function (el) {
    _revealObserver.observe(el);
  });
}

function initCookieConsent() {
  var banner = document.getElementById("cookie-banner");
  if (!banner) return;
  if (localStorage.getItem("bl-cookie-consent") === "accepted") return;
  banner.style.display = "flex";
  var btn = document.getElementById("cookie-accept");
  if (btn && !btn._ready) {
    btn._ready = true;
    btn.addEventListener("click", function () {
      localStorage.setItem("bl-cookie-consent", "accepted");
      banner.style.display = "none";
    });
  }
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
          '<main class="site-hero"><div class="site-hero-inner"><h1 class="reveal">' +
          cfg.page_index_title +
          "</h1>" +
          (cfg.page_index_subtitle
            ? '<p class="site-hero-subtitle reveal">' +
              cfg.page_index_subtitle +
              "</p>"
            : "") +
          (cfg.page_index_desc
            ? '<p class="site-hero-desc reveal">' + cfg.page_index_desc + "</p>"
            : "") +
          '<div class="site-hero-actions reveal"><a href="/servicios" class="site-btn">Ver servicios</a><a href="/contacto" class="site-btn-ghost">Contactar</a></div></div></main>';
      }
    } else if (page === "quienes") {
      if (!cfg.page_quienes_title) {
        content = constructionHTML();
      } else {
        content =
          '<main class="site-page"><div class="site-page-inner"><h1 class="reveal">' +
          cfg.page_quienes_title +
          "</h1>" +
          (cfg.page_quienes_subtitle
            ? '<p class="site-page-subtitle reveal">' +
              cfg.page_quienes_subtitle +
              "</p>"
            : "") +
          (cfg.page_quienes_desc
            ? '<div class="site-page-body reveal">' + cfg.page_quienes_desc + "</div>"
            : "") +
          "</div></main>";
      }
    } else if (page === "servicios") {
      if (!cfg.page_servicios_title) {
        content = constructionHTML();
      } else {
        content =
          '<main class="site-page"><div class="site-page-inner"><h1 class="reveal">' +
          cfg.page_servicios_title +
          "</h1>" +
          (cfg.page_servicios_subtitle
            ? '<p class="site-page-subtitle reveal">' +
              cfg.page_servicios_subtitle +
              "</p>"
            : "") +
          (cfg.page_servicios_desc
            ? '<div class="site-page-body reveal">' +
              cfg.page_servicios_desc +
              "</div>"
            : "") +
          "</div></main>";
      }
    } else if (page === "contacto") {
      content = contactHTML(cfg);
    } else if (page === "blog") {
      content =
        '<main class="site-page"><div class="site-page-inner"><h1 class="reveal">' +
        (cfg.page_blog_title || "Blog") +
        "</h1>" +
        (cfg.page_blog_subtitle
          ? '<p class="site-page-subtitle reveal">' + cfg.page_blog_subtitle + "</p>"
          : "") +
        '<div id="blog-posts-list"><p class="site-loading">Cargando artículos…</p></div></div></main>';
    }

    html += content + footerHTML(cfg) + whatsappHTML(cfg);
    root.innerHTML = html;
    initTheme();
    initCookieConsent();
    initReveals();

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
        html += footerHTML(cfg) + whatsappHTML(cfg);
        root.innerHTML = html;
        initTheme();
        initCookieConsent();
        initReveals();
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
          footerHTML(cfg) +
          whatsappHTML(cfg);
        initTheme();
        initCookieConsent();
        initReveals();
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
