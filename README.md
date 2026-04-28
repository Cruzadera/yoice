# Votia

Votia is a group-based social app where friends answer a daily question and vote together, turning everyday decisions into a shared experience.

Instead of passive content, Votia focuses on **decisions** — simple, fast, and social.

---

## 🧠 Core Concept

- Users belong to **groups**
- Each group has **one daily question**
- Members **vote** and see results instantly
- Groups can optionally **share their questions/results publicly**

The app combines:
- Daily habit (question of the day)
- Social interaction (groups)
- Lightweight decision-making

---

## 🏗️ Project Structure

- `backend/`: Node.js + Express + Prisma
- `frontend/`: Expo (React Native + Web)
- `data/`: seed data and static resources
- `PostgreSQL`: external database

---

## 🚀 Main Features (WIP)

- Group creation and membership
- Daily question per group
- Voting system (1 vote per user)
- Results visualization
- Group visibility settings:
  - private
  - public question
  - public results

---

## 🔮 Future Features

- Public feed of shared questions
- User profiles and stats
- Group identity and history
- ActivityPub (fediverse) integration

---

## ⚙️ Environment Variables

### Backend

File: `backend/.env`

```env
DATABASE_URL="postgresql://user:password@host:5432/votia"
JWT_SECRET="change-this-secret"
PORT=3001
```

## Frontend

**File:** `frontend/.env`

```env
EXPO_PUBLIC_API_URL="http://localhost:3001/api"
```

---

## 🧪 Getting Started

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start
```

### Frontend

```bash
cd frontend
npm install
npm run start
```

---

## 🧱 Data Model (simplified)

```ts
User {
  id
  username
}

Group {
  id
  name
  visibility
  createdBy
}

GroupMember {
  userId
  groupId
  role
}

Question {
  id
  groupId
  text
  createdAt
}

Option {
  id
  questionId
  text
}

Vote {
  userId
  optionId
}
```

---

## 🔐 Visibility Model

Each group defines how its content is shared:

- `private` → only visible inside the group  
- `public_question` → question is public  
- `public_results` → results are also public  

---

## 🧭 Roadmap

- [ ] Domain refactor (groups + questions)
- [ ] Remove WhatsApp-based flows
- [ ] Basic group UI
- [ ] Voting UX improvements
- [ ] Public feed
- [ ] Profiles & stats
- [ ] Fediverse integration

---

## 💡 Philosophy

Votia is not a traditional social network.

It is designed around:

- decisions instead of content  
- groups instead of followers  
- daily interaction instead of endless scrolling  
