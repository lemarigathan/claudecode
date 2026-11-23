/* =========================================================
   LEMARI GATHAN — app
   ========================================================= */
(async () => {
  "use strict";

  const S = window.STORE;
  const { products: P, source: DATA_SOURCE } = await window.loadProducts();
  document.documentElement.dataset.source = DATA_SOURCE;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */
  const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");
  const short = (n) => (n >= 1e6 ? "Rp" + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + "jt" : "Rp" + Math.round(n / 1000) + "k");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const daysAgo = (d) => Math.max(0, Math.floor((Date.now() - new Date(d + "T00:00:00").getTime()) / 864e5));
  const ago = (d) => {
    const n = daysAgo(d);
    if (n === 0) return "Today";
    if (n === 1) return "Yesterday";
    if (n < 7) return n + " days ago";
    if (n < 30) return Math.floor(n / 7) + "w ago";
    return Math.floor(n / 30) + "mo ago";
  };
  const wa = (text) => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}`;
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem("lg:" + k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem("lg:" + k, JSON.stringify(v)); } catch {} },
  };
  const byId = (id) => P.find((p) => p.id === +id);
  const CATS = {
    tops: { label: "Tops", art: ["tee", "#1f2a44"] },
    bottoms: { label: "Bottoms", art: ["pants", "#3b3f46"] },
    outerwear: { label: "Outerwear", art: ["jacket", "#8a5a2b"] },
    footwear: { label: "Footwear", art: ["shoes", "#efefef"] },
    accessories: { label: "Accessories", art: ["cap", "#2a2a2a"] },
  };
  const COND = { 10: "New with tags", 9: "Like new", 8: "Lightly worn", 7: "Worn" };

  /* ---------- garment illustrations (used when no photo) ---------- */
  function lum(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  function art(type, color) {
    const L = lum(color);
    const sh = L < 0.25 ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.2)";
    const fill = L > 0.9 ? "rgba(0,0,0,.05)" : "rgba(0,0,0,.12)";
    const edge = L > 0.85 ? `stroke="rgba(0,0,0,.18)" stroke-width="1.5"` : "";
    const ln = (d, w = 2) => `<path d="${d}" fill="none" stroke="${sh}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const body = (d) => `<path d="${d}" fill="${color}" ${edge}/>`;
    const LS = "M62 40 L86 28 Q100 40 114 28 L138 40 L160 62 L174 190 L152 194 L140 96 L140 208 L60 208 L60 96 L48 194 L26 190 L40 62 Z";
    let g = "";
    switch (type) {
      case "tee":
        g = body("M60 40 L85 28 Q100 42 115 28 L140 40 L172 74 L150 96 L138 84 L138 206 L62 206 L62 84 L50 96 L28 74 Z") +
          ln("M85 28 Q100 48 115 28") + ln("M50 96 L28 74", 3) + ln("M150 96 L172 74", 3) + ln("M62 196 L138 196", 1.5);
        break;
      case "longsleeve":
        g = body(LS) + ln("M86 28 Q100 46 114 28") + ln("M28 180 L50 183", 3) + ln("M150 183 L172 180", 3) + ln("M60 198 L140 198", 1.5);
        break;
      case "shirt":
        g = body(LS) + `<path d="M86 28 L100 50 L114 28 L120 40 L100 58 L80 40 Z" fill="${fill}"/>` +
          ln("M100 52 L100 208", 1.5) +
          [74, 104, 134, 164, 192].map((y) => `<circle cx="104" cy="${y}" r="2.2" fill="${sh}"/>`).join("") +
          ln("M28 180 L50 183", 3) + ln("M150 183 L172 180", 3) + `<path d="M112 80 h18 v20 h-18z" fill="none" stroke="${sh}" stroke-width="1.5"/>`;
        break;
      case "hoodie":
        g = `<path d="M74 44 Q72 6 100 6 Q128 6 126 44 Z" fill="${color}" ${edge}/>` + `<path d="M84 40 Q84 18 100 18 Q116 18 116 40 Z" fill="${fill}"/>` +
          body(LS) + `<path d="M70 146 L130 146 L138 184 L62 184 Z" fill="${fill}"/>` + ln("M70 146 L62 184 M130 146 L138 184", 1.5) +
          ln("M94 42 L92 80 M106 42 L108 80", 1.5) + ln("M28 180 L50 183", 4) + ln("M150 183 L172 180", 4) + ln("M60 198 L140 198", 4);
        break;
      case "jacket":
        g = body(LS) + `<path d="M84 28 L100 60 L116 28 L124 42 L100 70 L76 42 Z" fill="${fill}"/>` + ln("M100 62 L100 208", 2) +
          `<rect x="68" y="96" width="22" height="20" rx="2" fill="none" stroke="${sh}" stroke-width="1.5"/><rect x="110" y="96" width="22" height="20" rx="2" fill="none" stroke="${sh}" stroke-width="1.5"/>` +
          ln("M28 180 L50 183", 4) + ln("M150 183 L172 180", 4) + ln("M60 196 L140 196", 5);
        break;
      case "pants":
        g = body("M64 22 L136 22 L142 60 L154 222 L112 222 L100 88 L88 222 L46 222 L58 60 Z") + ln("M64 34 L136 34", 1.5) +
          ln("M100 34 L100 88", 1.5) + ln("M70 40 Q78 58 64 64 M130 40 Q122 58 136 64", 1.5) + ln("M48 210 L88 210 M112 210 L152 210", 1.5);
        break;
      case "shorts":
        g = body("M60 54 L140 54 L150 160 L108 166 L100 104 L92 166 L50 160 Z") + ln("M60 68 L140 68", 2) + ln("M100 68 L100 104", 1.5) +
          ln("M92 70 L90 98 M108 70 L110 98", 1.2) + ln("M52 150 L92 155 M108 155 L148 150", 1.5);
        break;
      case "shoes":
        g = `<path d="M22 168 L182 168 L182 182 Q182 188 176 188 L28 188 Q22 188 22 182 Z" fill="${L > 0.6 ? "#d9d4c7" : "#c79a5b"}"/>` +
          body("M26 168 Q22 128 44 118 L84 102 Q98 126 132 132 Q178 140 182 168 Z") +
          ln("M84 102 Q98 126 132 132", 1.5) + ln("M92 112 L104 104 M100 120 L112 112 M110 126 L120 118", 2) +
          `<path d="M120 150 Q140 140 160 150" fill="none" stroke="${sh}" stroke-width="3"/>` + ln("M26 160 L182 160", 1.2);
        break;
      case "cap":
        g = body("M42 140 Q42 70 100 66 Q158 70 158 140 Z") + `<path d="M40 138 Q100 128 160 138 Q178 142 186 152 Q150 166 100 160 Q60 156 40 150 Z" fill="${color}" ${edge}/>` +
          ln("M100 66 L100 140 M72 74 Q66 106 70 140 M128 74 Q134 106 130 140", 1.3) + `<circle cx="100" cy="68" r="4" fill="${sh}"/>` +
          ln("M42 140 Q100 130 158 140", 2);
        break;
      case "bag":
        g = `<path d="M70 92 Q70 36 100 36 Q130 36 130 92" fill="none" stroke="${color}" stroke-width="9"/>` +
          body("M44 90 L156 90 L164 214 L36 214 Z") + ln("M44 104 L156 104", 1.5) + `<rect x="80" y="120" width="40" height="24" rx="2" fill="${fill}"/>` +
          `<rect x="88" y="98" width="24" height="10" fill="#f08a24"/>`;
        break;
    }
    return `<svg viewBox="0 0 200 240" aria-hidden="true">${g}</svg>`;
  }
  const media = (p, i = 0) =>
    p.images && p.images[i]
      ? `<img src="${esc(p.images[i])}" alt="${esc(p.brand + " " + p.title)}" loading="lazy" />`
      : `<div class="art">${art(p.type, p.color)}</div>`;

  /* ---------- state ---------- */
  const state = {
    mode: "all",            // all | sale | sold
    cats: new Set(),
    sizes: new Set(),
    conds: new Set(),
    maxPrice: 2500000,
    savedOnly: false,
    q: "",
    sort: "new",
  };
  let saved = new Set(store.get("saved", []));
  let bag = store.get("bag", []).filter((id) => byId(id) && !byId(id).sold);

  /* ---------- filtering ---------- */
  function filtered() {
    const q = state.q.trim().toLowerCase();
    let list = P.filter((p) => {
      if (state.mode === "sold" ? !p.sold : p.sold) return false;
      if (state.mode === "sale" && !p.oldPrice) return false;
      if (state.cats.size && !state.cats.has(p.category)) return false;
      if (state.sizes.size && !state.sizes.has(p.size)) return false;
      if (state.conds.size && !state.conds.has(p.condition)) return false;
      if (p.price > state.maxPrice) return false;
      if (state.savedOnly && !saved.has(p.id)) return false;
      if (q) {
        const hay = `${p.brand} ${p.title} ${p.category} ${p.size} ${p.type}`.toLowerCase();
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const sorters = {
      new: (a, b) => new Date(b.listed) - new Date(a.listed),
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      cond: (a, b) => b.condition - a.condition,
    };
    return list.sort(sorters[state.sort]);
  }

  /* ---------- card ---------- */
  const heartSVG = `<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>`;
  const burst = `<span class="burst">${[0, 45, 90, 135, 180, 225, 270, 315].map((r) => `<i style="--r:${r}deg"></i>`).join("")}</span>`;
  function card(p, i) {
    const isNew = daysAgo(p.listed) <= 2 && !p.sold;
    const tag = p.sold ? "" : p.oldPrice ? `<span class="tag tag--drop">−${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : isNew ? `<span class="tag tag--new">New</span>` : "";
    return `
      <article class="card${p.sold ? " is-sold" : ""}" style="--i:${i}" data-id="${p.id}" tabindex="0" aria-label="${esc(p.brand + " " + p.title)}">
        <div class="card__media">
          ${media(p)}
          ${tag}
          <button class="heart${saved.has(p.id) ? " is-on" : ""}" data-save="${p.id}" aria-label="Save item" aria-pressed="${saved.has(p.id)}">${heartSVG}${burst}</button>
          ${p.sold ? "" : `<button class="card__quick" data-open="${p.id}">Quick view</button>`}
        </div>
        <div class="card__meta"><span class="card__brand">${esc(p.brand)}</span><span>${ago(p.listed)}</span></div>
        <p class="card__title">${esc(p.title)}</p>
        <div class="card__foot">
          <div class="price${p.oldPrice && !p.sold ? " price--drop" : ""}"><span>${p.sold ? "Sold" : rupiah(p.price)}</span>${p.oldPrice && !p.sold ? `<s>${rupiah(p.oldPrice)}</s>` : ""}</div>
          <span class="card__size">${esc(p.size)}</span>
        </div>
      </article>`;
  }

  /* ---------- render shop ---------- */
  const grid = $("#grid");
  function render() {
    const list = filtered();
    grid.innerHTML = list.map(card).join("");
    $("#empty").hidden = list.length > 0;
    $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "listing" : "listings"}`;
    const titles = { all: "Fresh in the lemari", sale: "Price drops", sold: "Sold archive" };
    let title = titles[state.mode];
    if (state.mode === "all" && state.cats.size === 1) title = CATS[[...state.cats][0]].label;
    if (state.q) title = `Results for “${state.q}”`;
    $("#shopTitle").textContent = title;
    renderChips();
    syncFilterUI();
  }

  function renderChips() {
    const chips = [];
    state.cats.forEach((c) => chips.push([`cat:${c}`, CATS[c].label]));
    state.sizes.forEach((s) => chips.push([`size:${s}`, `Size ${s}`]));
    state.conds.forEach((c) => chips.push([`cond:${c}`, `${c}/10`]));
    if (state.maxPrice < 2500000) chips.push(["price", `Under ${short(state.maxPrice)}`]);
    if (state.savedOnly) chips.push(["saved", "Saved"]);
    if (state.q) chips.push(["q", `“${state.q}”`]);
    $("#activeChips").innerHTML = chips.map(([k, l]) => `<button class="chip" data-chip="${esc(k)}">${esc(l)}</button>`).join("");
  }

  /* ---------- filter sidebar ---------- */
  function buildFilters() {
    const live = P.filter((p) => !p.sold);
    $("#fCategory").innerHTML = Object.entries(CATS)
      .map(([k, v]) => `<label class="check"><input type="checkbox" value="${k}" data-f="cat" />${v.label}<em>${live.filter((p) => p.category === k).length}</em></label>`)
      .join("");
    const order = ["XS", "S", "M", "L", "XL", "XXL", "OS"];
    const sizes = [...new Set(P.map((p) => p.size))].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia > -1 && ib > -1) return ia - ib;
      if (ia > -1) return -1;
      if (ib > -1) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });
    $("#fSize").innerHTML = sizes.map((s) => `<button class="size-btn" data-size="${esc(s)}">${esc(s)}</button>`).join("");
    $("#fCond").innerHTML = [10, 9, 8, 7]
      .map((c) => `<label class="check"><input type="checkbox" value="${c}" data-f="cond" />${c}/10 · ${COND[c]}</label>`)
      .join("");
  }
  function syncFilterUI() {
    $$('[data-f="cat"]').forEach((i) => (i.checked = state.cats.has(i.value)));
    $$('[data-f="cond"]').forEach((i) => (i.checked = state.conds.has(+i.value)));
    $$("[data-size]").forEach((b) => b.classList.toggle("is-on", state.sizes.has(b.dataset.size)));
    $("#fPrice").value = state.maxPrice;
    $("#fPriceLabel").textContent = state.maxPrice >= 2500000 ? "Any" : rupiah(state.maxPrice);
    $("#fSaved").checked = state.savedOnly;
    // category nav
    let navKey = state.mode !== "all" ? state.mode : state.cats.size === 1 ? [...state.cats][0] : state.cats.size === 0 ? "all" : null;
    $$(".catnav__link").forEach((b) => b.classList.toggle("is-active", b.dataset.cat === navKey));
    moveInk();
  }

  $("#filters").addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.f === "cat") { t.checked ? state.cats.add(t.value) : state.cats.delete(t.value); if (state.mode === "sold") state.mode = "all"; }
    if (t.dataset.f === "cond") t.checked ? state.conds.add(+t.value) : state.conds.delete(+t.value);
    if (t.id === "fSaved") state.savedOnly = t.checked;
    render();
  });
  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-size]");
    if (!b) return;
    const s = b.dataset.size;
    state.sizes.has(s) ? state.sizes.delete(s) : state.sizes.add(s);
    render();
  });
  let priceT;
  $("#fPrice").addEventListener("input", (e) => {
    state.maxPrice = +e.target.value;
    $("#fPriceLabel").textContent = state.maxPrice >= 2500000 ? "Any" : rupiah(state.maxPrice);
    clearTimeout(priceT);
    priceT = setTimeout(render, 180);
  });
  function clearAll() {
    Object.assign(state, { mode: "all", maxPrice: 2500000, savedOnly: false, q: "" });
    state.cats.clear(); state.sizes.clear(); state.conds.clear();
    $("#searchInput").value = "";
    render();
  }
  $("#clearFilters").addEventListener("click", clearAll);
  $("#emptyClear").addEventListener("click", clearAll);
  $("#activeChips").addEventListener("click", (e) => {
    const c = e.target.closest("[data-chip]");
    if (!c) return;
    const [k, v] = c.dataset.chip.split(":");
    if (k === "cat") state.cats.delete(v);
    if (k === "size") state.sizes.delete(v);
    if (k === "cond") state.conds.delete(+v);
    if (k === "price") state.maxPrice = 2500000;
    if (k === "saved") state.savedOnly = false;
    if (k === "q") { state.q = ""; $("#searchInput").value = ""; }
    render();
  });
  $("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; render(); });

  // mobile filter sheet
  const fb = document.createElement("div");
  fb.className = "filters-backdrop";
  document.body.appendChild(fb);
  const openFilters = (on) => {
    $("#filters").classList.toggle("is-open", on);
    fb.classList.toggle("is-on", on);
    document.body.classList.toggle("no-scroll", on);
  };
  $("#filterToggle").addEventListener("click", () => openFilters(true));
  $("#filterClose").addEventListener("click", () => openFilters(false));
  $("#filterApply").addEventListener("click", () => openFilters(false));
  fb.addEventListener("click", () => openFilters(false));

  /* ---------- category nav ---------- */
  function setCat(cat, scroll = true) {
    state.cats.clear();
    if (cat === "sale" || cat === "sold") state.mode = cat;
    else { state.mode = "all"; if (cat !== "all") state.cats.add(cat); }
    render();
    if (scroll) $("#shop").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }
  $("#catnav").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (b) setCat(b.dataset.cat);
  });
  $$("[data-jump]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); setCat(a.dataset.jump); }));
  function moveInk() {
    const ink = $(".catnav__ink");
    const act = $(".catnav__link.is-active");
    if (!act) { ink.style.width = "0"; return; }
    ink.style.width = act.offsetWidth + "px";
    ink.style.transform = `translateX(${act.offsetLeft}px)`;
  }

  // category tiles
  $("#catTiles").innerHTML = Object.entries(CATS)
    .map(([k, v]) => {
      const n = P.filter((p) => p.category === k && !p.sold).length;
      return `<button class="cat reveal" data-tile="${k}"><div class="cat__art">${art(v.art[0], v.art[1])}</div><strong>${v.label}</strong><span>${n} available</span></button>`;
    })
    .join("");
  $$(".cat").forEach((c, i) => (c.style.transitionDelay = i * 70 + "ms"));
  $("#catTiles").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tile]");
    if (t) setCat(t.dataset.tile);
  });

  /* ---------- search ---------- */
  let searchT;
  const search = $("#searchInput");
  search.addEventListener("input", () => {
    clearTimeout(searchT);
    searchT = setTimeout(() => {
      state.q = search.value;
      if (state.q && state.mode === "sold") state.mode = "all";
      render();
    }, 160);
  });
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); $("#shop").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); search.blur(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
    if (e.key === "Escape") { closeModal(); closeDrawer(); openFilters(false); toggleMenu(false); }
  });

  /* ---------- saved & bag ---------- */
  function updateBadges(bumpWhich) {
    const sc = $("#savedCount"), bc = $("#bagCount");
    sc.textContent = saved.size; bc.textContent = bag.length;
    sc.classList.toggle("has", saved.size > 0); bc.classList.toggle("has", bag.length > 0);
    $("#tabBagCount").textContent = bag.length; $("#tabSavedCount").textContent = saved.size;
    const el = bumpWhich === "bag" ? bc : bumpWhich === "saved" ? sc : null;
    if (el) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  }
  function toggleSave(id, btn) {
    id = +id;
    const on = !saved.has(id);
    on ? saved.add(id) : saved.delete(id);
    store.set("saved", [...saved]);
    $$(`[data-save="${id}"]`).forEach((b) => {
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on);
      if (on && b.classList.contains("heart")) { b.classList.remove("burst-go"); void b.offsetWidth; b.classList.add("burst-go"); }
    });
    updateBadges("saved");
    toast(on ? "Saved to your favourites" : "Removed from saved");
    if (state.savedOnly) render();
    if ($("#drawer").classList.contains("is-open")) renderDrawer();
  }
  function addToBag(id) {
    id = +id;
    const p = byId(id);
    if (!p || p.sold) return;
    if (bag.includes(id)) { toast("Already in your bag — it's one of one!"); openDrawer("bag"); return; }
    bag.push(id);
    store.set("bag", bag);
    updateBadges("bag");
    toast(`Added ${p.brand} to bag`);
    $$(`[data-add="${id}"]`).forEach((b) => (b.innerHTML = "In your bag ✓"));
  }
  function removeFromBag(id, row) {
    id = +id;
    const done = () => { bag = bag.filter((x) => x !== id); store.set("bag", bag); updateBadges(); renderDrawer(); };
    if (row && !reduce) { row.classList.add("out"); row.addEventListener("animationend", done, { once: true }); } else done();
  }

  /* ---------- drawer ---------- */
  let tab = "bag";
  const drawer = $("#drawer");
  function openDrawer(t = "bag") {
    tab = t;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    renderDrawer();
  }
  function closeDrawer() {
    if (!drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (!modal.classList.contains("is-open")) document.body.classList.remove("no-scroll");
  }
  function renderDrawer() {
    $$(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
    const act = $(".tab.is-active"), ink = $(".tabs__ink");
    requestAnimationFrame(() => { ink.style.width = act.offsetWidth + "px"; ink.style.transform = `translateX(${act.offsetLeft}px)`; });
    const ids = tab === "bag" ? bag : [...saved];
    const list = ids.map(byId).filter(Boolean);
    const foot = $("#drawerFoot");
    if (!list.length) {
      $("#drawerList").innerHTML = `<div class="drawer__empty">
        ${tab === "bag" ? `<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>` : heartSVG}
        <strong>${tab === "bag" ? "Your bag is empty" : "No saved items yet"}</strong>
        <span>${tab === "bag" ? "Pieces go fast — add something you love." : "Tap the heart on anything to keep an eye on it."}</span>
        <button class="btn btn--ghost btn--sm" data-close data-goto-shop>Browse the drop</button></div>`;
      foot.hidden = true;
      return;
    }
    $("#drawerList").innerHTML = list
      .map((p, i) => `
        <div class="line-item" style="--i:${i}" data-row="${p.id}">
          <div class="line-item__img" data-open="${p.id}">${media(p)}</div>
          <div>
            <strong>${esc(p.brand)}</strong>
            <p>${esc(p.title)}</p>
            <small>Size ${esc(p.size)} · ${p.condition}/10${p.sold ? " · Sold" : ""}</small>
          </div>
          <div class="line-item__side">
            <span>${p.sold ? "Sold" : rupiah(p.price)}</span>
            ${tab === "bag" ? `<button data-remove="${p.id}">Remove</button>` : `${!p.sold && !bag.includes(p.id) ? `<button data-move="${p.id}">Add to bag</button>` : ""}<button data-unsave="${p.id}">Remove</button>`}
          </div>
        </div>`)
      .join("");
    foot.hidden = tab !== "bag";
    const total = list.reduce((s, p) => s + p.price, 0);
    $("#bagTotal").textContent = rupiah(total);
    const msg = `Hi Lemari Gathan! I'd like to order:\n\n` + list.map((p, i) => `${i + 1}. ${p.brand} — ${p.title} (Size ${p.size}) — ${rupiah(p.price)}`).join("\n") +
      `\n\nSubtotal: ${rupiah(total)}\n\nMy city: `;
    $("#checkoutBtn").href = wa(msg);
  }
  drawer.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-goto-shop]")) { closeDrawer(); $("#shop").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); return; }
    if (t.closest("[data-close]")) return closeDrawer();
    const tb = t.closest("[data-tab]");
    if (tb) { tab = tb.dataset.tab; renderDrawer(); return; }
    const r = t.closest("[data-remove]");
    if (r) return removeFromBag(r.dataset.remove, r.closest(".line-item"));
    const u = t.closest("[data-unsave]");
    if (u) return toggleSave(u.dataset.unsave);
    const m = t.closest("[data-move]");
    if (m) { addToBag(m.dataset.move); renderDrawer(); return; }
    const o = t.closest("[data-open]");
    if (o) { closeDrawer(); openModal(o.dataset.open); }
  });
  $("#bagBtn").addEventListener("click", () => openDrawer("bag"));
  $("#savedBtn").addEventListener("click", () => openDrawer("saved"));

  /* ---------- product modal ---------- */
  const modal = $("#modal");
  let lastFocus = null;
  function openModal(id, push = true) {
    const p = byId(id);
    if (!p) return;
    lastFocus = document.activeElement;
    const imgs = p.images && p.images.length ? p.images : [null];
    const similar = P.filter((x) => x.id !== p.id && !x.sold && (x.category === p.category || x.brand === p.brand)).slice(0, 4);
    const drop = p.oldPrice && !p.sold;
    $("#modalBody").innerHTML = `
      <div class="pd">
        <div class="pd__gallery">
          <div class="pd__main" id="pdMain">${media(p, 0)}</div>
          ${imgs.length > 1 ? `<div class="pd__thumbs">${imgs.map((src, i) => `<button class="${i ? "" : "is-on"}" data-thumb="${i}"><img src="${esc(src)}" alt="" /></button>`).join("")}</div>` : ""}
        </div>
        <div class="pd__info">
          <div>
            <span class="pd__brand">${esc(p.brand)}</span>
            <h2 class="pd__title" id="mTitle">${esc(p.title)}</h2>
          </div>
          <div class="pd__price${drop ? " drop" : ""}"><span>${p.sold ? "Sold" : rupiah(p.price)}</span>${drop ? `<s>${rupiah(p.oldPrice)}</s><small>Price dropped</small>` : ""}</div>
          <div class="pd__facts">
            <div><small>Size</small><strong>${esc(p.size)}</strong></div>
            <div><small>Condition</small><strong>${p.condition}/10</strong></div>
            <div><small>Listed</small><strong>${ago(p.listed)}</strong></div>
          </div>
          <div class="pd__actions">
            ${p.sold
              ? `<a class="btn btn--dark" href="${wa(`Hi! I saw the sold ${p.brand} ${p.title} — do you have anything similar?`)}" target="_blank" rel="noopener">Ask for something similar</a>`
              : `<a class="btn btn--dark magnetic" href="${wa(`Hi Lemari Gathan! I want to buy:\n${p.brand} — ${p.title} (Size ${p.size}) — ${rupiah(p.price)}\n\nIs it still available?`)}" target="_blank" rel="noopener">Buy now via WhatsApp</a>
                 <button class="btn btn--ghost" data-add="${p.id}">${bag.includes(p.id) ? "In your bag ✓" : "Add to bag"}</button>`}
            <button class="btn btn--ghost pd__save${saved.has(p.id) ? " is-on" : ""}" data-save="${p.id}" aria-pressed="${saved.has(p.id)}">${heartSVG} Save</button>
            ${p.sold ? "" : `<a class="btn btn--ghost" href="https://ig.me/m/${esc(S.instagram)}" target="_blank" rel="noopener">Make an offer</a>`}
          </div>
          <div>
            <details class="acc" open><summary>Description</summary><div class="acc__body">${esc(p.description)}<br /><br /><b>Condition:</b> ${p.condition}/10 — ${COND[p.condition] || ""}</div></details>
            <details class="acc"><summary>Measurements</summary><div class="acc__body"><table class="measure">${Object.entries(p.measurements || {}).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table><p class="muted small" style="margin-top:8px">Measured flat, in centimetres.</p></div></details>
            <details class="acc"><summary>Shipping &amp; returns</summary><div class="acc__body">Ships from ${esc(S.city)} via JNE, J&amp;T or SiCepat. Paid before 3 PM ships same day. Because every piece is pre-owned and one of one, all sales are final — ask me anything before you buy.</div></details>
          </div>
          <div class="pd__seller">
            <img src="assets/icons/icon-180.png" alt="" />
            <div><strong>Gathan</strong>Usually replies within an hour</div>
          </div>
        </div>
        ${similar.length ? `<div class="pd__similar"><h3>You might also like</h3><div class="grid">${similar.map(card).join("")}</div></div>` : ""}
      </div>`;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $(".modal__panel").scrollTop = 0;
    setTimeout(() => $(".modal__close").focus({ preventScroll: true }), 50);
    if (push && location.hash !== `#item-${p.id}`) history.pushState({ item: p.id }, "", `#item-${p.id}`);
    bindMagnetic($("#modalBody"));
  }
  function closeModal(pop = true) {
    if (!modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (!drawer.classList.contains("is-open")) document.body.classList.remove("no-scroll");
    if (pop && /^#item-/.test(location.hash)) history.pushState(null, "", location.pathname + location.search);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-close]")) return closeModal();
    const th = t.closest("[data-thumb]");
    if (th) {
      const p = byId(location.hash.replace("#item-", ""));
      $$("[data-thumb]").forEach((b) => b.classList.toggle("is-on", b === th));
      const main = $("#pdMain");
      main.style.opacity = 0;
      setTimeout(() => { main.innerHTML = media(p, +th.dataset.thumb); main.style.opacity = 1; }, 150);
      return;
    }
    const main = t.closest("#pdMain");
    if (main) {
      main.classList.toggle("zoom");
      return;
    }
  });
  modal.addEventListener("mousemove", (e) => {
    const main = e.target.closest("#pdMain.zoom");
    if (!main) return;
    const r = main.getBoundingClientRect();
    const el = main.firstElementChild;
    el.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  });
  window.addEventListener("popstate", routeFromHash);
  window.addEventListener("hashchange", routeFromHash);
  function routeFromHash() {
    const m = location.hash.match(/^#item-(\d+)$/);
    if (m) openModal(m[1], false);
    else closeModal(false);
  }

  /* ---------- global click delegation ---------- */
  document.addEventListener("click", (e) => {
    const s = e.target.closest("[data-save]");
    if (s) { e.preventDefault(); e.stopPropagation(); return toggleSave(s.dataset.save, s); }
    const a = e.target.closest("[data-add]");
    if (a) { e.preventDefault(); return addToBag(a.dataset.add); }
    if (e.target.closest(".drawer")) return;
    const o = e.target.closest("[data-open]");
    if (o) return openModal(o.dataset.open);
    const c = e.target.closest(".card");
    if (c) return openModal(c.dataset.id);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.classList && e.target.classList.contains("card")) openModal(e.target.dataset.id);
  });

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.innerHTML = `<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>${esc(msg)}`;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2400);
  }

  /* ---------- mobile menu ---------- */
  const mmenu = $("#mmenu");
  function toggleMenu(on) {
    mmenu.classList.toggle("is-open", on);
    mmenu.setAttribute("aria-hidden", String(!on));
    if (on) document.body.classList.add("no-scroll");
    else if (!modal.classList.contains("is-open") && !drawer.classList.contains("is-open")) document.body.classList.remove("no-scroll");
  }
  $("#menuBtn").addEventListener("click", () => toggleMenu(true));
  mmenu.addEventListener("click", (e) => { if (e.target === mmenu || e.target.closest("[data-close]")) toggleMenu(false); });

  /* ---------- header: hide on scroll down, show on up ---------- */
  const header = $(".header");
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = scrollY;
    header.classList.toggle("is-scrolled", y > 10);
    const anyOpen = document.body.classList.contains("no-scroll");
    if (!anyOpen) header.classList.toggle("is-hidden", y > 400 && y > lastY + 4);
    if (y < lastY - 4) header.classList.remove("is-hidden");
    lastY = y;
    // hero parallax
    if (!reduce) {
      const hi = $("#heroImg img");
      if (hi && y < innerHeight * 1.2) hi.style.setProperty("--py", `${y * -0.08}px`);
    }
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  addEventListener("resize", () => moveInk());

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }),
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  function observeReveals() { $$(".reveal:not(.is-in)").forEach((el) => io.observe(el)); }

  /* ---------- counters ---------- */
  function runCounters() {
    $$(".count").forEach((el) => {
      const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0);
      if (reduce) { el.textContent = to.toFixed(dec); return; }
      const t0 = performance.now(), dur = 1600;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        el.textContent = (to * e).toFixed(dec);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- magnetic buttons ---------- */
  function bindMagnetic(root = document) {
    if (reduce || matchMedia("(hover: none)").matches) return;
    $$(".magnetic", root).forEach((b) => {
      if (b._mag) return;
      b._mag = true;
      b.addEventListener("mousemove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener("mouseleave", () => (b.style.transform = ""));
    });
  }

  /* ---------- contact links ---------- */
  const igURL = `https://instagram.com/${S.instagram}`;
  $("#sellLink").href = wa("Hi Lemari Gathan! I have some pieces I'd like to sell/consign. Here are the photos:");
  $("#igLink").href = igURL; $("#footIg").href = igURL;
  $("#waLink").href = wa("Hi Lemari Gathan!"); $("#footWa").href = wa("Hi Lemari Gathan!");
  $("#footMail").href = `mailto:${S.email}`;
  $("#footCity").textContent = S.city;
  $("#year").textContent = new Date().getFullYear();
  const srcText = { sheet: "Inventory synced from Google Sheets", cache: "Showing last synced inventory (sheet unreachable)", file: "Showing built-in inventory" };
  $("#dataSource").textContent = "· " + srcText[DATA_SOURCE];
  $("#dataSource").dataset.src = DATA_SOURCE;
  const liveN = P.filter((p) => !p.sold).length;
  $("#liveCount").textContent = `${liveN} pieces available`;

  $("#newsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = e.target.querySelector("input").value;
    const list = store.get("news", []);
    list.push(v); store.set("news", list);
    e.target.reset();
    toast("You're on the list — see you Friday!");
  });

  /* ---------- boot ---------- */
  $$(".loader__word span").forEach((s, i) => s.style.setProperty("--i", i));
  buildFilters();
  render();
  updateBadges();
  observeReveals();
  bindMagnetic();

  const finishLoad = () => {
    document.body.classList.add("loaded");
    document.body.classList.remove("is-loading");
    setTimeout(runCounters, 1100);
    setTimeout(() => { document.body.classList.add("settled"); $(".loader")?.remove(); }, 2600);
    routeFromHash();
    moveInk();
  };
  const minDelay = reduce ? 0 : 1300;
  const t0 = performance.now();
  const go = () => setTimeout(finishLoad, Math.max(0, minDelay - (performance.now() - t0)));
  if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
})();
