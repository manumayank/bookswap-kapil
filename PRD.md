# BookSwap - School Book Exchange Platform
## Product Requirements Document

**Version:** 1.0  
**Date:** February 2026  
**Author:** Kapil (via Manu)

---

## 1. Problem Statement

School textbooks in India cost ₹15,000+ per student per year. When kids graduate to the next class, parents have no easy way to sell or donate these books. Meanwhile, other parents are buying the same books brand new.

**Current workarounds:**
- WhatsApp school groups (chaotic, no structure)
- Local shops (pay very little)
- Throw away / store indefinitely

**Opportunity:** Connect parents within the same school/city/board to exchange books directly.

---

## 2. Solution Overview

A mobile-first platform where parents can:
1. **List books** they want to give away (free or priced later)
2. **Request books** for their child's upcoming class
3. **Get matched** with other parents in same school/city/board
4. **Exchange** without revealing personal details

---

## 3. User Personas

### Primary: Parent (Giver)
- Has books from completed school year
- Wants to declutter / help other parents
- Needs easy listing process

### Primary: Parent (Receiver)
- Child starting new class
- Wants affordable/free books
- Needs books before school starts

### Secondary: School Admin (Future)
- Could facilitate exchanges on campus
- Track book donations for CSR

---

## 4. Core Features (MVP)

### 4.1 Registration & Profile

| Field | Type | Required |
|-------|------|----------|
| Name | Text | ✓ |
| Email | Email | ✓ |
| Phone | Phone | ✓ |
| City | Dropdown | ✓ |
| Address | Text | ✓ (for pickup) |
| School Name | Searchable dropdown | ✓ |
| Education Board | Dropdown (CBSE/ICSE/State/IB) | ✓ |
| Number of Kids | Number | ✓ |
| Class of Kid 1 | Dropdown (1-12) | ✓ |
| Class of Kid 2 | Dropdown | Optional |
| Class of Kid 3 | Dropdown | Optional |

### 4.2 Login / Authentication

- **Email + OTP** (primary)
- Optional: Google Sign-in
- Phone OTP as backup

### 4.3 Offer Books (Give Away)

**Listing Type:**
- [ ] Complete Set (all books for a class)
- [ ] Individual Books

**Book Details:**

| Field | Type | Required |
|-------|------|----------|
| Education Board | Dropdown | ✓ |
| Class | Dropdown | ✓ |
| Subject | Dropdown/Multi-select | ✓ (if individual) |
| School | Auto-filled or select | ✓ |
| City | Auto-filled | ✓ |
| Year of Purchase | Dropdown | ✓ |
| Condition | Radio | ✓ |
| Images | Upload (3 per book) | Recommended |

**Condition Options:**
1. 📗 Unused (still in plastic)
2. 📘 Almost New (minimal use)
3. 📙 Water/Tea Marks (some stains)
4. 📕 Underlined/Highlighted (written notes)

**Image Requirements:**
- Front cover
- Back cover  
- Random middle page (to show condition)

**Exchange Preferences:**
- [ ] Pickup from my address
- [ ] Exchange at school
- [ ] Porter/Courier (receiver pays)

### 4.4 Request Books

**Search Filters:**
- Education Board
- Class
- Subject (optional)
- School (optional - same school preferred)
- City
- Condition (minimum acceptable)

**If no match found:**
→ "Float Request" - saves request and notifies when matching books listed

**Notifications:**
- In-app push notification
- WhatsApp notification (to all matching criteria)

### 4.5 Matching & Exchange Flow

```
┌─────────────┐         ┌─────────────┐
│   GIVER     │         │  RECEIVER   │
│  Lists      │         │  Requests   │
│  Books      │         │  Books      │
└──────┬──────┘         └──────┬──────┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
          ┌───────────────┐
          │    MATCHING   │
          │    ENGINE     │
          │ (School/City/ │
          │  Board/Class) │
          └───────┬───────┘
                  │
                  ▼
          ┌───────────────┐
          │  NOTIFICATION │
          │  • In-App     │
          │  • WhatsApp   │
          └───────┬───────┘
                  │
                  ▼
          ┌───────────────┐
          │   EXCHANGE    │
          │  • Accept     │
          │  • Schedule   │
          │  • Complete   │
          └───────────────┘
```

