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
// DASHBOARD STATS (Admin ONLY)
// ===============================
router.get('/stats', checkRole(['admin']), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        (SELECT IFNULL(SUM(final_total),0) 
         FROM sales 
         WHERE DATE(created_at) = CURDATE()) AS todayRevenue,

        (SELECT COUNT(*) 
         FROM sales 
         WHERE DATE(created_at) = CURDATE()) AS todaySales,

        (SELECT COUNT(*) FROM customers) AS totalCustomers,

        (SELECT COUNT(*) 
         FROM products 
         WHERE stock <= threshold) AS lowStock,

        (SELECT IFNULL(SUM(final_total),0) 
         FROM sales 
         WHERE YEAR(created_at) = YEAR(CURDATE()) 
         AND WEEK(created_at) = WEEK(CURDATE())) AS weekRevenue,

        (SELECT IFNULL(SUM(final_total),0) 
         FROM sales 
         WHERE YEAR(created_at) = YEAR(CURDATE()) 
         AND MONTH(created_at) = MONTH(CURDATE())) AS monthRevenue
    `);

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats"
    });
  }
});

// ===============================
// RECENT SALES (Admin + Cashier)
// ===============================
router.get('/recent-sales', checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        s.id,
        s.final_total AS grand_total,
        s.payment_method,
        s.created_at AS sale_date,
        c.name AS customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.id DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching recent sales"
    });
  }
});

// ===============================
// TOP CATEGORIES (Admin ONLY)
// ===============================
router.get('/top-categories', checkRole(['admin']), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        p.category,
        SUM(si.quantity) AS total_items_sold,
        SUM(si.quantity * si.price) AS total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.category
      ORDER BY total_revenue DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching top categories"
    });
  }
});

// ===============================
// INSIGHTS (Admin + Cashier)
// ===============================
router.get('/insights', checkRole(['admin', 'cashier']), async (req, res) => {
  try {
    const [lowStockItems] = await db.promise().query(`
      SELECT name, stock, threshold 
      FROM products 
      WHERE stock <= threshold
      LIMIT 5
    `);

    const insights = [
      {
        type: 'info',
        title: 'System Status',
        message: 'POS system is running smoothly'
      }
    ];

    if (lowStockItems.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Some products are low in stock',
        items: lowStockItems
      });
    }

    res.json({
      success: true,
      data: insights
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching insights"
    });
  }
});

module.exports = router;