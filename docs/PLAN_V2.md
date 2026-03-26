# Minesweeper PWA — v2 Plan

## Overview

v2 focuses on polish, depth, and mobile-native feel before adding a backend (v3). Eight phases, each aligned with a feature category. All work happens on `dev`; push to `main` to deploy.

---

## Phase 1 — Animations & Visual Polish

### Features

**1.1 Bigger smiley emoji**

- Increase `font-size` on `.smiley-button` from `1.625rem` to ~`1.875rem`. The button is already 44×44px; the emoji just needs more room visually.

**1.2 Board entrance animation**

- When a new game starts, cells cascade in from top-left to bottom-right.
- Each cell gets a `--cell-delay: calc((row + col) * 12ms)` CSS custom property set via `style` in `Cell.tsx`.
- A `.board--entering` class on `GameBoard` activates a `@keyframes cell-enter` (scale 0.5 → 1, opacity 0 → 1).
- `GameBoard` removes the class after `(maxRow + maxCol) * 12ms + 100ms` via a `setTimeout`.
- Guard: skip entirely when `animationsEnabled === false`.

**1.3 Chord ripple**

- When a chord reveal fires (`chordClick` in game store), return the list of newly revealed cell coordinates alongside the existing state update.
- `useCellLogic` receives an `isChordRevealed: boolean` and `chordDistanceFromOrigin: number` prop.
- Cells set `--ripple-delay: calc(distance * 30ms)` and apply a `.cell--chord-ripple` class, triggering a quick scale pulse (`1 → 1.08 → 1`).
- After animation completes, the class is removed.
- Guard: `animationsEnabled`.

**1.4 Mine cascade reveal on loss**

- Currently all mines appear simultaneously. Instead, reveal them in a ripple from the exploded cell.
- Game store: when loss is detected, store an ordered `mineRevealOrder: [row, col][]` array in state, sorted by Chebyshev distance from the exploded cell.
- `Cell.tsx`: cells that are mines and not yet "visually revealed" check their index in `mineRevealOrder`. Each cell's CSS `animation-delay` = `index * 35ms`.
- The mine icon itself does a quick scale-in (`0 → 1.3 → 1`) with the delay.
- Guard: `animationsEnabled` (without the toggle all mines appear at once as they do in v1).

**1.5 Confetti on win**

- A `<canvas>` element is absolutely positioned over the game window, pointer-events none.
- Triggered when `status` transitions to `'won'`.
- ~60 particles (random color from theme palette, random start position along top edge, random velocity and rotation) animate for ~2 seconds then the canvas is hidden.
- Pure `requestAnimationFrame` loop — no library.
- Guard: `animationsEnabled`.

**1.6 Smiley micro-animations**

- Win: 😎 does a quick scale bounce (`1 → 1.2 → 1`) when it first appears.
- Loss: 😵 does a short horizontal shake (`translateX ±4px`, 3 cycles, 200ms total).
- Press: 😮 is already shown on press; add a subtle compress (`scaleY(0.9)`).
- All via CSS `@keyframes` on the `.smiley-button` element; class applied by `useSmileyButtonLogic` and removed after animation ends via `animationend` event.
- Guard: `animationsEnabled`.

### What changes

