import { useState, useEffect, useCallback, useRef } from "react";
import logger from "../utils/logger";

const WS_URL = process.env.REACT_APP_WS_URL || "wss://getsnapdrop.in/react-editor";
const THROTTLE_MS = 50;

/**
 * Manages WebSocket connection for multiplayer cursor sharing.
 * Sends local cursor position and receives remote cursor positions.
 * @param {React.RefObject} canvasRef - Ref to the canvas DOM element
 * @returns {{ cursors: Array<{id: string, color: string, x: number, y: number}>, handleLocalCursorMove: Function }}
 */
function useCursors(canvasRef) {
  const [cursors, setCursors] = useState([]);
  const wsRef = useRef(null);
  const lastSendRef = useRef(0);

  /**
   * Opens WebSocket on mount, listens for remote cursor updates,
   * and cleans up on unmount.
   */
  useEffect(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      /**
       * Handles incoming WebSocket messages for cursor updates and removals.
       * @param {MessageEvent} event - The WebSocket message event
       */
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event?.data);

          if (msg?.type === "cursor") {
            setCursors((prev) => {
              try {
                const filtered = prev.filter((cursor) => cursor?.id !== msg?.id);
                return [...filtered, { id: msg.id, color: msg.color, name: msg.name, x: msg.x, y: msg.y, lastActive: Date.now() }];
              } catch (error) {
                logger.warn("useCursors", "updating cursors state", error);
                return prev;
              }
            });
          } else if (msg?.type === "remove") {
            setCursors((prev) => {
              try {
                return prev.filter((cursor) => cursor?.id !== msg?.id);
              } catch (error) {
                logger.warn("useCursors", "removing cursor", error);
                return prev;
              }
            });
          }
        } catch (error) {
          logger.warn("useCursors", "parsing WebSocket message", error);
        }
      };

      ws.onclose = () => {
        try {
          setCursors([]);
        } catch (error) {
          logger.warn("useCursors", "handling WebSocket close", error);
        }
      };

      ws.onerror = () => {
        try {
          logger.warn("useCursors", "WebSocket connection error");
        } catch (error) {
          logger.warn("useCursors", "handling WebSocket error", error);
        }
      };

      return () => {
        try {
          ws.close();
        } catch (error) {
          logger.warn("useCursors", "closing WebSocket", error);
        }
      };
    } catch (error) {
      logger.warn("useCursors", "WebSocket setup failed", error);
    }
  }, []);

  /**
   * Converts a mouse event to canvas-relative coordinates and sends
   * the position via WebSocket. Throttled to THROTTLE_MS intervals.
   * @param {MouseEvent} event - The mouse event from the canvas
   */
  const handleLocalCursorMove = useCallback((event) => {
    try {
      const now = Date.now();
      if (now - lastSendRef.current < THROTTLE_MS) return;
      lastSendRef.current = now;

      const canvas = canvasRef?.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cursorX = event.clientX - rect.left + canvas.scrollLeft;
      const cursorY = event.clientY - rect.top + canvas.scrollTop;

      const ws = wsRef?.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ x: cursorX, y: cursorY }));
      }
    } catch (error) {
      logger.warn("useCursors", "sending cursor position", error);
    }
  }, [canvasRef]);

  return { cursors, handleLocalCursorMove };
}

export default useCursors;