**Privacy:** Platform mediates. Personal details (address/phone) shared only after both parties confirm exchange.

### 4.6 Sample Papers (Phase 2)

**Upload:**
- Class
- Subject
- School/Board
- Year
- File (PDF)

**Download:**
- Browse by Class → Subject → Board
- Free download

---

## 5. Screens (MVP)

### 5.1 Onboarding
1. Splash Screen
2. Login (Email + OTP)
3. Registration Form
4. Add Children Details

### 5.2 Home
- Quick actions: "Give Books" / "Need Books"
- Active listings count
- Pending requests count
- Recent matches

### 5.3 Give Books
1. Select: Set or Individual
2. Book details form
3. Condition selection
4. Image upload
5. Exchange preference
6. Preview & Submit

### 5.4 Need Books
1. Filter selection
2. Results list
3. Book detail view
4. "Request This" button
5. Float request (if no match)

### 5.5 My Activity
- My Listings (active/completed)
- My Requests (pending/matched)
- Exchange History

### 5.6 Notifications
- Match alerts
- Request updates
- Exchange confirmations

### 5.7 Profile
- Edit profile
- Manage children
- Settings
- Logout

---

## 6. Notifications Strategy

| Event | In-App | WhatsApp | Email |
|-------|--------|----------|-------|
| New match found | ✓ | ✓ | ✗ |
| Request received | ✓ | ✓ | ✗ |
| Exchange confirmed | ✓ | ✓ | ✓ |
| Exchange completed | ✓ | ✗ | ✓ |
| Floated request matched | ✓ | ✓ | ✗ |

---

## 7. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| App Load Time | < 3 sec |
| Search Results | < 1 sec |
| Image Upload | < 5 sec per image |
| Availability | 99.5% |
| Languages | English, Hindi (Phase 2) |

---

## 8. Success Metrics

| Metric | Target (3 months) |
|--------|-------------------|
| Registered Users | 5,000 |
| Books Listed | 10,000 |
| Successful Exchanges | 1,000 |
| User Retention (D30) | 40% |
| Schools Covered | 100 |
| Cities | 5 major metros |

---

## 9. Monetization (Future)

**Phase 1 (MVP):** Free - focus on adoption

**Phase 2 Options:**
1. **Premium Listings** - Featured/boosted visibility
2. **Transaction Fee** - Small fee on paid exchanges
3. **Porter Integration** - Commission on delivery
4. **School Partnerships** - B2B for bulk exchanges
5. **Ads** - Stationery/tuition services

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Fake listings | Image verification, user ratings |
| No-shows | Confirmation flow, soft penalties |
| Data privacy | Mediated exchange, no direct sharing |
| Low supply | Seed with school partnerships |
| Seasonal demand | Push listings post-exam season |

---

## 11. MVP Scope Summary

**In Scope:**
- ✅ User registration & login (Email OTP)
- ✅ Profile with children details
- ✅ List books (set/individual)
- ✅ Request books with filters
- ✅ Matching engine (school/city/board/class)
- ✅ In-app notifications
- ✅ WhatsApp notifications (basic)
- ✅ Exchange flow (accept/schedule/complete)

**Out of Scope (Phase 2):**
- ❌ Payments/pricing
- ❌ Sample papers
- ❌ Porter integration
- ❌ School admin portal
- ❌ Multi-language

---

## 12. Timeline Estimate

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Design | 2 weeks | Wireframes, UI design |
| Backend | 4 weeks | API, database, matching |
| Mobile App | 4 weeks | React Native / Flutter |
| Testing | 2 weeks | QA, beta testing |
| Launch | 1 week | Play Store, soft launch |

**Total:** ~13 weeks for MVP

---

*Next: Technical Architecture & Database Design*
