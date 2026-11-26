# Lemari Gathan

A static website for **Lemari Gathan**, a small personal shop for preloved clothes. It's plain HTML, CSS and JS, with no build step.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000

## Manage the shop
Everything lives in `js/products.js`:
- `STORE`: your WhatsApp number, Instagram handle, email and city. These are used for the checkout and contact links.
- `PRODUCTS`: one entry per item. Put photos in `assets/products/` and list them in `images: [...]`. If an item has no photos, the site draws an illustration from `type` and `color` instead.
  - Set `oldPrice` to show a price drop.
  - Set `sold: true` to move the item to the Sold Archive.

## Edit the whole site from the sheet
The backend spreadsheet has three tabs:

- **Produk**: the inventory (see below).
- **Pengaturan**: every other piece of the site, one row each: announcement bar, video, hero text, photo and stats, brand list, category names, sell banner, how it works, condition guide, About, newsletter, footer, WhatsApp number, Instagram, button labels and the pre-filled WhatsApp messages. Each section has a **Tampilkan?** switch (Ya/Tidak). Only the yellow **Isi** column is edited. An empty cell keeps the built-in text. `*miring*` and `**tebal**` format text, and new lines inside a cell are kept.
- **Panduan**: a guide in Indonesian.

How it works in code: elements in `index.html` carry `data-cms="key"`, text built by `js/app.js` uses `T("key")`, and `js/site.js` lists every key (`FIELDS`), loads the **Pengaturan** tab and applies it before the page renders. To make something new editable, add a `data-cms` attribute plus a row in `FIELDS`, then add the same key as a row in the sheet.

## Use Google Sheets as the backend (recommended)
Manage the shop from a spreadsheet. Edit a row and the site updates on the next page load, with no code or redeploy.

