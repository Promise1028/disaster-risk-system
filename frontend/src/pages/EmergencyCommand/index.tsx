import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Timeline, Space, Spin, Button, Progress, List } from 'antd';
import {
  ThunderboltOutlined, TeamOutlined, AimOutlined, AlertOutlined,
  SafetyOutlined, CloudServerOutlined, EnvironmentOutlined,
  CheckCircleOutlined, ClockCircleOutlined, SendOutlined,
  ExclamationCircleOutlined, ToolOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { riskAPI } from '../../services/api';
import type { DashboardStats, DisasterEvent, AlertRecord, ServerStatus, SafeZone } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';

const severityHex: Record<string, string> = { critical: '#ff3b30', high: '#ff9500', medium: '#ffcc00', low: '#34c759' };
const disasterLabels: Record<string, string> = { earthquake: '地震', flood: '洪水', typhoon: '台风', landslide: '滑坡', fire: '火灾' };

interface CoordinationLog {
  time: string; action: string; status: 'pending' | 'done' | 'failed'; detail: string;
}

export default function EmergencyCommand() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Simulated coordination log
  const [coordinationLogs] = useState<CoordinationLog[]>([
    { time: new Date().toLocaleTimeString(), action: '启动应急响应预案', status: 'done', detail: '已激活3个安全区' },
    { time: new Date(Date.now() - 120000).toLocaleTimeString(), action: '向居民发送预警通知', status: 'done', detail: '覆盖12,500人' },
    { time: new Date(Date.now() - 300000).toLocaleTimeString(), action: '调度救援队伍', status: 'done', detail: '3支队伍已出发' },
    { time: new Date(Date.now() - 480000).toLocaleTimeString(), action: '物资调配中', status: 'pending', detail: '预计30分钟内到位' },
    { time: new Date(Date.now() - 600000).toLocaleTimeString(), action: '医疗队待命', status: 'done', detail: '2个医疗点已就位' },
    { time: new Date(Date.now() - 900000).toLocaleTimeString(), action: '灾情评估完成', status: 'done', detail: '高风险区域已标记' },
  ]);

  const handleWsMessage = useCallback((data: any) => {
    if (data.type === 'dashboard_update') setStats(data.data);
    if (data.type === 'alert') setAlerts(prev => [data.data, ...prev].slice(0, 20));
  }, []);

  useWebSocket('/ws/dashboard', handleWsMessage);

  useEffect(() => {
    Promise.all([
      riskAPI.getDashboard(), riskAPI.getDisasters(), riskAPI.getAlerts(true),
      riskAPI.getServers(), riskAPI.getSafeZones(),
    ]).then(([s, d, a, sv, sz]) => {
      setStats(s); setDisasters(d); setAlerts(a); setServers(sv); setSafeZones(sz);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;

  const activeDisasters = disasters.filter(d => d.status === 'active' || d.status === 'monitoring');
  const onlineServers = servers.filter(s => s.status === 'online').length;
  const totalCapacity = safeZones.reduce((s, z) => s + z.capacity, 0);
  const availableCapacity = safeZones.reduce((s, z) => s + z.capacity - z.current_occupancy, 0);

  // Resource deployment gauge
  const resourceOption = {
    series: [{
      type: 'gauge', startAngle: 210, endAngle: -30, center: ['50%', '55%'], radius: '85%', min: 0, max: 100,
      axisLine: { lineStyle: { width: 20, color: [[0.4, '#34c759'], [0.7, '#ffcc00'], [1, '#ff3b30']] } },
      pointer: { length: '65%', width: 6, itemStyle: { color: '#4096ff', shadowBlur: 8, shadowColor: 'rgba(64,150,255,0.4)' } },
      detail: { fontSize: 20, fontWeight: 700, color: '#f0f0f0', offsetCenter: [0, '50%'] },
      data: [{ value: Math.round((availableCapacity / Math.max(totalCapacity, 1)) * 100), name: '资源利用率' }],
    }],
  };

  const alertColumns = [
    { title: '预警', dataIndex: 'title', key: 'title', render: (v: string, r: AlertRecord) => (
      <Space>
        {r.severity === 'critical' && <ExclamationCircleOutlined style={{ color: '#ff3b30', animation: 'critical-pulse 2s ease-in-out infinite' }} />}
        <span style={{ color: '#f0f0f0' }}>{v}</span>
        <Tag style={{ background: `${severityHex[r.severity]}22`, color: severityHex[r.severity], fontWeight: 700, border: `1px solid ${severityHex[r.severity]}33` }}>{r.severity.toUpperCase()}</Tag>
      </Space>
    )},
    { title: '操作', key: 'action', width: 80,
      render: (_: any, r: AlertRecord) => r.latitude ? <Button size="small" type="primary" ghost icon={<EnvironmentOutlined />}
        onClick={() => navigate(`/map?lat=${r.latitude}&lng=${r.longitude}&zoom=14`)} style={{ borderRadius: 6 }}>定位</Button> : null },
  ];

  const disasterColumns = [
    { title: '灾害', dataIndex: 'name', key: 'name', render: (v: string, r: DisasterEvent) => (
      <Space><span style={{ color: '#f0f0f0' }}>{v}</span><Tag style={{background:`${severityHex[r.severity]}22`,color:severityHex[r.severity],fontWeight:600}}>{disasterLabels[r.disaster_type]}</Tag></Space>
    )},
    { title: '影响人口', dataIndex: 'affected_population', key: 'pop', render: (v: number) => v.toLocaleString() },
    { title: '范围(km)', dataIndex: 'radius_km', key: 'radius' },
    { title: '操作', key: 'action', width: 80,
      render: (_: any, r: DisasterEvent) => <Button size="small" type="primary" ghost icon={<AimOutlined />}
        onClick={() => navigate(`/map?lat=${r.latitude}&lng=${r.longitude}&zoom=13`)} style={{ borderRadius: 6 }}>定位</Button> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top stat row */}
      <Row gutter={[16, 16]}>
        {[
          { title: '活跃灾情', value: activeDisasters.length, icon: <ThunderboltOutlined style={{color:'#ff3b30'}} />, color: '#ff3b30' },
          { title: '受影响人口', value: stats.total_population, icon: <TeamOutlined style={{color:'#ff9500'}} />, color: '#ff9500', fmt: (v: number) => v.toLocaleString() },
          { title: '在线服务器', value: `${onlineServers}/${servers.length}`, icon: <CloudServerOutlined style={{color:'#34c759'}} />, color: '#34c759' },
          { title: '可用避难容量', value: availableCapacity, icon: <SafetyOutlined style={{color:'#4096ff'}} />, color: '#4096ff', fmt: (v: number) => v.toLocaleString() },
        ].map((item, idx) => (
          <Col span={6} key={idx}>
            <Card className="stat-card" style={{ borderRadius: 'var(--radius-card)' }}>
              <Statistic title={item.title} value={item.value} prefix={item.icon}
                valueStyle={{ color: item.color, fontSize: 26, fontWeight: 700, textShadow: `0 0 8px ${item.color}33` }}
                formatter={item.fmt ? (v: any) => item.fmt!(v) : undefined} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main command panels */}
      <Row gutter={[16, 16]}>
        {/* Left: Active disasters */}
        <Col span={8}>
          <Card className="glass-card"
            title={<Space><ThunderboltOutlined style={{color:'#ff3b30'}} /><span style={{color:'#f0f0f0'}}>活跃灾情监控</span></Space>}
            style={{ borderRadius: 'var(--radius-card)', height: 380 }}
            bodyStyle={{ padding: '0 12px 12px', overflow: 'auto', height: 320 }}>
            <Table dataSource={activeDisasters} columns={disasterColumns} rowKey="id" size="small" pagination={false} />
          </Card>
        </Col>

        {/* Center: Resource gauge + safe zones */}
        <Col span={8}>
          <Card className="glass-card"
            title={<Space><ToolOutlined style={{color:'#4096ff'}} /><span style={{color:'#f0f0f0'}}>资源调度</span></Space>}
            style={{ borderRadius: 'var(--radius-card)', height: 380 }}>
            <Row gutter={16}>
              <Col span={12}>
                <ReactECharts option={resourceOption} style={{ height: 240 }} />
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                  {safeZones.slice(0, 5).map(z => {
                    const usage = z.capacity > 0 ? Math.round((z.current_occupancy / z.capacity) * 100) : 0;
                    return (
                      <div key={z.id}>
                        <div style={{ color: '#f0f0f0', fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{z.name}</span>
                          <span style={{ color: usage > 80 ? '#ff3b30' : '#a0a0a8' }}>{z.current_occupancy}/{z.capacity}</span>
                        </div>
                        <Progress percent={usage} size="small"
                          strokeColor={usage > 80 ? '#ff3b30' : usage > 50 ? '#ffcc00' : '#34c759'}
                          trailColor="rgba(255,255,255,0.04)" />
                      </div>
                    );
                  })}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right: Alert queue */}
        <Col span={8}>
          <Card className="glass-card"
            title={<Space><AlertOutlined style={{color:'#ff9500'}} /><span style={{color:'#f0f0f0'}}>预警队列</span></Space>}
            style={{ borderRadius: 'var(--radius-card)', height: 380 }}
            bodyStyle={{ padding: '0 12px 12px', overflow: 'auto', height: 320 }}>
            <Table dataSource={alerts.slice(0, 8)} columns={alertColumns} rowKey="id" size="small" pagination={false} />
          </Card>
        </Col>
      </Row>

      {/* Bottom: Coordination log + quick actions */}
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card className="glass-card"
            title={<Space><ClockCircleOutlined style={{color:'#4096ff'}} /><span style={{color:'#f0f0f0'}}>协调指挥日志</span></Space>}
            style={{ borderRadius: 'var(--radius-card)' }}>
            <Timeline
              items={coordinationLogs.map(log => ({
                color: log.status === 'done' ? '#34c759' : log.status === 'failed' ? '#ff3b30' : '#ffcc00',
                dot: log.status === 'done' ? <CheckCircleOutlined style={{color:'#34c759'}} />
                  : log.status === 'failed' ? <ExclamationCircleOutlined style={{color:'#ff3b30'}} />
                  : <ClockCircleOutlined style={{color:'#ffcc00'}} />,
                children: (
                  <div style={{ borderLeft: `3px solid ${log.status === 'done' ? '#34c759' : log.status === 'failed' ? '#ff3b30' : '#ffcc00'}33`, paddingLeft: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#f0f0f0' }}>{log.action}</strong>
                      <Tag style={{
                        background: log.status === 'done' ? 'rgba(52,199,89,0.15)' : log.status === 'failed' ? 'rgba(255,59,48,0.15)' : 'rgba(255,204,0,0.12)',
                        color: log.status === 'done' ? '#34c759' : log.status === 'failed' ? '#ff3b30' : '#ffcc00',
                        fontWeight: 600, border: 'none',
                      }}>{log.status === 'done' ? '已完成' : log.status === 'failed' ? '失败' : '进行中'}</Tag>
                    </div>
                    <p style={{ color: '#a0a0a8', fontSize: 12, marginTop: 2 }}>{log.detail}</p>
                    <span style={{ fontSize: 11, color: '#606068' }}>{log.time}</span>
                  </div>
                ),
              }))} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="glass-card"
            title={<Space><SendOutlined style={{color:'#4096ff'}} /><span style={{color:'#f0f0f0'}}>快速指令</span></Space>}
            style={{ borderRadius: 'var(--radius-card)' }}>
            <List size="small" dataSource={[
              { icon: <AlertOutlined style={{color:'#ff3b30'}} />, title: '发布一级预警', desc: '向所有市民发送紧急通知' },
              { icon: <SafetyOutlined style={{color:'#34c759'}} />, title: '开放避难所', desc: '激活所有安全区域' },
              { icon: <TeamOutlined style={{color:'#4096ff'}} />, title: '调度救援队', desc: '向灾区派遣救援力量' },
              { icon: <ToolOutlined style={{color:'#ff9500'}} />, title: '物资紧急调配', desc: '启动物资供应链' },
            ]}
            renderItem={(item) => (
              <List.Item style={{ borderColor: 'var(--border-subtle)', padding: '10px 0' }}>
                <List.Item.Meta
                  avatar={item.icon}
                  title={<span style={{ color: '#f0f0f0', fontSize: 13 }}>{item.title}</span>}
                  description={<span style={{ color: '#a0a0a8', fontSize: 11 }}>{item.desc}</span>} />
                <Button size="small" type="primary" ghost style={{ borderRadius: 6, borderColor: 'var(--border-active)' }}>执行</Button>
              </List.Item>
            )} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
