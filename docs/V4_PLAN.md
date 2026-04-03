# Minesweeper V4 — UI/UX Modernization Plan

## Overview

V4 is a full visual and interaction redesign. The Windows XP-inspired design is replaced with a modern, glassmorphism-based UI that feels native on both iOS and Android. All changes are cosmetic/UX — no game logic changes.

---

## Design Decisions Summary

| Aspect           | Decision                   | Details                                                                         |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------- |
| Design Language  | Flat + Glassmorphism (A)   | Frosted glass surfaces, soft shadows, rounded corners, no bevels                |
| Header           | Contextual / Floating (H3) | Mine count + timer float over board as pills; actions in bottom nav             |
| Landscape Layout | Right sidebar (L2)         | Nav bar moves to right side in landscape; pills stay on top of board            |
| Panels / Modals  | Hybrid (M3)                | Bottom sheets for settings/stats/leaderboard; centered modals for quick dialogs |
| Game Over        | Overlay Card (G1)          | Centered card over dimmed board with stats, PB badge, confetti                  |
| Cell Design      | Both B1 + B2               | Rounded tiles (default) and flat dividers — user-configurable                   |
| Background       | All 4 options              | Gradient, pattern, dynamic, solid — user-configurable                           |
| New Game Button  | Modernized Smiley (NG4)    | Glass container, state-reactive emoji, lives in bottom nav                      |
| Timer/Counter    | Large Standalone (T3)      | Large bold numbers with icon + small label, floating pills on board             |
| Win Celebration  | Burst + Rings (C2)         | Confetti + expanding golden rings + star sparkles                               |
| LCD Displays     | Removed                    | Replaced with clean sans-serif / system font numbers                            |

---

## Themes

### Theme Matrix

| Theme        | Light | Dark                | Sound Pack | Default On |
| ------------ | ----- | ------------------- | ---------- | ---------- |
| Regular      | ✅    | ✅                  | Classic    | Android    |
| Liquid Glass | ✅    | ✅                  | Classic    | iOS        |
| Jedi         | —     | ✅ (single variant) | Star Wars  | —          |
| Sith         | —     | ✅ (single variant) | Star Wars  | —          |

### Color Mode Setting

Each theme that supports light/dark gets a 3-way toggle in settings:

- **Light** — force light
- **Dark** — force dark
- **System** (default) — follows `prefers-color-scheme`

Jedi and Sith are dark-only, so the color mode toggle is hidden when they're selected.

### Theme Removal

The following themes are removed in V4:

- Classic XP (`xp`)
- Material (`material`)
- Aero (`aero`)
- Pastel (`pastel`)
- Neon (`neon`)
- Aqua (`aqua`)
- Dark (`dark`) — absorbed into Regular Dark and Liquid Glass Dark

### Theme Detection (Default)

On first launch (no persisted preference):

- Check `navigator.userAgent` for iPhone/iPad → default to Liquid Glass
- Otherwise → default to Regular
- Color mode defaults to System

### Theme Color Palette Guide

