/* Client-side cart for the reserve-and-pickup catalog. Cart state lives in
   localStorage (no server session) — checkout POSTs it to /api/reservations,
   which recomputes prices server-side from the current catalog. */

var CART_KEY = "bl_cart_v1";

function getCart() {
  try {
    var raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(sku, name, priceCents, qty) {
  var cart = getCart();
  var existing = cart.find(function (i) {
    return i.sku === sku;
  });
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ sku: sku, name: name, priceCents: priceCents, quantity: qty });
  }
  saveCart(cart);
}

function removeFromCart(sku) {
  saveCart(
    getCart().filter(function (i) {
      return i.sku !== sku;
    }),
  );
}

function updateQty(sku, qty) {
  var cart = getCart();
  var item = cart.find(function (i) {
    return i.sku === sku;
  });
  if (!item) return;
  item.quantity = Math.max(1, qty);
  saveCart(cart);
}

function cartCount(cart) {
  return cart.reduce(function (sum, i) {
    return sum + i.quantity;
  }, 0);
}

function cartTotalCents(cart) {
  return cart.reduce(function (sum, i) {
    return sum + i.priceCents * i.quantity;
  }, 0);
}

function formatEur(cents) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function updateCartBadge() {
  var badge = document.getElementById("cart-count-badge");
  if (!badge) return;
  var count = cartCount(getCart());
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

function initAddToCartButtons() {
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-add-to-cart]");
    if (!btn || btn.disabled) return;

    var sku = btn.dataset.sku;
    var name = btn.dataset.name;
    var priceCents = parseInt(btn.dataset.priceCents, 10) || 0;
    var qty = 1;
    var qtyInputId = btn.dataset.qtyInput;
    if (qtyInputId) {
      var qtyInput = document.getElementById(qtyInputId);
      if (qtyInput) qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
    }

    addToCart(sku, name, priceCents, qty);
    var original = btn.textContent;
    btn.textContent = "Añadido ✓";
    setTimeout(function () {
      btn.textContent = original;
    }, 1200);
  });
}

function initCategoryFilter() {
  var pillsWrap = document.getElementById("category-pills");
  var grid = document.getElementById("product-grid");
  if (!pillsWrap || !grid) return;

  pillsWrap.addEventListener("click", function (e) {
    var pill = e.target.closest(".category-pill");
    if (!pill) return;

    pillsWrap.querySelectorAll(".category-pill").forEach(function (p) {
      p.classList.remove("active");
    });
    pill.classList.add("active");

    var category = pill.dataset.category;
    grid.querySelectorAll(".product-card").forEach(function (card) {
      var show = category === "all" || card.dataset.category === category;
      card.style.display = show ? "" : "none";
    });
  });
}

function renderCartPage() {
  var table = document.getElementById("cart-table");
  var itemsBody = document.getElementById("cart-items");
  var totalCell = document.getElementById("cart-total");
  var emptyMsg = document.getElementById("cart-empty-msg");
  var form = document.getElementById("checkout-form");
  if (!table || !itemsBody) return;

  var cart = getCart();
  if (cart.length === 0) {
    table.hidden = true;
    if (form) form.hidden = true;
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }

  if (emptyMsg) emptyMsg.hidden = true;
  table.hidden = false;
  if (form) form.hidden = false;

  itemsBody.textContent = "";
  cart.forEach(function (item) {
    var tr = document.createElement("tr");

    var nameCell = document.createElement("td");
    nameCell.textContent = item.name;

    var qtyCell = document.createElement("td");
    var qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.value = String(item.quantity);
    qtyInput.className = "cart-item-qty";
    qtyInput.dataset.sku = item.sku;
    qtyCell.appendChild(qtyInput);

    var priceCell = document.createElement("td");
    priceCell.textContent = formatEur(item.priceCents * item.quantity);

    var actionCell = document.createElement("td");
    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "cart-item-remove";
    removeBtn.dataset.sku = item.sku;
    removeBtn.textContent = "Quitar";
    actionCell.appendChild(removeBtn);

    tr.appendChild(nameCell);
    tr.appendChild(qtyCell);
    tr.appendChild(priceCell);
    tr.appendChild(actionCell);
    itemsBody.appendChild(tr);
  });
  totalCell.textContent = formatEur(cartTotalCents(cart));
}

function initCartPage() {
  var table = document.getElementById("cart-table");
  if (!table) return;

  renderCartPage();

  table.addEventListener("change", function (e) {
    if (!e.target.classList.contains("cart-item-qty")) return;
    updateQty(e.target.dataset.sku, parseInt(e.target.value, 10) || 1);
    renderCartPage();
  });

  table.addEventListener("click", function (e) {
    var btn = e.target.closest(".cart-item-remove");
    if (!btn) return;
    removeFromCart(btn.dataset.sku);
    renderCartPage();
  });

  var form = document.getElementById("checkout-form");
  var successBox = document.getElementById("checkout-success");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var cart = getCart();
    if (cart.length === 0) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: form.customer_name.value.trim(),
        customer_email: form.customer_email.value.trim(),
        customer_phone: form.customer_phone.value.trim(),
        notes: form.notes.value.trim(),
        items: cart.map(function (i) {
          return { sku: i.sku, quantity: i.quantity };
        }),
      }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data.success) {
          successBox.hidden = false;
          successBox.textContent = result.data.error || "No se pudo confirmar la reserva.";
          successBox.style.color = "var(--accent)";
          return;
        }
        localStorage.removeItem(CART_KEY);
        updateCartBadge();
        table.hidden = true;
        form.hidden = true;
        successBox.hidden = false;
        successBox.textContent =
          "Reserva confirmada (nº " + result.data.id + "). Te avisaremos cuando esté lista para recoger en tienda.";
        successBox.style.color = "var(--text-primary)";
      })
      .catch(function () {
        successBox.hidden = false;
        successBox.textContent = "No se pudo confirmar la reserva.";
        successBox.style.color = "var(--accent)";
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  updateCartBadge();
  initAddToCartButtons();
  initCategoryFilter();
  initCartPage();
});
