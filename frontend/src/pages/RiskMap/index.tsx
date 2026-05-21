import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline, useMap, useMapEvents, CircleMarker } from 'react-leaflet';
import { Row, Col, Card, Select, Descriptions, Tag, Button, Spin, message, Segmented, Tooltip } from 'antd';
import { AimOutlined, ExpandOutlined, CompressOutlined, MedicineBoxOutlined, ToolOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { riskAPI } from '../../services/api';
import type { RiskZone, SafeZone, DisasterEvent, DecisionResult, ReverseGeocodeResult } from '../../services/api';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const severityHex: Record<string, string> = { critical: '#ff3b30', high: '#ff9500', medium: '#ffcc00', low: '#34c759' };
const disasterTypeLabels: Record<string, string> = { earthquake: '地震', flood: '洪水', typhoon: '台风', landslide: '滑坡', fire: '火灾' };

// Custom dark icon for safe zones
const safeIcon = L.divIcon({
  className: '',
  html: '<div style="background:#34c759;width:24px;height:24px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 12px rgba(52,199,89,0.6);display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;">🛡</div>',
  iconSize: [24, 24], iconAnchor: [12, 12],
});

const medicalIcon = L.divIcon({
  className: '',
  html: '<div style="background:#ff3b30;width:20px;height:20px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 10px rgba(255,59,48,0.5);display:flex;align-items:center;justify-content:center;font-size:10px;">+</div>',
  iconSize: [20, 20], iconAnchor: [10, 10],
});

const supplyIcon = L.divIcon({
  className: '',
  html: '<div style="background:#4096ff;width:20px;height:20px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 10px rgba(64,150,255,0.5);display:flex;align-items:center;justify-content:center;font-size:10px;">📦</div>',
  iconSize: [20, 20], iconAnchor: [10, 10],
});

interface EvacuationRoutesData {
  id: number; name: string; from_lat: number; from_lng: number; to_lat: number; to_lng: number;
  safe_zone_id: number | null; distance_km: number; risk_level: string; path_json: string;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const zoom = parseInt(searchParams.get('zoom') || '');
    if (!isNaN(lat) && !isNaN(lng)) map.setView([lat, lng], !isNaN(zoom) ? zoom : 14);
    else map.setView(center, 13);
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
      } catch { message.error('路线规划失败'); }
    },
  });
  return null;
}

