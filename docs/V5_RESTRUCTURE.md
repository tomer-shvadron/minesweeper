# V5 — Code Restructure Plan

No new features, no bug fixes. Code quality, reuse, maintainability, and future-proofing only.

---

## Sub-tasks (ordered, incremental)

### v5.1 — Shared UI primitives: `<ResponsiveModal>` + `<TabBar>`

**Goal:** Eliminate the 3-mode layout duplication and tab rendering duplication.

#### `<ResponsiveModal>` (`src/components/ui/ResponsiveModal.tsx`)

Extract a single wrapper that selects `Modal | BottomSheet | RightSheet` based on `layoutMode`.

```tsx
interface ResponsiveModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  layoutMode: LayoutMode;
  children: React.ReactNode;
  /** Desktop Modal className override (e.g., custom width/height) */
  modalClassName?: string;
}
```

- Internally renders `<Modal>`, `<BottomSheet>`, or `<RightSheet>` based on `layoutMode`.
- All props pass through to the underlying component.
- Replaces the `if/else` layout blocks in: `SettingsModal`, `StatisticsModal`, `LeaderboardModal`, `HighScorePrompt`.
- Also wire `NewGameModal`, `KeyboardModal`, and `ResumePrompt` through this wrapper (they currently use `<Modal>` only — add 3-mode behavior).

#### `<TabBar>` (`src/components/ui/TabBar.tsx`)

Extract the underline-style tab bar used by Statistics and Leaderboard modals.

```tsx
interface TabBarProps<T extends string> {
  tabs: readonly T[];
  selectedTab: T;
  onTabChange: (tab: T) => void;
  tabLabel: (tab: T) => string;
}
```

