import React, { useState, useCallback, useRef, useEffect } from "react";
import { useEditor } from "../../context/EditorContext";
import { SET_COMPONENT_TREE } from "../../context/editorActions";
import { VALID_NODE_TYPES, MAX_TREE_DEPTH, MAX_IMPORT_SIZE_BYTES } from "../../constants/editor";
import logger from "../../utils/logger";
import "./ImportModal.css";

/**
 * Recursively validates that a parsed object is a valid component tree node.
 * Checks required fields, valid types, and enforces a max depth to prevent stack overflow.
 * @param {*} obj - The object to validate
 * @param {number} [depth=0] - Current recursion depth
 * @returns {{ valid: boolean, error: string }} Validation result with error message
 */
function validateNode(obj, depth = 0) {
  try {
    if (depth > MAX_TREE_DEPTH) {
      return { valid: false, error: `Component tree exceeds maximum depth of ${MAX_TREE_DEPTH}.` };
    }
    if (!obj || typeof obj !== "object") {
      return { valid: false, error: "Each node must be an object." };
    }
    if (typeof obj?.id !== "string" || !obj.id.trim()) {
      return { valid: false, error: "Each node must have a non-empty string 'id'." };
    }
    if (typeof obj?.type !== "string" || !VALID_NODE_TYPES.includes(obj.type)) {
      return { valid: false, error: `Invalid node type '${obj?.type}'. Must be one of: ${VALID_NODE_TYPES.join(", ")}.` };
    }
    if (obj?.type !== "csv-table" && typeof obj?.tag !== "string") {
      return { valid: false, error: `Node '${obj.id}' is missing a 'tag' field.` };
    }
    if (obj?.styles && typeof obj.styles !== "object") {
      return { valid: false, error: `Node '${obj.id}' has invalid 'styles' (must be an object).` };
    }
    if (obj?.children) {
      if (!Array.isArray(obj.children)) {
        return { valid: false, error: `Node '${obj.id}' has invalid 'children' (must be an array).` };
      }
      for (const child of obj.children) {
        const childResult = validateNode(child, depth + 1);
        if (!childResult?.valid) {
          return childResult;
        }
      }
    }
    return { valid: true, error: "" };
  } catch (error) {
    logger.error("ImportModal", "Validation error", error);
    return { valid: false, error: "Validation failed unexpectedly." };
  }
}

/**
 * Modal for importing a component tree via JSON paste.
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Called to close the modal
 * @returns {React.ReactElement|null}
 */
function ImportModal({ isOpen, onClose }) {
  const { dispatch } = useEditor();
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  /**
   * Focuses the textarea when the modal opens.
   */
  useEffect(() => {
    try {
      if (isOpen && textareaRef?.current) {
        setTimeout(() => {
          textareaRef?.current?.focus?.();
        }, 50);
      }
    } catch (error) {
      logger.warn("ImportModal", "focus on open failed", error);
    }
  }, [isOpen]);

  /**
   * Resets state when modal opens/closes.
   */
  useEffect(() => {
    try {
      if (!isOpen) {
        setJsonText("");
        setError("");
      }
    } catch (error) {
      logger.warn("ImportModal", "reset state on close failed", error);
    }
  }, [isOpen]);

  /**
   * Handles textarea value changes.
   * @param {React.ChangeEvent<HTMLTextAreaElement>} event - The change event
   */
  const handleChange = useCallback((event) => {
    try {
      setJsonText(event?.target?.value ?? "");
      setError("");
    } catch (error) {
      logger.warn("ImportModal", "handleChange failed", error);
    }
  }, []);

  /**
   * Parses and loads the pasted component tree.
   */
  const handleLoad = useCallback(() => {
    try {
      const trimmed = jsonText?.trim();
      if (!trimmed) {
        setError("Paste a component tree JSON to load.");
        return;
      }

      if (new Blob([trimmed]).size > MAX_IMPORT_SIZE_BYTES) {
        setError(`Import payload too large. Maximum size is ${Math.round(MAX_IMPORT_SIZE_BYTES / 1024)}KB.`);
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(trimmed);
      } catch (parseError) {
        setError("Invalid JSON. Please check the format and try again.");
        return;
      }

      const validation = validateNode(parsed);
      if (!validation?.valid) {
        setError(validation?.error || "Invalid component tree.");
        return;
      }

      dispatch({ type: SET_COMPONENT_TREE, tree: parsed });
      onClose?.();
    } catch (error) {
      setError("Something went wrong. Please try again.");
    }
  }, [jsonText, dispatch, onClose]);

  /**
   * Handles keyboard events within the modal.
   * @param {KeyboardEvent} event - The keyboard event
   */
  const handleKeyDown = useCallback(
    (event) => {
      try {
        if (event?.key === "Escape") {
          event.stopPropagation();
          onClose?.();
          return;
        }

        if ((event?.metaKey || event?.ctrlKey) && event?.key === "Enter") {
          event.preventDefault();
          handleLoad();
          return;
        }
      } catch (error) {
        logger.warn("ImportModal", "handleKeyDown failed", error);
      }
    },
    [onClose, handleLoad]
  );

  /**
   * Handles clicks on the overlay to close the modal.
   * @param {MouseEvent} event - The click event
   */
  const handleOverlayClick = useCallback(
    (event) => {
      try {
        if (event?.target === event?.currentTarget) {
          onClose?.();
        }
      } catch (error) {
        logger.warn("ImportModal", "handleOverlayClick failed", error);
      }
    },
    [onClose]
  );

  try {
    if (!isOpen) return null;

    return (
      <div
        className="import-modal-overlay"
        onClick={handleOverlayClick}
        onKeyDown={handleKeyDown}
      >
        <div className="import-modal">
          <div className="import-modal__header">
            <span className="import-modal__title">Import Component</span>
            <button className="import-modal__close" onClick={onClose}>
              &times;
            </button>
          </div>
          <div className="import-modal__body">
            <p className="import-modal__description">
              Paste a component tree JSON to load it into the editor.
            </p>
            <textarea
              ref={textareaRef}
              className="import-modal__textarea"
              value={jsonText}
              onChange={handleChange}
              placeholder='{"id": "node-1", "type": "container", ...}'
              spellCheck={false}
            />
            {error && <p className="import-modal__error">{error}</p>}
          </div>
          <div className="import-modal__footer">
            <button
              className="import-modal__button import-modal__button--cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="import-modal__button import-modal__button--load"
              onClick={handleLoad}
              disabled={!jsonText?.trim()}
            >
              Load Component
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default ImportModal;
