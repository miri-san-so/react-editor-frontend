import DOMPurify from "dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Allows safe SVG elements and attributes while stripping scripts and event handlers.
 * @param {string} html - The raw HTML string to sanitize
 * @returns {string} The sanitized HTML string
 */
function sanitizeHtml(html) {
  try {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true, svg: true, svgFilters: true },
      ADD_TAGS: ["style", "img"],
      ADD_ATTR: ["target", "viewBox", "xmlns", "fill", "stroke", "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "points", "transform", "src", "alt"],
      ADD_DATA_URI_TAGS: ["img"],
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    });
  } catch (error) {
    return "";
  }
}

export { sanitizeHtml };
