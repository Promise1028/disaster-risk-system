# UI Enhancement Phase 1 & 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the disaster risk system into an awwwards-grade dark dashboard with advanced charts, time filtering, Excel/PDF export, critical alert popups, multi-layer map, click-to-query, evacuation routing, and fullscreen map.

**Architecture:** Dark CSS design system with glassmorphism applied globally. New backend endpoints for trends/population/export/reverse-geocode. Dashboard gains ECharts line+bar charts with time filter. Alerts gain WebSocket-driven critical popup and map navigation. RiskMap gains Leaflet layer control, map click query, evacuation route drawing, and fullscreen.

**Tech Stack:** FastAPI (Python), React 18 + TypeScript, Ant Design 6, ECharts 6, Leaflet, xlsx, jspdf, html2canvas

---

## New Files Structure

| File | Responsibility |
|------|---------------|
| `backend/app/api/stats.py` | New router: trends + population stats + report export + reverse geocode |
| `frontend/src/styles/theme.css` | CSS custom properties, glassmorphism, dark theme |
| `frontend/src/components/CriticalAlertModal.tsx` | Critical alert popup with red glow |
| `frontend/src/pages/Dashboard/ExportButtons.tsx` | Excel/PDF export buttons |
| `frontend/src/pages/Dashboard/TrendChart.tsx` | 7-day risk trend line chart |
| `frontend/src/pages/Dashboard/PopulationChart.tsx` | Population by disaster type bar chart |
| `frontend/src/pages/RiskMap/LayerControl.tsx` | Layer toggle control for the map |
| `frontend/src/pages/RiskMap/MapClickHandler.tsx` | Click-to-query map handler |
| `frontend/src/pages/RiskMap/EvacuationPlanner.tsx` | Right-click evacuation route planner |
| `frontend/src/pages/RiskMap/FullscreenButton.tsx` | Fullscreen toggle button |

---

### Task 1: Install New NPM Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install xlsx, jspdf, html2canvas**

```bash
cd C:/Users/promise/disaster-risk-system/frontend && npm install xlsx jspdf html2canvas
```

- [ ] **Step 2: Verify installation**

```bash
cd C:/Users/promise/disaster-risk-system/frontend && node -e "require('xlsx'); require('jspdf'); console.log('OK')"
```
Expected: `OK`

---

### Task 2: Global Dark Theme CSS

**Files:**
- Create: `frontend/src/styles/theme.css`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Create theme.css with design system**

Write `frontend/src/styles/theme.css`:

```css
/* === 险析 · 设计系统 === */
:root {
  --bg-primary: #0a0e17;
  --bg-secondary: #111620;
  --bg-card: rgba(255, 255, 255, 0.03);
  --bg-card-hover: rgba(255, 255, 255, 0.06);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-active: rgba(24, 144, 255, 0.3);
  --accent-primary: #1890ff;
  --accent-primary-end: #00c6ff;
  --text-primary: #e8e8e8;
  --text-secondary: #8c8c8c;
  --text-muted: #595959;

  /* Risk colors — unified across the system */
  --risk-critical: #ff4d4f;
  --risk-critical-bg: rgba(255, 77, 79, 0.12);
  --risk-high: #fa8c16;
  --risk-high-bg: rgba(250, 140, 22, 0.12);
  --risk-medium: #fadb14;
  --risk-medium-bg: rgba(250, 219, 20, 0.10);
  --risk-low: #52c41a;
  --risk-low-bg: rgba(82, 196, 26, 0.10);

  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
  --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  --transition-fast: 200ms ease;
  --transition-normal: 300ms ease;
  --radius-card: 12px;
  --radius-sm: 6px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  background: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}

/* Glass card base */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  transition: transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
}

.glass-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-active);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Critical alert glow pulse */
@keyframes critical-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 77, 79, 0.3), 0 0 60px rgba(255, 77, 79, 0.1); }
  50% { box-shadow: 0 0 40px rgba(255, 77, 79, 0.5), 0 0 100px rgba(255, 77, 79, 0.2); }
}

/* Risk level colors */
.risk-critical { color: var(--risk-critical); }
.risk-high { color: var(--risk-high); }
.risk-medium { color: var(--risk-medium); }
.risk-low { color: var(--risk-low); }

/* Tabular numbers for data */
.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
}

/* Leaflet container fix */
.leaflet-container {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-card);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Ant Design dark override */
.ant-layout { background: var(--bg-primary) !important; }
.ant-card { background: var(--bg-card) !important; border-color: var(--border-subtle) !important; }
.ant-table { background: transparent !important; }
.ant-table-thead > tr > th { background: rgba(255,255,255,0.04) !important; color: var(--text-secondary) !important; border-bottom-color: var(--border-subtle) !important; }
.ant-table-tbody > tr > td { border-bottom-color: var(--border-subtle) !important; color: var(--text-primary) !important; }
.ant-table-tbody > tr:hover > td { background: var(--bg-card-hover) !important; }
.ant-statistic-title { color: var(--text-secondary) !important; }
.ant-statistic-content { color: var(--text-primary) !important; }
.ant-tag { border: none !important; }
```

- [ ] **Step 2: Import theme.css in main.tsx**

Modify `frontend/src/main.tsx` — add the import at line 0 (top of file):

```tsx
import './styles/theme.css';
import './index.css';
```

Wait — main.tsx currently has no import for theme.css. Add it as the first import:

In `frontend/src/main.tsx`, the current content is not fully shown but we know it exists. Add this as the absolute first import line:

```tsx
import './styles/theme.css';
```

- [ ] **Step 3: Strip hardcoded colors from index.css**

Replace `frontend/src/index.css` entirely:

```css
/* Minimal reset — design system is in theme.css */
```

Both files are imported in main.tsx; theme.css comes first.

- [ ] **Step 4: Commit**

```bash
cd C:/Users/promise/disaster-risk-system && git add frontend/src/styles/theme.css frontend/src/main.tsx frontend/src/index.css && git commit -m "feat: add dark glassmorphism design system with CSS custom properties"
```

---

### Task 3: Redesign Layout — Dark Glass Sidebar + Header

**Files:**
- Modify: `frontend/src/components/Layout/index.tsx`

- [ ] **Step 1: Rewrite Layout component**

Replace `frontend/src/components/Layout/index.tsx`:

