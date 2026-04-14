const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔐 Middleware
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// ===============================
// APPLY AUTH TO ALL ROUTES
// ===============================
router.use(verifyToken);

// ===============================
// GET ALL CUSTOMERS (Admin + Cashier)
// ===============================
router.get('/', checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM customers ORDER BY id DESC");

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching customers"
    });
  }
});

// ===============================
// GET SINGLE CUSTOMER
// ===============================
router.get('/:id', checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.promise().query(
      "SELECT * FROM customers WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
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
      message: "Error fetching customer"
    });
  }
});

// ===============================
// CREATE CUSTOMER
// ===============================
router.post('/', checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { name, email, phone, address, city, pincode, gst_number } = req.body;

    // ✅ Basic validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required"
      });
    }

    const [result] = await db.promise().query(
      `INSERT INTO customers 
      (name, email, phone, address, city, pincode, gst_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, email, phone, address, city, pincode, gst_number]
    );

    res.json({
      success: true,
      message: "Customer created successfully",
      id: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error creating customer"
    });
  }
});

// ===============================
// UPDATE CUSTOMER (Admin ONLY)
// ===============================
router.put('/:id', checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, city, pincode, gst_number } = req.body;

    const [result] = await db.promise().query(
      `UPDATE customers 
       SET name=?, email=?, phone=?, address=?, city=?, pincode=?, gst_number=?
       WHERE id=?`,
      [name, email, phone, address, city, pincode, gst_number, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json({
      success: true,
      message: "Customer updated successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating customer"
    });
  }
});

// ===============================
// DELETE CUSTOMER (Admin ONLY)
// ===============================
router.delete('/:id', checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.promise().query(
      "DELETE FROM customers WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json({
      success: true,
      message: "Customer deleted successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error deleting customer"
    });
  }
});

module.exports = router;