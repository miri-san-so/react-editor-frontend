import React, { useState, useCallback, useEffect, useRef } from "react";
import Icon from "../shared/Icon";
import { useEditor } from "../../context/EditorContext";
import { findNodeById } from "../../context/editorReducer";
import { UPDATE_NODE_STYLE } from "../../context/editorActions";
import logger from "../../utils/logger";

/**
 * Font-size control rendered as a blue pill with a focusable input.
 * Layout: text-size icon → editable value input (with px suffix).
 * When focused, user can type a value or use arrow keys (±1, shift ±10).
 * @returns {React.ReactElement|null}
 */
function FontSizeInput() {
  const { state, dispatch } = useEditor();
  const [isFocused, setIsFocused] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

  /**
   * Returns the current font size as an integer.
   * @returns {number}
   */
  function getCurrentSize() {
    try {
      const node = findNodeById(state?.componentTree, state?.selectedNodeId);
      const sizeStr = node?.styles?.fontSize || "16px";
      return parseInt(sizeStr, 10) || 16;
    } catch (error) {
      return 16;
    }
  }

  /**
   * Sync edit value when selection or tree changes (while not focused).
   */
  useEffect(() => {
    try {
      if (!isFocused) {
        setEditValue(String(getCurrentSize()));
      }
    } catch (error) {
      logger.warn("FontSizeInput", "failed to sync edit value with current font size", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.componentTree, state?.selectedNodeId, isFocused]);

  /**
   * Dispatches a font-size update.
   * @param {number} newSize - The new size in pixels
   */
  const applySize = useCallback(
    (newSize) => {
      try {
        const clamped = Math.max(8, Math.min(200, newSize));
        dispatch({
          type: UPDATE_NODE_STYLE,
          nodeId: state?.selectedNodeId,
          property: "fontSize",
          value: `${clamped}px`,
        });
      } catch (error) {
        logger.warn("FontSizeInput", "failed to apply font size update", error);
      }
    },
    [state?.selectedNodeId, dispatch]
  );

  /**
   * Handles focus on the input - selects all text for easy replacement.
   * @param {FocusEvent} event - The focus event
   */
  const handleFocus = useCallback((event) => {
    try {
      setIsFocused(true);
      setEditValue(String(getCurrentSize()));
      event?.target?.select?.();
    } catch (error) {
      logger.warn("FontSizeInput", "failed to handle input focus", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.componentTree, state?.selectedNodeId]);

  /**
   * Handles blur - commits the typed value.
   */
  const handleBlur = useCallback(() => {
    try {
      setIsFocused(false);
      const parsed = parseInt(editValue, 10);
      if (!isNaN(parsed)) {
        applySize(parsed);
      }
    } catch (error) {
      logger.warn("FontSizeInput", "failed to commit font size on blur", error);
    }
  }, [editValue, applySize]);

  /**
   * Handles keyboard events for arrow key stepping and Enter to commit.
   * @param {KeyboardEvent} event - The keyboard event
   */
  const handleKeyDown = useCallback(
    (event) => {
      try {
        if (event?.key === "ArrowUp" || event?.key === "ArrowDown") {
          event.preventDefault();
          event.stopPropagation();
          const delta = event.key === "ArrowUp" ? 1 : -1;
          const step = event?.shiftKey ? delta * 10 : delta;
          const current = parseInt(editValue, 10) || getCurrentSize();
          const newVal = Math.max(8, Math.min(200, current + step));
          setEditValue(String(newVal));
          applySize(newVal);
        } else if (event?.key === "Enter") {
          event.preventDefault();
          event?.target?.blur?.();
        }
      } catch (error) {
        logger.warn("FontSizeInput", "failed to handle keyboard navigation for font size", error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editValue, applySize, state?.componentTree, state?.selectedNodeId]
  );

  /**
   * Handles input value changes.
   * @param {Event} event - The input change event
   */
  const handleChange = useCallback((event) => {
    try {
      const val = event?.target?.value?.replace(/[^0-9]/g, "") || "";
      setEditValue(val);
    } catch (error) {
      logger.warn("FontSizeInput", "failed to handle input value change", error);
    }
  }, []);

  try {
    const displayValue = isFocused ? editValue : String(getCurrentSize());

    return (
      <div
        className={`toolbar-pill toolbar-pill--value${isFocused ? " toolbar-pill--value--active" : ""}`}
        onClick={(event) => { try { event?.stopPropagation?.(); inputRef?.current?.focus(); } catch (error) { logger.warn("FontSizeInput", "failed to focus input on pill click", error); } }}
      >
        <Icon name="text-size" size={16} />
        <input
          ref={inputRef}
          className="toolbar-pill__input"
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(event) => event?.stopPropagation?.()}
          title="Font size"
          style={{ width: `${Math.max(2, displayValue.length)}ch` }}
        />
        <span className="toolbar-pill__suffix">px</span>
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default FontSizeInput;
