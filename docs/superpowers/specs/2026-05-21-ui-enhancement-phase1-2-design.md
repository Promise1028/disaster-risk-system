# UI Enhancement Phase 1 & 2 — Design Spec

**Date:** 2026-05-21
**Status:** Approved

---

## Overview

Enhance the disaster risk assessment system with awwwards-grade dark dashboard UI, advanced data visualization, alert system overhaul, and map feature expansion, plus AMap integration for geolocation (deferred).

---

## 1. Design System: "Silent Authority · Instant Response"

### 1.1 Color Palette

| Role | Value | Usage |
|------|-------|-------|
| `--bg-primary` | `#0a0e17` | Global background |
| `--bg-card` | `rgba(255,255,255,0.03)` | Card surfaces, frosted glass |
| `--bg-card-hover` | `rgba(255,255,255,0.06)` | Card hover state |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Card borders, dividers |
| `--border-active` | `rgba(24,144,255,0.3)` | Active/hover border glow |
| `--accent-primary` | `#1890ff` → `#00c6ff` | Primary actions, links, safe status gradient |
| `--risk-critical` | `#ff4d4f` | Critical risk |
| `--risk-high` | `#fa8c16` | High risk |
| `--risk-medium` | `#fadb14` | Medium risk |
| `--risk-low` | `#52c41a` | Low risk |
| `--text-primary` | `#e8e8e8` | Body text |
| `--text-secondary` | `#8c8c8c` | Labels, descriptions |
| `--text-muted` | `#595959` | Disabled, placeholders |

### 1.2 Visual Language

- **Glassmorphism cards:** semi-transparent backgrounds with `backdrop-filter: blur()` and subtle 1px borders. Stacked cards produce depth.
- **Glow halos:** critical alert cards emit a red radial gradient with a breathing animation (pulse 2s).
- **Charts:** ECharts with transparent backgrounds using system colors. Smooth bezier curves. Gradient fills under line charts.
- **Micro-interactions:** card hover lifts 4px up with border glow transition (300ms ease). Number counter scroll animation. Page transitions via CSS fade (200ms).
- **Typography:** System sans-serif stack. Data numbers in tabular-nums (`font-variant-numeric: tabular-nums`). Headings in semi-bold.

### 1.3 Layout

Sidebar navigation (dark glass), sticky top stats bar, main content grid. Sidebar: 240px collapsed → 64px collapsed.

---

## 2. Phase 1 — Data Visualization & Reports

### 2.1 Dashboard Visualizations

**Risk Trend Line Chart** (new):
- X-axis: last 7 days. Y-axis: risk score (0-100).
- Dual Y-axis or two lines: risk score + alert count.
- Smooth bezier curve, gradient fill under line.
- New endpoint: `GET /api/stats/trends?period=7d`

**Population Affected Bar Chart** (new):
- X-axis: disaster types (earthquake, flood, typhoon, landslide, fire). Y-axis: affected population.
- Horizontal or vertical bar chart, sorted descending.
- Each bar colored by risk level of that disaster type.
- New endpoint: `GET /api/stats/population?period=30d`

### 2.2 Time Filter

- Filter bar above charts: Today / This Week / This Month toggle buttons (Ant Design `Segmented`).
- All charts and the assessment table respond to the filter.
- Passed as query param `period=today|week|month`.

### 2.3 Export Reports

- Export buttons in the top-right of the dashboard.
- **Excel:** `xlsx` library, exports current filtered data (assessments + stats).
- **PDF:** `jspdf` + `html2canvas`, generates a formatted report with header, charts snapshot, and summary table.
- New endpoint: `GET /api/reports/export?format=excel|pdf&period=...`

### 2.4 Backend: New Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats/trends` | GET | Daily risk scores + alert counts for period |
| `/api/stats/population` | GET | Affected population by disaster type for period |
| `/api/reports/export` | GET | Export data dump (JSON → frontend formats) |

---

## 3. Phase 2 — Alerts & Map

