# 🛠️ Complete Tech Stack, Languages & Tools Documentation

This document provides a complete and exhaustive directory of **all programming languages, frameworks, runtime environments, libraries, protocols, databases, AI cloud services, and build tools** utilized across the entire Chess Engine platform.

---

## 1. Summary Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       FULL-STACK TECHNOLOGY MATRIX                                     │
├───────────────────┬───────────────────────────────────┬────────────────────────────────────────────────┤
│ Category          │ Technology / Tool                 │ Version / Details                              │
├───────────────────┼───────────────────────────────────┼────────────────────────────────────────────────┤
│ Backend Language  │ Java (OpenJDK)                    │ Java 17 (LTS), Java 21/26 compatible           │
│ Frontend Language │ TypeScript / JavaScript (ESM)     │ TypeScript 5.7+ / Node.js 20+                  │
│ Backend Framework │ Spring Boot 3                     │ 3.2.5 (Spring Web, Spring WebSocket, JPA)     │
│ Frontend Framework│ React 19                          │ 19.2.7 (Hooks, Concurrent Mode, Virtual DOM)   │
│ Chess Engine      │ Stockfish 18 (Native UCI Binary)  │ Official Release (SSE41 / POPCNT, Linux/Win)   │
│ Cloud AI Provider │ OpenRouter Cloud API              │ `qwen/qwen-2.5-7b-instruct` / Llama 3.3        │
│ Real-Time Protocol│ STOMP over WebSockets             │ Spring SimpleBroker + SockJS Fallback          │
│ Database          │ PostgreSQL                        │ 15 / 16 (Managed via Spring Data JPA)          │
│ In-Memory State   │ ConcurrentHashMap (Thread-safe)   │ Multiplayer rooms & Matchmaking active queue   │
│ Styling & Motion  │ Tailwind CSS 4 & Framer Motion    │ Tailwind v4.3.3 + Framer Motion v13.1          │
│ Build Tool (Java) │ Apache Maven                      │ 3.9+ (`pom.xml`)                               │
│ Build Tool (JS/TS)│ Vite 8 & TypeScript Compiler      │ Vite v8.1.1 + `tsc -b`                         │
│ Unit Testing      │ Vitest & React Testing Library    │ Vitest v4.1.10 + jsdom v30.0                   │
│ Containerization  │ Docker (Multi-stage)              │ Node 20-alpine -> Maven -> Temurin 17 JRE      │
│ Cloud Deployment  │ Render.com Web Services           │ Docker Web Service + Managed PostgreSQL (IaC)  │
└───────────────────┴───────────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 2. Programming, Markup & Query Languages

| Language | Scope / Layer | Role & Usage in Project |
|---|:---:|---|
| **Java** | Backend | Core enterprise server logic, multithreading, sub-process execution, WebSocket broker, JPA persistence, and REST APIs. |
| **TypeScript** | Frontend | Strict type-safety, interface modeling (`chess.ts`, `multiplayer.ts`, `auth.ts`), reactive components, and hooks. |
| **JavaScript (ESM)** | Tooling / Web | Node.js scripting, configuration files (`vite.config.ts`, `vitest.config.ts`), and browser execution. |
| **HTML5** | Frontend Shell | Semantic application shell (`index.html`), SVG vector graphics, and HTML5 Canvas particle rendering. |
| **CSS3 / PostCSS** | Frontend Styling | Modern styling, glassmorphism backdrop filters, custom scrollbars, and keyframe animations. |
| **SQL** | Persistence | Relational DDL/DML, table schema migrations (`UserEntity`, `UserSessionEntity`), and foreign key indexing. |
| **YAML** | DevOps / Cloud | Infrastructure as Code (IaC) configuration for automated deployment (`render.yaml`). |
| **XML** | Build Pipeline | Maven Project Object Model definition (`pom.xml`) configuring dependencies, compiler plugins, and packaging. |
| **JSON** | Configuration & DTOs | Package definitions (`package.json`), TypeScript compiler configs (`tsconfig.json`), linter rules, and REST API wire payloads. |
| **Markdown / GFM** | Documentation | Architectural guides, sequence diagrams, and mathematical formulation documentation. |
| **Bash / PowerShell** | DevOps / Local CLI | Docker entrypoint commands, build automation, and cross-platform terminal management. |

