/**
 * Lemari Gathan — order inbox + customer emails (Google Apps Script)
 * ---------------------------------------------------------------
 * What it does
 *  - Saves every website sign-up (tab "Pelanggan") and order (tab "Pesanan")
 *    into a PRIVATE Google Sheet.
 *  - Emails the customer:
 *      1. "Pesanan diterima"     right after they order (with payment instructions)
 *      2. "Pembayaran berhasil"  when YOU set the order's Status to "Lunas"
 *                                (PayPal orders get this immediately)
 *      3. "Pesanan dikirim"      when you set Status to "Dikirim" (with the No. Resi)
 *  - Lets the website show the live order status to the customer.
 *
 * QRIS / transfer payments can't be detected automatically: check your GoPay
 * Merchant / bank app, then change the Status cell to "Lunas" (works from the
 * Google Sheets phone app). The email goes out within seconds.
 *
 * SETUP (about 5 minutes)
 *  1. Create a NEW Google Sheet (sheets.new). Do NOT share it publicly —
 *     it holds customers' names, phone numbers and addresses.
 *  2. Extensions → Apps Script. Delete everything there, paste this whole file, click Save.
 *  3. In the toolbar choose the function "setup" and click Run. Allow the permissions
 *     (Google will warn the app is unverified: Advanced → Go to project → Allow).
 *     This creates the tabs, the Status dropdown and the email trigger.
 *  4. Deploy → New deployment → gear icon → "Web app".
 *       Execute as: Me        Who has access: Anyone
 *     Click Deploy and copy the Web app URL (https://script.google.com/macros/s/…/exec).
 *  5. Paste that URL in the backend sheet → tab Pengaturan → row "pesanan.webhook" → column Isi.
 *
 * After changing this code later: Deploy → Manage deployments → edit (pencil) →
 * Version: New version → Deploy (the URL stays the same).
 */

// Optional: your email, to get a copy of every new order.
const NOTIFY_EMAIL = "";

// The private orders spreadsheet. Leave "" when this script is opened from
// that spreadsheet (Extensions → Apps Script); set an ID for a standalone script.
const SHEET_ID = "1lMq4z1fwcI-GcG3JnSkttXoJphczDxRuQ4lGgXV7Jfw";
function book_() { return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet(); }

const STATUS = ["Menunggu pembayaran", "Lunas", "Dikirim", "Selesai", "Dibatalkan"];
const ORDER_COLS = ["Waktu", "Kode", "Status", "Metode", "PayPal ID", "Produk", "Subtotal", "Ongkir", "Kode unik", "Total",
  "Zona", "Nama", "WhatsApp", "Email", "Alamat", "Catatan", "No. Resi", "Email terkirim", "Data"];
const CUSTOMER_COLS = ["Waktu", "Nama", "WhatsApp", "Email", "Alamat", "Kota", "Kode pos", "Zona", "Info drop"];

