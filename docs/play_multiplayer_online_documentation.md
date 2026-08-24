# 🌐 Play Multiplayer Online — Complete Technical Architecture & Workflow Documentation

This document provides a comprehensive end-to-end technical guide for the **Play Multiplayer Online** and **Private 1v1 Room Battles** features across both the **Frontend (React 19 / TypeScript / STOMP WebSocket)** and the **Backend (Java / Spring Boot 3 / Spring WebSocket / Concurrent In-Memory Store)**.

---

## 1. Overview & Architecture

The **Play Multiplayer Online** system provides two real-time multiplayer modalities:
1. **Global Ranked Matchmaking**: Matches players with similar ELO ratings and time controls with an **automatic 20-second Stockfish Bot fallback** if no human opponent is found in time.
2. **Private 1v1 Custom Rooms**: Instant 6-character room code generation, direct URL sharing, side preference negotiation, and direct battle matching.

### High-Level Architectural Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React 19)                           │
│                                                                            │
│  ┌──────────────────────────────┐        ┌──────────────────────────────┐  │
│  │ PlayMultiplayerOnlineModal   │        │ PreGame1v1Modal              │  │
│  │ (Matchmaking & 20s Fallback) │        │ (Private 1v1 Room Codes)     │  │
│  └──────────────┬───────────────┘        └──────────────┬───────────────┘  │
│                 │                                       │                  │
│                 └───────────────────┬───────────────────┘                  │
│                                     ▼                                      │
│                         ┌───────────────────────┐                          │
│                         │   App.tsx Game Loop   │                          │
│                         │  (ONLINE_1V1 Mode)    │                          │
│                         └───────────┬───────────┘                          │
│                                     │                                      │
│                 ┌───────────────────┴───────────────────┐                  │
│                 ▼                                       ▼                  │
│     ┌───────────────────────┐               ┌───────────────────────┐      │
│     │ WebSocketService.ts   │               │ ChatPanel.tsx         │      │
│     │ (STOMP / SockJS)      │               │ (Live Match Chat)     │      │
│     └───────────┬───────────┘               └───────────┬───────────┘      │
└─────────────────┼───────────────────────────────────────┼──────────────────┘
                  │                                       │
                  │ WebSocket (STOMP over SockJS)         │ HTTP REST
                  │ Endpoint: `/ws-chess`                 │ Prefix: `/api/multiplayer/`
                  ▼                                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Spring Boot 3)                           │
│                                                                            │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │ MultiplayerController.java                                         │   │
│   │ - REST API: `/api/multiplayer/matchmaking/*`, `/room/*`            │   │
│   │ - STOMP: `@MessageMapping("/room/{roomId}/*")`                     │   │
│   └─────────────────┬──────────────────────────────────┬───────────────┘   │
│                     │                                  │                   │
│                     ▼                                  ▼                   │
│   ┌─────────────────────────────────┐  ┌───────────────────────────────┐   │
│   │ MatchmakingServiceImpl.java     │  │ MultiplayerServiceImpl.java   │   │
│   │ - ELO Proximity Queue           │  │ - Concurrent Room Store       │   │
│   │ - Dual STOMP Notifications      │  │ - Move & Clock Sync           │   │
│   └─────────────────────────────────┘  └───────────────┬───────────────┘   │
│                                                        │                   │
│                                                        ▼                   │
│                                        ┌───────────────────────────────┐   │
│                                        │ WebSocketEventListener.java   │   │
│                                        │ (Session Disconnect & Forfeit)│   │
│                                        └───────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-End Workflow Diagrams

### 2.1 Global Matchmaking with 20s Bot Fallback