| File                                        | Change                                                                                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/board/Cell.tsx`             | Accept `chordDistanceFromOrigin`, `mineRevealIndex` props; set CSS custom properties                                                      |
| `src/components/board/GameBoard.tsx`        | Add `board--entering` class on new game; `Confetti` canvas child                                                                          |
| `src/components/board/useGameBoardLogic.ts` | Drive entrance animation; pass chord/mine reveal data down                                                                                |
| `src/components/header/SmileyButton.tsx`    | Apply win/loss/press animation classes                                                                                                    |
| `src/stores/game.store.ts`                  | Add `mineRevealOrder` to state; populate on loss                                                                                          |
| `src/styles/global.css`                     | Add `@keyframes` for all new animations; `.board--entering`, `.cell--chord-ripple`, `.cell--mine-reveal`, `.smiley--win`, `.smiley--loss` |

---

## Phase 2 — New Themes

### Themes to add

| Key        | Name             | Vibe                                                                                                          |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `material` | Material Dark    | Google Material Design dark; deep grey surfaces, purple accent, no bevels, rounded corners, elevation shadows |
| `aero`     | Aero Glass       | Windows Vista/7; translucent glass effect via `backdrop-filter: blur`, soft blue highlights, gradient buttons |
| `pastel`   | Pastel           | Warm cream background, mint/lavender/peach cells, soft rounded corners, gentle shadows                        |
| `neon`     | Neon / Synthwave | Dark purple/black background, neon pink/cyan text-shadows and borders, glow effects, retro feel               |
| `aqua`     | macOS Aqua       | Classic OS X; blue gradient buttons, pinstripe background, aqua blue highlights, wet-glass cell surfaces      |

Total themes: 7 (`xp`, `dark`, `material`, `aero`, `pastel`, `neon`, `aqua`).

### What changes

| File                                      | Change                                                                                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/settings.types.ts`             | Expand `Theme` union to all 7 values                                                                                                               |
| `src/styles/themes/material.css`          | New file                                                                                                                                           |
| `src/styles/themes/aero.css`              | New file                                                                                                                                           |
| `src/styles/themes/pastel.css`            | New file                                                                                                                                           |
| `src/styles/themes/neon.css`              | New file                                                                                                                                           |
| `src/styles/themes/aqua.css`              | New file                                                                                                                                           |
| `src/styles/global.css`                   | Import all new theme files                                                                                                                         |
| `src/components/modals/SettingsModal.tsx` | Replace plain radio buttons with a visual theme picker — a row of small swatches showing the primary surface color and accent color for each theme |
| `src/constants/theme.constants.ts`        | Add `THEME_LABELS` and `THEME_PREVIEW_COLORS` maps                                                                                                 |

### CSS variable contract

Every theme file must define the full set of custom properties (same keys as `xp.css` and `dark.css`). The `neon` and `aero` themes may additionally use properties like `--glow-color` and `--blur-amount` that are only meaningful within their own override rules.

---

## Phase 3 — Mobile & UX

### Features

**3.1 Haptic feedback**

- Add `hapticEnabled: boolean` to `Settings` type and `settings.store.ts`.
- New `src/services/haptic.service.ts`: thin wrapper around `navigator.vibrate()` with named patterns:
  - `reveal`: `[10]` (10ms single pulse)
  - `flag`: `[15, 10, 15]` (double-tap feel)
  - `unflag`: `[10]`
  - `loss`: `[80, 30, 80]` (two long pulses)
  - `win`: `[20, 15, 20, 15, 60]` (ascending pattern)
  - `chord`: `[8]` (very short)
- Call `haptic.service` from `useCellLogic` and `App.tsx` status-change effect.
- Toggle in Settings modal (on/off); hidden entirely if `!navigator.vibrate` (desktop).
- Guard: `hapticEnabled && 'vibrate' in navigator`.

**3.2 Swipe-to-flag**

- Extend `useLongPress.ts` to detect a downward swipe: if `touchmove` moves ≥ 20px downward within the first 200ms of a touch (before long-press fires), treat it as a flag gesture.
- Cancel the reveal-on-release behavior when swipe is detected.
- Visual feedback: brief scale-down on the cell before the flag appears.
- Does not conflict with pinch-to-zoom (which uses two fingers; swipe uses one).

**3.3 Landscape reflow**

- Currently in landscape the header sits on top and eats vertical space, making the board short.
- New layout: in landscape (`@media (orientation: landscape)`), the `.game-window` switches to `flex-direction: row`. The header becomes a narrow left sidebar (`width: ~80px`, `height: 100%`), rotated labels, stacked vertically: Leaderboard icon → MineCounter → SmileyButton → Timer → Settings icon.
- `useGameLayout` already recalculates cell size on resize; the sidebar width is subtracted from available width.
- The `HEADER_HEIGHT` constant becomes `HEADER_SIZE` and the hook returns `headerOrientation: 'top' | 'left'`; components conditionally apply sidebar vs top-bar CSS classes.

