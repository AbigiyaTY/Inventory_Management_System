const { connect, close } = require("./db");

const suppliers = [
  {
    supplier_id: 1,
    name: "TechSource Ltd.",
    contact_person: "Martin Novak",
    email: "martin@techsource.example",
    phone: "+420 601 111 222",
    country: "Czech Republic",
    lead_time_days: 3,
  },
  {
    supplier_id: 2,
    name: "OfficeWorld GmbH",
    contact_person: "Anna Keller",
    email: "anna@officeworld.example",
    phone: "+49 30 555 0101",
    country: "Germany",
    lead_time_days: 5,
  },
  {
    supplier_id: 3,
    name: "AudioPro Distribution",
    contact_person: "Piotr Zielinski",
    email: "piotr@audiopro.example",
    phone: "+48 22 555 0199",
    country: "Poland",
    lead_time_days: 7,
  },
  {
    supplier_id: 4,
    name: "GreenPack s.r.o.",
    contact_person: "Eva Svobodova",
    email: "eva@greenpack.example",
    phone: "+420 602 333 444",
    country: "Czech Republic",
    lead_time_days: 2,
  },
  {
    supplier_id: 5,
    name: "Global Gadgets Inc.",
    contact_person: "Kevin Brown",
    email: "kevin@globalgadgets.example",
    phone: "+1 415 555 0123",
    country: "USA",
    lead_time_days: 14,
  },
  {
    supplier_id: 6,
    name: "Nordic Furniture AB",
    contact_person: "Lars Eriksson",
    email: "lars@nordicfurn.example",
    phone: "+46 8 555 0147",
    country: "Sweden",
    lead_time_days: 10,
  },
];

