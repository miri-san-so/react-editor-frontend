import React, { createContext, useContext, useReducer, useMemo } from "react";
import { editorReducer } from "./editorReducer";
import { DEFAULT_CANVAS_BACKGROUND } from "../constants/editor";
import logger from "../utils/logger";

const EditorContext = createContext(null);

/**
 * Creates the initial editor state from a component tree
 * @param {Object} componentTree - The initial component tree
 * @returns {Object} The initial state
 */
/**
 * Wraps a component in a canvas root container for multi-component support.
 * @param {Object} component - The component tree to wrap
 * @returns {Object} Canvas root node containing the component
 */
function createCanvasRoot(component) {
  try {
    const children = component ? [component] : [];
    return {
      id: "canvas-root",
      type: "container",
      tag: "div",
      label: "Canvas",
      styles: {
        width: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "40px",
        padding: "80px",
        boxSizing: "border-box",
      },
      children,
    };
  } catch (error) {
    return component;
  }
}

function createInitialState(componentTree) {
  try {
    const root = createCanvasRoot(componentTree);
    return {
      componentTree: root,
      selectedNodeId: null,
      panelsVisible: false,
      toolMode: "select",
      xrayMode: false,
      canvasBackground: DEFAULT_CANVAS_BACKGROUND,
      history: [typeof structuredClone === "function" ? structuredClone(root) : JSON.parse(JSON.stringify(root))],
      historyIndex: 0,
    };
  } catch (error) {
    logger.error("EditorContext", "createInitialState failed", error);
    const root = createCanvasRoot(componentTree);
    return {
      componentTree: root,
      selectedNodeId: null,
      panelsVisible: false,
      toolMode: "select",
      xrayMode: false,
      canvasBackground: DEFAULT_CANVAS_BACKGROUND,
      history: [root],
      historyIndex: 0,
    };
  }
}

/**
 * Provider component for editor state
 * @param {Object} props
 * @param {Object} props.componentTree - The initial component tree
 * @param {Function} [props.onAction] - Optional callback fired after every dispatch with the action
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement}
 */
function EditorProvider({ componentTree, onAction, children }) {
  const [state, rawDispatch] = useReducer(
    editorReducer,
    componentTree,
    createInitialState
  );

  const dispatch = useMemo(() => {
    try {
      if (!onAction) return rawDispatch;
      return (action) => {
        rawDispatch(action);
        try {
          onAction(action);
        } catch (error) {
          logger.warn("EditorContext", "onAction callback failed", error);
        }
      };
    } catch (error) {
      return rawDispatch;
    }
  }, [rawDispatch, onAction]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

/**
 * Hook to access editor context
 * @returns {{ state: Object, dispatch: Function }}
 */
function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}

export { EditorProvider, useEditor };
