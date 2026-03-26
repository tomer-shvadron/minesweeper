# Tailwind CSS Refactor Plan

**Tailwind version:** 4.2.2 (verified via build output)

Goal: minimize custom CSS by replacing class definitions with inline Tailwind utilities on JSX
elements. Retain custom CSS only where Tailwind is genuinely insufficient.

All claims below were verified by running a test build and inspecting the generated CSS bundle.

---

## What Tailwind v4 DOES support (corrections to earlier assumptions)

The following were incorrectly listed as unsupported — Tailwind v4 generates correct CSS for all:

| Feature                       | Tailwind syntax                                                                                 | Generated CSS                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------ |
| `text-shadow`                 | `text-shadow-[0_0_6px_var(--color-digit)]`                                                      | `text-shadow: 0 0 6px …` ✓           |
| `touch-action: none`          | `touch-none`                                                                                    | `touch-action: none` ✓               |
| `::after` pseudo-elements     | `after:content-[''] after:absolute …`                                                           | `.foo:after { … }` ✓                 |
| `[data-state=checked]`        | `data-[state=checked]:bg-[var(--color-n4)]`                                                     | `[data-state=checked] { … }` ✓       |
| `[data-state=checked]::after` | `data-[state=checked]:after:content-['']`                                                       | `[data-state=checked]:after { … }` ✓ |
| `[data-disabled]`             | `data-[disabled]:opacity-40`                                                                    | `[data-disabled] { … }` ✓            |
| `:disabled`                   | `disabled:opacity-40`                                                                           | `:disabled { … }` ✓                  |
| `:focus-visible`              | `focus-visible:shadow-[…]`                                                                      | `:focus-visible { … }` ✓             |
| `:nth-child(even)`            | `even:bg-black/5`                                                                               | `:nth-child(2n) { … }` ✓             |
| `:active`                     | `active:opacity-70`                                                                             | `:active { … }` ✓                    |
| `max-height: 90dvh`           | `max-h-[90dvh]`                                                                                 | `max-height: 90dvh` ✓                |
| `letter-spacing: 2px`         | `tracking-[2px]`                                                                                | `letter-spacing: 2px` ✓              |
| `min-width: 3.5ch`            | `min-w-[3.5ch]`                                                                                 | `min-width: 3.5ch` ✓                 |
| `orientation: landscape`      | `landscape:flex-row`                                                                            | `@media(orientation:landscape)` ✓    |
| multi-layer inset box-shadow  | `shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-dark)]` | correct box-shadow ✓                 |

---

## What MUST stay in CSS

Only three categories are genuinely impossible to express in Tailwind v4:

### 1. `@keyframes` blocks

`@keyframes smiley-win`, `smiley-loss`, `cell-enter`, `mine-reveal`, `chord-ripple`,
`cell-reveal`, `cell-explode`, `banner-slide-in` must be defined in CSS. There is no Tailwind
equivalent. The keyframe _names_ are referenced from Tailwind arbitrary animation values.

### 2. `body[data-animations='false']` ancestor selectors

```css
body[data-animations='false'] .smiley--win {
  animation: none;
}
```

These rules target a descendant from an ancestor attribute. Tailwind's `group-data-[…]:` variant
could theoretically replace this if `group` were added to `<body>` and every animated element
received a `group-data-[animations=false]:animate-none` class — but that requires an architectural
change (modifying App.tsx to add `group` to the root and threading the class into every animated
element). Keep in CSS.

### 3. Ancestor-class descendant selectors

Two places use a CSS descendant selector to modify children from a parent class context:

- `.board--entering .cell` — the board container applies one class and all child cells animate.
  Moving this to Tailwind would require passing `boardEntering` as a prop to every `<Cell>`.
- `.game-header--sidebar .game-header__inner` and similar landscape overrides — same pattern:
  the sidebar class modifies deeply nested children. Moving these to Tailwind would require
  prop-drilling `isLandscape` into `MineCounter`, `Timer`, `SmileyButton`, etc.

