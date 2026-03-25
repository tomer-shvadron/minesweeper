# Minesweeper PWA — Project Plan

## Overview

A classic Microsoft XP-style Minesweeper game built as a Progressive Web App (PWA).
Installable on iPhone via Safari → "Add to Home Screen". Works fully offline (flights, no internet needed).
Hosted free on GitHub Pages: `tomer-shvadron.github.io/minesweeper`

---

## Tech Stack

| Layer           | Choice                                                                 | Notes                                                    |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Language        | TypeScript (strict)                                                    | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Framework       | React 19 + React Compiler 1.0                                          | Babel-based; SWC is incompatible with React Compiler     |
| Build           | Vite + `@vitejs/plugin-react`                                          | With `reactCompilerPreset`                               |
| Styling         | Tailwind v4 + `prettier-plugin-tailwindcss`                            | CSS custom properties for theming                        |
| State           | Zustand with persist middleware                                        | Per-store localStorage persistence                       |
| PWA             | `vite-plugin-pwa`                                                      | Service worker + manifest.json                           |
| Tests           | Vitest + React Testing Library                                         | Extensive — especially game logic                        |
| Linting         | ESLint (typescript-eslint strict, react-compiler, tailwindcss, import) |                                                          |
| Formatting      | Prettier + `prettier-plugin-tailwindcss`                               | Auto-sorts Tailwind classes                              |
| Pre-commit      | Husky + lint-staged                                                    | ESLint + Prettier on staged files                        |
| Package manager | pnpm                                                                   | All scripts: `pnpm dev`, `pnpm test`, `pnpm build`       |
| CI/CD           | GitHub Actions → GitHub Pages                                          | Triggers on push to `main`                               |

---

## Features (v1)

### Gameplay

- Classic Microsoft XP Minesweeper look and feel
- 3 difficulty presets:
  - Beginner: 9×9, 10 mines
  - Intermediate: 16×16, 40 mines
  - Expert: 30×16, 99 mines
- Custom board size and mine count
- First-click safety: mines placed after first tap (guaranteed safe first click)
- Flood-fill reveal for empty cells
- Chord clicking: tap a revealed number with correct adjacent flag count → auto-reveals remaining neighbors
- Flag mode: tap to reveal, long-press to flag (configurable: flags only (default) or flags + question marks)

### Header

- Smiley face reset button (reacts to game state: 🙂 idle/playing, 😮 nervous on press, 😎 won, 😵 lost)
- Mine counter (remaining unflagged mines)
- Elapsed timer (starts on first tap)

### Settings Modal

- Difficulty selector (3 presets + custom size/mines input)
- Theme selector (Classic XP, Dark — more themes in future versions)
- Flag mode toggle: flags only / flags + question marks
- Sound effects toggle (on/off) + volume slider
- Animations toggle (on/off)

### Leaderboard

- Per board configuration: `beginner`, `intermediate`, `expert`, `{cols}x{rows}x{mines}` for custom
- Top 10 times per board configuration
- Prompts for player name/nickname on new high score
- Accessible from header

### Resume Last Game

- Unfinished games are automatically saved to localStorage
- On app launch, prompts to resume if an unfinished game exists

### Mobile (iOS)

- Portrait and landscape — board scales to fit screen, no scrolling needed
- Pinch-to-zoom on the board (essential for large custom boards)
- Double-tap zoom disabled (`touch-action: manipulation`)
- Long-press for flagging
- Minimum 44px tap targets

### PWA

- Installable via Safari → "Add to Home Screen"
- Full offline support via service worker
- No browser chrome when launched from home screen
- Proper app icon and splash screen

---

## Themes

Implemented via CSS custom properties on `data-theme` attribute on `<body>`.

### v1 Themes

- **Classic XP**: Gray beveled cells, LCD mine counter font, classic palette
- **Dark**: Dark background, muted colors, adapted shadows

### Future Themes

- Star Wars (Death Star mine, lightsaber flag, space palette)
- Others TBD

---

## Project Structure

