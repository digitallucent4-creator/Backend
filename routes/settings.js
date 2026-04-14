const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔐 Middleware
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// ===============================
// GET FULL SETTINGS (Admin ONLY)
// ===============================
router.get('/', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM settings WHERE id = 1");

    res.json({
      success: true,
      data: rows[0] || {}
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching settings"
    });
  }
});

// ===============================
// UPDATE FULL SETTINGS (Admin ONLY)
// ===============================
router.put('/', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const data = req.body;

    await db.promise().query(`
      UPDATE settings SET 
        store_name = ?, 
        store_address = ?, 
        store_phone = ?, 
        store_email = ?, 
        store_gstin = ?, 
        currency = ?, 
        tax_rate = ?, 
        items_per_page = ?, 
        theme = ?, 
        invoice_prefix = ?, 
        low_stock_alert = ?
      WHERE id = 1
    `, [
      data.store_name,
      data.store_address,
      data.store_phone,
      data.store_email,
      data.store_gstin,
      data.currency,
      data.tax_rate,
      data.items_per_page,
      data.theme,
      data.invoice_prefix,
      data.low_stock_alert
    ]);

    res.json({
      success: true,
      message: "Settings updated successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating settings"
    });
  }
});

// ===============================
// GET STORE INFO (Admin + Cashier)
// ===============================
router.get('/store', verifyToken, checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        store_name,
        store_address,
        store_phone,
        store_email,
        store_gstin
      FROM settings
      WHERE id = 1
    `);

    res.json({
      success: true,
      data: rows[0] || {}
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching store info"
    });
  }
});

// ===============================
// UPDATE STORE INFO (Admin ONLY)
// ===============================
router.put('/store', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const {
      store_name,
      store_address,
      store_phone,
      store_email,
      store_gstin
    } = req.body;

    await db.promise().query(`
      UPDATE settings SET 
        store_name = ?, 
        store_address = ?, 
        store_phone = ?, 
        store_email = ?, 
        store_gstin = ?
      WHERE id = 1
    `, [
      store_name,
      store_address,
      store_phone,
      store_email,
      store_gstin
    ]);

    res.json({
      success: true,
      message: "Store info updated successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating store info"
    });
  }
});

module.exports = router;