Both stay in CSS.

---

## What CAN move to inline Tailwind

Everything else — including all the cases previously listed as "must stay." Remove the CSS
class definition and apply the Tailwind utilities directly in JSX.

### Simple layout/typography (already planned)

| CSS class                   | Tailwind replacement                                                                                                                                | File                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `.header-section`           | `flex items-center gap-1`                                                                                                                           | `Header.tsx`           |
| `.header-section--right`    | `justify-end` added                                                                                                                                 | `Header.tsx`           |
| `.modal-backdrop`           | `fixed inset-0 bg-black/45 z-[100]`                                                                                                                 | `Modal.tsx`            |
| `.modal-section`            | `flex flex-col gap-[10px]`                                                                                                                          | all modals             |
| `.modal-actions`            | `flex justify-end gap-1.5 px-3 py-2 pb-[10px]`                                                                                                      | all modals             |
| `.modal-content`            | `p-[18px] flex flex-col gap-[18px] overflow-y-auto min-h-0`                                                                                         | `Modal.tsx`            |
| `.smiley-button`            | `flex items-center justify-center w-11 h-11 text-[1.875rem] p-0`                                                                                    | `SmileyButton.tsx`     |
| `.toggle-row`               | `flex items-center justify-between gap-3 text-base`                                                                                                 | `Toggle.tsx`           |
| `.toggle-label`             | `flex-1`                                                                                                                                            | `Toggle.tsx`           |
| `.slider-row`               | `flex items-center gap-[10px] text-base`                                                                                                            | `Slider.tsx`           |
| `.slider-label`             | `min-w-14`                                                                                                                                          | `Slider.tsx`           |
| `.slider-value`             | `min-w-9 text-right`                                                                                                                                | `Slider.tsx`           |
| `.settings-group-label`     | `text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-[var(--color-border-darker)] border-b border-[var(--color-border-dark)] pb-[3px] mb-1` | `SettingsModal.tsx`    |
| `.theme-picker`             | `flex flex-wrap gap-2`                                                                                                                              | `SettingsModal.tsx`    |
| `.theme-swatch__label`      | `text-[0.5625rem] leading-[1.2] text-[var(--color-text)] text-center max-w-[44px] overflow-hidden text-ellipsis whitespace-nowrap`                  | `SettingsModal.tsx`    |
| `.preset-option`            | `flex items-center gap-2 py-1`                                                                                                                      | `NewGameModal.tsx`     |
| `.preset-label`             | `text-base font-bold cursor-pointer`                                                                                                                | `NewGameModal.tsx`     |
| `.preset-detail`            | `text-[0.8125rem] text-[var(--color-border-darker)] ml-auto`                                                                                        | `NewGameModal.tsx`     |
| `.custom-inputs`            | `flex flex-col gap-1.5 pl-[22px] pt-1`                                                                                                              | `NewGameModal.tsx`     |
| `.input-row`                | `flex items-center gap-2 text-[0.8125rem]` + move `w-[50px]` to `<label>`                                                                           | `NewGameModal.tsx`     |
| `.highscore-name-input`     | `w-full` on the `<input>`                                                                                                                           | `HighScorePrompt.tsx`  |
| `.highscore-time`           | `text-base`                                                                                                                                         | `HighScorePrompt.tsx`  |
| `.highscore-prompt`         | `text-[0.9375rem]`                                                                                                                                  | `HighScorePrompt.tsx`  |
| `.leaderboard-tabs`         | `flex gap-0.5 border-b-2 border-[var(--color-border-dark)] flex-wrap`                                                                               | `LeaderboardModal.tsx` |
| `.leaderboard-games-played` | `text-[0.8125rem] text-[var(--color-text-muted)] m-0`                                                                                               | `LeaderboardModal.tsx` |
| `.leaderboard-table`        | `w-full min-h-[180px]`                                                                                                                              | `LeaderboardModal.tsx` |
| `.leaderboard-empty`        | `text-[0.9375rem] text-[var(--color-text-muted)] text-center py-6`                                                                                  | `LeaderboardModal.tsx` |
| `.game-over-result-text`    | `text-base font-bold flex items-center gap-1`                                                                                                       | `GameOverBanner.tsx`   |
| `.game-over-time`           | `font-normal text-[var(--color-text-muted)]`                                                                                                        | `GameOverBanner.tsx`   |
| `.game-over-actions`        | `flex gap-[10px] shrink-0`                                                                                                                          | `GameOverBanner.tsx`   |
| `.resume-info`              | `text-sm`                                                                                                                                           | `ResumePrompt.tsx`     |
| `.resume-details`           | `text-[0.9375rem] font-bold`                                                                                                                        | `ResumePrompt.tsx`     |

