import { useEffect, useRef } from "react";
import { SELECT_NODE, DESELECT } from "../context/editorActions";
import { findNodeById } from "../context/editorReducer";
import logger from "../utils/logger";

const URL_PARAM_KEY = "nodeId";

/**
 * Reads the nodeId query parameter from the current URL.
 * @returns {string|null} The node ID from the URL, or null if not present
 */
function getNodeIdFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(URL_PARAM_KEY) || null;
  } catch (error) {
    logger.warn("useUrlSelection", "failed to read URL param", error);
    return null;
  }
}

/**
 * Updates the URL query parameter without triggering a page reload.
 * Uses replaceState to avoid polluting browser history on every click.
 * @param {string|null} nodeId - The node ID to set, or null to remove the param
 */
function updateUrlParam(nodeId) {
  try {
    const url = new URL(window.location.href);
    if (nodeId) {
      url.searchParams.set(URL_PARAM_KEY, nodeId);
    } else {
      url.searchParams.delete(URL_PARAM_KEY);
    }
    window.history.replaceState({}, "", url.toString());
  } catch (error) {
    logger.warn("useUrlSelection", "failed to update URL param", error);
  }
}

/**
 * Bidirectional sync between the editor's selectedNodeId and the URL query param.
 *
 * - On mount: reads `?nodeId=<id>` and stores it as pending if the tree isn't loaded yet.
 * - On tree change: if a pending nodeId exists in the newly loaded tree, selects it.
 * - On selection change: updates the URL to reflect the current selection.
 * - On browser popstate: reads the URL and syncs selection accordingly.
 *
 * @param {Object} params
 * @param {Object} params.state - The editor state containing selectedNodeId and componentTree
 * @param {Function} params.dispatch - The editor dispatch function
 */
function useUrlSelection({ state, dispatch }) {
  const isInitialMount = useRef(true);
  const suppressUrlUpdate = useRef(false);
  const pendingNodeId = useRef(null);

  /**
   * On mount: read nodeId from URL. If the node exists, select it immediately.
   * If not (tree may not be loaded yet), store it as pending for later.
   */
  useEffect(() => {
    try {
      const urlNodeId = getNodeIdFromUrl();
      if (!urlNodeId) return;

      const nodeExists = findNodeById(state?.componentTree, urlNodeId);
      if (nodeExists) {
        suppressUrlUpdate.current = true;
        dispatch({ type: SELECT_NODE, id: urlNodeId });
      } else {
        pendingNodeId.current = urlNodeId;
      }
    } catch (error) {
      logger.warn("useUrlSelection", "failed to restore selection from URL", error);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Watches for component tree changes. When the tree updates (e.g. after
   * backend load), checks if a pending nodeId from the URL now exists
   * in the tree and selects it.
   */
  useEffect(() => {
    try {
      if (!pendingNodeId.current) return;

      const nodeExists = findNodeById(state?.componentTree, pendingNodeId.current);
      if (nodeExists) {
        suppressUrlUpdate.current = true;
        dispatch({ type: SELECT_NODE, id: pendingNodeId.current });
        pendingNodeId.current = null;
      }
    } catch (error) {
      logger.warn("useUrlSelection", "failed to apply pending URL selection", error);
    }
  }, [state?.componentTree, dispatch]);

  /**
   * On selectedNodeId change: update URL to match selection state.
   * Skips the initial mount to avoid overwriting the URL on first render,
   * and skips when the change was triggered by URL read (suppressUrlUpdate).
   */
  useEffect(() => {
    try {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      if (suppressUrlUpdate.current) {
        suppressUrlUpdate.current = false;
        return;
      }

      if (pendingNodeId.current) return;

      updateUrlParam(state?.selectedNodeId || null);
    } catch (error) {
      logger.warn("useUrlSelection", "failed to sync URL on selection change", error);
    }
  }, [state?.selectedNodeId]);

  /**
   * Listen for browser back/forward navigation (popstate).
   * Reads the nodeId from the updated URL and syncs selection.
   */
  useEffect(() => {
    /**
     * @param {PopStateEvent} _event - The popstate event
     */
    const handlePopState = (_event) => {
      try {
        const urlNodeId = getNodeIdFromUrl();
        const currentNodeId = state?.selectedNodeId || null;

        if (urlNodeId === currentNodeId) return;

        suppressUrlUpdate.current = true;

        if (urlNodeId) {
          const nodeExists = findNodeById(state?.componentTree, urlNodeId);
          if (nodeExists) {
            dispatch({ type: SELECT_NODE, id: urlNodeId });
          }
        } else {
          dispatch({ type: DESELECT });
        }
      } catch (error) {
        logger.warn("useUrlSelection", "popstate handler failed", error);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [state?.selectedNodeId, state?.componentTree, dispatch]);
}

export default useUrlSelection;
