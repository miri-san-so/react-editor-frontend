import React, { useState, useRef, useEffect, useCallback } from "react";
import logger from "../../utils/logger";
import "./Dropdown.css";

/**
 * Reusable dropdown component with outside-click-to-close.
 *
 * @param {Object}   props
 * @param {string}   props.value           - Currently selected value
 * @param {string[]} props.options          - Array of option strings
 * @param {Function} props.onChange         - Called with the selected option string
 * @param {string}   [props.className]      - Optional extra CSS class on the root element
 * @param {Function} [props.renderOption]   - Optional custom renderer for each option
 * @param {Function} [props.renderTrigger]  - Optional custom trigger renderer
 * @param {"default"|"toolbar"} [props.variant="default"] - Visual variant.
 *   "toolbar" applies the blue Figma-spec styling with a custom scrollbar.
 * @returns {React.ReactElement|null}
 */
function Dropdown({
  value,
  options,
  onChange,
  className = "",
  renderOption,
  renderTrigger,
  variant = "default",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const innerRef = useRef(null);
  const scrollbarRef = useRef(null);

  /**
   * Closes the dropdown when a click occurs outside the component.
   * @param {MouseEvent} event - The native mouse event
   */
  const handleOutsideClick = useCallback((event) => {
    try {
      if (dropdownRef?.current && !dropdownRef.current.contains(event?.target)) {
        setIsOpen(false);
      }
    } catch (error) {
      logger.warn("Dropdown", "handleOutsideClick failed", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, handleOutsideClick]);

  /**
   * Synchronises the custom scrollbar thumb size and position with the
   * inner scroll container. Only runs in toolbar variant.
   */
  const syncScrollbar = useCallback(() => {
    try {
      const inner = innerRef?.current;
      const thumb = scrollbarRef?.current;
      if (!inner || !thumb) return;

      const { scrollTop, scrollHeight, clientHeight } = inner;
      const trackHeight = clientHeight;
      const thumbHeight = Math.max(20, (clientHeight / scrollHeight) * trackHeight);
      const thumbTop = (scrollTop / scrollHeight) * trackHeight;

      thumb.style.height = `${thumbHeight}px`;
      thumb.style.top = `${4 + thumbTop}px`;
      // Hide the thumb when the content fully fits
      thumb.style.display = scrollHeight <= clientHeight ? "none" : "block";
    } catch (error) {
      logger.warn("Dropdown", "syncScrollbar failed", error);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || variant !== "toolbar") return;

    // Give the DOM a tick to render before measuring
    const innerElement = innerRef?.current;

    const timer = setTimeout(() => {
      try {
        syncScrollbar();
        innerElement?.addEventListener("scroll", syncScrollbar);
      } catch (error) {
        logger.warn("Dropdown", "scrollbar setup failed", error);
      }
    }, 0);

    return () => {
      try {
        clearTimeout(timer);
        innerElement?.removeEventListener("scroll", syncScrollbar);
      } catch (error) {
        logger.warn("Dropdown", "scrollbar cleanup failed", error);
      }
    };
  }, [isOpen, variant, syncScrollbar]);

  /**
   * Handles keyboard navigation within the dropdown.
   * ArrowDown/ArrowUp to navigate, Enter to select, Escape to close.
   * @param {KeyboardEvent} event - The keyboard event
   */
  const handleKeyDown = useCallback((event) => {
    try {
      if (!isOpen) {
        if (event?.key === "ArrowDown" || event?.key === "Enter" || event?.key === " ") {
          event?.preventDefault?.();
          setIsOpen(true);
          setHighlightedIndex(0);
        }
        return;
      }

      switch (event?.key) {
        case "ArrowDown": {
          event?.preventDefault?.();
          setHighlightedIndex((prev) =>
            prev < (options?.length || 0) - 1 ? prev + 1 : 0
          );
          break;
        }
        case "ArrowUp": {
          event?.preventDefault?.();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : (options?.length || 1) - 1
          );
          break;
        }
        case "Enter":
        case " ": {
          event?.preventDefault?.();
          if (highlightedIndex >= 0 && highlightedIndex < (options?.length || 0)) {
            onChange?.(options[highlightedIndex]);
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
          break;
        }
        case "Escape": {
          event?.preventDefault?.();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        }
        default:
          break;
      }
    } catch (error) {
      logger.warn("Dropdown", "handleKeyDown failed", error);
    }
  }, [isOpen, highlightedIndex, options, onChange]);

  /**
   * Toggles the dropdown open/closed.
   * @param {MouseEvent} event - The click event
   */
  function handleToggle(event) {
    try {
      event?.stopPropagation?.();
      setIsOpen((prev) => {
        const next = !prev;
        if (next) {
          const currentIndex = options?.indexOf(value) ?? -1;
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        } else {
          setHighlightedIndex(-1);
        }
        return next;
      });
    } catch (error) {
      logger.warn("Dropdown", "handleToggle failed", error);
    }
  }

  /**
   * Handles option selection and closes the dropdown.
   * @param {string} option   - The option that was selected
   * @param {MouseEvent} event - The click event
   */
  function handleSelect(option, event) {
    try {
      event?.stopPropagation?.();
      onChange?.(option);
      setIsOpen(false);
    } catch (error) {
      logger.warn("Dropdown", "handleSelect failed", error);
    }
  }

  try {
    const isToolbar = variant === "toolbar";
    const variantClass = isToolbar ? "dropdown--toolbar" : "";

    return (
      <div className={`dropdown ${variantClass} ${className}`} ref={dropdownRef} onKeyDown={handleKeyDown}>
        <button
          className="dropdown__trigger"
          onClick={handleToggle}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {renderTrigger ? renderTrigger(value) : (value || "Select")}
          <span className={`dropdown__arrow ${isOpen ? "dropdown__arrow--open" : ""}`}>
            &#9662;
          </span>
        </button>

        {isOpen && (
          <div className="dropdown__menu" role="listbox">
            {isToolbar ? (
              <>
                <div className="dropdown__menu-inner" ref={innerRef}>
                  {options?.map((option, index) => (
                    <button
                      key={option}
                      className={`dropdown__option ${
                        option === value ? "dropdown__option--selected" : ""
                      }${index === highlightedIndex ? " dropdown__option--highlighted" : ""}`}
                      onClick={(event) => handleSelect(option, event)}
                      type="button"
                      role="option"
                      aria-selected={option === value}
                    >
                      {renderOption ? renderOption(option) : option}
                    </button>
                  ))}
                </div>
                <div className="dropdown__scrollbar" ref={scrollbarRef} />
              </>
            ) : (
              options?.map((option, index) => (
                <button
                  key={option}
                  className={`dropdown__option ${
                    option === value ? "dropdown__option--selected" : ""
                  }${index === highlightedIndex ? " dropdown__option--highlighted" : ""}`}
                  onClick={(event) => handleSelect(option, event)}
                  type="button"
                  role="option"
                  aria-selected={option === value}
                >
                  {renderOption ? renderOption(option) : option}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default Dropdown;
