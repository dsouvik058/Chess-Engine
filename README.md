# ♟️ Grandmaster's Forge — Modern Stockfish 18 Chess Engine & Multiplayer Platform

A full-stack, enterprise-grade chess platform featuring native **Stockfish 18 AI Engine** integration, **Interactive AI Coaching** (OpenRouter LLMs & Web Speech TTS), **Real-Time Ranked Matchmaking** (with 20s Stockfish bot fallback), **Private 1v1 Room Battles**, and **Deep Game Analysis** with mathematical CAPS accuracy scoring.

---

## 🚀 Key Features

- **🤖 Stockfish 18 AI Engine (Play Bubble Bot)**:
  - Granular ELO rating calibration ($800 - 3200\text{ ELO}$).
  - Live animated evaluation bar ($cp$ & mate in $N$).
  - Real-time engine telemetry (Depth, Nodes, NPS, Calculation Time, Principal Variation).
  - Takeback (Undo 2 plies), Board Flipping, Legal Move Hints, and grandmaster Opening Book acceleration.
- **🌐 Real-Time Multiplayer (Ranked Matchmaking & Private Rooms)**:
  - **Ranked Matchmaking**: Pairs players by ELO and time controls with an automatic 20-second Stockfish bot fallback.
  - **Private 1v1 Room Codes**: 6-character room key generation (`?room=CODE`) with direct link sharing.
  - **STOMP / SockJS WebSockets**: Sub-millisecond move synchronization and live in-game match chat.
  - **Local Pass & Play**: Zero-network 2-player match on the same device.
- **📊 Deep Game Analysis & Move Classification**:
  - 10-tier move classification: **Brilliant**, **Great**, **Best**, **Excellent**, **Good**, **Book**, **Inaccuracy**, **Mistake**, **Blunder**, **Miss**.
  - CAPS player accuracy score ($0.0\% - 100.0\%$) based on average win-percentage drop per move.
  - Dynamic tactical colored arrows (Best Move vs Played Move).
  - PGN export & import with timeline step navigation and variable-speed autoplay.
- **🎙️ Interactive AI Chess Coach**:
  - Persona commentary: **Grandmaster**, **Enthusiastic**, **Tactical**.
  - Browser Web Speech API text-to-speech voice narration.
- **⏱️ Precision Dual Chess Clocks**:
  - Bullet ($1\text{m}$, $2\text{m}$), Blitz ($3\text{m}$, $5\text{m}$), Rapid ($10\text{m}$, $15\text{m}$, $30\text{m}$), Classical ($60\text{m}$, $90\text{m}$), and custom increment ($+0\text{s} - 60\text{s}$).

---

## 📁 Repository Structure

```
Chess Engine/
├── docs/                                  # Comprehensive Technical Documentation
│   ├── tech_stack_and_tools_documentation.md      # Complete Languages, Frameworks & Tools
│   ├── frontend_architecture_documentation.md     # React 19, Components, State & Testing
│   ├── backend_architecture_documentation.md      # Spring Boot 3, REST, UCI & Persistence
│   ├── play_bubble_bot_documentation.md           # Stockfish AI Engine Gameplay & Workflow
│   ├── play_multiplayer_online_documentation.md   # Ranked Matchmaking & STOMP Protocol
│   ├── play_1v1_local_and_online_documentation.md # Local Pass & Play & Private Room Battles
│   └── analyze_game_documentation.md              # Move Classification, CAPS & AI Coach
├── bin/                                   # Engine Binaries
│   └── stockfish.exe                      # Native Stockfish 18 executable
├── frontend/                              # React 19 + TypeScript + Vite SPA
│   └── src/
│       ├── components/
│       │   ├── analysis/                  # Game review & AI Coach panels
│       │   ├── auth/                      # Login, Registration, Google OAuth, Skill picker
│       │   ├── chat/                      # Scoped auto-scroll match chat panel
│       │   ├── chess/                     # Board container, controls, player cards
│       │   ├── layout/                    # Navbar, footer, welcome page hub
│       │   ├── modals/                    # Pre-game, promotion, online match modals
│       │   └── ui/                        # Reusable design system primitives
│       ├── hooks/                         # useChessClock & custom hooks
│       ├── services/                      # REST & STOMP WebSocket API clients
│       ├── types/                         # TypeScript interfaces (chess, multiplayer, auth)
│       └── utils/                         # Web Audio SFX, opening book, TTS synthesizer
├── src/                                   # Spring Boot 3 Backend Application
│   └── main/
│       ├── java/com/chessengine/
│       │   ├── config/                    # WebSocket & engine configuration
│       │   ├── controller/                # REST endpoints (AI Coach, Auth, Chess)
│       │   ├── dto/                       # Data Transfer Objects
│       │   ├── engine/                    # Stockfish UCI handler & process manager
│       │   ├── exception/                 # Global @RestControllerAdvice exception handler
│       │   ├── model/                     # JPA entity models (UserEntity, UserSessionEntity)
│       │   ├── multiplayer/               # WebSocket STOMP controllers & matchmaking
│       │   ├── repository/                # Spring Data JPA repositories
│       │   ├── service/                   # Business logic implementations
│       │   └── util/                      # Opening book & helper utilities
│       └── resources/
│           ├── application.properties     # App configuration (PostgreSQL, OpenRouter, Ports)
│           └── static/                    # Built production frontend static bundle
├── Dockerfile                             # 3-Stage Container Build (Node -> Maven -> JRE)
├── pom.xml                                # Maven dependencies & compilation setup
└── render.yaml                            # Cloud deployment Infrastructure as Code (IaC)
```

