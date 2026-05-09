import React, { useCallback } from "react";
import Icon from "../shared/Icon";
import { useEditor } from "../../context/EditorContext";
import { findNodeById } from "../../context/editorReducer";
import { UPDATE_NODE_STYLE } from "../../context/editorActions";
import { normalizeFontWeight } from "../../constants/editor";
import logger from "../../utils/logger";

/**
 * Single blue pill that groups Bold, Italic and Strikethrough toggle buttons.
 * Design spec: bg #0163d8, padding 2px, gap 2px, border-radius 32px.
 * Each sub-button: padding 6px, border-radius 32px.
 * @returns {React.ReactElement|null}
 */
function FontStyleGroup() {
  const { state, dispatch } = useEditor();

  /**
   * Returns the currently selected node or null.
   * @returns {Object|null}
   */
  function getSelectedNode() {
    try {
      return findNodeById(state?.componentTree, state?.selectedNodeId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Toggles bold on the selected node.
   * @param {MouseEvent} event - The click event
   */
  const handleBold = useCallback(
    (event) => {
      try {
        event?.stopPropagation?.();
        const node = findNodeById(state?.componentTree, state?.selectedNodeId);
        if (!node) return;

        const normalizedWeight = normalizeFontWeight(node?.styles?.fontWeight);
        const isBold = normalizedWeight === "700";
        dispatch({
          type: UPDATE_NODE_STYLE,
          nodeId: state?.selectedNodeId,
          property: "fontWeight",
          value: isBold ? "400" : "700",
        });
      } catch (error) {
        logger.warn("FontStyleGroup", "failed to toggle bold style", error);
      }
    },
    [state?.componentTree, state?.selectedNodeId, dispatch]
  );

  /**
   * Toggles italic on the selected node.
   * @param {MouseEvent} event - The click event
   */
  const handleItalic = useCallback(
    (event) => {
      try {
        event?.stopPropagation?.();
        const node = findNodeById(state?.componentTree, state?.selectedNodeId);
        if (!node) return;

        const isItalic = node?.styles?.fontStyle === "italic";
        dispatch({
          type: UPDATE_NODE_STYLE,
          nodeId: state?.selectedNodeId,
          property: "fontStyle",
          value: isItalic ? "normal" : "italic",
        });
      } catch (error) {
        logger.warn("FontStyleGroup", "failed to toggle italic style", error);
      }
    },
    [state?.componentTree, state?.selectedNodeId, dispatch]
  );

  /**
   * Toggles strikethrough on the selected node.
   * @param {MouseEvent} event - The click event
   */
  const handleStrikethrough = useCallback(
    (event) => {
      try {
        event?.stopPropagation?.();
        const node = findNodeById(state?.componentTree, state?.selectedNodeId);
        if (!node) return;

        const isStrikethrough =
          node?.styles?.textDecoration === "line-through";
        dispatch({
          type: UPDATE_NODE_STYLE,
          nodeId: state?.selectedNodeId,
          property: "textDecoration",
          value: isStrikethrough ? "none" : "line-through",
        });
      } catch (error) {
        logger.warn("FontStyleGroup", "failed to toggle strikethrough style", error);
      }
    },
    [state?.componentTree, state?.selectedNodeId, dispatch]
  );

  try {
    const selectedNode = getSelectedNode();
    const isBold = normalizeFontWeight(selectedNode?.styles?.fontWeight) === "700";
    const isItalic = selectedNode?.styles?.fontStyle === "italic";
    const isStrikethrough =
      selectedNode?.styles?.textDecoration === "line-through";

    return (
      <div className="toolbar-pill toolbar-pill--style">
        <button
          className={`style-btn${isBold ? " style-btn--active" : ""}`}
          onClick={handleBold}
          title="Bold"
          type="button"
        >
          <Icon name="bold" size={16} />
        </button>
        <button
          className={`style-btn${isItalic ? " style-btn--active" : ""}`}
          onClick={handleItalic}
          title="Italic"
          type="button"
        >
          <Icon name="italic" size={16} />
        </button>
        <button
          className={`style-btn${isStrikethrough ? " style-btn--active" : ""}`}
          onClick={handleStrikethrough}
          title="Strikethrough"
          type="button"
        >
          <Icon name="strikethrough" size={16} />
        </button>
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default FontStyleGroup;
