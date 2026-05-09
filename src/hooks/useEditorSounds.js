import { useState, useCallback } from "react";
import { playSound, isSoundEnabled, setSoundEnabled } from "../utils/sounds";
import logger from "../utils/logger";

/**
 * Set of action types that should trigger sound effects.
 * Style/content actions are excluded — they fire too frequently.
 */
var SOUND_ACTIONS = {
  SELECT_NODE: true,
  DESELECT: true,
  DELETE_NODE: true,
  ADD_NODE: true,
  UNDO: true,
  REDO: true,
  TOGGLE_PANELS: true,
  TOGGLE_XRAY: true,
};

/**
 * Hook that provides sound effects for editor actions.
 * Returns an onAction callback for EditorProvider and toggle controls.
 * @returns {{ onAction: Function, soundEnabled: boolean, toggleSound: Function }}
 */
function useEditorSounds() {
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled);

  /**
   * Callback fired after every dispatch. Plays sound for mapped actions.
   * Passed as onAction prop to EditorProvider.
   * @param {Object} action - The dispatched editor action
   * @returns {void}
   */
  const onAction = useCallback(
    (action) => {
      try {
        if (action?.type && SOUND_ACTIONS[action.type]) {
          playSound(action.type);
        }
      } catch (error) {
        logger.warn("useEditorSounds", "onAction failed", error);
      }
    },
    []
  );

  /**
   * Toggles sound effects on/off and persists to localStorage.
   * @returns {void}
   */
  const toggleSound = useCallback(() => {
    try {
      const next = !soundEnabled;
      setSoundEnabledState(next);
      setSoundEnabled(next);
    } catch (error) {
      logger.warn("useEditorSounds", "toggleSound failed", error);
    }
  }, [soundEnabled]);

  return { onAction, soundEnabled, toggleSound };
}

export default useEditorSounds;
