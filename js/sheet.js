/* =========================================================
   LEMARI GATHAN — Google Sheets backend
   ---------------------------------------------------------
   Reads the inventory from a Google Sheet published as CSV
   (set STORE.sheetCSV in js/products.js). Either link works:
     - the normal sheet link, with sharing set to "Anyone with the link: Viewer"
     - a File → Share → Publish to web → CSV link

   Order of preference:
     1. Live sheet
     2. Last copy of the sheet saved in this browser (if the sheet is unreachable)
     3. The PRODUCTS list in js/products.js (if no sheet is set up)

   Sheet columns (header row, any order, case-insensitive):
     id | brand | title | category | type | color | size | condition |
     price | old_price | listed | sold | description | measurements | images

     category     tops | bottoms | outerwear | footwear | accessories
     type         tee | longsleeve | shirt | hoodie | jacket | pants | shorts | shoes | cap | bag
     price        385000  (Rp385.000 or 385,000 also work)
     sold         TRUE / yes / 1 / sold  -> moves to Sold Archive
     status       optional: write "hidden" or "draft" to keep a row off the site
     listed       2026-11-21 or 21/11/2026 (blank = today)
     measurements Waist: 84 cm; Inseam: 80 cm
     images       one or more links separated by commas, spaces or new lines.
                  Google Drive share links are converted automatically
                  (the file must be shared as "Anyone with the link").
   ========================================================= */
