# Minesweeper PWA — v3 Plan: Code Quality, Performance & Architecture

## Overview

A comprehensive refactoring and improvement plan based on a full codebase audit. Addresses code smells, performance bottlenecks, missing validation, accessibility gaps, architectural improvements, and infrastructure hardening — without adding new features.

**Goal**: Improve readability, maintainability, performance, and correctness of the existing codebase.

**Note on React Compiler**: This project uses React Compiler v1.0 (Babel plugin) with the ESLint rule set to `'error'`. The compiler auto-memoizes components, callbacks, and values — `React.memo`, `useMemo`, and `useCallback` are unnecessary and intentionally absent. No phase in this plan introduces manual memoization.

---

## Phase 1 — Performance: Board Rendering Hot Path

The board renders up to 1500 cells (30×50 custom). Every optimization on the render/interaction path has outsized impact.

### 1.1 Event delegation on the board grid

**Files**: `src/components/board/GameBoard.tsx`, `src/components/board/useCellLogic.ts`

Currently, every Cell mounts 5 event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`, `onClick`, `onContextMenu`). On a 30×16 board, that's **2400 event listeners**.

Refactor to a single set of handlers on the grid container:

- Attach touch/click/contextmenu handlers to the grid `<div>`, not each `<button>`
- Determine which cell was tapped using `event.target` data attributes (`data-row`, `data-col`) or coordinate math from `cellSize`
- Cell becomes a pure display component with zero handlers
- **Impact**: 2400 listeners → 5 listeners. Eliminates per-cell closure allocation entirely.

### 1.2 Reduce full-board scans in store actions

**File**: `src/stores/game.store.ts`

`revealCell` and `chordClick` both run `checkWin(board)` and `checkLoss(board)` after every action. Each is a full O(rows×cols) scan.

- `checkLoss`: can be eliminated entirely — the board service already marks `isExploded` on the detonated cell. The store can check `if (newBoard[row]?.[col]?.isExploded)` in O(1) instead of scanning the whole board.
- `checkWin`: can be made incremental. Track `unrevealedSafeCount` in the store. Decrement when cells are revealed. Win when count hits 0. Avoids scanning 480 cells on every click.

### 1.3 Eliminate redundant deep copies in board service

**File**: `src/services/board.service.ts`

**Current chain** for first click: `placeMines` (1 deep copy) → `calculateAdjacentValues` (1 deep copy) → `revealCell` → `floodFill` (1 deep copy) = **3 full board copies**.

- Create `initializeBoard(config, safeRow, safeCol)` that does mine placement + adjacency calculation + first reveal in a single pass with one copy.
- For `toggleFlag`: deep-copies entire board to toggle one cell. Use sparse row copy instead: `board.map((row, i) => i === targetRow ? row.map((c, j) => j === targetCol ? { ...c, isFlagged: true } : c) : row)`.
- Same sparse optimization for `revealCell` when revealing a single numbered cell (line 234-239).

**Target**: First click goes from 3 copies to 1. Flag toggle avoids full copy entirely.

### 1.4 Replace `queue.shift()` with index-based BFS in `floodFill`

**File**: `src/services/board.service.ts`, line 158

`queue.shift()` is O(n) on arrays — each shift moves all remaining elements. For a large empty board where flood-fill visits hundreds of cells, this becomes quadratic.

Replace with a `queueIdx` pointer: `const entry = queue[queueIdx++]` — O(1) dequeue.

### 1.5 Batch state in `usePinchZoom`

**File**: `src/hooks/usePinchZoom.ts`

During a pinch gesture, lines 57-62 call `setScale()`, `setPanX()`, `setPanY()` separately — 3 state updates per touch move event, potentially 30+ events per second. React may batch these in event handlers, but within `onTouchMove` with refs it's not guaranteed.

Group into a single state object: `useState({ scale, panX, panY })` with a single `setState` call. Eliminates intermediate renders during gestures.

### 1.6 Sound service: handle closed AudioContext

**File**: `src/services/sound.service.ts`

`getCtx()` handles `suspended` state (line 8) but not `closed` state. On mobile Safari, backgrounding the tab can close the context. When the user returns, all sounds silently fail.

Add: `if (ctx.state === 'closed') { ctx = new AudioContext() }` before the suspend check.

---

## Phase 2 — Input Validation & Sanitization

All user inputs need defense-in-depth validation — HTML attributes are a hint, not a guarantee.

### 2.1 Custom game config: sanitize numeric inputs

**File**: `src/components/modals/useNewGameModalLogic.ts`

Current handlers do `Number(e.target.value)` then `clamp()`, but:

- `Number("")` → `0`, `Number("5.5")` → `5.5`, `Number("abc")` → `NaN`
- NaN passes through `Math.max`/`Math.min` unchanged, resulting in a NaN config

Add a `sanitizeInt` helper:

```ts
function sanitizeInt(raw: string, fallback: number, min: number, max: number): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}
```

Apply to all three inputs (rows, cols, mines). Use existing constants for bounds.

### 2.2 Validate config in `startNewGame`

**File**: `src/stores/game.store.ts`

`startNewGame` accepts any `BoardConfig` without validation. Add a guard at the store boundary:

```ts
function validateConfig(config: BoardConfig): BoardConfig {
  const rows = clamp(config.rows, MIN_ROWS, MAX_ROWS);
  const cols = clamp(config.cols, MIN_COLS, MAX_COLS);
  const maxMines = rows * cols - SAFE_ZONE_SIZE;
  const mines = clamp(config.mines, MIN_MINES, maxMines);
  return { rows, cols, mines };
}
```

This protects against both UI bugs and corrupted localStorage.

### 2.3 Validate board config in board service

**File**: `src/services/board.service.ts`

Add precondition checks to `createEmptyBoard` and `placeMines`:

- `rows > 0 && cols > 0` — reject zero/negative dimensions
- `mines <= rows * cols - SAFE_ZONE_SIZE` — reject impossible mine counts
- Throw descriptive errors rather than silently creating broken boards

### 2.4 Sanitize high score player name

**File**: `src/components/modals/useHighScorePromptLogic.ts`

Current: `name.trim() || 'Anonymous'` — no further sanitization.

Add:

- Strip control characters (U+0000–U+001F, U+007F–U+009F)
- Strip zero-width characters (U+200B, U+200C, U+200D, U+FEFF)
- Enforce max length in JS (not just HTML `maxLength` attribute): `name.slice(0, MAX_PLAYER_NAME_LENGTH)`
- Reject empty-after-trim names

React auto-escapes text content in JSX, so XSS via `<td>{entry.name}</td>` is safe. But control chars could break layout or display invisible names.

### 2.5 Schema validation on store hydration

**Files**: All stores with `persist` middleware

If localStorage is corrupted (manual edit, browser extension, version migration), the app crashes or behaves unpredictably. Add a `merge` function to each store's persist config:

**game.store** (highest priority — complex nested board structure):

```ts
merge: (persisted, current) => {
  if (!isValidGameState(persisted)) return current;
  return { ...current, ...persisted };
};
```

Validate:

- `board` is a 2D array with dimensions matching `config.rows × config.cols`
- Each cell has all required properties (`hasMine`, `isRevealed`, `isFlagged`, `isQuestionMark`, `value`, `isExploded`)
- `status` is one of `'idle' | 'playing' | 'won' | 'lost'`
- `elapsedSeconds` is a non-negative integer
- `config` passes `validateConfig` from 2.2

**leaderboard.store**:

- Each entry has `name: string`, `timeSeconds: positive number`, `date: string`
- Entries per board key ≤ `MAX_ENTRIES`
- Reject entries with non-finite timeSeconds

**settings.store**:

- `theme` is in the allowed set (`'xp' | 'dark'`)
- `flagMode` is in the allowed set
- `volume` is clamped to `[0, 1]`
- `soundEnabled` and `animationsEnabled` are booleans

### 2.6 Add `partialize` to settings and leaderboard stores

**Files**: `src/stores/settings.store.ts`, `src/stores/leaderboard.store.ts`

Currently these stores persist their action functions to localStorage (Zustand serializes everything by default). Add `partialize` to exclude functions — same pattern `game.store.ts` already uses:

```ts
partialize: (s) => ({
  theme: s.theme,
  flagMode: s.flagMode,
  soundEnabled: s.soundEnabled,
  volume: s.volume,
  animationsEnabled: s.animationsEnabled,
});
```

---

## Phase 3 — Architecture: Decompose Large Hooks

### 3.1 Split `useGameBoardLogic` into composable hooks

**File**: `src/components/board/useGameBoardLogic.ts`

This hook handles layout, zoom integration, and zoom reset on config change — it's small now, but on main branch it may be larger. The pattern should support composition.

If the main branch version handles keyboard navigation and animations too, extract:

- `useKeyboardNavigation()` — focused cell state, arrow key handling, enter/space actions
- `useGameAnimations()` — mine reveal lookups, chord ripple delays, animation timing

### 3.2 Extract post-reveal logic from game store

**File**: `src/stores/game.store.ts`

The win/loss detection + state update pattern after `revealCell` (lines 81-93) and after `chordClick` (lines 115-126) is duplicated. Extract:

```ts
function resolveStatus(board: Board): GameStatus {
  if (checkLoss(board)) return 'lost';
  if (checkWin(board)) return 'won';
  return 'playing';
}
```

Both actions become:

```ts
const newStatus = resolveStatus(newBoard);
set({
  board: newBoard,
  status: newStatus,
  minesRemaining: countRemainingFlags(newBoard, config.mines),
});
```

### 3.3 Consolidate modal management in UI store

**File**: `src/stores/ui.store.ts`

Currently has 6 open/close functions with manual mutual exclusion — each `open*` must close all other modals. Adding a modal requires editing every `open*` function.

Refactor to:

```ts
type ModalName = 'newGame' | 'settings' | 'leaderboard' | null;

