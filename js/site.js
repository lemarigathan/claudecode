/* =========================================================
   LEMARI GATHAN — site content from the "Pengaturan" sheet tab
   ---------------------------------------------------------
   Every editable piece of the site is listed in FIELDS below:
     [key, section, label, type, help]
   Elements in index.html carry data-cms="key". Text produced by
   app.js asks for it with window.T("key", "default").

   The sheet tab has columns: Bagian | Kunci | Pengaturan | Isi | Keterangan
   Only "Kunci" and "Isi" are read. An empty Isi keeps the built-in text.

   Text formatting in Isi:  *miring*   **tebal**   new line = line break
   ========================================================= */
(() => {
  "use strict";

  const TAB = "Pengaturan";
  const CACHE_KEY = "lg:site-cache";

  // type: text | rich | btn | lines | list | brands | img | media | attr:<name> | count | suffix | show | store:<field> | js | title
  const FIELDS = [
    // ---- Toko ----
    ["toko.nama", "Toko", "Judul tab browser", "title", "Teks di tab browser & hasil Google."],
    ["toko.deskripsi", "Toko", "Deskripsi Google", "attr:content", "Deskripsi singkat untuk hasil pencarian Google."],
    ["toko.whatsapp", "Toko", "Nomor WhatsApp", "store:whatsapp", "Format 628xxxxxxxxx (tanpa + atau spasi). Dipakai semua tombol WhatsApp."],
    ["toko.instagram", "Toko", "Username Instagram", "store:instagram", "Tanpa @."],
    ["toko.email", "Toko", "Email", "store:email", ""],
    ["toko.kota", "Toko", "Kota", "store:city", "Tampil di footer & info pengiriman."],
    ["logo.atas", "Toko", "Logo baris 1", "text", "Huruf besar di logo kiri atas."],
    ["logo.bawah", "Toko", "Logo baris 2", "text", ""],
    ["penjual.nama", "Toko", "Nama penjual", "js", "Tampil di halaman produk."],
    ["penjual.balas", "Toko", "Info waktu balas", "js", ""],

    // ---- Pengumuman ----
    ["pengumuman.tampil", "Pengumuman (bar hitam paling atas)", "Tampilkan?", "show", "Ya / Tidak"],
    ["pengumuman.isi", "Pengumuman (bar hitam paling atas)", "Isi pengumuman", "list", "Satu pengumuman per baris (Ctrl/Cmd + Enter untuk baris baru)."],

    // ---- Header & menu ----
    ["header.cari", "Header & menu", "Teks kotak pencarian", "attr:placeholder", ""],
    ["header.jual", "Header & menu", "Tombol jual", "btn", ""],
    ["nav.all", "Header & menu", "Menu: semua", "text", ""],
    ["kategori.tops", "Header & menu", "Nama kategori Atasan", "text", "Dipakai di menu, kotak kategori, filter & footer."],
    ["kategori.bottoms", "Header & menu", "Nama kategori Bawahan", "text", ""],
    ["kategori.outerwear", "Header & menu", "Nama kategori Jaket/Outer", "text", ""],
    ["kategori.footwear", "Header & menu", "Nama kategori Sepatu", "text", ""],
    ["kategori.accessories", "Header & menu", "Nama kategori Aksesoris", "text", ""],
    ["nav.sale", "Header & menu", "Menu: turun harga", "text", ""],
    ["nav.sold", "Header & menu", "Menu: arsip terjual", "text", ""],

    // ---- Video ----
    ["video.tampil", "Video (paling atas)", "Tampilkan?", "show", "Ya / Tidak"],
    ["video.hd", "Video (paling atas)", "Link video (komputer)", "media:data-src-hd", "Link .mp4 langsung. Video Google Drive TIDAK bisa diputar langsung."],
    ["video.hp", "Video (paling atas)", "Link video (HP)", "media:data-src-sd", "Versi lebih kecil untuk HP. Kosong = pakai video komputer."],
    ["video.poster", "Video (paling atas)", "Gambar sebelum video jalan", "media:poster", "Link gambar."],
    ["video.label", "Video (paling atas)", "Label kiri bawah", "btn", ""],
    ["video.tombol", "Video (paling atas)", "Teks tombol belanja", "btn", ""],
    ["video.produk", "Video (paling atas)", "Produk yang dibuka tombol", "js", "ID produk, atau sebagian nama produk. Tombol hilang kalau produk terjual/tidak ada."],

    // ---- Hero ----
    ["hero.tampil", "Hero (judul besar + foto)", "Tampilkan?", "show", "Ya / Tidak"],
    ["hero.kecil", "Hero (judul besar + foto)", "Teks kecil di atas judul", "text", ""],
    ["hero.judul", "Hero (judul besar + foto)", "Judul besar", "lines", "Satu baris per baris. *miring* untuk huruf miring."],
    ["hero.sub", "Hero (judul besar + foto)", "Teks di bawah judul", "rich", ""],
    ["hero.tombol1", "Hero (judul besar + foto)", "Tombol hitam", "btn", ""],
    ["hero.tombol2", "Hero (judul besar + foto)", "Tombol putih", "btn", ""],
    ["hero.angka1", "Hero (judul besar + foto)", "Statistik 1: angka", "count", "Angka saja, contoh 320 atau 4.9"],
    ["hero.akhiran1", "Hero (judul besar + foto)", "Statistik 1: simbol", "suffix", "Contoh + atau ★"],
    ["hero.label1", "Hero (judul besar + foto)", "Statistik 1: label", "text", ""],
    ["hero.angka2", "Hero (judul besar + foto)", "Statistik 2: angka", "count", ""],
    ["hero.akhiran2", "Hero (judul besar + foto)", "Statistik 2: simbol", "suffix", ""],
    ["hero.label2", "Hero (judul besar + foto)", "Statistik 2: label", "text", ""],
    ["hero.angka3", "Hero (judul besar + foto)", "Statistik 3: angka", "count", ""],
    ["hero.akhiran3", "Hero (judul besar + foto)", "Statistik 3: simbol", "suffix", ""],
    ["hero.label3", "Hero (judul besar + foto)", "Statistik 3: label", "text", ""],
    ["hero.foto", "Hero (judul besar + foto)", "Foto", "img", "Link gambar (Google Drive boleh)."],
    ["hero.tag", "Hero (judul besar + foto)", "Teks kartu di foto", "text", "Jumlah produk dihitung otomatis."],
    ["hero.stiker", "Hero (judul besar + foto)", "Teks stiker bulat", "text", ""],

    // ---- Brand ----
    ["brand.tampil", "Daftar brand (teks berjalan)", "Tampilkan?", "show", "Ya / Tidak"],
    ["brand.isi", "Daftar brand (teks berjalan)", "Brand", "brands", "Pisahkan dengan koma."],

    // ---- Kategori & produk ----
    ["kategori_bagian.tampil", "Kategori & produk", "Tampilkan kotak kategori?", "show", "Ya / Tidak"],
    ["kategori_bagian.judul", "Kategori & produk", "Judul kotak kategori", "text", ""],
    ["kategori_bagian.link", "Kategori & produk", "Link lihat semua", "text", ""],
    ["produk.judul", "Kategori & produk", "Judul daftar produk", "js", ""],
    ["produk.judul_sale", "Kategori & produk", "Judul saat filter turun harga", "js", ""],
    ["produk.judul_sold", "Kategori & produk", "Judul arsip terjual", "js", ""],
    ["produk.kosong_judul", "Kategori & produk", "Judul kalau tidak ada hasil", "text", ""],
    ["produk.kosong_teks", "Kategori & produk", "Teks kalau tidak ada hasil", "text", ""],

    // ---- Jual ----
    ["jual.tampil", "Banner jual / titip", "Tampilkan?", "show", "Ya / Tidak"],
    ["jual.kecil", "Banner jual / titip", "Teks kecil", "text", ""],
    ["jual.judul", "Banner jual / titip", "Judul", "rich", "*miring* untuk huruf miring."],
    ["jual.teks", "Banner jual / titip", "Teks", "rich", ""],
    ["jual.tombol", "Banner jual / titip", "Tombol", "btn", ""],
    ["jual.pesan", "Banner jual / titip", "Pesan WhatsApp otomatis", "js", "Pesan yang sudah terisi saat orang klik tombol."],

    // ---- Cara kerja ----
    ["cara.tampil", "Cara kerja", "Tampilkan?", "show", "Ya / Tidak"],
    ["cara.judul", "Cara kerja", "Judul", "text", ""],
    ["cara.1_judul", "Cara kerja", "Langkah 1: judul", "text", ""],
    ["cara.1_teks", "Cara kerja", "Langkah 1: teks", "rich", ""],
    ["cara.2_judul", "Cara kerja", "Langkah 2: judul", "text", ""],
    ["cara.2_teks", "Cara kerja", "Langkah 2: teks", "rich", ""],
    ["cara.3_judul", "Cara kerja", "Langkah 3: judul", "text", ""],
    ["cara.3_teks", "Cara kerja", "Langkah 3: teks", "rich", ""],
    ["kondisi.judul", "Cara kerja", "Panduan kondisi: judul", "text", ""],
    ["kondisi.1_nilai", "Cara kerja", "Kondisi 1: nilai", "text", ""],
    ["kondisi.1_teks", "Cara kerja", "Kondisi 1: arti", "text", ""],
    ["kondisi.2_nilai", "Cara kerja", "Kondisi 2: nilai", "text", ""],
    ["kondisi.2_teks", "Cara kerja", "Kondisi 2: arti", "text", ""],
    ["kondisi.3_nilai", "Cara kerja", "Kondisi 3: nilai", "text", ""],
    ["kondisi.3_teks", "Cara kerja", "Kondisi 3: arti", "text", ""],
    ["kondisi.4_nilai", "Cara kerja", "Kondisi 4: nilai", "text", ""],
    ["kondisi.4_teks", "Cara kerja", "Kondisi 4: arti", "text", ""],

    // ---- Tentang ----
    ["tentang.tampil", "Tentang", "Tampilkan?", "show", "Ya / Tidak"],
    ["tentang.foto", "Tentang", "Foto", "img", "Link gambar (Google Drive boleh)."],
    ["tentang.kecil", "Tentang", "Teks kecil", "text", ""],
    ["tentang.judul", "Tentang", "Judul", "rich", ""],
    ["tentang.p1", "Tentang", "Paragraf 1", "rich", ""],
    ["tentang.p2", "Tentang", "Paragraf 2", "rich", "Kosongkan isi dengan tanda - untuk menyembunyikan."],
    ["tentang.tombol_ig", "Tentang", "Tombol Instagram", "btn", ""],
    ["tentang.tombol_wa", "Tentang", "Link WhatsApp", "btn", ""],

    // ---- Newsletter ----
    ["news.tampil", "Newsletter", "Tampilkan?", "show", "Ya / Tidak"],
    ["news.judul", "Newsletter", "Judul", "rich", ""],
    ["news.teks", "Newsletter", "Teks", "rich", ""],
    ["news.placeholder", "Newsletter", "Teks kotak email", "attr:placeholder", ""],
    ["news.tombol", "Newsletter", "Tombol", "btn", ""],
    ["news.sukses", "Newsletter", "Pesan setelah daftar", "js", ""],

    // ---- Footer ----
    ["footer.tagline", "Footer", "Tagline", "rich", ""],
    ["footer.judul_shop", "Footer", "Judul kolom 1", "text", ""],
    ["footer.judul_help", "Footer", "Judul kolom 2", "text", ""],
    ["footer.judul_kontak", "Footer", "Judul kolom 3", "text", ""],
    ["footer.copyright", "Footer", "Teks copyright", "js", "{tahun} diganti tahun sekarang."],

    // ---- Halaman produk & keranjang ----
    ["ui.quick", "Halaman produk & keranjang", "Tombol lihat cepat", "js", ""],
    ["ui.buy", "Halaman produk & keranjang", "Tombol beli", "js", ""],
    ["ui.add", "Halaman produk & keranjang", "Tombol tambah ke keranjang", "js", ""],
    ["ui.inbag", "Halaman produk & keranjang", "Teks sudah di keranjang", "js", ""],
    ["ui.save", "Halaman produk & keranjang", "Tombol simpan", "js", ""],
    ["ui.offer", "Halaman produk & keranjang", "Tombol tawar", "js", ""],
    ["ui.similar_ask", "Halaman produk & keranjang", "Tombol untuk produk terjual", "js", ""],
    ["ui.desc", "Halaman produk & keranjang", "Judul deskripsi", "js", ""],
    ["ui.measure", "Halaman produk & keranjang", "Judul ukuran", "js", ""],
    ["ui.measure_note", "Halaman produk & keranjang", "Catatan ukuran", "js", ""],
    ["ui.shipping", "Halaman produk & keranjang", "Judul pengiriman", "js", ""],
    ["ui.shipping_text", "Halaman produk & keranjang", "Info pengiriman", "js", "{kota} diganti kota toko."],
    ["ui.similar", "Halaman produk & keranjang", "Judul produk serupa", "js", ""],
    ["ui.checkout", "Halaman produk & keranjang", "Tombol checkout", "btn", ""],
    ["ui.ship_note", "Halaman produk & keranjang", "Catatan ongkir di keranjang", "text", ""],
    ["ui.pesan_beli", "Halaman produk & keranjang", "Pesan WA beli 1 produk", "js", "{produk} diganti nama produk, ukuran & harga."],
    ["ui.pesan_checkout", "Halaman produk & keranjang", "Pesan WA checkout (pembuka)", "js", "Daftar produk & total ditambahkan otomatis."],

    // ---- Pembayaran & ongkir ----
    ["bayar.qris", "Pembayaran & ongkir", "QRIS: link gambar QR", "js", "Link gambar QRIS statis dari bank/e-wallet kamu (Google Drive boleh). Kosong = QRIS tidak tampil."],
    ["bayar.qris_nama", "Pembayaran & ongkir", "QRIS: nama merchant", "js", "Nama yang muncul saat pembeli scan."],
    ["bayar.bank", "Pembayaran & ongkir", "Transfer bank", "js", "Satu rekening per baris: Bank | Nomor | Atas nama. Kosong = tidak tampil."],
    ["bayar.ewallet", "Pembayaran & ongkir", "E-wallet", "js", "Satu per baris: DANA / OVO / GoPay / ShopeePay | Nomor | Atas nama. Kosong = tidak tampil."],
    ["bayar.paypal_id", "Pembayaran & ongkir", "PayPal: Client ID", "js", "Dari developer.paypal.com → Apps & Credentials (Live). Kosong = PayPal tidak tampil."],
    ["bayar.paypal_kurs", "Pembayaran & ongkir", "PayPal: kurs (Rp per 1 USD)", "js", "PayPal tidak menerima Rupiah, jadi total dikonversi ke USD dengan kurs ini."],
    ["bayar.wa", "Pembayaran & ongkir", "Tampilkan opsi bayar via chat WhatsApp?", "js", "Ya / Tidak"],
    ["ongkir.zona", "Pembayaran & ongkir", "Zona & ongkir", "js", "Satu zona per baris: Nama zona | ongkir. 0 = gratis. Kosong = ongkir dikonfirmasi lewat chat."],
    ["ongkir.catatan", "Pembayaran & ongkir", "Catatan ongkir", "js", ""],
    ["pesanan.webhook", "Pembayaran & ongkir", "Link penyimpan pesanan (opsional)", "js", "URL Web App Google Apps Script agar data pendaftaran & pesanan tersimpan di sheet PRIBADI. Lihat tab Panduan."],

    // ---- Akun & checkout ----
    ["akun.judul", "Akun & checkout", "Judul daftar/akun", "js", ""],
    ["akun.teks", "Akun & checkout", "Teks di form daftar", "js", ""],
    ["checkout.langkah1", "Akun & checkout", "Langkah 1", "js", ""],
    ["checkout.langkah2", "Akun & checkout", "Langkah 2", "js", ""],
    ["checkout.langkah3", "Akun & checkout", "Langkah 3", "js", ""],
    ["checkout.tombol_lanjut", "Akun & checkout", "Tombol lanjut ke pembayaran", "js", ""],
    ["checkout.tombol_pesan", "Akun & checkout", "Tombol buat pesanan", "js", ""],
    ["checkout.sukses_judul", "Akun & checkout", "Judul setelah pesan", "js", "{kode} diganti nomor pesanan."],
    ["checkout.sukses_teks", "Akun & checkout", "Teks setelah pesan", "js", ""],
    ["checkout.pesan_wa", "Akun & checkout", "Pesan WA konfirmasi pesanan", "js", "Detail pesanan, data pembeli & total ditambahkan otomatis di bawahnya."],
  ];

  /* ---------- helpers ---------- */
  const $$ = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // *italic*  **bold**  new lines
  const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\r?\n/g, "<br />");
  // reverse of fmt, to produce the defaults that go into the sheet
  const unfmt = (el) => el.innerHTML
    .replace(/<br\s*\/?>/gi, "\n").replace(/<(strong|b)>(.*?)<\/\1>/gi, "**$2**").replace(/<(em|i)>(.*?)<\/\1>/gi, "*$2*")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, "\n").trim();
  const firstText = (el) => [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const link = (u) => (window.__sheet && window.__sheet.images ? window.__sheet.images(u)[0] || u : u);
  // Scrolling bars move by half their width, so the content is two identical halves.
  // Short lists are repeated so each half is wider than the screen (no empty gap).
  const loop = (html, approxChars) => {
    const reps = Math.max(1, Math.ceil(320 / Math.max(approxChars, 1)));
    const half = html.repeat(reps);
    return half + half;
  };
  const yes = (v) => !/^(tidak|no|false|0|sembunyi|hide|off)/i.test(String(v).trim());

  const DEFAULTS_JS = {
    "penjual.nama": "Gathan",
    "penjual.balas": "Usually replies within an hour",
    "video.produk": "Lot 704",
    "produk.judul": "Fresh in the lemari",
    "produk.judul_sale": "Price drops",
    "produk.judul_sold": "Sold archive",
    "jual.pesan": "Hi Lemari Gathan! I have some pieces I'd like to sell/consign. Here are the photos:",
    "news.sukses": "You're on the list — see you Friday!",
    "footer.copyright": "© {tahun} Lemari Gathan. All items are pre-owned.",
    "ui.quick": "Quick view",
    "ui.buy": "Buy now via WhatsApp",
    "ui.add": "Add to bag",
    "ui.inbag": "In your bag ✓",
    "ui.save": "Save",
    "ui.offer": "Make an offer",
    "ui.similar_ask": "Ask for something similar",
    "ui.desc": "Description",
    "ui.measure": "Measurements",
    "ui.measure_note": "Measured flat, in centimetres.",
    "ui.shipping": "Shipping & returns",
    "ui.shipping_text": "Ships from {kota} via JNE, J&T or SiCepat. Paid before 3 PM ships same day. Because every piece is pre-owned and one of one, all sales are final — ask me anything before you buy.",
    "ui.similar": "You might also like",
    "ui.pesan_beli": "Hi Lemari Gathan! I want to buy:\n{produk}\n\nIs it still available?",
    "ui.pesan_checkout": "Hi Lemari Gathan! I'd like to order:",
    "bayar.qris": "",
    "bayar.qris_nama": "Lemari Gathan",
    "bayar.bank": "",
    "bayar.ewallet": "",
    "bayar.paypal_id": "",
    "bayar.paypal_kurs": "16000",
    "bayar.wa": "Ya",
    "ongkir.zona": "Medan | 0\nSumatera Utara | 20000\nPulau Sumatera | 35000\nJawa & Bali | 45000\nLainnya | 60000",
    "ongkir.catatan": "Shipped with JNE / J&T / SiCepat. Paid before 3 PM ships same day.",
    "pesanan.webhook": "",
    "akun.judul": "Your details",
    "akun.teks": "Sign up once and we'll remember your details for next time. We only use them to ship your order.",
    "checkout.langkah1": "Details",
    "checkout.langkah2": "Payment",
    "checkout.langkah3": "Done",
    "checkout.tombol_lanjut": "Continue to payment",
    "checkout.tombol_pesan": "Place order",
    "checkout.sukses_judul": "Order {kode} placed!",
    "checkout.sukses_teks": "Complete the payment below, then send us the proof on WhatsApp. Your pieces are held for 24 hours.",
    "checkout.pesan_wa": "Hi Lemari Gathan! I just placed an order on the website.",
  };

  const values = {}; // key -> value from the sheet (non-empty only)
  window.T = (key, fallback) => (values[key] != null ? values[key] : DEFAULTS_JS[key] != null ? DEFAULTS_JS[key] : fallback);

  /* ---------- read current page (defaults for the sheet) ---------- */
  function readField([key, , , type]) {
    if (type === "js") return DEFAULTS_JS[key] || "";
    if (type === "title") return document.title;
    if (type.startsWith("store:")) return (window.STORE || {})[type.slice(6)] || "";
    const el = document.querySelector(`[data-cms~="${key}"]`);
    if (!el) return "";
    if (type === "show") return "Ya";
    if (type.startsWith("attr:")) return el.getAttribute(type.slice(5)) || "";
    if (type.startsWith("media:")) return el.getAttribute(type.slice(6)) || "";
    if (type === "img") return el.getAttribute("src") || "";
    if (type === "count") return el.dataset.to || "";
    if (type === "suffix") { const n = el.lastChild; return n && n.nodeType === 3 ? n.textContent.trim() : ""; }
    if (type === "btn") { const n = firstText(el); return n ? n.textContent.trim() : ""; }
    if (type === "lines") return [...el.querySelectorAll(".line > span")].map(unfmt).join("\n");
    if (type === "list") { const items = [...el.children].map((c) => c.textContent.trim()).filter((t) => t && t !== "✦"); return [...new Set(items)].join("\n"); }
    if (type === "brands") return [...new Set([...el.children].map((c) => c.textContent.trim()))].join(", ");
    if (type === "rich") return unfmt(el);
    return el.textContent.trim();
  }

  /* ---------- write a value into the page ---------- */
  function applyField([key, , , type], v) {
    if (type === "js") return;
    if (type === "title") { document.title = v; $$('meta[property="og:title"]').forEach((m) => m.setAttribute("content", v)); return; }
    if (type.startsWith("store:")) { window.STORE[type.slice(6)] = type === "store:whatsapp" ? v.replace(/[^\d]/g, "") : v.replace(/^@/, ""); return; }
    $$(`[data-cms~="${key}"]`).forEach((el) => {
      if (type === "show") { if (!yes(v)) el.hidden = true, el.dataset.off = "1"; return; }
      if (type.startsWith("attr:")) return el.setAttribute(type.slice(5), v);
      if (type.startsWith("media:")) return el.setAttribute(type.slice(6), link(v));
      if (type === "img") {
        const original = el.getAttribute("src");
        el.onerror = () => { el.onerror = null; console.warn("[Lemari Gathan] Photo link failed for", key, "- showing the original"); el.src = original; };
        el.src = link(v); el.removeAttribute("srcset"); return;
      }
      if (type === "count") { const n = parseFloat(String(v).replace(",", ".")); if (!isNaN(n)) { el.dataset.to = n; el.dataset.dec = String(n).includes(".") ? String(n).split(".")[1].length : 0; } return; }
      if (type === "suffix") { const n = el.lastChild; if (n && n.nodeType === 3) n.textContent = v; else el.append(v); return; }
      if (type === "btn") { const n = firstText(el); if (n) n.textContent = (n.textContent.match(/^\s*/)[0]) + v + " "; else el.prepend(v); return; }
      if (type === "lines") { el.innerHTML = v.split(/\r?\n/).filter((l) => l.trim()).map((l) => `<span class="line"><span>${fmt(l.trim())}</span></span>`).join(""); return; }
      if (type === "list") {
        const items = v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        const once = items.map((t) => `<span>${esc(t)}</span><span>✦</span>`).join("");
        el.innerHTML = loop(once, items.join("").length + items.length * 6);
        return;
      }
      if (type === "brands") {
        const names = v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
        el.innerHTML = loop(names.map((t) => `<span>${esc(t)}</span>`).join(""), names.join("").length * 2.2 + names.length * 4);
        return;
      }
      if (type === "rich") { if (v.trim() === "-") el.hidden = true; else el.innerHTML = fmt(v); return; }
      el.textContent = v;
    });
  }

  function parse(rows) {
    if (!rows || rows.length < 2) throw new Error("Settings tab is empty");
    const head = rows[0].map((h) => String(h).trim().toLowerCase());
    const k = head.findIndex((h) => /^(kunci|key)$/.test(h));
    const v = head.findIndex((h) => /^(isi|value|nilai)$/.test(h));
    if (k < 0 || v < 0) throw new Error("Settings tab needs 'Kunci' and 'Isi' columns");
    const out = {};
    rows.slice(1).forEach((r) => {
      const key = String(r[k] || "").trim(), val = String(r[v] == null ? "" : r[v]);
      if (key && val.trim() !== "") out[key] = val.replace(/\r\n/g, "\n").trim();
    });
    return out;
  }

  /* Load the Pengaturan tab and apply it. Never throws: the built-in text stays if anything fails. */
  window.loadSite = async function () {
    const url = (window.STORE && window.STORE.sheetCSV || "").trim();
    let data = null, source = "file";
    if (url && window.fetchSheetRows) {
      try {
        data = parse(await window.fetchSheetRows(url, TAB));
        source = "sheet";
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
      } catch (err) {
        console.warn("[Lemari Gathan] Could not load the Pengaturan tab:", err.message);
        try { data = JSON.parse(localStorage.getItem(CACHE_KEY)); if (data) source = "cache"; } catch {}
      }
    }
    if (data) {
      Object.assign(values, data);
      for (const f of FIELDS) if (data[f[0]] != null) {
        try { applyField(f, data[f[0]]); } catch (err) { console.warn("[Lemari Gathan] Setting", f[0], err.message); }
      }
    }
    // keep the intro animation's letters in sync with the logo
    if (data && (data["logo.atas"] || data["logo.bawah"])) {
      const w = document.querySelector(".loader__word");
      const word = (a) => [...a].map((ch, i) => `<span style="--i:${i}">${esc(ch)}</span>`).join("");
      if (w) w.innerHTML = word(T("logo.atas", "LEMARI")) + '<span class="sp"></span>' + word(T("logo.bawah", "GATHAN"));
    }
    return source;
  };

  // used by tools/build-sheet to produce the sheet tab from the current page
  window.__site = { FIELDS, read: () => FIELDS.map((f) => [f[1], f[0], f[2], readField(f), f[4]]), parse };
})();
