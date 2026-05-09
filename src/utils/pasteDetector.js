/**
 * Centralized paste type detection.
 * Determines the type of content being pasted to route it to the correct parser.
 * Designed for easy extension with new paste types (e.g., Figma components).
 */

import { looksLikeJSX } from "./jsxParser";
import { looksLikeCSV } from "./csvParser";
import { looksLikeFigma } from "./figmaParser";

/** @enum {string} Supported paste content types */
const PASTE_TYPES = {
  FIGMA: "figma",
  JSX: "jsx",
  CSV: "csv",
};

/**
 * Detects the type of pasted content.
 * Checks Figma first (strictest — requires valid JSON with marker key),
 * then JSX, then CSV. This order prevents false positives.
 * @param {string} text - The pasted text content
 * @returns {string|null} The detected paste type, or null if unrecognized
 */
function detectPasteType(text) {
  try {
    const trimmed = text?.trim() || "";
    if (!trimmed) return null;

    if (looksLikeFigma(trimmed)) return PASTE_TYPES.FIGMA;

    if (looksLikeJSX(trimmed)) return PASTE_TYPES.JSX;

    if (looksLikeCSV(trimmed)) return PASTE_TYPES.CSV;

    return null;
  } catch (error) {
    return null;
  }
}

export { detectPasteType, PASTE_TYPES };
