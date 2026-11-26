/* =========================================================
   LEMARI GATHAN — store config + inventory
   ---------------------------------------------------------
   Edit this file to manage the shop. No build step needed.

   Using Google Sheets instead? Set STORE.sheetCSV below. The
   PRODUCTS list is then only used as a fallback (see README).

   STORE: your contact details (used for checkout links).
   PRODUCTS: one object per item.
     - images: optional array of photo paths, e.g.
         images: ["assets/products/levis-501-1.jpg", "assets/products/levis-501-2.jpg"]
       If left empty, a drawn illustration is shown using `type` + `color`.
     - type: tee | longsleeve | shirt | hoodie | jacket | pants | shorts | shoes | cap | bag
     - oldPrice: set it to show a price drop (red price + strikethrough)
     - sold: true moves the item to the Sold archive
     - listed: date the item went up (YYYY-MM-DD)
   ========================================================= */

window.STORE = {
  name: "Lemari Gathan",
  whatsapp: "6281234567890",         // country code + number, no "+" or spaces
  instagram: "lemarigathan",         // without "@"
  email: "hello@lemarigathan.com",
  city: "Medan, Indonesia",
  currency: "IDR",

  // Google Sheets backend: your sheet's link (shared as "Anyone with the link")
  // or a "Publish to web" CSV link.
  // Leave empty ("") to use the PRODUCTS list below instead.
  // Example: "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv"
  sheetCSV: "https://docs.google.com/spreadsheets/d/11Ns5KVB9JCxQLMhnB7zbBVUlfhN630icbRNNcDkDpFs/edit",

  // Apps Script web app (tools/orders-apps-script.gs). When set, the website reads
  // products + settings through it and sends orders to it, so the spreadsheet can
  // be Restricted (private). sheetCSV above is only a fallback.
  backend: "",
};