### Pseudo-classes and pseudo-elements (previously listed as "must stay" — correction)

| CSS rule                                                  | Tailwind replacement                                                                                                                                                                                                                     | File                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `.header-icon-btn:active { opacity: 0.7 }`                | `active:opacity-70` on button                                                                                                                                                                                                            | `Header.tsx`           |
| `.modal-close-btn:active { box-shadow: … }`               | `active:shadow-[inset_-1px_-1px_0_var(--color-border-light),inset_1px_1px_0_var(--color-border-dark)]`                                                                                                                                   | `Modal.tsx`            |
| `.switch-root[data-state='checked'] { background-color }` | `data-[state=checked]:bg-[var(--color-n4)]`                                                                                                                                                                                              | `Toggle.tsx`           |
| `.switch-root:disabled { opacity; cursor }`               | `disabled:opacity-40 disabled:cursor-not-allowed`                                                                                                                                                                                        | `Toggle.tsx`           |
| `.switch-thumb[data-state='checked'] { transform }`       | `data-[state=checked]:translate-x-[21px]`                                                                                                                                                                                                | `Toggle.tsx`           |
| `.slider-root[data-disabled] { opacity; cursor }`         | `data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed`                                                                                                                                                                          | `Slider.tsx`           |
| `.slider-thumb:focus-visible { box-shadow }`              | `focus-visible:shadow-[0_0_0_3px_rgba(0,0,80,0.3)]`                                                                                                                                                                                      | `Slider.tsx`           |
| `.slider-root (layout)`                                   | `relative flex items-center flex-1 h-5 cursor-pointer`                                                                                                                                                                                   | `Slider.tsx`           |
| `.slider-track`                                           | `relative flex-1 h-1 bg-[var(--color-border-dark)] rounded-full overflow-hidden`                                                                                                                                                         | `Slider.tsx`           |
| `.slider-range`                                           | `absolute h-full bg-[var(--color-n4)] rounded-full`                                                                                                                                                                                      | `Slider.tsx`           |
| `.slider-thumb (layout)`                                  | `block w-4 h-4 rounded-full bg-white border-2 border-[var(--color-n4)] cursor-pointer outline-none`                                                                                                                                      | `Slider.tsx`           |
| `.preset-radio[data-state='checked'] { border-color }`    | `data-[state=checked]:border-[var(--color-n4)]`                                                                                                                                                                                          | `NewGameModal.tsx`     |
| `.preset-radio[data-state='checked']::after { dot }`      | `data-[state=checked]:after:content-[''] data-[state=checked]:after:block data-[state=checked]:after:w-[7px] data-[state=checked]:after:h-[7px] data-[state=checked]:after:rounded-full data-[state=checked]:after:bg-[var(--color-n4)]` | `NewGameModal.tsx`     |
| `.scores-table tr:nth-child(even)`                        | `even:bg-black/5` on each `<tr>`                                                                                                                                                                                                         | `LeaderboardModal.tsx` |
| `.theme-swatch__preview::after { accent bar }`            | `after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[10px] after:bg-[var(--swatch-accent)]`                                                                                                             | `SettingsModal.tsx`    |

