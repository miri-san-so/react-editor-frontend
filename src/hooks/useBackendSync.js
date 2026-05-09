import { useState, useEffect, useRef, useCallback } from "react";
import { SET_COMPONENT_TREE } from "../context/editorActions";
import { AUTO_SAVE_DEBOUNCE_MS } from "../constants/editor";
import logger from "../utils/logger";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://194.195.119.159/react-editor/api";

/**
 * Performs a fetch request to the backend API with error handling.
 * @param {string} endpoint - The API endpoint (e.g., "/canvas")
 * @param {Object} [options={}] - Fetch options
 * @returns {Promise<Object|null>} The parsed JSON response or null on failure
 */
async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response?.ok) {
      const errorData = await response?.json().catch(() => ({}));
      logger.warn("useBackendSync", `API ${options?.method || "GET"} ${endpoint} failed: ${response?.status}`, errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.warn("useBackendSync", `API request to ${endpoint} failed`, error);
    return null;
  }
}

/**
 * Syncs the editor state with the backend API.
 *
 * - On mount: fetches all components from GET /api/canvas and loads them into the editor.
 * - Provides `saveComponent` to POST new components after paste.
 * - Provides `updateComponent` to PUT updated components on auto-save.
 *
 * @param {Object} params
 * @param {Object} params.state - The editor state
 * @param {Function} params.dispatch - The editor dispatch function
 * @returns {{ isLoading: boolean }} Loading state for the initial canvas fetch
 */
function useBackendSync({ state, dispatch }) {
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const savedIdsRef = useRef(new Set());
  const saveTimerRef = useRef(null);
  const previousChildrenRef = useRef(null);

  /**
   * On mount: fetch stored components and replace the canvas tree.
   */
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    /**
     * Fetches canvas components from the backend and replaces the tree.
     * Uses SET_COMPONENT_TREE to avoid duplication with any existing children.
     */
    async function loadCanvas() {
      try {
        const data = await apiFetch("/canvas");
        if (!data?.components?.length) return;

        const validComponents = data.components.filter(
          (component) => component?.id && component?.type
        );

        if (!validComponents.length) return;

        for (const component of validComponents) {
          savedIdsRef.current.add(component.id);
        }

        const canvasRoot = {
          id: "canvas-root",
          type: "container",
          tag: "div",
          label: "Canvas",
          styles: {
            width: "100%",
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "40px",
            padding: "80px",
            boxSizing: "border-box",
          },
          children: validComponents,
        };

        dispatch({ type: SET_COMPONENT_TREE, tree: canvasRoot });
      } catch (error) {
        logger.warn("useBackendSync", "loadCanvas failed", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCanvas();
  }, [dispatch]);

  /**
   * Saves a new component to the backend via POST.
   * @param {Object} component - The component tree node to save
   */
  const saveComponent = useCallback(async (component) => {
    try {
      if (!component?.id) return;

      const data = await apiFetch("/component", {
        method: "POST",
        body: JSON.stringify({ component }),
      });

      if (data?.id) {
        savedIdsRef.current.add(data.id);
        logger.info("useBackendSync", `Component '${data.id}' saved`);
      }
    } catch (error) {
      logger.warn("useBackendSync", "saveComponent failed", error);
    }
  }, []);

  /**
   * Updates an existing component on the backend via PUT.
   * @param {string} componentId - The component ID
   * @param {Object} componentData - The updated component tree node
   */
  const updateComponentOnBackend = useCallback(async (componentId, componentData) => {
    try {
      if (!componentId) return;

      await apiFetch(`/component/${encodeURIComponent(componentId)}`, {
        method: "PUT",
        body: JSON.stringify({ component: componentData }),
      });
    } catch (error) {
      logger.warn("useBackendSync", `updateComponent '${componentId}' failed`, error);
    }
  }, []);

  /**
   * Watches for new children added to canvas-root (paste events)
   * and POSTs them to the backend. Also debounces PUT for updated children.
   */
  useEffect(() => {
    try {
      const children = state?.componentTree?.children;
      if (!children) return;

      const prevChildren = previousChildrenRef.current;
      previousChildrenRef.current = children;

      // Skip the initial render
      if (prevChildren === null) return;

      // Detect newly added children (POST)
      for (const child of children) {
        if (child?.id && !savedIdsRef.current.has(child.id)) {
          saveComponent(child);
        }
      }

      // Debounced update for existing children (PUT)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        try {
          for (const child of children) {
            if (child?.id && savedIdsRef.current.has(child.id)) {
              updateComponentOnBackend(child.id, child);
            }
          }
        } catch (error) {
          logger.warn("useBackendSync", "debounced update failed", error);
        }
      }, AUTO_SAVE_DEBOUNCE_MS);

      return () => {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
      };
    } catch (error) {
      logger.warn("useBackendSync", "sync effect failed", error);
    }
  }, [state?.componentTree?.children, saveComponent, updateComponentOnBackend]);

  return { isLoading };
}

export default useBackendSync;
