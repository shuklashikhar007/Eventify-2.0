# Eventify — Backend (Node.js / Express / MongoDB)

College event management platform for IIT BHU.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Security**: helmet, express-rate-limit, CORS

---

## Project Structure
```
eventify-backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── adminConfig.js     # Hardcoded admin (bcrypt hash only)
├── controllers/
│   ├── authController.js
│   ├── eventController.js
│   └── adminController.js
├── middleware/
│   ├── auth.js            # JWT protect / adminOnly guards
│   ├── errorHandler.js    # Global error handler + asyncHandler
│   └── validators.js      # express-validator rules
├── models/
│   ├── User.js
│   └── Event.js
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── adminRoutes.js
├── utils/
│   └── generateToken.js
├── seed.js                # Demo data seeder
├── server.js              # Entry point
└── API_DOCS.md
```

---

## Setup

1. **Clone & install**
   ```bash
   cd eventify-backend
   npm install
   ```

2. **Create `.env`** (copy from `.env.example`)
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/eventify
   JWT_SECRET=replace_with_a_long_random_string
   JWT_EXPIRE=7d
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

3. **Start dev server**
   ```bash
   npm run dev
   ```

4. **(Optional) Seed demo data**
   ```bash
   node seed.js
   # To clear: node seed.js --clear
   ```

---

## Email Restriction

Only `@iitbhu.ac.in` and `@itbhu.ac.in` addresses can register. Enforced at both validation middleware and Mongoose model level.

---

## API Documentation

See [API_DOCS.md](./API_DOCS.md) for all endpoints, request bodies, and response shapes.