### XP inset box-shadows (previously listed as "must stay" — correction)

Tailwind v4 generates correct multi-layer box-shadows from arbitrary values. Every shadow class
can be inlined. Example:

```
shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-dark)]
```

The classes and their Tailwind replacements:

| CSS class                 | Shadow Tailwind value                                                                                                                                                                                                                                                                                                                                                                                                                               | Also needs                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `.game-window`            | `shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-darker)]`                                                                                                                                                                                                                                                                                                                                                   | `inline-flex flex-col`                                                             |
| `.cell-raised`            | `shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-dark)]`                                                                                                                                                                                                                                                                                                                                                     | —                                                                                  |
| `.cell-revealed` (border) | `border border-[var(--color-border-dark)]`                                                                                                                                                                                                                                                                                                                                                                                                          | —                                                                                  |
| `.cell-exploded`          | `border border-[var(--color-border-dark)] bg-red-600`                                                                                                                                                                                                                                                                                                                                                                                               | —                                                                                  |
| `.game-header`            | `shadow-[inset_-2px_-2px_0_var(--color-border-light),inset_2px_2px_0_var(--color-border-dark)] bg-[var(--color-surface)] p-[8px_10px]`                                                                                                                                                                                                                                                                                                              | —                                                                                  |
| `.game-header__inner`     | `flex items-center justify-between bg-[var(--color-surface)] shadow-[inset_2px_2px_0_var(--color-border-dark),inset_-2px_-2px_0_var(--color-border-light)] p-[6px_8px]`                                                                                                                                                                                                                                                                             | —                                                                                  |
| `.lcd-display`            | `bg-[var(--color-digit-bg)] text-[var(--color-digit)] font-mono font-bold text-[1.375rem] tracking-[2px] px-1 py-[1px] min-w-[3.5ch] text-right text-shadow-[0_0_6px_var(--color-digit)] shadow-[inset_1px_1px_0_var(--color-border-dark),inset_-1px_-1px_0_var(--color-border-light)]`                                                                                                                                                             | —                                                                                  |
| `.btn-raised`             | `bg-[var(--color-surface)] shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-dark)] px-3 py-1 text-sm`                                                                                                                                                                                                                                                                                                         | —                                                                                  |
| `.btn-primary`            | `bg-[var(--color-surface)] shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-dark)] px-5 py-1.5 text-base font-bold`                                                                                                                                                                                                                                                                                           | —                                                                                  |
| `.btn-secondary`          | `bg-[var(--color-surface)] border border-[var(--color-border-dark)] px-4 py-1.5 text-base`                                                                                                                                                                                                                                                                                                                                                          | —                                                                                  |
| `.btn-ghost`              | `bg-transparent px-2 py-1 text-sm`                                                                                                                                                                                                                                                                                                                                                                                                                  | —                                                                                  |
| `.header-icon-btn`        | `flex items-center justify-center w-[42px] h-[42px] cursor-pointer rounded bg-transparent border-none outline-none leading-none active:opacity-70`                                                                                                                                                                                                                                                                                                  | —                                                                                  |
| `.modal-window`           | `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-[var(--color-surface)] shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-darker),4px_4px_8px_rgba(0,0,0,0.4)] min-w-[340px] max-w-[min(520px,94vw)] max-h-[90dvh] flex flex-col overflow-hidden`                                                                                                                                          | drop the `90vh` fallback — `dvh` is supported on all relevant platforms            |
| `.modal-title-bar`        | `flex items-center justify-between bg-[var(--color-titlebar-bg)] text-[var(--color-titlebar-text)] p-[4px_6px_4px_8px] text-[0.9375rem] font-bold select-none`                                                                                                                                                                                                                                                                                      | —                                                                                  |
| `.modal-close-btn`        | `bg-[var(--color-surface)] text-black border-none outline-none w-5 h-[18px] text-xs leading-none cursor-pointer flex items-center justify-center shadow-[inset_1px_1px_0_var(--color-border-light),inset_-1px_-1px_0_var(--color-border-dark)] active:shadow-[inset_-1px_-1px_0_var(--color-border-light),inset_1px_1px_0_var(--color-border-dark)]`                                                                                                | —                                                                                  |
| `.preset-radio`           | `w-[17px] h-[17px] rounded-full border-2 border-[var(--color-border-dark)] bg-[var(--color-surface)] cursor-pointer shrink-0 flex items-center justify-center data-[state=checked]:border-[var(--color-n4)] data-[state=checked]:after:content-[''] data-[state=checked]:after:block data-[state=checked]:after:w-[7px] data-[state=checked]:after:h-[7px] data-[state=checked]:after:rounded-full data-[state=checked]:after:bg-[var(--color-n4)]` | —                                                                                  |
| `.leaderboard-tab`        | `py-[5px] px-[14px] text-[0.9375rem] cursor-pointer bg-[var(--color-surface)] border border-b-0 border-[var(--color-border-dark)] shadow-[inset_1px_1px_0_var(--color-border-light),inset_-1px_0_0_var(--color-border-dark)]`                                                                                                                                                                                                                       | `leaderboard-tab--active` → conditional `bg-[var(--color-border-light)] font-bold` |
| `.xp-input`               | `bg-white border-none shadow-[inset_2px_2px_0_var(--color-border-dark),inset_-1px_-1px_0_var(--color-border-light)] px-1 py-[2px] text-sm w-[60px] outline-none select-text`                                                                                                                                                                                                                                                                        | —                                                                                  |
| `.theme-swatch`           | `flex flex-col items-center gap-1 bg-transparent border-none p-0 cursor-pointer`                                                                                                                                                                                                                                                                                                                                                                    | —                                                                                  |
| `.theme-swatch__preview`  | `w-[44px] h-[38px] rounded-[6px] border-2 border-transparent relative overflow-hidden block shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-[border-color] duration-100 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[10px] after:bg-[var(--swatch-accent)]`                                                                                                                                                   | `theme-swatch--active` → conditional `border-[var(--swatch-accent)]`               |

