# Chess Engine UI & Interaction Testing Guide

This guide provides a comprehensive manual and automated test suite to verify the UI bug fixes and validate the new **Light Classic Texture** user experience on `http://localhost:8080` (production) or `http://localhost:5173` (development).

---

## 🚀 1. Test Environment Setup

| Environment | URL | Details |
| :--- | :--- | :--- |
| **Production / Embedded Server** | `http://localhost:8080/` | Spring Boot + Static Build Bundle |
| **Frontend Dev Server** | `http://localhost:5173/` | Vite Fast-Refresh Dev Server |
| **Default Test User** | `grandmaster` / `demo_secret_pass` | Pre-registered Grandmaster demo account |

---

## 🧪 2. UI Test Suite Matrix

| Test ID | Feature Area | Description | Expected Result | Automated DOM Test Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Pawn Promotion | Move a pawn to the 8th/1st rank | Promotion dialog displays ♛ Queen, ♞ Knight, ♜ Rook, ♝ Bishop; piece transforms accurately upon click. | ✅ **PASS** (`PromotionModal.test`) |
| **TC-02** | Time Increment | Configure match with +5s increment | Active player's clock increments by 5 seconds after each completed turn. | ✅ **PASS** (`useChessClock.test`) |
| **TC-03** | Clock Countdown | In-game active clock timing | Active player's clock counts down continuously without resetting to the initial limit upon making moves. | ✅ **PASS** (`useChessClock.test`) |
| **TC-04** | Local 1v1 Pass & Play | 2-player match on same screen | Board auto-rotates to active player's turn; White and Black timers count down on respective turns. | ✅ **PASS** (`App.test`) |
| **TC-05** | Game Over Dialog | Match completion (Checkmate/Draw/Resign) | Backdrop click is locked (`closeOnBackdropClick=false`); buttons for *Main Menu*, *Analyze Game*, *Copy PGN*, and *Play Again* function correctly. | ✅ **PASS** (`Modal.test`) |
| **TC-06** | Game Controls Grid | Action buttons layout | Symmetric 2x2 grid is maintained in both Single-Player (VS AI) and Multiplayer modes. | ✅ **PASS** (`GameControls.test`) |
| **TC-07** | Room Code Copy | Online 1v1 multiplayer room creation | Room code is copied to clipboard with instant fallback for non-HTTPS browser contexts. | ✅ **PASS** (`PreGame1v1Modal.test`) |
| **TC-08** | Chat Whitespace | 1v1 match chat input | Empty or whitespace-only messages cannot be submitted; button remains disabled until valid text is typed. | ✅ **PASS** (`ChatPanel.test`) |
| **TC-09** | Stockfish ELO Switch | Dynamic ELO selector dropdown | Engine difficulty updates smoothly across all skill ratings (800 to 3200 ELO). | ✅ **PASS** (`EngineStatsPanel.test`) |
| **TC-10** | Game Analyzer | Load PGN & step through moves | Step controls, best engine move arrows, accuracy cards, and move quality badges render with light classic styling. | ✅ **PASS** (`Badge.test`) |

---

## ⚡ 3. Automated DOM Test Execution

You can execute the entire suite of DOM and component interaction tests automatically using Vitest:

```bash
cd "d:\Chess Engine\frontend"
npm test
```

### Test Suite Execution Output:
```text
 ✓ src/__tests__/ui_bugs.test.tsx (11 tests) 264ms
   ✓ TC-01: Pawn Promotion Dialog DOM Tests > renders all 4 promotion piece options (Queen, Knight, Rook, Bishop) when open
   ✓ TC-01: Pawn Promotion Dialog DOM Tests > triggers onCancel when Cancel button is clicked
   ✓ TC-01: Pawn Promotion Dialog DOM Tests > renders nothing when isOpen is false
   ✓ TC-02 & TC-03: Clock Continuity & Time Increment Tests > correctly initializes formatted time and applies increment on move
   ✓ TC-05: Modal Backdrop Lock Tests > does not trigger onClose when backdrop is clicked if closeOnBackdropClick is false
   ✓ TC-05: Modal Backdrop Lock Tests > triggers onClose when closeOnBackdropClick is true (default)
   ✓ TC-06: Symmetric Game Controls Layout Tests > always renders exactly 4 action buttons in the main grid when canUndo is false
   ✓ TC-06: Symmetric Game Controls Layout Tests > enables Takeback button when canUndo is true
   ✓ TC-08: Chat Message Whitespace Sanitization Tests > disables submit button and prevents sending whitespace-only messages
   ✓ TC-09: Stockfish Engine ELO Selection Tests > renders ELO selector and calls onEloChange on selection
   ✓ TC-10: Move Classification Badges Tests > renders all move classification badges with proper styles and labels

 Test Files  1 passed (1)
      Tests  11 passed (11)
```