const products = [
  {
    product_id: 1,
    name: "Wireless Mouse M200",
    sku: "MSE-200",
    category: "Computer Accessories",
    price: 19.9,
    quantity_in_stock: 120,
    reorder_level: 30,
    supplier_id: 1,
    description:
      "Ergonomic wireless mouse with silent click and 2.4 GHz USB receiver",
    image_url:
      "https://kobra.odkarla.cz/t1/490x490/56/64/1505534/1505534_0.jpg/~/bezdratova-mys-tecknet-bezdratova-mys-bluetooth-mys-3200-dpi-bezdratova-mys-bluetooth-6-1",
    units_sold: 412,
    total_revenue: 8198.8,
    last_sold_at: new Date("2026-04-22"),
  },
  {
    product_id: 2,
    name: "Mechanical Keyboard K87",
    sku: "KBD-087",
    category: "Computer Accessories",
    price: 74.5,
    quantity_in_stock: 45,
    reorder_level: 15,
    supplier_id: 1,
    description:
      "Compact tenkeyless mechanical keyboard with blue switches and RGB backlight",
    image_url: "https://img.fruugo.com/product/6/44/2743295446_max.jpg",
    units_sold: 187,
    total_revenue: 13931.5,
    last_sold_at: new Date("2026-04-21"),
  },
  {
    product_id: 3,
    name: "A4 Copy Paper 500 sheets",
    sku: "PAP-A4-500",
    category: "Office Supplies",
    price: 5.2,
    quantity_in_stock: 8,
    reorder_level: 50,
    supplier_id: 2,
    description: "White 80g multipurpose A4 paper for printers and copiers",
    image_url:
      "https://ae-pic-a1.aliexpress-media.com/kf/Sb36b1dac4aac48c198b3a785a11b515fr.jpg_960x960q75.jpg_.avif",
    units_sold: 240,
    total_revenue: 1248.0,
    last_sold_at: new Date("2026-04-19"),
  },
  {
    product_id: 4,
    name: "Ergonomic Office Chair",
    sku: "CHR-ERG-1",
    category: "Furniture",
    price: 189.0,
    quantity_in_stock: 14,
    reorder_level: 5,
    supplier_id: 6,
    description:
      "Adjustable office chair with lumbar support and breathable mesh back",
    image_url:
      "https://static.biano.cz/i/product/360-360/dd/43/a9/e41702ee89379641e00f77791ec9775daf418cef-herni-zidle-z-ekokuze-normal-size-cerny-zeleny-diablo-x-horn-2-0.jpg",
    units_sold: 31,
    total_revenue: 5859.0,
    last_sold_at: new Date("2026-04-15"),
  },
  {
    product_id: 5,
    name: "Bluetooth Headphones H500",
    sku: "HDP-500",
    category: "Audio",
    price: 59.99,
    quantity_in_stock: 60,
    reorder_level: 20,
    supplier_id: 3,
    description:
      "Over-ear wireless headphones with noise cancelling and 30 hour battery",
    image_url:
      "https://image.alza.cz/products/JJ092q1a9e6/JJ092q1a9e6.jpg?width=1400&height=1400",
    units_sold: 145,
    total_revenue: 8698.55,
    last_sold_at: new Date("2026-04-23"),
  },
  {
    product_id: 6,
    name: "USB-C Charging Cable 2m",
    sku: "CBL-USBC-2",
    category: "Computer Accessories",
    price: 7.5,
    quantity_in_stock: 300,
    reorder_level: 80,
    supplier_id: 5,
    description: "Braided fast charging USB-C cable, 2 metres long",
    image_url:
      "https://image.alza.cz/products/APW-SWCHGAR5O/APW-SWCHGAR5O.jpg?width=800&height=800",
    units_sold: 890,
    total_revenue: 6675.0,
    last_sold_at: new Date("2026-04-24"),
  },
  {
    product_id: 7,
    name: "Recycled Shipping Boxes",
    sku: "BOX-REC-M",
    category: "Packaging",
    price: 0.85,
    quantity_in_stock: 1500,
    reorder_level: 500,
    supplier_id: 4,
    description:
      "Medium corrugated shipping boxes made from recycled cardboard",
    image_url:
      "https://buypackagingboxes.co.uk/wp-content/uploads/2026/06/Custom-Recycled-Cardboard-Box.webp",
    units_sold: 3200,
    total_revenue: 2720.0,
    last_sold_at: new Date("2026-04-24"),
  },
  {
    product_id: 8,
    name: "Portable Bluetooth Speaker",
    sku: "SPK-BT-20",
    category: "Audio",
    price: 34.0,
    quantity_in_stock: 3,
    reorder_level: 10,
    supplier_id: 3,
    description:
      "Waterproof portable speaker with deep bass and 12 hour playback",
    image_url:
      "https://tribit.com/cdn/shop/files/02_14122017-78a1-463f-bb1e-ddaf585aa55a.png?v=1750411751&width=900",
    units_sold: 0,
    total_revenue: 0,
    last_sold_at: null,
  },
  {
    product_id: 9,
    name: "Standing Desk Frame",
    sku: "DSK-STD-1",
    category: "Furniture",
    price: 249.0,
    quantity_in_stock: 9,
    reorder_level: 4,
    supplier_id: 6,
    description:
      "Electric height adjustable standing desk frame with memory presets",
    image_url: "https://www.img4.cz/www/img/imgthumb?code=NBTARO2088",
    units_sold: 12,
    total_revenue: 2988.0,
    last_sold_at: new Date("2026-04-10"),
  },
  {
    product_id: 10,
    name: "Smart Webcam 1080p",
    sku: "CAM-1080",
    category: "Computer Accessories",
    price: 42.0,
    quantity_in_stock: 25,
    reorder_level: 10,
    supplier_id: 5,
    description:
      "Full HD webcam with autofocus and built-in dual microphone for video calls",
    image_url: "https://cdn2.tisknulevne.cz/webp/sklady/velke/53x26aa.webp",
    units_sold: 0,
    total_revenue: 0,
    last_sold_at: null,
  },
];

(async () => {
  try {
    const db = await connect();

    await db.dropDatabase();
    await db.createCollection("suppliers");
    await db.createCollection("products");

    await db.collection("suppliers").insertMany(suppliers);
    await db.collection("products").insertMany(products);

    await db
      .collection("suppliers")
      .createIndex({ supplier_id: 1 }, { unique: true });
    await db
      .collection("products")
      .createIndex({ product_id: 1 }, { unique: true });
    await db.collection("products").createIndex({ sku: 1 }, { unique: true });

    await db
      .collection("products")
      .createIndex(
        { name: "text", description: "text" },
        { name: "products_text_idx", weights: { name: 5, description: 1 } },
      );

    console.log(
      `Inserted ${suppliers.length} suppliers and ${products.length} products.`,
    );
    console.log(
      'Created text index "products_text_idx" on products(name, description).',
    );
    console.log(
      "Created unique indexes on suppliers.supplier_id, products.product_id, products.sku.",
    );
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await close();
  }
})();
