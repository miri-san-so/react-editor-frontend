import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import Icon from "../shared/Icon";
import { useEditor } from "../../context/EditorContext";
import { findNodeById } from "../../context/editorReducer";
import { UPDATE_NODE_STYLE } from "../../context/editorActions";
import FONT_OPTIONS from "../../data/fontOptions";
import logger from "../../utils/logger";

/**
 * Font-family control rendered as a blue pill with a dropdown menu.
 * Layout: letter-case icon → font name text → selector arrows.
 * Design spec: bg #0062d9 (idle), #0043ab + focus ring (open),
 * padding 8px, border-radius 32px, drop-shadow.
 * @returns {React.ReactElement|null}
 */
function FontFamilyDropdown() {
  const { state, dispatch } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const pillRef = useRef(null);
  const scrollInnerRef = useRef(null);
  const scrollThumbRef = useRef(null);

  /**
   * Returns the current font family name, stripped of quotes and fallbacks.
   * @returns {string}
   */
  function getCurrentFont() {
    try {
      const node = findNodeById(state?.componentTree, state?.selectedNodeId);
      const fontFamily = node?.styles?.fontFamily || "Prata";
      return fontFamily.replace(/['"]/g, "").split(",")[0].trim();
    } catch (error) {
      return "Prata";
    }
  }

  /**
   * Closes the dropdown when clicking outside the pill.
   * @param {MouseEvent} event - The mouse event
   */
  const handleOutsideClick = useCallback((event) => {
    try {
      if (pillRef?.current && !pillRef.current.contains(event?.target)) {
        setIsOpen(false);
      }
    } catch (error) {
      logger.warn("FontFamilyDropdown", "failed to handle outside click to close dropdown", error);
    }
  }, []);

  useEffect(() => {
    try {
      if (isOpen) {
        document.addEventListener("mousedown", handleOutsideClick);
      }
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    } catch (error) {
      logger.warn("FontFamilyDropdown", "failed to register outside click listener", error);
    }
  }, [isOpen, handleOutsideClick]);

  /**
   * Synchronises the custom scrollbar thumb with the inner scroll container.
   */
  const syncScrollbar = useCallback(() => {
    try {
      const inner = scrollInnerRef?.current;
      const thumb = scrollThumbRef?.current;
      if (!inner || !thumb) return;

      const { scrollTop, scrollHeight, clientHeight } = inner;
      if (scrollHeight <= clientHeight) {
        thumb.style.display = "none";
        return;
      }
      thumb.style.display = "block";
      const trackHeight = clientHeight - 20;
      const thumbHeight = Math.max(20, (clientHeight / scrollHeight) * trackHeight);
      const thumbTop = (scrollTop / scrollHeight) * trackHeight;
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.top = `${10 + thumbTop}px`;
    } catch (error) {
      logger.warn("FontFamilyDropdown", "failed to sync custom scrollbar position", error);
    }
  }, []);

  useLayoutEffect(() => {
    try {
      if (!isOpen) return;
      const inner = scrollInnerRef?.current;
      if (!inner) return;

      const timer = setTimeout(() => {
        try {
          syncScrollbar();
          inner.addEventListener("scroll", syncScrollbar);
        } catch (error) {
          logger.warn("FontFamilyDropdown", "failed to initialise scrollbar sync on open", error);
        }
      }, 0);

      return () => {
        try {
          clearTimeout(timer);
          inner?.removeEventListener("scroll", syncScrollbar);
        } catch (error) {
          logger.warn("FontFamilyDropdown", "failed to clean up scrollbar sync listeners", error);
        }
      };
    } catch (error) {
      logger.warn("FontFamilyDropdown", "failed to set up scrollbar sync effect on open", error);
    }
  }, [isOpen, syncScrollbar]);

  /**
   * Toggles the dropdown open/closed.
   * @param {MouseEvent} event - The click event
   */
  function handleToggle(event) {
    try {
      event?.stopPropagation?.();
      setIsOpen((prev) => !prev);
    } catch (error) {
      logger.warn("FontFamilyDropdown", "failed to toggle dropdown open state", error);
    }
  }

  /**
   * Selects a font and closes the dropdown.
   * @param {string} fontName - The chosen font family name
   * @param {MouseEvent} event - The click event
   */
  function handleSelect(fontName, event) {
    try {
      event?.stopPropagation?.();
      dispatch({
        type: UPDATE_NODE_STYLE,
        nodeId: state?.selectedNodeId,
        property: "fontFamily",
        value: `'${fontName}', sans-serif`,
      });
      setIsOpen(false);
    } catch (error) {
      logger.warn("FontFamilyDropdown", "failed to select font family", error);
    }
  }

  try {
    const currentFont = getCurrentFont();
    const pillActiveClass = isOpen ? " toolbar-pill--value--active" : "";

    return (
      <div className="font-family-pill" ref={pillRef}>
        <button
          className={`toolbar-pill toolbar-pill--value${pillActiveClass}`}
          onClick={handleToggle}
          type="button"
          title="Font family"
        >
          <Icon name="letter-case" size={16} />
          <span className="toolbar-pill__label">{currentFont}</span>
          <div className="toolbar-pill__selector">
            <span style={{ cursor: "pointer" }}>▴</span>
            <span style={{ cursor: "pointer" }}>▾</span>
          </div>
        </button>

        {isOpen && (
          <div className="font-family-pill__menu">
            <div className="font-family-pill__menu-inner" ref={scrollInnerRef}>
              {FONT_OPTIONS?.map((fontName) => (
                <button
                  key={fontName}
                  className={`font-family-pill__option${
                    fontName === currentFont
                      ? " font-family-pill__option--selected"
                      : ""
                  }`}
                  onClick={(event) => handleSelect(fontName, event)}
                  type="button"
                  style={{ fontFamily: `'${fontName}', sans-serif` }}
                >
                  {fontName}
                </button>
              ))}
            </div>
            <div className="font-family-pill__scrollbar" ref={scrollThumbRef} />
          </div>
        )}
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default FontFamilyDropdown;