### Animation trigger classes (previously listed as "must stay" — partial correction)

The `@keyframes` blocks must remain in CSS. But the _trigger_ classes that apply those keyframes
can use Tailwind arbitrary animation values:

| CSS class                  | Tailwind replacement                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `.smiley--win`             | `animate-[smiley-win_0.38s_cubic-bezier(0.36,0.07,0.19,0.97)_both]`                   |
| `.smiley--loss`            | `animate-[smiley-loss_0.32s_ease-in-out_both]`                                        |
| `.cell.cell--mine-reveal`  | `animate-[mine-reveal_0.28s_ease-out_both] [animation-delay:var(--mine-delay,0ms)]`   |
| `.cell.cell--chord-ripple` | `animate-[chord-ripple_0.18s_ease-out_both] [animation-delay:var(--chord-delay,0ms)]` |

The `cell-reveal` and `cell-explode` classes are applied to ALL revealed/exploded cells via
`cell-revealed` / `cell-exploded` class names. These are set dynamically in `useCellLogic.ts`.
The animation on `.cell-revealed` and `.cell-exploded` uses those class names directly — they
can also move to Tailwind by including the animation in the `containerClass` string.

### `scores-table` th/td (previously listed as "must stay" — correction)

The descendant selectors on `<th>` and `<td>` can be replaced by adding Tailwind classes
directly to each element in the JSX:

- `<th>` → `text-left px-[10px] py-[5px] font-bold border-b border-[var(--color-border-dark)]`
- `<td>` → `px-[10px] py-[5px]`
- Remove `.scores-table` class; add `w-full border-collapse text-[0.9375rem]` on `<table>`

