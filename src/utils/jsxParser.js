/**
 * Parses React/JSX component code into the editor's component tree format.
 * Supports inline styles, className, SVG elements, and nested structures.
 */

import { sanitizeHtml } from "./sanitizer";
import logger from "./logger";

/**
 * Generates a unique node ID without shared mutable state.
 * Uses a combination of timestamp and random value to avoid collisions.
 * @returns {string}
 */
function nextId() {
  try {
    return `pasted-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  } catch (error) {
    logger.error("jsxParser", "nextId generation failed", error);
    return `pasted-fallback-${Math.random()}`;
  }
}

/**
 * Extracts the JSX body from a React component string.
 * Handles arrow functions, function declarations, or raw JSX.
 * @param {string} code - The component source code
 * @returns {string} The extracted JSX body
 */
function extractJSXBody(code) {
  try {
    const trimmed = code?.trim() || "";

    // Already raw JSX
    if (trimmed.startsWith("<")) return trimmed;

    // Find first opening HTML tag
    const firstTagMatch = trimmed.match(/<([a-zA-Z][a-zA-Z0-9.-]*)/);
    if (!firstTagMatch) return trimmed;

    const rootTag = firstTagMatch[1];
    const startIdx = firstTagMatch.index;

    // Find last closing tag for the root element
    const closingTag = `</${rootTag}>`;
    const lastCloseIdx = trimmed.lastIndexOf(closingTag);

    if (lastCloseIdx === -1) {
      return trimmed.slice(startIdx);
    }

    return trimmed.slice(startIdx, lastCloseIdx + closingTag.length);
  } catch (error) {
    return code || "";
  }
}

/**
 * Converts a camelCase string to kebab-case.
 * @param {string} str - camelCase string
 * @returns {string} kebab-case string
 */
function camelToKebab(str) {
  try {
    return str.replace(/([A-Z])/g, "-$1").toLowerCase();
  } catch (error) {
    return str;
  }
}

/**
 * Converts a kebab-case string to camelCase.
 * @param {string} str - kebab-case string
 * @returns {string} camelCase string
 */
function kebabToCamel(str) {
  try {
    return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  } catch (error) {
    return str;
  }
}

/**
 * Converts JSX inline style object contents to a CSS string.
 * e.g. "color: '#fff', fontSize: '14px'" → "color: #fff; font-size: 14px"
 * @param {string} content - Style object content between {{ and }}
 * @returns {string} CSS string
 */
function jsxStyleToCSS(content) {
  try {
    const pairs = [];
    const regex = /(\w+)\s*:\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|(\d+(?:\.\d+)?))/g;
    let match;
    while ((match = regex.exec(content))) {
      const jsKey = match[1];
      const value = match[2] ?? match[3] ?? match[4] ?? match[5] ?? "";
      const cssKey = camelToKebab(jsKey);
      pairs.push(`${cssKey}: ${value}`);
    }
    return pairs.join("; ");
  } catch (error) {
    return "";
  }
}

/**
 * Converts JSX style={{...}} expressions to HTML style="..." attributes.
 * Handles nested braces correctly.
 * @param {string} code - JSX code string
 * @returns {string} Code with HTML-style style attributes
 */
function convertJSXStyles(code) {
  try {
    let result = "";
    let pos = 0;

    while (pos < code.length) {
      const styleStart = code.indexOf("style={{", pos);
      if (styleStart === -1) {
        result += code.slice(pos);
        break;
      }

      result += code.slice(pos, styleStart);

      // Find matching }}
      let depth = 2;
      let idx = styleStart + 8;
      while (idx < code.length && depth > 0) {
        if (code[idx] === "{") depth++;
        else if (code[idx] === "}") depth--;
        idx++;
      }

      const styleContent = code.slice(styleStart + 8, idx - 2);
      const cssString = jsxStyleToCSS(styleContent);
      result += `style="${cssString}"`;

      pos = idx;
    }

    return result;
  } catch (error) {
    return code || "";
  }
}

/**
 * Removes JSX expression braces for simple string expressions.
 * Converts {" "} to a space, removes other non-string expressions.
 * @param {string} code - JSX code string
 * @returns {string} Cleaned code
 */
function cleanJSXExpressions(code) {
  try {
    // Convert {"string"} or {'string'} to just the string
    let result = code.replace(/\{"([^"]*)"\}/g, "$1");
    result = result.replace(/\{'([^']*)'\}/g, "$1");
    return result;
  } catch (error) {
    return code || "";
  }
}

/**
 * Converts JSX syntax to parseable HTML string.
 * @param {string} jsx - The JSX string
 * @returns {string} HTML string ready for DOMParser
 */
function jsxToHtml(jsx) {
  try {
    let html = jsx;

    // Convert style={{...}} to style="..." first (before removing braces)
    html = convertJSXStyles(html);

    // Clean up simple JSX string expressions
    html = cleanJSXExpressions(html);

    // className → class
    html = html.replace(/className=/g, "class=");

    // htmlFor → for
    html = html.replace(/htmlFor=/g, "for=");

    // Remove React-specific props: key, ref, dangerouslySetInnerHTML
    html = html.replace(/\s(?:key|ref|dangerouslySetInnerHTML)=\{[^}]*\}/g, "");

    // Remove event handlers: onClick={...}, onChange={...}, onBlur={...} etc.
    html = html.replace(/\s(?:on[A-Z]\w*)=\{[^}]*\}/g, "");

    // Convert camelCase SVG attributes to kebab-case
    const svgAttrs = [
      "strokeWidth", "strokeMiterlimit", "strokeLinecap", "strokeLinejoin",
      "strokeDasharray", "strokeDashoffset", "strokeOpacity",
      "fillRule", "fillOpacity", "clipRule", "clipPath",
    ];
    for (const attr of svgAttrs) {
      const kebab = camelToKebab(attr);
      html = html.replace(new RegExp(attr + "=", "g"), kebab + "=");
    }

    return html;
  } catch (error) {
    return jsx || "";
  }
}

/**
 * Extracts inline styles from a DOM element's style attribute.
 * Returns a JS object with camelCase keys for React compatibility.
 * @param {Element} element - The DOM element
 * @returns {Object} Style object
 */
function extractStyles(element) {
  try {
    const styles = {};
    const styleAttr = element?.getAttribute?.("style");
    if (!styleAttr) return styles;

    const pairs = styleAttr.split(";");
    for (const pair of pairs) {
      const colonIdx = pair.indexOf(":");
      if (colonIdx === -1) continue;
      const key = pair.slice(0, colonIdx).trim();
      const value = pair.slice(colonIdx + 1).trim();
      if (key && value) {
        styles[kebabToCamel(key)] = value;
      }
    }
    return styles;
  } catch (error) {
    return {};
  }
}

/**
 * Recursively converts a DOM element into a component tree node.
 * SVG elements are stored as raw HTML for faithful rendering.
 * @param {Element} element - The DOM element
 * @returns {Object|null} Component tree node
 */
function domToTree(element) {
  try {
    if (!element) return null;

    const tag = element.tagName?.toLowerCase() || "div";
    const id = nextId();
    const className = element.getAttribute("class") || "";
    const styles = extractStyles(element);

    // SVG elements: store entire SVG as sanitized raw HTML
    if (tag === "svg") {
      return {
        id,
        type: "html",
        tag: "svg",
        label: "SVG Icon",
        className,
        rawHtml: sanitizeHtml(element.outerHTML),
        styles,
      };
    }

    // Style elements: store CSS as sanitized raw HTML and inject later
    if (tag === "style") {
      return {
        id,
        type: "html",
        tag: "style",
        label: "Styles",
        className: "",
        rawHtml: sanitizeHtml(element.outerHTML),
        styles: {},
      };
    }

    const childElements = Array.from(element.children || []);

    // Leaf element with no child elements → text node
    if (childElements.length === 0) {
      const text = element.textContent || "";
      return {
        id,
        type: "text",
        tag,
        label: text.trim().slice(0, 40) || tag,
        className,
        content: text.trim(),
        styles,
      };
    }

    // Container with children
    const children = [];
    const childNodes = element.childNodes || [];

    for (const child of childNodes) {
      if (child.nodeType === 1) {
        // ELEMENT_NODE
        const childTree = domToTree(child);
        if (childTree) children.push(childTree);
      } else if (child.nodeType === 3) {
        // TEXT_NODE
        const text = child.textContent?.trim();
        if (text) {
          children.push({
            id: nextId(),
            type: "text",
            tag: "span",
            label: text.slice(0, 40),
            className: "",
            content: text,
            styles: {},
          });
        }
      }
    }

    // Generate readable label
    let label = tag;
    if (className) {
      const firstClass = className.split(" ")[0];
      label = `${tag}.${firstClass}`;
    }
    if (label.length > 40) {
      label = label.slice(0, 40);
    }

    return {
      id,
      type: "container",
      tag,
      label,
      className,
      styles,
      children,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Checks whether a string looks like JSX or component code.
 * @param {string} input - The string to check
 * @returns {boolean}
 */
function looksLikeJSX(input) {
  try {
    const trimmed = input?.trim() || "";
    return trimmed.includes("<") && trimmed.includes(">");
  } catch (error) {
    return false;
  }
}

/**
 * Parses a React/JSX component string into the editor's component tree format.
 * @param {string} input - The component source code or raw JSX
 * @returns {Object|null} Component tree node, or null on failure
 */
function parseJSX(input) {
  try {
    const jsxBody = extractJSXBody(input);
    if (!jsxBody) return null;

    const html = jsxToHtml(jsxBody);
    if (!html) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const root = doc.body?.firstElementChild;

    if (!root) return null;

    return domToTree(root);
  } catch (error) {
    return null;
  }
}

export { parseJSX, looksLikeJSX };