interface UIState {
  activeModal: ModalName;
  resumePromptOpen: boolean;
  highScoreEntry: HighScoreEntry | null;
}

interface UIActions {
  openModal: (name: ModalName) => void;
  closeModal: () => void;
  // resume + high score stay separate (they're overlays, not exclusive)
}
```

Mutual exclusion is now automatic — only one `activeModal` can be set.

### 3.4 Decouple store cross-reads

**File**: `src/stores/game.store.ts`

If the main branch's `revealCell` calls `useSettingsStore.getState()` to read settings during an action, this is a hidden runtime dependency that doesn't appear in the function signature.

Pass settings as parameters to store actions from the component/hook level:

```ts
// Before (hidden coupling)
revealCell: (row, col) => {
  const { noGuessMode } = useSettingsStore.getState()
  ...
}

// After (explicit dependency)
revealCell: (row, col, options?: { noGuessMode?: boolean }) => { ... }
```

---

## Phase 4 — Deduplicate Derived State & Patterns

### 4.1 Create shared Zustand selectors

**File**: New file `src/stores/selectors.ts`

Several values are computed identically in multiple hooks:

```ts
// Repeated in useCellLogic.ts, and any canvas/keyboard logic
const isGameOver = status === 'won' || status === 'lost';
const allowQuestionMarks = flagMode === 'flags-and-questions';
```

Create shared selectors:

```ts
export const selectIsGameOver = (s: { status: GameStatus }) =>
  s.status === 'won' || s.status === 'lost';

