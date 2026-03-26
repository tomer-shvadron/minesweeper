# Tailwind CSS Refactor Plan

Goal: minimize custom CSS by replacing layout-only class definitions with inline Tailwind utilities
directly on JSX elements. Retain custom classes only where Tailwind is genuinely insufficient.

---

## What MUST stay in CSS (and why)

### 1. `@layer base` — global resets

`html`, `body`, `#root` resets (`touch-action: manipulation`, `-webkit-tap-highlight-color`,
`-webkit-user-select`). These are document-level rules that can't be applied from a component.

### 2. XP-style inset box-shadows using CSS variables

**Classes:** `.game-window`, `.cell-raised`, `.cell-revealed` (border), `.cell-exploded`,
`.game-header`, `.game-header__inner`, `.lcd-display`, `.btn-raised`, `.btn-primary`,
`.btn-secondary`, `.modal-window`, `.modal-close-btn`, `.modal-close-btn:active`,
`.leaderboard-tab`, `.xp-input`, `.preset-radio`

**Why:** Every shadow is a multi-layer pattern referencing CSS theme variables, e.g.:

```css
box-shadow:
  inset 2px 2px 0 var(--color-border-light),
  inset -2px -2px 0 var(--color-border-dark);
```

As a Tailwind arbitrary value this becomes:
`shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-dark)]`
— repeated 10+ times across components, unmaintainable and unreadable. These are the core
visual language of the XP theme and belong as named reusable classes.

### 3. LCD display typography

**Class:** `.lcd-display`

**Why:** Combines `text-shadow: 0 0 6px var(--color-digit)` (no Tailwind utility), a custom
monospace font stack, `letter-spacing: 2px`, and `min-width: 3.5ch` (ch unit). Named class
is cleaner than five arbitrary values in JSX.

### 4. Keyframe animations

**Keyframes:** `smiley-win`, `smiley-loss`, `cell-enter`, `mine-reveal`, `chord-ripple`,
`cell-reveal`, `cell-explode`, `banner-slide-in`

**Why:** `@keyframes` blocks must be defined in CSS; there is no Tailwind equivalent.

### 5. Animation trigger classes

**Classes:** `.smiley--win`, `.smiley--loss`, `.board--entering .cell`,
`.cell.cell--mine-reveal`, `.cell.cell--chord-ripple`, `.cell-revealed` (animation),
`.cell-exploded` (animation)

**Why:** These apply named keyframes and CSS-variable-based `animation-delay`
(`var(--mine-delay)`, `var(--chord-delay)`). Cannot be expressed as Tailwind inline classes.

### 6. Animation disable rules

**Rule:** `body[data-animations='false'] .class { animation: none }`

**Why:** These are body-attribute selectors targeting descendant elements. Cannot be expressed
from component-level Tailwind; they must live in CSS.

### 7. Pseudo-element rules

**Rules:** `.theme-swatch__preview::after`, `.preset-radio[data-state='checked']::after`

**Why:** `::after` pseudo-elements cannot be expressed as Tailwind inline classes on JSX elements.
The `.theme-swatch__preview` and `.preset-radio` classes must remain to anchor these `::after` rules.

### 8. Radix UI `[data-state]` and `[data-disabled]` selectors

**Rules:** `.preset-radio[data-state='checked']`, `.switch-root[data-state='checked']`,
`.switch-thumb[data-state='checked']`, `.slider-root[data-disabled]`, `.switch-root:disabled`,
`.slider-thumb:focus-visible`

**Why:** Radix UI primitives apply these data attributes internally. While Tailwind v4 supports
`data-[state=checked]:` variants, on Radix components the className prop receives the CSS class
on the outer element, not on the attribute-bearing child element. Keeping these in CSS is simpler
and avoids brittle coupling to Radix internals.

### 9. Safe-area padding on game-over banner

**Class:** `.game-over-banner` (specifically its padding)

**Why:** `padding: calc(20px + env(safe-area-inset-bottom, 0px)) 16px` — the `env()` CSS
function inside a `calc()` cannot be expressed as a single Tailwind arbitrary value in a
maintainable way. The full banner also has `animation: banner-slide-in`, so the class must
stay anyway.

### 10. `max-height` double-declaration on `.modal-window`

**Why:** The `max-height: 90vh; max-height: 90dvh` cascade pattern (where `dvh` overrides `vh`
only in supporting browsers) requires two declarations of the same property, which is impossible
in a single JSX className string.

### 11. `@media (orientation: landscape)` block — sidebar overrides

