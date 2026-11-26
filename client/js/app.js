const API_BASE = "http://localhost:3000";

const app = document.getElementById("app");
const navHome = document.getElementById("nav-home");
const navDashboard = document.getElementById("nav-dashboard");
const navDetails = document.getElementById("nav-details");

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error(
      "Cannot reach the API. Is the server running on " + API_BASE + "?",
    );
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const msg = data?.details
      ? `${data.error} ${data.details.join(" ")}`
      : data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

function toast(message) {
  const t = document.getElementById("toast");
  t.textContent = message;
  t.hidden = false;
  setTimeout(() => (t.hidden = true), 2500);
}

function setActiveNav(view) {
  navHome.classList.toggle("active", view === "home");
  navDashboard.classList.toggle("active", view === "dashboard");
  navDetails.classList.toggle("active", view === "details");
}

const money = (n) => Number(n || 0).toFixed(2) + " €";
const goHome = () => {
  location.hash = "#/";
};

let charts = {};
function destroyCharts() {
  Object.values(charts).forEach((c) => {
    try {
      c.destroy();
    } catch {
      /* ignore */
    }
  });
  charts = {};
}

function router() {
  destroyCharts();
  const hash = location.hash || "#/";
  if (hash === "#/new") return showDetails(null);
  if (hash === "#/dashboard") return showDashboard();
  const m = hash.match(/^#\/product\/(\d+)$/);
  if (m) return showDetails(Number(m[1]));
  return showHome();
}
window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);

let lastQuery = "";

async function showHome() {
  setActiveNav("home");
  app.innerHTML = `
    <div class="card">
      <div class="row between">
        <h2 style="margin:0">Products</h2>
        <div class="row">
          <a class="btn secondary" href="#/dashboard" style="text-decoration:none">📊 Dashboard</a>
          <button class="btn success" id="btn-new">+ New Product</button>
        </div>
      </div>
      <form id="search-form" class="row" style="margin-top:14px">
        <input id="search-input" style="flex:1" placeholder="Search by name or description (e.g. wireless, office chair)..." value="${esc(lastQuery)}" />
        <button class="btn" type="submit">Search</button>
        <button class="btn secondary" type="button" id="btn-clear">Clear</button>
      </form>
      <div id="list-status" class="muted" style="margin-top:12px"></div>
      <div id="list"></div>
    </div>`;

  document.getElementById("btn-new").onclick = () => (location.hash = "#/new");
  document.getElementById("search-form").onsubmit = (e) => {
    e.preventDefault();
    lastQuery = document.getElementById("search-input").value.trim();
    loadList();
  };
  document.getElementById("btn-clear").onclick = () => {
    lastQuery = "";
    document.getElementById("search-input").value = "";
    loadList();
  };

  loadList();
}

async function loadList() {
  const status = document.getElementById("list-status");
  const list = document.getElementById("list");
  status.textContent = "Loading...";
  list.innerHTML = "";
  try {
    const path = lastQuery
      ? `/products/search?query=${encodeURIComponent(lastQuery)}`
      : "/products";
    const items = await api(path);
    status.textContent = lastQuery
      ? `${items.length} result(s) for "${lastQuery}"`
      : `Showing all ${items.length} products`;
    if (!items.length) {
      list.innerHTML = '<p class="muted">No products found.</p>';
      return;
    }

    list.innerHTML = `
      <table>
        <thead><tr><th></th><th>ID</th><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th></tr></thead>
        <tbody>
          ${items
            .map((p) => {
              const lowStock = p.quantity_in_stock <= p.reorder_level;
              const neverSold = !p.units_sold;
              return `
            <tr data-id="${p.product_id}">
              <td>${p.image_url ? `<img src="${esc(p.image_url)}" alt="" class="thumb" onerror="this.style.display='none'">` : '<span class="muted">—</span>'}</td>
              <td>${p.product_id}</td>
              <td>${esc(p.name)}</td>
              <td>${esc(p.sku)}</td>
              <td>${esc(p.category)}</td>
              <td>${money(p.price)}</td>
              <td>${p.quantity_in_stock}
                <span class="badge ${lowStock ? "low" : "ok"}">${lowStock ? "Low" : "OK"}</span>
              </td>
              <td>${p.units_sold || 0}
                ${neverSold ? '<span class="badge neutral">Never sold</span>' : ""}
              </td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>`;
    list.querySelectorAll("tbody tr").forEach((tr) => {
      tr.onclick = () => (location.hash = `#/product/${tr.dataset.id}`);
    });
  } catch (err) {
    status.textContent = "";
    list.innerHTML = `<div class="error-box">${esc(err.message)}</div>`;
  }
}

