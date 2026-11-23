/* =========================================================
   LEMARI GATHAN — Google Sheets backend
   ---------------------------------------------------------
   Reads the inventory from a Google Sheet published as CSV
   (set STORE.sheetCSV in js/products.js).

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
    if ((m = v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/))) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`; // DD/MM/YYYY
    const d = v ? new Date(v) : new Date();
    const ok = isNaN(d) ? new Date() : d;
    return `${ok.getFullYear()}-${pad(ok.getMonth() + 1)}-${pad(ok.getDate())}`;
  }
  function driveLink(u) {
    const m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
    return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w1200` : u;
  }
  const images = (v) =>
    String(v || "").split(/[\s,]+/).map((s) => s.trim()).filter((s) => /^(https?:\/\/|assets\/|\.?\/)/.test(s)).map(driveLink);
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

  function toProducts(rows) {
    if (rows.length < 2) throw new Error("Sheet has no product rows");
    const head = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
    const col = (r, ...names) => {
      for (const n of names) { const i = head.indexOf(n); if (i > -1) return (r[i] || "").trim(); }
      return "";
    };
    if (!head.includes("title") || !head.includes("price")) throw new Error("Sheet needs at least 'title' and 'price' columns");
    return rows.slice(1).map((r, idx) => {
      const category = (col(r, "category").toLowerCase() || "tops");
      const type = col(r, "type").toLowerCase();
      const old = num(col(r, "old_price", "oldprice", "original_price"));
      const price = num(col(r, "price"));
      const cond = num(col(r, "condition"));
      const color = col(r, "color", "colour");
      return {
        id: num(col(r, "id")) || idx + 1,
        brand: col(r, "brand") || "Vintage",
        title: col(r, "title"),
        category: CATS.includes(category) ? category : "accessories",
        type: TYPES.includes(type) ? type : DEFAULT_TYPE[category] || "tee",
        color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#8a8a8a",
        size: col(r, "size") || "OS",
        condition: Math.min(10, Math.max(1, cond || 8)),
        price,
        oldPrice: old > price ? old : undefined,
        listed: date(col(r, "listed", "date")),
        sold: truthy(col(r, "sold", "status")),
        description: col(r, "description"),
        measurements: measurements(col(r, "measurements")),
        images: images(col(r, "images", "image", "photos")),
        hidden: /^(hide|hidden|draft)$/i.test(col(r, "status")) || truthy(col(r, "hidden")),
      };
    }).filter((p) => p.title && p.price > 0 && !p.hidden);
  }

  async function fetchSheet(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const sep = url.includes("?") ? "&" : "?";
      const res = await fetch(url + sep + "_=" + Date.now(), { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      if (/^\s*</.test(text)) throw new Error("Got a web page instead of CSV — publish the sheet as CSV");
      return toProducts(parseCSV(text));
    } finally { clearTimeout(t); }
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
  window.__sheet = { parseCSV, toProducts };
})();