(() => {
  "use strict";

  const CACHE_KEY = "lg:sheet-cache";
  const TIMEOUT = 8000;

  /* RFC 4180 CSV parser: handles quotes, escaped quotes, commas and newlines in cells */
  function parseCSV(text) {
    const rows = [];
    let row = [], cell = "", q = false;
    text = text.replace(/^﻿/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
        } else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((v) => v.trim() !== ""));
  }

  const num = (v) => {
    const n = parseInt(String(v || "").replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  };
  const truthy = (v) => /^(true|yes|y|1|sold|ya|terjual)$/i.test(String(v || "").trim());
  const pad = (n) => String(n).padStart(2, "0");
  function date(v) {
    v = String(v || "").trim();
    let m;
    if ((m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    if ((m = v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/))) {
      // DD/MM/YYYY (Indonesian format); switch to MM/DD/YYYY when the second part can't be a month
      const [d, mo] = +m[2] > 12 ? [m[2], m[1]] : [m[1], m[2]];
      return `${m[3]}-${pad(mo)}-${pad(d)}`;
    }
    const d = v ? new Date(v) : new Date();
    const ok = isNaN(d) ? new Date() : d;
    return `${ok.getFullYear()}-${pad(ok.getMonth() + 1)}-${pad(ok.getDate())}`;
  }
  /* Turn common share links into direct image links */
  function imageLink(u) {
    let m;
    if ((m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([\w-]{10,})/)))
      return `https://lh3.googleusercontent.com/d/${m[1]}=w1200`;
    if ((m = u.match(/^https?:\/\/(?:www\.)?dropbox\.com\/(.+?)(?:\?.*)?$/)))
      return `https://www.dropbox.com/${m[1]}?raw=1`;
    if ((m = u.match(/^https?:\/\/(?:www\.)?imgur\.com\/(\w{5,})$/)))
      return `https://i.imgur.com/${m[1]}.jpg`;
    return u;
  }
  // One or more links per cell, separated by new lines, spaces, or commas before the next link
  const images = (v) =>
    String(v || "").split(/\s+|,(?=\s*(?:https?:|assets\/))/).map((s) => s.trim().replace(/,$/, ""))
      .filter((s) => /^(https?:\/\/|assets\/|\.?\/)/.test(s)).map(imageLink);
  function measurements(v) {
    const out = {};
    String(v || "").split(/[;\n]+/).forEach((part) => {
      const i = part.indexOf(":");
      if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    });
    return out;
  }

  const CATS = ["tops", "bottoms", "outerwear", "footwear", "accessories"];
  const TYPES = ["tee", "longsleeve", "shirt", "hoodie", "jacket", "pants", "shorts", "shoes", "cap", "bag"];
  const DEFAULT_TYPE = { tops: "tee", bottoms: "pants", outerwear: "jacket", footwear: "shoes", accessories: "cap" };

  /* Column names: English or Indonesian, any case. "Jenis (gambar)" -> "jenis" */
  const ALIASES = {
    id: ["id", "kode"],
    brand: ["brand", "merek", "merk"],
    title: ["title", "nama_produk", "nama", "produk"],
    category: ["category", "kategori"],
    type: ["type", "jenis"],
    color: ["color", "colour", "warna"],
    size: ["size", "ukuran"],
    condition: ["condition", "kondisi"],
    price: ["price", "harga"],
    old_price: ["old_price", "oldprice", "original_price", "harga_lama", "harga_coret", "harga_awal"],
    listed: ["listed", "date", "tanggal", "tanggal_upload", "tanggal_posting"],
    sold: ["sold", "terjual"],
    status: ["status"],
    description: ["description", "deskripsi", "keterangan"],
    measurements: ["measurements", "measurement", "ukuran_detail", "detail_ukuran"],
  };
  const PHOTO_COL = /^(images?|photos?|foto|gambar|image_url|url_foto)(_?\d+)?$/;
  // Indonesian dropdown labels -> internal values
  const CAT_MAP = { atasan: "tops", bawahan: "bottoms", outer: "outerwear", jaket: "outerwear", "jaket/outer": "outerwear", sepatu: "footwear", "alas_kaki": "footwear", aksesoris: "accessories", aksesori: "accessories" };
  const TYPE_MAP = { kaos: "tee", kaos_lengan_panjang: "longsleeve", sweater: "longsleeve", kemeja: "shirt", jaket: "jacket", celana_panjang: "pants", celana: "pants", jeans: "pants", celana_pendek: "shorts", sepatu: "shoes", topi: "cap", tas: "bag" };
  const key = (v) => String(v || "").trim().toLowerCase().replace(/\(.*?\)/g, "").trim().replace(/[\s-]+/g, "_");

  function toProducts(rows) {
    if (rows.length < 2) throw new Error("Sheet has no product rows");
    const head = rows[0].map(key);
    const idx = {};
    for (const [canon, names] of Object.entries(ALIASES)) {
      const i = head.findIndex((h) => names.includes(h));
      if (i > -1) idx[canon] = i;
    }
    const photoCols = head.map((h, i) => (PHOTO_COL.test(h) ? i : -1)).filter((i) => i > -1);
    if (idx.title == null || idx.price == null) throw new Error("Sheet needs at least a title/'Nama Produk' and price/'Harga' column");
    const col = (r, c) => (idx[c] == null ? "" : String(r[idx[c]] || "").trim());

    return rows.slice(1).map((r, n) => {
      const catRaw = key(col(r, "category"));
      const category = CATS.includes(catRaw) ? catRaw : CAT_MAP[catRaw] || "accessories";
      const typeRaw = key(col(r, "type"));
      const type = TYPES.includes(typeRaw) ? typeRaw : TYPE_MAP[typeRaw] || DEFAULT_TYPE[category] || "tee";
      const price = num(col(r, "price"));
      const old = num(col(r, "old_price"));
      const cond = num(col(r, "condition"));
      const color = col(r, "color");
      const status = col(r, "status").toLowerCase();
      return {
        id: num(col(r, "id")) || n + 1,
        brand: col(r, "brand") || "Vintage",
        title: col(r, "title"),
        category,
        type,
        color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#8a8a8a",
        size: col(r, "size") || "OS",
        condition: Math.min(10, Math.max(1, cond || 8)),
        price,
        oldPrice: old > price ? old : undefined,
        listed: date(col(r, "listed")),
        sold: truthy(col(r, "sold")) || /^(sold|terjual|laku)/.test(status),
        description: col(r, "description"),
        measurements: measurements(col(r, "measurements")),
        images: photoCols.flatMap((i) => images(r[i])),
        hidden: /^(hide|hidden|draft|sembunyi|disembunyikan|arsip)/.test(status),
      };
    }).filter((p) => p.title && p.price > 0 && !p.hidden);
  }

  /* Accept a normal Google Sheets link (shared "Anyone with the link") and
     turn it into a CSV feed. "Publish to web" CSV links are used as-is. */
  function csvURL(url, tab) {
    const m = url.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]{20,})/);
    if (!m || /\/pub\b|output=csv|tqx=out:csv/.test(url)) return url;
    const gid = (url.match(/[#&?]gid=(\d+)/) || [])[1];
    const pick = tab ? "&sheet=" + encodeURIComponent(tab) : gid ? "&gid=" + gid : "";
    return `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&headers=1${pick}`;
  }

  /* JSONP via Google's gviz endpoint. Loaded as a <script>, so it isn't
     subject to cross-origin (CORS) restrictions the way fetch() is. */
  let jsonpSeq = 0; // unique callback names: products and settings load at the same moment
  function sheetJSONP(url, tab) {
    const id = (url.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]{20,})/) || [])[1];
    if (!id || /\/d\/e\//.test(url)) return Promise.reject(new Error("Not a regular sheet link"));
    const gid = (url.match(/[#&?]gid=(\d+)/) || [])[1];
    return new Promise((resolve, reject) => {
      const cb = "__lgSheet" + Date.now() + "_" + (++jsonpSeq) + Math.floor(Math.random() * 1e6);
      const s = document.createElement("script");
      const done = (fn, arg) => { clearTimeout(t); delete window[cb]; s.remove(); fn(arg); };
      const t = setTimeout(() => done(reject, new Error("Timed out loading the sheet")), TIMEOUT);
      window[cb] = (resp) => {
        if (!resp || resp.status === "error") {
          const e = resp && resp.errors && resp.errors[0];
          return done(reject, new Error(e ? e.detailed_message || e.message : "Sheet returned an error"));
        }
        try { done(resolve, gvizRows(resp.table)); } catch (err) { done(reject, err); }
      };
      s.onerror = () => done(reject, new Error("Could not load the sheet (is it shared as 'Anyone with the link'?)"));
      const pick = tab ? "&sheet=" + encodeURIComponent(tab) : gid ? "&gid=" + gid : "";
      s.src = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json;responseHandler:${cb}&headers=1${pick}&_=${Date.now()}`;
      document.head.appendChild(s);
    });
  }
  function gvizCell(c) {
    if (!c) return "";
    if (c.f != null) return String(c.f);
    if (c.v == null) return "";
    const m = typeof c.v === "string" && c.v.match(/^Date\((\d+),(\d+),(\d+)/);
    return m ? `${m[1]}-${pad(+m[2] + 1)}-${pad(m[3])}` : String(c.v);
  }
  function gvizRows(table) {
    const head = table.cols.map((c) => (c.label || "").trim());
    const body = table.rows.map((r) => (r.c || []).map(gvizCell));
    // If Google didn't detect the header row, the first data row is the header
    return head.filter(Boolean).length >= 2 ? [head, ...body] : body;
  }

  async function fetchCSV(url, tab) {
    if (tab && /\/pub\b|output=csv/.test(url)) throw new Error("Publish-to-web links can't read other tabs");
    url = csvURL(url, tab);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const sep = url.includes("?") ? "&" : "?";
      const res = await fetch(url + sep + "_=" + Date.now(), { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      if (/^\s*</.test(text)) throw new Error("Got a web page instead of CSV (is the sheet shared publicly?)");
      return parseCSV(text);
    } finally { clearTimeout(t); }
  }

  // Rows of a tab (first tab when `tab` is empty): JSONP first, CSV as a fallback
  async function fetchRows(url, tab) {
    const errors = [];
    for (const method of [sheetJSONP, fetchCSV]) {
      try { return await method(url, tab); }
      catch (err) { errors.push(`${method.name}: ${err.message}`); }
    }
    throw new Error(errors.join(" | "));
  }
  window.fetchSheetRows = fetchRows;

  async function fetchSheet(url) {
    const errors = [];
    for (const method of [sheetJSONP, fetchCSV]) {
      try { return toProducts(await method(url)); }
      catch (err) { errors.push(`${method.name}: ${err.message}`); }
    }
    throw new Error(errors.join(" | "));
  }

  window.loadProducts = async function () {
    const url = (window.STORE && window.STORE.sheetCSV || "").trim();
    if (!url) return { products: window.PRODUCTS || [], source: "file" };
    try {
      const products = await fetchSheet(url);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(products)); } catch {}
      return { products, source: "sheet" };
    } catch (err) {
      console.warn("[Lemari Gathan] Could not load the Google Sheet:", err.message);
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
        if (Array.isArray(cached) && cached.length) return { products: cached, source: "cache" };
      } catch {}
      return { products: window.PRODUCTS || [], source: "file" };
    }
  };

  // exposed for testing
  window.__sheet = { parseCSV, toProducts, csvURL, date, gvizRows, images };
})();