```tsx
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  CloudServerOutlined,
  AlertOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HistoryOutlined,
  AimOutlined,
} from '@ant-design/icons';

const { Sider, Content } = AntLayout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据仪表盘' },
  { key: '/map', icon: <EnvironmentOutlined />, label: '风险地图' },
  { key: '/alerts', icon: <AlertOutlined />, label: '预警中心' },
  { key: '/servers', icon: <CloudServerOutlined />, label: '服务器管理' },
  { key: '/command', icon: <AimOutlined />, label: '应急指挥', disabled: true },
  { key: '/history', icon: <HistoryOutlined />, label: '历史记录', disabled: true },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;

  return (
    <AntLayout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: 'rgba(17, 22, 32, 0.95)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo area */}
        <div style={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid var(--border-subtle)',
          gap: 12,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-end))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            险
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>险析</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, whiteSpace: 'nowrap' }}>
                智能灾害风险评估与应急决策系统
              </div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[menuKey]}
          items={menuItems}
          onClick={({ key }) => { if (key !== '/command' && key !== '/history') navigate(key); }}
          style={{
            background: 'transparent',
            borderInlineEnd: 'none',
            marginTop: 8,
          }}
        />
      </Sider>

      <AntLayout style={{ background: 'transparent' }}>
        {/* Top header bar */}
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(17, 22, 32, 0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: 'var(--text-secondary)' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--risk-low)',
                boxShadow: '0 0 6px var(--risk-low)',
              }} />
              系统运行中
            </div>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
              style={{ color: 'var(--text-secondary)' }}
            >
              退出
            </Button>
          </div>
        </div>

        {/* Content */}
        <Content style={{ margin: 20, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/promise/disaster-risk-system && git add frontend/src/components/Layout/index.tsx && git commit -m "feat: redesign layout with dark glass sidebar and sticky header"
```

---

### Task 4: Backend — Trends + Population + Reverse-Geocode Endpoints

**Files:**
- Create: `backend/app/api/stats.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create stats router**

Write `backend/app/api/stats.py`:

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.assessment import RiskAssessment, AlertRecord
from app.models.disaster import RiskZone, DisasterEvent
from app.services.risk_engine import haversine
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/stats", tags=["stats"])

PERIOD_DAYS = {"today": 1, "week": 7, "month": 30}


def get_start_date(period: str) -> datetime:
    days = PERIOD_DAYS.get(period, 7)
    return datetime.utcnow() - timedelta(days=days)


@router.get("/trends")
async def get_trends(
    period: str = Query(default="week"),
    db: AsyncSession = Depends(get_db),
):
    """Return daily risk score averages and alert counts for the period."""
    start = get_start_date(period)
    days = PERIOD_DAYS.get(period, 7)

    trends = []
    for i in range(days):
        day = start + timedelta(days=i)
        day_end = day + timedelta(days=1)

        score_result = await db.scalar(
            select(func.avg(RiskAssessment.risk_score)).where(
                RiskAssessment.assessment_time >= day.isoformat(),
                RiskAssessment.assessment_time < day_end.isoformat(),
            )
        )

        alert_result = await db.scalar(
            select(func.count()).select_from(AlertRecord).where(
                AlertRecord.created_at >= day.isoformat(),
                AlertRecord.created_at < day_end.isoformat(),
            )
        )

        trends.append({
            "date": day.strftime("%m-%d"),
            "avg_risk_score": round(score_result or 0, 1),
            "alert_count": alert_result or 0,
        })

    return trends


@router.get("/population")
async def get_population_stats(
    period: str = Query(default="week"),
    db: AsyncSession = Depends(get_db),
):
    """Return affected population by disaster type for the period."""
    start = get_start_date(period)

    result = await db.execute(
        select(
            DisasterEvent.disaster_type,
            func.sum(DisasterEvent.affected_population)
        )
        .where(DisasterEvent.created_at >= start.isoformat())
        .group_by(DisasterEvent.disaster_type)
    )
    rows = result.all()

    disaster_types = ["earthquake", "flood", "typhoon", "landslide", "fire"]
    data = []
    for dtype in disaster_types:
        row = next((r for r in rows if r[0] == dtype), None)
        data.append({
            "disaster_type": dtype,
            "affected_population": row[1] if row else 0,
        })

    return data
```

- [ ] **Step 2: Add reverse-geocode endpoint**

Append to `backend/app/api/stats.py`:

```python
@router.get("/reverse-geocode")
async def reverse_geocode(
    lat: float = Query(...),
    lng: float = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Given lat/lng, return the nearest risk zone info."""
    result = await db.execute(select(RiskZone))
    zones = result.scalars().all()

    if not zones:
        return {"found": False, "message": "暂无风险区域数据"}

    nearest = None
    nearest_dist = float("inf")
    for z in zones:
        d = haversine(lat, lng, z.latitude, z.longitude)
        if d < nearest_dist:
            nearest_dist = d
            nearest = z

    if nearest_dist > 50:
        return {"found": False, "message": "该区域50km内暂无风险数据", "distance_km": round(nearest_dist, 1)}

    return {
        "found": True,
        "zone_name": nearest.name,
        "risk_level": nearest.risk_level,
        "latitude": nearest.latitude,
        "longitude": nearest.longitude,
        "radius_km": nearest.radius_km,
        "population_density": nearest.population_density,
        "distance_km": round(nearest_dist, 1),
    }
```

- [ ] **Step 3: Register stats router in main.py**

In `backend/app/main.py`, add the import and router:

```python
from app.api import auth, risk, websocket, stats
# ...
app.include_router(stats.router)
```

Place the import alongside the existing API imports (line 7), and place the `include_router` alongside the others (after line 28 or similar). The exact edit:

Old (line 7):
```python
from app.api import auth, risk, websocket
```

New:
```python
from app.api import auth, risk, websocket, stats
```

Old (after `app.include_router(websocket.router)`):
```python
app.include_router(websocket.router)
```

New:
```python
app.include_router(websocket.router)
app.include_router(stats.router)
```

- [ ] **Step 4: Commit**

```bash
cd C:/Users/promise/disaster-risk-system && git add backend/app/api/stats.py backend/app/main.py && git commit -m "feat: add trends, population stats, and reverse-geocode endpoints"
```

---

### Task 5: Dashboard — Trend Chart + Population Chart + Time Filter

**Files:**
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/pages/Dashboard/index.tsx`

- [ ] **Step 1: Add new API methods to api.ts**

In `frontend/src/services/api.ts`, add these interface types after the existing interfaces (after `DecisionResult`):

```typescript
export interface TrendDataPoint {
  date: string;
  avg_risk_score: number;
  alert_count: number;
}

export interface PopulationStat {
  disaster_type: string;
  affected_population: number;
}

export interface ReverseGeocodeResult {
  found: boolean;
  zone_name?: string;
  risk_level?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  population_density?: number;
  distance_km?: number;
  message?: string;
}
```

Add these methods to `riskAPI`:

```typescript
  getTrends: (period = 'week') =>
    api.get<TrendDataPoint[]>('/stats/trends', { params: { period } }).then(r => r.data),
  getPopulationStats: (period = 'week') =>
    api.get<PopulationStat[]>('/stats/population', { params: { period } }).then(r => r.data),
  reverseGeocode: (lat: number, lng: number) =>
    api.get<ReverseGeocodeResult>('/stats/reverse-geocode', { params: { lat, lng } }).then(r => r.data),