async function showDashboard() {
  setActiveNav("dashboard");
  app.innerHTML = `
    <div class="row between" style="margin-bottom:16px">
      <h2 style="margin:0">Sales Dashboard</h2>
      <button class="btn secondary" id="btn-back-dash">← Back to Home</button>
    </div>
    <div id="stats" class="stats-grid"></div>
    <div class="card" style="margin-top:16px">
      <h3 style="margin-top:0">Revenue by product (Top 5)</h3>
      <div class="chart-wrap" style="height: 340px"><canvas id="chart-top"></canvas></div>
    </div>
    <div class="chart-grid" style="margin-top:16px">
      <div class="card">
        <h3 style="margin-top:0">Revenue by category</h3>
        <div class="chart-wrap" style="height: 300px"><canvas id="chart-cat-revenue"></canvas></div>
      </div>
      <div class="card">
        <h3 style="margin-top:0">Units sold by category</h3>
        <div class="chart-wrap" style="height: 300px"><canvas id="chart-cat-sold"></canvas></div>
      </div>
    </div>`;

  document.getElementById("btn-back-dash").onclick = goHome;

  let stats;
  try {
    stats = await api("/products/stats");
  } catch (err) {
    document.getElementById("stats").innerHTML =
      `<div class="error-box">${esc(err.message)}</div>`;
    return;
  }

  document.getElementById("stats").innerHTML = `
    <div class="stat"><span>Inventory value</span><strong>${money(stats.totals.total_inventory_value)}</strong></div>
    <div class="stat"><span>Revenue so far</span><strong>${money(stats.totals.total_revenue)}</strong></div>
    <div class="stat"><span>Units sold</span><strong>${stats.totals.total_units_sold}</strong></div>
    <div class="stat"><span>Never sold</span><strong>${stats.totals.products_never_sold}</strong></div>
    <div class="stat"><span>Low stock</span><strong>${stats.totals.low_stock_count}</strong></div>
  `;

  if (typeof Chart === "undefined") {
    document.querySelectorAll(".chart-wrap").forEach((el) => {
      el.innerHTML =
        '<div class="error-box">Chart.js not loaded. Check your internet connection (it is loaded from CDN).</div>';
    });
    return;
  }

  const topCanvas = document.getElementById("chart-top");
  if (topCanvas) {
    charts.top = new Chart(topCanvas, {
      type: "bar",
      data: {
        labels: stats.top_products.map((p) => p.name),
        datasets: [
          {
            label: "Revenue (€)",
            data: stats.top_products.map((p) => p.total_revenue),
            backgroundColor: "rgba(3, 50, 34, 0.8)",
            borderColor: "rgba(139, 168, 158, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "x", // Forces vertical bars
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  const catRevCanvas = document.getElementById("chart-cat-revenue");
  if (catRevCanvas) {
    charts.catRevenue = new Chart(catRevCanvas, {
      type: "doughnut",
      data: {
        labels: stats.by_category.map((c) => c.category),
        datasets: [
          {
            data: stats.by_category.map((c) => c.revenue),
            backgroundColor: [
              "#1f4e79",
              "#2e8b57",
              "#c0392b",
              "#f0a500",
              "#6b7280",
              "#8e44ad",
              "#16a085",
            ],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  const catSoldCanvas = document.getElementById("chart-cat-sold");
  if (catSoldCanvas) {
    charts.catSold = new Chart(catSoldCanvas, {
      type: "bar",
      data: {
        labels: stats.by_category.map((c) => c.category),
        datasets: [
          {
            label: "Units sold",
            data: stats.by_category.map((c) => c.units_sold),
            backgroundColor: "rgba(46, 139, 87, 0.8)",
            borderColor: "rgba(46, 139, 87, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }
}

async function showDetails(productId) {
  setActiveNav("details");
  const isNew = productId === null;
  app.innerHTML = `<div class="card muted">Loading...</div>`;

  let product = null;
  let suppliers = [];
  try {
    suppliers = await api("/suppliers");
    if (!isNew) product = await api(`/products/${productId}`);
  } catch (err) {
    app.innerHTML = `<div class="card"><div class="error-box">${esc(err.message)}</div>
      <p><button class="btn secondary" id="back">← Back to Home</button></p></div>`;
    document.getElementById("back").onclick = goHome;
    return;
  }

  const p = product || {
    name: "",
    sku: "",
    category: "",
    price: "",
    quantity_in_stock: "",
    reorder_level: "",
    supplier_id: "",
    description: "",
    image_url: "",
    units_sold: 0,
    total_revenue: 0,
    last_sold_at: null,
  };
  const dis = isNew ? "" : "disabled";

  app.innerHTML = `
    <div class="row between">
      <h2 style="margin:0">${isNew ? "New Product" : "Product Details"}</h2>
    </div>
    <div class="details-grid">
      <form id="product-form" class="card" novalidate>
        ${!isNew && p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" class="hero-img" onerror="this.style.display='none'">` : ""}
        <div class="form-grid">
          ${isNew ? "" : `<div><label>Product ID</label><input value="${p.product_id}" disabled /></div><div></div>`}
          <div class="full"><label>Name <span class="req">*</span></label><input name="name" value="${esc(p.name)}" ${dis} /></div>
          <div><label>SKU <span class="req">*</span></label><input name="sku" value="${esc(p.sku)}" ${dis} /></div>
          <div><label>Category <span class="req">*</span></label><input name="category" value="${esc(p.category)}" ${dis} /></div>
          <div><label>Price (€) <span class="req">*</span></label><input name="price" type="number" step="0.01" min="0" value="${esc(p.price)}" ${dis} /></div>
          <div><label>Quantity in stock <span class="req">*</span></label><input name="quantity_in_stock" type="number" step="1" min="0" value="${esc(p.quantity_in_stock)}" ${dis} /></div>
          <div><label>Reorder level <span class="req">*</span></label><input name="reorder_level" type="number" step="1" min="0" value="${esc(p.reorder_level)}" ${dis} /></div>
          <div><label>Supplier <span class="req">*</span></label>
            <select name="supplier_id" ${dis}>
              <option value="">-- select supplier --</option>
              ${suppliers.map((s) => `<option value="${s.supplier_id}" ${s.supplier_id === p.supplier_id ? "selected" : ""}>${esc(s.name)} (ID ${s.supplier_id})</option>`).join("")}
            </select></div>
          <div class="full"><label>Image URL</label>
            <input name="image_url" placeholder="https://..." value="${esc(p.image_url || "")}" ${dis} /></div>
          <div class="full"><label>Description</label><textarea name="description" ${dis}>${esc(p.description)}</textarea></div>
        </div>
        <div id="form-error"></div>
        <div class="row" style="margin-top:16px" id="buttons"></div>
      </form>

      <aside class="card side">
        <h3>Supplier Information</h3>
        <div id="supplier-panel" class="muted">Select a supplier to see details.</div>
        ${
          isNew
            ? ""
            : `
          <h3 style="margin-top:22px">Sales</h3>
          <dl class="kv">
            <dt>Units sold</dt><dd>${p.units_sold || 0}</dd>
            <dt>Revenue</dt><dd>${money(p.total_revenue || 0)}</dd>
            <dt>Last sold</dt><dd>${p.last_sold_at ? new Date(p.last_sold_at).toLocaleDateString() : '<span class="muted">Never</span>'}</dd>
          </dl>`
        }
      </aside>
    </div>`;

  const form = document.getElementById("product-form");
  const buttons = document.getElementById("buttons");
  const errBox = document.getElementById("form-error");
  const supplierSelect = form.elements.supplier_id;

  async function loadSupplier(id) {
    const panel = document.getElementById("supplier-panel");
    if (!id) {
      panel.innerHTML =
        '<span class="muted">Select a supplier to see details.</span>';
      return;
    }
    panel.textContent = "Loading...";
    try {
      const s = await api(`/suppliers/${id}`);
      panel.innerHTML = `
        <dl class="kv">
          <dt>Supplier ID</dt><dd>${s.supplier_id}</dd>
          <dt>Name</dt><dd>${esc(s.name)}</dd>
          <dt>Contact</dt><dd>${esc(s.contact_person)}</dd>
          <dt>Email</dt><dd>${esc(s.email)}</dd>
          <dt>Phone</dt><dd>${esc(s.phone)}</dd>
          <dt>Country</dt><dd>${esc(s.country)}</dd>
          <dt>Lead time</dt><dd>${s.lead_time_days} days</dd>
        </dl>`;
    } catch (err) {
      panel.innerHTML = `<div class="error-box">${esc(err.message)}</div>`;
    }
  }
  supplierSelect.onchange = () => loadSupplier(supplierSelect.value);
  if (!isNew) loadSupplier(p.supplier_id);

  function readForm() {
    const f = form.elements;
    const num = (v) => (v.trim() === "" ? NaN : Number(v));
    return {
      name: f.name.value,
      sku: f.sku.value,
      category: f.category.value,
      price: num(f.price.value),
      quantity_in_stock: num(f.quantity_in_stock.value),
      reorder_level: num(f.reorder_level.value),
      supplier_id: f.supplier_id.value ? Number(f.supplier_id.value) : null,
      description: f.description.value,
      image_url: f.image_url.value,
    };
  }

  function clientValidate(d) {
    const errs = [];
    if (!d.name.trim()) errs.push("Name is required.");
    if (!d.sku.trim()) errs.push("SKU is required.");
    if (!d.category.trim()) errs.push("Category is required.");
    if (!Number.isFinite(d.price) || d.price < 0)
      errs.push("Price must be a number >= 0.");
    if (!Number.isInteger(d.quantity_in_stock) || d.quantity_in_stock < 0)
      errs.push("Quantity must be a whole number >= 0.");
    if (!Number.isInteger(d.reorder_level) || d.reorder_level < 0)
      errs.push("Reorder level must be a whole number >= 0.");
    if (!d.supplier_id) errs.push("Supplier is required.");
    if (d.image_url && !/^https?:\/\//i.test(d.image_url.trim()))
      errs.push("Image URL must start with http:// or https://.");
    return errs;
  }

  async function save(method, path, successMsg) {
    errBox.innerHTML = "";
    const data = readForm();
    const errs = clientValidate(data);
    if (errs.length) {
      errBox.innerHTML = `<div class="error-box">${errs.map(esc).join("<br>")}</div>`;
      return;
    }
    try {
      await api(path, { method, body: JSON.stringify(data) });
      toast(successMsg);
      goHome();
    } catch (err) {
      errBox.innerHTML = `<div class="error-box">${esc(err.message)}</div>`;
    }
  }

  const btn = (label, cls, onClick, type = "button") => {
    const b = document.createElement("button");
    b.type = type;
    b.className = `btn ${cls}`;
    b.textContent = label;
    b.onclick = onClick;
    return b;
  };

  if (isNew) {
    form.onsubmit = (e) => {
      e.preventDefault();
      save("POST", "/products", "Product created");
    };
    buttons.append(
      btn("Save", "success", null, "submit"),
      btn("Cancel", "secondary", goHome),
    );
  } else {
    const recordSale = async () => {
      const qtyStr = prompt(`How many units of "${p.name}" were sold?`);
      if (qtyStr === null) return;
      const qty = Number(qtyStr);
      if (!Number.isInteger(qty) || qty <= 0) {
        alert("Quantity must be a positive whole number.");
        return;
      }
      try {
        await api(`/products/${productId}/sale`, {
          method: "POST",
          body: JSON.stringify({ quantity: qty }),
        });
        toast(`Recorded sale of ${qty} unit(s)`);
        showDetails(productId); // reload details with updated stock/revenue
      } catch (err) {
        errBox.innerHTML = `<div class="error-box">${esc(err.message)}</div>`;
      }
    };

    const showViewButtons = () => {
      buttons.innerHTML = "";
      buttons.append(
        btn("💰 Record Sale", "warn", recordSale),
        btn("✎ Edit", "", enterEditMode),
        btn("🗑 Delete", "danger", onDelete),
        btn("← Back to Home", "secondary", goHome),
      );
    };
    const enterEditMode = () => {
      form
        .querySelectorAll("input[name], select[name], textarea[name]")
        .forEach((el) => {
          el.disabled = false;
        });
      buttons.innerHTML = "";
      buttons.append(
        btn("Save changes", "success", null, "submit"),
        btn("Cancel", "secondary", () => showDetails(productId)),
      );
    };
    const onDelete = async () => {
      if (!confirm(`Delete product "${p.name}"? This cannot be undone.`))
        return;
      try {
        await api(`/products/${productId}`, { method: "DELETE" });
        toast("Product deleted");
        goHome();
      } catch (err) {
        errBox.innerHTML = `<div class="error-box">${esc(err.message)}</div>`;
      }
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      save("PUT", `/products/${productId}`, "Product updated");
    };
    showViewButtons();
  }
}
