# ♟️ Grandmaster's Forge — Modern Stockfish 18 Chess Engine & Multiplayer Platform

A full-stack chess platform featuring Stockfish 18 AI engine integration, interactive AI coaching, live real-time WebSocket multiplayer matchmaking, private 1v1 room battles, and deep game analysis.

---

## 🚀 Key Features

- **🤖 Stockfish 18 AI Engine:** Configurable ELO rating (800 – 3200 ELO), real-time evaluation bar, best move calculation, depth & node stats.
- **🎙️ AI Chess Coach:** Multi-persona interactive commentary (Grandmaster, Casual, Sarcastic, Encouraging) with real-time text-to-speech voice synthesis.
- **🌐 Real-Time Multiplayer:**
  - Ranked global matchmaking with automatic 20-second Stockfish bot fallback.
  - Private 1v1 room code creation & joining.
  - STOMP/WebSocket live move synchronization and in-game match chat.
- **📊 Deep Game Analysis:** Automatic move classification (Brilliant, Great, Best, Excellent, Good, Inaccuracy, Mistake, Blunder, Miss), win rate charts, and PGN export/import.
- **⏱️ Dual Chess Clock:** Configurable time controls (Bullet, Blitz, Rapid, Classical, Custom Increment).
- **🎨 Premium UI/UX:** Built with React 19, Tailwind CSS, Lucide icons, Framer Motion animations, piece themes, and responsive layout.

---

## 📁 Project Architecture

```
Chess Engine/
├── docs/                                  # Architectural & testing documentation
│   ├── analyze_game_documentation.md
│   ├── chess_analysis_and_classification_guide.md
│   ├── ui_animation_upgrade_guide.md
│   ├── ui_bugs_report.md
│   └── ui_testing_guide.md
├── bin/                                   # Engine binaries
│   └── stockfish.exe                      # Stockfish 18 executable
├── frontend/                              # Vite + React 19 Frontend
│   └── src/
│       ├── components/
│       │   ├── analysis/                  # Game review & AI Coach panels
│       │   ├── auth/                      # Login, registration, OAuth, skill picker
│       │   ├── chat/                      # Match live chat panel
│       │   ├── chess/                     # Board container, controls, player cards
│       │   ├── layout/                    # Navbar, footer, welcome page
│       │   ├── modals/                    # Pre-game, promotion, online match modals
│       │   └── ui/                        # Reusable button, card, badge, modal primitives
│       ├── hooks/                         # Clock & custom hooks
│       ├── services/                      # REST & WebSocket API clients
│       ├── types/                         # TypeScript interfaces (chess, multiplayer, auth)
│       └── utils/                         # Sound FX, opening book, TTS synthesizer
└── src/                                   # Spring Boot 3 Backend
    └── main/
        ├── java/com/chessengine/
        │   ├── config/                    # WebSocket & engine configuration
        │   ├── controller/                # REST endpoints (AI Coach, Auth, Chess)
        │   ├── dto/                       # Data Transfer Objects
        │   ├── engine/                    # Stockfish UCI protocol handler & process manager
        │   ├── exception/                 # Global error handling
        │   ├── model/                     # JPA entities & domain models
        │   ├── multiplayer/               # WebSocket STOMP controllers & matchmaking
        │   ├── repository/                # Spring Data repositories
        │   ├── service/                   # Business logic implementations
        │   └── util/                      # Opening book & helpers
        └── resources/
            ├── application.properties     # App configuration
            └── static/                    # Built production frontend bundle
```

---

## 🛠️ Tech Stack

### Backend
- **Java 21 / 26** & **Spring Boot 3**
- **Spring WebSocket & STOMP** for real-time messaging
- **Spring Data JPA & H2 Database** (file/in-memory)
- **Stockfish 18 UCI Engine** via native process streaming
- **OpenRouter AI API** for dynamic coach commentary

### Frontend
- **React 19** with **TypeScript** & **Vite**
- **react-chessboard** & **chess.js** for chess rules and board rendering
- **Tailwind CSS** & **Framer Motion** for animations and styling
- **@stomp/stompjs** & **sockjs-client** for WebSockets
- **Canvas-Confetti** & **Lucide React** for interactive visual feedback
- **Vitest & React Testing Library** for automated unit and DOM testing

---

## 🏁 Getting Started

### Prerequisites
- **JDK 17+** (JDK 21+ recommended)
- **Node.js 18+** & **npm**
- **Maven 3.9+** (or bundled maven wrapper)

### 1. Running the Backend
```bash
mvn spring-boot:run
```
The Spring Boot server will start on `http://localhost:8080`.

### 2. Running the Frontend (Development)
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server will start on `http://localhost:5173`.

### 3. Building Frontend for Production
```bash
cd frontend
npm run build
```
Builds the static bundle directly into `src/main/resources/static/`, enabling Spring Boot to serve the entire app as a unified standalone JAR.

### 4. Running Automated Tests
```bash
# Frontend Unit & UI Tests
cd frontend
npm test

# Backend Tests
mvn test
```

---

## 📖 Documentation
Detailed technical documentation and guides are available in the [docs/](docs/) directory:
- [Game Analysis Documentation](docs/analyze_game_documentation.md)
- [Move Classification & Engine Guide](docs/chess_analysis_and_classification_guide.md)
- [UI Animation Upgrade Guide](docs/ui_animation_upgrade_guide.md)
- [UI Testing Guide](docs/ui_testing_guide.md)
- [UI Bugs Audit & Fix Report](docs/ui_bugs_report.md)
