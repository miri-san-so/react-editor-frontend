import WebsiteEditor from "./components/WebsiteEditor/WebsiteEditor";
import ErrorFallback from "./components/shared/ErrorFallback";
import "./App.css";

/**
 * Root application component
 * @returns {React.ReactElement}
 */
function App() {
  /**
   * Handles save callback from the editor
   * @param {Object} serializedComponent - The serialized component tree
   */
  function handleSave(serializedComponent) {
    try {
      console.log("Component saved:", serializedComponent);
    } catch (error) {
      console.error("Save failed:", error);
    }
  }

  try {
    return (
      <WebsiteEditor
        component={null}
        onSave={handleSave}
      />
    );
  } catch (error) {
    return <ErrorFallback message="Failed to load application" />;
  }
}

export default App;