export const selectAllowQuestionMarks = (s: { flagMode: FlagMode }) =>
  s.flagMode === 'flags-and-questions';
```

### 4.2 Create a `useSound` hook

**File**: New file `src/hooks/useSound.ts`

The pattern `if (soundEnabled) { playSound(name, volume) }` is repeated in:

- `useCellLogic.ts` (lines 38-42)
- `App.tsx` (lines 47-48, 55-56)

Extract:

```ts
export const useSound = () => {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const volume = useSettingsStore((s) => s.volume);
  return (name: SoundName) => {
    if (soundEnabled) playSound(name, volume);
  };
};
```

### 4.3 Create a `useHaptic` hook

**File**: New file `src/hooks/useHaptic.ts`

`navigator.vibrate?.(40)` is called directly in `useCellLogic.ts` line 61, bypassing any centralized control. Extract:

```ts
export const useHaptic = () => {
  // read hapticEnabled from settings if that setting exists
  return (pattern?: number | number[]) => {
    navigator.vibrate?.(pattern ?? HAPTIC_DURATION_MS);
  };
};
```

Centralizes the haptic constant, makes it testable, and provides a single place to add a settings toggle later.

### 4.4 Use `cn()` utility consistently

**File**: `src/components/board/useCellLogic.ts`, lines 96-104

Replace manual array filter/join with the project's existing `cn()` utility:

```ts
// Before
const containerClass = [
  'cell',
  isRaised ? 'cell-raised' : 'cell-revealed',
  isExploded ? 'cell-exploded' : '',
  ...
].filter(Boolean).join(' ')

