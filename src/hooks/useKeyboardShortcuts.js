import { useEffect, useCallback } from "react";
import { SELECT_NODE, DESELECT, DELETE_NODE, UNDO, REDO, TOGGLE_PANELS } from "../context/editorActions";
import logger from "../utils/logger";

/**
 * Finds the parent node of a given node ID in the tree.
 * @param {Object} tree - The root node
 * @param {string} nodeId - The node ID to find the parent of
 * @returns {Object|null} The parent node, or null if not found
 */
function findParent(tree, nodeId) {
  try {
    if (!tree?.children) return null;
    for (const child of tree.children) {
      if (child?.id === nodeId) return tree;
      const found = findParent(child, nodeId);
      if (found) return found;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Gets the sibling IDs for a given node within its parent container.
 * @param {Object} tree - The root node
 * @param {string|null} selectedId - The currently selected node ID
 * @returns {string[]} Array of sibling node IDs
 */
function getSiblingIds(tree, selectedId) {
  try {
    if (!tree) return [];
    if (!selectedId) {
      return tree?.children?.map((child) => child.id) || [];
    }
    const parent = findParent(tree, selectedId);
    if (parent?.children) {
      return parent.children.map((child) => child.id);
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Custom hook that registers global keyboard shortcuts for the editor
 * @param {Object} params
 * @param {Object} params.state - Editor state
 * @param {Function} params.dispatch - Editor dispatch function
 */
function useKeyboardShortcuts({ state, dispatch }) {
  /**
   * Handles keyboard shortcuts
   * @param {KeyboardEvent} event - The keyboard event
   */
  const handleKeyDown = useCallback(
    (event) => {
      try {
        const isInputFocused =
          event?.target?.tagName === "INPUT" ||
          event?.target?.tagName === "TEXTAREA" ||
          event?.target?.tagName === "SELECT" ||
          event?.target?.isContentEditable;

        const isMeta = event?.metaKey || event?.ctrlKey;

        if (isMeta && event?.shiftKey && event?.key === "z") {
          event.preventDefault();
          dispatch({ type: REDO });
          return;
        }

        if (isMeta && event?.key === "z") {
          event.preventDefault();
          dispatch({ type: UNDO });
          return;
        }

        if (isMeta && event?.key === "\\") {
          event.preventDefault();
          dispatch({ type: TOGGLE_PANELS });
          return;
        }

        if (event?.key === "Tab") {
          event.preventDefault();
          const ids = getSiblingIds(state?.componentTree, state?.selectedNodeId);
          if (ids.length === 0) return;

          const currentIndex = ids.indexOf(state?.selectedNodeId);
          let nextIndex;

          if (event?.shiftKey) {
            nextIndex = currentIndex <= 0 ? ids.length - 1 : currentIndex - 1;
          } else {
            nextIndex = currentIndex === -1 || currentIndex >= ids.length - 1 ? 0 : currentIndex + 1;
          }

          dispatch({ type: SELECT_NODE, id: ids[nextIndex] });
          return;
        }

        if (isInputFocused) {
          return;
        }

        if (event?.key === "Escape" && state?.selectedNodeId) {
          dispatch({ type: DESELECT });
          return;
        }

        if (
          (event?.key === "Delete" || event?.key === "Backspace") &&
          state?.selectedNodeId
        ) {
          event.preventDefault();
          dispatch({
            type: DELETE_NODE,
            nodeId: state.selectedNodeId,
          });
          return;
        }
      } catch (error) {
        logger.warn("useKeyboardShortcuts", "handleKeyDown failed", error);
      }
    },
    [state?.selectedNodeId, state?.componentTree, dispatch]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