### What changes

| File                                      | Change                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `src/types/settings.types.ts`             | Add `hapticEnabled`                                                             |
| `src/stores/settings.store.ts`            | Add `hapticEnabled`, `setHapticEnabled`                                         |
| `src/services/haptic.service.ts`          | New file — named vibration patterns                                             |
| `src/hooks/useLongPress.ts`               | Add swipe-down detection                                                        |
| `src/components/modals/SettingsModal.tsx` | Add haptic toggle (conditionally rendered)                                      |
| `src/hooks/useGameLayout.ts`              | Add `headerOrientation` output; adjust available dimensions                     |
| `src/utils/layout.utils.ts`               | `HEADER_HEIGHT` → `HEADER_SIZE`; add sidebar width constant                     |
| `src/styles/global.css`                   | Landscape media query for `.game-window`, `.game-header`, `.game-header__inner` |

---

## Phase 4 — Audio

### Features

**4.1 Proximity-based reveal tone**

- Currently every reveal plays the same tone. Map adjacent mine count (0–8) to frequency:
  - 0 (empty cascade): soft whoosh instead of a tone (new sound)
  - 1–2: lower, warmer tones (~330–440 Hz)
  - 3–4: mid tones (~550–660 Hz)
  - 5–6: higher, more tense tones (~770–880 Hz)
  - 7–8: harsh, dissonant tone (~1000+ Hz, minor interval added)
- `playReveal` in `sound.service.ts` accepts `mineCount: number`.

**4.2 Cascade whoosh**

- When flood-fill reveals ≥ 6 cells at once, skip the individual reveal tones and play a single smooth whoosh instead (frequency sweep from 200 → 800 Hz over 0.2s).
- `chordClick` in game store returns the count of newly revealed cells; `useCellLogic` or `App.tsx` decides which sound to play.
- `playReveal` gets an overload: `playReveal(mineCount, cascadeSize)`.

**4.3 Sound themes**

- Add `soundTheme: 'classic' | 'arcade' | 'minimal'` to `Settings`.
- `sound.service.ts` switches oscillator types and envelope parameters based on theme:
  - `classic`: current behavior (sine/square waves)
  - `arcade`: all square waves, more 8-bit character, slightly louder attacks
  - `minimal`: very short soft tones, much quieter, feels like a neutral UI
- New "Sound Theme" selector in Settings modal (only visible when sound is enabled).

**4.4 Settings adherence**

- All sound functions already accept `volume` and are gated by `soundEnabled`.
- New sounds (proximity tones, whoosh, chord sound, cascade) follow the same pattern.
- `soundTheme` is passed down through the call site in `App.tsx` (status effects) and `useCellLogic` (cell interactions).

### What changes

| File                                      | Change                                                   |
| ----------------------------------------- | -------------------------------------------------------- |
| `src/types/settings.types.ts`             | Add `soundTheme`                                         |
| `src/stores/settings.store.ts`            | Add `soundTheme`, `setSoundTheme`                        |
| `src/services/sound.service.ts`           | Proximity tones; whoosh; sound theme switch; chord sound |
| `src/components/modals/SettingsModal.tsx` | Sound theme selector (3 options, visible when sound on)  |
| `src/components/board/useCellLogic.ts`    | Pass `mineCount` and cascade size to sound calls         |
| `src/App.tsx`                             | Pass `soundTheme` to sound calls in status effects       |

---

## Phase 5 — Statistics & History

### Features

**5.1 Game record data model**
New `src/types/stats.types.ts`:

