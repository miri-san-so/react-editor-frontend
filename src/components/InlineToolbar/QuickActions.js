import React, { useCallback } from "react";
import Icon from "../shared/Icon";
import { useEditor } from "../../context/EditorContext";
import { findNodeById } from "../../context/editorReducer";
import { DELETE_NODE } from "../../context/editorActions";
import { playSound } from "../../utils/sounds";
import logger from "../../utils/logger";

/**
 * Two separate action pills rendered side by side with a 4px gap.
 * Copy pill: bg #0043ab, border-radius 32px, padding 8px, drop-shadow.
 * Delete pill: bg #bf1600, border-radius 32px, padding 8px, drop-shadow.
 * @returns {React.ReactElement|null}
 */
function QuickActions() {
  const { state, dispatch } = useEditor();

  /**
   * Copies the selected element's data to the clipboard.
   * @param {MouseEvent} event - The click event
   */
  const handleCopy = useCallback(
    (event) => {
      try {
        event?.stopPropagation?.();
        const node = findNodeById(state?.componentTree, state?.selectedNodeId);
        if (node) {
          const copyData = JSON.stringify(node, null, 2);
          navigator?.clipboard?.writeText?.(copyData);
          playSound("COPY");
        }
      } catch (error) {
        logger.warn("QuickActions", "failed to copy element to clipboard", error);
      }
    },
    [state?.componentTree, state?.selectedNodeId]
  );

  /**
   * Deletes the selected element from the tree.
   * @param {MouseEvent} event - The click event
   */
  const handleDelete = useCallback(
    (event) => {
      try {
        event?.stopPropagation?.();
        if (state?.selectedNodeId) {
          dispatch({
            type: DELETE_NODE,
            nodeId: state.selectedNodeId,
          });
        }
      } catch (error) {
        logger.warn("QuickActions", "failed to delete selected element", error);
      }
    },
    [state?.selectedNodeId, dispatch]
  );

  try {
    return (
      <>
        <button
          className="toolbar-pill toolbar-pill--copy"
          onClick={handleCopy}
          title="Copy element"
          type="button"
        >
          <Icon name="copy" size={16} />
        </button>
        <button
          className="toolbar-pill toolbar-pill--delete"
          onClick={handleDelete}
          title="Delete element"
          type="button"
        >
          <Icon name="trash-x" size={16} />
        </button>
      </>
    );
  } catch (error) {
    return null;
  }
}

export default QuickActions;
