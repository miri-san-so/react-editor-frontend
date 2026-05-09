import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useEditor } from "../../context/EditorContext";
import { UPDATE_CSV_CELL } from "../../context/editorActions";
import { csvDataToString } from "../../utils/csvParser";
import logger from "../../utils/logger";
import "./CsvTable.css";

/** @constant {number} Duration in ms to show "Copied!" feedback */
const COPIED_FEEDBACK_DURATION = 2000;

/**
 * Editable CSV table component rendered on the canvas.
 * Supports click-to-edit cells, Tab navigation, and copy-to-clipboard.
 * @param {Object} props
 * @param {Object} props.node - The csv-table component tree node
 * @returns {React.ReactElement|null}
 */
function CsvTable({ node }) {
  const { dispatch } = useEditor();
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const isNavigatingRef = useRef(false);

  const csvData = useMemo(() => node?.csvData || [], [node?.csvData]);
  const csvDelimiter = useMemo(() => node?.csvDelimiter || ",", [node?.csvDelimiter]);
  const rowCount = csvData?.length || 0;
  const colCount = csvData?.[0]?.length || 0;

  /**
   * Focus and select input content when a cell enters edit mode.
   */
  useEffect(() => {
    try {
      if (editingCell && inputRef?.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    } catch (error) {
      logger.warn("CsvTable", "focus on editing cell failed", error);
    }
  }, [editingCell]);

  /**
   * Dispatches the cell update to the editor reducer.
   * @param {number} rowIndex - Row index of the cell
   * @param {number} colIndex - Column index of the cell
   * @param {string} value - New cell value
   */
  const dispatchCellUpdate = useCallback(
    (rowIndex, colIndex, value) => {
      try {
        dispatch({
          type: UPDATE_CSV_CELL,
          nodeId: node?.id,
          rowIndex,
          colIndex,
          value,
        });
      } catch (error) {
        logger.warn("CsvTable", "dispatchCellUpdate failed", error);
      }
    },
    [dispatch, node?.id]
  );

  /**
   * Saves the currently editing cell value to state.
   */
  const saveCurrentCell = useCallback(() => {
    try {
      if (!editingCell) return;

      const currentValue = csvData?.[editingCell.row]?.[editingCell.col] ?? "";
      if (editValue !== currentValue) {
        dispatchCellUpdate(editingCell.row, editingCell.col, editValue);
      }
    } catch (error) {
      logger.warn("CsvTable", "saveCurrentCell failed", error);
    }
  }, [editingCell, editValue, csvData, dispatchCellUpdate]);

  /**
   * Opens a cell for editing.
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   * @param {React.MouseEvent} event - The click event
   */
  const handleCellClick = useCallback(
    (rowIndex, colIndex, event) => {
      try {
        event?.stopPropagation?.();
        setEditingCell({ row: rowIndex, col: colIndex });
        setEditValue(csvData?.[rowIndex]?.[colIndex] ?? "");
      } catch (error) {
        logger.warn("CsvTable", "handleCellClick failed", error);
      }
    },
    [csvData]
  );

  /**
   * Handles blur on the cell input - saves unless navigating via Tab.
   */
  const handleBlur = useCallback(() => {
    try {
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }
      saveCurrentCell();
      setEditingCell(null);
    } catch (error) {
      logger.warn("CsvTable", "handleBlur failed", error);
    }
  }, [saveCurrentCell]);

  /**
   * Navigates to the specified cell, saving current cell first.
   * @param {number} nextRow - Target row index
   * @param {number} nextCol - Target column index
   */
  const navigateToCell = useCallback(
    (nextRow, nextCol) => {
      try {
        isNavigatingRef.current = true;
        saveCurrentCell();
        setEditingCell({ row: nextRow, col: nextCol });
        setEditValue(csvData?.[nextRow]?.[nextCol] ?? "");
      } catch (error) {
        logger.warn("CsvTable", "navigateToCell failed", error);
      }
    },
    [saveCurrentCell, csvData]
  );

  /**
   * Handles keyboard events in the cell input.
   * Enter saves and closes, Tab navigates, Escape cancels.
   * @param {React.KeyboardEvent} event - The keyboard event
   */
  const handleKeyDown = useCallback(
    (event) => {
      try {
        if (!editingCell) return;

        if (event?.key === "Enter") {
          event.preventDefault();
          saveCurrentCell();
          setEditingCell(null);
        } else if (event?.key === "Escape") {
          setEditingCell(null);
        } else if (event?.key === "Tab") {
          event.preventDefault();

          if (event?.shiftKey) {
            const prevCol = editingCell.col - 1;
            if (prevCol >= 0) {
              navigateToCell(editingCell.row, prevCol);
            } else if (editingCell.row > 0) {
              navigateToCell(editingCell.row - 1, colCount - 1);
            }
          } else {
            const nextCol = editingCell.col + 1;
            if (nextCol < colCount) {
              navigateToCell(editingCell.row, nextCol);
            } else if (editingCell.row + 1 < rowCount) {
              navigateToCell(editingCell.row + 1, 0);
            }
          }
        }
      } catch (error) {
        logger.warn("CsvTable", "handleKeyDown failed", error);
      }
    },
    [editingCell, saveCurrentCell, navigateToCell, colCount, rowCount]
  );

  /**
   * Copies the current CSV data to the clipboard.
   * @param {React.MouseEvent} event - The click event
   */
  const handleCopy = useCallback(
    (event) => {
      try {
        event?.stopPropagation?.();
        const csvString = csvDataToString(csvData, csvDelimiter);
        navigator?.clipboard?.writeText?.(csvString);
        setCopied(true);
        setTimeout(() => {
          try {
            setCopied(false);
          } catch (error) {
            logger.warn("CsvTable", "reset copied state failed", error);
          }
        }, COPIED_FEEDBACK_DURATION);
      } catch (error) {
        logger.warn("CsvTable", "handleCopy failed", error);
      }
    },
    [csvData, csvDelimiter]
  );

  /**
   * Renders a table cell (th or td) with optional edit mode.
   * @param {string} cellValue - The cell display value
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   * @param {boolean} isHeader - Whether this is a header cell
   * @returns {React.ReactElement}
   */
  const renderCell = useCallback(
    (cellValue, rowIndex, colIndex, isHeader) => {
      try {
        const isEditing =
          editingCell?.row === rowIndex && editingCell?.col === colIndex;
        const Tag = isHeader ? "th" : "td";
        const className = isEditing ? "csv-table-cell--editing" : "";

        return (
          <Tag
            key={colIndex}
            className={className}
            onClick={(event) => handleCellClick(rowIndex, colIndex, event)}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                className="csv-cell-input"
                value={editValue}
                onChange={(event) => setEditValue(event?.target?.value ?? "")}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
              />
            ) : (
              cellValue
            )}
          </Tag>
        );
      } catch (error) {
        return <td key={colIndex}>{cellValue}</td>;
      }
    },
    [editingCell, editValue, handleCellClick, handleBlur, handleKeyDown]
  );

  try {
    if (!node || !csvData?.length) return null;

    const headerRow = csvData[0] || [];
    const bodyRows = csvData.slice(1);

    return (
      <div
        className="csv-table-wrapper"
        data-node-id={node?.id}
        data-node-type="csv-table"
      >
        <div className="csv-table-toolbar">
          <span className="csv-table-label">{node?.label || "CSV Table"}</span>
          <button
            className={`csv-table-copy-btn ${
              copied ? "csv-table-copy-btn--copied" : ""
            }`}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy CSV"}
          </button>
        </div>
        <div className="csv-table-scroll">
          <table className="csv-table">
            <thead>
              <tr>
                {headerRow.map((cell, colIndex) =>
                  renderCell(cell, 0, colIndex, true)
                )}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, bodyRowIndex) => {
                const actualRowIndex = bodyRowIndex + 1;
                return (
                  <tr key={actualRowIndex}>
                    {row.map((cell, colIndex) =>
                      renderCell(cell, actualRowIndex, colIndex, false)
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default CsvTable;
