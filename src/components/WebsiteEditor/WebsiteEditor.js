import React, { useEffect, useRef } from "react";
import { EditorProvider, useEditor } from "../../context/EditorContext";
import Canvas from "../Canvas/Canvas";
import QuickActionToolbar from "../QuickActionToolbar/QuickActionToolbar";
import LayersPanel from "../Panels/LayersPanel";
import PropertiesPanel from "../Panels/PropertiesPanel";
import useKeyboardShortcuts from "../../hooks/useKeyboardShortcuts";
import useEditorSounds from "../../hooks/useEditorSounds";
import useUrlSelection from "../../hooks/useUrlSelection";
import useBackendSync from "../../hooks/useBackendSync";
import { parseJSX } from "../../utils/jsxParser";
import { parseCSV } from "../../utils/csvParser";
import { parseFigma } from "../../utils/figmaParser";
import { detectPasteType, PASTE_TYPES } from "../../utils/pasteDetector";
import { ADD_NODE } from "../../context/editorActions";
import { AUTO_SAVE_DEBOUNCE_MS } from "../../constants/editor";
import logger from "../../utils/logger";
import "./WebsiteEditor.css";

/**
 * Inner editor layout that reads context for panel visibility
 * @param {Object} props
 * @param {Function} [props.onSave] - Callback fired with serialized component on changes
 * @param {boolean} [props.soundEnabled] - Whether sound effects are enabled
 * @param {Function} [props.toggleSound] - Callback to toggle sound effects
 * @returns {React.ReactElement}
 */
function EditorLayout({ onSave, soundEnabled, toggleSound }) {
  const { state, dispatch } = useEditor();
  const saveTimerRef = useRef(null);
  const previousTreeRef = useRef(null);

  useKeyboardShortcuts({ state, dispatch });
  useUrlSelection({ state, dispatch });
  const { isLoading } = useBackendSync({ state, dispatch });

  /**
   * Listens for paste events to detect content type and add as a new node.
   * Supports JSX components, CSV tables, and is extensible for future types.
   * Only activates when no input/textarea/contentEditable is focused.
   */
  useEffect(() => {
    /**
     * @param {ClipboardEvent} event - The paste event
     */
    const handlePaste = (event) => {
      try {
        const isInputFocused =
          event?.target?.tagName === "INPUT" ||
          event?.target?.tagName === "TEXTAREA" ||
          event?.target?.tagName === "SELECT" ||
          event?.target?.isContentEditable;

        if (isInputFocused) return;

        const text = event?.clipboardData?.getData?.("text") || "";
        if (!text?.trim()) return;

        const pasteType = detectPasteType(text);
        if (!pasteType) return;

        event.preventDefault();

        if (pasteType === PASTE_TYPES.FIGMA) {
          const figmaNode = parseFigma(text);
          if (figmaNode?.id && figmaNode?.type) {
            dispatch({ type: ADD_NODE, node: figmaNode });
          }
        } else if (pasteType === PASTE_TYPES.JSX) {
          const tree = parseJSX(text);
          if (tree?.id && tree?.type) {
            dispatch({ type: ADD_NODE, node: tree });
          }
        } else if (pasteType === PASTE_TYPES.CSV) {
          const csvNode = parseCSV(text);
          if (csvNode?.id && csvNode?.type) {
            dispatch({ type: ADD_NODE, node: csvNode });
          }
        }
      } catch (error) {
        logger.warn("WebsiteEditor", "paste handler failed", error);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [dispatch]);

  /**
   * Debounced auto-save when component tree changes
   */
  useEffect(() => {
    try {
      if (!onSave) return;

      const currentTreeJson = JSON.stringify(state?.componentTree);
      if (previousTreeRef.current === currentTreeJson) return;
      previousTreeRef.current = currentTreeJson;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        try {
          onSave(JSON.parse(JSON.stringify(state?.componentTree)));
        } catch (error) {
          logger.warn("WebsiteEditor", "auto-save serialization failed", error);
        }
      }, AUTO_SAVE_DEBOUNCE_MS);

      return () => {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
      };
    } catch (error) {
      logger.warn("WebsiteEditor", "auto-save effect failed", error);
    }
  }, [state?.componentTree, onSave]);

  try {
    const panelsVisible = state?.panelsVisible;

    return (
      <div
        className={`website-editor ${
          panelsVisible ? "website-editor--panels-visible" : ""
        }`}
      >
        <LayersPanel />
        <div className="website-editor__canvas-area">
          {isLoading && (
            <div className="website-editor__loader">
              <div className="website-editor__spinner" />
            </div>
          )}
          <Canvas />
        </div>
        <PropertiesPanel />
        <QuickActionToolbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      </div>
    );
  } catch (error) {
    return (
      <div className="website-editor website-editor--error">
        Failed to load editor
      </div>
    );
  }
}

/**
 * Main WebsiteEditor component - the public API
 * @param {Object} props
 * @param {Object} props.component - The component tree data to render and edit
 * @param {Function} [props.onSave] - Callback fired with serialized component on changes
 * @returns {React.ReactElement}
 */
function WebsiteEditor({ component, onSave }) {
  const { onAction, soundEnabled, toggleSound } = useEditorSounds();

  try {
    return (
      <EditorProvider componentTree={component} onAction={onAction}>
        <EditorLayout onSave={onSave} soundEnabled={soundEnabled} toggleSound={toggleSound} />
      </EditorProvider>
    );
  } catch (error) {
    return (
      <div className="website-editor website-editor--error">
        Failed to load editor
      </div>
    );
  }
}

export default WebsiteEditor;
