/**
 * Editor sound effects using @web-kits/audio.
 * All sound definitions and playback logic lives here.
 * Only file that imports the audio library.
 */

import { defineSound, ensureReady, setMasterVolume } from "@web-kits/audio";
import { SOUND_STORAGE_KEY } from "../constants/editor";
import logger from "./logger";

/** @constant {number} Master volume level (0-1) — kept subtle */
const MASTER_VOLUME = 0.15;

/** @constant {number} Debounce interval in ms to prevent sound stacking */
const DEBOUNCE_MS = 50;

/** Tracks last play time per sound name for debouncing */
var lastPlayTimes = {};

/** Whether the audio context has been initialized */
var audioInitialized = false;

/* ───────────── Sound Definitions ───────────── */

/**
 * SELECT_NODE — Subtle tap: short sine blip
 */
var selectSound = defineSound({
  source: { type: "sine", frequency: 1200 },
  envelope: { decay: 0.06 },
  gain: 0.3,
});

/**
 * DESELECT — Soft release: quiet descending tone
 */
var deselectSound = defineSound({
  source: { type: "sine", frequency: { start: 800, end: 500 } },
  envelope: { decay: 0.08 },
  gain: 0.15,
});

/**
 * DELETE_NODE — Low swoosh: noise burst + descending tone
 */
var deleteSound = defineSound({
  layers: [
    {
      source: { type: "noise", color: "brown" },
      envelope: { decay: 0.12 },
      gain: 0.2,
    },
    {
      source: { type: "sine", frequency: { start: 500, end: 200 } },
      envelope: { decay: 0.15 },
      gain: 0.15,
    },
  ],
});

/**
 * ADD_NODE — Success pop: ascending two-tone
 */
var addSound = defineSound({
  layers: [
    {
      source: { type: "sine", frequency: 880 },
      envelope: { decay: 0.06 },
      gain: 0.25,
    },
    {
      source: { type: "sine", frequency: 1320 },
      envelope: { decay: 0.08 },
      gain: 0.2,
      delay: 0.04,
    },
  ],
});

/**
 * UNDO — Backward swoosh: descending sweep
 */
var undoSound = defineSound({
  source: { type: "triangle", frequency: { start: 600, end: 300 } },
  envelope: { decay: 0.1 },
  gain: 0.2,
});

/**
 * REDO — Forward swoosh: ascending sweep
 */
var redoSound = defineSound({
  source: { type: "triangle", frequency: { start: 300, end: 600 } },
  envelope: { decay: 0.1 },
  gain: 0.2,
});

/**
 * TOGGLE_PANELS — Toggle click: short square blip
 */
var toggleSound = defineSound({
  source: { type: "square", frequency: 800 },
  envelope: { decay: 0.04 },
  gain: 0.12,
  filter: { type: "lowpass", frequency: 2000 },
});

/**
 * COPY — Confirmation: quick high blip
 */
var copySound = defineSound({
  source: { type: "sine", frequency: { start: 1400, end: 1800 } },
  envelope: { decay: 0.06 },
  gain: 0.2,
});

/** Maps action/sound names to their play functions */
var SOUND_MAP = {
  SELECT_NODE: selectSound,
  DESELECT: deselectSound,
  DELETE_NODE: deleteSound,
  ADD_NODE: addSound,
  UNDO: undoSound,
  REDO: redoSound,
  TOGGLE_PANELS: toggleSound,
  COPY: copySound,
};

/* ───────────── Public API ───────────── */

/**
 * Checks if sound effects are enabled via localStorage.
 * Defaults to true if no preference is stored.
 * @returns {boolean}
 */
function isSoundEnabled() {
  try {
    var stored = localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored === null) return true;
    return stored === "true";
  } catch (error) {
    return true;
  }
}

/**
 * Persists the sound enabled/disabled preference to localStorage.
 * @param {boolean} enabled - Whether sounds should be enabled
 * @returns {void}
 */
function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(!!enabled));
  } catch (error) {
    logger.warn("sounds", "failed to persist sound preference", error);
  }
}

/**
 * Plays a named sound effect if enabled and not debounced.
 * Initializes the audio context on first call (requires user gesture).
 * @param {string} soundName - Key from SOUND_MAP (e.g. "SELECT_NODE", "COPY")
 * @returns {void}
 */
function playSound(soundName) {
  try {
    if (!isSoundEnabled()) return;

    var playFn = SOUND_MAP[soundName];
    if (!playFn) return;

    /* Debounce: skip if same sound played within DEBOUNCE_MS */
    var now = Date.now();
    if (lastPlayTimes[soundName] && now - lastPlayTimes[soundName] < DEBOUNCE_MS) {
      return;
    }
    lastPlayTimes[soundName] = now;

    /* Initialize audio context on first play (needs user gesture) */
    if (!audioInitialized) {
      audioInitialized = true;
      ensureReady().then(function () {
        try {
          setMasterVolume(MASTER_VOLUME);
          playFn();
        } catch (innerError) {
          logger.warn("sounds", "failed to play after init", innerError);
        }
      }).catch(function (initError) {
        audioInitialized = false;
        logger.warn("sounds", "audio context init failed", initError);
      });
      return;
    }

    playFn();
  } catch (error) {
    logger.warn("sounds", "playSound failed for " + soundName, error);
  }
}

export { playSound, isSoundEnabled, setSoundEnabled };
