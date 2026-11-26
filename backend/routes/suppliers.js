const express = require("express");
const { getDb } = require("../db");
const { parseId } = require("../validators");

const router = express.Router();
const suppliers = () => getDb().collection("suppliers");
const HIDE_ID = { projection: { _id: 0 } };

router.get("/", async (req, res, next) => {
  try {
    const docs = await suppliers()
      .find({}, HIDE_ID)
      .sort({ supplier_id: 1 })
      .toArray();
    res.status(200).json(docs);
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
        .json({ error: "Invalid supplier id. It must be a positive integer." });

    const doc = await suppliers().findOne({ supplier_id: id }, HIDE_ID);
    if (!doc)
      return res.status(404).json({ error: `Supplier ${id} not found.` });

    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
