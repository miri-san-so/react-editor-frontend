/**
 * Detects and parses Figma plugin clipboard data.
 * The Figma plugin wraps converted nodes in a JSON envelope with
 * a "__figmaEditorData__" marker for unambiguous detection.
 */

import logger from "./logger";

/** @constant {string} Marker property name in the clipboard envelope */
const FIGMA_MARKER_KEY = "__figmaEditorData__";

/** @constant {number} Expected envelope version */
const EXPECTED_VERSION = 1;

/**
 * Checks whether a string looks like Figma plugin clipboard data.
 * Performs a strict structural check: valid JSON with the marker property set to true.
 * @param {string} input - The string to check
 * @returns {boolean} True if the input is a Figma plugin envelope
 */
function looksLikeFigma(input) {
  try {
    const trimmed = input?.trim() || "";
    if (!trimmed.startsWith("{")) return false;

    const parsed = JSON.parse(trimmed);
    return parsed?.[FIGMA_MARKER_KEY] === true && parsed?.node != null;
  } catch (error) {
    return false;
  }
}

/**
 * Parses Figma plugin clipboard data and extracts the component tree node.
 * Validates the envelope structure and the inner node's required fields.
 * @param {string} input - The clipboard text containing the Figma envelope
 * @returns {Object|null} The extracted component tree node, or null on failure
 */
function parseFigma(input) {
  try {
    const trimmed = input?.trim() || "";
    if (!trimmed) return null;

    const envelope = JSON.parse(trimmed);

    if (envelope?.[FIGMA_MARKER_KEY] !== true) {
      logger.warn("figmaParser", "Missing or invalid Figma marker");
      return null;
    }

    if (envelope?.version != null && envelope.version !== EXPECTED_VERSION) {
      logger.warn(
        "figmaParser",
        "Version mismatch: expected " + EXPECTED_VERSION + ", got " + envelope.version
      );
    }

    const node = envelope?.node;
    if (!node?.id || !node?.type) {
      logger.warn("figmaParser", "Invalid node: missing id or type");
      return null;
    }

    return node;
  } catch (error) {
    logger.error("figmaParser", "Failed to parse Figma data", error);
    return null;
  }
}

export { looksLikeFigma, parseFigma };