/* ---------------- setup (run once) ---------------- */
function setup() {
  const ss = book_();
  const orders = tab_(ss, "Pesanan", ORDER_COLS);
  tab_(ss, "Pelanggan", CUSTOMER_COLS);
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build();
  orders.getRange(2, col_("Status"), orders.getMaxRows() - 1, 1).setDataValidation(rule);
  orders.hideColumns(col_("Data"));
  ScriptApp.getProjectTriggers().forEach((t) => { if (t.getHandlerFunction() === "onStatusEdit") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("onStatusEdit").forSpreadsheet(ss).onEdit().create();
  MailApp.getRemainingDailyQuota(); // asks for the email permission now
  Logger.log("Siap! Lanjut ke Deploy → New deployment → Web app.");
}

/* ---------------- website → sheet ---------------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const ss = book_();
    const c = clean_(d);
    if (d.type === "signup") {
      tab_(ss, "Pelanggan", CUSTOMER_COLS).appendRow([new Date(), c.name, c.phone, c.email, c.address, c.city, c.postal, c.zone, c.news]);
      return json_({ ok: true });
    }
    if (d.type !== "order") return json_({ ok: false, error: "unknown type" });

    const sh = tab_(ss, "Pesanan", ORDER_COLS);
    if (findRow_(sh, c.code)) return json_({ ok: true, duplicate: true });
    const paid = !!d.paid;
    const status = paid ? "Lunas" : "Menunggu pembayaran";
    sh.appendRow([new Date(), c.code, status, c.method, c.paypal_id, c.items, d.subtotal, d.shipping === "" ? "" : d.shipping, d.unique || 0, d.total,
      c.zone, c.name, c.phone, c.email, c.address, c.note, "", "", JSON.stringify(d).slice(0, 45000)]);
    const row = sh.getLastRow();
    sendFor_(sh, row, paid ? "paid" : "received");
    if (NOTIFY_EMAIL) MailApp.sendEmail(NOTIFY_EMAIL, `Pesanan baru ${c.code} — ${rp_(d.total)} (${c.method})`,
      `${c.name} (${c.phone}, ${c.email})\n${c.method} — ${status}\n\n${c.items}\n\nTotal: ${rp_(d.total)}\n${c.address}\n${c.note || ""}`);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- website asks for an order's status ---------------- */
// GET ?action=status&code=LG-...&email=...&callback=fn   (JSONP)
function doGet(e) {
  const p = (e && e.parameter) || {};
  let res = { ok: true, message: "Lemari Gathan order inbox is running." };
  if (p.action === "status") {
    res = { ok: false, status: null };
    const sh = book_().getSheetByName("Pesanan");
    const row = sh && findRow_(sh, String(p.code || ""));
    if (row) {
      const v = sh.getRange(row, 1, 1, ORDER_COLS.length).getValues()[0];
      // only reveal the status to someone who knows the order's email
      if (String(v[col_("Email") - 1]).trim().toLowerCase() === String(p.email || "").trim().toLowerCase()) {
        res = { ok: true, status: v[col_("Status") - 1], resi: v[col_("No. Resi") - 1] || "" };
      }
    }
  }
  const cb = String(p.callback || "");
  if (/^[A-Za-z_$][\w$]{0,60}$/.test(cb)) {
    return ContentService.createTextOutput(`${cb}(${JSON.stringify(res)});`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(res);
}

/* ---------------- you change the Status → customer gets an email ---------------- */
function onStatusEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== "Pesanan" || e.range.getRow() < 2) return;
  const c1 = e.range.getColumn(), c2 = c1 + e.range.getNumColumns() - 1;
  const sc = col_("Status");
  if (sc < c1 || sc > c2) return;
  for (let r = e.range.getRow(); r < e.range.getRow() + e.range.getNumRows(); r++) {
    const status = sh.getRange(r, sc).getValue();
    if (status === "Lunas") sendFor_(sh, r, "paid");
    if (status === "Dikirim") sendFor_(sh, r, "shipped");
  }
}

/* ---------------- emails ---------------- */
function sendFor_(sh, row, kind) {
  const v = sh.getRange(row, 1, 1, ORDER_COLS.length).getValues()[0];
  const get = (name) => v[col_(name) - 1];
  const sentCell = sh.getRange(row, col_("Email terkirim"));
  const sent = String(sentCell.getValue() || "");
  if (sent.indexOf(kind) > -1) return; // never send the same email twice
  const to = String(get("Email") || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return;
  let data = {};
  try { data = JSON.parse(get("Data") || "{}"); } catch (err) {}
  const shopName = (data.shop && data.shop.name) || "Lemari Gathan";
  const code = get("Kode"), name = String(get("Nama") || "").split(" ")[0];

  let subject, intro, extra = "";
  if (kind === "received") {
    subject = `Pesanan ${code} diterima — selesaikan pembayaran`;
    intro = `Hai ${name}, terima kasih sudah belanja di ${shopName}! Pesananmu sudah kami terima dan barangnya kami tahan selama 24 jam.`;
    extra = box_(`<b>Total yang harus dibayar: ${rp_(get("Total"))}</b><br>Metode: ${esc_(get("Metode"))}` +
      (data.pay_text ? `<br><br>${esc_(data.pay_text).replace(/\n/g, "<br>")}` : "") +
      `<br><br>Setelah bayar, kirim bukti transfer lewat WhatsApp dengan menyebut kode <b>${esc_(code)}</b>. Kamu akan menerima email konfirmasi begitu pembayaran kami cek.`, "#fff7e6");
  } else if (kind === "paid") {
    subject = `Pembayaran berhasil — pesanan ${code}`;
    intro = `Hai ${name}, pembayaranmu sebesar <b>${rp_(get("Total"))}</b> sudah kami terima. Terima kasih! Pesananmu sedang kami siapkan dan akan segera dikirim.`;
    extra = box_(`✅ <b>LUNAS</b> · ${esc_(get("Metode"))}${get("PayPal ID") ? " · PayPal " + esc_(get("PayPal ID")) : ""}`, "#e3f4e8");
  } else {
    subject = `Pesanan ${code} sudah dikirim`;
    const resi = get("No. Resi");
    intro = `Hai ${name}, kabar baik — pesananmu sudah dalam perjalanan!`;
    extra = box_(`📦 <b>Dikirim</b>${resi ? `<br>No. Resi: <b>${esc_(resi)}</b>` : ""}`, "#e8f0fe");
  }

  const items = String(get("Produk") || "").split("\n").filter(String).map((l) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc_(l)}</td></tr>`).join("");
  const wa = data.shop && data.shop.whatsapp ? `https://wa.me/${data.shop.whatsapp}?text=${encodeURIComponent("Halo, saya mau tanya pesanan " + code)}` : "";
  const html = `
  <div style="background:#f4f4f2;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#111">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#111;color:#fff;padding:20px 28px;font-weight:900;letter-spacing:1px;font-size:20px">${esc_(shopName.toUpperCase())}</div>
      <div style="padding:28px">
        <p style="font-size:13px;color:#777;margin:0 0 6px">Pesanan ${esc_(code)}</p>
        <h1 style="font-size:22px;margin:0 0 14px">${esc_(subject.split(" — ")[0])}</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px">${intro}</p>
        ${extra}
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:18px">${items}</table>
        <table style="width:100%;font-size:14px;margin-top:10px">
          <tr><td>Subtotal</td><td style="text-align:right">${rp_(get("Subtotal"))}</td></tr>
          <tr><td>Ongkir ${get("Zona") ? "(" + esc_(get("Zona")) + ")" : ""}</td><td style="text-align:right">${get("Ongkir") === "" ? "dikonfirmasi via chat" : Number(get("Ongkir")) === 0 ? "Gratis" : rp_(get("Ongkir"))}</td></tr>
          ${Number(get("Kode unik")) ? `<tr><td>Kode unik</td><td style="text-align:right">${rp_(get("Kode unik"))}</td></tr>` : ""}
          <tr><td style="font-weight:bold;padding-top:8px">Total</td><td style="text-align:right;font-weight:bold;font-size:18px;padding-top:8px">${rp_(get("Total"))}</td></tr>
        </table>
        <p style="font-size:13px;color:#555;margin-top:18px;line-height:1.5">Dikirim ke:<br>${esc_(get("Nama"))} · ${esc_(get("WhatsApp"))}<br>${esc_(get("Alamat"))}</p>
        ${wa ? `<p style="margin-top:22px"><a href="${wa}" style="background:#111;color:#fff;text-decoration:none;padding:12px 18px;border-radius:4px;font-weight:bold;font-size:14px">Chat kami di WhatsApp</a></p>` : ""}
      </div>
    </div>
    <p style="text-align:center;font-size:12px;color:#999">${esc_(shopName)} · email otomatis, balas email ini atau chat WhatsApp kalau ada pertanyaan.</p>
  </div>`;
  MailApp.sendEmail({ to, subject, htmlBody: html, name: shopName });
  sentCell.setValue((sent ? sent + ", " : "") + kind + " " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM HH:mm"));
}

/* ---------------- helpers ---------------- */
function tab_(ss, name, cols) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(cols);
    sh.getRange(1, 1, 1, cols.length).setFontWeight("bold").setBackground("#111111").setFontColor("#ffffff");
    sh.setFrozenRows(1);
  }
  return sh;
}
function col_(name) { return ORDER_COLS.indexOf(name) + 1; }
function findRow_(sh, code) {
  if (!code || sh.getLastRow() < 2) return 0;
  const codes = sh.getRange(2, col_("Kode"), sh.getLastRow() - 1, 1).getValues();
  for (let i = codes.length - 1; i >= 0; i--) if (String(codes[i][0]) === code) return i + 2;
  return 0;
}
// stops formulas being injected through form fields
function clean_(d) {
  const o = {};
  Object.keys(d).forEach((k) => { o[k] = typeof d[k] === "string" ? d[k].slice(0, 2000).replace(/^[=+\-@]/, "'$&") : (d[k] == null ? "" : d[k]); });
  return o;
}
function rp_(n) { return "Rp" + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function esc_(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function box_(html, bg) { return `<div style="background:${bg};border-radius:6px;padding:14px 16px;font-size:14px;line-height:1.5">${html}</div>`; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