// After
const containerClass = cn(
  'cell',
  isRaised ? 'cell-raised' : 'cell-revealed',
  isExploded && 'cell-exploded',
  (isGameOver || !isRaised) && 'cursor-default',
  !isGameOver && isRaised && 'cursor-pointer'
)
```

Audit all components for manual class concatenation and convert.

---

## Phase 5 — Extract Constants & Eliminate Magic Numbers

### 5.1 Create `src/constants/ui.constants.ts`

| Value  | Current Location          | Constant Name                                |
| ------ | ------------------------- | -------------------------------------------- |
| `0.65` | Cell.tsx:17               | `CELL_FONT_SCALE_NUMBER`                     |
| `0.72` | Cell.tsx:18               | `CELL_FONT_SCALE_ICON`                       |
| `40`   | useCellLogic.ts:61        | `HAPTIC_DURATION_MS`                         |
| `650`  | useLongPress.ts:9         | `LONG_PRESS_DELAY_MS`                        |
| `10`   | useLongPress.ts:49        | `TOUCH_MOVE_THRESHOLD_PX`                    |
| `1000` | useTimerLogic.ts          | `TIMER_INTERVAL_MS`                          |
| `20`   | HighScorePrompt.tsx       | `MAX_PLAYER_NAME_LENGTH`                     |
| `9`    | game.constants.ts comment | `SAFE_ZONE_SIZE` (first click + 8 neighbors) |

### 5.2 Create `src/constants/emoji.constants.ts`

`🚩`, `💣`, `?` are duplicated in `useCellLogic.ts` and smiley emojis in `useSmileyButtonLogic.ts`. Extract to shared constants.

### 5.3 Create `src/constants/storage.constants.ts`

```ts
export const STORAGE_KEYS = {
  game: 'minesweeper-game',
  settings: 'minesweeper-settings',
  leaderboard: 'minesweeper-leaderboard',
} as const;
```

Prevents typos and makes all persisted data discoverable from one place.

### 5.4 Extract cell coordinate encoding

The pattern `` `${r},${c}` `` for Map keys appears in multiple files. Create a utility:

```ts
// src/utils/cell.utils.ts
export const encodeCellKey = (r: number, c: number): string => `${r},${c}`;
```

Single place to change if encoding ever needs to change. Documents the convention.

### 5.5 Move preset data to constants

**File**: `src/components/modals/useNewGameModalLogic.ts`

The PRESETS array and `detectCurrentPreset()` function live inside the modal logic hook. Move to `game.constants.ts` where `DIFFICULTY_PRESETS` already lives.

---

## Phase 6 — Error Handling & Resilience

### 6.1 Add React Error Boundary

**File**: New file `src/components/ErrorBoundary.tsx`

No error boundary exists. If any component throws during render, the entire app goes white. Add a boundary that:

- Catches render errors
- Shows a "Something went wrong" message with a "New Game" button
- Resets game state on recovery
- Logs the error (console in dev)

### 6.2 Consistent error handling strategy for services

**File**: `src/services/sound.service.ts`

Current catch-all at line 146:

```ts
} catch {
  // AudioContext may not be available (e.g. in tests) — fail silently
}
```

This swallows ALL errors, including actual bugs. Instead:

- Catch specifically `DOMException` for AudioContext unavailability
- Log unexpected errors in development (`import.meta.env.DEV && console.warn(...)`)
- Same pattern for haptic service

### 6.3 Guard against localStorage exceptions

**Files**: All stores with `persist`

`localStorage.setItem` can throw `QuotaExceededError` if storage is full (5-10MB limit). Zustand's persist middleware doesn't catch this by default.

Add a custom `storage` adapter:

```ts
storage: {
  getItem: (name) => {
    try { return JSON.parse(localStorage.getItem(name) ?? 'null') }
    catch { return null }
  },
  setItem: (name, value) => {
    try { localStorage.setItem(name, JSON.stringify(value)) }
    catch { /* storage full — degrade gracefully */ }
  },
  removeItem: (name) => {
    try { localStorage.removeItem(name) }
    catch { /* ignore */ }
  },
}
```

### 6.4 Fix eslint-disable comments in App.tsx

**File**: `src/App.tsx`, lines 43, 59

Both `useEffect` hooks suppress `react-hooks/exhaustive-deps`. Instead:

- **Line 43** (resume prompt on mount): Use a ref to capture `openResumePrompt` and `status` at mount time without depending on them:

  ```ts
  const mountRef = useRef({ status, openResumePrompt });
  useEffect(() => {
    if (mountRef.current.status === 'playing') {
      mountRef.current.openResumePrompt();
    }
  }, []);
  ```

- **Line 59** (win/loss effect): Extract into a dedicated `useGameStatusEffect` hook that properly manages all deps without suppression.

---

## Phase 7 — Accessibility (a11y)

### 7.1 Add semantic landmarks

**File**: `src/App.tsx`

- Wrap game window in `<main>` element
- Add `role="application"` to the game board (signals complex interactive widget to screen readers)
- Add a visually-hidden skip link: "Skip to game board"

### 7.2 Improve Cell accessibility

**File**: `src/components/board/Cell.tsx`

Current: `aria-label={`Cell ${row},${col}`}` — coordinates alone are not useful.

Better: include cell state in the label:

- `"Row 3, Column 5: unrevealed"`
- `"Row 3, Column 5: flagged"`
- `"Row 3, Column 5: 3 adjacent mines"`
- `"Row 3, Column 5: mine — exploded"`

Add `role="gridcell"` to cells and `role="grid"` to the board container.

### 7.3 Add `aria-live` to dynamic displays

**File**: `src/components/ui/LcdDisplay.tsx`

Mine counter and timer update dynamically. Add `aria-live="polite"` and `aria-atomic="true"` so screen readers announce the full value on change.

### 7.4 Leaderboard table accessibility

**File**: `src/components/modals/LeaderboardModal.tsx`

- Add `<caption>` to the scores table
- Add `aria-current="true"` on the active difficulty tab
- Follow WAI-ARIA tab pattern: `role="tablist"`, `role="tab"`, `role="tabpanel"`

### 7.5 Form labeling

**File**: `src/components/modals/HighScorePrompt.tsx`

Ensure the name input has an explicit `<label htmlFor="...">` element, not just text above it.

---

## Phase 8 — Additional Performance Improvements

### 8.1 Replace `as React.CSSProperties` with proper typing

**File**: `src/components/board/Cell.tsx`

The `style` prop uses `as React.CSSProperties` to allow custom CSS properties (`--cell-row`, `--cell-col`). This bypasses type checking on the entire object.

Use a proper intersection type instead:

```ts
style={{ width: cellSize, height: cellSize, fontSize } as React.CSSProperties & Record<`--${string}`, string | number>}
```

Or define a typed style interface.

### 8.2 Avoid empty Map allocation when animations disabled

**File**: `src/components/board/useGameBoardLogic.ts` (main branch)

If animations are disabled, the code creates `new Map<string, number>()` on every render as a fallback. Instead, use a module-level constant:

```ts
const EMPTY_MAP = new Map<string, number>();
```

React Compiler will likely optimize this anyway, but the intent is clearer.

### 8.3 Timer interval stability

**File**: `src/components/header/useTimerLogic.ts`

The `useEffect` depends on `tick` (a store action). Zustand selectors for actions return stable references, so this should be fine. But verify: if `tick` reference changes on any store update, the interval would thrash (clear + recreate on every board action).

If this is happening, stabilize by selecting `tick` once at the module level:

```ts
const tick = useGameStore.getState().tick;
```

Or use a ref to hold the current tick function.

---

## Phase 9 — Test Coverage Gaps

### 9.1 Missing test files

| File                                     | Priority | What to test                                                      |
| ---------------------------------------- | -------- | ----------------------------------------------------------------- |
| `src/App.tsx`                            | Medium   | Theme application, resume prompt on mount, win/loss sound effects |
| `src/hooks/useGameLayout.ts`             | Medium   | Responsive sizing, window resize handling                         |
| `src/components/header/Timer.tsx`        | Medium   | Interval start/stop on game status changes                        |
| `src/stores/ui.store.ts`                 | Medium   | Modal mutual exclusion, high score prompt flow                    |
| `src/components/board/GameBoard.tsx`     | Low      | Grid rendering, zoom integration                                  |
| `src/components/modals/ResumePrompt.tsx` | Low      | Resume/new game button behavior                                   |
| `src/services/sound.service.ts`          | Low      | AudioContext lifecycle, closed context recovery                   |

### 9.2 Add store integration tests

Currently stores and services are tested in isolation. Add integration tests that verify the full flow:

- First click → mine placement → reveal → win/loss detection (through store)
- Win → high score check → name prompt → leaderboard entry saved
- Corrupted localStorage → graceful fallback to defaults (tests hydration validation from Phase 2.5)

### 9.3 Add input validation tests

Test all sanitization from Phase 2:

- NaN, Infinity, negative, float, empty string inputs to game config
- Control characters, zero-width chars, oversized names in high score prompt
- Corrupted localStorage payloads for each store

### 9.4 Enforce coverage thresholds

**File**: `vitest.config.ts`

```ts
coverage: {
  thresholds: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  }
}
```

---

## Phase 10 — Infrastructure & CI/CD

### 10.1 Add dependency audit to CI

**File**: `.github/workflows/deploy.yml`

```yaml
- name: Audit dependencies
  run: pnpm audit --audit-level=high
