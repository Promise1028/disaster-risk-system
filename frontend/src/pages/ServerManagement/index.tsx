import { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Table, Tag, Progress, Statistic, Spin, Modal, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, CloudServerOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { riskAPI } from '../../services/api';
import type { ServerStatus } from '../../services/api';

const statusConfig: Record<string, { color: string; icon: any; label: string; glow: string }> = {
  online: { color: '#34c759', icon: <CheckCircleOutlined />, label: 'ONLINE', glow: '0 0 10px rgba(52,199,89,0.4)' },
  offline: { color: '#ff3b30', icon: <CloseCircleOutlined />, label: 'OFFLINE', glow: '0 0 10px rgba(255,59,48,0.4)' },
  degraded: { color: '#ff9500', icon: <ExclamationCircleOutlined />, label: 'DEGRADED', glow: '0 0 10px rgba(255,149,0,0.3)' },
};
const riskColors: Record<string, string> = { critical: '#ff3b30', high: '#ff9500', medium: '#ffcc00', low: '#34c759' };

// Simulated log data
function generateLogs() {
  const times: string[] = [];
  for (let i = 11; i >= 0; i--) {
    times.push(`${String(new Date().getHours() - i).padStart(2, '0')}:00`);
  }
  return times;
}

export default function ServerManagement() {
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineAlert, setOfflineAlert] = useState<ServerStatus | null>(null);

  useEffect(() => {
    riskAPI.getServers().then(data => {
      setServers(data);
      const offline = data.find(s => s.status === 'offline');
      if (offline && offlineAlert?.id !== offline.id) setOfflineAlert(offline);
    }).finally(() => setLoading(false));
    const interval = setInterval(() => {
      riskAPI.getServers().then(data => {
        setServers(data);
        const offline = data.find(s => s.status === 'offline');
        if (offline && offlineAlert?.id !== offline.id) setOfflineAlert(offline);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const logTimes = useMemo(() => generateLogs(), []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;

  const onlineCount = servers.filter(s => s.status === 'online').length;
  const degradedCount = servers.filter(s => s.status === 'degraded').length;
  const offlineCount = servers.filter(s => s.status === 'offline').length;

  // Simulated sensor log data
  const sensorLogOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['数据采集量', '异常记录'], textStyle: { color: '#a0a0a8' } },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category' as const, data: logTimes, axisLabel: { color: '#a0a0a8' }, axisLine: { lineStyle: { color: 'rgba(64,128,255,0.2)' } } },
    yAxis: { type: 'value' as const, name: '条', axisLabel: { color: '#a0a0a8' }, splitLine: { lineStyle: { color: 'rgba(64,128,255,0.06)' } } },
    series: [
      { name: '数据采集量', type: 'bar', data: logTimes.map(() => Math.floor(Math.random() * 500 + 200)),
        itemStyle: { color: '#4096ff', borderRadius: [4, 4, 0, 0], shadowBlur: 6, shadowColor: 'rgba(64,150,255,0.3)' }, barWidth: '60%' },
      { name: '异常记录', type: 'line', data: logTimes.map(() => Math.floor(Math.random() * 20)),
        lineStyle: { color: '#ff3b30', width: 2 }, itemStyle: { color: '#ff3b30' }, smooth: true },
    ],
  };

  // System operation log chart
  const sysLogOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['CPU负载', '内存使用', '网络流量'], textStyle: { color: '#a0a0a8' } },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category' as const, data: logTimes, axisLabel: { color: '#a0a0a8' }, axisLine: { lineStyle: { color: 'rgba(64,128,255,0.2)' } } },
    yAxis: { type: 'value' as const, name: '%', axisLabel: { color: '#a0a0a8' }, splitLine: { lineStyle: { color: 'rgba(64,128,255,0.06)' } } },
    series: [
      { name: 'CPU负载', type: 'line', data: logTimes.map(() => Math.floor(Math.random() * 40 + 20)),
        smooth: true, lineStyle: { color: '#4096ff', width: 2, shadowBlur: 6, shadowColor: 'rgba(64,150,255,0.3)' }, itemStyle: { color: '#4096ff' },
        areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(64,150,255,0.15)' }, { offset: 1, color: 'rgba(64,150,255,0)' }] } } },
      { name: '内存使用', type: 'line', data: logTimes.map(() => Math.floor(Math.random() * 30 + 40)),
        smooth: true, lineStyle: { color: '#ff9500', width: 2, shadowBlur: 6, shadowColor: 'rgba(255,149,0,0.2)' }, itemStyle: { color: '#ff9500' } },
      { name: '网络流量', type: 'line', data: logTimes.map(() => Math.floor(Math.random() * 50 + 10)),
        smooth: true, lineStyle: { color: '#34c759', width: 2, shadowBlur: 6, shadowColor: 'rgba(52,199,89,0.2)' }, itemStyle: { color: '#34c759' } },
    ],
  };

  const serverGaugeOption = {
    series: [{
      type: 'gauge', startAngle: 210, endAngle: -30, center: ['50%', '60%'], radius: '85%', min: 0, max: 100,
      axisLine: { lineStyle: { width: 22, color: [[0.3, '#34c759'], [0.65, '#ffcc00'], [0.85, '#ff9500'], [1, '#ff3b30']] } },
      pointer: { length: '70%', width: 8, itemStyle: { color: '#4096ff', shadowBlur: 10, shadowColor: 'rgba(64,150,255,0.5)' } },
      axisTick: { distance: -22, length: 8, lineStyle: { width: 2, color: '#999' } },
      splitLine: { distance: -24, length: 16, lineStyle: { width: 3, color: '#999' } },
      axisLabel: { distance: 30, color: '#a0a0a8', fontSize: 12 },
      detail: { fontSize: 24, fontWeight: 700, color: '#f0f0f0', textShadow: '0 0 10px rgba(64,150,255,0.3)', offsetCenter: [0, '55%'] },
      title: { color: '#a0a0a8', fontSize: 13, offsetCenter: [0, '82%'] },
      data: [{ value: servers.length > 0 ? Math.round(servers.reduce((s, x) => s + x.cpu_usage, 0) / servers.length) : 0, name: '平均CPU' }],
    }],
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 110,
      render: (v: string) => {
        const cfg = statusConfig[v] || statusConfig.online;
        return (
          <Tag style={{
            background: v === 'online' ? 'rgba(52,199,89,0.15)' : v === 'offline' ? 'rgba(255,59,48,0.18)' : 'rgba(255,149,0,0.15)',
            color: cfg.color, border: `1px solid ${cfg.color}33`, fontWeight: 700, fontSize: 11,
            boxShadow: cfg.glow,
          }}>{cfg.icon} {cfg.label}</Tag>
        );
      },
    },
    {
      title: 'CPU', dataIndex: 'cpu_usage', key: 'cpu_usage', width: 160,
      render: (v: number) => (
        <Progress percent={v} size="small"
          strokeColor={{ '0%': '#34c759', '60%': '#ffcc00', '85%': '#ff3b30' } as any}
          trailColor="rgba(255,255,255,0.04)"
          style={{ minWidth: 130 }} />
      ),
    },
    {
      title: '内存', dataIndex: 'memory_usage', key: 'memory_usage', width: 160,
      render: (v: number) => (
        <Progress percent={v} size="small"
          strokeColor={{ '0%': '#4096ff', '70%': '#ff9500', '90%': '#ff3b30' } as any}
          trailColor="rgba(255,255,255,0.04)"
          style={{ minWidth: 130 }} />
      ),
    },
    { title: '传感器', dataIndex: 'sensor_count', key: 'sensor_count' },
    {
      title: '区域风险', dataIndex: 'region_risk_level', key: 'region_risk_level',
      render: (v: string) => <Tag style={{ background: `${riskColors[v]}22`, color: riskColors[v], fontWeight: 600, border: `1px solid ${riskColors[v]}33` }}>{v.toUpperCase()}</Tag>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Offline alert modal */}
      <Modal
        open={!!offlineAlert}
        onCancel={() => setOfflineAlert(null)}
        onOk={() => setOfflineAlert(null)}
        okText="确认"
        centered
        width={420}
        styles={{
          header: { background: 'transparent' },
          body: {
            background: 'linear-gradient(135deg, #1a0808 0%, #0d0a14 100%)',
            border: '1px solid rgba(255,59,48,0.45)',
            boxShadow: '0 0 30px rgba(255,59,48,0.3)',
            borderRadius: 14,
          },
        }}
        title={<Space><CloseCircleOutlined style={{ color: '#ff3b30', fontSize: 18 }} /><span style={{ color: '#ff3b30', fontWeight: 700 }}>服务器离线告警</span></Space>}>
        {offlineAlert && (
          <div style={{ color: '#f0f0f0' }}>
            <p><strong>{offlineAlert.name}</strong> ({offlineAlert.location}) 已离线</p>
            <p style={{ color: '#a0a0a8', fontSize: 12 }}>最后心跳: {offlineAlert.last_heartbeat || '未知'}</p>
            <p style={{ color: '#ff3b30', fontSize: 12 }}>请立即检查服务器状态！</p>
          </div>
        )}
      </Modal>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="服务器总数" value={servers.length} prefix={<CloudServerOutlined style={{color:'#4096ff'}} />} valueStyle={{ color: '#f0f0f0', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="在线" value={onlineCount} prefix={<CheckCircleOutlined style={{color:'#34c759'}} />} valueStyle={{ color: '#34c759', fontWeight: 700, textShadow: '0 0 8px rgba(52,199,89,0.2)' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="降级" value={degradedCount} prefix={<ExclamationCircleOutlined style={{color:'#ff9500'}} />} valueStyle={{ color: '#ff9500', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic title="离线" value={offlineCount} prefix={<CloseCircleOutlined style={{color:'#ff3b30'}} />} valueStyle={{ color: '#ff3b30', fontWeight: 700, textShadow: '0 0 8px rgba(255,59,48,0.2)' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card className="glass-card" title={<span style={{ color: '#f0f0f0' }}>CPU 负载</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={serverGaugeOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={16}>
          <Card className="glass-card" title={<span style={{ color: '#f0f0f0' }}>服务器列表</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <Table dataSource={servers} columns={columns} rowKey="id" size="small" pagination={false} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card className="glass-card" title={<Space><ThunderboltOutlined style={{color:'#4096ff'}} /><span style={{ color: '#f0f0f0' }}>数据采集日志</span></Space>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={sensorLogOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="glass-card" title={<Space><CloudServerOutlined style={{color:'#34c759'}} /><span style={{ color: '#f0f0f0' }}>系统运行日志</span></Space>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={sysLogOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