- Renders the `flex border-b` container with `role="tablist"`.
- Each tab: `flex-1`, underline `box-shadow` when active, muted text when inactive.
- Full a11y: `role="tab"`, `aria-selected`.
- When `tabs.length === 1`, render nothing (single-tab modals like NewGame, Keyboard, Resume don't show a tab bar).

#### Files touched

- **New:** `src/components/ui/ResponsiveModal.tsx`, `src/components/ui/TabBar.tsx`
- **Modified:** `SettingsModal.tsx`, `StatisticsModal.tsx`, `LeaderboardModal.tsx`, `HighScorePrompt.tsx`, `NewGameModal.tsx`, `KeyboardModal.tsx`, `ResumePrompt.tsx`
- **Modified (logic hooks):** `useNewGameModalLogic.ts`, `useKeyboardModalLogic.ts`, `useResumePromptLogic.ts` — add `useGameLayout()` + return `layoutMode`
- **Tests:** Update all modal tests; extract shared mock helpers (see v5.5)

---

### v5.2 — Service refactors: board split + sound config-driven + canvas constants

#### Board service split

Split `board.service.ts` (521 lines) into 3 focused files:

| New file                  | Contents                                                                                                                   | ~Lines |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------ |
| `board-core.service.ts`   | `createEmptyBoard`, `createBoardKey`, `placeMines`, `calculateAdjacentValues`, `getNeighborCoords`, `deepCopyBoard`        | ~180   |
| `board-reveal.service.ts` | `revealCell`, `floodFill`, `chordReveal`, `toggleFlag`, `countNewlyRevealed`, `countRemainingFlags`, `countUnrevealedSafe` | ~200   |
| `board-solver.service.ts` | `isBoardSolvable` (backtracking constraint solver)                                                                         | ~140   |

- `board-reveal.service.ts` imports helpers from `board-core.service.ts`.
- `board-solver.service.ts` imports `getNeighborCoords` from `board-core.service.ts`.
- Create `src/services/index.ts` barrel export so existing consumers (`game.store.ts`, tests) can import from `@/services/board-core.service` etc., or from a barrel if preferred.
- **No barrel file** — consumers import directly from the specific service file (matches existing pattern).

#### Sound service — config-driven refactor

Refactor `sound.service.ts` (475 lines) from duplicated per-theme functions to a config-driven architecture:

```ts
interface SoundConfig {
  reveal: { freqMap: Record<number, number>; volMult: number; dur: number; wave: OscillatorType };
  flag: { freq: number; volMult: number; dur: number };
  unflag: { freq: number; volMult: number; dur: number };
  win: { freqs: number[]; volMult: number; noteDur: number };
  explode: { volMult: number; dur: number };
  chord: { freq: number; volMult: number; dur: number };
}

const SOUND_CONFIGS: Record<SoundTheme, SoundConfig> = {
  classic: { ... },
  arcade: { ... },
  minimal: { ... },
  starwars: { ... },
};
```

- Shared `playTone(ctx, config, masterGain)` helper eliminates duplicated envelope-ramping code.
- Each `playXxx` function reads from `SOUND_CONFIGS[theme]` instead of branching.
- Expected reduction: ~30% fewer lines, single source of truth for tuning.

#### Canvas service — extract magic numbers + CSS caching

- Move hardcoded values to `ui.constants.ts`:
  - `CELL_BORDER_WIDTH_RATIO = 0.08`
  - `CELL_BORDER_RADIUS = 6`
  - (Font scales `0.65`, `0.72` already exist as `CELL_FONT_SCALE_NUMBER`, `CELL_FONT_SCALE_ICON` — just import them)
- Cache CSS variable reads: create a `canvasThemeCache` object that reads all `--color-*` vars once, invalidated by a `MutationObserver` on `<body>` `data-theme` attribute changes (or a simple theme-change callback from the settings store subscription).

#### Files touched

- **New:** `board-core.service.ts`, `board-reveal.service.ts`, `board-solver.service.ts`
- **Deleted:** `board.service.ts` (split into above)
- **Modified:** `sound.service.ts` (rewritten internals), `canvas.service.ts` (constants + cache), `ui.constants.ts` (new constants)
- **Modified (consumers):** `game.store.ts`, board generation worker — update imports
- **Tests:** Update board service test imports; sound service tests may need adjustment

---

### v5.3 — Store improvements: shared persistence helper + selector batching + stats optimization

#### Shared persistence validation

All 4 persisted stores (game, settings, leaderboard, stats) implement similar validation-and-merge patterns. Extract:

```ts
// src/stores/persist-helpers.ts
export function createSafeMerge<T>(
  validator: (persisted: unknown) => persisted is Partial<T>,
  defaults: T
): (persisted: unknown, current: T) => T;
```

Each store replaces its inline `merge` function with `createSafeMerge(isValidPersistedX, initialState)`.

#### Zustand `useShallow` batching

Replace verbose individual selectors in `useSettingsModalLogic.ts` (12+ `useSettingsStore` calls) with `useShallow`:

```ts
// Before (12 hook calls)
const theme = useSettingsStore((s) => s.theme);
const colorMode = useSettingsStore((s) => s.setColorMode);
// ...

// After (1 hook call)
const { theme, colorMode, ... } = useSettingsStore(
  useShallow((s) => ({ theme: s.theme, colorMode: s.colorMode, ... }))
);
```

Apply this pattern to all logic hooks with 4+ selector calls from the same store.

#### Stats store — single-pass aggregation

Replace the multiple independent `records.filter(r => r.boardKey === key)` calls in `getWinRate`, `getAverageTime`, `getBestTime`, `getCurrentStreak`, `getBestStreak` with a single `getStatsForBoard(boardKey)` that does one pass and returns all computed stats.

```ts
interface BoardStats {
  winRate: number;
  averageTime: number;
  bestTime: number;
  currentStreak: number;
  bestStreak: number;
  totalTimePlayed: number;
  gamesPlayed: number;
}

getStatsForBoard: (boardKey: BoardKey): BoardStats => {
  /* single pass */
};
```

#### Files touched

- **New:** `src/stores/persist-helpers.ts`
- **Modified:** `game.store.ts`, `settings.store.ts`, `leaderboard.store.ts`, `stats.store.ts` (use shared merge helper)
- **Modified:** `useSettingsModalLogic.ts`, `useLeaderboardModalLogic.ts`, `useStatisticsModalLogic.ts` (useShallow)
- **Modified:** `stats.store.ts` (single-pass aggregation)
- **Tests:** Update stats store tests for new `getStatsForBoard` API

---

### v5.4 — Constants, types, and utilities consolidation

#### Centralize gesture constants

Move hardcoded values from hooks into `ui.constants.ts`:

```ts
// From useLongPress.ts
export const SWIPE_DOWN_THRESHOLD = 15;
export const SWIPE_TIME_WINDOW = 300;
export const PAN_OVERRIDE_DISTANCE = 30;
export const INITIAL_MOVE_THRESHOLD = 8;

// From usePinchZoom.ts
export const PAN_THRESHOLD = 12;
```

#### Type organization

- Move `HighScoreEntry` from `ui.store.ts` to `types/leaderboard.types.ts`.
- Add `types/ui.types.ts` if any UI-specific types emerge during refactoring.

#### Shared `tabLabel` utility

Extract duplicated `tabLabel()` functions from `useStatisticsModalLogic.ts` and `LeaderboardModal.tsx` into:

```ts
// src/utils/board.utils.ts
export function formatBoardKeyLabel(key: BoardKey): string {
  const PRESET_LABELS: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    expert: 'Expert',
  };
  return PRESET_LABELS[key] ?? `Custom (${key})`;
}
```

#### Files touched

- **New:** `src/utils/board.utils.ts`
- **Modified:** `ui.constants.ts`, `useLongPress.ts`, `usePinchZoom.ts` (import constants)
- **Modified:** `types/leaderboard.types.ts` (add HighScoreEntry), `ui.store.ts` (import it)
- **Modified:** `useStatisticsModalLogic.ts`, `LeaderboardModal.tsx` (use shared `formatBoardKeyLabel`)

---

### v5.5 — Test organization: shared helpers, mocks, and cleanup

#### Shared test infrastructure

Create reusable test utilities:

```
src/test/
├── helpers/
│   ├── render-helpers.ts    # custom render wrapper if needed
│   └── store-helpers.ts     # createMockStore(), resetAllStores()
├── mocks/
│   ├── game.mock.ts         # mockGameStore defaults + factory
│   ├── settings.mock.ts     # mockSettingsStore defaults + factory
│   ├── ui.mock.ts           # mockUIStore defaults + factory
│   ├── leaderboard.mock.ts  # mockLeaderboardStore defaults + factory
│   ├── stats.mock.ts        # mockStatsStore defaults + factory
│   ├── layout.mock.ts       # mockUseGameLayout defaults
│   └── cell.mock.ts         # unrevealed(), revealed(), flagged() cell factories
└── setup.ts                 # existing (ResizeObserver mock)
```

#### Mock factory pattern

Replace the repeated "mutable `let` + `vi.mock` factory" pattern with a reusable helper:

```ts
// src/test/mocks/game.mock.ts
export const defaultGameState = {
  status: 'idle' as const,
  config: DIFFICULTY_PRESETS.beginner,
  board: [],
  // ...
};

export const createGameStoreMock = (overrides?: Partial<typeof defaultGameState>) => {
  const state = { ...defaultGameState, ...overrides };
  return {
    useGameStore: (selector: (s: typeof state) => unknown) => selector(state),
    state, // expose for mutation in tests
  };
};
```

#### Cell factories

Extract from `Cell.test.tsx` into `src/test/mocks/cell.mock.ts`:

```ts
export const unrevealed = (overrides?: Partial<CellState>): CellState => ({
  value: 0,
  isRevealed: false,
  isFlagged: false,
  isQuestion: false,
  hasMine: false,
  ...overrides,
});
export const revealed = (value: CellValue = 0): CellState => ({
  ...unrevealed(),
  isRevealed: true,
  value,
});
export const flagged = (): CellState => ({ ...unrevealed(), isFlagged: true });
export const mine = (): CellState => ({ ...unrevealed(), hasMine: true });
```

#### Files touched

- **New:** All files in `src/test/helpers/` and `src/test/mocks/`
- **Modified:** All existing test files to import from shared mocks/helpers
- Reduce per-test boilerplate by ~30-50%

---

### v5.6 — CSS-to-Tailwind migration + touch-drag hook extraction

#### Migrate global CSS classes to Tailwind-in-JSX

Audit `src/styles/global.css` and migrate all classes that can be expressed as Tailwind utilities into the components that use them:

| CSS class            | Target component(s)                              | Action                                                                          |
| -------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `.modal-backdrop`    | Modal, BottomSheet, RightSheet → ResponsiveModal | Inline as Tailwind classes                                                      |
| `.modal-window`      | Modal, BottomSheet, RightSheet → ResponsiveModal | Inline as Tailwind classes                                                      |
| `.modal-title-bar`   | Modal, BottomSheet, RightSheet → ResponsiveModal | Inline as Tailwind classes                                                      |
| `.modal-close-btn`   | Modal, BottomSheet, RightSheet → ResponsiveModal | Inline as Tailwind classes                                                      |
| `.game-over-overlay` | GameOverBanner                                   | Inline as Tailwind classes                                                      |
| `.game-over-card`    | GameOverBanner                                   | Inline as Tailwind classes (keep `backdrop-filter` if not possible in Tailwind) |
| `.input-field`       | NewGameModal, HighScorePrompt                    | Inline as Tailwind classes                                                      |
| `.scores-table`      | LeaderboardModal                                 | Inline as Tailwind classes                                                      |
| `.cell`              | Cell, CanvasBoard                                | Keep — complex touch-action + animation states                                  |

**Keep in CSS only:** Animation `@keyframes`, complex selectors (`.board--entering .cell:nth-child()`), `data-theme` variable definitions, and anything that can't be expressed as Tailwind utilities.

#### Extract `useDragDismiss` hook

`BottomSheet.tsx` and `RightSheet.tsx` share nearly identical touch drag-to-dismiss logic differing only in axis and animation direction. Extract:

```ts
// src/hooks/useDragDismiss.ts
interface DragDismissOptions {
  axis: 'x' | 'y';
  threshold: number; // px to trigger dismiss (currently 100)
  onDismiss: () => void;
}

export function useDragDismiss({ axis, threshold, onDismiss }: DragDismissOptions) {
  const sheetRef = useRef<HTMLDivElement>(null);
  // ... shared drag logic
  return { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd };
}
```

#### Files touched

- **New:** `src/hooks/useDragDismiss.ts`
- **Modified:** `BottomSheet.tsx`, `RightSheet.tsx` (use hook instead of inline drag logic)
- **Modified:** `global.css` (remove migrated classes)
- **Modified:** All components that used the removed CSS classes (inline Tailwind instead)

---

### v5.7 — Cleanup pass + PLAN.md update

#### Final sweep

- Remove any unused imports surfaced by the refactors.
- Verify all `eslint-disable` comments are still necessary; remove any that aren't.
- Run full `tsc --noEmit`, `eslint src/`, `vitest run` — everything green.
- Update `docs/PLAN.md` project structure section to reflect the new file organization.

#### Update PLAN.md

- Update the project structure tree.
- Add v5 to the build phases section.
- Update the naming conventions if any changed.

---

## Execution order rationale

1. **v5.1 first** — `ResponsiveModal` and `TabBar` are the highest-impact extractions, touching the most files. Getting these right first simplifies all subsequent modal work.
2. **v5.2 next** — Service refactors are independent of UI changes and can be verified with existing tests.
3. **v5.3 after services** — Store improvements build on the cleaner service imports.
4. **v5.4 small wins** — Constants/types/utils consolidation is low-risk, high-clarity.
5. **v5.5 before CSS migration** — Having clean test infrastructure makes it safe to refactor CSS (tests catch visual regressions).
6. **v5.6 last major** — CSS migration + drag hook are the riskiest changes; by now everything else is stable and well-tested.
7. **v5.7 always last** — Final verification and documentation.

---

## Success criteria

- [ ] Zero new warnings from `tsc --noEmit`
- [ ] Zero new warnings from `eslint src/`
- [ ] All 618+ tests pass
- [ ] No CSS class in `global.css` that could be Tailwind-in-JSX
- [ ] No duplicated layout selection logic across modals
- [ ] No duplicated tab rendering logic across modals
- [ ] No magic numbers in services or hooks
- [ ] Shared test mocks reduce per-test boilerplate by ~30%+
- [ ] `board.service.ts` split into 3 files, each <250 lines
- [ ] `sound.service.ts` config-driven, no duplicated theme functions