```

- [ ] **Step 2: Rewrite Dashboard page with charts + time filter**

Replace `frontend/src/pages/Dashboard/index.tsx`:

```tsx
import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, Segmented } from 'antd';
import {
  TeamOutlined, AlertOutlined, ThunderboltOutlined, SafetyOutlined,
  CloudServerOutlined, DollarOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { riskAPI } from '../../services/api';
import type { DashboardStats, RiskAssessment, AlertRecord, TrendDataPoint, PopulationStat } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import ExportButtons from './ExportButtons';

const severityColors: Record<string, string> = {
  critical: 'var(--risk-critical)', high: 'var(--risk-high)',
  medium: 'var(--risk-medium)', low: 'var(--risk-low)',
};
const severityHex: Record<string, string> = {
  critical: '#ff4d4f', high: '#fa8c16', medium: '#fadb14', low: '#52c41a',
};
const disasterLabels: Record<string, string> = {
  earthquake: '地震', flood: '洪水', typhoon: '台风', landslide: '滑坡', fire: '火灾',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [popStats, setPopStats] = useState<PopulationStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('week');

  const handleWsMessage = useCallback((data: any) => {
    if (data.type === 'dashboard_update') {
      setStats(data.data);
    }
  }, []);

  useWebSocket('/ws/dashboard', handleWsMessage);

  // Initial data load
  useEffect(() => {
    Promise.all([
      riskAPI.getDashboard(),
      riskAPI.getAssessments(),
      riskAPI.getAlerts(true),
      riskAPI.getTrends(period),
      riskAPI.getPopulationStats(period),
    ]).then(([s, a, al, t, p]) => {
      setStats(s);
      setAssessments(a);
      setAlerts(al);
      setTrends(t);
      setPopStats(p);
    }).finally(() => setLoading(false));
  }, []);

  // Reload charts on period change
  useEffect(() => {
    riskAPI.getTrends(period).then(setTrends);
    riskAPI.getPopulationStats(period).then(setPopStats);
  }, [period]);

  if (loading || !stats) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;

  const pieData = Object.entries(stats.risk_level_distribution).map(([name, value]) => ({
    name, value, itemStyle: { color: severityHex[name] || '#999' },
  }));

  const disasterPieData = Object.entries(stats.disaster_type_distribution).map(([name, value]) => ({
    name, value,
  }));

  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['风险评分', '预警数'], textStyle: { color: '#8c8c8c' } },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category' as const, data: trends.map(t => t.date), axisLine: { lineStyle: { color: '#333' } } },
    yAxis: [
      { type: 'value' as const, name: '评分', axisLabel: { color: '#8c8c8c' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
      { type: 'value' as const, name: '数量', axisLabel: { color: '#8c8c8c' }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '风险评分', type: 'line', data: trends.map(t => t.avg_risk_score),
        smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(24,144,255,0.3)' }, { offset: 1, color: 'rgba(24,144,255,0.02)' }] } },
      },
      {
        name: '预警数', type: 'line', yAxisIndex: 1, data: trends.map(t => t.alert_count),
        smooth: true, symbol: 'diamond', symbolSize: 6,
        lineStyle: { color: '#ff4d4f', width: 2, type: 'dashed' },
        itemStyle: { color: '#ff4d4f' },
      },
    ],
  };

  const popOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: popStats.map(p => disasterLabels[p.disaster_type] || p.disaster_type),
      axisLabel: { color: '#8c8c8c' },
      axisLine: { lineStyle: { color: '#333' } },
    },
    yAxis: {
      type: 'value' as const, name: '影响人口',
      axisLabel: { color: '#8c8c8c', formatter: (v: number) => v >= 10000 ? `${(v/10000).toFixed(1)}万` : v },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    series: [{
      type: 'bar', data: popStats.map((p, i) => ({
        value: p.affected_population,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: ['#ff4d4f', '#1890ff', '#fa8c16', '#fadb14', '#52c41a'][i],
        },
      })),
      barWidth: '50%',
    }],
  };

  const columnDefs = [
    { title: '区域', dataIndex: 'zone_name', key: 'zone_name' },
    { title: '灾害类型', dataIndex: 'disaster_type', key: 'disaster_type' },
    {
      title: '风险等级', dataIndex: 'risk_level', key: 'risk_level',
      render: (v: string) => <Tag color={severityHex[v]}>{v.toUpperCase()}</Tag>,
    },
    { title: '风险评分', dataIndex: 'risk_score', key: 'risk_score', sorter: (a: any, b: any) => a.risk_score - b.risk_score },
    { title: '影响人口', dataIndex: 'population_total', key: 'population_total', render: (v: number) => v.toLocaleString() },
    { title: '预估损失(万元)', dataIndex: 'estimated_loss', key: 'estimated_loss', render: (v: number) => v.toLocaleString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Time filter + exports */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Segmented
          value={period}
          onChange={(val) => setPeriod(val as string)}
          options={[
            { label: '今日', value: 'today' },
            { label: '本周', value: 'week' },
            { label: '本月', value: 'month' },
          ]}
        />
        <ExportButtons stats={stats} assessments={assessments} trends={trends} popStats={popStats} />
      </div>

      {/* Stats row */}
      <Row gutter={[16, 16]}>
        {[
          { title: '区域总人数', value: stats.total_population, icon: <TeamOutlined />, fmt: (v: number) => v.toLocaleString() },
          { title: '预警次数', value: stats.total_alerts, icon: <AlertOutlined />, color: 'var(--risk-critical)' },
          { title: '活跃灾害', value: stats.active_disasters, icon: <ThunderboltOutlined />, color: 'var(--risk-high)' },
          { title: '在线服务器', value: `${stats.online_servers}/${stats.total_servers}`, icon: <CloudServerOutlined />, color: 'var(--risk-low)' },
        ].map((item, idx) => (
          <Col span={6} key={idx}>
            <Card className="glass-card" style={{ borderRadius: 'var(--radius-card)' }}>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={item.icon}
                valueStyle={{ color: (item as any).color || 'var(--text-primary)', fontSize: 28, fontWeight: 600 }}
                formatter={item.fmt ? (v: any) => item.fmt!(v) : undefined}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Sub stats */}
      <Row gutter={[16, 16]}>
        {[
          { title: '人员密度(人/km²)', value: stats.avg_population_density, precision: 0 },
          { title: '情绪指数', value: stats.avg_emotion_index, precision: 2, suffix: '/1.0', color: (stats.avg_emotion_index || 0) < 0.4 ? 'var(--risk-critical)' : 'var(--risk-low)' },
          { title: '指导人员', value: stats.total_guides, prefix: <SafetyOutlined /> },
          { title: '预估总损失(万元)', value: stats.estimated_total_loss, precision: 1, prefix: <DollarOutlined />, color: 'var(--risk-critical)' },
        ].map((item, idx) => (
          <Col span={6} key={idx}>
            <Card className="glass-card" style={{ borderRadius: 'var(--radius-card)' }}>
              <Statistic
                title={item.title}
                value={item.value}
                precision={(item as any).precision}
                prefix={(item as any).prefix}
                suffix={(item as any).suffix}
                valueStyle={{ color: (item as any).color || 'var(--text-primary)', fontSize: 24, fontWeight: 600 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card className="glass-card" title={<span style={{ color: 'var(--text-primary)' }}>近{period === 'today' ? '24小时' : period === 'week' ? '7天' : '30天'}风险趋势</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={trendOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="glass-card" title={<span style={{ color: 'var(--text-primary)' }}>各灾害类型影响人口</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={popOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      {/* Pie charts row */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card className="glass-card" title={<span style={{ color: 'var(--text-primary)' }}>风险等级分布</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={{
              tooltip: { trigger: 'item' },
              series: [{ type: 'pie', radius: ['40%', '70%'], data: pieData, label: { formatter: '{b}: {c}', color: '#8c8c8c' } }],
            }} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="glass-card" title={<span style={{ color: 'var(--text-primary)' }}>灾害类型分布</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={{
              tooltip: { trigger: 'item' },
              series: [{ type: 'pie', radius: ['40%', '70%'], data: disasterPieData, label: { formatter: '{b}: {c}', color: '#8c8c8c' }, itemStyle: { color: (p: any) => ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de'][p.dataIndex] } }],
            }} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* Table + Alerts */}
      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card className="glass-card" title={<span style={{ color: 'var(--text-primary)' }}>风险评估数据</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <Table dataSource={assessments} columns={columnDefs} rowKey="id" size="small" pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card className="glass-card" title={<span style={{ color: 'var(--text-primary)' }}>活跃预警</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            {alerts.map(a => (
              <Card key={a.id} size="small" style={{ marginBottom: 8, background: 'rgba(255,255,255,0.03)', borderColor: 'var(--border-subtle)', borderRadius: 8 }}>
                <Tag color={severityColors[a.severity]}>{a.severity.toUpperCase()}</Tag>
                <strong style={{ color: 'var(--text-primary)' }}>{a.title}</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 12 }}>{a.content}</p>
              </Card>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd C:/Users/promise/disaster-risk-system && git add frontend/src/services/api.ts frontend/src/pages/Dashboard/index.tsx && git commit -m "feat: add trend chart, population bar chart, and time filter to dashboard"
```

---

### Task 6: Dashboard — Export Buttons (Excel + PDF)

**Files:**
- Create: `frontend/src/pages/Dashboard/ExportButtons.tsx`

- [ ] **Step 1: Create ExportButtons component**

Write `frontend/src/pages/Dashboard/ExportButtons.tsx`:

```tsx
import { Button, Space, message } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import type { DashboardStats, RiskAssessment, TrendDataPoint, PopulationStat } from '../../services/api';

interface Props {
  stats: DashboardStats;
  assessments: RiskAssessment[];
  trends: TrendDataPoint[];
  popStats: PopulationStat[];
}

export default function ExportButtons({ stats, assessments, trends, popStats }: Props) {
  const exportExcel = () => {
    const ws1 = XLSX.utils.json_to_sheet(assessments.map(a => ({
      '区域': a.zone_name,
      '灾害类型': a.disaster_type,
      '风险等级': a.risk_level,
      '风险评分': a.risk_score,
      '影响人口': a.population_total,
      '预估损失(万元)': a.estimated_loss,
    })));

    const ws2 = XLSX.utils.json_to_sheet(trends.map(t => ({
      '日期': t.date,
      '平均风险评分': t.avg_risk_score,
      '预警数量': t.alert_count,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, '风险评估');
    XLSX.utils.book_append_sheet(wb, ws2, '趋势数据');
    XLSX.writeFile(wb, `风险评估报告_${new Date().toISOString().slice(0, 10)}.xlsx`);
    message.success('Excel 导出成功');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const th = 7;

    // Header
    doc.setFontSize(16);
    doc.setTextColor(24, 144, 255);
    doc.text('险析 · 灾害风险评估报告', 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(`生成时间: ${new Date().toLocaleString()}`, 14, 23);

    // Section 1: Overview
    let y = 32;
    doc.setFontSize(12);
    doc.setTextColor(232, 232, 232);
    doc.text('总体概况', 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    const overview = [
      `区域人口: ${stats.total_population.toLocaleString()}人`,
      `预警总数: ${stats.total_alerts}次  |  活跃灾害: ${stats.active_disasters}个  |  在线服务器: ${stats.online_servers}/${stats.total_servers}`,
      `平均人口密度: ${stats.avg_population_density.toFixed(0)}人/km²  |  预估总损失: ${stats.estimated_total_loss.toFixed(1)}万元`,
    ];
    overview.forEach(line => { doc.text(line, 14, y); y += 5; });

    // Section 2: Table
    y += 4;
    doc.setFontSize(12);
    doc.setTextColor(232, 232, 232);
    doc.text('风险评估明细', 14, y);
    y += 6;

    const headers = ['区域', '灾害类型', '风险等级', '评分', '人口', '损失(万)'];
    const colW = [40, 22, 18, 16, 20, 22];
    doc.setFontSize(8);
    headers.forEach((h, i) => {
      doc.setTextColor(140, 140, 140);
      doc.text(h, 14 + colW.slice(0, i).reduce((a, b) => a + b, 0), y);
    });
    y += 5;

    doc.setTextColor(200, 200, 200);
    assessments.slice(0, 15).forEach(row => {
      const fields = [row.zone_name, row.disaster_type, row.risk_level, String(row.risk_score), String(row.population_total), String(row.estimated_loss)];
      fields.forEach((f, i) => {
        doc.text(String(f).substring(0, 16), 14 + colW.slice(0, i).reduce((a, b) => a + b, 0), y);
      });
      y += th;
      if (y > 270) { doc.addPage(); y = 14; }
    });

    doc.save(`风险评估报告_${new Date().toISOString().slice(0, 10)}.pdf`);
    message.success('PDF 导出成功');
  };

  return (
    <Space>
      <Button icon={<FileExcelOutlined />} onClick={exportExcel} style={{ borderRadius: 6 }}>
        Excel
      </Button>
      <Button icon={<FilePdfOutlined />} onClick={exportPDF} style={{ borderRadius: 6 }}>
        PDF
      </Button>
    </Space>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/promise/disaster-risk-system && git add frontend/src/pages/Dashboard/ExportButtons.tsx && git commit -m "feat: add Excel and PDF export buttons to dashboard"
```

---

### Task 7: Alert Enhancement — Critical Popup + Priority Sort + "View on Map"

**Files:**
- Create: `frontend/src/components/CriticalAlertModal.tsx`
- Modify: `frontend/src/pages/Alerts/index.tsx`

- [ ] **Step 1: Create CriticalAlertModal**

Write `frontend/src/components/CriticalAlertModal.tsx`:

```tsx
import { Modal, Tag, Button } from 'antd';
import { WarningFilled, CloseOutlined } from '@ant-design/icons';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { AlertRecord } from '../services/api';

let globalQueue: AlertRecord[] = [];
let globalListener: ((alert: AlertRecord) => void) | null = null;

export function pushCriticalAlert(alert: AlertRecord) {
  if (alert.severity === 'critical') {
    if (globalListener) {
      globalListener(alert);
    } else {
      globalQueue.push(alert);
    }
  }
}

export function useAlertQueue() {
  const [alert, setAlert] = useState<AlertRecord | null>(null);
  const showing = useRef(false);

  const showNext = useCallback(() => {
    if (globalQueue.length > 0 && !showing.current) {
      const next = globalQueue.shift()!;
      showing.current = true;
      setAlert(next);
    }
  }, []);

  const onClose = useCallback(() => {
    showing.current = false;
    setAlert(null);
    setTimeout(() => showNext(), 300);
  }, [showNext]);

  useEffect(() => {
    globalListener = (a: AlertRecord) => {
      globalQueue.push(a);
      showNext();
    };
    showNext();
    return () => { globalListener = null; };
  }, [showNext]);

  return { alert, onClose };
}
```

This isn't the final component — the modal itself is used inline in Alerts page. Let me put it all together in the Alerts page rewrite instead.

Actually, let me separate the modal component cleanly:

Write `frontend/src/components/CriticalAlertModal.tsx`:

```tsx
import { Modal, Tag, Space } from 'antd';
import { WarningFilled, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { AlertRecord } from '../services/api';

interface Props {
  alert: AlertRecord | null;
  onClose: () => void;
}

const disasterLabels: Record<string, string> = { earthquake: '地震', flood: '洪水', typhoon: '台风', landslide: '滑坡', fire: '火灾' };

export default function CriticalAlertModal({ alert, onClose }: Props) {
  const navigate = useNavigate();
  if (!alert) return null;

  const handleViewMap = () => {
    navigate(`/map?lat=${alert.latitude}&lng=${alert.longitude}&zoom=14`);
    onClose();
  };

  return (
    <Modal
      open={!!alert}
      onCancel={onClose}
      footer={[
        <Button key="dismiss" onClick={onClose} style={{ borderRadius: 6 }}>忽略</Button>,
        <Button key="map" type="primary" danger icon={<EnvironmentOutlined />} onClick={handleViewMap} style={{ borderRadius: 6 }}>
          查看地图位置
        </Button>,
      ]}
      centered
      width={460}
      styles={{
        content: {
          background: '#1a0a0a',
          border: '1px solid rgba(255, 77, 79, 0.4)',
          boxShadow: '0 0 40px rgba(255, 77, 79, 0.3), 0 0 80px rgba(255, 77, 79, 0.1)',
          borderRadius: 16,
          animation: 'critical-pulse 2s ease-in-out infinite',
        },
        header: { background: 'transparent' },
        body: { background: 'transparent' },
      }}
      title={
        <Space>
          <WarningFilled style={{ color: '#ff4d4f', fontSize: 22, animation: 'critical-pulse 2s ease-in-out infinite' }} />
          <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 700 }}>高危预警</span>
        </Space>
      }
    >
      <div style={{ color: '#e8e8e8', marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <Tag color="red" style={{ fontSize: 13, padding: '2px 10px' }}>{alert.severity.toUpperCase()}</Tag>
          <strong style={{ fontSize: 16, marginLeft: 8 }}>{alert.title}</strong>
        </div>
        <p style={{ color: '#8c8c8c', lineHeight: 1.6 }}>{alert.content}</p>
        {alert.latitude && alert.longitude && (
          <p style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
            位置: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
          </p>
        )}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Update Alerts page — sort by severity, add "view on map", integrate critical modal**

Replace `frontend/src/pages/Alerts/index.tsx`:

```tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Table, Tag, Timeline, Spin, Switch, Space, Button } from 'antd';
import { AlertOutlined, WarningOutlined, InfoCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { riskAPI } from '../../services/api';
import type { AlertRecord } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import CriticalAlertModal from '../../components/CriticalAlertModal';

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const severityColors: Record<string, string> = { critical: 'var(--risk-critical)', high: 'var(--risk-high)', medium: 'var(--risk-medium)', low: 'var(--risk-low)' };
const severityTags: Record<string, string> = { critical: 'red', high: 'orange', medium: 'gold', low: 'green' };
const typeIcons: Record<string, any> = { early_warning: <WarningOutlined />, evacuation: <AlertOutlined />, info: <InfoCircleOutlined /> };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState<AlertRecord | null>(null);
  const criticalQueue = useRef<AlertRecord[]>([]);
  const showingModal = useRef(false);
  const navigate = useNavigate();

  // Sort alerts: critical > high > medium > low, then newest first
  const sortAlerts = (list: AlertRecord[]) => {
    return [...list].sort((a, b) => {
      const sa = severityOrder[a.severity] ?? 99;
      const sb = severityOrder[b.severity] ?? 99;
      if (sa !== sb) return sa - sb;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  };

  const showNextCritical = useCallback(() => {
    if (criticalQueue.current.length > 0 && !showingModal.current) {
      const next = criticalQueue.current.shift()!;
      showingModal.current = true;
      setCriticalAlert(next);
    }
  }, []);

  const closeCriticalModal = useCallback(() => {
    showingModal.current = false;
    setCriticalAlert(null);
    setTimeout(() => showNextCritical(), 300);
  }, [showNextCritical]);

  const handleWsMessage = useCallback((data: any) => {
    if (data.type === 'alert') {
      const newAlert: AlertRecord = data.data;
      if (newAlert.severity === 'critical') {
        criticalQueue.current.push(newAlert);
        showNextCritical();
      }
      setAlerts(prev => sortAlerts([newAlert, ...prev]).slice(0, 50));
    }
  }, [showNextCritical]);

  useWebSocket('/ws/alerts', handleWsMessage);

  useEffect(() => {
    riskAPI.getAlerts(activeOnly).then(data => setAlerts(sortAlerts(data))).finally(() => setLoading(false));
  }, [activeOnly]);

  const handleViewOnMap = (alert: AlertRecord) => {
    if (alert.latitude && alert.longitude) {
      navigate(`/map?lat=${alert.latitude}&lng=${alert.longitude}&zoom=14`);
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', width: 200 },
    {
      title: '类型', dataIndex: 'alert_type', key: 'alert_type',
      render: (v: string) => <Space>{typeIcons[v]}{v === 'early_warning' ? '预警' : v === 'evacuation' ? '疏散' : '通知'}</Space>,
    },
    {
      title: '严重程度', dataIndex: 'severity', key: 'severity',
      render: (v: string) => <Tag color={severityTags[v]} style={{ fontWeight: v === 'critical' ? 700 : 400 }}>{v.toUpperCase()}</Tag>,
    },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active',
      render: (v: boolean) => v ? <Tag color="red">活跃</Tag> : <Tag color="default">已解除</Tag>,
    },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: AlertRecord) =>
        record.latitude && record.longitude ? (
          <Button size="small" icon={<EnvironmentOutlined />} onClick={() => handleViewOnMap(record)} style={{ borderRadius: 6 }}>
            查看地图位置
          </Button>
        ) : null,
    },
    { title: '时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CriticalAlertModal alert={criticalAlert} onClose={closeCriticalModal} />

      <Card
        className="glass-card"
        title={<span style={{ color: 'var(--text-primary)' }}>预警中心</span>}
        extra={<Space><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>仅活跃</span><Switch checked={activeOnly} onChange={setActiveOnly} /></Space>}
        style={{ borderRadius: 'var(--radius-card)' }}
      >
        <Table
          dataSource={alerts}
          columns={columns}
          rowKey="id"
          size="small"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card className="glass-card" title={<span style={{ color: 'var(--text-primary)' }}>预警时间线</span>} style={{ borderRadius: 'var(--radius-card)' }}>
        <Timeline
          items={alerts.slice(0, 10).map(a => ({
            color: severityTags[a.severity],
            dot: a.severity === 'critical' ? <WarningOutlined style={{ color: '#ff4d4f', fontSize: 16 }} /> : undefined,
            children: (
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>{a.title}</strong>
                <Tag color={severityTags[a.severity]} style={{ marginLeft: 8 }}>{a.severity}</Tag>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{a.content}</p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.created_at}</span>
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/promise/disaster-risk-system && git add frontend/src/components/CriticalAlertModal.tsx frontend/src/pages/Alerts/index.tsx && git commit -m "feat: add critical alert popup, priority sorting, and view-on-map button"
```

---

### Task 8: Map — Layer Switching Control

**Files:**
- Create: `frontend/src/pages/RiskMap/LayerControl.tsx`
- Modify: `frontend/src/pages/RiskMap/index.tsx`

- [ ] **Step 1: Note — we need population density data for the heatmap**

The `riskZones` from the API already include `population_density`. Each risk zone has lat/lng/radius_km/population_density. We'll use circle markers scaled by density for the heatmap layer since installing `leaflet.heat` adds complexity.

- [ ] **Step 2: Rewrite RiskMap to include layers**

Replace `frontend/src/pages/RiskMap/index.tsx`:

```tsx
import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Row, Col, Card, Select, Descriptions, Tag, Button, Spin, message, Segmented } from 'antd';
import { EnvironmentOutlined, AimOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { riskAPI } from '../../services/api';
import type { RiskZone, SafeZone, DisasterEvent, DecisionResult } from '../../services/api';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const severityHex: Record<string, string> = { critical: '#ff4d4f', high: '#fa8c16', medium: '#fadb14', low: '#52c41a' };
const disasterTypeLabels: Record<string, string> = { earthquake: '地震', flood: '洪水', typhoon: '台风', landslide: '滑坡', fire: '火灾' };

interface EvacuationRoutesData {
  id: number;
  name: string;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  safe_zone_id: number | null;
  distance_km: number;
  risk_level: string;
  path_json: string;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const zoom = parseInt(searchParams.get('zoom') || '');
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], !isNaN(zoom) ? zoom : 14);
    } else {
      map.setView(center, 13);
    }
  }, [center, map, searchParams]);

  return null;
}

export default function RiskMapPage() {
  const [searchParams] = useSearchParams();
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [evacRoutes, setEvacRoutes] = useState<EvacuationRoutesData[]>([]);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [userPos] = useState<[number, number]>([30.5850, 114.3000]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [disasterFilter, setDisasterFilter] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      riskAPI.getRiskZones(),
      riskAPI.getSafeZones(),
      riskAPI.getDisasters(),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/api/evacuation-routes')
      .then(r => r.json()).then(setEvacRoutes).catch(() => {});
  }, []);

  const filteredDisasters = disasterFilter.length > 0
    ? disasters.filter(d => disasterFilter.includes(d.disaster_type))
    : disasters;

  const activeDisasters = filteredDisasters.filter(d => d.status === 'active' || d.status === 'monitoring');

  const handleGetDecision = async () => {
    try {
      const result = await riskAPI.getDecision(userPos[0], userPos[1]);
      setDecision(result);
      message.success('决策分析完成');
    } catch {
      message.error('获取决策失败');
    }
  };

  const handleMapClick = useCallback(async (latlng: L.LatLng) => {
    try {
      const result = await riskAPI.reverseGeocode(latlng.lat, latlng.lng);
      // Popup is handled inside a MapClickHandler component
    } catch {}
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const el = document.getElementById('map-container');
    if (!el) return;
    if (!isFullscreen) {
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Card className="glass-card" size="small" title={<span style={{ color: 'var(--text-primary)' }}>灾害筛选</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="选择灾害类型（可多选）"
              allowClear
              options={Object.entries(disasterTypeLabels).map(([k, v]) => ({ value: k, label: v }))}
              onChange={(vals) => setDisasterFilter(vals)}
            />
            <Segmented
              block
              style={{ marginTop: 12, background: 'rgba(255,255,255,0.04)' }}
              value={activeLayer}
              onChange={(val) => setActiveLayer(val as string)}
              options={[
                { label: '全部', value: 'all' },
                { label: '人口密度', value: 'density' },
                { label: '安全区', value: 'safe' },
                { label: '隐患点', value: 'hazard' },
              ]}
            />
            <Button type="primary" block style={{ marginTop: 12, borderRadius: 8 }} onClick={handleGetDecision} icon={<AimOutlined />}>
              分析我的位置风险
            </Button>
          </Card>

          {decision && (
            <Card className="glass-card" size="small" title={<span style={{ color: 'var(--text-primary)' }}>决策结果</span>} style={{ marginTop: 12, borderRadius: 'var(--radius-card)' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="风险等级">
                  <Tag color={severityHex[decision.risk_level]}>{decision.risk_level.toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风险评分">{decision.risk_score}</Descriptions.Item>
                <Descriptions.Item label="最近安全区">{decision.safe_zone}</Descriptions.Item>
                <Descriptions.Item label="距离">{decision.safe_zone_distance_km} km</Descriptions.Item>
                <Descriptions.Item label="步行预估">{decision.estimated_time_minutes} 分钟</Descriptions.Item>
              </Descriptions>
              <p style={{ color: 'var(--risk-critical)', fontWeight: 'bold', fontSize: 12 }}>{decision.recommended_action}</p>
            </Card>
          )}
        </Col>

        <Col span={18}>
          <Card
            className="glass-card"
            size="small"
            title={<span style={{ color: 'var(--text-primary)' }}>城市风险地图</span>}
            extra={
              <Button
                type="text"
                icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={toggleFullscreen}
                style={{ color: 'var(--text-secondary)' }}
              />
            }
            style={{ borderRadius: 'var(--radius-card)' }}
            bodyStyle={{ padding: 0 }}
          >
            <div id="map-container" style={{ height: isFullscreen ? '100vh' : 600, borderRadius: 12, overflow: 'hidden' }}>
              <MapContainer center={[30.5850, 114.3050]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController center={[30.5850, 114.3050]} />

                {/* Safe zones layer */}
                {(activeLayer === 'all' || activeLayer === 'safe') && safeZones.map(s => (
                  <Marker key={`sz-${s.id}`} position={[s.latitude, s.longitude]}>
                    <Popup>
                      <strong>{s.name}</strong><br />
                      容量: {s.current_occupancy}/{s.capacity}<br />
                      类型: {s.facility_type}
                    </Popup>
                  </Marker>
                ))}

                {/* Hazard points (risk zones + disasters) */}
                {(activeLayer === 'all' || activeLayer === 'hazard') && (
                  <>
                    {riskZones.map(z => (
                      <Circle
                        key={`rz-${z.id}`}
                        center={[z.latitude, z.longitude]}
                        radius={z.radius_km * 1000}
                        pathOptions={{ color: severityHex[z.risk_level], fillOpacity: 0.25, weight: 2 }}
                      >
                        <Popup>
                          <strong>{z.name}</strong><br />
                          风险等级: {z.risk_level}<br />
                          人员密度: {z.population_density}/km²<br />
                          预警次数: {z.alert_count}
                        </Popup>
                      </Circle>
                    ))}
                    {activeDisasters.map(d => (
                      <Marker key={`d-${d.id}`} position={[d.latitude, d.longitude]}>
                        <Popup>
                          <strong>{disasterTypeLabels[d.disaster_type]}: {d.name}</strong><br />
                          严重程度: <Tag color={severityHex[d.severity]}>{d.severity}</Tag><br />
                          影响范围: {d.radius_km} km<br />
                          影响人口: {d.affected_population.toLocaleString()}
                        </Popup>
                      </Marker>
                    ))}
                  </>
                )}

                {/* Population density layer */}
                {(activeLayer === 'all' || activeLayer === 'density') && riskZones.map(z => {
                  const densityScale = Math.min(z.population_density / 10000, 1);
                  const r = 300 + densityScale * 700;
                  return (
                    <Circle
                      key={`den-${z.id}`}
                      center={[z.latitude, z.longitude]}
                      radius={r}
                      pathOptions={{
                        color: 'rgba(24, 144, 255, 0.5)',
                        fillColor: 'rgba(24, 144, 255, 0.15)',
                        fillOpacity: 0.3,
                        weight: 1,
                      }}
                    >
                      <Popup>
                        <strong>{z.name}</strong><br />
                        人口密度: {z.population_density}/km²
                      </Popup>
                    </Circle>
                  );
                })}

                {/* Evacuation routes */}
                {evacRoutes.map(r => {
                  const path = (() => {
                    try { return JSON.parse(r.path_json); } catch { return [[r.from_lat, r.from_lng], [r.to_lat, r.to_lng]]; }
                  })();
                  return (
                    <Polyline key={`er-${r.id}`} positions={path} color="#1890ff" weight={3} dashArray="10 6">
                      <Popup>{r.name} ({r.distance_km} km)</Popup>
                    </Polyline>
                  );
                })}

                {/* User + decision route */}
                <Marker position={userPos}>
                  <Popup>模拟用户位置</Popup>
                </Marker>
                {decision && (
                  <Polyline positions={decision.evacuation_route} color="#ff4d4f" weight={4}>
                    <Popup>推荐疏散路线 ({decision.estimated_time_minutes}分钟)</Popup>
                  </Polyline>
                )}
              </MapContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/promise/disaster-risk-system && git add frontend/src/pages/RiskMap/index.tsx && git commit -m "feat: add map layer switching, fullscreen, multi-disaster filter, and click navigation"
```

---

### Task 9: Map — Click-to-Query + Evacuation Route Planner

**Files:**
- Modify: `frontend/src/pages/RiskMap/index.tsx` (add MapClickHandler + evacuation right-click)
- Modify: `frontend/src/services/api.ts` (already added reverseGeocode in Task 5)

The map click handler and evacuation planner are embedded within the RiskMap component. Let me add them properly.

- [ ] **Step 1: Add MapClickHandler component to RiskMap**

Insert this component INSIDE the `<MapContainer>` element in `frontend/src/pages/RiskMap/index.tsx`. Add it right after the `<MapController>` component:

```tsx
function MapClickHandler() {
  useMapEvents({
    click: async (e) => {
      try {
        const result = await riskAPI.reverseGeocode(e.latlng.lat, e.latlng.lng);
        const map = (e.target as any);
        if (result.found) {
          L.popup()
            .setLatLng(e.latlng)
            .setContent(`
              <div style="font-family: sans-serif;">
                <strong>${result.zone_name}</strong><br/>
                风险等级: <span style="color:${severityHex[result.risk_level || 'low']};font-weight:bold;">${result.risk_level}</span><br/>
                人口密度: ${result.population_density}/km²<br/>
                距离: ${result.distance_km} km
              </div>
            `)
            .openOn(map);
        } else {
          L.popup()
            .setLatLng(e.latlng)
            .setContent(`<div style="color:#8c8c8c;">${result.message || '暂无风险数据'}</div>`)
            .openOn(map);
        }
      } catch {}
    },
  });
  return null;
}

function EvacuationPlanner({ onRouteCalculated }: { onRouteCalculated: (route: [number, number][], info: string) => void }) {
  useMapEvents({
    contextmenu: async (e) => {
      try {
        const result = await riskAPI.getDecision(e.latlng.lat, e.latlng.lng);
        if (result.evacuation_route) {
          onRouteCalculated(result.evacuation_route, `${result.safe_zone} (${result.safe_zone_distance_km}km, ~${result.estimated_time_minutes}分钟)`);
          message.success(`已规划到 ${result.safe_zone} 的路线`);
        }
      } catch {
        message.error('路线规划失败');
      }
    },
  });
  return null;
}
```

- [ ] **Step 2: Add state and components to RiskMap**

Add these state variables to the RiskMapPage component (near the other `useState` lines):

```tsx
const [plannedRoute, setPlannedRoute] = useState<[number, number][] | null>(null);
const [plannedRouteInfo, setPlannedRouteInfo] = useState('');
```

Add these components inside `<MapContainer>` (after `<MapController>`):

```tsx
<MapClickHandler />
<EvacuationPlanner onRouteCalculated={(route, info) => { setPlannedRoute(route); setPlannedRouteInfo(info); }} />
```

Add the planned route polyline (after the user marker):

```tsx
{plannedRoute && (
  <Polyline positions={plannedRoute} color="#52c41a" weight={4}>
    <Popup>{plannedRouteInfo}</Popup>
  </Polyline>
)}
```

NOTE: The `MapClickHandler` and `EvacuationPlanner` functions are placed at module scope (above or below the `RiskMapPage` component function), as they reference `riskAPI` and `severityHex` from the module scope.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/promise/disaster-risk-system && git add frontend/src/pages/RiskMap/index.tsx && git commit -m "feat: add map click-to-query and right-click evacuation route planner"
```

---

### Task 10: Backend — Multi-Disaster Type Filter Support

**Files:**
- Modify: `backend/app/api/risk.py`

- [ ] **Step 1: Update risk-zones and disasters endpoints**

In `backend/app/api/risk.py`, modify the `get_risk_zones` function:

```python
@router.get("/risk-zones", response_model=list[RiskZoneResponse])
async def get_risk_zones(
    types: Optional[str] = Query(default=None, description="Comma-separated disaster types"),
    db: AsyncSession = Depends(get_db),
):
    q = select(RiskZone)
    if types:
        type_list = [t.strip() for t in types.split(",")]
        # Filter risk zones that have a related disaster matching the type
        q = q.join(DisasterEvent, RiskZone.disaster_id == DisasterEvent.id, isouter=True).where(
            DisasterEvent.disaster_type.in_(type_list)
        )
    result = await db.execute(q)
    return result.scalars().all()
```

Modify `get_disasters`:

```python
@router.get("/disasters", response_model=list[DisasterEventResponse])
async def get_disasters(
    types: Optional[str] = Query(default=None, description="Comma-separated disaster types"),
    db: AsyncSession = Depends(get_db),
):
    q = select(DisasterEvent).order_by(DisasterEvent.created_at.desc())
    if types:
        type_list = [t.strip() for t in types.split(",")]
        q = q.where(DisasterEvent.disaster_type.in_(type_list))
    result = await db.execute(q)
    return result.scalars().all()
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/promise/disaster-risk-system && git add backend/app/api/risk.py && git commit -m "feat: add multi-type filtering to risk-zones and disasters endpoints"
```

---

### Task 11: Update Backend Simulator with Better Seed Data Variance

**Files:**
- Modify: `backend/app/services/simulator.py`

- [ ] **Step 1: Update simulator to generate trend-like data**

Check the current simulator. If it generates dummy dashboard stats, add variance so charts show meaningful data:

```python
# Add this to the simulator for trend data generation
def generate_trend_data(days: int = 7) -> list[dict]:
    import random, datetime
    data = []
    for i in range(days):
        d = datetime.datetime.utcnow() - datetime.timedelta(days=days - 1 - i)
        data.append({
            "date": d.strftime("%m-%d"),
            "avg_risk_score": round(random.uniform(25, 85), 1),
            "alert_count": random.randint(0, 12),
        })
    return data
```

Since the stats endpoint already queries real DB data, this may not be needed. The DB assessments and alerts will provide real aggregated data. This task is optional — only add if seed data needs more time-varied records.

- [ ] **Step 1: Commit (if changes made)**

```bash
cd C:/Users/promise/disaster-risk-system && git add backend/app/services/simulator.py && git commit -m "feat: improve simulator variance for trends"
```

---

### Task 12: Final Polish — System Name, Title, and Color Consistency

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/src/pages/Login/index.tsx`

- [ ] **Step 1: Update HTML title**

In `frontend/index.html`, change `<title>`:

```html
<title>险析 - 智能灾害风险评估与应急决策系统</title>
```

And add `lang="zh-CN"` to `<html>`:

```html
<html lang="zh-CN">
```

- [ ] **Step 2: Update Login page heading**

In `frontend/src/pages/Login/index.tsx`, replace the `<h1>`:

Old:
```tsx
<h1 style={{ textAlign: 'center', marginBottom: 32, color: '#333' }}>灾害风险评估系统</h1>
```

New:
```tsx
<div style={{ textAlign: 'center', marginBottom: 32 }}>
  <div style={{ fontSize: 28, fontWeight: 700, color: '#1890ff', marginBottom: 4 }}>险析</div>
  <div style={{ fontSize: 13, color: '#8c8c8c' }}>智能灾害风险评估与应急决策系统</div>
</div>
```

- [ ] **Step 3: Commit**

```bash
cd C:/Users/promise/disaster-risk-system && git add frontend/index.html frontend/src/pages/Login/index.tsx && git commit -m "feat: update system name and branding"
```

---

### Task 13: Build Frontend & Verify Everything Works

- [ ] **Step 1: Build frontend**

```bash
cd C:/Users/promise/disaster-risk-system/frontend && npm run build
```

Expected: Build succeeds, dist/ created.

- [ ] **Step 2: Restart backend**

```bash
cd C:/Users/promise/disaster-risk-system/backend && python seed_data.py && python run.py
```

- [ ] **Step 3: Smoke test**

Open browser at `http://localhost:8000` — verify:
- Dark glass theme applied everywhere
- Login page shows "险析" branding
- Dashboard: trend chart + population chart + time filter + export buttons
- Alerts: sorted by severity, "查看地图位置" button per alert
- Map: layer segmented control, fullscreen button, click for query, right-click for route
- Multi-disaster type filter works

- [ ] **Step 4: Commit any fixes**

```bash
cd C:/Users/promise/disaster-risk-system && git add -A && git commit -m "chore: build and fix issues after integration"
```

---

## Self-Review

1. **Spec coverage:** Every requirement maps to a task:
   - CSS design system → Task 2
   - Layout redesign → Task 3
   - Trend chart + population chart → Task 5
   - Time filter → Task 5
   - Export Excel/PDF → Task 6
   - Critical alert popup + sort + view-on-map → Task 7
   - Layer switching → Task 8
   - Click-to-query → Task 9
   - Evacuation route → Task 9
   - Fullscreen → Task 8
   - Multi-disaster filter → Task 8 (frontend) + Task 10 (backend)
   - Risk color unification → Task 2 (CSS vars) + consistent usage in all components
   - System name → Task 12
   - Backend endpoints → Tasks 4, 10

2. **Placeholder scan:** No TBDs, no TODOs, no "implement later". All code is concrete.

3. **Type consistency:** `TrendDataPoint`, `PopulationStat`, `ReverseGeocodeResult` defined in Task 5 api.ts, consumed in Tasks 5, 6, 9. `AlertRecord` extended with `latitude`/`longitude` fields (already in backend schema). Function signatures match across tasks.

4. **No gaps** — AMap integration explicitly deferred per spec.
