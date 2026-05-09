import {
  SELECT_NODE,
  DESELECT,
  UPDATE_NODE_STYLE,
  UPDATE_NODE_CONTENT,
  DELETE_NODE,
  TOGGLE_PANELS,
  SET_TOOL_MODE,
  UNDO,
  REDO,
  SET_COMPONENT_TREE,
  SET_CANVAS_BG,
  ADD_NODE,
  UPDATE_CSV_CELL,
  TOGGLE_XRAY,
} from "./editorActions";
import { MAX_HISTORY_LENGTH } from "../constants/editor";
import logger from "../utils/logger";

/**
 * Deep clones a value using structuredClone with JSON fallback for test environments.
 * @param {*} value - The value to clone
 * @returns {*} The cloned value
 */
function deepClone(value) {
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    logger.error("editorReducer", "deepClone failed", error);
    return value;
  }
}

/**
 * Recursively finds a node by ID in the component tree
 * @param {Object} node - The current node to search
 * @param {string} nodeId - The ID to find
 * @returns {Object|null} The found node or null
 */
function findNodeById(node, nodeId) {
  try {
    if (node?.id === nodeId) {
      return node;
    }
    if (node?.children) {
      for (const child of node.children) {
        const found = findNodeById(child, nodeId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  } catch (error) {
    logger.error("editorReducer", "findNodeById failed", error);
    return null;
  }
}

/**
 * Updates a node's style property in the tree (returns new tree)
 * @param {Object} node - The root node
 * @param {string} nodeId - The target node ID
 * @param {string} property - The CSS property to update
 * @param {*} value - The new value
 * @returns {Object} The updated tree
 */
function updateNodeStyle(node, nodeId, property, value) {
  try {
    if (node?.id === nodeId) {
      return {
        ...node,
        styles: {
          ...node?.styles,
          [property]: value,
        },
      };
    }
    if (node?.children) {
      return {
        ...node,
        children: node.children.map((child) =>
          updateNodeStyle(child, nodeId, property, value)
        ),
      };
    }
    return node;
  } catch (error) {
    logger.error("editorReducer", "updateNodeStyle failed", error);
    return node;
  }
}

/**
 * Updates a node's content in the tree (returns new tree)
 * @param {Object} node - The root node
 * @param {string} nodeId - The target node ID
 * @param {string} content - The new content
 * @returns {Object} The updated tree
 */
function updateNodeContent(node, nodeId, content) {
  try {
    if (node?.id === nodeId) {
      return {
        ...node,
        content: content,
      };
    }
    if (node?.children) {
      return {
        ...node,
        children: node.children.map((child) =>
          updateNodeContent(child, nodeId, content)
        ),
      };
    }
    return node;
  } catch (error) {
    logger.error("editorReducer", "updateNodeContent failed", error);
    return node;
  }
}

/**
 * Removes a node from the tree by ID (returns new tree)
 * @param {Object} node - The root node
 * @param {string} nodeId - The ID of the node to remove
 * @returns {Object} The updated tree
 */
function removeNode(node, nodeId) {
  try {
    if (node?.children) {
      return {
        ...node,
        children: node.children
          .filter((child) => child?.id !== nodeId)
          .map((child) => removeNode(child, nodeId)),
      };
    }
    return node;
  } catch (error) {
    logger.error("editorReducer", "removeNode failed", error);
    return node;
  }
}

/**
 * Updates a single cell value in a csv-table node's data.
 * @param {Object} node - The root node
 * @param {string} nodeId - The target csv-table node ID
 * @param {number} rowIndex - Row index of the cell
 * @param {number} colIndex - Column index of the cell
 * @param {string} value - The new cell value
 * @returns {Object} The updated tree
 */
function updateCsvCell(node, nodeId, rowIndex, colIndex, value) {
  try {
    if (node?.id === nodeId && node?.type === "csv-table") {
      const newCsvData = (node?.csvData || []).map((row, rIdx) => {
        if (rIdx === rowIndex) {
          return row.map((cell, cIdx) => {
            if (cIdx === colIndex) return value;
            return cell;
          });
        }
        return row;
      });
      return { ...node, csvData: newCsvData };
    }
    if (node?.children) {
      return {
        ...node,
        children: node.children.map((child) =>
          updateCsvCell(child, nodeId, rowIndex, colIndex, value)
        ),
      };
    }
    return node;
  } catch (error) {
    logger.error("editorReducer", "updateCsvCell failed", error);
    return node;
  }
}

/**
 * Adds a node as a sibling after a given node ID in the tree.
 * @param {Object} tree - The root node
 * @param {Object} newNode - The node to add
 * @param {string} afterNodeId - Insert after this node's ID
 * @returns {Object} Updated tree
 */
// eslint-disable-next-line no-unused-vars
function addNodeAsSibling(tree, newNode, afterNodeId) {
  try {
    if (!tree?.children) return tree;

    const idx = tree.children.findIndex((child) => child?.id === afterNodeId);
    if (idx !== -1) {
      const newChildren = [...tree.children];
      newChildren.splice(idx + 1, 0, newNode);
      return { ...tree, children: newChildren };
    }

    return {
      ...tree,
      children: tree.children.map((child) =>
        addNodeAsSibling(child, newNode, afterNodeId)
      ),
    };
  } catch (error) {
    logger.error("editorReducer", "addNodeAsSibling failed", error);
    return tree;
  }
}

/**
 * Adds a node as the last child of the root node.
 * @param {Object} tree - The root node
 * @param {Object} newNode - The node to add
 * @returns {Object} Updated tree
 */
function addNodeAsChild(tree, newNode) {
  try {
    return {
      ...tree,
      children: [...(tree?.children || []), newNode],
    };
  } catch (error) {
    logger.error("editorReducer", "addNodeAsChild failed", error);
    return tree;
  }
}

/**
 * Pushes current tree state to history for undo support
 * @param {Object} state - Current editor state
 * @returns {Object} State with updated history
 */
function pushToHistory(state) {
  try {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(deepClone(state.componentTree));
    if (newHistory.length > MAX_HISTORY_LENGTH) {
      newHistory.shift();
    }
    return {
      ...state,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  } catch (error) {
    logger.error("editorReducer", "pushToHistory failed", error);
    return state;
  }
}

/**
 * The main editor reducer
 * @param {Object} state - Current state
 * @param {Object} action - Dispatched action
 * @returns {Object} New state
 */
function editorReducer(state, action) {
  try {
    switch (action?.type) {
      case SELECT_NODE: {
        return {
          ...state,
          selectedNodeId: action?.id ?? null,
        };
      }

      case DESELECT: {
        return {
          ...state,
          selectedNodeId: null,
        };
      }

      case UPDATE_NODE_STYLE: {
        const stateWithHistory = pushToHistory(state);
        return {
          ...stateWithHistory,
          componentTree: updateNodeStyle(
            stateWithHistory.componentTree,
            action?.nodeId,
            action?.property,
            action?.value
          ),
        };
      }

      case UPDATE_NODE_CONTENT: {
        const stateWithHistory = pushToHistory(state);
        return {
          ...stateWithHistory,
          componentTree: updateNodeContent(
            stateWithHistory.componentTree,
            action?.nodeId,
            action?.content
          ),
        };
      }

      case DELETE_NODE: {
        const stateWithHistory = pushToHistory(state);
        return {
          ...stateWithHistory,
          componentTree: removeNode(
            stateWithHistory.componentTree,
            action?.nodeId
          ),
          selectedNodeId: null,
        };
      }

      case TOGGLE_PANELS: {
        return {
          ...state,
          panelsVisible: !state.panelsVisible,
        };
      }

      case SET_TOOL_MODE: {
        return {
          ...state,
          toolMode: action?.mode ?? "select",
        };
      }

      case UNDO: {
        if (state.historyIndex <= 0) {
          return state;
        }
        const newIndex = state.historyIndex - 1;
        return {
          ...state,
          componentTree: deepClone(state.history[newIndex]),
          historyIndex: newIndex,
          selectedNodeId: null,
        };
      }

      case REDO: {
        if (state.historyIndex >= state.history.length - 1) {
          return state;
        }
        const newIndex = state.historyIndex + 1;
        return {
          ...state,
          componentTree: deepClone(state.history[newIndex]),
          historyIndex: newIndex,
          selectedNodeId: null,
        };
      }

      case SET_CANVAS_BG: {
        return {
          ...state,
          canvasBackground: action?.color ?? state.canvasBackground,
        };
      }

      case ADD_NODE: {
        const stateWithHistory = pushToHistory(state);
        const newTree = addNodeAsChild(
          stateWithHistory.componentTree,
          action?.node
        );

        return {
          ...stateWithHistory,
          componentTree: newTree,
          selectedNodeId: action?.node?.id || null,
        };
      }

      case UPDATE_CSV_CELL: {
        const stateWithHistory = pushToHistory(state);
        return {
          ...stateWithHistory,
          componentTree: updateCsvCell(
            stateWithHistory.componentTree,
            action?.nodeId,
            action?.rowIndex,
            action?.colIndex,
            action?.value
          ),
        };
      }

      case TOGGLE_XRAY: {
        return {
          ...state,
          xrayMode: !state.xrayMode,
        };
      }

      case SET_COMPONENT_TREE: {
        return {
          ...state,
          componentTree: action?.tree ?? state.componentTree,
          selectedNodeId: null,
          history: [deepClone(action?.tree ?? state.componentTree)],
          historyIndex: 0,
        };
      }

      default:
        return state;
    }
  } catch (error) {
    logger.error("editorReducer", "editorReducer dispatch failed", error);
    return state;
  }
}

export { editorReducer, findNodeById };
