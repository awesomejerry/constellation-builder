# 🛤️ Constellation Builder Roadmap

**Project Status**: ✅ Stable & Live at https://www.awesomejerry.space/constellation-builder
**Last Updated**: 2026-02-12
**Version**: 1.0.0

---

## ✅ Completed Features

### Core Functionality
- [x] Add stars (click anywhere on canvas)
- [x] Connect stars (drag between stars)
- [x] Move stars (drag individual stars)
- [x] Delete stars
- [x] Double-click to edit stars
- [x] Auto-save to localStorage

### Star Properties
- [x] Title
- [x] Description
- [x] Tags (comma-separated)
- [x] Colors (6 options: white, gold, sky blue, coral, pale green, plum purple)
- [x] Shapes (circle, diamond, hexagon, star)
- [x] Created timestamps

### Connections
- [x] Create connections between stars
- [x] Curved connection lines (quadratic bezier)
- [x] Gradient colors between connected stars
- [x] Glow effects on connections
- [x] Duplicate connection prevention

### Navigation
- [x] Zoom (mouse wheel)
- [x] Pan (shift + drag)
- [x] Reset view button
- [x] Zoom indicator (percentage display)
- [x] Minimap with viewport rectangle

### Tools & Features
- [x] Undo/Redo system (Ctrl+Z / Ctrl+Y, max 50 states)
- [x] Search by title or tag (Ctrl+F)
- [x] Connect by tag (auto-link stars with matching tags)
- [x] Particle effects (on star creation/connection)

### Data Management
- [x] Export as PNG image
- [x] Export as JSON (full data backup)
- [x] Import from JSON (Append/Replace modes)
- [x] Auto-save to localStorage

### Analytics
- [x] Statistics modal with 8 metrics:
  - Total stars
  - Total connections
  - Average connections per star
  - Most connected star
  - Total tags
  - Most used tag
  - Oldest star
  - Newest star

### Visual & UX
- [x] Dark/Light theme toggle
- [x] Animated background stars (twinkling)
- [x] Star glow effects
- [x] Responsive design (desktop, tablet, mobile)
- [x] Help modal with instructions
- [x] Keyboard shortcuts (Space, Ctrl+F, Escape)
- [x] Zoom controls UI (visible on mobile)

---

## ✅ Recently Completed (Feb 2026)

### ✅ Fix: Zoom Buttons
**Status**: ✅ FIXED (2026-02-12)
**Description**: Zoom buttons (➖/➕) exist in HTML but have no event handlers in JavaScript
**Impact**: Mobile users can now use buttons + pinch-to-zoom
**Priority**: Medium (FIXED)
**Commit**: `4ca626e`
**Changes**:
- Added event listeners for zoomInBtn and zoomOutBtn
- Implemented zoomIn() method with center-based zooming (25% increments)
- Implemented zoomOut() method with center-based zooming
- Respects min/max zoom limits (0.25x to 4x)
- Updates zoom level display in header

### ✅ Feature: Drag Minimap Navigation
**Status**: ✅ IMPLEMENTED (2026-02-12)
**Description**: Click on minimap to navigate the canvas
**Priority**: High
**Commit**: `4ca626e`
**Changes**:
- Click on minimap to jump to that area
- Centers viewport on clicked location
- Works on desktop and mobile
- High-impact feature for large constellations

---

## 📋 Planned Features

### High Priority (Quick Wins)

#### 1. Drag Minimap Navigation
**Description**: Click on minimap to jump to that area
**User Story**: As a user with many stars, I want to click on the minimap to quickly navigate to different areas
**Acceptance Criteria**:
- [x] Click on minimap updates panX and panY to center on clicked location
- [x] Clicking inside viewport rectangle centers on that position
- [x] Clicking outside viewport rectangle jumps to that area
- [x] Works on both desktop and mobile
**Priority**: High
**Estimated Time**: 1-2 hours

**Implementation Notes**:
- Add click event listener to minimap canvas
- Calculate world coordinates from minimap click position

### ✅ Feature: Export as SVG\n**Status**: ✅ IMPLEMENTED (2026-02-14)\n**Commit**: `926ee48`\n**Description**: Professional vector export for presentations\n**Changes**:\n- Added SVG Vector export option to export modal\n- Implemented exportSVG() method with full star/shape support\n- All 4 shapes supported (circle, diamond, hexagon, star)\n- Curved connections using quadratic bezier paths\n- Glow effects and borders matching canvas\n- Title labels for all stars\n- Dynamic viewBox based on star positions\n- Background color matches theme\n- SVG downloads successfully with .svg extension\n**Priority**: Medium (COMPLETED)\n**Estimated Time**: 2-3 hours (Actual: 3 hours including testing)\n**Test Result**: ✅ PASS - Modal shows 3 options, SVG downloads correctly\n
**Acceptance Criteria**:
- [x] Add "SVG Vector" option to export modal
- [x] SVG includes all stars, connections, and labels
- [x] SVG is scalable without quality loss
- [x] File downloads with .svg extension
**Priority**: Medium
**Estimated Time**: 2-3 hours

