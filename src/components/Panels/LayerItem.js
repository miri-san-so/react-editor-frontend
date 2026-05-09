import React, { useCallback } from "react";
import Icon from "../shared/Icon";
import logger from "../../utils/logger";

/**
 * Returns the appropriate icon name for a given node.
 * Root container -> "code", other containers -> "frame", text -> "text-size"
 * @param {Object} node - The component tree node
 * @param {number} depth - Nesting depth (0 = root)
 * @returns {string}
 */
function getIconName(node, depth) {
  try {
    if (depth === 0 && node?.type === "container") return "code";
    if (node?.type === "container") return "frame";
    if (node?.type === "html") return "code";
    return "text-size";
  } catch (error) {
    return "frame";
  }
}

/**
 * Single layer item in the layers panel tree
 * @param {Object} props
 * @param {Object} props.node - The component tree node
 * @param {number} props.depth - Nesting depth for indentation
 * @param {boolean} props.isSelected - Whether this node is selected
 * @param {Function} props.onSelect - Called with node ID when clicked
 * @returns {React.ReactElement|null}
 */
function LayerItem({ node, depth, isSelected, onSelect }) {
  /**
   * Handles click to select this layer
   * @param {MouseEvent} event - The click event
   */
  const handleClick = useCallback(
    (event) => {
      try {
        event?.stopPropagation?.();
        onSelect?.(node?.id);
      } catch (error) {
        logger.warn("LayerItem", "handleClick failed", error);
      }
    },
    [node?.id, onSelect]
  );

  try {
    const isRoot = depth === 0;
    const indent = depth > 0 ? depth * 24 + 12 : 12;

    return (
      <div
        className={`layer-item${isSelected ? " layer-item--selected" : ""}${isRoot ? " layer-item--root" : ""}`}
        style={{ paddingLeft: indent }}
        onClick={handleClick}
      >
        <Icon name={getIconName(node, depth)} size={16} className="layer-item__icon" />
        <span className="layer-item__label">
          {node?.label || ""}
        </span>
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default LayerItem;
