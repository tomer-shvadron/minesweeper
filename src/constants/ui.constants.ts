/** Font scale for revealed numbered cells relative to cell size. */
export const CELL_FONT_SCALE_NUMBER = 0.65;
/** Font scale for non-number cells (flags, mines, etc.) relative to cell size. */
export const CELL_FONT_SCALE_ICON = 0.72;
/** Font scale for question marks relative to cell size. */
export const CELL_FONT_SCALE_QUESTION = 0.6;

/** Cell border width as a proportion of cell size (canvas renderer). */
export const CELL_BORDER_WIDTH_RATIO = 0.08;
/** @deprecated Individual cell radius removed — board-level rounding is used instead. */
export const CELL_BORDER_RADIUS = 0;

/** Border radius applied to the board container corners, in px. */
export const BOARD_BORDER_RADIUS = 8;

/** Delay in ms before a touch is considered a long press. */
export const LONG_PRESS_DELAY_MS = 650;
/** Movement threshold in px to cancel a long press. */
export const TOUCH_MOVE_THRESHOLD_PX = 10;

// ── Swipe-to-flag gesture constants (useLongPress) ────────────────────────
/** Minimum downward px to start swipe-to-flag evaluation. */
export const SWIPE_DOWN_THRESHOLD = 20;
/** Max ms from touch-start within which the swipe threshold must be crossed. */
export const SWIPE_TIME_WINDOW = 150;
/** Ms to wait after threshold crossing before committing the flag. */
export const SWIPE_COMMIT_DELAY = 80;
/** Additional px of travel during commit window that cancels the flag. */
export const SWIPE_CANCEL_MOVE = 12;
/** Max ms for a touch to be considered a tap (not a long press). */
export const TAP_MAX_DURATION = 200;

// ── Pan gesture constants (usePinchZoom) ──────────────────────────────────
/** Minimum px of movement before single-finger panning activates. */
export const PAN_THRESHOLD = 10;

/** Game timer tick interval in ms. */
export const TIMER_INTERVAL_MS = 1000;

/** Maximum length for a player name in the high score prompt. */
export const MAX_PLAYER_NAME_LENGTH = 20;
