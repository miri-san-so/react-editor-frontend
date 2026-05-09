import React, { useState, useLayoutEffect, useEffect, useCallback, useRef } from "react";
import { useEditor } from "../../context/EditorContext";
import { findNodeById } from "../../context/editorReducer";
import logger from "../../utils/logger";
import AlignmentButton from "./AlignmentButton";
import FontStyleGroup from "./FontStyleGroup";
import FontSizeInput from "./FontSizeInput";
import FontFamilyDropdown from "./FontFamilyDropdown";
import OpacityInput from "./OpacityInput";
import QuickActions from "./QuickActions";
import "./InlineToolbar.css";

const TOOLBAR_HEIGHT = 40;
const TOOLBAR_GAP = 8;
const EXIT_DURATION = 120;

/**
 * Floating inline toolbar that appears above the selected element.
 * Renders each control group as a separate pill — no shared container background.
 * Handles enter (staggered fade-up) and exit (quick fade-out) animations.
 * @param {Object} props
 * @param {React.RefObject} props.canvasRef - Ref to the canvas container
 * @returns {React.ReactElement|null}
 */
function InlineToolbar({ canvasRef }) {
  const { state } = useEditor();
  const [position, setPosition] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const toolbarRef = useRef(null);
  const exitTimerRef = useRef(null);

  /**
   * Manages enter/exit lifecycle based on selectedNodeId.
   */
  useEffect(() => {
    try {
      if (state?.selectedNodeId) {
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
          exitTimerRef.current = null;
        }
        setExiting(false);
        setVisible(true);
      } else if (visible) {
        setExiting(true);
        exitTimerRef.current = setTimeout(() => {
          try {
            setVisible(false);
            setExiting(false);
          } catch (error) {
            logger.warn("InlineToolbar", "failed to clear exit animation state", error);
          }
        }, EXIT_DURATION);
      }
    } catch (error) {
      logger.warn("InlineToolbar", "failed to manage toolbar visibility lifecycle", error);
    }

    return () => {
      try {
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
        }
      } catch (error) {
        logger.warn("InlineToolbar", "failed to clear exit timer on cleanup", error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.selectedNodeId]);

  /**
   * Calculates the toolbar position relative to the selected element.
   */
  const calculatePosition = useCallback(() => {
    try {
      if (!state?.selectedNodeId || !canvasRef?.current) {
        return;
      }

      const element = canvasRef.current.querySelector(
        `[data-node-id="${state.selectedNodeId}"]`
      );
      if (!element) {
        return;
      }

      const elementRect = element.getBoundingClientRect();
      const canvasEl = canvasRef.current;
      const canvasRect = canvasEl.getBoundingClientRect();
      const scrollTop = canvasEl.scrollTop || 0;
      const scrollLeft = canvasEl.scrollLeft || 0;

      const topPosition =
        elementRect.top - canvasRect.top + scrollTop - TOOLBAR_HEIGHT - TOOLBAR_GAP;
      const shouldFlip = topPosition < scrollTop;

      setFlipped(shouldFlip);
      setPosition({
        top: shouldFlip
          ? elementRect.bottom - canvasRect.top + scrollTop + TOOLBAR_GAP
          : topPosition,
        left: elementRect.left - canvasRect.left + scrollLeft,
      });
    } catch (error) {
      logger.warn("InlineToolbar", "failed to calculate toolbar position", error);
    }
  }, [state?.selectedNodeId, canvasRef]);

  useLayoutEffect(() => {
    calculatePosition();
  }, [calculatePosition, state?.componentTree]);

  useLayoutEffect(() => {
    /**
     * Recalculates position on window resize or canvas resize.
     */
    function handleResize() {
      try {
        calculatePosition();
      } catch (error) {
        logger.warn("InlineToolbar", "failed to recalculate position on resize", error);
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
      logger.warn("InlineToolbar", "failed to set up resize observer on canvas", error);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        resizeObserver?.disconnect();
        canvasEl?.removeEventListener?.("scroll", handleResize);
      } catch (error) {
        logger.warn("InlineToolbar", "failed to clean up resize observer and scroll listener", error);
      }
    };
  }, [calculatePosition, canvasRef]);

  try {
    if (!visible || !position) {
      return null;
    }

    const selectedNode = findNodeById(state?.componentTree, state?.selectedNodeId);
    const isTextNode = selectedNode?.type === "text";

    return (
      <div
        className={`inline-toolbar${flipped ? " inline-toolbar--flipped" : ""}${exiting ? " inline-toolbar--exiting" : ""}`}
        ref={toolbarRef}
        style={{
          top: position.top,
          left: position.left,
        }}
        onClick={(event) => event?.stopPropagation?.()}
      >
        {isTextNode && <AlignmentButton />}
        {isTextNode && <FontStyleGroup />}
        <OpacityInput />
        {isTextNode && <FontSizeInput />}
        {isTextNode && <FontFamilyDropdown />}
        <QuickActions />
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default InlineToolbar;
