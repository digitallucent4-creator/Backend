const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 🔐 Middleware
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// ===============================
// CREATE CASHIER (Admin ONLY)
// ===============================
router.post(
  '/create-cashier',
  verifyToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // ✅ Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }

      // ✅ Check existing user
      const [existing] = await db.promise().query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }

      // 🔐 Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Insert user
      await db.promise().query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'cashier')",
        [name, email, hashedPassword]
      );

      res.json({
        success: true,
        message: "Cashier created successfully"
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Error creating cashier"
      });
    }
  }
);

// ===============================
// LOGIN
// ===============================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    // 🔍 Find user
    const [rows] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    const user = rows[0];

    // 🔐 Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

    // 🎟️ Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

// ===============================
// GET PROFILE (Logged-in user)
// ===============================
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching profile"
    });
  }
});

module.exports = router;