```ts
interface GameRecord {
  id: string // crypto.randomUUID()
  boardKey: BoardKey
  result: 'won' | 'lost'
  timeSeconds: number
  date: string // ISO 8601
  firstClick: [number, number]
  totalClicks: number // left-clicks (reveal + chord attempts)
  cellsRevealed: number // total safe cells revealed
  minesFlagged: number // correct flags at game end
}
```

New `src/stores/stats.store.ts`:

- Persists last 200 game records to localStorage under `'minesweeper-stats'`.
- Actions: `recordGame(record)`, `clearHistory()`.
- Derived selectors (computed, not stored): `getWinRate(boardKey)`, `getAverageTime(boardKey)`, `getBestTime(boardKey)`, `getCurrentStreak(boardKey)`, `getBestStreak(boardKey)`, `getFirstClickHeatmap(boardKey)`.
- A game record is written at the moment status transitions to `'won'` or `'lost'` in `App.tsx`.

**5.2 Efficiency score**

- **Formula**: `efficiency = cellsRevealed / totalClicks`. Measures how many cells each click uncovered on average. Higher = better (flood fills and chords multiply your clicks).
- Displayed in the `GameOverBanner` on win only: e.g. `× 3.2 per click`.
- Stored in `GameRecord` as a derived value computed at write time.

**5.3 "Recent" tab in Leaderboard modal**

- Add a "Recent" tab to `LeaderboardModal` alongside the difficulty tabs.
- Shows last 20 game records across all difficulties, most recent first.
- Each row: difficulty label, result icon (✅ / 💣), time, date (relative: "2h ago", "yesterday").
- New `src/utils/date.utils.ts`: `formatRelativeDate(isoString): string`.

**5.4 Per-difficulty statistics modal**

- New `StatisticsModal` component, opened from a new 📊 icon in the header (between Trophy and Settings).
- Tabs: Beginner | Intermediate | Expert | Custom (only shown if custom games played).
- Each tab shows:
  - Win rate (e.g. "64%") with games played count
  - Best time / Average time (wins only)
  - Current streak / Best streak
  - Total time played
  - Average efficiency score
- Below the stats: **Best Opening Heatmap** (see 5.5).

**5.5 Best opening heatmap**

- Shown in StatisticsModal below the per-difficulty stats.
- Hidden until ≥ 10 games of that difficulty have been recorded.
- A `<canvas>` element sized to match the board dimensions at a small scale (e.g. each cell = 8px).
- Each cell is colored by first-click frequency: low → grey, high → bright green (or theme accent).
- A legend: "Where you first click" with a gradient bar.
- Computed from `getFirstClickHeatmap(boardKey)` selector which returns a `number[][]` (normalized 0–1 per cell).

### What changes