window.PRODUCTS = [
  {
    id: 1, brand: "Levi's", title: "Vintage 568 Loose Straight Denim — Faded Black",
    category: "bottoms", type: "pants", color: "#3b3f46",
    size: "W32", condition: 9, price: 385000, oldPrice: 450000,
    listed: "2026-11-21", sold: false,
    measurements: { Waist: "84 cm", Rise: "31 cm", Inseam: "80 cm", "Leg opening": "24 cm" },
    description: "Loose straight fit with a heavy fade on the thighs. Hem cuffed once in the photos. No holes, no stains.",
    images: [],
  },
  {
    id: 2, brand: "Uniqlo U", title: "Crew Neck Heavyweight Tee — Navy",
    category: "tops", type: "tee", color: "#1f2a44",
    size: "L", condition: 9, price: 120000,
    listed: "2026-11-22", sold: false,
    measurements: { Chest: "60 cm", Length: "72 cm", Shoulder: "54 cm" },
    description: "Boxy, dropped-shoulder heavyweight cotton. Collar still tight. Worn a handful of times.",
    images: [],
  },
  {
    id: 3, brand: "Carhartt", title: "Detroit Jacket Blanket Lined — Brown Duck",
    category: "outerwear", type: "jacket", color: "#8a5a2b",
    size: "M", condition: 8, price: 1250000, oldPrice: 1400000,
    listed: "2026-11-18", sold: false,
    measurements: { Chest: "62 cm", Length: "66 cm", Sleeve: "62 cm" },
    description: "Nicely broken-in duck canvas with honest wear on the cuffs. Lining intact, all snaps working.",
    images: [],
  },
  {
    id: 4, brand: "Stüssy", title: "Basic Logo Hoodie — Ash Grey",
    category: "tops", type: "hoodie", color: "#9a9a9a",
    size: "L", condition: 8, price: 650000,
    listed: "2026-11-20", sold: false,
    measurements: { Chest: "63 cm", Length: "70 cm", Sleeve: "64 cm" },
    description: "Soft fleece inside, print has light cracking that adds character. Drawcords included.",
    images: [],
  },
  {
    id: 5, brand: "Nike", title: "Air Force 1 '07 Low — Triple White",
    category: "footwear", type: "shoes", color: "#efefef",
    size: "EU 42.5", condition: 8, price: 700000,
    listed: "2026-11-16", sold: false,
    measurements: { "EU size": "42.5", "Insole": "27 cm" },
    description: "Deep cleaned, minor creasing on the toe box. Soles have plenty of life left. No box.",
    images: [],
  },
  {
    id: 6, brand: "Polo Ralph Lauren", title: "Oxford Button Down Shirt — Light Blue",
    category: "tops", type: "shirt", color: "#a9c4e0",
    size: "M", condition: 9, price: 275000,
    listed: "2026-11-19", sold: false,
    measurements: { Chest: "56 cm", Length: "76 cm", Sleeve: "62 cm" },
    description: "Classic fit OCBD with the small pony. Crisp collar roll, no yellowing.",
    images: [],
  },
  {
    id: 7, brand: "Dickies", title: "874 Original Work Pant — Khaki",
    category: "bottoms", type: "pants", color: "#b9a37a",
    size: "W30", condition: 9, price: 260000,
    listed: "2026-11-22", sold: false,
    measurements: { Waist: "78 cm", Rise: "30 cm", Inseam: "78 cm", "Leg opening": "22 cm" },
    description: "Crease still sharp. Straight leg, sits at the waist. Barely worn.",
    images: [],
  },
  {
    id: 8, brand: "New Era", title: "9TWENTY NY Yankees Cap — Washed Black",
    category: "accessories", type: "cap", color: "#2a2a2a",
    size: "OS", condition: 9, price: 150000,
    listed: "2026-11-17", sold: false,
    measurements: { Fit: "Adjustable strap" },
    description: "Unstructured, pre-curved brim. Washed and sanitised.",
    images: [],
  },
  {
    id: 9, brand: "Comme des Garçons Play", title: "Heart Logo Long Sleeve — White",
    category: "tops", type: "longsleeve", color: "#f3f1ec",
    size: "M", condition: 8, price: 780000, oldPrice: 900000,
    listed: "2026-11-12", sold: false,
    measurements: { Chest: "50 cm", Length: "68 cm", Sleeve: "62 cm" },
    description: "Authentic, tags attached. Very light pilling around the cuffs, otherwise clean.",
    images: [],
  },
  {
    id: 10, brand: "Patagonia", title: "Baggies Shorts 5\" — Forest",
    category: "bottoms", type: "shorts", color: "#3f5a45",
    size: "M", condition: 9, price: 340000,
    listed: "2026-11-21", sold: false,
    measurements: { Waist: "76–90 cm (elastic)", Inseam: "13 cm" },
    description: "Quick-dry nylon, mesh liner intact. Perfect for Medan weather.",
    images: [],
  },
  {
    id: 11, brand: "Porter Yoshida", title: "Tanker Tote — Sage",
    category: "accessories", type: "bag", color: "#7d8b6f",
    size: "OS", condition: 8, price: 1100000,
    listed: "2026-11-10", sold: false,
    measurements: { Width: "40 cm", Height: "36 cm", Depth: "12 cm" },
    description: "Signature nylon twill with the orange lining. Light scuffs on the base.",
    images: [],
  },
  {
    id: 12, brand: "Adidas", title: "Samba OG — Black / White Gum",
    category: "footwear", type: "shoes", color: "#1e1e1e",
    size: "EU 41", condition: 9, price: 950000,
    listed: "2026-11-22", sold: false,
    measurements: { "EU size": "41", "Insole": "26 cm" },
    description: "Worn twice, gum sole still bright. Comes with original box.",
    images: [],
  },
  {
    id: 13, brand: "Levi's", title: "Type III Trucker Jacket — Mid Wash",
    category: "outerwear", type: "jacket", color: "#5b7ba6",
    size: "L", condition: 8, price: 520000,
    listed: "2026-11-08", sold: true,
    measurements: { Chest: "60 cm", Length: "64 cm", Sleeve: "63 cm" },
    description: "The classic trucker with honest fading along the seams.",
    images: [],
  },
  {
    id: 14, brand: "Vintage", title: "Baggy Wide Leg Denim — Washed Black",
    category: "bottoms", type: "pants", color: "#2b2b2f",
    size: "W32", condition: 9, price: 1650000,
    listed: "2026-11-05", sold: true,
    measurements: { Waist: "84 cm", Rise: "33 cm", Inseam: "82 cm", "Leg opening": "28 cm" },
    description: "The pair from the lookbook photo. Gone to a good home.",
    images: ["assets/img/gathan.webp"],
  },
  {
    id: 15, brand: "Champion", title: "Reverse Weave Crewneck — Maroon",
    category: "tops", type: "longsleeve", color: "#6b2430",
    size: "XL", condition: 7, price: 230000,
    listed: "2026-11-14", sold: false,
    measurements: { Chest: "64 cm", Length: "70 cm", Sleeve: "64 cm" },
    description: "Thick vintage reverse weave. Small faded spot on the back hem, shown in photos on request.",
    images: [],
  },
  {
    id: 16, brand: "The North Face", title: "Nuptse 1996 Puffer — Black",
    category: "outerwear", type: "jacket", color: "#141414",
    size: "M", condition: 9, price: 2100000, oldPrice: 2400000,
    listed: "2026-11-20", sold: false,
    measurements: { Chest: "66 cm", Length: "68 cm", Sleeve: "84 cm (CB)" },
    description: "700-fill down, loft is excellent. Packable hood in collar. For the travel trips up north.",
    images: [],
  },
];
