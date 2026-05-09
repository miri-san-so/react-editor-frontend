# React Visual Editor

A visual component editor for building and editing web UI directly in the browser. Paste JSX or CSV components and edit them live on a canvas with property controls, inline editing, and multiplayer cursor support.

![React Visual Editor](hero.png)

## Features

- **Multi-format paste** -- Drop in JSX/TSX components or CSV/TSV tables and see them rendered instantly on the canvas
- **Visual editing** -- Click any element to select it, edit text inline, adjust styles through the properties panel
- **Properties panel** -- Edit typography (40+ fonts, size, weight, style), colors, spacing (padding/margin), sizing, opacity, and canvas background
- **Layers panel** -- Tree view of the component hierarchy with click-to-select
- **Inline toolbar** -- Floating toolbar above selected elements for quick font, alignment, and style changes
- **Undo/Redo** -- Full history stack (Ctrl+Z / Ctrl+Shift+Z) with 50-state depth
- **Keyboard shortcuts** -- Delete, Escape to deselect, Tab to navigate siblings, Space+drag to pan
- **Multiplayer cursors** -- Real-time cursor sharing via WebSocket with animal names and colored indicators
- **URL-based selection** -- Share selections via `?nodeId=<id>` query params with bidirectional sync
- **Sound effects** -- Optional audio feedback on editor actions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, vanilla CSS with custom properties |
| Build | Create React App |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm start

# Production build
npm run build
```

## Backend Architecture

```
                          React Editor (Browser)
 +-----------------------------------------------------------------+
 |                                                                 |
 |   WebsiteEditor                                                 |
 |   +-----------------------------------------------------------+ |
 |   |                                                           | |
 |   |  EditorProvider (Context)                                 | |
 |   |  +-----------------------------------------------------+ | |
 |   |  |  state.componentTree    dispatch(action)             | | |
 |   |  +----------+------------------+-----------------------+ | |
 |   |             |                  |                         | |
 |   |     +-------v--------+  +-----v---------+               | |
 |   |     |  Canvas         |  | Layers/Props  |               | |
 |   |     |  + useCursors() |  | Panels        |               | |
 |   |     +-------+--------+  +---------------+               | |
 |   |             |                                            | |
 |   |  +----------v-------------------------------------------+ |
 |   |  |  useBackendSync()                                    | | |
 |   |  |  Watches componentTree for added/updated/removed     | | |
 |   |  |  children and syncs to REST API                      | | |
 |   |  +----------+------------------------------------------+ | |
 |   +-------------|---------------------------------------------+ |
 |                 |                                               |
 +-----------------|-----------------------------------------------+
                   |
     +-------------v--------------+       +------------------------+
     |        REST API            |       |      WebSocket         |
     |  /react-editor/api        |       |  /react-editor         |
     +---------+------------------+       +-----------+------------+
     |                            |       |                        |
     |  GET    /canvas            |       |  IN:  { x, y }        |
     |    Load all components     |       |    Local cursor pos    |
     |    on mount                |       |    (throttled 50ms)    |
     |                            |       |                        |
     |  POST   /component         |       |  OUT: { type:"cursor", |
     |    Save new component      |       |    id, color, name,   |
     |    (on paste)              |       |    x, y }             |
     |                            |       |    Remote cursor pos   |
     |  PUT    /component/:id     |       |                        |
     |    Update existing         |       |  OUT: { type:"remove", |
     |    (debounced 1000ms)      |       |    id }               |
     |                            |       |    User disconnected   |
     |  DELETE /component/:id     |       |                        |
     |    Remove component        |       |                        |
     +----------------------------+       +------------------------+
                   |                                  |
                   +----------------+-----------------+
                                    |
                            +-------v--------+
                            |   Backend      |
                            |   Server       |
                            +----------------+
```

### Data Flow

**Persistence (REST)** -- `useBackendSync` hook runs inside `EditorLayout` and watches `state.componentTree` for changes:

1. **On mount** -- `GET /canvas` fetches all saved components, dispatches `SET_COMPONENT_TREE` to populate the canvas
2. **On paste** -- New child detected in tree, `POST /component` saves it, ID tracked in `savedIdsRef`
3. **On edit** -- Changed child detected, debounced `PUT /component/:id` after 1000ms of inactivity
4. **On delete** -- Removed child detected, `DELETE /component/:id` cleans up backend

**Multiplayer Cursors (WebSocket)** -- `useCursors` hook runs inside `Canvas` and maintains a persistent connection:

1. **Local cursor** -- `mousemove` on canvas sends `{ x, y }` (throttled to 50ms) over WebSocket
2. **Remote cursors** -- Incoming `cursor` messages render colored SVG arrows with animal names
3. **Cleanup** -- `remove` messages hide disconnected users; cursors fade after 3s of inactivity

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `https://getsnapdrop.in/react-editor/api` | REST API base URL |
| `REACT_APP_WS_URL` | `wss://getsnapdrop.in/react-editor` | WebSocket server URL |

## Project Structure

```
src/
  components/
    WebsiteEditor/      Main editor layout
    Canvas/             Canvas rendering, selection outlines, remote cursors
    Panels/             Layers tree and properties panel
    InlineToolbar/      Floating toolbar for selected elements
    CsvTable/           Editable CSV table component
    QuickActionToolbar/ Mode toggles (sound, preview)
    shared/             Reusable UI (Dropdown, NumericInput, Icon)
  context/              EditorContext provider, reducer, action types
  hooks/                useKeyboardShortcuts, useCursors, useBackendSync,
                        useUrlSelection, useEditorSounds
  utils/                jsxParser, csvParser, pasteDetector, sanitizer, logger
  constants/            Editor config (history depth, debounce, font limits)
  styles/               CSS custom properties
```
