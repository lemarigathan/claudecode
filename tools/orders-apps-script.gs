/**
 * Lemari Gathan — order & sign-up inbox (Google Apps Script)
 * ---------------------------------------------------------
 * Saves website sign-ups and orders into a PRIVATE Google Sheet.
 * Keep this sheet private: it holds customers' names, phone numbers and addresses.
 * (Never put it in the public "Backend Website" sheet.)
 *
 * Setup (5 minutes):
 * 1. Create a NEW Google Sheet (sheets.new) — do NOT share it publicly.
 * 2. In that sheet: Extensions → Apps Script. Delete what's there, paste this file, Save.
 * 3. Deploy → New deployment → type "Web app".
 *      Execute as: Me      Who has access: Anyone
 *    Deploy, allow access, and copy the Web app URL (https://script.google.com/macros/s/…/exec).
 * 4. Paste that URL into the Pengaturan tab, row "pesanan.webhook" (column Isi).
 * Tabs "Pesanan" and "Pelanggan" are created automatically on the first order / sign-up.
 *
 * Optional: set NOTIFY_EMAIL to get an email for every new order.
 */
const NOTIFY_EMAIL = ""; // e.g. "you@example.com"

const TABS = {
  order: {
    name: "Pesanan",
    cols: ["Waktu", "Kode", "Status", "Metode", "PayPal ID", "Produk", "Subtotal", "Ongkir", "Total", "Zona", "Nama", "WhatsApp", "Email", "Alamat", "Catatan"],
    row: (d) => [new Date(), d.code, d.status, d.method, d.paypal_id, d.items, d.subtotal, d.shipping, d.total, d.zone, d.name, d.phone, d.email, d.address, d.note],
  },
  signup: {
    name: "Pelanggan",
    cols: ["Waktu", "Nama", "WhatsApp", "Email", "Alamat", "Kota", "Kode pos", "Zona", "Info drop"],
    row: (d) => [new Date(), d.name, d.phone, d.email, d.address, d.city, d.postal, d.zone, d.news],
  },
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const tab = TABS[d.type];
    if (!tab) return out({ ok: false, error: "unknown type" });
    const clean = {};
    Object.keys(d).forEach((k) => { clean[k] = typeof d[k] === "string" ? d[k].slice(0, 2000).replace(/^[=+\-@]/, "'$&") : d[k]; });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(tab.name);
    if (!sh) {
      sh = ss.insertSheet(tab.name);
      sh.appendRow(tab.cols);
      sh.getRange(1, 1, 1, tab.cols.length).setFontWeight("bold").setBackground("#111111").setFontColor("#ffffff");
      sh.setFrozenRows(1);
    }
    sh.appendRow(tab.row(clean));
    if (d.type === "order" && NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, `Pesanan baru ${clean.code} — Rp${clean.total}`,
        `${clean.name} (${clean.phone})\n${clean.method} — ${clean.status}\n\n${clean.items}\n\nTotal: Rp${clean.total}\n${clean.address}`);
    }
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return out({ ok: true, message: "Lemari Gathan order inbox is running." });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
