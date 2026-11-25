/* =========================================================
   LEMARI GATHAN — account (sign up) + checkout + payments
   ---------------------------------------------------------
   Steps: 1 Details (sign up, remembered on this device)
          2 Payment (QRIS / bank / e-wallet / PayPal / WhatsApp)
          3 Done (order code, payment instructions, WhatsApp proof)

   Everything is configured in the Pengaturan sheet tab
   (bayar.*, ongkir.*, pesanan.*, akun.*, checkout.*).
   Optional: pesanan.webhook = a Google Apps Script web app URL that
   stores sign-ups and orders in a PRIVATE sheet (tools/orders-apps-script.gs).
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const T = (k, d) => (window.T ? window.T(k, d) : d);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem("lg:" + k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem("lg:" + k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem("lg:" + k); } catch {} },
  };
  const lines = (v) => String(v || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const cols = (l) => l.split("|").map((x) => x.trim());
  const yes = (v) => !/^(tidak|no|false|0|off)/i.test(String(v || "").trim());
  const imgLink = (u) => (window.__sheet && window.__sheet.images ? window.__sheet.images(u)[0] || u : u);

  /* ---------- config from the sheet ---------- */
  function config() {
    const zones = lines(T("ongkir.zona")).map((l) => { const [name, cost] = cols(l); return { name, cost: parseInt(String(cost || "").replace(/[^\d]/g, ""), 10) || 0 }; }).filter((z) => z.name);
    const accounts = (key) => lines(T(key)).map((l) => { const [name, number, holder] = cols(l); return { name, number, holder }; }).filter((a) => a.name && a.number);
    const methods = [];
    if (T("bayar.qris")) methods.push({ id: "qris", label: "QRIS", sub: "Scan with any bank or e-wallet app", icon: "qr" });
    const banks = accounts("bayar.bank"), wallets = accounts("bayar.ewallet");
    if (banks.length) methods.push({ id: "bank", label: "Bank transfer", sub: banks.map((b) => b.name).join(" · "), icon: "bank", accounts: banks });
    if (wallets.length) methods.push({ id: "ewallet", label: "E-wallet", sub: wallets.map((b) => b.name).join(" · "), icon: "wallet", accounts: wallets });
    if (T("bayar.paypal_id")) methods.push({ id: "paypal", label: "PayPal", sub: "Card or PayPal balance (charged in USD)", icon: "paypal" });
    if (yes(T("bayar.wa", "Ya")) || !methods.length) methods.push({ id: "wa", label: "Pay via WhatsApp chat", sub: "We'll confirm stock & send payment details", icon: "chat" });
    return { zones, methods, rate: parseFloat(String(T("bayar.paypal_kurs", "16000")).replace(/[^\d.]/g, "")) || 16000 };
  }

  const ICONS = {
    qr: '<svg viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2h-2z"/></svg>',
    bank: '<svg viewBox="0 0 24 24"><path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/></svg>',
    wallet: '<svg viewBox="0 0 24 24"><path d="M4 7h14a2 2 0 0 1 2 2v9H6a2 2 0 0 1-2-2z"/><path d="M4 7V6a2 2 0 0 1 2-2h10v3M16 13h4"/></svg>',
    paypal: '<svg viewBox="0 0 24 24"><path d="M8 20l2-14h5a4 4 0 0 1 0 8h-4"/><path d="M6 17l1.5-10"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>',
  };

  /* ---------- state ---------- */
  let step = 1, items = [], method = null, order = null, mode = "checkout"; // or "account"
  const profile = () => store.get("profile", null);

  /* ---------- webhook (optional, private sheet via Apps Script) ---------- */
  function send(type, data) {
    const url = String(T("pesanan.webhook", "") || "").trim();
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) return;
    try {
      fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ type, ...data, page: location.href, at: new Date().toISOString() }) });
    } catch {}
  }

  /* ---------- shell ---------- */
  const root = document.createElement("div");
  root.className = "co";
  root.id = "checkout";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="co__backdrop" data-co-close></div>
    <section class="co__panel" role="dialog" aria-modal="true" aria-labelledby="coTitle">
      <header class="co__head">
        <h2 id="coTitle">Checkout</h2>
        <ol class="co__steps" id="coSteps"></ol>
        <button class="icon-btn" data-co-close aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </header>
      <div class="co__body">
        <div class="co__main" id="coMain"></div>
        <aside class="co__summary" id="coSummary"></aside>
      </div>
    </section>`;
  document.body.appendChild(root);

  function open(m) {
    mode = m;
    items = window.LG ? window.LG.bagItems() : [];
    if (mode === "checkout" && !items.length) { window.LG && window.LG.toast("Your bag is empty"); return; }
    step = 1; method = null; order = null;
    window.LG && window.LG.closeDrawer();
    root.classList.add("is-open"); root.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    render();
  }
  function close() {
    root.classList.remove("is-open"); root.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".modal.is-open, .drawer.is-open")) document.body.classList.remove("no-scroll");
  }
  root.addEventListener("click", (e) => { if (e.target.closest("[data-co-close]")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("is-open")) close(); });

  /* ---------- totals ---------- */
  function totals() {
    const sub = items.reduce((s, p) => s + p.price, 0);
    const { zones } = config();
    const pr = profileOrSession();
    const zone = zones.find((z) => pr && z.name === pr.zone);
    const ship = zone ? zone.cost : null;
    return { sub, ship, total: sub + (ship || 0), zone };
  }

  /* ---------- render ---------- */
  function render() {
    root.classList.toggle("is-account", mode === "account");
    $("#coTitle").textContent = mode === "account" ? T("akun.judul", "Your details") : "Checkout";
    $("#coSteps").innerHTML = mode === "account" ? "" : [T("checkout.langkah1", "Details"), T("checkout.langkah2", "Payment"), T("checkout.langkah3", "Done")]
      .map((l, i) => `<li class="${i + 1 === step ? "is-on" : i + 1 < step ? "is-done" : ""}"><span>${i + 1 < step ? ICONS.check : i + 1}</span>${esc(l)}</li>`).join("");
    const main = $("#coMain");
    main.classList.remove("co-in"); void main.offsetWidth; main.classList.add("co-in");
    if (mode === "account") main.innerHTML = accountView();
    else main.innerHTML = step === 1 ? detailsView() : step === 2 ? paymentView() : doneView();
    renderSummary();
    if (step === 2 && method === "paypal") mountPayPal();
    const first = main.querySelector("input:not([type=hidden]), button");
    if (first && step === 1 && !profile()) setTimeout(() => first.focus({ preventScroll: true }), 300);
  }

  function renderSummary() {
    const el = $("#coSummary");
    if (mode === "account") {
      const orders = store.get("orders", []);
      el.innerHTML = `<h3>Your orders</h3>${orders.length ? orders.slice().reverse().map((o) => `
        <div class="co__order"><div><strong>${esc(o.code)}</strong><small>${new Date(o.at).toLocaleDateString("id-ID")} · ${esc(o.methodLabel)}</small></div><span>${rp(o.total)}</span></div>`).join("")
        : `<p class="muted small">No orders yet. Orders you place on this device show up here.</p>`}`;
      return;
    }
    const t = totals();
    const list = order ? order.items : items;
    el.innerHTML = `
      <h3>Order summary</h3>
      <div class="co__items">${list.map((p) => `
        <div class="co__item"><div class="co__thumb">${window.LG ? window.LG.media(p) : ""}</div>
          <div><strong>${esc(p.brand)}</strong><p>${esc(p.title)}</p><small>Size ${esc(p.size)}</small></div><span>${rp(p.price)}</span></div>`).join("")}</div>
      <dl class="co__totals">
        <div><dt>Subtotal</dt><dd>${rp(order ? order.subtotal : t.sub)}</dd></div>
        <div><dt>Shipping${t.zone ? ` <small>(${esc(t.zone.name)})</small>` : ""}</dt><dd>${(order ? order.shipping : t.ship) == null ? "Confirmed in chat" : (order ? order.shipping : t.ship) === 0 ? "Free" : rp(order ? order.shipping : t.ship)}</dd></div>
        <div class="co__grand"><dt>Total</dt><dd>${rp(order ? order.total : t.total)}</dd></div>
      </dl>
      <p class="muted small">${esc(T("ongkir.catatan", ""))}</p>`;
  }

  /* ---------- step 1: details / sign up ---------- */
  function form(pr, isAccount) {
    const { zones } = config();
    const v = (k) => esc(pr ? pr[k] || "" : "");
    return `
      <form class="co__form" id="coForm" novalidate>
        <p class="co__lead">${esc(T("akun.teks", ""))}</p>
        <div class="co__grid">
          <label class="fld"><span>Full name *</span><input name="name" autocomplete="name" required value="${v("name")}" /></label>
          <label class="fld"><span>WhatsApp number *</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="08xxxxxxxxxx" value="${v("phone")}" /></label>
          <label class="fld fld--wide"><span>Email *</span><input name="email" type="email" autocomplete="email" required value="${v("email")}" /></label>
          <label class="fld fld--wide"><span>Address *</span><textarea name="address" rows="2" autocomplete="street-address" required placeholder="Street, house number, district">${v("address")}</textarea></label>
          <label class="fld"><span>City *</span><input name="city" autocomplete="address-level2" required value="${v("city")}" /></label>
          <label class="fld"><span>Postal code</span><input name="postal" inputmode="numeric" autocomplete="postal-code" value="${v("postal")}" /></label>
          ${zones.length ? `<label class="fld fld--wide"><span>Shipping zone *</span><select name="zone" required>
            <option value="">Choose your area…</option>
            ${zones.map((z) => `<option value="${esc(z.name)}"${pr && pr.zone === z.name ? " selected" : ""}>${esc(z.name)} — ${z.cost ? rp(z.cost) : "Free"}</option>`).join("")}
          </select></label>` : ""}
          ${isAccount ? "" : `<label class="fld fld--wide"><span>Order note</span><input name="note" placeholder="Optional" /></label>`}
        </div>
        <label class="co__check"><input type="checkbox" name="remember" ${!pr || pr.remember !== false ? "checked" : ""} /> Remember me on this device</label>
        <label class="co__check"><input type="checkbox" name="news" ${pr && pr.news ? "checked" : ""} /> Tell me about new drops</label>
        <div class="co__actions">
          ${isAccount && pr ? `<button type="button" class="btn btn--ghost" data-co-signout>Sign out & forget me</button>` : ""}
          <button class="btn btn--dark" type="submit">${esc(isAccount ? (pr ? "Save details" : "Sign up") : T("checkout.tombol_lanjut", "Continue to payment"))}
            <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        </div>
      </form>`;
  }
  function detailsView() {
    const pr = profileOrSession();
    if (pr && !root.dataset.editing) {
      return `
        <div class="co__me">
          <div class="co__avatar">${esc((pr.name || "?").trim().charAt(0).toUpperCase())}</div>
          <div><small>Signed in as</small><strong>${esc(pr.name)}</strong><p>${esc(pr.phone)} · ${esc(pr.email)}</p><p>${esc(pr.address)}, ${esc(pr.city)} ${esc(pr.postal || "")}</p>
            ${pr.zone ? `<p>Shipping zone: <b>${esc(pr.zone)}</b></p>` : ""}</div>
          <button class="link" data-co-edit>Edit</button>
        </div>
        <label class="fld fld--wide"><span>Order note</span><input id="coNote" placeholder="Optional" /></label>
        <div class="co__actions"><button class="btn btn--dark" data-co-next>${esc(T("checkout.tombol_lanjut", "Continue to payment"))}
          <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>`;
    }
    return form(pr, false);
  }
  function accountView() {
    return form(profile(), true);
  }

  function readForm(f) {
    const d = Object.fromEntries(new FormData(f).entries());
    d.remember = !!f.remember.checked; d.news = !!f.news.checked;
    const errs = [];
    if (!d.name || d.name.trim().length < 2) errs.push("name");
    const digits = (d.phone || "").replace(/[^\d]/g, "");
    if (digits.length < 9) errs.push("phone");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || "")) errs.push("email");
    if (!d.address || d.address.trim().length < 6) errs.push("address");
    if (!d.city || !d.city.trim()) errs.push("city");
    if (f.zone && !d.zone) errs.push("zone");
    $$(".fld", f).forEach((l) => l.classList.remove("has-err"));
    errs.forEach((n) => { const i = f.elements[n]; i && i.closest(".fld").classList.add("has-err"); });
    if (errs.length) { const i = f.elements[errs[0]]; i && i.focus(); return null; }
    d.phone = digits.replace(/^0/, "62");
    return d;
  }

  // clear a field's error as soon as it's corrected
  root.addEventListener("input", (e) => { const f = e.target.closest(".fld.has-err"); if (f) f.classList.remove("has-err"); });

  root.addEventListener("submit", (e) => {
    if (e.target.id !== "coForm") return;
    e.preventDefault();
    const d = readForm(e.target);
    if (!d) return;
    const note = d.note; delete d.note;
    const isNew = !profile();
    const pr = { ...d, since: (profile() || {}).since || new Date().toISOString() };
    if (pr.remember) store.set("profile", pr); else { store.del("profile"); sessionProfile = pr; }
    if (isNew || mode === "account") send("signup", { name: pr.name, phone: pr.phone, email: pr.email, address: pr.address, city: pr.city, postal: pr.postal || "", zone: pr.zone || "", news: pr.news ? "Ya" : "Tidak" });
    delete root.dataset.editing;
    updateAccountBtn();
    if (mode === "account") { window.LG && window.LG.toast(isNew ? "Welcome! You're signed up." : "Details saved"); close(); return; }
    root.dataset.note = note || "";
    step = 2; render();
  });

  // a profile that the customer chose not to remember lives only for this visit
  let sessionProfile = null;
  const _profile = profile;
  const profileOrSession = () => _profile() || sessionProfile;

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-co-edit]")) { root.dataset.editing = "1"; render(); return; }
    if (t.closest("[data-co-next]")) { root.dataset.note = ($("#coNote") || {}).value || ""; step = 2; render(); return; }
    if (t.closest("[data-co-back]")) { step = 1; render(); return; }
    if (t.closest("[data-co-signout]")) { store.del("profile"); sessionProfile = null; updateAccountBtn(); window.LG && window.LG.toast("Signed out"); render(); return; }
    const m = t.closest("[data-method]");
    if (m) { method = m.dataset.method; render(); return; }
    if (t.closest("[data-co-place]")) { placeOrder(); return; }
    const c = t.closest("[data-copy]");
    if (c) {
      const txt = c.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => window.LG && window.LG.toast("Copied " + txt)).catch(() => window.LG && window.LG.toast(txt));
    }
  });

  /* ---------- step 2: payment ---------- */
  function paymentView() {
    const { methods, rate } = config();
    if (!method) method = methods[0].id;
    const t = totals();
    const usd = (t.total / rate).toFixed(2);
    return `
      <div class="co__methods" role="radiogroup" aria-label="Payment method">
        ${methods.map((m) => `
          <button type="button" class="co__method${m.id === method ? " is-on" : ""}" data-method="${m.id}" role="radio" aria-checked="${m.id === method}">
            <span class="co__mic">${ICONS[m.icon]}</span>
            <span><strong>${esc(m.label)}</strong><small>${esc(m.sub)}</small></span>
            <i class="co__radio"></i>
          </button>`).join("")}
      </div>
      ${method === "paypal" ? `
        <div class="co__paypal">
          <p>You'll pay <b>US$${usd}</b> (${rp(t.total)} at Rp${rate.toLocaleString("id-ID")}/USD)${t.ship == null ? " — shipping not included" : ""}.</p>
          <div id="paypalButtons" class="co__pp"><p class="muted small">Loading PayPal…</p></div>
        </div>
        <div class="co__actions"><button class="btn btn--ghost" data-co-back>Back</button></div>`
      : `<div class="co__actions"><button class="btn btn--ghost" data-co-back>Back</button>
          <button class="btn btn--dark" data-co-place>${esc(T("checkout.tombol_pesan", "Place order"))} · ${rp(t.total)}</button></div>`}`;
  }

  let ppLoading = null;
  function loadPayPal() {
    if (window.paypal) return Promise.resolve();
    if (ppLoading) return ppLoading;
    const id = encodeURIComponent(String(T("bayar.paypal_id", "")).trim());
    ppLoading = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = `https://www.paypal.com/sdk/js?client-id=${id}&currency=USD&intent=capture&components=buttons`;
      s.onload = res; s.onerror = () => { ppLoading = null; rej(new Error("PayPal could not load")); };
      document.head.appendChild(s);
    });
    return ppLoading;
  }
  function mountPayPal() {
    const box = $("#paypalButtons");
    loadPayPal().then(() => {
      if (!box.isConnected) return;
      box.innerHTML = "";
      const { rate } = config();
      window.paypal.Buttons({
        style: { layout: "vertical", color: "black", shape: "rect", label: "pay" },
        createOrder: (data, actions) => {
          const draft = buildOrder("paypal");
          root.dataset.pending = JSON.stringify(draft);
          return actions.order.create({
            purchase_units: [{
              reference_id: draft.code,
              description: `Lemari Gathan ${draft.code}`.slice(0, 127),
              amount: { currency_code: "USD", value: (draft.total / rate).toFixed(2) },
            }],
          });
        },
        onApprove: (data, actions) => actions.order.capture().then((details) => {
          const draft = JSON.parse(root.dataset.pending || "null") || buildOrder("paypal");
          draft.paid = true;
          draft.paypalId = details && details.id;
          finishOrder(draft);
        }),
        onError: (err) => { console.warn("[Lemari Gathan] PayPal error", err); window.LG && window.LG.toast("PayPal payment didn't go through. Try again or pick another method."); },
      }).render(box);
    }).catch(() => { box.innerHTML = `<p class="co__warn">PayPal couldn't load. Check your connection, or choose another payment method.</p>`; });
  }

  /* ---------- placing the order ---------- */
  function buildOrder(m) {
    const t = totals();
    const meth = config().methods.find((x) => x.id === m) || { label: m };
    const d = new Date();
    const code = `LG-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      code, at: d.toISOString(), method: m, methodLabel: meth.label,
      items: items.map((p) => ({ id: p.id, brand: p.brand, title: p.title, size: p.size, price: p.price, images: p.images, type: p.type, color: p.color })),
      subtotal: t.sub, shipping: t.ship, total: t.total, zone: t.zone ? t.zone.name : "",
      customer: profileOrSession(), note: root.dataset.note || "", paid: false,
    };
  }
  function placeOrder() { finishOrder(buildOrder(method)); }
  function finishOrder(o) {
    order = o;
    const orders = store.get("orders", []);
    orders.push({ code: o.code, at: o.at, total: o.total, methodLabel: o.methodLabel, items: o.items.map((i) => i.id) });
    store.set("orders", orders.slice(-30));
    const c = o.customer || {};
    send("order", {
      code: o.code, status: o.paid ? "Dibayar (PayPal)" : "Menunggu pembayaran", method: o.methodLabel, paypal_id: o.paypalId || "",
      items: o.items.map((i) => `#${i.id} ${i.brand} ${i.title} (${i.size}) ${rp(i.price)}`).join("\n"),
      subtotal: o.subtotal, shipping: o.shipping == null ? "" : o.shipping, total: o.total, zone: o.zone,
      name: c.name || "", phone: c.phone || "", email: c.email || "", address: `${c.address || ""}, ${c.city || ""} ${c.postal || ""}`.trim(), note: o.note,
    });
    window.LG && window.LG.clearBag();
    step = 3; render();
  }

  /* ---------- step 3: done ---------- */
  function waMessage(o) {
    const c = o.customer || {};
    return [
      T("checkout.pesan_wa", "Hi Lemari Gathan! I just placed an order on the website."),
      "",
      `Order: ${o.code}`,
      ...o.items.map((p, i) => `${i + 1}. ${p.brand} — ${p.title} (Size ${p.size}) — ${rp(p.price)}`),
      `Subtotal: ${rp(o.subtotal)}`,
      `Shipping: ${o.shipping == null ? "please confirm" : o.shipping === 0 ? "free" : rp(o.shipping)}${o.zone ? ` (${o.zone})` : ""}`,
      `Total: ${rp(o.total)}`,
      `Payment: ${o.methodLabel}${o.paid ? ` — PAID (PayPal ${o.paypalId || ""})` : ""}`,
      "",
      `Name: ${c.name || ""}`,
      `WhatsApp: ${c.phone || ""}`,
      `Address: ${c.address || ""}, ${c.city || ""} ${c.postal || ""}`,
      o.note ? `Note: ${o.note}` : "",
    ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
  }
  function doneView() {
    const o = order;
    const meth = config().methods.find((m) => m.id === o.method) || {};
    const wa = window.LG ? window.LG.wa(waMessage(o)) : "#";
    const copyBtn = (txt) => `<button class="co__copy" data-copy="${esc(txt)}" aria-label="Copy">${ICONS.copy}</button>`;
    let how = "";
    if (o.method === "qris") {
      how = `<div class="co__pay co__pay--qris">
        <img src="${esc(imgLink(T("bayar.qris")))}" alt="QRIS code for ${esc(T("bayar.qris_nama", "Lemari Gathan"))}" />
        <div><small>Pay exactly</small><strong class="co__amount">${rp(o.total)} ${copyBtn(String(o.total))}</strong>
          <p>Scan this QRIS with any banking or e-wallet app (BCA, Mandiri, GoPay, OVO, DANA, ShopeePay…) and enter the amount above.</p>
          <p class="muted small">Merchant: ${esc(T("bayar.qris_nama", "Lemari Gathan"))}</p></div></div>`;
    } else if (o.method === "bank" || o.method === "ewallet") {
      how = `<div class="co__pay"><small>Transfer exactly</small><strong class="co__amount">${rp(o.total)} ${copyBtn(String(o.total))}</strong>
        <div class="co__accts">${(meth.accounts || []).map((a) => `
          <div class="co__acct"><b>${esc(a.name)}</b><span>${esc(a.number)} ${copyBtn(a.number.replace(/\s/g, ""))}</span><small>${esc(a.holder ? "a.n. " + a.holder : "")}</small></div>`).join("")}</div></div>`;
    } else if (o.method === "paypal") {
      how = `<div class="co__pay co__pay--ok">${ICONS.check}<div><strong>Payment received via PayPal</strong><p>PayPal ID: ${esc(o.paypalId || "—")}. Send us a quick message so we can ship it.</p></div></div>`;
    } else {
      how = `<div class="co__pay"><p>Tap the button below to send your order on WhatsApp. We'll confirm stock and send the payment details.</p></div>`;
    }
    return `
      <div class="co__done">
        <div class="co__burst">${ICONS.check}</div>
        <h3>${esc(T("checkout.sukses_judul", "Order {kode} placed!").replace("{kode}", o.code))}</h3>
        <p class="muted">${esc(o.paid ? "Thank you! Your payment went through." : T("checkout.sukses_teks", ""))}</p>
        ${how}
        <div class="co__actions co__actions--stack">
          <a class="btn btn--dark btn--block" href="${wa}" target="_blank" rel="noopener">${ICONS.chat} ${o.method === "wa" ? "Send order on WhatsApp" : o.paid ? "Message us on WhatsApp" : "Send payment proof on WhatsApp"}</a>
          <button class="btn btn--ghost btn--block" data-co-close>Back to the shop</button>
        </div>
      </div>`;
  }

  /* ---------- header account button ---------- */
  function updateAccountBtn() {
    const b = document.getElementById("accountBtn");
    if (!b) return;
    const pr = _profile();
    b.classList.toggle("is-in", !!pr);
    b.setAttribute("aria-label", pr ? `Account: ${pr.name}` : "Sign up");
    const ini = b.querySelector(".acct-ini");
    if (ini) ini.textContent = pr ? (pr.name || "?").trim().charAt(0).toUpperCase() : "";
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("#accountBtn")) { e.preventDefault(); open("account"); }
    const co = e.target.closest("#checkoutBtn");
    if (co) { e.preventDefault(); open("checkout"); }
  });
  updateAccountBtn();
  window.openCheckout = () => open("checkout");
})();
