# UI & Frontend Bugs Report — Grandmaster's Forge (Chess Platform)

> **Document Scope:** Comprehensive audit of UI, UX, state synchronization, and component behavior across the React frontend.  
> **Total Identified Bugs:** 20 (Capped at 20 as requested).

---

## Summary Matrix

| # | Bug Title | Component / File | Severity | Impact |
|---|---|---|---|---|
| **1** | Pawn Promotion Hardcoded to Queen (No UI Selection Modal) | `ChessBoardContainer.tsx` / `App.tsx` | **High** | Cannot underpromote to Knight/Rook/Bishop (gameplay critical) |
| **2** | Piece Cannot Be Deselected by Clicking on It Again | `ChessBoardContainer.tsx` | **Medium** | Unresponsive piece selection UX |
| **3** | Chess Clock Interval Resets on Every Move (Zero Time Loss on Fast Moves) | `useChessClock.ts` | **High** | Timer drift; fast players never lose time on clock |
| **4** | Configured Time Increments (+Seconds) Ignored in Gameplay | `PreGameModal.tsx` / `App.tsx` | **High** | Custom and increment time controls fail to apply |
| **5** | Asymmetric Button Grid Layout in GameControls | `GameControls.tsx` | **Medium** | Broken visual alignment when Takeback is disabled |
| **6** | Engine ELO Select Dropdown Mismatch on Custom / Intermediate Ratings | `EngineStatsPanel.tsx` | **Medium** | Dropdown displays blank or desynchronizes from slider |
| **7** | Evaluation Bar Defaults to +0.3 (30 CP) White Advantage at Game Start | `App.tsx` | **Low** | Misleading initial eval before moves occur |
| **8** | Evaluation Score Pill Pinned to Bottom Regardless of Leader or Board Flip | `EvaluationBar.tsx` | **Medium** | Poor contrast and counter-intuitive badge placement |
| **9** | Move Notation History Items Give False Clickable Feedback Without Action | `MoveHistoryLog.tsx` / `App.tsx` | **Low** | Non-functional move replay in live game mode |
| **10** | Game Analyzer Fails to Auto-Start Analysis When Navigated from Match | `AnalyzeGameSection.tsx` | **Medium** | Redundant modal popup requiring second click |
| **11** | Game Analyzer Board Theme Locked to Wood (Ignores Navbar Theme) | `AnalyzeGameSection.tsx` | **Medium** | Theme inconsistency across application views |
| **12** | UserAvatar Component Fails to Update When `src` or `name` Prop Changes | `UserAvatar.tsx` | **Medium** | Stale avatar display upon user switch or profile change |
| **13** | Custom Time Control Slider Artificially Capped at 1.5 Minutes (90s) | `PreGameModal.tsx` / `PreGame1v1Modal.tsx` | **Medium** | Cannot configure standard custom rapid/classical match lengths |
| **14** | Match Abort Fires Celebratory Victory Fireworks Confetti | `App.tsx` | **Low** | Misleading celebration animation on aborted games |
| **15** | FEN Import Error Uses Blocking Browser Alert Dialog | `App.tsx` | **Low** | Intrusive browser popup breaking UI theme & focus |
| **16** | Duplicate / Stale ChatPanel Component in Codebase | `components/chess/ChatPanel.tsx` | **Low** | Dead code causing maintenance confusion |
| **17** | Rapid Mode Time Presets Reset to 10 Mins on Category Re-toggle | `PreGameModal.tsx` | **Low** | User preset selection lost when navigating categories |
| **18** | Orphaned Unused AnalysisModal Component | `AnalysisModal.tsx` | **Low** | Dead code artifact left behind in component folder |
| **19** | Empty Placeholder Card in Navigation Menu "About Us" | `Navbar.tsx` | **Low** | Unfinished placeholder text visible to end-users |
| **20** | Demo Quick Login Forces Fixed 1500 ELO Bypassing Skill Level Calibration | `AuthPage.tsx` | **Low** | Guest users locked into 1500 ELO without onboarding choice |

---

## Detailed Bug Reports

---