1. **Create the sheet.** Go to [sheets.new](https://sheets.new), then **File → Import → Upload** and choose `sheet-template.csv` from this repo ("Replace current sheet"). You'll start with the right columns.
2. **Share it.** Click **Share → General access → Anyone with the link → Viewer** and copy the link. (A **File → Share → Publish to web → CSV** link also works.)
3. **Connect it.** Paste the link into `sheetCSV` in `js/products.js`, then commit and push.

> **Number-only sizes:** Google's feed can drop numbers in a column that is mostly text. In the live sheet the Ukuran column is formatted as plain text, so this is handled. In a new sheet, format that column as **Format → Number → Plain text**.

The live sheet has a **Panduan** (guide) tab in Indonesian. Columns (English names also work):

| Kolom | Isi |
|---|---|
| `ID` | Unique number per item. Never change or reuse it |
| `Brand`, `Nama Produk`, `Ukuran` | Free text. Sizes are stored as text, so `32` is fine |
| `Kategori` | Dropdown: Atasan, Bawahan, Jaket/Outer, Sepatu, Aksesoris |
| `Jenis (gambar)` | Dropdown. The drawing shown when there's no photo |
| `Warna` | Hex colour for the drawing, e.g. `#1f2a44` |
| `Kondisi` | Dropdown 1–10 |
| `Harga`, `Harga Lama` | Numbers, shown as Rupiah. Fill in `Harga Lama` to show a price drop |
| `Tanggal Upload` | dd/mm/yyyy |
| `Status` | Dropdown: Tersedia (shown), Terjual (moves to Sold Archive), Sembunyikan (hidden) |
| `Deskripsi` | Free text. Line breaks are kept |
| `Ukuran Detail` | `Lingkar dada: 56 cm; Panjang: 72 cm` |
| `Foto 1`–`Foto 4` | Image links. Foto 1 is the main photo, Foto 2 shows on hover, and all of them appear in the product gallery. Google Drive (shared as "Anyone with the link"), Imgur, Dropbox and direct .jpg/.png/.webp links work. More columns named `Foto 5`, `Foto 6`… are picked up too |

Notes:
- Google can take **up to ~5 minutes** to show sheet edits in the published CSV.
- Anyone can see the published sheet, so keep private info (buyer details, costs) in a **separate tab** and only publish the product tab.
- If the sheet can't be reached, the site shows the last copy of the sheet saved in that browser, or the `PRODUCTS` list in `js/products.js` if there's no copy.

## Sign-up, checkout & payments
Checkout (`js/checkout.js`) has three steps:
1. **Details (sign up):** name, WhatsApp, email, address and shipping zone. These are remembered on the customer's device, and the header shows their initial. Tapping it opens their details and past orders.
2. **Payment:** QRIS, bank transfer, e-wallet, PayPal or WhatsApp chat. A method only shows once it's filled in on the Pengaturan tab:
   - `bayar.qris`: link to your static QRIS image
   - `bayar.bank` / `bayar.ewallet`: one account per line, `Bank | Number | Name`
   - `bayar.paypal_id`: PayPal **Live** Client ID. PayPal doesn't take IDR, so totals are converted to USD with `bayar.paypal_kurs`
   - `ongkir.zona`: shipping zones, `Zone | cost` per line
3. **Done:** an order code (e.g. `LG-261125-1234`), the amount and account numbers with copy buttons, and a WhatsApp button that sends the full order for payment proof.

QRIS, transfers and e-wallets are checked by hand: ship once the money arrives, then mark the item Terjual. PayPal payments are captured on the spot.

**QRIS with the amount filled in:** `js/qris.js` turns the static GoPay Merchant QRIS (its text is the built-in default for `bayar.qris_payload`) into a dynamic QRIS per order: tag 01 becomes `12`, tag 54 holds the amount, and the CRC16 is recomputed. The QR is drawn with `js/vendor/qrcode-generator.js` (MIT). Customers scan it and the amount is already filled in, and the original image (`assets/img/qris-gopay.jpg`) stays available as a fallback. A unique code of Rp1–299 is added to QRIS, transfer and e-wallet totals so each payment can be matched to its order (`bayar.kode_unik`, Ya/Tidak).

**Payment-confirmed emails:** a static QRIS doesn't notify the website, so the owner confirms payments. Set the order's Status to **Lunas** in the private orders sheet and the Apps Script emails the customer "Pembayaran berhasil" within seconds. The order page on the website switches to "Payment received" too, because it polls the script every 15 s. Setting the Status to **Dikirim** sends a shipping email with the No. Resi. PayPal orders get the success email straight away. Fully automatic QRIS detection would need a payment gateway such as Midtrans or Xendit.

**One backend:** products, settings, orders and customers all live in the one "Backend Website" spreadsheet. Once the Apps Script is deployed and its URL is set as `STORE.backend` in `js/products.js`, the website reads Produk and Pengaturan *through the script* (`?action=data`, cached for 30 s) and sends sign-ups and orders to it. The spreadsheet can then be set to **Restricted**, so customer data is never publicly readable. `sheetCSV` stays as a fallback.

**Saving sign-ups and orders (needed for the emails):** follow `tools/orders-apps-script.gs` to create a *private* Google Sheet with a small Apps Script web app, then paste its URL in `pesanan.webhook`. Every sign-up and order is added to it as a row, with an optional email alert. Never collect customer data in the public backend sheet.

Accounts live on the customer's device; there are no passwords or server-side logins. Real logins would need an auth service such as Firebase or Supabase.

## Hero video
The brand film at the top of the page lives in `assets/video/`. Desktop gets `lot704-1080.mp4`, phones and data-saver users get `lot704-720.mp4`, and `lot704-poster.jpg` shows while it loads. It plays muted and on a loop, pauses when scrolled off screen, and doesn't autoplay for visitors who've turned on reduced motion. The **Shop Lot 704** button links to the inventory item whose name contains "Lot 704", and is hidden if that item is missing or sold.

To swap in a new film, re-encode it like this and replace the three files (keep the names, or update them in `index.html`):
```bash
ffmpeg -i film.mp4 -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k assets/video/lot704-1080.mp4
ffmpeg -i film.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k assets/video/lot704-720.mp4
ffmpeg -ss 20 -i film.mp4 -frames:v 1 -vf scale=1600:-2 -q:v 4 assets/video/lot704-poster.jpg
```

## Deploy
Push to GitHub and turn on **GitHub Pages** (Settings → Pages → deploy from this branch, root folder). Netlify or Vercel also work if you drag and drop the folder.