```mermaid
sequenceDiagram
    autonumber
    actor P1 as Player 1 (Browser)
    participant Modal as PlayMultiplayerOnlineModal
    participant API as api.ts (HTTP Client)
    participant WS as WebSocketService (STOMP)
    participant MC as MultiplayerController
    participant MS as MatchmakingServiceImpl
    actor P2 as Player 2 / Queued Opponent

    Note over P1, Modal: 1. Join Matchmaking Queue
    P1->>Modal: Select "Play Multiplayer Online" (e.g. 10m Rapid, 1500 ELO)
    Modal->>WS: Connect WebSocket & Subscribe `/topic/matchmaking/{p1Id}`
    Modal->>API: POST /api/multiplayer/matchmaking/join
    API->>MC: HTTP POST /api/multiplayer/matchmaking/join
    MC->>MS: joinMatchmaking(request)

    alt Opponent Found in Queue (within 20s)
        MS->>MS: Match P1 & P2 by ELO & Time Control
        MS->>MS: Create GameRoom in ConcurrentHashMap
        MS-->>WS: Broadcast /topic/matchmaking/{p1Id} (MATCHED)
        MS-->>WS: Broadcast /topic/matchmaking/{p2Id} (MATCHED)
        WS-->>Modal: Receive "MATCHED" payload (Room ID, Opponent, Assigned Color)
        Modal->>P1: Display "Opponent Found!" checkmark
        Modal->>P1: Transition to ONLINE_1V1 Game View
    else No Opponent within 20s (Timeout)
        Note over Modal: 20s Countdown Reaches 0
        Modal->>API: POST /api/multiplayer/matchmaking/cancel
        Modal->>P1: Prompt / Trigger Auto-Fallback to Bubble Bot (Stockfish 18)
        Modal->>P1: Start Bot match with matching 1500 ELO & 10m Rapid clock
    end
```

---

### 2.2 Private 1v1 Room Code Battle

```mermaid
sequenceDiagram
    autonumber
    actor Host as Host Player
    participant Modal as PreGame1v1Modal
    participant API as api.ts
    participant MC as MultiplayerController
    participant RoomService as MultiplayerServiceImpl
    actor Guest as Guest Player

    Note over Host, RoomService: Room Creation
    Host->>Modal: Click "Create Room" (Time: 10m, Color: White)
    Modal->>API: POST /api/multiplayer/room/create
    API->>MC: createRoom(CreateRoomRequestDTO)
    MC->>RoomService: createRoom(...)
    RoomService->>RoomService: Generate 6-char room code (e.g., "K7X9Q2")
    RoomService-->>MC: RoomResponseDTO(roomId="K7X9Q2", color="white")
    MC-->>API: 200 OK (RoomResponseDTO)
    API-->>Modal: Display Room Code & Copy Shareable Link

    Note over Guest, RoomService: Guest Joining
    Guest->>Modal: Open link or Enter code "K7X9Q2" -> Click "Join Room"
    Modal->>API: POST /api/multiplayer/room/join
    API->>MC: joinRoom(JoinRoomRequestDTO)
    MC->>RoomService: joinRoom(...)
    RoomService->>RoomService: Assign opposite color (Black) & activate room
    RoomService-->>MC: RoomResponseDTO(room status="ACTIVE")
    MC-->>Host: STOMP Broadcast to `/topic/room/K7X9Q2` (Game Ready)
    MC-->>Guest: 200 OK (Game Ready)

    Note over Host, Guest: Match Begins in App.tsx
    Host->>Host: Load board as White
    Guest->>Guest: Load board as Black
```

---

### 2.3 Real-Time STOMP Move Synchronization & Match Chat

