import React, { useCallback, useRef, useEffect } from "react";
import CsvTable from "../CsvTable/CsvTable";
import { sanitizeHtml } from "../../utils/sanitizer";
import logger from "../../utils/logger";

/**
 * Recursively renders a single node from the component tree.
 * Selected text nodes become contentEditable for inline editing.
 * @param {Object} props
 * @param {Object} props.node - The component tree node to render
 * @param {string|null} [props.selectedNodeId] - Currently selected node ID
 * @param {Function} [props.onContentChange] - Called with (nodeId, content) on text edit
 * @param {number} [props.depth=0] - Nesting depth for x-ray mode Z-offset
 * @param {boolean} [props.xrayMode=false] - Whether x-ray mode is active
 * @param {number} [props.xrayZStep=0] - Pixels per depth level for Z-offset
 * @returns {React.ReactElement|null}
 */
function CanvasRenderer({ node, selectedNodeId, onContentChange, depth = 0, xrayMode = false, xrayZStep = 0 }) {
  const editRef = useRef(null);
  const isSelected = node?.id === selectedNodeId;

  /**
   * Syncs the DOM textContent back to state on blur.
   */
  const handleBlur = useCallback(() => {
    try {
      if (editRef?.current && onContentChange && node?.id) {
        const newContent = editRef.current.innerText || "";
        onContentChange(node.id, newContent);
      }
    } catch (error) {
      logger.warn("CanvasRenderer", "syncing content on blur", error);
    }
  }, [node?.id, onContentChange]);

  /**
   * Prevents canvas deselect when clicking into the editable area.
   * @param {MouseEvent} event - The click event
   */
  const handleClick = useCallback((event) => {
    try {
      event?.stopPropagation?.();
    } catch (error) {
      logger.warn("CanvasRenderer", "stopping click propagation on editable node", error);
    }
  }, []);

  /**
   * When a text node becomes selected, keep DOM content in sync
   * with the source data (avoids stale text after undo/redo).
   */
  useEffect(() => {
    try {
      if (isSelected && editRef?.current && node?.type === "text") {
        const domText = editRef.current.innerText || "";
        const sourceText = node?.content || "";
        if (domText !== sourceText) {
          editRef.current.innerText = sourceText;
        }
      }
    } catch (error) {
      logger.warn("CanvasRenderer", "syncing DOM text content with source node", error);
    }
  }, [isSelected, node?.content, node?.type]);

  try {
    if (!node) {
      return null;
    }

    const Tag = node?.tag || "div";
    var xrayTransform = xrayMode && depth > 0 ? "translateZ(" + Math.round(depth * xrayZStep) + "px)" : undefined;

    // CSV table nodes
    if (node?.type === "csv-table") {
      return <CsvTable node={node} />;
    }

    // Raw HTML nodes (SVGs, style tags, etc.)
    if (node?.type === "html") {
      return (
        <div
          data-node-id={node?.id}
          data-node-type={node?.type}
          className={node?.className || undefined}
          style={{ ...(node?.styles || {}), pointerEvents: "auto", transform: xrayTransform }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(node?.rawHtml) }}
        />
      );
    }

    if (node?.type === "text") {
      const isEditable = isSelected;

      return (
        <Tag
          ref={isEditable ? editRef : undefined}
          data-node-id={node?.id}
          data-node-type={node?.type}
          className={node?.className || undefined}
          style={{
            ...(node?.styles || {}),
            cursor: isEditable ? "text" : undefined,
            outline: "none",
            transform: xrayTransform,
          }}
          contentEditable={isEditable || undefined}
          suppressContentEditableWarning={isEditable || undefined}
          onBlur={isEditable ? handleBlur : undefined}
          onClick={isEditable ? handleClick : undefined}
        >
          {node?.content || ""}
        </Tag>
      );
    }

    const isCanvasRoot = node?.id === "canvas-root";

    return (
      <Tag
        data-node-id={isCanvasRoot ? undefined : node?.id}
        data-node-type={isCanvasRoot ? undefined : node?.type}
        className={node?.className || undefined}
        style={{ ...(node?.styles || {}), pointerEvents: "auto", transform: isCanvasRoot ? undefined : xrayTransform }}
      >
        {node?.children?.map((child) => (
          <CanvasRenderer
            key={child?.id}
            node={child}
            selectedNodeId={selectedNodeId}
            onContentChange={onContentChange}
            depth={depth + 1}
            xrayMode={xrayMode}
            xrayZStep={xrayZStep}
          />
        ))}
      </Tag>
    );
  } catch (error) {
    return null;
  }
}

export default CanvasRenderer;
