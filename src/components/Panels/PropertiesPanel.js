import React, { useCallback, useMemo } from "react";
import NumericInput from "../shared/NumericInput";
import Dropdown from "../shared/Dropdown";
import { useEditor } from "../../context/EditorContext";
import { findNodeById } from "../../context/editorReducer";
import { UPDATE_NODE_STYLE, UPDATE_NODE_CONTENT, SET_CANVAS_BG } from "../../context/editorActions";
import FONT_OPTIONS from "../../data/fontOptions";
import { DEFAULT_CANVAS_BACKGROUND, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, FONT_SIZE_MIN, FONT_SIZE_MAX, OPACITY_MIN, OPACITY_MAX } from "../../constants/editor";
import logger from "../../utils/logger";
import "./PropertiesPanel.css";

const FONT_WEIGHT_OPTIONS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
const TEXT_ALIGN_OPTIONS = ["left", "center", "right"];

/**
 * Properties panel for editing selected node properties
 * @returns {React.ReactElement|null}
 */
function PropertiesPanel() {
  const { state, dispatch } = useEditor();

  /**
   * Memoized lookup of the currently selected node.
   * Avoids repeated tree traversals on each render.
   * @type {Object|null}
   */
  const selectedNode = useMemo(() => {
    try {
      if (!state?.selectedNodeId) return null;
      return findNodeById(state?.componentTree, state?.selectedNodeId);
    } catch (error) {
      logger.warn("PropertiesPanel", "getSelectedNode failed", error);
      return null;
    }
  }, [state?.selectedNodeId, state?.componentTree]);

  /**
   * Dispatches a style update for the selected node
   * @param {string} property - The CSS property name
   * @param {*} value - The new value
   */
  const updateStyle = useCallback(
    (property, value) => {
      try {
        dispatch({
          type: UPDATE_NODE_STYLE,
          nodeId: state?.selectedNodeId,
          property,
          value,
        });
      } catch (error) {
        logger.warn("PropertiesPanel", "Operation failed", error);
      }
    },
    [state?.selectedNodeId, dispatch]
  );

  /**
   * Dispatches a content update for the selected node
   * @param {string} content - The new content
   */
  const updateContent = useCallback(
    (content) => {
      try {
        dispatch({
          type: UPDATE_NODE_CONTENT,
          nodeId: state?.selectedNodeId,
          content,
        });
      } catch (error) {
        logger.warn("PropertiesPanel", "Operation failed", error);
      }
    },
    [state?.selectedNodeId, dispatch]
  );

  /**
   * Handles textarea content change
   * @param {Event} event - The change event
   */
  function handleContentChange(event) {
    try {
      updateContent(event?.target?.value ?? "");
    } catch (error) {
      logger.warn("PropertiesPanel", "handleContentChange failed", error);
    }
  }

  /**
   * Handles color input change
   * @param {Event} event - The change event
   */
  function handleColorChange(event) {
    try {
      updateStyle("color", event?.target?.value);
    } catch (error) {
      logger.warn("PropertiesPanel", "handleColorChange failed", error);
    }
  }

  /**
   * Gets a clean font name from the fontFamily style value
   * @param {string} fontFamily - The raw fontFamily value
   * @returns {string}
   */
  function getCleanFontName(fontFamily) {
    try {
      return (fontFamily || DEFAULT_FONT_FAMILY).replace(/['"]/g, "").split(",")[0].trim();
    } catch (error) {
      return DEFAULT_FONT_FAMILY;
    }
  }

  /**
   * Gets font size as a number from the style value
   * @param {string} fontSize - The raw fontSize value
   * @returns {number}
   */
  function getFontSizeNumber(fontSize) {
    try {
      return parseInt(fontSize, 10) || DEFAULT_FONT_SIZE;
    } catch (error) {
      return DEFAULT_FONT_SIZE;
    }
  }

  /**
   * Renders a font option in its own font
   * @param {string} fontName - The font name
   * @returns {React.ReactElement}
   */
  function renderFontOption(fontName) {
    try {
      return <span style={{ fontFamily: `'${fontName}', sans-serif` }}>{fontName}</span>;
    } catch (error) {
      return <span>{fontName}</span>;
    }
  }

  try {
    if (!selectedNode) {
      return (
        <div className="properties-panel">
          <div className="properties-panel__header">Properties</div>
          <div className="properties-panel__content">
            <div className="properties-panel__section">
              <div className="properties-panel__section-title">Canvas</div>
              <div className="properties-panel__field">
                <label className="properties-panel__label">Background</label>
                <div className="properties-panel__color-field">
                  <input
                    type="color"
                    className="properties-panel__color-input"
                    value={state?.canvasBackground || DEFAULT_CANVAS_BACKGROUND}
                    onChange={(event) => {
                      try {
                        dispatch({ type: SET_CANVAS_BG, color: event?.target?.value });
                      } catch (error) {
                        logger.warn("PropertiesPanel", "Operation failed", error);
                      }
                    }}
                    onClick={(event) => event?.stopPropagation?.()}
                  />
                  <span className="properties-panel__color-value">
                    {state?.canvasBackground || DEFAULT_CANVAS_BACKGROUND}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const nodeStyles = selectedNode?.styles || {};
    const opacityPercent = Math.round((nodeStyles?.opacity ?? 1) * 100);
    const isCsvTable = selectedNode?.type === "csv-table";

    return (
      <div className="properties-panel">
        <div className="properties-panel__header">Properties</div>
        <div className="properties-panel__content">
          {/* Content Section */}
          {selectedNode?.type === "text" && (
            <div className="properties-panel__section">
              <div className="properties-panel__section-title">Content</div>
              <textarea
                className="properties-panel__textarea"
                value={selectedNode?.content || ""}
                onChange={handleContentChange}
                onClick={(event) => event?.stopPropagation?.()}
                rows={3}
              />
            </div>
          )}

          {/* Typography Section */}
          {!isCsvTable && (
            <div className="properties-panel__section">
              <div className="properties-panel__section-title">Typography</div>

              <div className="properties-panel__field">
                <label className="properties-panel__label">Font Family</label>
                <Dropdown
                  value={getCleanFontName(nodeStyles?.fontFamily)}
                  options={FONT_OPTIONS}
                  onChange={(fontName) => updateStyle("fontFamily", `'${fontName}', sans-serif`)}
                  className="properties-panel__dropdown"
                  renderOption={renderFontOption}
                />
              </div>

              <div className="properties-panel__field">
                <label className="properties-panel__label">Font Size</label>
                <NumericInput
                  value={getFontSizeNumber(nodeStyles?.fontSize)}
                  onChange={(size) => updateStyle("fontSize", `${size}px`)}
                  min={FONT_SIZE_MIN}
                  max={FONT_SIZE_MAX}
                  step={1}
                  shiftStep={10}
                  className="properties-panel__numeric-input"
                />
              </div>

              <div className="properties-panel__field">
                <label className="properties-panel__label">Font Weight</label>
                <Dropdown
                  value={nodeStyles?.fontWeight || "400"}
                  options={FONT_WEIGHT_OPTIONS}
                  onChange={(weight) => updateStyle("fontWeight", weight)}
                  className="properties-panel__dropdown"
                />
              </div>

              <div className="properties-panel__field">
                <label className="properties-panel__label">Text Align</label>
                <div className="properties-panel__toggle-group">
                  {TEXT_ALIGN_OPTIONS.map((align) => (
                    <button
                      key={align}
                      className={`properties-panel__toggle-button ${
                        nodeStyles?.textAlign === align
                          ? "properties-panel__toggle-button--active"
                          : ""
                      }`}
                      onClick={(event) => {
                        try {
                          event?.stopPropagation?.();
                          updateStyle("textAlign", align);
                        } catch (error) {
                          logger.warn("PropertiesPanel", "Operation failed", error);
                        }
                      }}
                      type="button"
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {!isCsvTable && (
            <div className="properties-panel__section">
              <div className="properties-panel__section-title">Appearance</div>

              <div className="properties-panel__field">
                <label className="properties-panel__label">Color</label>
                <div className="properties-panel__color-field">
                  <input
                    type="color"
                    className="properties-panel__color-input"
                    value={nodeStyles?.color || "#ffffff"}
                    onChange={handleColorChange}
                    onClick={(event) => event?.stopPropagation?.()}
                  />
                  <span className="properties-panel__color-value">
                    {nodeStyles?.color || "#ffffff"}
                  </span>
                </div>
              </div>

              <div className="properties-panel__field">
                <label className="properties-panel__label">Opacity</label>
                <NumericInput
                  value={opacityPercent}
                  onChange={(percentage) => updateStyle("opacity", percentage / 100)}
                  min={OPACITY_MIN}
                  max={OPACITY_MAX}
                  step={1}
                  shiftStep={10}
                  className="properties-panel__numeric-input"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default PropertiesPanel;
