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

## Deploy
Push to GitHub and turn on **GitHub Pages** (Settings → Pages → deploy from this branch, root folder). Netlify or Vercel also work if you drag and drop the folder.