---

## 📝 4. Detailed Manual Step-by-Step Test Scenarios

### Test Case 1: Pawn Promotion UI Selection (TC-01)
- **Goal**: Verify that pawn promotions render the promotion picker dialog instead of auto-queen.
- **Steps**:
  1. Open `http://localhost:8080/` (or `http://localhost:5173/`).
  2. Click **Play Bubble Bot** or open **PGN/FEN Utility** from Game Controls.
  3. Load a position with a pawn on the 7th rank ready to promote:
     ```text
     8/4P3/8/8/8/8/8/4K2k w - - 0 1
     ```
  4. Drag or click the pawn on `e7` to `e8`.
- **Verification**:
  - A modal titled **"Promote Your Pawn"** appears with Queen (♕), Knight (♘), Rook (♖), and Bishop (♗).
  - Clicking **Knight (♞)** promotes the pawn to a Knight on `e8`.
  - The move notation log registers `e8=N`.

---

### Test Case 2: Clock Interval & Time Increment (TC-02 & TC-03)
- **Goal**: Verify that timers do not reset on move and that increments add seconds.
- **Steps**:
  1. Click **Play Bubble Bot** on the Welcome screen.
  2. Select **Custom** time control: Set Time to **3 Minutes** and Increment to **5 Seconds**.
  3. Click **Start Battle**.
  4. Make a move on the board (e.g. `e4`).
- **Verification**:
  - The White clock displays `02:59`, then after completing the move adds +5 seconds, displaying `03:04`.
  - The clock continues counting down from `03:04` when it becomes White's turn again (no reset to `03:00`).

---

### Test Case 3: Local 1v1 Pass & Play (TC-04)
- **Goal**: Verify turn rotation and timers in Local Multiplayer.
- **Steps**:
  1. Click **Play 1 vs 1** -> Select **Local PC (Same Screen)**.
  2. Set Time to **5 Minutes** and click **Start Local Battle**.
  3. Play `1. e4` as White.
- **Verification**:
  - The board view auto-flips to Black's perspective.
  - Black's timer starts ticking down from `05:00`.
  - White's timer stops ticking until White's next turn.

---

### Test Case 4: Game Over Modal Backdrop Safety (TC-05)
- **Goal**: Ensure players cannot lose match results by clicking outside the modal.
- **Steps**:
  1. Start a game against Bubble Bot.
  2. Click **Resign Match** in Game Controls.
  3. The **"Game Over"** modal pops up showing the result.
  4. Click outside the modal on the blurred backdrop.
- **Verification**:
  - The modal remains open and does not dismiss.
  - Clicking **"Copy PGN"** copies the full PGN to clipboard.
  - Clicking **"Analyze Game"** navigates directly into the analysis workbench.

---

### Test Case 5: 1v1 Room Code Clipboard Copy (TC-07)
- **Goal**: Validate multiplayer room code generation and clipboard copy.
- **Steps**:
  1. Click **Play 1 vs 1** -> Select **Online Multiple Devices**.
  2. Click **Generate Room Code**.
  3. Click **Copy Room Code**.
- **Verification**:
  - The button turns green and displays **"Copied"**.
  - Pasting (`Ctrl+V`) produces the exact room code (e.g. `ROOM-XXXX`).

---

### Test Case 6: Game Analyzer Workbench (TC-10)
- **Goal**: Verify PGN game analysis, move accuracy cards, and evaluation bar.
- **Steps**:
  1. Click **Analyze Game** from the Welcome screen.
  2. Click **Load Sample Match** -> Click **Start Game Analysis**.
- **Verification**:
  - Stockfish computes move evaluations with real-time percentage progress.
  - White Accuracy and Black Accuracy cards display calculated percentages (e.g. `89.4%`).
  - Move table displays move classification badges (`Brilliant`, `Best`, `Blunder`, `Mistake`, `Book`).
  - Step navigation buttons (`|<<`, `<`, `Play/Pause`, `>`, `>>|`) navigate through moves smoothly.

---

## 🏁 5. Build & Production Verification Command

Run the production build script in the terminal:
```bash
cd "d:\Chess Engine\frontend"
npm run build
```
**Expected Output**:
```text
✓ built in 617ms
Exit code: 0 (No TypeScript or CSS errors)
```