### 3.1 Alert Enhancement

**Critical Alert Popup:**
- When a new critical-level alert arrives via WebSocket, show a centered red modal with backdrop blur.
- Title: pulse icon + "高危预警" text. Body: alert details (location, type, severity). Footer: "查看详情" and "忽略" buttons.
- Auto-trigger: if `alert.level === 'critical'`, show modal. Only one modal at a time (queue subsequent).

**Alert Priority Sorting:**
- Alert list always sorted: critical → high → medium → low, then by timestamp descending.

**"View on Map" Button:**
- Each active alert row has a button "查看地图位置".
- Click navigates to `/risk-map?lat=X&lng=Y&zoom=14` with the alert's coordinates.
- RiskMap page reads query params and pans/zooms to that location, opens a popup.

### 3.2 Map Enhancements (Leaflet)

**Layer Switching:**
- `L.control.layers` base control in the top-right corner.
- Three overlay layers:
  - **Population Density Heatmap:** heatmap layer from `leaflet.heat` (or simple circle markers scaled by density for now).
  - **Safe Zones:** green markers for shelters/hospitals.
  - **Hazard Points:** orange/red markers for known hazard locations.
- Each layer toggleable via checkbox.

**Click-to-Query:**
- Click any point on the map → reverse-geocode to find the nearest risk zone.
- Show a Leaflet `popup` with: risk level badge, hazard type, population density, distance to nearest safe zone.
- If no risk zone within 50km, show "该区域暂无风险数据".

**Evacuation Route Planning:**
- Right-click or button: "规划从此处到最近避难所路线".
- Calculate route using haversine (existing `risk_engine.py`). Draw as dashed polyline with arrow markers.
- Popup shows: distance, estimated walking time, safe zone name.
- Later: replace with AMap driving/walking route API.

**Full-Screen Mode:**
- Button in map toolbar: fullscreen icon.
- Uses Fullscreen API on the map container.
- Exit via Esc or button.

### 3.3 Interaction Improvements

**Multi-Disaster Filter:**
- Replace single-select with multi-select checkboxes or Select with `mode="multiple"`.
- Filter applies to map markers AND dashboard data simultaneously.

**Risk Color Unification:**
- Define CSS variables for the 4 risk levels.
- All components (badges, chart colors, map markers, alert icons) reference these variables.
- Add a `<style>` block or CSS module with `--risk-critical: #ff4d4f; --risk-high: #fa8c16; --risk-medium: #fadb14; --risk-low: #52c41a;`

**System Name Display:**
- Sidebar header: "险析" as logo text, subtitle "智能灾害风险评估与应急决策系统".
- Browser `<title>` updated.
- Login page heading.

### 3.4 Backend: New/Modified Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/risk-zones?types=earthquake,flood` | GET | Multi-type filter via comma-separated query param |
| `/api/disasters?types=...` | GET | Same multi-type filter |
| `/api/decision` | POST | Existing, already does route planning |
| `/api/reverse-geocode` | GET | New: given lat/lng, return nearest risk zone info |

---

## 4. Implementation Order

1. CSS design system (variables, glassmorphism, dark theme)
2. Layout & sidebar redesign
3. Dashboard: trend chart + population chart + time filter
4. Dashboard: export Excel/PDF
5. Alert popup + priority sort + "view on map" button
6. Map: layer switching + click query + fullscreen
7. Map: evacuation route viz
8. Multi-disaster filter + color unification + system name
9. AMap integration (deferred — separate spec)

---

## 5. NPM Dependencies (New)

- `xlsx` — Excel export
- `jspdf` + `html2canvas` — PDF export
- `leaflet.heat` — heatmap layer (or simple implementation)

---

## 6. Self-Review

- No placeholders or TBDs remaining.
- Design system (section 1) is consistent with feature implementations (sections 2-3).
- Scope is focused on Phase 1+2; AMap deferred.
- Risk colors, system name, and multi-filter are specified unambiguously.
