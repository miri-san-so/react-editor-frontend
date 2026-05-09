import React, { useCallback } from "react";
import Icon from "../shared/Icon";
import { useEditor } from "../../context/EditorContext";
import { findNodeById } from "../../context/editorReducer";
import { UPDATE_NODE_STYLE } from "../../context/editorActions";
import logger from "../../utils/logger";

const ALIGNMENT_CYCLE = ["left", "center", "right"];

/**
 * Single blue pill button that cycles through text-alignment values.
 * Design spec: bg #0163d8, padding 8px, border-radius 32px, drop-shadow.
 * @returns {React.ReactElement|null}
 */
function AlignmentButton() {
  const { state, dispatch } = useEditor();

  /**
   * Cycles to the next alignment value on click.
   * @param {MouseEvent} event - The click event
   */
  const handleClick = useCallback(
    (event) => {
      try {
        event?.stopPropagation?.();
        const selectedNode = findNodeById(
          state?.componentTree,
          state?.selectedNodeId
        );
        if (!selectedNode) return;

        const currentAlign = selectedNode?.styles?.textAlign || "left";
        const currentIndex = ALIGNMENT_CYCLE.indexOf(currentAlign);
        const nextIndex = (currentIndex + 1) % ALIGNMENT_CYCLE.length;

        dispatch({
          type: UPDATE_NODE_STYLE,
          nodeId: state?.selectedNodeId,
          property: "textAlign",
          value: ALIGNMENT_CYCLE[nextIndex],
        });
      } catch (error) {
        logger.warn("AlignmentButton", "failed to cycle text alignment", error);
      }
    },
    [state?.componentTree, state?.selectedNodeId, dispatch]
  );

  try {
    return (
      <button
        className="toolbar-pill toolbar-pill--align"
        onClick={handleClick}
        title="Text alignment"
        type="button"
      >
        <Icon name="align-justified" size={16} />
      </button>
    );
  } catch (error) {
    return null;
  }
}

export default AlignmentButton;
