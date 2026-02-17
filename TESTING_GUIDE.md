# Bookerang - Testing Guide for Kapil

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Docker (for PostgreSQL) or local PostgreSQL
- Git

### 1. Clone & Setup

```bash
cd ~/projects  # or wherever you keep projects
git clone <repo-url> bookerang
cd bookerang
```

### 2. Start Database (Docker)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials

npm install
npm run db:generate   # Generate Prisma client
npm run db:push       # Create tables
npm run db:seed       # (Optional) Seed test data
npm run dev           # Start dev server on port 3000
```

### 4. Setup Frontend

For the simple marketplace frontend:
```bash
cd ../bookswap-frontend  # or wherever it is
npm install
npm run dev             # Starts on port 5173
```

For the full Next.js frontend:
```bash
cd ../web
npm install
npm run dev             # Starts on port 3001
```

---

## 🔧 Admin Interface

### Option 1: Prisma Studio (Database UI)
```bash
cd backend
npm run db:studio
```
Opens a web UI at `http://localhost:5555` where you can:
- View all tables (Users, Listings, Schools, etc.)
- Add/edit/delete records directly
- Manage admin users

### Option 2: Admin API Endpoints
All require admin authentication (JWT token with `isAdmin: true`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stats` | GET | Dashboard stats |
| `/api/admin/users` | GET | List all users |
| `/api/admin/listings` | GET | List all listings |

### Creating an Admin User

Via Prisma Studio or SQL:
```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@example.com';
```

Or via seed script - edit `backend/prisma/seed.ts` to include an admin user.

---

## 📱 Testing User Flows

### Flow 1: Parent Registration
1. Open frontend
2. Click "Register" / "Sign Up"
3. Enter: name, email, phone, city, board (CBSE/ICSE/etc.)
4. Verify via OTP (check console/email)
5. Add children (name, class, school)

### Flow 2: List Books for Exchange
1. Login as parent
2. Click "List Books"
3. Select: board, class, condition
4. Add subjects/books
5. Upload images (optional)
6. Set exchange preference (pickup/school/porter)
7. Submit listing

### Flow 3: Request Books
1. Login as parent
2. Click "Request Books"
3. Select: board, class, subjects needed
4. Enable "Float" to get notified of future matches
5. Submit request

### Flow 4: Match & Exchange
1. System auto-matches listings to requests
2. Both parties get notified
3. Accept/reject match
4. Arrange exchange
5. Mark as completed

---

## 🧪 API Testing (Postman/curl)

### Health Check
```bash
curl http://localhost:3000/health
```

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "email": "test@example.com",
    "phone": "+919876543210",
    "city": "Mumbai",
    "board": "CBSE"
  }'
```

### Login (get OTP)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'
```

### Create Listing (with JWT)
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "listingType": "SET",
    "board": "CBSE",
    "class": 10,
    "city": "Mumbai",
    "condition": "ALMOST_NEW",
    "exchangePreference": ["PICKUP", "SCHOOL"],
    "items": [
      {"subject": "Mathematics", "title": "NCERT Math"},
      {"subject": "Science", "title": "NCERT Science"}
    ]
  }'
```

---

## 🐛 Debugging Tips

### Check logs
```bash
# Backend logs
cd backend && npm run dev

# Database logs
docker logs bookswap-postgres -f
```

### Reset database
```bash
cd backend
npm run db:push -- --force-reset
npm run db:seed
```

### Common issues

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Check Docker is running, check .env DATABASE_URL |
| "CORS error" | Backend CORS config needs frontend URL |
| "Token expired" | Re-login to get new JWT |
| "OTP not received" | Check console logs (dev mode logs OTP) |

---

## 📊 Test Data

Run seed script to populate test data:
```bash
cd backend
npm run db:seed
```

This creates:
- Sample schools (per city/board)
- Test users (parents)
- Sample listings
- Sample requests

---

## 🔗 URLs (Local Development)

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3000 |
| Frontend (Vite) | http://localhost:5173 |
| Frontend (Next.js) | http://localhost:3001 |
| Prisma Studio | http://localhost:5555 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## ✅ Testing Checklist

- [ ] Database connects successfully
- [ ] User registration works
- [ ] OTP verification works
- [ ] Login returns valid JWT
- [ ] Can create listing
- [ ] Can create request
- [ ] Matching algorithm finds matches
- [ ] Notifications are sent
- [ ] Admin endpoints work (with admin user)
- [ ] Image upload works
- [ ] WhatsApp deep links work

---

## 📞 Support

Questions? Reach out to Manu on Telegram: @manumayank04
