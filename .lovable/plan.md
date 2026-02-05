# Dashboard Builder - Feature Roadmap

## ✅ Completed Features

- **Filters/Slicers**: Dropdown (multi-select, Group By dimensions), List (multi-select), Date Range (default: date), Numeric Range (measures only)
- **Header Component**: Text container with logo upload, snap to top, match width
- **Multi-Line Chart**: Measure 1 and Measure 2 fields in right panel
- **Table Visual**: "Select Columns" multi-select with all measures and dimensions
- **KPI Cards**: Measure and Calculation fields only (no Group By or Date)
- **Chart Sorting**: Sort options for all chart types (value/name, asc/desc)
- **Cross-Filtering**: Click one visual to filter others
- **Visual Type Switching**: Click palette item to change selected visual type
- **X-axis Text Fitting**: Rotated labels (-35°), truncation (12 chars), increased height
- **Preview Button**: Full-screen dashboard preview mode
- **Data Label Options**: Position (top/inside/outside/center) and format (value/percent/both)
- **Show Totals Toggle**: Table visual totals row in Format panel
- **Matrix Visual**: Row/Column fields (Group By dimensions), Values (Measures)
- **Grid Lock**: 16px snap-to-grid alignment for visuals, panels, slicers (toggle in toolbar)
- **Auto-Expand**: Visuals automatically expand to fill available space when dropped (toggle in toolbar)
- **Fixed A4 Canvas**: Canvas is fixed-width (1240px) with vertical scroll only - no horizontal scroll
- **Preview Lock Mode**: All elements are non-draggable and non-resizable in Preview mode
- **Anti-Overlap System**: Elements automatically find valid positions when dropped, preventing overlaps
- **Alignment Guides**: Dashed lines appear when dragging elements near aligned edges of other elements

## 🔲 TBD - Future Enhancements

### Visual Configuration
| Feature | Description | Status |
|---------|-------------|--------|
| Date Split on Visual | Date granularity control per visual | ✅ Done (via Date dropdown) |
| Sorting on Visual | Sort control per individual visual | ✅ Done (via Sort By dropdown) |

### Chart Types
| Feature | Description | Status |
|---------|-------------|--------|
| Gauge Chart | Gauge visualization | Note: Not supported by recharts library |

### Advanced Charts (Disabled)
These charts are currently disabled pending functionality discussion:
- Waterfall
- Treemap
- Funnel
- Scatter

---

## Implementation Notes

### Grid Lock System
- Uses 16px grid for snap alignment
- Toggle button in toolbar shows grid overlay when enabled
- All drag operations (visuals, panels, slicers, text) snap to grid
- Resize operations also snap to grid

### Auto-Expand Feature
- When enabled, new visuals expand to fill available horizontal and vertical space
- Collision detection prevents overlapping with existing visuals
- Minimum size: 400x300px
- Respects canvas boundaries with margin
