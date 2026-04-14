# Elites POS System - Backend API

Simple Express.js backend API with mock data (no database, no authentication).

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Run Production Server
```bash
npm start
```

Server will start on: **http://localhost:8000**

---

## 📡 API Endpoints

### **Dashboard** - `/api/dashboard`
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-sales` - Get recent sales
- `GET /api/dashboard/top-categories` - Get top categories
- `GET /api/dashboard/insights` - Get AI insights

### **Products** - `/api/products`
- `GET /api/products` - Get all products (with pagination, search, filter)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/categories/list` - Get all categories

### **Customers** - `/api/customers`
- `GET /api/customers` - Get all customers (with pagination, search)
- `GET /api/customers/:id` - Get single customer
- `GET /api/customers/:id/history` - Get customer with purchase history
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### **Sales** - `/api/sales`
- `GET /api/sales` - Get all sales (with pagination, filter)
- `GET /api/sales/:id` - Get single sale with items
- `POST /api/sales` - Create new sale (POS checkout)
- `PUT /api/sales/:id/cancel` - Cancel/refund sale

### **Reports** - `/api/reports`
- `GET /api/reports/sales-performance` - Get sales performance chart data
- `GET /api/reports/category-distribution` - Get category distribution pie chart
- `GET /api/reports/tax-summary` - Get tax summary (GST breakdown)
- `GET /api/reports/profit-loss` - Get profit and loss report
- `GET /api/reports/daily-sales` - Get daily sales report

### **Settings** - `/api/settings`
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/store` - Get store information
- `PUT /api/settings/store` - Update store information

---

## 📝 Query Parameters

### Pagination
All list endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Search & Filter
- `search` - Search term
- `category` - Filter by category (products)
- `status` - Filter by status (active/inactive/all)
- `payment_method` - Filter by payment method (sales)

---

## 📦 Response Format

All responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

---

## 🔧 Tech Stack
- **Framework:** Express.js
- **Data:** Mock data (in-memory)
- **No Database**
- **No Authentication**

---

## 📌 Example Requests

### Get Products
```bash
curl http://localhost:3000/api/products
```

### Create Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "category": "Electronics",
    "sku": "TEST001",
    "selling_price": 999,
    "cost_price": 500,
    "current_stock": 50
  }'
```

### Create Sale
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [
      {
        "product_id": 1,
        "product_name": "Wireless Mouse",
        "quantity": 2,
        "price": 599,
        "tax_rate": 18
      }
    ],
    "discount": 50,
    "payment_method": "cash",
    "amount_paid": 1500
  }'
```

---

## 🎯 Next Steps
1. Connect to MySQL database
2. Add JWT authentication
3. Add role-based access control
4. Add data validation
5. Add file upload for receipts

---

**Built with Express.js for Elites POS System**
