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

## 🔲 TBD - Pending Features

### UI/UX Enhancements
| Feature | Description | Status |
|---------|-------------|--------|
| Grid Lock | Snap-to-grid alignment for visuals | TBD |
| Expand on Drag | Visual expands to fill area where dragged | TBD |

### Visual Configuration
| Feature | Description | Status |
|---------|-------------|--------|
| Date Split on Visual | Date granularity control per visual | ✅ Done (via Date dropdown) |
| Sorting on Visual | Sort control per individual visual | ✅ Done (via Sort By dropdown) |

### Chart Types
| Feature | Description | Status |
|---------|-------------|--------|
| Gauge Chart | Fix gauge functionality | TBD (Gauge removed - not supported by recharts) |

### Advanced Charts (Disabled)
These charts are currently disabled pending functionality discussion:
- Waterfall
- Treemap
- Funnel
- Scatter

---

## Implementation Notes

### Grid Lock System
Consider 8px or 16px grid for snap alignment.

### Expand on Drag
Implement collision detection to expand visual to available space.