**Why:** These rules modify the behaviour of deeply nested children
(e.g., `.game-header--sidebar .game-header__inner`) using descendant selectors. The landscape
modifier for each deep child can't be collocated in JSX without prop-drilling `isLandscape` into
every sub-component. Keeping the overrides as CSS descendant rules is architecturally cleaner.

### 12. `.scores-table th / td / tr:nth-child(even)` descendant selectors

**Why:** Table descendant selectors (`th`, `td`) and `:nth-child(even)` target elements inside
a `<table>` rendered by map(). Adding per-element Tailwind classes to every `<th>`/`<td>` in the
map would be more verbose than keeping the CSS class. `:nth-child` has no clean Tailwind equivalent
without adding a class to each `<tr>`.

### 13. `.cell` — `touch-action: none`

**Why:** While Tailwind has `touch-none`, the `.cell` class also needs to be referenced by the
`.board--entering .cell` animation descendant selector (see point 5). The class must stay.
The `touch-action: none` and `background-color: var(--color-surface)` are part of it.

---

## What CAN move to inline Tailwind

These classes are pure layout/typography with no pseudo-elements, no CSS vars in complex
properties, and no descendant selectors. Remove the CSS class definition; apply Tailwind
utilities directly in JSX.

| CSS class                        | Tailwind replacement                                                                                                                                | Used in                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `.header-section`                | `flex items-center gap-1`                                                                                                                           | `Header.tsx`                                                                      |
| `.header-section--right`         | add `justify-end`                                                                                                                                   | `Header.tsx`                                                                      |
| `.header-icon-btn` (layout only) | `flex items-center justify-center w-[42px] h-[42px] cursor-pointer rounded bg-transparent border-none outline-none leading-none`                    | `Header.tsx` — keep `:active { opacity: 0.7 }` as CSS `active:opacity-70` variant |
| `.modal-backdrop`                | `fixed inset-0 bg-black/45 z-[100]`                                                                                                                 | `Modal.tsx`                                                                       |
| `.modal-section`                 | `flex flex-col gap-[10px]`                                                                                                                          | multiple modals                                                                   |
| `.modal-actions`                 | `flex justify-end gap-1.5 px-3 py-2 pb-[10px]`                                                                                                      | multiple modals                                                                   |
| `.modal-content`                 | `p-[18px] flex flex-col gap-[18px] overflow-y-auto min-h-0`                                                                                         | `Modal.tsx`                                                                       |
| `.smiley-button` (layout)        | `flex items-center justify-center w-11 h-11 text-[1.875rem] p-0`                                                                                    | `SmileyButton.tsx` — animation classes `.smiley--win/loss` stay                   |
| `.toggle-row`                    | `flex items-center justify-between gap-3 text-base`                                                                                                 | `Toggle.tsx`                                                                      |
| `.toggle-label`                  | `flex-1`                                                                                                                                            | `Toggle.tsx`                                                                      |
| `.slider-row`                    | `flex items-center gap-[10px] text-base`                                                                                                            | `Slider.tsx`                                                                      |
| `.slider-label`                  | `min-w-14`                                                                                                                                          | `Slider.tsx`                                                                      |
| `.slider-value`                  | `min-w-9 text-right`                                                                                                                                | `Slider.tsx`                                                                      |
| `.slider-root` (layout)          | `relative flex items-center flex-1 h-5 cursor-pointer`                                                                                              | `Slider.tsx`                                                                      |
| `.slider-track`                  | `relative flex-1 h-1 bg-[var(--color-border-dark)] rounded-full overflow-hidden`                                                                    | `Slider.tsx`                                                                      |
| `.slider-range`                  | `absolute h-full bg-[var(--color-n4)] rounded-full`                                                                                                 | `Slider.tsx`                                                                      |
| `.slider-thumb` (layout)         | `block w-4 h-4 rounded-full bg-white border-2 border-[var(--color-n4)] cursor-pointer outline-none`                                                 | `Slider.tsx`                                                                      |
| `.settings-group-label`          | `text-[0.8125rem] font-bold uppercase tracking-[0.05em] text-[var(--color-border-darker)] border-b border-[var(--color-border-dark)] pb-[3px] mb-1` | `SettingsModal.tsx`                                                               |
| `.theme-picker`                  | `flex flex-wrap gap-2`                                                                                                                              | `SettingsModal.tsx`                                                               |
| `.theme-swatch` (layout)         | `flex flex-col items-center gap-1 bg-transparent border-none p-0 cursor-pointer`                                                                    | `SettingsModal.tsx` — `__preview::after` and `--active` variant stay in CSS       |
| `.theme-swatch__label`           | `text-[0.5625rem] leading-[1.2] text-[var(--color-text)] text-center max-w-[44px] overflow-hidden text-ellipsis whitespace-nowrap`                  | `SettingsModal.tsx`                                                               |
| `.preset-option`                 | `flex items-center gap-2 py-1`                                                                                                                      | `NewGameModal.tsx`                                                                |
| `.preset-label`                  | `text-base font-bold cursor-pointer`                                                                                                                | `NewGameModal.tsx`                                                                |
| `.preset-detail`                 | `text-[0.8125rem] text-[var(--color-border-darker)] ml-auto`                                                                                        | `NewGameModal.tsx`                                                                |
| `.custom-inputs`                 | `flex flex-col gap-1.5 pl-[22px] pt-1`                                                                                                              | `NewGameModal.tsx`                                                                |
| `.input-row`                     | `flex items-center gap-2 text-[0.8125rem]`                                                                                                          | `NewGameModal.tsx` — move `w-[50px]` to inline `<label>`                          |
| `.highscore-name-input`          | `w-full` (add to `.xp-input` element)                                                                                                               | `HighScorePrompt.tsx`                                                             |
| `.highscore-time`                | `text-base`                                                                                                                                         | `HighScorePrompt.tsx`                                                             |
| `.highscore-prompt`              | `text-[0.9375rem]`                                                                                                                                  | `HighScorePrompt.tsx`                                                             |
| `.leaderboard-tabs`              | `flex gap-0.5 border-b-2 border-[var(--color-border-dark)] flex-wrap`                                                                               | `LeaderboardModal.tsx`                                                            |
| `.leaderboard-games-played`      | `text-[0.8125rem] text-[var(--color-text-muted)] m-0`                                                                                               | `LeaderboardModal.tsx`                                                            |
| `.leaderboard-table`             | `w-full min-h-[180px]`                                                                                                                              | `LeaderboardModal.tsx`                                                            |
| `.leaderboard-empty`             | `text-[0.9375rem] text-[var(--color-text-muted)] text-center py-6`                                                                                  | `LeaderboardModal.tsx`                                                            |
| `.game-over-result-text`         | `text-base font-bold flex items-center gap-1`                                                                                                       | `GameOverBanner.tsx`                                                              |
| `.game-over-time`                | `font-normal text-[var(--color-text-muted)]`                                                                                                        | `GameOverBanner.tsx`                                                              |
| `.game-over-actions`             | `flex gap-[10px] shrink-0`                                                                                                                          | `GameOverBanner.tsx`                                                              |
| `.resume-info`                   | `text-sm`                                                                                                                                           | `ResumePrompt.tsx`                                                                |
| `.resume-details`                | `text-[0.9375rem] font-bold`                                                                                                                        | `ResumePrompt.tsx`                                                                |

