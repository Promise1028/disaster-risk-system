import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Row, Col, Card, Select, Descriptions, Tag, Button, Spin, message, Segmented } from 'antd';
import { AimOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { riskAPI } from '../../services/api';
import type { RiskZone, SafeZone, DisasterEvent, DecisionResult, ReverseGeocodeResult } from '../../services/api';

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

function MapClickHandler({ onQuery }: { onQuery: (result: ReverseGeocodeResult, latlng: L.LatLng) => void }) {
  useMapEvents({
    click: async (e) => {
      try {
        const result = await riskAPI.reverseGeocode(e.latlng.lat, e.latlng.lng);
        onQuery(result, e.latlng);
      } catch {}
    },
  });
  return null;
}

function EvacuationPlanner({ onRoute }: { onRoute: (route: [number, number][], info: string) => void }) {
  useMapEvents({
    contextmenu: async (e) => {
      try {
        const result = await riskAPI.getDecision(e.latlng.lat, e.latlng.lng);
        if (result.evacuation_route) {
          onRoute(result.evacuation_route, `${result.safe_zone} (${result.safe_zone_distance_km}km, ~${result.estimated_time_minutes}分钟)`);
          message.success(`已规划到 ${result.safe_zone} 的路线`);
        }
      } catch {
        message.error('路线规划失败');
      }
    },
  });
  return null;
}

export default function RiskMapPage() {
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [, setDisasters] = useState<DisasterEvent[]>([]);
  const [allDisasters, setAllDisasters] = useState<DisasterEvent[]>([]);
  const [evacRoutes, setEvacRoutes] = useState<EvacuationRoutesData[]>([]);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [userPos] = useState<[number, number]>([30.5850, 114.3000]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [disasterFilter, setDisasterFilter] = useState<string[]>([]);
  const [plannedRoute, setPlannedRoute] = useState<[number, number][] | null>(null);
  const [plannedRouteInfo, setPlannedRouteInfo] = useState('');

  useEffect(() => {
    Promise.all([
      riskAPI.getRiskZones(),
      riskAPI.getSafeZones(),
      riskAPI.getDisasters(),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    riskAPI.getRiskZones().then(setRiskZones).catch(() => {});
    riskAPI.getSafeZones().then(setSafeZones).catch(() => {});
    riskAPI.getDisasters().then(data => { setAllDisasters(data); setDisasters(data); }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/api/evacuation-routes')
      .then(r => r.json()).then(setEvacRoutes).catch(() => {});
  }, []);

  const filteredDisasters = disasterFilter.length > 0
    ? allDisasters.filter(d => disasterFilter.includes(d.disaster_type))
    : allDisasters;

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

  const handleMapQuery = useCallback((result: ReverseGeocodeResult, latlng: L.LatLng) => {
    const mapEl = document.querySelector('.leaflet-container');
    if (!mapEl) return;
    // Use L.popup directly
    if (result.found) {
      L.popup()
        .setLatLng(latlng)
        .setContent(`<div style="font-family:sans-serif;"><strong>${result.zone_name}</strong><br/>风险等级: <span style="color:${severityHex[result.risk_level || 'low']};font-weight:bold;">${result.risk_level}</span><br/>人口密度: ${result.population_density}/km²<br/>距离: ${result.distance_km} km</div>`)
        .openOn((window as any).__mapInstance);
    } else {
      L.popup()
        .setLatLng(latlng)
        .setContent(`<div style="color:#8c8c8c;">${result.message || '暂无风险数据'}</div>`)
        .openOn((window as any).__mapInstance);
    }
  }, []);

  const handleRouteCalculated = useCallback((route: [number, number][], info: string) => {
    setPlannedRoute(route);
    setPlannedRouteInfo(info);
  }, []);

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
              <MapContainer
                center={[30.5850, 114.3050]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                ref={(map) => { if (map) (window as any).__mapInstance = map; }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController center={[30.5850, 114.3050]} />
                <MapClickHandler onQuery={handleMapQuery} />
                <EvacuationPlanner onRoute={handleRouteCalculated} />

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

                {/* Hazard points */}
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

                {/* Planned route from right-click */}
                {plannedRoute && (
                  <Polyline positions={plannedRoute} color="#52c41a" weight={4}>
                    <Popup>{plannedRouteInfo}</Popup>
                  </Polyline>
                )}

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