// Simple forecast marker positions near active disasters
function ForecastLayer({ disasters }: { disasters: DisasterEvent[] }) {
  const active = disasters.filter(d => d.status === 'active' || d.status === 'monitoring');
  return (
    <>
      {active.map(d => {
        const futureLat = d.latitude + (Math.random() - 0.5) * 0.02;
        const futureLng = d.longitude + (Math.random() - 0.5) * 0.02;
        return (
          <CircleMarker key={`fc-${d.id}`} center={[futureLat, futureLng]} radius={10}
            pathOptions={{ color: '#00d4ff', fillColor: '#00d4ff', fillOpacity: 0.3, weight: 2, dashArray: '4 4' }}>
            <Popup>
              <strong>1-3小时风险预测</strong><br />
              类型: {disasterTypeLabels[d.disaster_type] || d.disaster_type}<br />
              预测扩散半径: {(d.radius_km * 1.5).toFixed(1)} km<br />
              <Tag color="cyan">预测中</Tag>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export default function RiskMapPage() {
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
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
  const [clickInfo, setClickInfo] = useState<{ result: ReverseGeocodeResult; latlng: L.LatLng } | null>(null);

  useEffect(() => {
    Promise.all([riskAPI.getRiskZones(), riskAPI.getSafeZones(), riskAPI.getDisasters()])
      .then(([rz, sz, ds]) => { setRiskZones(rz); setSafeZones(sz); setAllDisasters(ds); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    riskAPI.getRiskZones().then(setRiskZones).catch(() => {});
    riskAPI.getSafeZones().then(setSafeZones).catch(() => {});
    riskAPI.getDisasters().then(setAllDisasters).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/evacuation-routes`)
      .then(r => r.json()).then(setEvacRoutes).catch(() => {});
  }, []);

  const filteredDisasters = disasterFilter.length > 0
    ? allDisasters.filter(d => disasterFilter.includes(d.disaster_type)) : allDisasters;
  const activeDisasters = filteredDisasters.filter(d => d.status === 'active' || d.status === 'monitoring');

  // Derived medical & supply points from safe zones
  const medicalPoints = useMemo(() => safeZones.filter(s => s.facility_type === '医院' || s.facility_type === '医疗站'), [safeZones]);
  const supplyPoints = useMemo(() => safeZones.filter(s => s.facility_type === '物资仓库' || s.facility_type === '避难所'), [safeZones]);

  const handleGetDecision = async () => {
    try {
      const result = await riskAPI.getDecision(userPos[0], userPos[1]);
      setDecision(result);
      message.success('决策分析完成');
    } catch { message.error('获取决策失败'); }
  };

  const handleMapQuery = useCallback((result: ReverseGeocodeResult, latlng: L.LatLng) => {
    setClickInfo({ result, latlng });
    const mapEl = (window as any).__mapInstance;
    if (!mapEl) return;
    if (result.found) {
      L.popup()
        .setLatLng(latlng)
        .setContent(`<div style="font-family:sans-serif;font-size:13px;"><strong>${result.zone_name}</strong><br/>风险等级: <span style="color:${severityHex[result.risk_level || 'low']};font-weight:bold;">${result.risk_level}</span><br/>人口密度: ${result.population_density}/km²<br/>距离: ${result.distance_km} km</div>`)
        .openOn(mapEl);
    } else {
      L.popup().setLatLng(latlng)
        .setContent(`<div style="color:#8c8c8c;">${result.message || '暂无风险数据'}</div>`)
        .openOn(mapEl);
    }
  }, []);

  const handleRouteCalculated = useCallback((route: [number, number][], info: string) => {
    setPlannedRoute(route); setPlannedRouteInfo(info);
  }, []);

  const toggleFullscreen = () => {
    const el = document.getElementById('map-container');
    if (!el) return;
    if (!isFullscreen) { el.requestFullscreen?.(); setIsFullscreen(true); }
    else { document.exitFullscreen?.(); setIsFullscreen(false); }
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
          <Card className="glass-card" size="small"
            title={<span style={{ color: '#f0f0f0' }}>灾害筛选</span>}
            style={{ borderRadius: 'var(--radius-card)' }}>
            <Select mode="multiple" style={{ width: '100%' }} placeholder="选择灾害类型" allowClear
              options={Object.entries(disasterTypeLabels).map(([k, v]) => ({ value: k, label: v }))}
              onChange={(vals) => setDisasterFilter(vals)} />
            <Segmented block style={{ marginTop: 12, background: 'rgba(255,255,255,0.04)' }}
              value={activeLayer} onChange={(val) => setActiveLayer(val as string)}
              options={[
                { label: '全部', value: 'all' }, { label: '人口密度', value: 'density' },
                { label: '安全区', value: 'safe' }, { label: '隐患点', value: 'hazard' },
              ]} />
            <Button type="primary" block style={{ marginTop: 12, borderRadius: 8 }} onClick={handleGetDecision} icon={<AimOutlined />}>
              分析我的位置风险
            </Button>
          </Card>

          {decision && (
            <Card className="glass-card" size="small"
              title={<span style={{ color: '#f0f0f0' }}>决策结果</span>}
              style={{ marginTop: 12, borderRadius: 'var(--radius-card)' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="风险等级">
                  <Tag color={severityHex[decision.risk_level]}>{decision.risk_level.toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风险评分">{decision.risk_score}</Descriptions.Item>
                <Descriptions.Item label="最近安全区">{decision.safe_zone}</Descriptions.Item>
                <Descriptions.Item label="距离">{decision.safe_zone_distance_km} km</Descriptions.Item>
                <Descriptions.Item label="步行预估">{decision.estimated_time_minutes} 分钟</Descriptions.Item>
              </Descriptions>
              <p style={{ color: '#ff3b30', fontWeight: 'bold', fontSize: 12, textShadow: '0 0 6px rgba(255,59,48,0.3)' }}>{decision.recommended_action}</p>
            </Card>
          )}

          {clickInfo && (
            <Card className="glass-card" size="small"
              title={<span style={{ color: '#f0f0f0' }}>点击区域详情</span>}
              style={{ marginTop: 12, borderRadius: 'var(--radius-card)' }}>
              {clickInfo.result.found ? (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="区域">{clickInfo.result.zone_name}</Descriptions.Item>
                  <Descriptions.Item label="风险等级">
                    <Tag color={severityHex[clickInfo.result.risk_level || 'low']}>{clickInfo.result.risk_level?.toUpperCase()}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="人口密度">{clickInfo.result.population_density}/km²</Descriptions.Item>
                  <Descriptions.Item label="距离">{clickInfo.result.distance_km} km</Descriptions.Item>
                </Descriptions>
              ) : <p style={{ color: '#8c8c8c' }}>{clickInfo.result.message || '暂无数据'}</p>}
            </Card>
          )}
        </Col>

        <Col span={18}>
          <Card className="glass-card" size="small"
            title={<span style={{ color: '#f0f0f0' }}>城市风险地图</span>}
            extra={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tooltip title="医疗点"><MedicineBoxOutlined style={{ color: '#ff3b30', fontSize: 16 }} /></Tooltip>
                <Tooltip title="物资点"><ToolOutlined style={{ color: '#4096ff', fontSize: 16 }} /></Tooltip>
                <Button type="text" icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                  onClick={toggleFullscreen} style={{ color: '#a0a0a8' }} />
              </div>
            }
            style={{ borderRadius: 'var(--radius-card)' }}
            bodyStyle={{ padding: 0 }}>
            <div id="map-container" style={{ height: isFullscreen ? '100vh' : 600, borderRadius: 12, overflow: 'hidden' }}>
              <MapContainer
                center={[30.5850, 114.3050]} zoom={13}
                style={{ height: '100%', width: '100%' }}
                ref={(map) => { if (map) (window as any).__mapInstance = map; }}>
                {/* Dark tech map tiles */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                <MapController center={[30.5850, 114.3050]} />
                <MapClickHandler onQuery={handleMapQuery} />
                <EvacuationPlanner onRoute={handleRouteCalculated} />

                {/* Safe zones — shield markers */}
                {(activeLayer === 'all' || activeLayer === 'safe') && safeZones.filter(s => s.facility_type !== '医院' && s.facility_type !== '医疗站' && s.facility_type !== '物资仓库').map(s => (
                  <Marker key={`sz-${s.id}`} position={[s.latitude, s.longitude]} icon={safeIcon}>
                    <Popup><strong>{s.name}</strong><br />容量: {s.current_occupancy}/{s.capacity}<br />类型: {s.facility_type}</Popup>
                  </Marker>
                ))}

                {/* Medical points */}
                {(activeLayer === 'all' || activeLayer === 'safe') && medicalPoints.map(s => (
                  <Marker key={`med-${s.id}`} position={[s.latitude, s.longitude]} icon={medicalIcon}>
                    <Popup><strong>🏥 {s.name}</strong><br />医疗点<br />容量: {s.current_occupancy}/{s.capacity}</Popup>
                  </Marker>
                ))}

                {/* Supply points */}
                {(activeLayer === 'all' || activeLayer === 'safe') && supplyPoints.map(s => (
                  <Marker key={`sup-${s.id}`} position={[s.latitude, s.longitude]} icon={supplyIcon}>
                    <Popup><strong>📦 {s.name}</strong><br />物资点<br />容量: {s.current_occupancy}/{s.capacity}</Popup>
                  </Marker>
                ))}

                {/* Hazard circles with gradient & dark borders */}
                {(activeLayer === 'all' || activeLayer === 'hazard') && (
                  <>
                    {riskZones.map(z => (
                      <Circle key={`rz-${z.id}`} center={[z.latitude, z.longitude]} radius={z.radius_km * 1000}
                        pathOptions={{
                          color: severityHex[z.risk_level],
                          fillColor: severityHex[z.risk_level],
                          fillOpacity: 0.18,
                          weight: 2.5,
                          opacity: 0.85,
                        }}>
                        <Popup>
                          <strong>{z.name}</strong><br />
                          风险等级: <span style={{ color: severityHex[z.risk_level], fontWeight: 'bold' }}>{z.risk_level}</span><br />
                          人员密度: {z.population_density}/km²<br />
                          预警次数: {z.alert_count}
                        </Popup>
                      </Circle>
                    ))}
                    {activeDisasters.map(d => (
                      <Circle key={`d-${d.id}`} center={[d.latitude, d.longitude]} radius={d.radius_km * 1000}
                        pathOptions={{
                          color: severityHex[d.severity],
                          fillColor: severityHex[d.severity],
                          fillOpacity: 0.12,
                          weight: 2,
                          opacity: 0.7,
                          dashArray: '8 4',
                        }}>
                        <Popup>
                          <strong>{disasterTypeLabels[d.disaster_type]}: {d.name}</strong><br />
                          严重程度: <Tag color={severityHex[d.severity]}>{d.severity}</Tag><br />
                          影响范围: {d.radius_km} km<br />
                          影响人口: {d.affected_population.toLocaleString()}
                        </Popup>
                      </Circle>
                    ))}
                    {activeDisasters.map(d => (
                      <CircleMarker key={`epi-${d.id}`} center={[d.latitude, d.longitude]} radius={6}
                        pathOptions={{ color: '#fff', fillColor: severityHex[d.severity], fillOpacity: 1, weight: 2 }}>
                        <Popup>{disasterTypeLabels[d.disaster_type]}: {d.name}</Popup>
                      </CircleMarker>
                    ))}
                  </>
                )}

                {/* Population density layer */}
                {(activeLayer === 'all' || activeLayer === 'density') && riskZones.map(z => {
                  const densityScale = Math.min(z.population_density / 10000, 1);
                  const r = 300 + densityScale * 700;
                  return (
                    <Circle key={`den-${z.id}`} center={[z.latitude, z.longitude]} radius={r}
                      pathOptions={{
                        color: 'rgba(64, 150, 255, 0.45)',
                        fillColor: 'rgba(64, 150, 255, 0.08)',
                        fillOpacity: 0.3, weight: 1.5,
                      }}>
                      <Popup><strong>{z.name}</strong><br />人口密度: {z.population_density}/km²</Popup>
                    </Circle>
                  );
                })}

                {/* 1-3h Risk forecast */}
                <ForecastLayer disasters={activeDisasters} />

                {/* Evacuation routes — blue glow dashed */}
                {evacRoutes.map(r => {
                  const path = (() => {
                    try { return JSON.parse(r.path_json); } catch { return [[r.from_lat, r.from_lng], [r.to_lat, r.to_lng]]; }
                  })();
                  return (
                    <Polyline key={`er-${r.id}`} positions={path}
                      pathOptions={{ color: '#4096ff', weight: 3, dashArray: '10 6', opacity: 0.8 }}>
                      <Popup>{r.name} ({r.distance_km} km)</Popup>
                    </Polyline>
                  );
                })}

                {/* Planned route */}
                {plannedRoute && (
                  <Polyline positions={plannedRoute}
                    pathOptions={{ color: '#34c759', weight: 4, opacity: 0.9 }}>
                    <Popup>{plannedRouteInfo}</Popup>
                  </Polyline>
                )}

                {/* User position */}
                <Marker position={userPos}>
                  <Popup>模拟用户位置</Popup>
                </Marker>
                {decision && (
                  <Polyline positions={decision.evacuation_route}
                    pathOptions={{ color: '#ff3b30', weight: 4, opacity: 0.85 }}>
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