### Bug 1: Pawn Promotion Hardcoded to Queen (No Underpromotion Choice)
- **Files:** `frontend/src/components/chess/ChessBoardContainer.tsx` (Lines 75, 87), `frontend/src/App.tsx` (Line 377)
- **Problem:** When a player moves a pawn to the final rank (8th for White, 1st for Black), `handleSquareClick` and `handlePieceDrop` invoke `onMakeMove(source, target, 'q')` with `'q'` hardcoded.
- **Visual / UX Impact:** No promotion dialogue or selector appears. Players cannot choose Knight, Rook, or Bishop promotion (underpromotion), which is crucial in chess tactics to prevent immediate stalemate or execute knight forks.
- **Fix Recommendation:** Detect when a move constitutes a promotion, display a floating piece selection modal (Queen, Knight, Rook, Bishop), and forward the selected piece character to `onMakeMove`.

---

### Bug 2: Piece Cannot Be Deselected by Clicking on It Again
- **Files:** `frontend/src/components/chess/ChessBoardContainer.tsx` (Lines 71–82)
- **Problem:** In `handleSquareClick`, if `moveFrom` is currently square $A$ and the user clicks square $A$ again to cancel/deselect, `onMakeMove(A, A, 'q')` is executed, fails, and the fallback code immediately re-calls `getMoveOptions(A)` and sets `moveFrom` back to $A$.
- **Visual / UX Impact:** The piece remains stubbornly highlighted; users cannot click a piece to unselect it.
- **Fix Recommendation:** Add an explicit check: `if (moveFrom === sq) { setMoveFrom(null); setOptionSquares({}); return; }`.

---

### Bug 3: Chess Clock Interval Resets on Every Move (Zero Time Loss on Fast Moves)
- **Files:** `frontend/src/hooks/useChessClock.ts` (Lines 36–76)
- **Problem:** The timer hook uses `window.setInterval(..., 1000)` and re-executes its effect whenever `activeColor` changes. If a player moves every 800ms, the previous interval is cancelled before the 1-second callback fires and a new 1-second interval begins.
- **Visual / UX Impact:** Bullet/blitz players making rapid moves never lose time on their clock, causing clock desynchronization.
- **Fix Recommendation:** Track timestamp deltas (`Date.now()` or `performance.now()`) with a high-frequency interval (e.g. 100ms or 200ms) or compute elapsed time between turns.

---

### Bug 4: Configured Time Increments (+Seconds) Ignored in Gameplay
- **Files:** `frontend/src/components/chess/PreGameModal.tsx` (Lines 10–14, 71–75), `frontend/src/App.tsx` (Lines 450–471)
- **Problem:** The PreGame modals allow selecting time increments (e.g., +1s, +2s, +5s, up to +90s). However, `handleStartBubbleBotMatch` and `handleStartLocal1v1` only extract and store `initialMinutes`, completely discarding `incrementSeconds`.
- **Visual / UX Impact:** Clock never adds bonus time after player moves, breaking Fischer/Bronstein time controls.
- **Fix Recommendation:** Store `incrementSeconds` in state and pass it to `useChessClock`, adding the increment amount upon every valid move completion.

---

### Bug 5: Asymmetric Button Grid Layout in GameControls
- **Files:** `frontend/src/components/chess/GameControls.tsx` (Lines 62–85)
- **Problem:** GameControls uses a 2-column grid (`grid grid-cols-2 gap-2.5`). When `canUndo` is false (e.g., 1v1 mode, beginning of game, or during AI computation), exactly 3 buttons are rendered (`Flip Board`, `Analyze`, `PGN / FEN`).
- **Visual / UX Impact:** Row 1 contains 2 buttons, while Row 2 contains 1 button occupying only the left half, leaving an empty, unaligned space in the UI card.
- **Fix Recommendation:** Use `col-span-2` for full-width action or dynamically adjust grid layout / place `PGN / FEN` or `Analyze` cleanly across columns.

---

### Bug 6: Engine ELO Select Dropdown Mismatch on Custom / Intermediate Ratings
- **Files:** `frontend/src/components/chess/EngineStatsPanel.tsx` (Lines 70–82)
- **Problem:** The `<select value={elo}>` dropdown in the stats panel only defines options for `800, 1200, 1500, 1850, 2200, 2600, 3200`. If a player picks an ELO from the PreGame slider (e.g., 1000, 1350, 1600, 1750, 2000, 2400) or skill selection (400 ELO), the `<select>` value doesn't match any option.
- **Visual / UX Impact:** The dropdown displays blank/empty or shows an incorrect fallback, desynchronizing the displayed ELO.
- **Fix Recommendation:** Dynamically inject the active ELO as a selected option if not in the default preset list, or display a numeric slider/badge.

