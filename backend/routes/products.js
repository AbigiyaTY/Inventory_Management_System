const express = require("express");
const { getDb } = require("../db");
const { parseId, validateProduct } = require("../validators");

const router = express.Router();
const products = () => getDb().collection("products");
const suppliers = () => getDb().collection("suppliers");

const HIDE_ID = { projection: { _id: 0 } };
const round2 = (n) => Math.round(n * 100) / 100;

router.get("/", async (req, res, next) => {
  try {
    const docs = await products()
      .find({}, HIDE_ID)
      .sort({ product_id: 1 })
      .toArray();
    res.status(200).json(docs);
  } catch (err) {
    next(err);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const q = typeof req.query.query === "string" ? req.query.query.trim() : "";
    if (!q) {
      return res
        .status(400)
        .json({
          error: 'Query parameter "query" is required and must not be empty.',
        });
    }
    if (q.length > 100) {
      return res
        .status(400)
        .json({ error: "Search query is too long (max 100 characters)." });
    }

    const docs = await products()
      .find(
        { $text: { $search: q } },
        { projection: { _id: 0, score: { $meta: "textScore" } } },
      )
      .sort({ score: { $meta: "textScore" } })
      .toArray();

    res.status(200).json(docs);
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const [totalsAgg] = await products()
      .aggregate([
        {
          $group: {
            _id: null,
            total_products: { $sum: 1 },
            total_units_in_stock: { $sum: "$quantity_in_stock" },
            total_units_sold: { $sum: { $ifNull: ["$units_sold", 0] } },
            total_inventory_value: {
              $sum: { $multiply: ["$price", "$quantity_in_stock"] },
            },
            total_revenue: { $sum: { $ifNull: ["$total_revenue", 0] } },
          },
        },
      ])
      .toArray();

    const neverSold = await products().countDocuments({
      $or: [{ units_sold: { $exists: false } }, { units_sold: 0 }],
    });

    const lowStock = await products().countDocuments({
      $expr: { $lte: ["$quantity_in_stock", "$reorder_level"] },
    });

    const byCategory = await products()
      .aggregate([
        {
          $group: {
            _id: "$category",
            product_count: { $sum: 1 },
            inventory_value: {
              $sum: { $multiply: ["$price", "$quantity_in_stock"] },
            },
            revenue: { $sum: { $ifNull: ["$total_revenue", 0] } },
            units_sold: { $sum: { $ifNull: ["$units_sold", 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            product_count: 1,
            inventory_value: { $round: ["$inventory_value", 2] },
            revenue: { $round: ["$revenue", 2] },
            units_sold: 1,
          },
        },
        { $sort: { revenue: -1 } },
      ])
      .toArray();

    const topProducts = await products()
      .find(
        {},
        {
          projection: {
            _id: 0,
            product_id: 1,
            name: 1,
            units_sold: 1,
            total_revenue: 1,
          },
        },
      )
      .sort({ total_revenue: -1 })
      .limit(5)
      .toArray();

    res.status(200).json({
      totals: {
        total_products: totalsAgg?.total_products || 0,
        total_units_in_stock: totalsAgg?.total_units_in_stock || 0,
        total_units_sold: totalsAgg?.total_units_sold || 0,
        total_inventory_value: round2(totalsAgg?.total_inventory_value || 0),
        total_revenue: round2(totalsAgg?.total_revenue || 0),
        products_never_sold: neverSold,
        low_stock_count: lowStock,
      },
      by_category: byCategory,
      top_products: topProducts,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null)
      return res
        .status(400)
        .json({ error: "Invalid product id. It must be a positive integer." });

    const doc = await products().findOne({ product_id: id }, HIDE_ID);
    if (!doc)
      return res.status(404).json({ error: `Product ${id} not found.` });

    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { errors, value } = validateProduct(req.body);
    if (errors.length)
      return res
        .status(400)
        .json({ error: "Validation failed.", details: errors });

    const supplier = await suppliers().findOne({
      supplier_id: value.supplier_id,
    });
    if (!supplier) {
      return res.status(400).json({
        error: "Validation failed.",
        details: [`supplier_id ${value.supplier_id} does not exist.`],
      });
    }

    if (await products().findOne({ sku: value.sku })) {
      return res
        .status(409)
        .json({ error: `A product with SKU "${value.sku}" already exists.` });
    }

    const last = await products()
      .find({})
      .sort({ product_id: -1 })
      .limit(1)
      .toArray();
    const product_id = last.length ? last[0].product_id + 1 : 1;

    const doc = {
      product_id,
      ...value,
      units_sold: 0,
      total_revenue: 0,
      last_sold_at: null,
      created_at: new Date(),
    };
    await products().insertOne(doc);

    const { _id, ...out } = doc;
    res.status(201).location(`/products/${product_id}`).json(out);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null)
      return res
        .status(400)
        .json({ error: "Invalid product id. It must be a positive integer." });

    const { errors, value } = validateProduct(req.body);
    if (errors.length)
      return res
        .status(400)
        .json({ error: "Validation failed.", details: errors });

    const existing = await products().findOne({ product_id: id });
    if (!existing)
      return res.status(404).json({ error: `Product ${id} not found.` });

    const supplier = await suppliers().findOne({
      supplier_id: value.supplier_id,
    });
    if (!supplier) {
      return res.status(400).json({
        error: "Validation failed.",
        details: [`supplier_id ${value.supplier_id} does not exist.`],
      });
    }

    const clash = await products().findOne({
      sku: value.sku,
      product_id: { $ne: id },
    });
    if (clash)
      return res
        .status(409)
        .json({ error: `Another product already uses SKU "${value.sku}".` });

    await products().updateOne(
      { product_id: id },
      { $set: { ...value, updated_at: new Date() } },
    );
    const updated = await products().findOne({ product_id: id }, HIDE_ID);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null)
      return res
        .status(400)
        .json({ error: "Invalid product id. It must be a positive integer." });

    const result = await products().deleteOne({ product_id: id });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: `Product ${id} not found.` });

    res.status(200).json({ message: `Product ${id} deleted.` });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/sale", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null)
      return res
        .status(400)
        .json({ error: "Invalid product id. It must be a positive integer." });

    const qty = req.body && req.body.quantity;
    if (!Number.isInteger(qty) || qty <= 0) {
      return res
        .status(400)
        .json({ error: "quantity must be a positive integer." });
    }

    const product = await products().findOne({ product_id: id });
    if (!product)
      return res.status(404).json({ error: `Product ${id} not found.` });
    if (product.quantity_in_stock < qty) {
      return res.status(400).json({ error: "Not enough stock for this sale." });
    }

    const revenue = round2(qty * product.price);

    const result = await products().updateOne(
      { product_id: id, $expr: { $gte: ["$quantity_in_stock", qty] } },
      {
        $inc: {
          quantity_in_stock: -qty,
          units_sold: qty,
          total_revenue: revenue,
        },
        $set: { last_sold_at: new Date() },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: "Not enough stock for this sale." });
    }

    const updated = await products().findOne({ product_id: id }, HIDE_ID);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