---

## What genuinely cannot be expressed in Tailwind v4

| Item                                                                               | Why                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@keyframes` blocks                                                                | Must be defined in CSS; no Tailwind equivalent                                                                                                                                                                                                                  |
| `body[data-animations='false'] .smiley--win { animation: none }` and similar       | Ancestor attribute selector targeting a descendant. Requires the `group`/`group-data-[…]:` architectural pattern (add `group` to `<body>`, add `group-data-[animations=false]:animate-none` to each element) — a significant architectural change. Keep in CSS. |
| `.board--entering .cell`                                                           | Ancestor class targeting all child cells. Moving to Tailwind requires passing `boardEntering` prop to every `<Cell>`. Keep in CSS.                                                                                                                              |
| `.game-header--sidebar .game-header__inner` (and other landscape descendant rules) | Ancestor class targeting nested children. Moving to Tailwind requires prop-drilling `isLandscape` into `MineCounter`, `Timer`, `SmileyButton`, etc. Keep in CSS.                                                                                                |

---

## Estimated CSS after refactor

| Section                                       | Lines today | Lines after                                      |
| --------------------------------------------- | ----------- | ------------------------------------------------ |
| Layout-only classes                           | ~220        | 0                                                |
| XP shadows + button shapes                    | ~80         | 0 (moved to Tailwind)                            |
| LCD display                                   | ~18         | 0 (moved to Tailwind)                            |
| Pseudo-class / data-state rules               | ~40         | 0 (moved to Tailwind)                            |
| Animation trigger classes                     | ~30         | ~0 (moved to Tailwind arbitrary; keyframes stay) |
| `@keyframes` blocks                           | ~90         | ~90 (unchanged)                                  |
| `body[data-animations='false']` rules         | ~15         | ~15 (unchanged)                                  |
| `.board--entering .cell`                      | ~5          | ~5 (unchanged)                                   |
| Landscape descendant overrides                | ~30         | ~30 (unchanged)                                  |
| `@layer base` (resets)                        | ~25         | ~25 (unchanged)                                  |
| `.game-over-banner` animation + env() padding | ~35         | ~35 (unchanged)                                  |
| **Total**                                     | **~885**    | **~200** (~77% reduction)                        |

---

## Suggested execution order

1. **`GameOverBanner.tsx`** — 3 layout classes, warmup
2. **`ResumePrompt.tsx`**, **`HighScorePrompt.tsx`** — small, isolated
3. **`Toggle.tsx`** — layout + `data-[state=checked]:` + `:disabled` variants
4. **`Slider.tsx`** — layout + `data-[disabled]:` + `focus-visible:` variants
5. **`Header.tsx`** — remove `header-section` + `header-icon-btn` (with `active:opacity-70`)
6. **`Modal.tsx`** — backdrop, window (with complex shadow + `max-h-[90dvh]`), title bar, close btn
7. **`SettingsModal.tsx`** — settings label, theme picker, swatch (with `after:` pseudo)
8. **`NewGameModal.tsx`** — preset-option, input-row, xp-input, preset-radio (with `data-[state=checked]:after:`)
9. **`LeaderboardModal.tsx`** — tabs (with shadow), table (move `th`/`td`/`even:` to elements)
10. **`SmileyButton.tsx`** — replace layout; update animation strings
11. **`useCellLogic.ts`** — update `containerClass` string to include Tailwind animation classes
12. **`App.tsx`** / **`GameBoard.tsx`** — `game-window` shadow, `game-header` shadow
13. **`Button.tsx`** — btn-raised/primary/secondary/ghost variants
14. Delete emptied CSS class blocks; keep `@keyframes`, `@layer base`, banner, board-entering, landscape descendant rules

Each step: delete the CSS block → add Tailwind utilities in JSX → `pnpm test`.