---

### Bug 7: Evaluation Bar Defaults to +0.3 (30 CP) White Advantage at Game Start
- **Files:** `frontend/src/App.tsx` (Line 813)
- **Problem:** `App.tsx` renders `<EvaluationBar scoreType={engineStats?.scoreType ?? 'cp'} scoreValue={engineStats?.scoreValue ?? 30} ... />`.
- **Visual / UX Impact:** Before any engine calculation or move is made, the evaluation bar starts slightly skewed (+0.3) in White's favor rather than neutral 0.0.
- **Fix Recommendation:** Change default fallback from `30` to `0`.

---

### Bug 8: Evaluation Score Pill Pinned to Bottom Regardless of Leader or Board Flip
- **Files:** `frontend/src/components/chess/EvaluationBar.tsx` (Lines 71–92)
- **Problem:** The floating score pill is statically styled with `absolute inset-x-0 bottom-2`.
- **Visual / UX Impact:** When Black is overwhelmingly winning (e.g., -M2 or -9.0) or when the board is flipped to Black's perspective, the badge remains pinned at the bottom in the opposite color's zone.
- **Fix Recommendation:** Position the eval pill dynamically based on the advantage side or vertical center of the divider wave.

---

### Bug 9: Move Notation History Items Give False Clickable Feedback Without Action
- **Files:** `frontend/src/components/chess/MoveHistoryLog.tsx` (Lines 67–86), `frontend/src/App.tsx` (Line 875)
- **Problem:** `MoveHistoryLog` renders each move as a `<motion.button>` with hover effects and pointer cursor calling `onSelectMove?.(item.whiteFen)`. However, `App.tsx` renders `<MoveHistoryLog moves={moveHistory} />` without supplying `onSelectMove`.
- **Visual / UX Impact:** Moves appear clickable and interactive, but clicking them does nothing during the match.
- **Fix Recommendation:** Either wire up a position preview inspection handler or disable button styling if `onSelectMove` is omitted.

---

### Bug 10: Game Analyzer Fails to Auto-Start Analysis When Navigated from Match
- **Files:** `frontend/src/components/chess/AnalyzeGameSection.tsx` (Lines 124–126, 392–478)
- **Problem:** When a user finishes a game and clicks "Analyze Game", `App.tsx` passes `analysisPgn` into `AnalyzeGameSection`. However, `AnalyzeGameSection` initializes `isModalOpen = true` and does not auto-run analysis if `initialPgn` is present.
- **Visual / UX Impact:** User is forced to look at an open modal and manually click "Start Game Analysis" a second time.
- **Fix Recommendation:** Add a `useEffect` on mount to automatically run `runAnalysis(initialPgn)` and close the modal when `initialPgn` is provided.

---

### Bug 11: Game Analyzer Board Theme Locked to Wood (Ignores Navbar Theme)
- **Files:** `frontend/src/components/chess/AnalyzeGameSection.tsx` (Lines 132, 498–499)
- **Problem:** `AnalyzeGameSection` has a static `const [boardTheme] = useState<BoardTheme>('wood');` with no setter or props passed from `App.tsx` / `Navbar`.
- **Visual / UX Impact:** If a user chooses the Cyberpunk, Emerald, or Classic theme in the Navbar, opening the Analyzer resets the board appearance to Wood.
- **Fix Recommendation:** Pass `theme` as a prop from `App.tsx` into `AnalyzeGameSection` and support all 4 themes.

---

### Bug 12: UserAvatar Component Fails to Update When `src` or `name` Prop Changes
- **Files:** `frontend/src/components/ui/UserAvatar.tsx` (Lines 14–16)
- **Problem:** `UserAvatar` stores `imgSrc` in a local `useState(src || fallbackUrl)`. When props update (e.g. user logs into a different account or opponent details load), the state is not re-synchronized.
- **Visual / UX Impact:** Avatar images get stuck on previous or stale user avatars.
- **Fix Recommendation:** Add a `useEffect(() => { setImgSrc(src || fallbackUrl); setHasError(false); }, [src, name])`.

---

### Bug 13: Custom Time Control Slider Artificially Capped at 1.5 Minutes (90s)
- **Files:** `frontend/src/components/chess/PreGameModal.tsx` (Lines 38, 222–227), `frontend/src/components/chess/PreGame1v1Modal.tsx` (Lines 33, 332–337)
- **Problem:** Custom time per side slider has `max={1.5}` minutes (90 seconds).
- **Visual / UX Impact:** Users cannot set standard custom chess times (e.g. 10 min, 20 min, 30 min, 60 min).
- **Fix Recommendation:** Increase the custom time slider range to `min={0.5}` and `max={60}` (or `120`) minutes.

