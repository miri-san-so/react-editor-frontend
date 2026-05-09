import React, { useState, useCallback, useEffect, useRef } from "react";
import Icon from "../shared/Icon";
import { useEditor } from "../../context/EditorContext";
import { findNodeById } from "../../context/editorReducer";
import { UPDATE_NODE_STYLE } from "../../context/editorActions";
import logger from "../../utils/logger";

/**
 * Opacity control rendered as a blue pill with a focusable input.
 * Layout: eye icon → editable value input (with % suffix).
 * When focused, user can type a value or use arrow keys (±1, shift ±10).
 * @returns {React.ReactElement|null}
 */
function OpacityInput() {
  const { state, dispatch } = useEditor();
  const [isFocused, setIsFocused] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

  /**
   * Returns the current opacity as a percentage integer (0–100).
   * @returns {number}
   */
  function getCurrentOpacity() {
    try {
      const node = findNodeById(state?.componentTree, state?.selectedNodeId);
      const opacity = node?.styles?.opacity ?? 1;
      return Math.round(opacity * 100);
    } catch (error) {
      return 100;
    }
  }

  /**
   * Sync edit value when selection or tree changes (while not focused).
   */
  useEffect(() => {
    try {
      if (!isFocused) {
        setEditValue(String(getCurrentOpacity()));
      }
    } catch (error) {
      logger.warn("OpacityInput", "failed to sync edit value with current opacity", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.componentTree, state?.selectedNodeId, isFocused]);

  /**
   * Dispatches an opacity update from a percentage value.
   * @param {number} percentage - New opacity percentage (0–100)
   */
  const applyOpacity = useCallback(
    (percentage) => {
      try {
        const clamped = Math.max(0, Math.min(100, percentage));
        dispatch({
          type: UPDATE_NODE_STYLE,
          nodeId: state?.selectedNodeId,
          property: "opacity",
          value: clamped / 100,
        });
      } catch (error) {
        logger.warn("OpacityInput", "failed to apply opacity update", error);
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
      setEditValue(String(getCurrentOpacity()));
      event?.target?.select?.();
    } catch (error) {
      logger.warn("OpacityInput", "failed to handle input focus", error);
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
        applyOpacity(parsed);
      }
    } catch (error) {
      logger.warn("OpacityInput", "failed to commit opacity on blur", error);
    }
  }, [editValue, applyOpacity]);

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
          const current = parseInt(editValue, 10) || getCurrentOpacity();
          const newVal = Math.max(0, Math.min(100, current + step));
          setEditValue(String(newVal));
          applyOpacity(newVal);
        } else if (event?.key === "Enter") {
          event.preventDefault();
          event?.target?.blur?.();
        }
      } catch (error) {
        logger.warn("OpacityInput", "failed to handle keyboard navigation for opacity", error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editValue, applyOpacity, state?.componentTree, state?.selectedNodeId]
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
      logger.warn("OpacityInput", "failed to handle input value change", error);
    }
  }, []);

  try {
    const displayValue = isFocused ? editValue : String(getCurrentOpacity());

    return (
      <div
        className={`toolbar-pill toolbar-pill--value${isFocused ? " toolbar-pill--value--active" : ""}`}
        onClick={(event) => { try { event?.stopPropagation?.(); inputRef?.current?.focus(); } catch (error) { logger.warn("OpacityInput", "failed to focus input on pill click", error); } }}
      >
        <Icon name="eye" size={16} />
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
          title="Opacity"
          style={{ width: `${Math.max(2, displayValue.length)}ch` }}
        />
        <span className="toolbar-pill__suffix">%</span>
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default OpacityInput;