---

## 3. Backend Technologies & Libraries (`pom.xml`)

### 3.1 Core Frameworks & Starters
- **Spring Boot 3.2.5**: The core enterprise application framework providing dependency injection, auto-configuration, and application lifecycle management.
- **Spring Boot Starter Web (`spring-boot-starter-web`)**: Provides the embedded Tomcat 10 HTTP server, Jackson JSON serializers, and Spring MVC REST controller routing.
- **Spring Boot Starter WebSocket (`spring-boot-starter-websocket`)**: Implements full-duplex WebSocket connections using STOMP protocols and SockJS fallback transports.
- **Spring Boot Starter Data JPA (`spring-boot-starter-data-jpa`)**: Integrates Hibernate 6 ORM, `EntityManager`, and Spring Data repository abstractions.
- **Spring Security Crypto (`spring-security-crypto`)**: Provides cryptographic password hashing algorithms (`BCryptPasswordEncoder`) for user credentials.
- **PostgreSQL JDBC Driver (`org.postgresql:postgresql`)**: Production database connector enabling high-throughput relational persistence.
- **Project Lombok (`org.projectlombok:lombok v1.18.46`)**: Compile-time annotation processor eliminating boilerplate code (`@Getter`, `@Setter`, `@Builder`, `@Slf4j`, `@RequiredArgsConstructor`).
- **Spring Boot Starter Test (`spring-boot-starter-test`)**: Testing suite bundling JUnit 5, Mockito, AssertJ, and Spring Boot Test context loaders.

---

## 4. Native Chess Engine & Cloud AI Services

### 4.1 Stockfish 18 UCI Engine
- **Engine Binary**: Official native Stockfish 18 executable compiled with 64-bit SSE41 and POPCNT instruction sets (`bin/stockfish.exe` on Windows, `/usr/games/stockfish` on Linux).
- **Communication Protocol**: **Universal Chess Interface (UCI)** over standard I/O (stdin/stdout).
- **Engine Features Used**:
  - `UCI_LimitStrength` & `UCI_Elo`: Granular handicap adjustments from 800 to 3200 ELO.
  - `MultiPV`: Multi-principal-variation calculation for evaluating alternative candidate moves during game analysis.
  - `go movetime <ms>` / `go depth <depth>`: Time and depth-bounded tree search.

### 4.2 OpenRouter Cloud AI API
- **Provider**: OpenRouter API gateway for cloud Large Language Models.
- **Active Model**: `qwen/qwen-2.5-7b-instruct` (supports `meta-llama/llama-3.3-70b-instruct` and GPT-4o).
- **Role**: Powers the interactive AI Chess Coach, analyzing tactical moves and blunders to generate natural language explanations across multiple coaching personas (**Grandmaster**, **Enthusiastic**, **Tactical**).

### 4.3 Google Identity & OAuth 2.0
- **Google OAuth 2.0 API**: Secure federated Single Sign-On (SSO) authentication for one-click account creation and Google login.

---

## 5. Frontend Technologies & Dependencies (`package.json`)

### 5.1 Core UI Framework & Chess Libraries
- **React 19 (`react` & `react-dom` v19.2.7)**: Modern declarative component framework leveraging React 19 Concurrent Mode, state hooks (`useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`), and Virtual DOM.
- **react-chessboard (v5.10.0)**: Production-grade interactive React chessboard component supporting smooth piece dragging, custom SVG pieces, square styling, and arrow overlays.
- **chess.js (v1.4.0)**: Pure TypeScript/JavaScript chess rules validation engine handling move legality, FEN serialization, PGN parsing, check/checkmate detection, and 50-move draw rules.