```
minesweeper/
├── .github/
│   └── workflows/
│       └── deploy.yml              # push to main → build + deploy to GH Pages
├── public/
│   ├── icons/                      # PWA icons (192px, 512px, maskable)
│   └── sounds/                     # click.mp3, flag.mp3, explode.mp3, win.mp3
├── src/
│   ├── components/
│   │   ├── board/
│   │   │   ├── GameBoard.tsx
│   │   │   ├── useGameBoardLogic.ts
│   │   │   ├── Cell.tsx
│   │   │   └── useCellLogic.ts
│   │   ├── header/
│   │   │   ├── Header.tsx
│   │   │   ├── useHeaderLogic.ts
│   │   │   ├── MineCounter.tsx
│   │   │   ├── useMineCounterLogic.ts
│   │   │   ├── Timer.tsx
│   │   │   ├── useTimerLogic.ts
│   │   │   ├── SmileyButton.tsx
│   │   │   └── useSmileyButtonLogic.ts
│   │   ├── modals/
│   │   │   ├── SettingsModal.tsx
│   │   │   ├── useSettingsModalLogic.ts
│   │   │   ├── LeaderboardModal.tsx
│   │   │   ├── useLeaderboardModalLogic.ts
│   │   │   ├── NewGameModal.tsx
│   │   │   └── useNewGameModalLogic.ts
│   │   └── ui/                     # generic primitives — no game logic
│   │       ├── Button.tsx          # base — used by SmileyButton, modal actions, etc.
│   │       ├── Modal.tsx           # base — used by all modals
│   │       ├── Slider.tsx          # volume control in settings
│   │       ├── Toggle.tsx          # sound/animation toggles
│   │       └── Select.tsx          # difficulty selector
│   ├── stores/
│   │   ├── game.store.ts           # board state, game status, actions
│   │   ├── settings.store.ts       # theme, sound, volume, animations, flag mode
│   │   └── leaderboard.store.ts    # scores per board config
│   ├── services/
│   │   ├── board.service.ts        # pure TS: board gen, mine placement, reveal, flood-fill, chord
│   │   ├── sound.service.ts        # audio playback, volume, mute
│   │   └── storage.service.ts      # typed localStorage wrapper
│   ├── hooks/                      # generic, reusable hooks
│   │   ├── useLongPress.ts
│   │   └── usePinchZoom.ts
│   ├── types/
│   │   ├── game.types.ts
│   │   ├── settings.types.ts
│   │   └── leaderboard.types.ts
│   ├── constants/
│   │   ├── game.constants.ts       # difficulty presets, board limits
│   │   └── theme.constants.ts      # theme CSS variable maps
│   ├── styles/
│   │   ├── themes/
│   │   │   ├── xp.css
│   │   │   └── dark.css
│   │   └── global.css
│   ├── utils/
│   │   └── time.utils.ts
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── services/
│   │   └── board.service.test.ts   # board gen, reveal, flood-fill, chord, win/loss detection
│   ├── stores/
│   │   └── game.store.test.ts
│   └── components/
│       └── Cell.test.tsx
├── docs/
│   └── PLAN.md                     # this file
├── .husky/
│   └── pre-commit                  # runs lint-staged
├── .eslintrc.ts
├── .prettierrc
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Naming Conventions

| Thing                | Convention                                  | Example                   |
| -------------------- | ------------------------------------------- | ------------------------- |
| Components           | `PascalCase.tsx`                            | `SmileyButton.tsx`        |
| Component logic hook | `usePascalCaseLogic.ts` (co-located)        | `useSmileyButtonLogic.ts` |
| General hooks        | `useCamelCase.ts` in `src/hooks/`           | `useLongPress.ts`         |
| Stores               | `kebab-case.store.ts`                       | `game.store.ts`           |
| Services             | `kebab-case.service.ts`                     | `board.service.ts`        |
| Types files          | `kebab-case.types.ts`                       | `game.types.ts`           |
| Constants files      | `kebab-case.constants.ts`                   | `game.constants.ts`       |
| Util files           | `kebab-case.utils.ts`                       | `time.utils.ts`           |
| Type/Interface names | `PascalCase`                                | `CellState`, `GameStatus` |
| Enums                | `PascalCase` enum, `SCREAMING_SNAKE` values | `GameStatus.IN_PROGRESS`  |
| Constant values      | `SCREAMING_SNAKE_CASE`                      | `MAX_CUSTOM_COLS`         |
| Boolean vars/props   | `is`/`has`/`can` prefix                     | `isRevealed`, `hasMine`   |

---

## Component Pattern

Every non-trivial component is split into a render file and a logic file.

```tsx
// SmileyButton.tsx — render only, zero logic
import { useSmileyButtonLogic } from './useSmileyButtonLogic'
import { Button } from '@/components/ui/Button'

export const SmileyButton = () => {
  const { emoji, label, onPress } = useSmileyButtonLogic()
  return (
    <Button variant="smiley" aria-label={label} onPress={onPress}>
      {emoji}
    </Button>
  )
}
```

```ts
// useSmileyButtonLogic.ts — all logic, no JSX
import { useGameStore } from '@/stores/game.store'

export const useSmileyButtonLogic = () => {
  const status = useGameStore((s) => s.status)
  const startNewGame = useGameStore((s) => s.startNewGame)
  const config = useGameStore((s) => s.config)
  const emoji = { idle: '🙂', playing: '🙂', won: '😎', lost: '😵', nervous: '😮' }[status]
  return { emoji, label: 'New game', onPress: () => startNewGame(config) }
}
```

UI primitives use **variants** for all visual states:

```tsx
<Button variant="raised" />    // unrevealed cell
<Button variant="sunken" />    // revealed cell
<Button variant="smiley" />    // header reset button
<Button variant="primary" />   // modal action
```

---

## Store Pattern

```ts
// game.store.ts
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // state
      board: [],
      status: 'idle' as GameStatus,
      config: DIFFICULTY_PRESETS.beginner,
      elapsedSeconds: 0,

      // actions — the public API
      startNewGame: (config) => {
        /* delegates to board.service */
      },
      revealCell: (row, col) => {
        /* delegates to board.service */
      },
      flagCell: (row, col) => {
        /* delegates to board.service */
      },
      chordClick: (row, col) => {
        /* delegates to board.service */
      },
      resumeLastGame: () => {
        /* rehydrates from persisted state */
      },
      tick: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
    }),
    { name: 'minesweeper-game' }
  )
)

