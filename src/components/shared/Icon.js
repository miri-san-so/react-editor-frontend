import React, { useState, useEffect } from "react";
import logger from "../../utils/logger";

/**
 * In-memory cache of fetched SVG markup keyed by icon name.
 * Shared across all Icon instances so each SVG is fetched only once.
 * @type {Object<string, string>}
 */
var svgCache = {};

/**
 * In-flight fetch promises keyed by icon name to avoid duplicate requests.
 * @type {Object<string, Promise<string>>}
 */
var fetchPromises = {};

/**
 * List of all available icon names to preload on first import.
 * @type {string[]}
 */
var ICON_NAMES = [
  "align-justified",
  "bold",
  "code",
  "copy",
  "eye",
  "frame",
  "hand-stop",
  "italic",
  "layout-sidebar",
  "letter-case",
  "microphone",
  "pointer",
  "strikethrough",
  "text-size",
  "trash-x",
  "volume",
  "volume-off",
];

/**
 * Fetches an SVG file and returns its markup string.
 * Deduplicates concurrent requests for the same icon.
 * @param {string} name - The icon name
 * @returns {Promise<string>} The SVG markup string
 */
function fetchSvg(name) {
  try {
    if (svgCache[name]) {
      return Promise.resolve(svgCache[name]);
    }

    if (fetchPromises[name]) {
      return fetchPromises[name];
    }

    var url = "/assets/icons/tabler-icon-" + name + ".svg";
    fetchPromises[name] = fetch(url)
      .then(function (response) {
        try {
          if (!response?.ok) {
            return "";
          }
          return response.text();
        } catch (error) {
          return "";
        }
      })
      .then(function (text) {
        try {
          svgCache[name] = text || "";
          delete fetchPromises[name];
          return svgCache[name];
        } catch (error) {
          return "";
        }
      })
      .catch(function () {
        delete fetchPromises[name];
        return "";
      });

    return fetchPromises[name];
  } catch (error) {
    return Promise.resolve("");
  }
}

/**
 * Preloads all known icons into cache on module load.
 * Runs once at startup so icons are ready before components mount.
 */
function preloadIcons() {
  try {
    ICON_NAMES.forEach(function (name) {
      fetchSvg(name);
    });
  } catch (error) {
    logger.warn("Icon", "preloadIcons failed", error);
  }
}

preloadIcons();

/**
 * Renders an inline SVG icon from the public assets.
 * SVGs are fetched once and cached in memory — no repeated network requests.
 * @param {Object} props
 * @param {string} props.name - Icon name (e.g., "pointer" maps to tabler-icon-pointer.svg)
 * @param {number} [props.size=20] - Icon size in pixels
 * @param {string} [props.className] - Optional CSS class
 * @param {Function} [props.onClick] - Optional click handler
 * @param {string} [props.title] - Optional accessibility title
 * @returns {React.ReactElement|null}
 */
function Icon({ name, size = 20, className = "", onClick, title }) {
  var [svgMarkup, setSvgMarkup] = useState(svgCache[name] || "");

  useEffect(function () {
    try {
      if (svgCache[name]) {
        setSvgMarkup(svgCache[name]);
        return;
      }

      fetchSvg(name).then(function (markup) {
        try {
          setSvgMarkup(markup || "");
        } catch (error) {
          logger.warn("Icon", "setSvgMarkup failed", error);
        }
      });
    } catch (error) {
      logger.warn("Icon", "useEffect failed for icon: " + name, error);
    }
  }, [name]);

  try {
    if (!svgMarkup) {
      return null;
    }

    /**
     * Strip the outer <svg> tag attributes and re-apply with our own size/class.
     * Extracts inner content between first > and last </svg>.
     */
    var innerMatch = svgMarkup.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    var innerContent = innerMatch ? innerMatch[1] : "";

    if (!innerContent) {
      return null;
    }

    /** Replace hardcoded stroke="white" on inner elements so they inherit currentColor from CSS */
    innerContent = innerContent.replace(/stroke="white"/g, 'stroke="currentColor"');

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "inherit" }}
        role="img"
        aria-label={title || name}
        dangerouslySetInnerHTML={{ __html: innerContent }}
      />
    );
  } catch (error) {
    return null;
  }
}

export default Icon;