```

### 10.2 Add bundle size tracking

Add `rollup-plugin-visualizer` for on-demand analysis:

```json
"analyze": "ANALYZE=true pnpm build"
```

### 10.3 Add HTML coverage reporter

**File**: `vitest.config.ts` — add `'html'` to coverage reporters for local development.

### 10.4 Add Dependabot config

Create `.github/dependabot.yml` for weekly npm dependency update PRs.

### 10.5 Add explicit `type-check` script

**File**: `package.json`

```json
"type-check": "tsc --noEmit"
```

Run in CI alongside lint. Currently type-checking only happens during build.

---

## Phase 11 — Minor Cleanups

### 11.1 Update stale PLAN.md references

**File**: `docs/PLAN.md`

Project structure section references files that no longer exist:

- `Select.tsx` → now `RadioGroup.tsx`
- `storage.service.ts` → doesn't exist (Zustand persist handles this)
- Missing actual files: `ui.store.ts`, `haptic.service.ts`, etc.

Update to match actual file tree.

### 11.2 Remove `as` type assertion in settings modal

**File**: `src/components/modals/SettingsModal.tsx`

`setTheme(v as typeof theme)` — unsafe cast. Instead, validate the value:

```ts
const validThemes = new Set<Theme>(['xp', 'dark']);
const onThemeChange = (v: string) => {
  if (validThemes.has(v as Theme)) setTheme(v as Theme);
};
```

Or use a type guard function.

---

## Implementation Order

| Phase | Description                            | Impact | Risk   | Effort |
| ----- | -------------------------------------- | ------ | ------ | ------ |
| 1     | Performance: hot path                  | High   | Medium | Medium |
| 2     | Input validation & sanitization        | High   | Low    | Medium |
| 3     | Architecture: decompose hooks & stores | Medium | Medium | Medium |
| 4     | Deduplicate derived state & patterns   | Medium | Low    | Small  |
| 5     | Constants & magic numbers              | Medium | Low    | Small  |
| 6     | Error handling & resilience            | High   | Low    | Medium |
| 7     | Accessibility                          | High   | Low    | Medium |
| 8     | Additional performance                 | Low    | Low    | Small  |
| 9     | Test coverage                          | Medium | Low    | Large  |
| 10    | Infrastructure & CI/CD                 | Low    | Low    | Small  |
| 11    | Minor cleanups                         | Low    | Low    | Small  |

**Recommended PR strategy**:

- PR 1: Phases 1-2 (performance + validation — the high-impact work)
- PR 2: Phases 3-5 (architecture + dedup + constants — structural cleanup)
- PR 3: Phase 6 (error handling — standalone concern)
- PR 4: Phase 7 (accessibility — standalone concern)
- PR 5: Phases 8-11 (remaining improvements, batched)

---

## What This Plan Does NOT Include

- New features (themes, stats page, canvas renderer, etc.)
- UI redesign or visual changes
- Dependency upgrades (React 20, Vite 8, etc.)
- Build tool migration
- Manual memoization (React Compiler handles this)

This is purely a quality, correctness, and maintainability investment.