| File                                                | Change                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/types/stats.types.ts`                          | New file — `GameRecord`                                                  |
| `src/stores/stats.store.ts`                         | New file — record storage + derived selectors                            |
| `src/components/modals/StatisticsModal.tsx`         | New file                                                                 |
| `src/components/modals/useStatisticsModalLogic.ts`  | New file                                                                 |
| `src/components/modals/LeaderboardModal.tsx`        | Add "Recent" tab                                                         |
| `src/components/modals/useLeaderboardModalLogic.ts` | Add recent games data                                                    |
| `src/components/game-over/GameOverBanner.tsx`       | Show efficiency score on win                                             |
| `src/components/header/Header.tsx`                  | Add 📊 StatisticsModal button                                            |
| `src/stores/ui.store.ts`                            | Add `statisticsModalOpen`, `openStatisticsModal`, `closeStatisticsModal` |
| `src/utils/date.utils.ts`                           | New file — `formatRelativeDate`                                          |
| `src/App.tsx`                                       | Write `GameRecord` on status → won/lost                                  |

---

## Phase 6 — Gameplay: No-Guess Mode

### What it is

A board generation mode that guarantees the puzzle is solvable by logic alone — the player never needs to guess. Toggled in the New Game Modal (checkbox: "No guessing").

### Algorithm

The approach is **accept/reject with a constraint-propagation solver**:

1. Generate a board as normal (place mines randomly, first-click safe).
2. Run a headless minesweeper solver on the board starting from the first-click cell.
3. The solver uses two constraint propagation rules:
   - If a cell's number equals its unrevealed neighbor count → all unrevealed neighbors are mines (flag them).
   - If a cell's number equals its already-flagged neighbor count → all remaining unrevealed neighbors are safe (reveal them).
4. If the solver reaches a state where no rule applies but unrevealed safe cells remain → the board requires a guess → reject and regenerate.
5. Repeat until a solvable board is found. In practice this takes 1–5 attempts for Beginner/Intermediate and up to ~20 for Expert.
6. A timeout after 100 attempts falls back to a regular board with a brief toast warning ("Could not find a no-guess board — playing standard").

### Why this needs a Web Worker (previewing Phase 8)

For Expert (30×16, 99 mines), each attempt runs the solver on 480 cells. 100 attempts could mean 50,000 constraint passes. This is fast (microseconds each) but done synchronously on the main thread it blocks the UI for a noticeable frame or two. The Web Worker in Phase 8 makes this invisible.

### What changes

| File                                      | Change                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/services/board.service.ts`           | Add `isBoardSolvable(board, config, firstClick): boolean` using constraint propagation |
| `src/services/board.service.ts`           | `placeMines` accepts `noGuess: boolean`; loops until solvable if true                  |
| `src/types/settings.types.ts`             | Add `noGuessMode: boolean` to `Settings`                                               |
| `src/stores/settings.store.ts`            | Add `noGuessMode`, `setNoGuessMode`                                                    |
| `src/components/modals/NewGameModal.tsx`  | Add "No guessing" checkbox                                                             |
| `src/components/modals/SettingsModal.tsx` | Add "No guessing" toggle                                                               |

---

## Phase 7 — Keyboard Navigation

### Features

**7.1 Board keyboard navigation**

- A focused cell concept: `focusedCell: [row, col] | null` in `ui.store.ts`.
- Arrow keys move focus; focus wraps at edges.
- `Space`: reveal focused cell.
- `F`: flag/unflag focused cell.
- `Enter`: chord click on focused cell.
- `Tab` / `Shift+Tab`: move focus between header buttons and board; first Tab into the board focuses the last-focused cell or `[0,0]`.
- Visual: `.cell-focused` CSS class adds a visible focus ring (1.5px inset ring using theme accent color).
- The board container has `tabIndex={0}` and a `keydown` listener in `useGameBoardLogic`.

**7.2 Key bindings configuration**

- New `KeyboardAction` type: `'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'reveal' | 'flag' | 'chord' | 'newGame'`.
- Default bindings stored in `src/constants/keyboard.constants.ts`.
- `keyboardBindings: Record<KeyboardAction, string>` added to `Settings` (with the defaults as initial value).
- New `KeyboardModal` component: opened via a "Keyboard Shortcuts" button inside `SettingsModal`.
- The modal shows a list of actions; clicking a row enters "recording" mode (displays "Press a key…"); the pressed key is saved. Escape cancels. Duplicate bindings show a warning.

### What changes

| File                                             | Change                                                       |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `src/types/settings.types.ts`                    | Add `KeyboardAction`, `keyboardBindings`                     |
| `src/constants/keyboard.constants.ts`            | New file — `DEFAULT_KEY_BINDINGS`                            |
| `src/stores/ui.store.ts`                         | Add `focusedCell`, `setFocusedCell`                          |
| `src/stores/settings.store.ts`                   | Add `keyboardBindings`, `setKeyBinding`                      |
| `src/components/board/useGameBoardLogic.ts`      | Add `keydown` handler; call `setFocusedCell` on arrow keys   |
| `src/components/board/Cell.tsx`                  | Accept and apply `isFocused` prop                            |
| `src/components/modals/KeyboardModal.tsx`        | New file                                                     |
| `src/components/modals/useKeyboardModalLogic.ts` | New file — recording mode state                              |
| `src/components/modals/SettingsModal.tsx`        | Add "Keyboard Shortcuts →" button that opens `KeyboardModal` |
| `src/styles/global.css`                          | `.cell-focused` styles                                       |