---

## 🛠️ Full-Stack Technology Matrix

| Layer | Primary Technologies | Key Libraries / Components |
|---|---|---|
| **Frontend** | **React 19**, **TypeScript 5.7+**, **Vite 8** | `react-chessboard`, `chess.js`, `framer-motion`, `tailwindcss`, `lucide-react`, `canvas-confetti` |
| **Backend** | **Java 17 / 21 / 26**, **Spring Boot 3.2.5** | Spring Web, Spring WebSocket, Spring Data JPA, Spring Security Crypto, Lombok |
| **Chess Engine** | **Stockfish 18 (Official Native Binary)** | UCI Protocol, MultiPV Search, Dynamic ELO Strength Limiting |
| **Cloud AI** | **OpenRouter API** (`qwen/qwen-2.5-7b-instruct`) | Multi-persona AI Chess Coach, tactical commentary, speech scripts |
| **Messaging** | **STOMP over WebSockets** | `@stomp/stompjs`, `sockjs-client`, Spring `SimpleBroker` (`/topic`) |
| **Database** | **PostgreSQL 15 / 16** (Managed via Spring Data JPA) | `UserEntity`, `UserSessionEntity`, BCrypt Password Hashing |
| **In-Memory Store** | **`ConcurrentHashMap`** | High-throughput active room registry (`GameRoom`) and matchmaking queue |
| **Testing** | **Vitest 4.1**, **React Testing Library**, **jsdom** | Automated unit tests (`npm test`), DOM interaction verification |
| **DevOps** | **Docker Multi-Stage**, **Render.com** | Automated CI/CD container builds and managed cloud deployment |

---

## 🏁 Quickstart & Execution Guide

### Prerequisites
- **Java Development Kit (JDK 17+)** (JDK 21+ recommended)
- **Node.js 18+** & **npm**
- **Apache Maven 3.9+** (or bundled maven wrapper)
- **PostgreSQL Database** running locally on port `5432` (or configured remote URL)

### 1. Run the Spring Boot Backend
```bash
mvn spring-boot:run
```
*The backend REST and WebSocket server will start on `http://localhost:8080`.*

### 2. Run the React Frontend (Development)
```bash
cd frontend
npm install
npm run dev
```
*The Vite development server with Hot Module Replacement (HMR) will start on `http://localhost:5173`.*

### 3. Run Automated Tests
```bash
# Frontend Unit & UI Tests
cd frontend
npm test

# Backend Tests
mvn test
```

### 4. Build Full-Stack Production Bundle
```bash
cd frontend
npm run build
cd ..
mvn clean package -DskipTests
```
*Compiles the frontend directly into `src/main/resources/static/` and packages a standalone executable JAR in `target/chess-engine-0.0.1-SNAPSHOT.jar`.*

---

## 📖 Comprehensive Documentation Index

All architectural guides, sequence diagrams, and mathematical specifications are located in the [docs/](docs/) directory:

| Document | Description |
|---|---|
| 🛠️ [**Complete Tech Stack & Tools**](docs/tech_stack_and_tools_documentation.md) | Exhaustive directory of all languages, frameworks, protocols, databases, AI models, and tools. |
| 🎨 [**Frontend Architecture & Specs**](docs/frontend_architecture_documentation.md) | Component tree, state machines, hooks, WebSockets, Web Audio SFX, and testing suite. |
| 🏗️ [**Backend Architecture & Specs**](docs/backend_architecture_documentation.md) | Spring Boot architecture, REST APIs, STOMP brokers, native Stockfish process supervision, and JPA entities. |
| 🤖 [**Play Bubble Bot Documentation**](docs/play_bubble_bot_documentation.md) | VS Stockfish AI workflow, ELO scaling ($800 - 3200$), evaluation bar, and engine telemetry. |
| 🌐 [**Play Multiplayer Online Documentation**](docs/play_multiplayer_online_documentation.md) | Ranked matchmaking queue, 20s bot fallback, STOMP move/chat relay, and session disconnect handlers. |
| ⚔️ [**Play 1 vs 1 (Local & Online) Documentation**](docs/play_1v1_local_and_online_documentation.md) | Local Pass & Play on the same screen and private 6-character room code battles. |
| 📊 [**Game Analysis & AI Coach Documentation**](docs/analyze_game_documentation.md) | 10-tier move classification, CAPS accuracy formula, MultiPV=2 search caching, and Web Speech TTS. |
