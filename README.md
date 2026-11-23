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
