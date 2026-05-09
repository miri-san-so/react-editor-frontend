/**
 * Editor-wide constants and configuration values.
 * Centralizes magic numbers and repeated strings to avoid duplication.
 */

/** Maximum number of history entries for undo/redo */
export const MAX_HISTORY_LENGTH = 50;

/** Auto-save debounce delay in milliseconds */
export const AUTO_SAVE_DEBOUNCE_MS = 1000;

/** Default canvas background color */
export const DEFAULT_CANVAS_BACKGROUND = "#7d251c";

/** Font size constraints */
export const FONT_SIZE_MIN = 8;
export const FONT_SIZE_MAX = 200;

/** Default font size in pixels */
export const DEFAULT_FONT_SIZE = 16;

/** Default font family */
export const DEFAULT_FONT_FAMILY = "Prata";

/** Opacity constraints (as percentage) */
export const OPACITY_MIN = 0;
export const OPACITY_MAX = 100;

/** Maximum depth for component tree validation (prevents stack overflow) */
export const MAX_TREE_DEPTH = 50;

/** Maximum JSON import payload size in bytes (~1MB) */
export const MAX_IMPORT_SIZE_BYTES = 1048576;

/** localStorage key for sound enabled/disabled preference */
export const SOUND_STORAGE_KEY = "editor_sound_enabled";

/** Valid node types for component tree validation */
export const VALID_NODE_TYPES = ["container", "text", "html", "csv-table"];

/** Font weight keyword-to-numeric mapping */
export const FONT_WEIGHT_MAP = {
  thin: "100",
  extralight: "200",
  light: "300",
  normal: "400",
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
};

/**
 * Normalizes a font weight value to its numeric string form.
 * Handles both keyword values ("bold", "normal") and numeric strings ("700").
 * @param {string|number} weight - The font weight to normalize
 * @returns {string} Numeric font weight string (e.g., "400", "700")
 */
export function normalizeFontWeight(weight) {
  try {
    if (weight === undefined || weight === null) return "400";
    const strWeight = String(weight).toLowerCase().trim();
    return FONT_WEIGHT_MAP[strWeight] || strWeight || "400";
  } catch (error) {
    return "400";
  }
}
