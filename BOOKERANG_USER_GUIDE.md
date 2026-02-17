# Bookerang - Testing Guide 🪃📚

## Links

| What | URL |
|------|-----|
| **Main Website** | https://bookswap.aiqr.cloud |
| **Admin Panel** | https://bookswap.aiqr.cloud/admin/dashboard |

---

## 🧑‍💻 Testing as a User (Parent)

### 1. Register a New Account
1. Go to https://bookswap.aiqr.cloud
2. Click **"Login"** → then **"Register"**
3. Fill in:
   - Your name
   - Email address
   - Phone number (with country code, e.g., +91 98765 43210)
   - City
   - Board (CBSE / ICSE / State / IB)
4. You'll receive an OTP on email/phone
5. Enter OTP to verify

### 2. Add Your Children
1. After login, go to Dashboard
2. Click **"Add Child"**
3. Enter child's name, class (1-12), and school
4. Save

### 3. List Books for Sale/Exchange
1. Click **"Sell Your Books"** or go to Dashboard → **"New Listing"**
2. Select:
   - Board & Class
   - Condition (Unused / Almost New / Water Marks / Underlined)
   - How you want to exchange (Pickup / School Meet / Porter)
3. Add books:
   - Subject name
   - Book title (optional)
   - Upload photos (optional)
4. Submit listing

### 4. Browse & Find Books
1. Click **"Find Books"** or **"Browse Books"**
2. Filter by:
   - Board
   - Class
   - City
   - Condition
3. Click on a book to see details
4. Click **"Contact on WhatsApp"** to message the seller

### 5. Request Books (Float Request)
1. Go to Dashboard → **"Request Books"**
2. Select board, class, subjects you need
3. Enable **"Float"** to get notified when matching books are listed
4. Submit request

---

## 🔧 Testing as Admin

### Access Admin Panel
1. Go to https://bookswap.aiqr.cloud/admin/dashboard
2. Login with admin account

### Admin Features to Test

| Section | What You Can Do |
|---------|-----------------|
| **Dashboard** | View stats: total users, listings, schools |
| **Users** | View all registered users, see their details |
| **Listings** | View all book listings, check status |
| **Requests** | View all book requests |
| **Schools** | Manage school database |

---

## ✅ Testing Checklist

### User Flow
- [ ] Can register new account
- [ ] OTP verification works
- [ ] Can login after registration
- [ ] Can add children
- [ ] Can create a book listing
- [ ] Can browse books
- [ ] Can filter books by board/class/city
- [ ] WhatsApp contact button works
- [ ] Can create a book request
- [ ] Float notification setting works

### Admin Flow
- [ ] Can access admin panel
- [ ] Dashboard shows correct stats
- [ ] Can view all users
- [ ] Can view all listings
- [ ] Can view all requests
- [ ] Can manage schools

### General
- [ ] Website loads properly on mobile
- [ ] Website loads properly on desktop
- [ ] All buttons are clickable
- [ ] Forms show errors for invalid input
- [ ] Pages don't show errors

---

## 🐛 Reporting Issues

When you find a bug, please note:
1. **What page** were you on?
2. **What did you click** or do?
3. **What happened** vs what you expected?
4. **Screenshot** if possible

Send issues to Manu on Telegram: @manumayank04

---

## 📝 Test Accounts

| Role | Email | OTP Code |
|------|-------|----------|
| **Admin** | kapil@bookerang.in | 123456 |
| **Test User** | testuser@bookerang.in | 123456 |

### How to Login:
1. Go to https://bookswap.aiqr.cloud/login
2. Enter the email address
3. Click "Send OTP" (you can skip waiting - use the code above)
4. Enter OTP: **123456**
5. You're in!

> ⚠️ These test OTPs are pre-loaded and valid for 24 hours.

---

**Happy Testing! 🪃📚**
