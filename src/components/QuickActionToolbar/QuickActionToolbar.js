import React from "react";
import Icon from "../shared/Icon";
import { useEditor } from "../../context/EditorContext";
import { TOGGLE_PANELS, SET_TOOL_MODE } from "../../context/editorActions";
import logger from "../../utils/logger";
import "./QuickActionToolbar.css";

/**
 * Quick action toolbar fixed at bottom-left of the editor.
 * Contains: pointer (select), hand-stop (move), microphone (voice input), layout-sidebar (panels toggle), volume toggle.
 * @param {Object} props
 * @param {boolean} [props.soundEnabled] - Whether sound effects are enabled
 * @param {Function} [props.onToggleSound] - Callback to toggle sound effects
 * @returns {React.ReactElement|null}
 */
function QuickActionToolbar({ soundEnabled, onToggleSound }) {
  const { state, dispatch } = useEditor();

  /**
   * Handles pointer/select tool activation.
   * Dispatches SET_TOOL_MODE with mode "select".
   * @returns {void}
   */
  function handlePointerClick() {
    try {
      dispatch({ type: SET_TOOL_MODE, mode: "select" });
    } catch (error) {
      logger.warn("QuickActionToolbar", "handlePointerClick dispatch failed", error);
    }
  }

  /**
   * Handles sidebar panel visibility toggle.
   * Dispatches TOGGLE_PANELS action.
   * @returns {void}
   */
  function handleSidebarToggle() {
    try {
      dispatch({ type: TOGGLE_PANELS });
    } catch (error) {
      logger.warn("QuickActionToolbar", "handleSidebarToggle dispatch failed", error);
    }
  }

  /**
   * Handles sound toggle button click.
   * @returns {void}
   */
  function handleSoundToggle() {
    try {
      if (onToggleSound) {
        onToggleSound();
      }
    } catch (error) {
      logger.warn("QuickActionToolbar", "handleSoundToggle failed", error);
    }
  }

  try {
    return (
      <div className="quick-action-toolbar">
        <button
          className={`quick-action-toolbar__button ${
            state?.toolMode === "select" ? "quick-action-toolbar__button--active" : ""
          }`}
          onClick={handlePointerClick}
          title="Select"
        >
          <Icon name="pointer" size={24} />
        </button>
        <button
          className="quick-action-toolbar__button"
          title="Move"
        >
          <Icon name="hand-stop" size={24} />
        </button>
        <button
          className="quick-action-toolbar__button"
          title="Voice input"
        >
          <Icon name="microphone" size={24} />
        </button>
        <button
          className={`quick-action-toolbar__button ${
            state?.panelsVisible ? "quick-action-toolbar__button--active" : ""
          }`}
          onClick={handleSidebarToggle}
          title="Toggle panels"
        >
          <Icon name="layout-sidebar" size={24} />
        </button>
        <button
          className={`quick-action-toolbar__button ${
            soundEnabled ? "quick-action-toolbar__button--active" : ""
          }`}
          onClick={handleSoundToggle}
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          <Icon name={soundEnabled ? "volume" : "volume-off"} size={24} />
        </button>
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default QuickActionToolbar;
