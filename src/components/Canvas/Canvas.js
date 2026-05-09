import React, { useRef, useCallback, useState, useEffect } from "react";
import CanvasRenderer from "./CanvasRenderer";
import SelectionOutline from "./SelectionOutline";
import HoverOutline from "./HoverOutline";
import InlineToolbar from "../InlineToolbar/InlineToolbar";
import RemoteCursors from "./RemoteCursors";
import { useEditor } from "../../context/EditorContext";
import useCursors from "../../hooks/useCursors";
import { SELECT_NODE, DESELECT, UPDATE_NODE_CONTENT } from "../../context/editorActions";
import { DEFAULT_CANVAS_BACKGROUND } from "../../constants/editor";
import logger from "../../utils/logger";
import "./Canvas.css";

/**
 * Main canvas component that displays the rendered component
 * and handles element selection via click and Space+drag to pan.
 * @returns {React.ReactElement}
 */
function Canvas() {
  const canvasRef = useRef(null);
  const { state, dispatch } = useEditor();
  const { cursors, handleLocalCursorMove } = useCursors(canvasRef);
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const panRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
  const spaceHeldRef = useRef(false);
  const rafRef = useRef(null);

  /**
   * Tracks Space key state for pan mode.
   */
  useEffect(() => {
    /**
     * @param {KeyboardEvent} event
     */
    const handleKeyDown = (event) => {
      try {
        if (event?.code === "Space" && !event?.target?.isContentEditable &&
            event?.target?.tagName !== "INPUT" && event?.target?.tagName !== "TEXTAREA") {
          event.preventDefault();
          spaceHeldRef.current = true;
          setIsPanning(true);
        }
      } catch (error) {
        logger.warn("Canvas", "handling keydown event", error);
      }
    };

    /**
     * @param {KeyboardEvent} event
     */
    const handleKeyUp = (event) => {
      try {
        if (event?.code === "Space") {
          spaceHeldRef.current = false;
          if (!panRef.current?.active) {
            setIsPanning(false);
          }
        }
      } catch (error) {
        logger.warn("Canvas", "handling keyup event", error);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  /**
   * Handles mousedown to start panning when Space is held.
   * @param {MouseEvent} event
   */
  const handleMouseDown = useCallback((event) => {
    try {
      if (!spaceHeldRef.current || event?.button !== 0) return;

      event.preventDefault();
      const canvas = canvasRef?.current;
      if (!canvas) return;

      panRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: canvas.scrollLeft,
        scrollTop: canvas.scrollTop,
      };
    } catch (error) {
      logger.warn("Canvas", "handling mousedown for pan start", error);
    }
  }, []);

  /**
   * Handles mousemove during panning with requestAnimationFrame throttling.
   * @param {MouseEvent} event
   */
  const handleMouseMove = useCallback((event) => {
    try {
      const pan = panRef?.current;
      if (!pan?.active) return;

      const clientX = event.clientX;
      const clientY = event.clientY;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        try {
          const canvas = canvasRef?.current;
          if (!canvas) return;

          const dx = clientX - pan.startX;
          const dy = clientY - pan.startY;
          canvas.scrollLeft = pan.scrollLeft - dx;
          canvas.scrollTop = pan.scrollTop - dy;
        } catch (innerError) {
          logger.warn("Canvas", "applying pan scroll in rAF", innerError);
        }
      });
    } catch (error) {
      logger.warn("Canvas", "handling mousemove during pan", error);
    }
  }, []);

  /**
   * Handles mouseup to stop panning.
   */
  const handleMouseUp = useCallback(() => {
    try {
      if (panRef.current?.active) {
        panRef.current.active = false;
        if (!spaceHeldRef.current) {
          setIsPanning(false);
        }
      }
    } catch (error) {
      logger.warn("Canvas", "handling mouseup for pan end", error);
    }
  }, []);

  /**
   * Registers global mousemove/mouseup for panning.
   */
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  /**
   * Handles content change from inline editing on the canvas.
   * @param {string} nodeId - The node ID being edited
   * @param {string} content - The new text content
   */
  const handleContentChange = useCallback(
    (nodeId, content) => {
      try {
        dispatch({ type: UPDATE_NODE_CONTENT, nodeId, content });
      } catch (error) {
        logger.warn("Canvas", "dispatching content change update", error);
      }
    },
    [dispatch]
  );

  /**
   * Handles click on the canvas to select/deselect elements.
   * Skipped during panning.
   * @param {MouseEvent} event - The click event
   */
  const handleCanvasClick = useCallback(
    (event) => {
      try {
        if (spaceHeldRef.current) return;

        const nodeElement = event?.target?.closest?.("[data-node-id]");

        if (nodeElement) {
          const nodeId = nodeElement.getAttribute("data-node-id");

          if (nodeId) {
            dispatch({ type: SELECT_NODE, id: nodeId });
            event.stopPropagation();
            return;
          }
        }

        dispatch({ type: DESELECT });
      } catch (error) {
        logger.warn("Canvas", "handling canvas click for selection", error);
      }
    },
    [dispatch]
  );

  /**
   * Tracks which node the cursor is over for hover highlight.
   * @param {MouseEvent} event - The mousemove event
   */
  const handleCanvasMouseMove = useCallback(
    (event) => {
      try {
        if (spaceHeldRef.current || panRef.current?.active) return;

        const nodeElement = event?.target?.closest?.("[data-node-id]");
        const nodeId = nodeElement ? nodeElement.getAttribute("data-node-id") : null;
        setHoveredNodeId(nodeId);
        handleLocalCursorMove(event);
      } catch (error) {
        logger.warn("Canvas", "handling canvas mousemove for hover", error);
      }
    },
    [handleLocalCursorMove]
  );

  /**
   * Scrolls the selected node into view when selection changes.
   */
  useEffect(() => {
    try {
      if (!state?.selectedNodeId) return;

      const element = canvasRef?.current?.querySelector(
        `[data-node-id="${state.selectedNodeId}"]`
      );
      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    } catch (error) {
      logger.warn("Canvas", "scrolling selected node into view", error);
    }
  }, [state?.selectedNodeId]);

  /**
   * Clears hover state when cursor leaves the canvas.
   */
  const handleCanvasMouseLeave = useCallback(() => {
    try {
      setHoveredNodeId(null);
    } catch (error) {
      logger.warn("Canvas", "handling canvas mouseleave", error);
    }
  }, []);

  try {
    return (
      <div
        className={`canvas${isPanning ? " canvas--panning" : ""}`}
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        style={{ backgroundColor: state?.canvasBackground || DEFAULT_CANVAS_BACKGROUND }}
      >
        <div className="canvas__content">
          <CanvasRenderer
            node={state?.componentTree}
            selectedNodeId={state?.selectedNodeId}
            onContentChange={handleContentChange}
          />
        </div>
        <HoverOutline
          hoveredNodeId={hoveredNodeId}
          selectedNodeId={state?.selectedNodeId}
          canvasRef={canvasRef}
          componentTree={state?.componentTree}
        />
        {state?.selectedNodeId && (
          <SelectionOutline
            selectedNodeId={state.selectedNodeId}
            canvasRef={canvasRef}
            componentTree={state.componentTree}
          />
        )}
        <InlineToolbar key={state?.selectedNodeId || "none"} canvasRef={canvasRef} />
        <RemoteCursors cursors={cursors} />
      </div>
    );
  } catch (error) {
    return <div className="canvas canvas--error">Failed to render canvas</div>;
  }
}

export default Canvas;
