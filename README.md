# 🚨 GeoSOS — AI-Driven Emergency Response Platform

> **GeoSOS: AI-Driven Emergency Response Using KNN and Geospatial Intelligence**  
> An advanced real-time emergency response platform connecting victims with nearby capable volunteers using 2D Sphere geospatial indexing, multi-criteria k-NN responder ranking, Google Gemini AI triage, and real-time Socket.io communication.

---

## 🌐 Research Paper & Live Demo

- **Project Title**: GeoSOS: AI-Driven Emergency Response Using KNN and Geospatial Intelligence
- **Authors**: Mrs. Akshatha A M S, Mr. Vishal V Pawar, Mr. Rishi S, Mr. Sanketh Gowda D G, Mr. Prajwal B M (Department of AIML, GMIT Davangere)
- **Live Demo Video**: [Watch Demo on YouTube](https://youtu.be/-xW9SEcwGR4) *(Recommend 2x speed)*

---

### 📊 Benchmark Performance & Research Highlights

Under a controlled multi-seed simulation ($N=1,000$ paired emergency trials across seeds 42, 101, 2024):
- **First-Attempt Responder Acceptance**: Improved from **$46.43\%$** (Naive nearest-only) to **$64.60\%$** (GeoSOS Multi-Criteria k-NN), an absolute gain of **$+18.17\%$** ($\chi^2 = 69.94, p < 0.001$, paired McNemar test).
- **Multi-Attribute Objective Function**:
  $$\text{Score}(v) = 0.7 \cdot \hat{D}_{\text{spatial}}(v) + 0.3 \cdot \hat{R}_{\text{experience}}(v) - 0.1 \cdot \hat{S}_{\text{skill}}(v)$$
- **Trade-off Analysis**: Prioritizing experienced, skill-matched responders selects candidates roughly $280\text{ meters}$ farther away on average, trading a minor travel latency shift ($3.24\text{m} \to 3.50\text{m}$) for substantially higher dispatch reliability.

---

## ✨ Features & Architecture

### 🚑 Emergency Dispatch & Matching
- **Two-Stage KNN Responder Selection**:
  1. *Stage 1 (Geospatial Candidate Retrieval)*: MongoDB `2dsphere` geohash indexing fetches candidate pool $C$ within search radius $R$ ($0.5\text{km} \to 1\text{km} \to 5\text{km} \to 10\text{km}$).
  2. *Stage 2 (Multi-Criteria Ranking)*: Evaluates candidates across normalized distance, inverse-experience penalty, and skill match to rank Top-$K$ ($K=5$) responders.
- **Distress Support for All Users**: Both Victims and Volunteers can trigger emergency SOS calls.

### 🤖 AI Triage & Real-Time Communication
- **Google Gemini 2.5 AI Assistant**: Real-time severity assessment, immediate first-aid instructions, and safety precautions.
- **Multi-Language AI Support**: Emergency guidance rendered in English, Hindi, and Kannada.
- **Real-time WebSockets**: Socket.io room isolation (`user_${id}`, `sos_${id}`) for live GPS tracking and bidirectional chat.
- **Voice Emergency Input**: Speech Recognition API for hands-free emergency reporting.

### ⚡ Load Balancing & High-Availability
- **Multi-Core Process Cluster (`backend/cluster.js`)**: Spawns parallel worker processes across all CPU cores (`os.cpus().length`) with automatic worker crash recovery.
- **Port Sharing & Round-Robin Load Distribution**: Run using `npm run cluster`.

### 🛡️ Security & Privacy
- **JWT Authentication**: Stateless token auth for REST APIs & Socket handshakes.
- **DoS & Brute-Force Rate Limiting**: Dedicated rate limiters for auth, SOS creation, and general endpoints.
- **Helmet.js Security Headers**: XSS, HSTS, Clickjacking, and MIME-sniffing protection.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Leaflet Maps, vite-plugin-pwa |
| **Backend** | Node.js, Express.js, Express Cluster Load Balancer, express-rate-limit |
| **Database** | MongoDB Atlas (`2dsphere` Geospatial Indexing) |
| **Real-time** | Socket.io (WebSocket Room Isolation) |
| **AI Triage** | Google Gemini 2.5 Flash API |
| **Auth** | JWT + Phone OTP Verification |

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev      # Single worker development mode
# OR
npm run cluster  # Multi-Core Load-Balanced Cluster Mode
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```text
sos-platform/
├── backend/
│   ├── cluster.js           # Multi-core load balancer & worker crash manager
│   ├── server.js            # Express API server & Socket.io setup
│   ├── models/              # User, SOSRequest, Message schemas
│   ├── routes/              # Auth, SOS, Volunteers, Messages API endpoints
│   ├── middleware/          # JWT auth & RBAC permissions
│   └── socket/              # WebSocket event handlers
└── frontend/
    └── src/
        ├── pages/           # Home, Victim, Volunteer views
        ├── components/      # SOSMap, AIAssistant, ChatBox
        ├── context/         # AuthContext state manager
        └── services/        # Axios API client
```

---

## 👨‍💻 Developer & Authors

- **Rishi S** — Final Year AIML Student, GMIT Davangere (VTU)
- **Co-Authors**: Mrs. Akshatha A M S, Mr. Vishal V Pawar, Mr. Sanketh Gowda D G, Mr. Prajwal B M

---

## 📄 License

MIT License — Feel free to use for educational and research purposes.
