const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔐 Middleware
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// ===============================
// CREATE SALE (Admin + Cashier)
// ===============================
router.post('/', verifyToken, checkRole(['admin', 'cashier']), async (req, res) => {
  const { customer_id, items, discount = 0, payment_method, amount_paid } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Items are required"
    });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    let subtotal = 0;
    let tax = 0;

    // ✅ Calculate totals
    for (let item of items) {
      const total = item.quantity * item.price;
      subtotal += total;
      tax += (total * 18) / 100; // later settings se le sakte ho
    }

    const final_total = subtotal + tax - discount;
    const change = amount_paid - final_total;

    if (change < 0) {
      throw new Error("Insufficient payment");
    }

    // ✅ Insert Sale
    const [saleResult] = await connection.query(
      `INSERT INTO sales 
      (customer_id, total, discount, tax, final_total, payment_method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [customer_id, subtotal, discount, tax, final_total, payment_method]
    );

    const sale_id = saleResult.insertId;

    // ✅ Insert Sale Items + Update Stock
    for (let item of items) {
      // 🔍 Check stock first
      const [productRows] = await connection.query(
        "SELECT stock FROM products WHERE id = ?",
        [item.product_id]
      );

      if (productRows.length === 0) {
        throw new Error(`Product not found (ID: ${item.product_id})`);
      }

      const currentStock = productRows[0].stock;

      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product ID ${item.product_id}`);
      }

      // 🧾 Insert item
      await connection.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [sale_id, item.product_id, item.quantity, item.price]
      );

      // 📦 Update stock
      await connection.query(
        `UPDATE products 
         SET stock = stock - ? 
         WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Sale completed successfully",
      sale_id,
      final_total,
      change
    });

  } catch (err) {
    await connection.rollback();

    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message || "Sale failed"
    });

  } finally {
    connection.release();
  }
});

// ===============================
// GET ALL SALES (Admin ONLY)
// ===============================
router.get('/', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        s.*, 
        c.name AS customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.id DESC
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching sales"
    });
  }
});

// ===============================
// GET SINGLE SALE (Admin ONLY)
// ===============================
router.get('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const [saleRows] = await db.promise().query(
      "SELECT * FROM sales WHERE id = ?",
      [id]
    );

    if (saleRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    const [itemsRows] = await db.promise().query(
      `SELECT 
        si.*, 
        p.name AS product_name 
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        sale: saleRows[0],
        items: itemsRows
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching sale"
    });
  }
});

// ===============================
// CANCEL SALE (Admin ONLY)
// ===============================
router.put('/:id/cancel', verifyToken, checkRole(['admin']), async (req, res) => {
  const { id } = req.params;

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // 🔍 Check sale
    const [saleRows] = await connection.query(
      "SELECT * FROM sales WHERE id = ?",
      [id]
    );

    if (saleRows.length === 0) {
      throw new Error("Sale not found");
    }

    if (saleRows[0].status === 'cancelled') {
      throw new Error("Sale already cancelled");
    }

    // 🔍 Get items
    const [items] = await connection.query(
      "SELECT * FROM sale_items WHERE sale_id = ?",
      [id]
    );

    // 📦 Restore stock
    for (let item of items) {
      await connection.query(
        `UPDATE products 
         SET stock = stock + ? 
         WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // ❌ Cancel sale
    await connection.query(
      "UPDATE sales SET status = 'cancelled' WHERE id = ?",
      [id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Sale cancelled and stock restored"
    });

  } catch (err) {
    await connection.rollback();

    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message || "Cancel failed"
    });

  } finally {
    connection.release();
  }
});

module.exports = router;