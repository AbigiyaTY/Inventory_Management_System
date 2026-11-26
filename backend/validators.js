function parseId(value) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isNonNegInt = (v) => Number.isInteger(v) && v >= 0;

function validateProduct(body) {
  const errors = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: ["Request body must be a JSON object."], value: null };
  }

  if (!isNonEmptyString(body.name))
    errors.push("name is required (non-empty string).");
  else if (body.name.trim().length > 120)
    errors.push("name must be at most 120 characters.");

  if (!isNonEmptyString(body.sku))
    errors.push("sku is required (non-empty string).");
  if (!isNonEmptyString(body.category))
    errors.push("category is required (non-empty string).");

  if (
    typeof body.price !== "number" ||
    !Number.isFinite(body.price) ||
    body.price < 0
  ) {
    errors.push("price must be a number >= 0.");
  }
  if (!isNonNegInt(body.quantity_in_stock)) {
    errors.push("quantity_in_stock must be an integer >= 0.");
  }
  if (!isNonNegInt(body.reorder_level)) {
    errors.push("reorder_level must be an integer >= 0.");
  }
  if (!Number.isInteger(body.supplier_id) || body.supplier_id < 1) {
    errors.push("supplier_id must be a positive integer.");
  }
  if (body.description !== undefined && typeof body.description !== "string") {
    errors.push("description must be a string.");
  }
  if (body.image_url !== undefined && typeof body.image_url !== "string") {
    errors.push("image_url must be a string.");
  }
  if (
    typeof body.image_url === "string" &&
    body.image_url.trim().length > 500
  ) {
    errors.push("image_url must be at most 500 characters.");
  }
  if (
    typeof body.image_url === "string" &&
    body.image_url.trim() &&
    !/^https?:\/\//i.test(body.image_url.trim())
  ) {
    errors.push("image_url must start with http:// or https://.");
  }

  if (errors.length) return { errors, value: null };

  return {
    errors: [],
    value: {
      name: body.name.trim(),
      sku: body.sku.trim().toUpperCase(),
      category: body.category.trim(),
      price: Math.round(body.price * 100) / 100,
      quantity_in_stock: body.quantity_in_stock,
      reorder_level: body.reorder_level,
      supplier_id: body.supplier_id,
      description: (body.description || "").trim(),
      image_url: (body.image_url || "").trim(),
    },
  };
}

module.exports = { parseId, validateProduct };
