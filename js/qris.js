/* =========================================================
   LEMARI GATHAN — QRIS helper
   ---------------------------------------------------------
   Turns a STATIC QRIS payload (the text inside the merchant's QR)
   into a DYNAMIC one with the amount filled in, so customers don't
   have to type it. Follows the EMVCo / QRIS format:
     - tag 01 "11" (static) -> "12" (dynamic)
     - tag 54 = transaction amount (whole rupiah)
     - tag 63 = CRC16-CCITT (poly 0x1021, init 0xFFFF) recomputed
   ========================================================= */
(function (root) {
  "use strict";

  function crc16(str) {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  // top-level TLV: [{tag, value}]
  function parse(payload) {
    const out = [];
    let i = 0;
    while (i < payload.length) {
      const tag = payload.substr(i, 2), len = parseInt(payload.substr(i + 2, 2), 10);
      if (!/^\d\d$/.test(tag) || isNaN(len)) throw new Error("Invalid QRIS payload");
      out.push({ tag, value: payload.substr(i + 4, len) });
      i += 4 + len;
    }
    return out;
  }
  const tlv = (tag, value) => tag + String(value.length).padStart(2, "0") + value;

  function isValid(payload) {
    if (!/6304[0-9A-F]{4}$/i.test(payload)) return false;
    return crc16(payload.slice(0, -4)) === payload.slice(-4).toUpperCase();
  }

  function info(payload) {
    const f = {};
    parse(payload).forEach((t) => (f[t.tag] = t.value));
    return { merchant: f["59"] || "", city: f["60"] || "", dynamic: f["01"] === "12", amount: f["54"] ? Number(f["54"]) : null };
  }

  function toDynamic(payload, amount) {
    payload = String(payload).trim();
    if (!isValid(payload)) throw new Error("QRIS checksum doesn't match");
    const amt = Math.round(Number(amount));
    if (!(amt > 0)) throw new Error("Amount must be positive");
    const fields = parse(payload).filter((t) => t.tag !== "63" && t.tag !== "54");
    const out = [];
    let placed = false;
    for (const t of fields) {
      if (t.tag === "01") { out.push(tlv("01", "12")); continue; }
      if (!placed && Number(t.tag) > 54) { out.push(tlv("54", String(amt))); placed = true; }
      out.push(tlv(t.tag, t.value));
    }
    if (!placed) out.push(tlv("54", String(amt)));
    const body = out.join("") + "6304";
    return body + crc16(body);
  }

  const api = { crc16, parse, isValid, info, toDynamic };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.QRIS = api;
})(typeof window !== "undefined" ? window : globalThis);
