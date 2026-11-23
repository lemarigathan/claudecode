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

1. **Create the sheet.** Go to [sheets.new](https://sheets.new), then **File → Import → Upload** and choose `sheet-template.csv` from this repo ("Replace current sheet"). You'll start with all the sample products in the right columns.
2. **Share it.** Click **Share → General access → Anyone with the link → Viewer** and copy the link. (A **File → Share → Publish to web → CSV** link also works.)
3. **Connect it.** Paste the link into `sheetCSV` in `js/products.js`, then commit and push.

> **Number-only sizes:** Google's feed can drop numbers in a column that is mostly text. Write sizes as text, e.g. `W32` or `EU 42.5`, not `32`. If you need plain numbers, use a Publish to web link instead.

| Column | What to put |
|---|---|
| `id` | Unique number per item. Keep it the same forever, because saved items, bags and product links depend on it |
| `brand`, `title`, `size` | Free text |
| `category` | `tops`, `bottoms`, `outerwear`, `footwear`, `accessories` |
| `type` | Drawing used when there's no photo: `tee`, `longsleeve`, `shirt`, `hoodie`, `jacket`, `pants`, `shorts`, `shoes`, `cap`, `bag` |
| `color` | Hex colour for the drawing, e.g. `#1f2a44` |
| `condition` | 1–10 |
| `price`, `old_price` | `385000` (`Rp385.000` also works). Set `old_price` higher to show a price drop |
| `listed` | `2026-11-21` or `21/11/2026` |
| `sold` | `TRUE` moves the item to the Sold Archive |
| `status` | Optional. `hidden` or `draft` keeps a row off the site |
| `description` | Free text. Line breaks are kept |
| `measurements` | `Waist: 84 cm; Inseam: 80 cm` |
| `images` | Photo links separated by commas. Google Drive links work if the file is shared as "Anyone with the link" |

Notes:
- Google can take **up to ~5 minutes** to show sheet edits in the published CSV.
- Anyone can see the published sheet, so keep private info (buyer details, costs) in a **separate tab** and only publish the product tab.
- If the sheet can't be reached, the site shows the last copy of the sheet saved in that browser, or the `PRODUCTS` list in `js/products.js` if there's no copy.

## Deploy
Push to GitHub and turn on **GitHub Pages** (Settings → Pages → deploy from this branch, root folder). Netlify or Vercel also work if you drag and drop the folder.