**Regular Light**: Clean white surfaces (#fff) on light gray background (#f0f2f5). Neutral, Material-esque.
**Regular Dark**: Dark surfaces (#1c1c2e) on near-black background (#121218). Indigo accents.
**Liquid Glass Light**: Translucent white surfaces (rgba(255,255,255,0.5)) with `backdrop-filter: blur(16px)` over colorful gradient background.
**Liquid Glass Dark**: Translucent dark surfaces (rgba(0,0,0,0.3)) with blur over muted gradient background.
**Jedi**: Deep space blue (#0a1628) with cool blue (#4da6ff) and green (#50e890) accents. Subtle glow effects.
**Sith**: Near-black with red undertone (#1a0008) with red (#ff4444) accents. Menacing glow effects.

---

## Layout Architecture

### Portrait Mode

```
┌──────────────────────────────┐
│  ┌─────────┐   ┌──────────┐ │  ← Floating pills (over board)
│  │💣  10   │   │  042  ⏱  │ │
│  └─────────┘   └──────────┘ │
│                              │
│     ┌──────────────────┐     │
│     │                  │     │
│     │                  │     │
│     │      BOARD       │     │
│     │                  │     │
│     │                  │     │
│     └──────────────────┘     │
│                              │
├──────────────────────────────┤
│  🏆    📊    🙂    ⚙️      │  ← Bottom nav bar (glass)
└──────────────────────────────┘
```

### Landscape Mode

```
┌─────────────────────────────┬────┐
│  ┌─────────┐  ┌──────────┐ │ 🏆 │
│  │💣  10   │  │  042  ⏱  │ │    │
│  └─────────┘  └──────────┘ │ 📊 │
│                             │    │
│    ┌──────────────────┐     │ 🙂 │  ← Right sidebar nav
│    │                  │     │    │
│    │      BOARD       │     │ ⚙️ │
│    │                  │     │    │
│    └──────────────────┘     │    │
└─────────────────────────────┴────┘
```

### Floating Pills (Mine Counter + Timer)

- Positioned `absolute` over the board area (top-left for mines, top-right for timer)
- Glass background: `rgba(255,255,255,0.75)` with `backdrop-filter: blur(12px)` (light themes)
- Each pill contains: icon + large bold number + small label
- Example: `💣  10` with "mines" label below, `042  ⏱` with "time" label below
- `font-variant-numeric: tabular-nums` to prevent layout shift
- Z-index above board but below modals

### Bottom Nav Bar

- Glass background with blur
- 4 items: Leaderboard (🏆), Statistics (📊), New Game (🙂), Settings (⚙️)
- New Game button is the modernized smiley in a glass container
  - Playing: 🙂
  - Won: 😎 with green tint
  - Lost: 😵 with red tint
- Active/focused item gets a subtle accent background
- Safe-area-inset-bottom for notched devices

### Responsive Behavior

- Portrait: bottom nav bar
- Landscape: right sidebar (same items, vertical layout)
- Breakpoint: CSS `@media (orientation: landscape)`

---

## Component Changes

### Board (`GameBoard.tsx`, `Cell.tsx`)

**Cell Design — Configurable (settings: "Cell Style")**

- **Rounded Tiles (B1, default)**: `border-radius: 6px`, soft shadow on unrevealed, flat on revealed, 3px gap
- **Flat Dividers (B2)**: No rounded corners, 1px divider lines, minimal shadows, denser

**Background — Configurable (settings: "Background")**

- **Gradient** (default): Subtle multi-stop gradient per theme
- **Pattern**: Dot grid or geometric pattern (`background-image: radial-gradient(...)`)
- **Dynamic**: Slowly shifting gradient (`animation: bgshift 8s ease infinite alternate`)
- **Solid**: Single curated color per theme

**Board Surface**:

- Remove all 3D inset shadows and bevels
- Board container gets glass treatment (or solid, depending on theme)
- `overflow: hidden` with `border-radius: 16px`

### Header → Removed

The traditional header component is removed entirely. Its responsibilities are split:

- Mine counter + timer → floating pills (new `FloatingPills` component)
- Smiley + action buttons → bottom nav bar (new `NavBar` component)

### Game Over Banner → Overlay Card

**Win state:**

- Centered card over dimmed board (`bg-black/25` overlay)
- Trophy emoji (🏆), large "You Won!" title
- Time displayed large and bold in accent color (e.g., `0:42`)
- "New Personal Best!" golden badge when applicable
- Stats subtitle: efficiency, cells revealed
- Two buttons: "Play Again" (primary/accent), "Change Level" (secondary)
- Confetti celebration (C2 — burst + rings) plays behind the card

**Loss state:**

- Same card layout but muted
- Bomb emoji (💣), "Game Over" in red
- Time displayed in muted color
- Stats: cells revealed, mines flagged
- Two buttons: "Try Again" (red), "Change Level" (secondary)
- No celebration effects

### Modals → Hybrid (Sheets + Dialogs)

**Bottom Sheets** (heavy content — slide up from bottom, draggable handle):

- Settings panel
- Statistics panel
- Leaderboard panel

**Centered Modals** (quick dialogs — appear centered with backdrop):

- New Game dialog
- High Score name prompt
- Resume Game prompt
- Keyboard shortcuts

**Sheet Design:**

- Glass background with blur
- Drag handle: centered 36px × 4px rounded bar
- Rounded top corners (16px)
- Swipe-down to dismiss
- Max height: 85dvh, scrollable content

**Dialog Design:**

- Rounded card (20px radius)
- Glass or solid surface depending on theme
- Backdrop overlay (black/25)
- No title bar — title is inline in the content
- Close via backdrop tap or explicit button

### Settings Panel — Revamp

**Organized into collapsible sections:**

```
┌─ Settings ──────────────────────────┐
│                                     │
│  ▼ Display                          │
│    Theme ........... [Regular ▾]    │
│    Color Mode ...... [System ▾]     │
│    Board Size ...... [S | M | L]    │
│    Cell Style ...... [Rounded ▾]    │
│    Background ...... [Gradient ▾]   │
│    Animations ...... [toggle]       │
│                                     │
│  ▼ Audio                            │
│    Sound ........... [toggle]       │
│    Volume .......... [slider]       │
│    Haptic Feedback . [toggle]*      │
│                                     │
│  ▼ Gameplay                         │
│    Flag Mode ....... [Flags ▾]      │
│    No-Guess Mode ... [toggle]       │
│                                     │
│  ▼ Controls                         │
│    Keyboard Shortcuts [button →]    │
│                                     │
└─────────────────────────────────────┘
  * mobile only
```

**Section behavior:**

- All sections expanded by default
- Collapsible with chevron toggle (▼/▶)
- Collapsed state persisted in settings store
- Each setting row: label on left, control on right
- Select controls use native `<select>` or a custom dropdown
- Sections separated by subtle dividers

**New settings added:**

- `cellStyle`: `'rounded' | 'flat'` (default: `'rounded'`)
- `backgroundStyle`: `'gradient' | 'pattern' | 'dynamic' | 'solid'` (default: `'gradient'`)
- `colorMode`: `'light' | 'dark' | 'system'` (default: `'system'`)
- `boardSize`: `'small' | 'medium' | 'large'` (default: `'medium'`) — segmented control, caps max cell size per device type

### Win Celebration — Enhanced Confetti (C2)

- Confetti particles (colored rectangles) burst outward
- Expanding golden rings (3 concentric, fading outward)
- Star sparkles (✦) at random positions
- Duration: ~2 seconds
- Respects `animationsEnabled` toggle
- Theme-adaptive: brighter particles on dark themes

### LCD Display → Removed

The `LcdDisplay` component and its 7-segment styling are no longer used. Numbers use the system font with:

- `font-weight: 800`
- `font-variant-numeric: tabular-nums`
- `letter-spacing: -0.5px`
- Large size (28-32px) for the floating pill counters

---

## Files to Create

| File                                      | Purpose                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `src/components/nav/NavBar.tsx`           | Bottom nav bar (portrait) / right sidebar (landscape) |
| `src/components/nav/useNavBarLogic.ts`    | Nav bar logic hook                                    |
| `src/components/board/FloatingPills.tsx`  | Mine counter + timer floating over board              |
| `src/components/ui/BottomSheet.tsx`       | Radix Dialog-based bottom sheet primitive             |
| `src/components/ui/Select.tsx`            | Custom select/dropdown for settings                   |
| `src/styles/themes/regular.css`           | Regular theme (light + dark)                          |
| `src/styles/themes/regular-dark.css`      | Regular dark variant                                  |
| `src/styles/themes/liquid-glass.css`      | Liquid Glass theme (light + dark)                     |
| `src/styles/themes/liquid-glass-dark.css` | Liquid Glass dark variant                             |

## Files to Modify (Major)

| File                                          | Changes                                                        |
| --------------------------------------------- | -------------------------------------------------------------- |
| `src/components/board/GameBoard.tsx`          | Remove header refs, add FloatingPills, new board styling       |
| `src/components/board/Cell.tsx`               | Remove XP bevels, add rounded/flat variants                    |
| `src/components/game-over/GameOverBanner.tsx` | Convert to overlay card design                                 |
| `src/components/modals/SettingsModal.tsx`     | Full rewrite — sectioned layout in bottom sheet                |
| `src/components/modals/LeaderboardModal.tsx`  | Convert to bottom sheet                                        |
| `src/components/modals/StatisticsModal.tsx`   | Convert to bottom sheet                                        |
| `src/components/modals/NewGameModal.tsx`      | Modernize as centered dialog                                   |
| `src/components/modals/HighScorePrompt.tsx`   | Modernize as centered dialog                                   |
| `src/components/modals/ResumePrompt.tsx`      | Modernize as centered dialog                                   |
| `src/components/ui/Modal.tsx`                 | Remove XP title bar, update to modern dialog                   |
| `src/components/ui/Confetti.tsx`              | Add burst rings + sparkles                                     |
| `src/components/ui/Button.tsx`                | Remove raised/XP variants, add modern variants                 |
| `src/App.tsx`                                 | Replace Header with NavBar + FloatingPills, color mode logic   |
| `src/styles/global.css`                       | Remove XP shadows/borders, add glass utilities, new animations |
| `src/stores/settings.store.ts`                | Add cellStyle, backgroundStyle, colorMode                      |
| `src/constants/theme.constants.ts`            | New theme list, remove old themes                              |

## Files to Delete

| File                                     | Reason                             |
| ---------------------------------------- | ---------------------------------- |
| `src/components/header/Header.tsx`       | Replaced by NavBar + FloatingPills |
| `src/components/header/MineCounter.tsx`  | Absorbed into FloatingPills        |
| `src/components/header/Timer.tsx`        | Absorbed into FloatingPills        |
| `src/components/header/SmileyButton.tsx` | Absorbed into NavBar               |
| `src/components/ui/LcdDisplay.tsx`       | No longer used                     |
| `src/styles/themes/xp.css`               | Theme removed                      |
| `src/styles/themes/material.css`         | Theme removed                      |
| `src/styles/themes/aero.css`             | Theme removed                      |
| `src/styles/themes/pastel.css`           | Theme removed                      |
| `src/styles/themes/neon.css`             | Theme removed                      |
| `src/styles/themes/aqua.css`             | Theme removed                      |
| `src/styles/themes/dark.css`             | Absorbed into Regular Dark         |
| `docs/v4-mockups.html`                   | Design exploration artifact        |
| `docs/v4-mockups-2.html`                 | Design exploration artifact        |

---

## Implementation Phases

### Phase 1 — Foundation (Theme System + Settings Store)

1. Add new settings to `settings.store.ts`: `cellStyle`, `backgroundStyle`, `colorMode`
2. Update `theme.constants.ts`: new theme list (regular, regular-dark, liquid-glass, liquid-glass-dark, jedi, sith)
3. Implement color mode logic in `App.tsx`: listen to `prefers-color-scheme` media query, resolve effective theme from (theme + colorMode)
4. Create new theme CSS files: `regular.css`, `regular-dark.css`, `liquid-glass.css`, `liquid-glass-dark.css`
5. Update existing `jedi.css` and `sith.css` to match new design language (remove XP borders/bevels)
6. Delete old theme CSS files
7. Update `global.css`: remove all XP-era shadows, borders, bevels; add glass utility classes
8. Add platform detection utility for default theme selection

**Verify:** All themes render, color mode switching works, settings persist.

### Phase 2 — Layout Architecture (NavBar + FloatingPills)

1. Create `NavBar.tsx` — bottom nav (portrait) / right sidebar (landscape)
2. Create `FloatingPills.tsx` — mine counter + timer floating over board
3. Modernize smiley button within NavBar (glass container, state-reactive)
4. Update `App.tsx`: replace `<Header />` with `<NavBar />` + integrate FloatingPills into board area
5. Update `GameBoard.tsx`: new board container styling (rounded, glass/solid surface, no bevels)
6. Remove old header components (`Header.tsx`, `MineCounter.tsx`, `Timer.tsx`, `SmileyButton.tsx`, `LcdDisplay.tsx`)
7. Update landscape styles

**Verify:** Layout works in portrait + landscape, pills float correctly, nav bar is functional, all buttons work.

### Phase 3 — Cell + Board Styling ✅

1. ✅ Update `Cell.tsx`: remove XP shadows, implement rounded (B1) and flat (B2) cell variants
2. ✅ Update `useCellLogic.ts`: apply cell style based on `cellStyle` setting — replaced XP inset shadow with `cell-raised` class
3. ✅ Implement all 4 background styles (gradient, pattern, dynamic, solid) via `data-bg-style` attribute on body
4. ✅ Update board surface styling per theme (glass vs solid) — `game-window` class on both DOM and Canvas boards
5. ✅ Canvas board (`CanvasBoard.tsx`) respects cell style: rounded corners, cell gaps, hit testing with gaps
6. ✅ `App.tsx` applies `data-cell-style` and `data-bg-style` attributes reactively from settings
7. ✅ Layout engine (`calcCellSize`) accounts for cell gaps in rounded mode
8. ✅ All theme CSS files have `--color-bg-solid` for solid background mode

**Verify:** Both cell styles render correctly across all themes, background options work.

### Phase 4 — Modals → Sheets + Dialogs ✅

1. ✅ Create `BottomSheet.tsx` UI primitive (Radix Dialog with bottom-sheet behavior, drag handle, swipe-to-dismiss)
2. ✅ Convert `SettingsModal.tsx` → bottom sheet with sectioned layout (Theme, Display, Audio, Gameplay, Controls)
3. ✅ Convert `LeaderboardModal.tsx` → bottom sheet with modernized pill tabs
4. ✅ Convert `StatisticsModal.tsx` → bottom sheet with modernized pill tabs
5. ✅ Modernize `NewGameModal.tsx` → centered dialog (rounded, no XP title bar)
6. ✅ Modernize `HighScorePrompt.tsx` → centered dialog
7. ✅ Modernize `ResumePrompt.tsx` → centered dialog
8. ✅ Update `Modal.tsx` base component (rounded-2xl, modern close button, backdrop blur)
9. ✅ Update `Button.tsx` variants (rounded-xl, modern primary/secondary/ghost, theme-aware via CSS classes)
10. ✅ Added slide-up/down and fade animations for sheets (with animations-disabled support)
11. ✅ Modernized `KeyboardModal.tsx` styling

**Verify:** All panels open/close correctly, bottom sheets are draggable, dialogs center properly, all interactions work.

### Phase 5 — Game Over + Celebrations ✅

1. ✅ Redesign `GameOverBanner.tsx` → overlay card centered over dimmed board
   - Win: trophy emoji, "You Won!" in accent color, time + efficiency stats, Play Again + Change Level buttons
   - Loss: bomb emoji, "Game Over" in red, revealed/flagged stats, Try Again (red) + Change Level buttons
2. ✅ Enhance `Confetti.tsx` — burst particles from center, 3 expanding golden rings, star sparkles (✦) at random positions
3. ✅ Card scale-in animation (`card-scale-in`) with cubic-bezier spring
4. ✅ Overlay respects animations-disabled setting
5. ✅ Removed `GAME_OVER_BANNER_HEIGHT` space reservation from layout calc (overlay doesn't consume space)

**Verify:** Win card shows with confetti + rings, loss card shows muted, all animations work.

### Phase 6 — Polish + Testing ✅

1. ✅ Update all unit tests for changed component APIs (settings store, layout utils, canvas service, modal tests)
2. ✅ Renamed all `xp-input` → `input-field` across CSS and TSX files
3. ✅ Accessibility audit: BottomSheet uses Radix Dialog (ARIA roles, focus trap, close label); GameOverBanner has `role="status" aria-live="polite"` for screen reader announcements
4. ✅ Safe-area handling: BottomSheet uses `pb-[max(20px,env(safe-area-inset-bottom))]`
5. ✅ Removed deprecated `HEADER_HEIGHT` / `HEADER_SIDEBAR_WIDTH` constants (unused)
6. ✅ Deleted mockup files (`docs/v4-mockups.html`, `docs/v4-mockups-2.html`)
7. ✅ Final verification: TypeScript type check passes, all 614 tests pass, production build succeeds

**Verify:** All tests pass, build succeeds, all V4 phases complete.

---

## Key Decisions Log

| Decision                           | Rationale                                                          |
| ---------------------------------- | ------------------------------------------------------------------ |
| Glassmorphism base design          | Modern, iOS-native feel, Liquid Glass theme is natural extension   |
| Floating pills over board          | Maximizes board space, game-focused layout                         |
| Bottom sheets for heavy content    | Thumb-friendly on mobile, native feel                              |
| Centered dialogs for quick actions | Fast interaction, no unnecessary sheet overhead                    |
| Both cell styles configurable      | Users have strong preferences — let them choose                    |
| All background styles configurable | Low cost to implement, high personalization value                  |
| Keep smiley button (modernized)    | Iconic minesweeper UX — recognizable and charming                  |
| Color mode per-theme               | Standard practice, respects user system preference                 |
| Remove LCD displays                | XP artifact, doesn't fit modern aesthetic                          |
| Right sidebar in landscape         | Preserves vertical board space (scarce in landscape)               |
| Section-based settings             | Scales for future settings additions without becoming overwhelming |