---

## Phase 8 — Performance: Web Worker & Canvas Rendering

### 8.1 Web Worker for board generation

**Problem today:**
Board generation (mine placement + flood-fill + adjacency calculation) runs synchronously on the main thread. For Beginner it's imperceptible (<1ms). For Expert with no-guess mode, 20 solver attempts × 480 cells × constraint passes = potentially 20–60ms of main-thread work. On a slow iPhone this is a dropped frame or a brief UI freeze when the user taps "Start".

**Solution:**
Move all board generation into `src/workers/board.worker.ts` using the browser's Web Worker API.

**How it works:**

- `board.worker.ts` imports `board.service.ts` (pure TypeScript, no DOM, compatible with worker context).
- The worker receives a message `{ config, firstClick, noGuess }` and responds with a message `{ board, minesRemaining }`.
- `game.store.ts` gains a new `'generating'` status. When the user starts a game, status immediately becomes `'generating'` (UI can show a brief spinner or just keep the board blank), then transitions to `'idle'` when the worker responds.
- Vite supports Web Workers natively via `new Worker(new URL('../workers/board.worker.ts', import.meta.url), { type: 'module' })`.

**Impact:**

- Beginner/Intermediate: no visible change (generation completes before next frame).
- Expert without no-guess: ~5–10ms saved from main thread.
- Expert with no-guess: potentially 20–60ms of blocking computation becomes zero UI impact.
- No-guess mode becomes viable even for slow devices.

### 8.2 Canvas rendering for large boards

**Problem today:**
Expert mode renders 480 `<button>` DOM elements. Each cell state change (reveal, flag, chord) causes React to diff and re-render the affected cells, then the browser re-paints. On mid-range iPhones this is fine at rest but can cause dropped frames during rapid chord chains or the mine cascade animation (Phase 1), where dozens of cells change state in rapid succession.

**Solution:**
For boards with more than ~250 cells (i.e., Expert and large custom boards), render the board onto a single `<canvas>` element instead of DOM buttons.

**How it works:**

- `GameBoard.tsx` checks `config.rows * config.cols > CANVAS_THRESHOLD` and renders either `<DomBoard>` (current behavior) or `<CanvasBoard>` (new).
- `CanvasBoard` draws all cells in a `requestAnimationFrame` loop. Each cell's visual state is derived from the `board` array, the same source of truth.
- Hit testing: on `touchstart`/`mousedown`, compute `Math.floor(x / cellSize)` and `Math.floor(y / cellSize)` to find the target cell. This replaces the per-button event listeners.
- The existing zoom/pan transform is applied to the canvas's 2D context (`ctx.setTransform(...)`).
- Accessibility: a parallel `role="grid"` with `aria-rowcount`/`aria-colcount` and hidden `role="gridcell"` elements provides screen reader access. Keyboard navigation (Phase 7) operates on this aria structure.

**Impact:**

- Reduces DOM node count from 480 to 1 for Expert boards.
- Eliminates React's virtual DOM diffing cost for cell updates; all rendering goes through one canvas redraw.
- Mine cascade animation (Phase 1) and chord ripple become visually smoother because the canvas draws all cells in one pass per frame rather than triggering dozens of individual DOM re-paints.
- `requestAnimationFrame` throttling means the game never renders faster than the screen refresh rate (~60fps), reducing CPU/battery usage during animations.

**Trade-offs and mitigations:**

- Canvas cells can't receive native browser focus — mitigated by the aria grid in Phase 7.
- Canvas drawing code is more verbose than JSX — mitigated by a `drawCell(ctx, cell, x, y, size, theme)` helper in `src/services/canvas.service.ts`.
- Pinch-to-zoom and pan need to be re-validated with the canvas transform — low risk since the transform math is the same.

