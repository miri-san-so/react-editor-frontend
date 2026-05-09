import React, { useState, useLayoutEffect, useCallback } from "react";
import logger from "../../utils/logger";
import "./SelectionOutline.css";

/**
 * Renders a blue outline overlay positioned over the selected element
 * @param {Object} props
 * @param {string} props.selectedNodeId - The ID of the selected node
 * @param {React.RefObject} props.canvasRef - Ref to the canvas container
 * @param {Object} props.componentTree - The component tree (triggers re-measure on style changes)
 * @returns {React.ReactElement|null}
 */
function SelectionOutline({ selectedNodeId, canvasRef, componentTree }) {
  const [rect, setRect] = useState(null);

  /**
   * Measures the selected element and updates the outline position
   */
  const measureElement = useCallback(() => {
    try {
      if (!selectedNodeId || !canvasRef?.current) {
        setRect(null);
        return;
      }

      const element = canvasRef.current.querySelector(
        `[data-node-id="${selectedNodeId}"]`
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
  }, [selectedNodeId, canvasRef]);

  useLayoutEffect(() => {
    measureElement();
  }, [measureElement, componentTree]);

  useLayoutEffect(() => {
    /**
     * Recalculates outline on window resize
     */
    function handleResize() {
      try {
        measureElement();
      } catch (error) {
        logger.warn("SelectionOutline", "recalculating outline on resize", error);
      }
    }

    window.addEventListener("resize", handleResize);

    /**
     * Observe canvas element resizing (e.g. panel toggle transitions)
     */
    let resizeObserver;
    const canvasEl = canvasRef?.current;
    try {
      if (canvasEl) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(canvasEl);
        canvasEl.addEventListener("scroll", handleResize);
      }
    } catch (error) {
      logger.warn("SelectionOutline", "setting up ResizeObserver on canvas element", error);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        resizeObserver?.disconnect();
        canvasEl?.removeEventListener?.("scroll", handleResize);
      } catch (error) {
        logger.warn("SelectionOutline", "cleaning up resize observer and scroll listener", error);
      }
    };
  }, [measureElement, canvasRef]);

  try {
    if (!rect) {
      return null;
    }

    return (
      <div
        className="selection-outline"
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

export default SelectionOutline;
