import logger from "./logger";

/**
 * Maximum width/height for compressed images.
 * @type {number}
 */
var MAX_IMAGE_DIMENSION = 1200;

/**
 * JPEG compression quality (0-1).
 * @type {number}
 */
var COMPRESSION_QUALITY = 0.7;

/**
 * Regex to match base64 data URI in CSS backgroundImage value.
 * @type {RegExp}
 */
var BASE64_PATTERN = /url\(["']?(data:image\/[^;]+;base64,[^"')]+)["']?\)/;

/**
 * Compresses a base64 image string by resizing it within MAX_IMAGE_DIMENSION
 * and re-encoding as JPEG with reduced quality.
 * @param {string} base64Str - The full data URI (e.g., "data:image/png;base64,...")
 * @returns {Promise<string>} The compressed data URI
 */
function compressBase64Image(base64Str) {
  try {
    return new Promise(function (resolve) {
      try {
        var img = new Image();
        img.onload = function () {
          try {
            var width = img.width;
            var height = img.height;

            /** Only resize if larger than max dimension */
            if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
              var ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(base64Str);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            var compressed = canvas.toDataURL("image/jpeg", COMPRESSION_QUALITY);
            resolve(compressed);
          } catch (error) {
            logger.warn("imageCompressor", "canvas compression failed", error);
            resolve(base64Str);
          }
        };
        img.onerror = function () {
          resolve(base64Str);
        };
        img.src = base64Str;
      } catch (error) {
        resolve(base64Str);
      }
    });
  } catch (error) {
    return Promise.resolve(base64Str);
  }
}

/**
 * Deep-clones a component tree node and compresses any base64 images
 * found in backgroundImage styles to reduce payload size for backend saves.
 * @param {Object} node - The component tree node
 * @returns {Promise<Object>} Cloned node with compressed images
 */
async function compressNodeImages(node) {
  try {
    if (!node) return node;

    var cloned = JSON.parse(JSON.stringify(node));
    await compressNodeImagesInPlace(cloned);
    return cloned;
  } catch (error) {
    logger.warn("imageCompressor", "compressNodeImages failed", error);
    return node;
  }
}

/**
 * Recursively walks a node tree and compresses base64 images in-place.
 * @param {Object} node - The node to process (mutated in place)
 * @returns {Promise<void>}
 */
async function compressNodeImagesInPlace(node) {
  try {
    if (!node) return;

    /** Compress backgroundImage if it contains a base64 data URI */
    var bgImage = node?.styles?.backgroundImage;
    if (bgImage && BASE64_PATTERN.test(bgImage)) {
      var match = bgImage.match(BASE64_PATTERN);
      if (match?.[1]) {
        var compressed = await compressBase64Image(match[1]);
        node.styles.backgroundImage = 'url("' + compressed + '")';
      }
    }

    /** Recurse into children */
    if (node?.children?.length) {
      for (var idx = 0; idx < node.children.length; idx++) {
        await compressNodeImagesInPlace(node.children[idx]);
      }
    }

    /** Handle rawHtml with embedded base64 images */
    if (node?.rawHtml && node.rawHtml.indexOf("data:image") !== -1) {
      var srcPattern = /src=["'](data:image\/[^;]+;base64,[^"']+)["']/g;
      var srcMatch;
      var htmlResult = node.rawHtml;
      var replacements = [];

      while ((srcMatch = srcPattern.exec(node.rawHtml)) !== null) {
        try {
          replacements.push({
            original: srcMatch[1],
            compressed: await compressBase64Image(srcMatch[1]),
          });
        } catch (error) {
          logger.warn("imageCompressor", "rawHtml image compression failed", error);
        }
      }

      for (var rIdx = 0; rIdx < replacements.length; rIdx++) {
        htmlResult = htmlResult.replace(replacements[rIdx].original, replacements[rIdx].compressed);
      }

      node.rawHtml = htmlResult;
    }
  } catch (error) {
    logger.warn("imageCompressor", "compressNodeImagesInPlace failed", error);
  }
}

export { compressNodeImages };