### 5.2 Styling, Design System & Animations
- **Tailwind CSS (v4.3.3) & `@tailwindcss/vite`**: Utility-first CSS engine delivering a responsive design system with custom palette tokens (`amber`, `indigo`, `rose`, `slate`, `stone`).
- **Framer Motion (v13.1.0)**: Production animation library driving modal spring transitions, 3D card hover shimmers, and floating ambient background chess pieces.
- **Lucide React (v1.27.0)**: Scalable vector icon system for chess controls, navigation buttons, and status indicators.
- **canvas-confetti (v1.9.4)**: HTML5 Canvas particle physics engine firing victory celebrations upon checkmate or match win.
- **clsx (v2.1.1) & tailwind-merge (v3.6.0)**: Utilities for conditionally concatenating and resolving conflicting Tailwind CSS classes without stylesheet bloat.

### 5.3 Real-Time WebSockets & Audio APIs
- **@stomp/stompjs (v7.3.0)**: Modern TypeScript STOMP client over WebSockets for topic subscriptions and message publishing.
- **sockjs-client (v1.6.1)**: Cross-browser WebSocket emulation fallback for networks blocking standard WS handshakes.
- **Browser Web Audio API**: Native procedural synthesizer creating realistic move, capture, check, castle, and game-over acoustic feedback.
- **Browser Web Speech API (`SpeechSynthesis`)**: Native text-to-speech audio synthesizer converting AI coach commentary into spoken voice narration.

---

## 6. Build, Tooling & Quality Assurance

| Tool | Purpose | Configuration File |
|---|---|---|
| **Vite 8.1+** | Frontend Bundler, HMR Dev Server & Production Minifier | `frontend/vite.config.ts` |
| **TypeScript (`tsc`)** | Type checker & ECMAScript compiler | `frontend/tsconfig.app.json` |
| **Apache Maven 3.9+** | Java dependency resolution, build lifecycle & packaging | `pom.xml` |
| **Vitest 4.1+** | Vite-native unit test runner | `frontend/vitest.config.ts` |
| **React Testing Library** | Component DOM testing & user interaction simulation | `frontend/src/__tests__/setup.ts` |
| **jsdom 30.0+** | Headless browser DOM simulation environment for automated tests | `vitest.config.ts` |
| **Oxlint 1.71+** | High-speed Rust-based linter for TypeScript & JSX | `frontend/.oxlintrc.json` |
| **Maven Compiler Plugin** | Java source compiler configured with Lombok annotation processors | `pom.xml` |
| **Spring Boot Maven Plugin**| Packages fat executable standalone JAR (`app.jar`) | `pom.xml` |

---

## 7. Databases & State Management

- **PostgreSQL 15 / 16**: Production relational database storing registered users (`UserEntity`), encrypted passwords, Google OAuth IDs, and active session tokens (`UserSessionEntity`).
- **ConcurrentHashMap (Java In-Memory Store)**: Thread-safe high-throughput in-memory state store for active multiplayer room codes (`GameRoom`) and ranked matchmaking queue tickets.

---

## 8. DevOps, Containerization & Cloud Deployment

- **Multi-Stage Dockerfile**: 3-stage container architecture:
  1. *Stage 1 (Node 20 Alpine)*: Compiles TypeScript and builds Vite production assets.
  2. *Stage 2 (Maven 3.9 + Temurin JDK 17)*: Packages Spring Boot JAR including bundled static frontend assets.
  3. *Stage 3 (Temurin JRE 17 Jammy)*: Minimal production image with Stockfish 18 installed via `apt-get`.
- **Render.com (`render.yaml`)**: Infrastructure as Code (IaC) configuration provisioning a Docker Web Service and managed PostgreSQL instance.
- **Git**: Version control tracking branches, refactoring history, and submodule paths.