```mermaid
sequenceDiagram
    autonumber
    actor White as White Player
    participant UI_W as App.tsx (White)
    participant STOMP as Spring WebSocket Broker (`/topic/room/{roomId}`)
    participant MC as MultiplayerController
    participant UI_B as App.tsx (Black)
    actor Black as Black Player

    %% Move execution
    Note over White, Black: In-Game Turn Execution
    White->>UI_W: Makes move (e.g. e2 -> e4)
    UI_W->>UI_W: Validate move on local chess.js instance & play sound
    UI_W->>STOMP: Publish to `/app/room/{roomId}/move` (from="e2", to="e4", san="e4", timeRemaining=598)
    STOMP->>MC: handleMove(roomId, MultiplayerMoveDTO)
    MC->>STOMP: Broadcast to `/topic/room/{roomId}`
    STOMP->>UI_B: Receive move payload
    UI_B->>UI_B: Apply move "e4" to Black's chess.js instance & play piece sound
    UI_B->>UI_B: Switch active turn clock to Black

    %% In-game chat
    Note over White, Black: Live Match Chat
    Black->>UI_B: Types message "Good move!" in ChatPanel
    UI_B->>STOMP: Publish to `/app/room/{roomId}/chat` (senderId, text="Good move!", timestamp)
    STOMP->>MC: handleChat(roomId, ChatMessageDTO)
    MC->>STOMP: Broadcast to `/topic/room/{roomId}/chat`
    STOMP->>UI_W: Receive chat payload
    UI_W->>UI_W: Append message to ChatPanel with auto-scroll
```

---

## 3. Frontend Implementation (`frontend/src/`)

### 3.1 Global Matchmaking Modal (`components/modals/PlayMultiplayerOnlineModal.tsx`)
- **State Machine**:
  - `'idle'` $\rightarrow$ `'searching'` (starts 20s countdown and polls/subscribes) $\rightarrow$ `'matched'` (triggers countdown to game start) OR `'bot_fallback'` (seamlessly spawns Stockfish AI match).
- **Matchmaking Subscriptions**:
  - Subscribes to dynamic STOMP topic `/topic/matchmaking/{myPlayerId}`.
  - Automatically cancels waiting ticket on modal close or unmount.

### 3.2 Private 1v1 Room Modal (`components/modals/PreGame1v1Modal.tsx`)
- **Room Code Generator**: Creates short uppercase room keys for easy mobile sharing.
- **Copy to Clipboard**: One-click room link sharing with visual feedback.
- **Side Negotiation**: Allows Host to choose White, Black, or Random; Guest automatically receives the complement.

### 3.3 Live Match Chat (`components/chat/ChatPanel.tsx`)
- **Scoped Inner Container Auto-Scroll**:
  Uses `messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight` on the message container rather than `scrollIntoView()`, completely preventing window/document jumping and preserving board visibility.
- **Sanitization**: Disables send button on whitespace-only input with `maxLength={200}`.
- **Opponent Metadata**: Renders opponent name tags, timestamp chips, and distinct color-coded bubbles.

### 3.4 WebSocket Client Service (`services/websocket.ts`)
Manages STOMP connections using `@stomp/stompjs` and `sockjs-client`:
- **Auto-Reconnect**: Configured with `reconnectDelay: 5000` and heartbeats (`4000ms`).
- **Session Registration**: Sends `/app/room/{roomId}/register` on connection to pair the HTTP session ID with the player ID for disconnect tracking.
- **Subscriptions**:
  - `/topic/room/{roomId}`: Receives opponent moves, resignations, and takeback requests.
  - `/topic/room/{roomId}/chat`: Receives live chat messages.

---

## 4. Backend Implementation (`src/main/java/com/chessengine/multiplayer/`)