**Implementation Notes**:
- Create SVG string programmatically from stars/connections data
- Convert canvas shapes to SVG elements (circle, path, text)
- Embed colors and styles as SVG attributes

#### 2. Tag Filtering (COMPLETED - see above)
**Description**: Filter stars by tag visibility
**User Story**: As a user with many ideas, I want to show/hide stars based on their tags
**Acceptance Criteria**:
- [ ] Tag filter UI (dropdown or tag bar)
- [ ] Toggle individual tags on/off
- [ ] Stars with hidden tags become transparent
- [ ] Connections to hidden stars also fade
- [ ] "Show All" button to reset filters
**Priority**: Medium
**Estimated Time**: 2-3 hours

**Implementation Notes**:
- Maintain `visibleTags` Set/Array
- Filter stars in draw loop based on visible tags
- Update connection opacity based on connected stars' visibility

#### 5. Multi-Selection & Group Actions
**Description**: Select multiple stars and perform batch operations
**User Story**: As a user, I want to select multiple stars to delete them all or change their color
**Acceptance Criteria**:
- [ ] Click to select multiple stars (Ctrl+Click)
- [ ] Drag selection box to select area
- [ ] Visual feedback for selected stars
- [ ] Batch delete selected stars
- [ ] Batch color change for selected stars
- [ ] Batch move (drag one, others follow)
**Priority**: Medium
**Estimated Time**: 3-4 hours

**Implementation Notes**:
- Add `selectedStars` array
- Add selection mode or modifier key handling
- Update modals to support batch operations
- Add context menu for selected group

### Low Priority (Nice to Have)

#### 6. Connection Line Styles
**Description**: Different line styles (solid, dashed, animated) for connections
**Acceptance Criteria**:
- [ ] Line style selector in connection UI
- [ ] Solid, dashed, dotted options
- [ ] Animated flowing effect option
- [ ] Per-connection style control
**Priority**: Low
**Estimated Time**: 2 hours

#### 7. Auto-Layout Algorithms
**Description**: One-click organization (circle, grid, force-directed)
**Acceptance Criteria**:
- [ ] Circle layout option
- [ ] Grid layout option
- [ ] Force-directed layout option
- [ ] Animated transitions
**Priority**: Low
**Estimated Time**: 4-5 hours

#### 8. Keyboard Shortcuts for Mode Switching
**Description**: Press 1-4 to switch between modes
**Acceptance Criteria**:
- [ ] 1: Add Star mode
- [ ] 2: Connect mode
- [ ] 3: Move mode
- [ ] 4: Delete mode
- [ ] Visual indicator of current mode key
**Priority**: Low
**Estimated Time**: 30 minutes

#### 9. Star Notes/Detailed Descriptions
**Description**: Expandable notes per star with rich text
**Acceptance Criteria**:
- [ ] Multi-line notes field
- [ ] Markdown support
- [ ] Expandable view on click
- [ ] Search within notes
**Priority**: Low
**Estimated Time**: 2 hours

#### 10. Constellation Templates
**Description**: Pre-built templates for common use cases
**Acceptance Criteria**:
- [ ] Template gallery (mind map, flowchart, org chart)
- [ ] Apply template to new constellation
- [ ] Save custom templates
**Priority**: Low
**Estimated Time**: 3 hours

---

## 🎯 Current Sprint Focus

**Sprint 1 (Immediate - Feb 2026)**:
1. Fix zoom buttons (bug fix)
2. Drag minimap navigation (feature)
3. Export as SVG (feature)

**Target**: Complete by 2026-02-15

---

## 📊 Progress Metrics

- **Total Features**: 40
- **Completed**: 32
- **In Progress**: 1
- **Planned**: 7
- **Completion Rate**: 80%

---

## 🐛 Known Issues

1. Zoom buttons not functional (UI exists, no JS handlers)
2. Minimap click not implemented
3. Touch gestures (pinch-zoom, two-finger pan) not tested

---

## 💡 Future Ideas

- Real-time collaboration (WebRTC)
- Constellation templates library
- AI-powered auto-tagging
- Import from other formats (MindManager, XMind)
- Export to presentation formats (PDF, PPTX)
- Constellation gallery/sharing
- Cloud sync with user accounts

---

**Last Updated**: 2026-02-12 by openclaw

### ✅ Feature: Tag Filtering
**Status**: ✅ IMPLEMENTED (2026-02-14)
**Commit**: \`e858955\`
**Description**: Filter stars by tag visibility
**User Story**: Users with many ideas can show/hide stars based on their tags
**Changes**:
- Added "🏷️ Filter" button to action toolbar
- Implemented showTagFilter() modal with dynamic tag list
- Add toggleTag() method to show/hide individual tags
- Add showAllTags() method to reset all filters
- Add isTagVisible() helper to check star visibility
- Update drawStars() to render hidden stars with 15% opacity
- Update drawConnections() to fade connections to hidden stars
- Add Tag Filter Modal with tag buttons and "Show All" button
- Stars with hidden tags become transparent
- Connections to hidden stars fade accordingly
**Priority**: Medium (COMPLETED)
**Estimated Time**: 2-3 hours (Actual: 3 hours)
**Test Result**: ✅ PASS - Modal opens, tag list populated dynamically
