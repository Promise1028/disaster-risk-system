import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Row, Col, Card, Select, Descriptions, Tag, Button, Spin, message } from 'antd';
import { EnvironmentOutlined, AimOutlined } from '@ant-design/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { riskAPI } from '../../services/api';
import type { RiskZone, SafeZone, DisasterEvent, DecisionResult } from '../../services/api';

// Fix Leaflet icon issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const riskColors: Record<string, string> = { critical: '#f5222d', high: '#fa8c16', medium: '#faad14', low: '#52c41a' };
const disasterTypeLabels: Record<string, string> = { earthquake: '地震', flood: '洪水', typhoon: '台风', landslide: '滑坡', fire: '火灾' };

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 13); }, [center, map]);
  return null;
}

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

export default function RiskMapPage() {
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [evacRoutes, setEvacRoutes] = useState<EvacuationRoutesData[]>([]);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [userPos] = useState<[number, number]>([30.5850, 114.3000]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      riskAPI.getRiskZones(),
      riskAPI.getSafeZones(),
      riskAPI.getDisasters(),
      fetchEvacuationRoutes(),
    ]).finally(() => setLoading(false));
  }, []);

  async function fetchEvacuationRoutes() {
    try {
      const res = await fetch('http://localhost:8000/api/evacuation-routes');
      const data = await res.json();
      setEvacRoutes(data || []);
    } catch {}
  }

  useEffect(() => {
    riskAPI.getRiskZones().then(setRiskZones).catch(() => {});
    riskAPI.getSafeZones().then(setSafeZones).catch(() => {});
    riskAPI.getDisasters().then(setDisasters).catch(() => {});
  }, []);

  const handleGetDecision = async () => {
    try {
      const result = await riskAPI.getDecision(userPos[0], userPos[1]);
      setDecision(result);
      message.success('决策分析完成');
    } catch {
      message.error('获取决策失败，请检查后端服务');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;

  const activeDisasters = disasters?.filter(d => d.status === 'active' || d.status === 'monitoring') || [];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" title="灾害筛选">
            <Select
              style={{ width: '100%' }}
              placeholder="选择灾害类型"
              allowClear
              options={Object.entries(disasterTypeLabels).map(([k, v]) => ({ value: k, label: v }))}
              onChange={(val) => {
                if (val) {
                  setDisasters(prev => prev.filter(d => d.disaster_type === val));
                } else {
                  riskAPI.getDisasters().then(setDisasters);
                }
              }}
            />
            <Button type="primary" block style={{ marginTop: 12 }} onClick={handleGetDecision} icon={<AimOutlined />}>
              分析我的位置风险
            </Button>
          </Card>
          {decision && (
            <Card size="small" title="决策结果" style={{ marginTop: 12 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="风险等级">
                  <Tag color={riskColors[decision.risk_level]}>{decision.risk_level.toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风险评分">{decision.risk_score}</Descriptions.Item>
                <Descriptions.Item label="最近安全区">{decision.safe_zone}</Descriptions.Item>
                <Descriptions.Item label="距离">{decision.safe_zone_distance_km} km</Descriptions.Item>
                <Descriptions.Item label="步行预估">{decision.estimated_time_minutes} 分钟</Descriptions.Item>
              </Descriptions>
              <p style={{ color: '#cf1322', fontWeight: 'bold', fontSize: 12 }}>{decision.recommended_action}</p>
            </Card>
          )}
        </Col>
        <Col span={18}>
          <Card size="small" title="城市风险地图" bodyStyle={{ padding: 0 }}>
            <MapContainer center={[30.5850, 114.3050]} zoom={13} style={{ height: 600, borderRadius: 8 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController center={[30.5850, 114.3050]} />

              {riskZones.map(z => (
                <Circle
                  key={`rz-${z.id}`}
                  center={[z.latitude, z.longitude]}
                  radius={z.radius_km * 1000}
                  pathOptions={{ color: riskColors[z.risk_level], fillOpacity: 0.25, weight: 2 }}
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
                    严重程度: <Tag color={riskColors[d.severity]}>{d.severity}</Tag><br />
                    影响范围: {d.radius_km} km<br />
                    影响人口: {d.affected_population.toLocaleString()}
                  </Popup>
                </Marker>
              ))}

              {safeZones.map(s => (
                <Marker key={`sz-${s.id}`} position={[s.latitude, s.longitude]}>
                  <Popup>
                    <strong>🏠 {s.name}</strong><br />
                    容量: {s.current_occupancy}/{s.capacity}<br />
                    类型: {s.facility_type}
                  </Popup>
                </Marker>
              ))}

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

              {decision && (
                <>
                  <Marker position={userPos}><Popup>你的位置</Popup></Marker>
                  <Polyline positions={decision.evacuation_route} color="#f5222d" weight={4}>
                    <Popup>推荐疏散路线 ({decision.estimated_time_minutes}分钟)</Popup>
                  </Polyline>
                </>
              )}

              <Marker position={userPos}>
                <Popup>模拟用户位置</Popup>
              </Marker>
            </MapContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