---

### Bug 14: Match Abort Fires Celebratory Victory Fireworks Confetti
- **Files:** `frontend/src/App.tsx` (Lines 590–596)
- **Problem:** When an opponent disconnects in Online 1v1 (`PLAYER_LEFT`), the modal displays `GAME ABORTED` ("Opponent left the website") and triggers full victory confetti cannon animations.
- **Visual / UX Impact:** Confusing celebratory fireworks for an uncompleted/aborted match.
- **Fix Recommendation:** Remove confetti trigger on `PLAYER_LEFT` or show a neutral abort icon.

---

### Bug 15: FEN Import Error Uses Blocking Browser Alert Dialog
- **Files:** `frontend/src/App.tsx` (Lines 990–1000)
- **Problem:** When importing an invalid FEN string in the PGN/FEN utility modal, it calls `alert('Invalid FEN position string')`.
- **Visual / UX Impact:** Native browser dialog freezes the screen and conflicts with modern dark UI styling.
- **Fix Recommendation:** Render an inline red error helper message beneath the input field.

---

### Bug 16: Duplicate / Stale ChatPanel Component in Codebase
- **Files:** `frontend/src/components/chess/ChatPanel.tsx` vs `frontend/src/components/chat/ChatPanel.tsx`
- **Problem:** `components/chess/ChatPanel.tsx` is an unmaintained duplicate of `components/chat/ChatPanel.tsx` with missing features (lacks opponentName header, timestamp parsing, etc.).
- **Visual / UX Impact:** Code maintenance hazard; accidental imports lead to visual regressions.
- **Fix Recommendation:** Remove `frontend/src/components/chess/ChatPanel.tsx` and consolidate on `frontend/src/components/chat/ChatPanel.tsx`.

---

### Bug 17: Rapid Mode Time Presets Reset to 10 Mins on Category Re-toggle
- **Files:** `frontend/src/components/chess/PreGameModal.tsx` (Lines 41–53), `frontend/src/components/chess/PreGame1v1Modal.tsx` (Lines 64–73)
- **Problem:** `handleCategorySelect('rapid')` always sets `selectedMinutes = 10`. If a user selected 15m or 30m and switches tabs or categories, the chosen duration is immediately reset.
- **Visual / UX Impact:** Loss of user-selected match duration when exploring options.
- **Fix Recommendation:** Maintain separate memory or retain the user's selected preset value when re-entering a category.

---

### Bug 18: Orphaned Unused AnalysisModal Component
- **Files:** `frontend/src/components/chess/AnalysisModal.tsx`
- **Problem:** `AnalysisModal.tsx` is no longer imported or rendered anywhere in the application after being replaced by `AnalyzeGameSection.tsx`.
- **Visual / UX Impact:** Increases bundle size and causes developer ambiguity.
- **Fix Recommendation:** Safely delete `AnalysisModal.tsx` or redirect any legacy references.

---

### Bug 19: Empty Placeholder Card in Navigation Menu "About Us"
- **Files:** `frontend/src/components/layout/Navbar.tsx` (Lines 188–200)
- **Problem:** The hamburger drawer contains an "About Us" section with an empty placeholder card displaying `"Grandmaster's Forge Chess Platform"`.
- **Visual / UX Impact:** Looks like an unfinished debug placeholder in production.
- **Fix Recommendation:** Populate with actual platform description, version, engine specs (Stockfish 18 / NNUE), or replace with useful links.

---

### Bug 20: Demo Quick Login Forces Fixed 1500 ELO Bypassing Skill Level Calibration
- **Files:** `frontend/src/components/auth/AuthPage.tsx` (Lines 90–117)
- **Problem:** Clicking "Quick Access as Demo Grandmaster" assigns a fallback guest user with hardcoded `eloRating: 1500` and marks skill selection complete.
- **Visual / UX Impact:** Beginners and casual players using quick access are thrust against 1500 ELO Stockfish without a prompt to choose their preferred difficulty.
- **Fix Recommendation:** Leave `skillLevelSelected: false` or `eloRating: 0` for new guest sessions so they can select their skill level on the onboarding screen.

---