### What changes

| File                                          | Change                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/workers/board.worker.ts`                 | New file — receives `{config, firstClick, noGuess}`, posts back `{board, minesRemaining}` |
| `src/stores/game.store.ts`                    | Add `'generating'` status; dispatch to worker; handle response                            |
| `src/services/canvas.service.ts`              | New file — `drawCell`, `drawBoard` helpers; theme-aware                                   |
| `src/components/board/CanvasBoard.tsx`        | New file — canvas-based board renderer                                                    |
| `src/components/board/useCanvasBoardLogic.ts` | New file — RAF loop, hit testing, zoom/pan on canvas                                      |
| `src/components/board/GameBoard.tsx`          | Conditional `DomBoard` vs `CanvasBoard` based on cell count                               |
| `src/constants/game.constants.ts`             | Add `CANVAS_THRESHOLD = 250`                                                              |

---

## Phasing summary

| Phase | Category            | Key deliverables                                                                      |
| ----- | ------------------- | ------------------------------------------------------------------------------------- |
| 1     | Animations & Visual | Bigger emoji, board entrance, chord ripple, mine cascade, confetti, smiley animations |
| 2     | Themes              | 5 new themes; visual theme picker in settings                                         |
| 3     | Mobile & UX         | Haptic feedback; swipe-to-flag; landscape sidebar reflow                              |
| 4     | Audio               | Proximity tones; cascade whoosh; sound themes                                         |
| 5     | Stats & History     | Game records; efficiency score; Recent tab; Statistics modal; heatmap                 |
| 6     | Gameplay            | No-guess mode via constraint-propagation solver                                       |
| 7     | Keyboard            | Full arrow-key navigation; configurable bindings modal                                |
| 8     | Performance         | Web Worker (board gen off main thread); Canvas rendering (Expert boards)              |

---

## New files summary

```
src/
├── types/
│   └── stats.types.ts
├── stores/
│   └── stats.store.ts
├── services/
│   ├── haptic.service.ts
│   └── canvas.service.ts
├── workers/
│   └── board.worker.ts
├── hooks/
│   └── (useLongPress.ts extended, no new file)
├── constants/
│   └── keyboard.constants.ts
├── utils/
│   └── date.utils.ts
├── styles/
│   └── themes/
│       ├── material.css
│       ├── aero.css
│       ├── pastel.css
│       ├── neon.css
│       └── aqua.css
└── components/
    ├── board/
    │   ├── CanvasBoard.tsx
    │   └── useCanvasBoardLogic.ts
    └── modals/
        ├── StatisticsModal.tsx
        ├── useStatisticsModalLogic.ts
        ├── KeyboardModal.tsx
        └── useKeyboardModalLogic.ts
```

---

## Testing strategy

Each phase ships with tests before merging to `main`:

- **Phase 1**: Visual regression is manual (animation review on device). Unit tests for `mineRevealOrder` sort logic. E2E: confetti canvas appears on win; banner still shows.
- **Phase 2**: Unit tests verify all 7 theme keys are valid in the type. E2E: theme switch applies correct `data-theme` attribute.
- **Phase 3**: Unit tests for haptic pattern definitions. E2E for swipe-to-flag. Manual landscape test on device.
- **Phase 4**: Unit tests for proximity frequency mapping. E2E: correct sound function called per mine count.
- **Phase 5**: Unit tests for all derived stat selectors (win rate, streak, heatmap normalization). E2E: Recent tab shows last game; stats update after completing a game.
- **Phase 6**: Unit tests are critical — `isBoardSolvable` needs extensive coverage (known solvable boards, known guess-required boards). Property-based test: generated no-guess boards must all pass the solver.
- **Phase 7**: E2E tests covering arrow key navigation, Space/F/Enter actions, key binding recording and persistence.
- **Phase 8**: Performance benchmarks (before/after main-thread time for Expert board generation). E2E: canvas board behaves identically to DOM board (same click-to-cell mapping).
