# HIM-STORE Backend Setup

## Overview
This is a Node.js + Express backend for the HIM-STORE e-commerce platform with MySQL database integration.

## Prerequisites
- Node.js (v14+)
- MySQL Server (v5.7+)
- npm or yarn

## Installation

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Database
Create a MySQL database and run the schema:

```bash
mysql -u root -p < config/database.sql
```

Or create manually:
```sql
CREATE DATABASE him_store_ecom;
USE him_store_ecom;
-- Then run the SQL commands from config/database.sql
```

### 3. Configure Environment
Edit `.env` file with your credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=him_store_ecom
PORT=5000
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_key
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get all products (paginated)
- `GET /api/products/:id` - Get single product
- `POST /api/products` (admin) - Create product
- `PUT /api/products/:id` (admin) - Update product
- `DELETE /api/products/:id` (admin) - Delete product

### Shopping Cart
- `POST /api/cart` - Add item to cart
- `GET /api/cart` - Get cart items
- `PUT /api/cart/:itemId` - Update cart item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:orderId` - Get order details
- `PUT /api/orders/:orderId` (admin) - Update order status

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:orderId` - Get payment status

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/orders` - All orders (filtered)
- `GET /api/admin/users` - All users
- `GET /api/admin/inventory` - Inventory status
- `GET /api/admin/analytics` - Sales analytics

## Project Structure
```
backend/
├── config/
│   ├── database.js       # Database connection
│   └── database.sql      # Database schema
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── paymentController.js
│   └── adminController.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── cart.js
│   ├── orders.js
│   ├── payments.js
│   └── admin.js
├── middleware/
│   └── auth.js           # JWT verification
├── public/
│   ├── index.html        # Frontend HTML
│   └── api.js            # Frontend API client
├── server.js             # Express entry point
├── package.json
├── .env                  # Environment variables
└── .gitignore
```

## Testing with Postman

### 1. Register User
```
POST http://localhost:5000/api/auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

### 2. Login
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Get Products
```
GET http://localhost:5000/api/products
```

### 4. Add to Cart (with token)
```
POST http://localhost:5000/api/cart
Headers: Authorization: Bearer <token>
Body: {
  "productId": 1,
  "quantity": 2
}
```

## Next Steps

1. **Add Sample Products** - Insert sample products into database
2. **Frontend Integration** - Update HTML to call APIs
3. **Stripe Integration** - Set up Stripe webhook
4. **Deploy** - Deploy to production server
5. **Email Notifications** - Add order confirmation emails
6. **Admin Dashboard** - Create admin UI

## Troubleshooting

### Database Connection Error
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists: `CREATE DATABASE him_store_ecom;`

### Port Already in Use
- Change PORT in `.env`
- Or kill process: `lsof -ti:5000 | xargs kill -9`

### Module Not Found
- Run `npm install`
- Check all dependencies in `package.json`

## Security Notes
- Change `JWT_SECRET` in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting
- Sanitize user inputs
- Use prepared statements (already implemented with mysql2)

## Support
For issues or questions, refer to the documentation or contact the development team.
