# Comprehensive Chess Analysis & Move Classification System

This document provides complete technical documentation of the **Stockfish 18 Game Analysis Engine**, the **Move Classification Hierarchy**, the **Centipawn-to-Win-Percentage Mathematics**, and the **Material Sacrifice / Brilliance Detection Engine** implemented in Grandmaster's Forge.

---

## 🏛️ 1. Architecture & Analysis Pipeline

The game analysis system processes games in batch through a fast, single-pass pipeline:

```
[PGN / SAN Game History]
         │
         ▼
[Frontend UCI / SAN Serializer] ──(HTTP POST /api/chess/analyze)──▶ [Spring Boot ChessService]
                                                                            │
                                                                            ▼
                                                                [Stockfish 18 UCI Engine]
                                                                            │
                                                                            ▼
                                                                [MultiPV=2 Position Eval]
                                                                            │
                                                                            ▼
                                                                [Win % & WinDrop Deltas]
                                                                            │
                                                                            ▼
                                                                [Move Classifier & Accuracy]
                                                                            │
                                                                            ▼
                                                                [Analyzed Game Response DTO]
```

### Key Performance Optimizations
1. **MultiPV Cache Re-use**: The position *after* move $i$ is identical to the position *before* move $i+1$. By evaluating each position once with `MultiPV=2`, the engine reduces total Stockfish calls from $2N$ to roughly $N+1$.
2. **Opening Book Theory Check**: Known opening lines (e.g. Sicilian Defense, Queen's Gambit) are checked instantly via [`OpeningBook.java`](file:///d:/Chess%20Engine/src/main/java/com/chessengine/util/OpeningBook.java), skipping engine calculation for standard theory moves.

---

## 📊 2. Mathematical Models: Centipawns, Win %, & Accuracy

### 2.1 Centipawn Normalization
Stockfish outputs evaluations in Centipawns ($100\text{ cp} = 1\text{ pawn}$) relative to White. The service normalizes scores relative to the **active player on turn**:

$$\text{PlayerCP} = \begin{cases} +\text{Eval}_{\text{White}} & \text{if White is to move} \\ -\text{Eval}_{\text{White}} & \text{if Black is to move} \end{cases}$$

### 2.2 Sigmoid Win Percentage Model
Centipawns are converted to an intuitive **Win Expectancy Percentage ($0\%$ to $100\%$)** using a calibrated logistic sigmoid formula:

$$\text{WinPercentage}(cp) = 50 + 50 \times \left(\frac{2}{1 + \exp(-0.00368208 \times cp)} - 1\right)$$

*For mate scores (e.g. Mate in $k$ moves):*
$$\text{WinPercentage}(\text{Mate}) = \begin{cases} 100.0\% & \text{if winning mate} \\ 0.0\% & \text{if losing mate} \end{cases}$$

### 2.3 Win Drop ($\Delta W$)
The quality of a move is measured by how much win expectancy was dropped relative to the position before the move:

$$\text{WinDrop} = \max\Big(0.0, \; \text{WinPercentage}_{\text{before}} - \text{WinPercentage}_{\text{after}}\Big)$$

### 2.4 Accuracy (CAPS) Calculation
Overall player accuracy ($0\%$ to $100\%$) is computed from the harmonic average win drop across all played moves:

$$\text{Accuracy} = 100.0 \times \exp(-0.075 \times \text{AvgWinDrop})$$

---

## 🏷️ 3. Complete Move Classification Hierarchy

Every played move is categorized into one of **10 standard chess quality classifications**:

| Badge | Classification | Symbol | Engine & WinDrop Criteria | Description |
| :---: | :--- | :---: | :--- | :--- |
| <span style="color:#0d9488">■</span> | **`brilliant`** | **`!!`** | `isExactBestMove == true` + **Genuine Material Sacrifice** + $(\text{WinPct}_{\text{before}} < 98\%)$ | Finding a winning piece sacrifice or unequal trade that preserves a decisive engine advantage. |
| <span style="color:#2563eb">■</span> | **`great`** | **`!`** | `isExactBestMove == true` + **MultiPV Gap** $(\text{WinPct}_{\text{PV1}} - \text{WinPct}_{\text{PV2}} \ge 12\%)$ | Finding the sole winning tactical continuation where all other moves drop advantage. |
| <span style="color:#059669">■</span> | **`best`** | **`★`** | Literal top engine move ($\text{WinDrop} = 0.0\%$) | The top engine recommendation found by Stockfish. |
| <span style="color:#10b981">■</span> | **`excellent`** | **`✓`** | $\text{WinDrop} \le 2.0\%$ | Nearly as strong as the best move, maintaining full positional control. |
| <span style="color:#22c55e">■</span> | **`good`** | **`👍`** | $2.0\% < \text{WinDrop} \le 5.0\%$ | A solid, playable move with only minor positional concessions. |
| <span style="color:#d97706">■</span> | **`book`** | **`📖`** | Standard Master Opening Book Theory | Recognized opening move conforming to established GM theory. |
| <span style="color:#f59e0b">■</span> | **`inaccuracy`** | **`?!`** | $5.0\% < \text{WinDrop} \le 10.0\%$ | A slight mistake that weakens the position or gives the opponent practical counterplay. |
| <span style="color:#ea580c">■</span> | **`mistake`** | **`?`** | $10.0\% < \text{WinDrop} \le 20.0\%$ | A significant error that damages the position or relinquishes an advantage. |
| <span style="color:#7e22ce">■</span> | **`miss`** | **`❌`** | $\text{WinDrop} > 20.0\%$ and ($\text{lastOpponentWinDrop} \ge 10\%$ or opponent had forced mate / eval $\ge +3.00$) | Missing a clean tactic, winning sequence, or opponent blunder. |
| <span style="color:#e11d48">■</span> | **`blunder`** | **`??`** | $\text{WinDrop} > 20.0\%$ | A catastrophic mistake that turns a winning/equal position into a loss. |

---

## ♟️ 4. In-Depth: The Brilliant Move (`!!`) Detection Algorithm

A move is only classified as **Brilliant (`!!`)** if it satisfies three strict tiers:

```
                          [Top Move Evaluated: isBestMove == true?]
                                              │
                                     YES ─────┴───── NO ──▶ [Proceed to Standard WinDrop Hierarchy]
                                      │
                         [Is Early Opening? moveIndex < 12]
                                      │
                                      ├─ YES ──▶ [Classify as "best" or "book"]
                                      │
                                     NO
                                      │
               [Is Same-Square Recapture? myTarget == prevTarget]
                                      │
                                      ├─ YES ──▶ [Classify as "best" (Equal Trade)]
                                      │
                                     NO
                                      │
                ┌─────────────────────┴─────────────────────┐
                │                                           │
   [Next Ply Opponent Capture]                 [Unequal Piece Sacrifice]
   - Opponent captures our piece               - Queen takes minor/pawn (Qxe5, Qxf6)
     on target square on next turn             - Rook exchange sacrifice (Rxf6+, Rxg7+)
     (e.g. 24. Nxf6+ / 24... gxf6)             - Minor piece sacrifice (Nxf6+, Bxf7+)
                │                                           │
                └─────────────────────┬─────────────────────┘
                                      │
                                     YES
                                      │
                  [Retains Winning Eval / Forced Mate?]
                      (playerCpAfter >= 150 OR isForcedMate)
                                      │
                                     YES
                                      │
                         ★ CLASSIFY AS BRILLIANT (!!) ★
```

### 4.1 Recapture Filtering
In chess, when Black plays `20... Bxc3` taking White's bishop, and White responds with `21. Qxc3`, White is simply **recapturing** an equal piece on the same square.
The algorithm compares the coordinate target square against the previous move's target square (`myTarget == prevTarget`). If equal, it is filtered out as an equal trade and awarded **`★ Best Move`** rather than Brilliant.

### 4.2 Safe Checks vs. Real Sacrifices
A move like **`25. Rg3+`** (sliding a Rook to an unattacked square `g3` with check) is a powerful, forcing check, but because the rook was never under attack or sacrificed, it is correctly classified as **`★ Best Move`**.

---

## 👑 5. Case Study: Mikhail Tal vs. John van der Wiel (1982)

Below is the verified classification breakdown for Tal's famous kingside attack:

```pgn
1. c4 e6 2. Nc3 Bb4 3. e4 c5 4. Nb5 Nc6 5. a3 Ba5 6. b4 cxb4 7. Bb2 Kf8 
8. e5 Nge7 9. Nf3 a6 10. Nd6 Nf5 11. Be2 Nxd6 12. exd6 bxa3 13. Rxa3 Bb4 
14. Rd3 Bc5 15. O-O a5 16. Qa1 f6 17. Ng5 e5 18. Kh1 Bd4 19. f4 Qb6 
20. Bc3 Bxc3 21. Qxc3 Kg8 22. fxe5 Nxe5 23. Ne4 h5 24. Nxf6+ gxf6 
25. Rg3+ Kf7 26. Qxe5 Qd8 27. Bh5+ Kf8 29. Rxf6+ Qxf6 30. Qxf6# 1-0
```

### Move Analysis Table:

| Move # | Move | Classification | Why? |
| :---: | :--- | :---: | :--- |
| **`20. Bc3`** | `Bc3` | **`✓ Excellent`** | Pins and contests Black's strong central bishop. |
| **`21. Qxc3`** | `Qxc3` | **`★ Best`** | **Recapture**: Takes back the bishop on `c3` where Black just captured. |
| **`24. Nxf6+`** | `Nxf6+` | **`!! Brilliant`** | **True Piece Sacrifice**: Knight sacrificed on `f6`, captured by `24... gxf6`. |
| **`25. Rg3+`** | `Rg3+` | **`★ Best`** | **Safe Check**: Rook swings to `g3` with check; Black King forced to `f7`. |
| **`26. Qxe5`** | `Qxe5` | **`!! Brilliant`** | **Queen Sacrifice**: Takes the e5 knight, offering the Queen to `fxe5` into forced mate. |
| **`27. Bh5+`** | `Bh5+` | **`★ Best`** | Decisive bishop check cutting off the King. |
| **`29. Rxf6+`** | `Rxf6+` | **`!! Brilliant`** | **Rook Sacrifice**: Sacrifices Rook on `f6`, leading directly to `30. Qxf6#`. |
| **`30. Qxf6#`** | `Qxf6#` | **`★ Best`** | Checkmate on the board. |

---

## 💻 6. Frontend Visual Integration

The frontend renders this analysis through:
- **Interactive Move Classification Badges**: Color-coded badges (`!!`, `!`, `★`, `✓`, `👍`, `📖`, `?!`, `?`, `❌`, `??`) in the move log.
- **Dynamic Board Arrows**: Green arrows for the player's move and glowing golden arrows indicating Stockfish's top recommended line.
- **Accuracy Comparison Cards**: Displays overall player accuracy percentages side-by-side with king avatars.
- **Live Evaluation Bar**: Smooth vertical gauge illustrating the real-time balance of power from $+10.0$ to $-10.0$ or forced mate status.