// Components subscribe granularly — no unnecessary re-renders
const revealCell = useGameStore((s) => s.revealCell)
```

---

## TypeScript Config (highlights)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

## ESLint Plugins

- `typescript-eslint` (strict mode)
- `eslint-plugin-react` + `eslint-plugin-react-hooks`
- `eslint-plugin-react-compiler` (warns when compiler cannot optimize a component)
- `eslint-plugin-jsx-a11y` (accessibility)
- `eslint-plugin-import` (enforces import ordering)
- `eslint-plugin-tailwindcss` (catches invalid/duplicate Tailwind classes)

---

## CI/CD Flow

```
dev branch  →  commit  →  pre-commit hook (ESLint + Prettier via lint-staged)
                                ↓ passes
                            git push origin dev
                                ↓
                        PR: dev → main (manual)
                                ↓
                        push to main triggers:
                        GitHub Actions
                          1. pnpm install
                          2. pnpm test
                          3. pnpm build
                          4. deploy dist/ to GitHub Pages
                                ↓
                    tomer-shvadron.github.io/minesweeper
```

All development happens on `dev`. `main` is production-only and always auto-deploys.

---

## Build Phases

### Phase 1 — Project Setup

- Scaffold with Vite + React 19 + TypeScript
- Configure: React Compiler, Tailwind v4, ESLint, Prettier, Husky, lint-staged
- Configure: Vitest, `vite-plugin-pwa`
- Set up path aliases (`@/`)
- GitHub repo, `dev` branch, GitHub Actions deploy workflow
- Verify deploy pipeline end-to-end

### Phase 2 — Game Engine (`board.service.ts`)

- Board data structures and types
- Board generation
- Mine placement (deferred to after first click — guaranteed safe first tap)
- Cell reveal logic
- Flood-fill reveal for empty cells
- Win/loss detection
- Chord click logic
- Full Vitest test coverage

### Phase 3 — Core UI

- `Cell.tsx` — all visual states (unrevealed, revealed with number, flagged, question mark, mine, exploded)
- `GameBoard.tsx` — grid layout, pinch-to-zoom, touch-action
- XP-style CSS (beveled borders via box-shadow, correct colors)

### Phase 4 — Header

- `MineCounter.tsx` — LCD-style digit display
- `Timer.tsx` — LCD-style digit display
- `SmileyButton.tsx` — all 4 face states

### Phase 5 — Modals & Settings

- `NewGameModal.tsx` — difficulty presets + custom size
- `SettingsModal.tsx` — theme, sound toggle + volume, animations toggle, flag mode
- `LeaderboardModal.tsx` — per-config top 10, name prompt on new high score

### Phase 6 — State & Persistence

- Wire up all Zustand stores
- `storage.service.ts` — typed localStorage wrapper
- Game auto-save and resume-last-game flow
- Leaderboard read/write via `leaderboard.store.ts`
- Settings persistence

### Phase 7 — Sound & Themes

- `sound.service.ts` — click, flag, explode, win sounds
- XP theme CSS variables
- Dark theme CSS variables
- Theme switching in settings

### Phase 8 — PWA & Polish

- `vite-plugin-pwa` configuration (service worker, manifest, icons)
- Offline verification
- Responsive scaling for all board sizes in both orientations
- Animations (cell reveal cascade, explosion) — toggleable

### Phase 9 — Deploy & Device Testing

- Push to `main` → GitHub Actions → GitHub Pages
- Install on iPhone via Safari → "Add to Home Screen"
- End-to-end testing on device (portrait + landscape, offline)

---

## Key Decisions Log

| Decision              | Choice                              | Reason                                                                              |
| --------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| Native iOS vs PWA     | PWA                                 | Works offline without Mac or $99/yr developer account                               |
| Framework             | React 19                            | Best ecosystem, natural component model for grid game                               |
| React Compiler vs SWC | React Compiler (Babel)              | Runtime perf > build speed; SWC incompatible with compiler                          |
| State management      | Zustand                             | Cleaner API than useReducer+Context, built-in persist, granular subscriptions       |
| TanStack Query        | Not used                            | No server — it's for async server state only                                        |
| Styling               | Tailwind v4                         | Fast layout/spacing; CSS variables handle XP-specific shadow/bevel                  |
| Zoom behavior         | Pinch-to-zoom only                  | Double-tap disabled via `touch-action: manipulation`; pinch needed for large boards |
| Package manager       | pnpm                                | Fast, disk-efficient                                                                |
| Branch strategy       | `dev` for work, `main` = production | Auto-deploy on push to `main`                                                       |
