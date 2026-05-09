/**
 * Parses CSV/TSV text into the editor's component tree format.
 * Supports comma and tab delimiters, quoted fields, and escaped quotes.
 */

import logger from "./logger";

/**
 * Generates a unique node ID for CSV nodes without shared mutable state.
 * @returns {string} Unique CSV node ID
 */
function nextCsvId() {
  try {
    return `csv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  } catch (error) {
    logger.error("csvParser", "nextCsvId generation failed", error);
    return `csv-fallback-${Math.random()}`;
  }
}

/**
 * Detects whether the CSV text uses commas or tabs as delimiters.
 * @param {string} text - The CSV text to analyze
 * @returns {string} The detected delimiter character
 */
function detectDelimiter(text) {
  try {
    const firstLine = text?.split("\n")?.[0] || "";
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    return tabCount > commaCount ? "\t" : ",";
  } catch (error) {
    return ",";
  }
}

/**
 * Parses a single CSV line into an array of field values.
 * Handles quoted fields with embedded delimiters and escaped quotes.
 * @param {string} line - A single line of CSV text
 * @param {string} delimiter - The delimiter character
 * @returns {string[]} Array of parsed field values
 */
function parseCSVLine(line, delimiter) {
  try {
    const fields = [];
    let current = "";
    let inQuotes = false;

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];

      if (inQuotes) {
        if (char === '"') {
          if (charIndex + 1 < line.length && line[charIndex + 1] === '"') {
            current += '"';
            charIndex++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          fields.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }

    fields.push(current.trim());
    return fields;
  } catch (error) {
    return [line || ""];
  }
}

/**
 * Checks whether a string looks like CSV or TSV data.
 * Requires at least 2 lines with consistent column counts and at least 2 columns.
 * @param {string} input - The string to check
 * @returns {boolean} True if the input looks like CSV data
 */
function looksLikeCSV(input) {
  try {
    const trimmed = input?.trim() || "";
    if (!trimmed) return false;

    if (trimmed.includes("<") && trimmed.includes(">")) return false;

    const lines = trimmed.split(/\r?\n/).filter((line) => line?.trim());
    if (lines.length < 2) return false;

    const delimiter = detectDelimiter(trimmed);
    const columnCounts = lines.map(
      (line) => parseCSVLine(line, delimiter).length
    );

    const firstCount = columnCounts[0];
    if (firstCount < 2) return false;

    return columnCounts.every((count) => count === firstCount);
  } catch (error) {
    return false;
  }
}

/**
 * Parses CSV text into a component tree node with type 'csv-table'.
 * The node contains a 2D array of cell values in csvData.
 * @param {string} text - The CSV text to parse
 * @returns {Object|null} Component tree node, or null on failure
 */
function parseCSV(text) {
  try {
    const trimmed = text?.trim() || "";
    if (!trimmed) return null;

    const delimiter = detectDelimiter(trimmed);
    const lines = trimmed.split(/\r?\n/).filter((line) => line?.trim());

    if (lines.length < 2) return null;

    const rows = lines.map((line) => parseCSVLine(line, delimiter));

    const maxColumns = Math.max(...rows.map((row) => row.length));
    const normalizedRows = rows.map((row) => {
      const paddedRow = [...row];
      while (paddedRow.length < maxColumns) {
        paddedRow.push("");
      }
      return paddedRow;
    });

    const rowCount = normalizedRows.length;

    return {
      id: nextCsvId(),
      type: "csv-table",
      tag: "div",
      label: `CSV Table (${rowCount}\u00D7${maxColumns})`,
      styles: {},
      csvData: normalizedRows,
      csvDelimiter: delimiter,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Converts a 2D array of CSV data back into a CSV string.
 * Handles quoting for fields that contain the delimiter, quotes, or newlines.
 * @param {string[][]} csvData - The 2D array of cell values
 * @param {string} [delimiter=','] - The delimiter to use
 * @returns {string} The CSV string
 */
function csvDataToString(csvData, delimiter = ",") {
  try {
    if (!csvData?.length) return "";

    return csvData
      .map((row) =>
        row
          .map((cell) => {
            const cellValue = cell ?? "";
            if (
              cellValue.includes(delimiter) ||
              cellValue.includes('"') ||
              cellValue.includes("\n")
            ) {
              return `"${cellValue.replace(/"/g, '""')}"`;
            }
            return cellValue;
          })
          .join(delimiter)
      )
      .join("\n");
  } catch (error) {
    return "";
  }
}

export { parseCSV, looksLikeCSV, csvDataToString };
