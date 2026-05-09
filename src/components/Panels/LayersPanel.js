import React, { useCallback } from "react";
import LayerItem from "./LayerItem";
import { useEditor } from "../../context/EditorContext";
import { SELECT_NODE } from "../../context/editorActions";
import logger from "../../utils/logger";
import "./LayersPanel.css";

/**
 * Layers panel showing the component tree hierarchy
 * @returns {React.ReactElement|null}
 */
function LayersPanel() {
  const { state, dispatch } = useEditor();

  /**
   * Handles selecting a node from the layers tree
   * @param {string} nodeId - The node ID to select
   */
  const handleSelect = useCallback(
    (nodeId) => {
      try {
        dispatch({ type: SELECT_NODE, id: nodeId });
      } catch (error) {
        logger.warn("LayersPanel", "handleSelect dispatch failed", error);
      }
    },
    [dispatch]
  );

  /**
   * Recursively renders the tree starting from a node
   * @param {Object} node - The current node
   * @param {number} depth - Current nesting depth
   * @returns {React.ReactElement[]}
   */
  function renderTree(node, depth = 0) {
    try {
      if (!node) return null;

      const elements = [];

      elements.push(
        <LayerItem
          key={node?.id}
          node={node}
          depth={depth}
          isSelected={node?.id === state?.selectedNodeId}
          onSelect={handleSelect}
        />
      );

      if (node?.children) {
        node.children.forEach((child) => {
          const childElements = renderTree(child, depth + 1);
          if (childElements) {
            elements.push(...(Array.isArray(childElements) ? childElements : [childElements]));
          }
        });
      }

      return elements;
    } catch (error) {
      return null;
    }
  }

  try {
    const tree = state?.componentTree;

    return (
      <div className="layers-panel">
        <div className="layers-panel__tree">
          {tree?.id === "canvas-root"
            ? tree?.children?.map((child) => renderTree(child, 0))
            : renderTree(tree)}
        </div>
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default LayersPanel;
