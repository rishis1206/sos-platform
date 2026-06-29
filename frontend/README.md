# 🚨 Emergent AI SOS — AI Powered Emergency Response Platform

A real-time emergency response system connecting victims with nearby volunteers, powered by AI assistance, live GPS tracking, and instant notifications.

> Built with React, Node.js, MongoDB, Socket.io, and Gemini AI

---

## ✨ Features

### For Victims
- One-tap SOS emergency trigger
- 6 emergency categories — Medical, Accident, Fire, Assault, Natural Disaster, Other
- Real-time GPS location sharing
- Live map showing volunteer's location and ETA
- AI-powered first aid assistant (Gemini 2.5)
- Real-time chat with responding volunteer
- Complete SOS history log

### For Volunteers
- Real-time SOS notifications via Socket.io
- Dynamic radius expansion — notified if within 500m, expands to 1km → 5km → 10km if no response
- Distance display before accepting
- Navigation map with route to victim
- Real-time chat with victim
- Rescue history and stats

### Platform
- Phone OTP authentication (JWT)
- Role-based access — victims and volunteers completely separated
- Public activity log visible without login
- Real-time everything via Socket.io
- Mobile-first responsive design
- Dark mode UI with red accent theme

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Real-time | Socket.io |
| Maps | Leaflet + OpenStreetMap |
| AI Assistant | Google Gemini 2.5 Flash |
| Auth | JWT + Phone OTP |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## 📁 Project Structure
sos-platform/

├── backend/                 # Node.js + Express API

│   ├── models/              # MongoDB schemas

│   │   ├── User.js

│   │   ├── SOSRequest.js

│   │   └── Message.js

│   ├── routes/              # API endpoints

│   │   ├── auth.js

│   │   ├── sos.js

│   │   ├── users.js

│   │   ├── volunteers.js

│   │   └── messages.js

│   ├── middleware/          # Auth + error handling

│   ├── socket/              # Socket.io handlers

│   └── server.js

│

├── frontend/                # React + Vite

│   └── src/

│       ├── pages/

│       │   ├── Home.jsx

│       │   ├── Victim.jsx

│       │   └── Volunteer.jsx

│       ├── components/

│       │   ├── SOSMap.jsx

│       │   ├── AIAssistant.jsx

│       │   └── ChatBox.jsx

│       ├── context/

│       │   └── AuthContext.jsx

│       └── services/

│           └── api.js

---

## 🚀 Running Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Google Gemini API key

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env file with:
# VITE_GEMINI_API_KEY=your_key
npm run dev
```

---

## 🔑 Environment Variables

### Backend `.env`
PORT=5000

NODE_ENV=development

MONGODB_URI=your_mongodb_atlas_uri

JWT_SECRET=your_jwt_secret

JWT_EXPIRE=7d

CLIENT_URL=http://localhost:3000

DEFAULT_SEARCH_RADIUS=10

GEMINI_API_KEY=your_gemini_key

TWILIO_ACCOUNT_SID=your_twilio_sid

TWILIO_AUTH_TOKEN=your_twilio_token

TWILIO_PHONE_NUMBER=your_twilio_number

AI_SERVICE_URL=http://localhost:8000

### Frontend `.env`
VITE_GEMINI_API_KEY=your_gemini_key

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP and login |
| GET | `/api/auth/me` | Get current user |

### SOS
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sos` | Create SOS request |
| GET | `/api/sos` | Get active SOS requests |
| GET | `/api/sos/public` | Public activity log |
| GET | `/api/sos/history` | SOS history |
| PUT | `/api/sos/:id/accept` | Volunteer accepts SOS |
| PUT | `/api/sos/:id/complete` | Mark rescue complete |
| PUT | `/api/sos/:id/cancel` | Cancel SOS |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/messages/:sosId` | Get chat messages |
| POST | `/api/messages` | Send message |

### Volunteers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/volunteers/nearby` | Get nearby volunteers |
| PUT | `/api/volunteers/location` | Update location |
| PUT | `/api/volunteers/availability` | Toggle availability |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `new_sos_request` | Server → Volunteer | New SOS nearby |
| `sos_accepted` | Server → Victim | Volunteer accepted |
| `sos_completed` | Server → Victim | Rescue completed |
| `sos_cancelled` | Server → Volunteer | Victim cancelled |
| `new_message` | Server → Both | New chat message |
| `victim_location_update` | Server → Volunteer | Victim moved |
| `volunteer_location_update` | Server → Victim | Volunteer moved |
| `update_location` | Client → Server | Send location |
| `join_sos_room` | Client → Server | Join SOS chat room |

---

## 👨‍💻 Developer

**Rishi S**
Final Year AI & ML Student — GMIT, Davangere (VTU)

---

## 📄 License

MIT License — feel free to use for educational purposes.
