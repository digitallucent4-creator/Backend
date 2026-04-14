const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔐 Middleware
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// ===============================
// APPLY AUTH
// ===============================
router.use(verifyToken);

// ===============================
// GET ALL PRODUCTS (Admin + Cashier)
// ===============================
router.get('/', checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;

    let sql = "SELECT * FROM products WHERE 1=1";
    let params = [];

    if (search) {
      sql += " AND (name LIKE ? OR sku LIKE ? OR category LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    sql += " ORDER BY id DESC";

    const [rows] = await db.promise().query(sql, params);

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching products"
    });
  }
});

// ===============================
// GET SINGLE PRODUCT
// ===============================
router.get('/:id', checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.promise().query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching product"
    });
  }
});

// ===============================
// CREATE PRODUCT (Admin ONLY)
// ===============================
router.post('/', checkRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      category,
      sku,
      barcode,
      description,
      selling_price,
      cost_price,
      stock,
      threshold,
      unit_type
    } = req.body;

    // ✅ Validation
    if (!name || !selling_price || !cost_price) {
      return res.status(400).json({
        success: false,
        message: "Name, selling price and cost price are required"
      });
    }

    // ✅ Check duplicate SKU
    if (sku) {
      const [existing] = await db.promise().query(
        "SELECT id FROM products WHERE sku = ?",
        [sku]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists"
        });
      }
    }

    const [result] = await db.promise().query(
      `INSERT INTO products 
      (name, category, sku, barcode, description, selling_price, cost_price, stock, threshold, unit_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        category,
        sku,
        barcode,
        description,
        selling_price,
        cost_price,
        stock || 0,
        threshold || 5,
        unit_type
      ]
    );

    res.json({
      success: true,
      message: "Product created successfully",
      id: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error creating product"
    });
  }
});

// ===============================
// UPDATE PRODUCT (Admin ONLY)
// ===============================
router.put('/:id', checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      category,
      sku,
      barcode,
      description,
      selling_price,
      cost_price,
      stock,
      threshold,
      unit_type
    } = req.body;

    const [result] = await db.promise().query(
      `UPDATE products 
       SET name=?, category=?, sku=?, barcode=?, description=?, 
           selling_price=?, cost_price=?, stock=?, threshold=?, unit_type=?
       WHERE id=?`,
      [
        name,
        category,
        sku,
        barcode,
        description,
        selling_price,
        cost_price,
        stock,
        threshold,
        unit_type,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating product"
    });
  }
});

// ===============================
// DELETE PRODUCT (Admin ONLY)
// ===============================
router.delete('/:id', checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.promise().query(
      "DELETE FROM products WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error deleting product"
    });
  }
});

// ===============================
// GET CATEGORIES
// ===============================
router.get('/categories/list', checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT DISTINCT category FROM products"
    );

    const categories = rows.map(r => r.category);

    res.json({
      success: true,
      data: categories
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching categories"
    });
  }
});

module.exports = router;