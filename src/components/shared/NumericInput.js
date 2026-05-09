import React, { useCallback } from "react";
import logger from "../../utils/logger";

/**
 * Numeric input with arrow key stepping support
 * @param {Object} props
 * @param {number} props.value - Current value
 * @param {Function} props.onChange - Called with new numeric value
 * @param {number} [props.min=0] - Minimum value
 * @param {number} [props.max=1000] - Maximum value
 * @param {number} [props.step=1] - Step increment for arrow keys
 * @param {number} [props.shiftStep=10] - Step increment for shift+arrow
 * @param {string} [props.suffix] - Display suffix (e.g., "px")
 * @param {string} [props.className] - Optional CSS class
 * @returns {React.ReactElement}
 */
function NumericInput({
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 1,
  shiftStep = 10,
  suffix = "",
  className = "",
}) {
  /**
   * Handles keyboard events for arrow key stepping
   * @param {KeyboardEvent} event - The keyboard event
   */
  const handleKeyDown = useCallback(
    (event) => {
      try {
        const increment = event?.shiftKey ? shiftStep : step;

        if (event?.key === "ArrowUp") {
          event.preventDefault();
          const newValue = Math.min(max, (value || 0) + increment);
          onChange?.(newValue);
        } else if (event?.key === "ArrowDown") {
          event.preventDefault();
          const newValue = Math.max(min, (value || 0) - increment);
          onChange?.(newValue);
        }
      } catch (error) {
        logger.warn("NumericInput", "handleKeyDown failed", error);
      }
    },
    [value, onChange, min, max, step, shiftStep]
  );

  /**
   * Handles direct input changes
   * @param {Event} event - The input change event
   */
  const handleChange = useCallback(
    (event) => {
      try {
        const rawValue = event?.target?.value?.replace(suffix, "")?.trim();
        const numValue = parseFloat(rawValue);
        if (!isNaN(numValue)) {
          const clampedValue = Math.max(min, Math.min(max, numValue));
          onChange?.(clampedValue);
        }
      } catch (error) {
        logger.warn("NumericInput", "handleChange failed", error);
      }
    },
    [onChange, min, max, suffix]
  );

  try {
    return (
      <input
        type="text"
        className={`numeric-input ${className}`}
        value={`${value ?? 0}${suffix}`}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={(event) => event?.stopPropagation?.()}
      />
    );
  } catch (error) {
    return null;
  }
}

export default NumericInput;
