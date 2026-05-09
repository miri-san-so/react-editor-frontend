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