> **Note on `.leaderboard-tab` / `.leaderboard-tab--active`:** The tab has an inset box-shadow
> (must stay in CSS — see rule 2). Only move the `--active` variant's `font-weight: bold` and
> `background-color` to a conditional Tailwind class applied in JSX.

---

## Estimated CSS reduction

| Section                                | Lines today | Lines after               |
| -------------------------------------- | ----------- | ------------------------- |
| Layout-only classes (above table)      | ~220        | 0                         |
| XP shadows + LCD + button shapes       | ~90         | ~90 (unchanged)           |
| Keyframes + animation triggers         | ~120        | ~120 (unchanged)          |
| `body[data-animations='false']` rules  | ~15         | ~15 (unchanged)           |
| Pseudo-elements + data-state selectors | ~40         | ~40 (unchanged)           |
| Landscape sidebar overrides            | ~35         | ~35 (unchanged)           |
| **Total**                              | **~885**    | **~665** (~25% reduction) |

---

## Suggested execution order

1. **`GameOverBanner.tsx`** — smallest, 3 classes, good warm-up
2. **`ResumePrompt.tsx`**, **`HighScorePrompt.tsx`** — 2–3 classes each
3. **`Toggle.tsx`**, **`Slider.tsx`** — UI primitives, isolated changes
4. **`SettingsModal.tsx`** — 6+ classes, test against existing tests
5. **`NewGameModal.tsx`** — input-row label width needs attention
6. **`LeaderboardModal.tsx`** — table descendant selectors stay; tabs stay
7. **`Header.tsx`** — header-section and icon button
8. **`Modal.tsx`** — backdrop, content, section, actions
9. **`SmileyButton.tsx`** — layout only; keep animation classes

Each step: delete the CSS class definition → add Tailwind utilities to the JSX element →
run `pnpm test` and visual check.
