import React from "react";

/**
 * Shared error fallback component for consistent error display.
 * Used by error boundaries and catch blocks across the application.
 * @param {Object} props
 * @param {string} [props.message="Something went wrong"] - The error message to display
 * @param {Function} [props.onRetry] - Optional retry callback
 * @returns {React.ReactElement}
 */
function ErrorFallback({ message = "Something went wrong", onRetry }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "24px",
        color: "var(--editor-text-muted, #6c7086)",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "14px",
        textAlign: "center",
        gap: "12px",
      }}
    >
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          style={{
            padding: "6px 16px",
            border: "1px solid var(--editor-border, #3b3b5c)",
            borderRadius: "6px",
            background: "var(--editor-surface, #282840)",
            color: "var(--editor-text, #cdd6f4)",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorFallback;