### 4.1 WebSocket & STOMP Configuration (`config/WebSocketConfig.java`)
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chess")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}
```

### 4.2 Multiplayer Controller (`multiplayer/controller/MultiplayerController.java`)
Exposes both HTTP REST endpoints and STOMP message endpoints:
- **REST Endpoints**:
  - `POST /api/multiplayer/matchmaking/join`: Enqueues player in matchmaking.
  - `POST /api/multiplayer/matchmaking/cancel`: Removes player from queue.
  - `GET /api/multiplayer/matchmaking/status/{playerId}`: Returns current ticket status (`QUEUED`, `MATCHED`, `NOT_FOUND`).
  - `POST /api/multiplayer/room/create`: Creates a new custom private room.
  - `POST /api/multiplayer/room/join`: Joins an existing room by code.
- **STOMP Message Handlers**:
  - `@MessageMapping("/room/{roomId}/move")`: Relays player moves to opponent.
  - `@MessageMapping("/room/{roomId}/chat")`: Relays chat messages to opponent.
  - `@MessageMapping("/room/{roomId}/resign")`: Broadcasts resignation event.
  - `@MessageMapping("/room/{roomId}/register")`: Registers active session in `WebSocketEventListener`.

### 4.3 Matchmaking Service (`multiplayer/service/impl/MatchmakingServiceImpl.java`)
- **Thread-Safe Concurrent Queue**: Uses `ConcurrentHashMap<String, QueueTicket>` for waiting players.
- **Proximity Matching Algorithm**:
  - Checks for exact or bucketed time control compatibility.
  - Finds the opponent in the queue with the minimal ELO difference ($|\text{ELO}_1 - \text{ELO}_2|$).
- **Dual WebSocket Notification**:
  When two players match, sends instant `MATCHED` STOMP payloads to both `/topic/matchmaking/{p1Id}` and `/topic/matchmaking/{p2Id}`.

### 4.4 In-Memory Room Registry (`multiplayer/service/impl/MultiplayerServiceImpl.java`)
- Maintains active game rooms in a `ConcurrentHashMap<String, GameRoom>`:
  ```java
  public class GameRoom {
      private String roomId;
      private String whitePlayerId;
      private String whitePlayerName;
      private String blackPlayerId;
      private String blackPlayerName;
      private String currentTurn;
      private String status; // "WAITING", "ACTIVE", "COMPLETED"
      private double timeControlMinutes;
      private List<String> moveHistory;
  }
  ```

### 4.5 Disconnect & Session Listener (`multiplayer/listener/WebSocketEventListener.java`)
- Listens to Spring `SessionDisconnectEvent`.
- If a connected player unexpectedly drops or closes their browser tab, looks up their registered `roomId` and broadcasts a `PLAYER_LEFT` payload on `/topic/room/{roomId}`, automatically awarding the win to the remaining player.

---

## 5. Data Transfer Objects (DTOs)

### `MatchmakingRequestDTO`
```json
{
  "playerId": "usr_9481a8c2",
  "playerName": "Grandmaster Alex",
  "elo": 1650,
  "timeControlMinutes": 10.0,
  "incrementSeconds": 0,
  "category": "rapid",
  "preferredColor": "random"
}
```

### `MultiplayerMoveDTO`
```json
{
  "roomId": "K7X9Q2",
  "playerId": "usr_9481a8c2",
  "from": "e2",
  "to": "e4",
  "promotion": null,
  "san": "e4",
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "whiteTimeMs": 598000,
  "blackTimeMs": 600000
}
```

### `ChatMessageDTO`
```json
{
  "roomId": "K7X9Q2",
  "senderId": "usr_9481a8c2",
  "senderName": "Grandmaster Alex",
  "message": "Well played!",
  "timestamp": 1724520300000
}
```

---

## 6. Resilience & Security Features

| Feature | Implementation | Description |
|---|---|---|
| **Sticky Board Viewport Fix** | `ChatPanel.tsx` | Scoped `scrollTop` replaces `scrollIntoView()` to ensure sending chat messages never forces the chessboard out of view. |
| **STOMP Auto-Reconnect** | `WebSocketService.ts` | Automatically recovers connections with exponential backoff on intermittent network drops. |
| **Abrupt Tab Close Detection** | `WebSocketEventListener.java` | Detects socket disconnections and notifies the opponent of abandonment. |
| **Input Sanitization** | `ChatPanel.tsx` & `MultiplayerController` | Prevents whitespace-only chat submissions and bounds message size to 200 characters. |
| **20s Fallback Guarantee** | `PlayMultiplayerOnlineModal` | Ensures players never wait indefinitely in matchmaking by seamlessly initiating a Stockfish 18 match at their target rating. |

---

## 7. Verification & Run Commands

```bash
# 1. Start Spring Boot Server with WebSocket Broker
mvn spring-boot:run

# 2. Run Frontend Dev Server
cd frontend
npm run dev

# 3. Run Automated Tests
cd frontend
npm test
```
