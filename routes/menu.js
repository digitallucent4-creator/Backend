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
// GET ALL MENU ITEMS (Admin + Cashier)
// ===============================
router.get('/', checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;

    let sql = "SELECT * FROM menu_items WHERE 1=1";
    let values = [];

    if (search) {
      sql += " AND (name LIKE ? OR category LIKE ?)";
      values.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'all') {
      sql += " AND category = ?";
      values.push(category);
    }

    sql += " ORDER BY id DESC";

    const [rows] = await db.promise().query(sql, values);

    res.json({
      success: true,
      data: {
        items: rows
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching menu items"
    });
  }
});

// ===============================
// GET CATEGORIES (Admin + Cashier)
// ===============================
router.get('/categories', checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT DISTINCT category FROM menu_items"
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching categories"
    });
  }
});

// ===============================
// UPDATE STOCK (Admin ONLY)
// ===============================
router.put('/:id/stock', checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    // ✅ Validation
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity required"
      });
    }

    const [rows] = await db.promise().query(
      "SELECT stock FROM menu_items WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    let currentStock = rows[0].stock;
    let newStock;

    if (operation === 'decrease') {
      if (currentStock < quantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock"
        });
      }
      newStock = currentStock - quantity;

    } else if (operation === 'increase') {
      newStock = currentStock + quantity;

    } else {
      // direct set
      newStock = quantity;
    }

    await db.promise().query(
      "UPDATE menu_items SET stock = ? WHERE id = ?",
      [newStock, id]
    );

    res.json({
      success: true,
      message: "Stock updated successfully",
      data: {
        id,
        stock: newStock
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating stock"
    });
  }
});

module.exports = router;