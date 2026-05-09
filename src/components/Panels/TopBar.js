import React from "react";
import { useEditor } from "../../context/EditorContext";
import "./TopBar.css";

/**
 * Top bar showing the component name when panels are visible
 * @returns {React.ReactElement|null}
 */
function TopBar() {
  const { state } = useEditor();

  try {
    const componentName = state?.componentTree?.label || "Component";

    return (
      <div className="top-bar">
        <span className="top-bar__title">{componentName}</span>
      </div>
    );
  } catch (error) {
    return null;
  }
}

export default TopBar;
