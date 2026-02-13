# 📚 BookSwap

School textbook exchange platform for parents.

## Overview

BookSwap helps parents exchange school textbooks. List books you want to give away, find books you need, and connect with other parents in your school or city.

## Features

- 📦 **List Books** — Post books you want to give away (full set or individual)
- 🔍 **Find Books** — Search for books by class, board, school, city
- 🤝 **Smart Matching** — Automatically match givers with receivers
- 📱 **Mobile First** — React Native app for iOS and Android
- 🔔 **Notifications** — WhatsApp + push notifications for matches

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma |
| Auth | Email OTP + JWT |

## Quick Start

### 1. Start Database

```bash
docker-compose up -d
```

### 2. Start Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:push
npm run dev
```

### 3. Start Mobile App

```bash
cd mobile
npm install
npm start
```

## Project Structure

```
book-exchange-kapil/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   ├── common/       # Shared utilities
│   │   └── config/       # Configuration
│   └── prisma/           # Database schema
├── mobile/               # React Native app
│   └── src/
│       ├── screens/      # App screens
│       ├── components/   # Reusable components
│       ├── services/     # API services
│       └── navigation/   # Navigation config
├── PRD.md                # Product requirements
├── Technical_Architecture.md
├── CLAUDE.md             # Dev instructions for Claude Code
└── docker-compose.yml    # Database setup
```

## Documentation

- [PRD.md](./PRD.md) — Product requirements
- [Technical_Architecture.md](./Technical_Architecture.md) — System design
- [CLAUDE.md](./CLAUDE.md) — Development guide

## License

Private — Kapil's Project
