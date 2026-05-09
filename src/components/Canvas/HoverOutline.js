import React, { useState, useLayoutEffect, useCallback } from "react";
import "./HoverOutline.css";

/**
 * Renders a light blue outline overlay positioned over the hovered element.
 * Hidden when the hovered element is the same as the selected element.
 * @param {Object} props
 * @param {string|null} props.hoveredNodeId - The ID of the hovered node
 * @param {string|null} props.selectedNodeId - The ID of the selected node
 * @param {React.RefObject} props.canvasRef - Ref to the canvas container
 * @param {Object} props.componentTree - The component tree (triggers re-measure)
 * @returns {React.ReactElement|null}
 */
function HoverOutline({ hoveredNodeId, selectedNodeId, canvasRef, componentTree }) {
  const [rect, setRect] = useState(null);

  /**
   * Measures the hovered element and updates the outline position
   */
  const measureElement = useCallback(() => {
    try {
      if (!hoveredNodeId || !canvasRef?.current || hoveredNodeId === selectedNodeId) {
        setRect(null);
        return;
      }

      const element = canvasRef.current.querySelector(
        `[data-node-id="${hoveredNodeId}"]`
      );
      if (!element) {
        setRect(null);
        return;
      }

      const elementRect = element.getBoundingClientRect();
      const canvasEl = canvasRef.current;
      const canvasRect = canvasEl.getBoundingClientRect();

      setRect({
        top: elementRect.top - canvasRect.top + canvasEl.scrollTop,
        left: elementRect.left - canvasRect.left + canvasEl.scrollLeft,
        width: elementRect.width,
        height: elementRect.height,
      });
    } catch (error) {
      setRect(null);
    }
  }, [hoveredNodeId, selectedNodeId, canvasRef]);

  useLayoutEffect(() => {
    measureElement();
  }, [measureElement, componentTree]);

  try {
    if (!rect) {
      return null;
    }

    return (
      <div
        className="hover-outline"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
    );
  } catch (error) {
    return null;
  }
}

export default HoverOutline;
