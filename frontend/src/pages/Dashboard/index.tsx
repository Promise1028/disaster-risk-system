import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, Segmented, Button } from 'antd';
import {
  TeamOutlined, AlertOutlined, ThunderboltOutlined, SafetyOutlined,
  CloudServerOutlined, DollarOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { riskAPI } from '../../services/api';
import type { DashboardStats, RiskAssessment, AlertRecord, TrendDataPoint, PopulationStat } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import ExportButtons from './ExportButtons';

const severityHex: Record<string, string> = {
  critical: '#ff3b30', high: '#ff9500', medium: '#ffcc00', low: '#34c759',
};
const disasterLabels: Record<string, string> = {
  earthquake: '地震', flood: '洪水', typhoon: '台风', landslide: '滑坡', fire: '火灾',
};
const disasterColors = ['#ff3b30', '#4096ff', '#ff9500', '#ffcc00', '#34c759'];
const ringColors = { critical: '#ff3b30', high: '#ff9500', medium: '#ffcc00', low: '#34c759' };

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [popStats, setPopStats] = useState<PopulationStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('week');
  const navigate = useNavigate();

  const handleWsMessage = useCallback((data: any) => {
    if (data.type === 'dashboard_update') setStats(data.data);
  }, []);

  useWebSocket('/ws/dashboard', handleWsMessage);

  useEffect(() => {
    Promise.all([
      riskAPI.getDashboard(), riskAPI.getAssessments(), riskAPI.getAlerts(true),
      riskAPI.getTrends(period), riskAPI.getPopulationStats(period),
    ]).then(([s, a, al, t, p]) => {
      setStats(s); setAssessments(a); setAlerts(al); setTrends(t); setPopStats(p);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    riskAPI.getTrends(period).then(setTrends);
    riskAPI.getPopulationStats(period).then(setPopStats);
  }, [period]);

  if (loading || !stats) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;

  const pieData = Object.entries(stats.risk_level_distribution).map(([name, value]) => ({
    name, value,
    itemStyle: {
      color: ringColors[name as keyof typeof ringColors] || '#999',
      shadowBlur: 15,
      shadowColor: ringColors[name as keyof typeof ringColors] || '#999',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    },
  }));

  const disasterPieData = Object.entries(stats.disaster_type_distribution).map(([name, value]) => ({
    name, value,
  }));

  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['风险评分', '预警数'], textStyle: { color: '#a0a0a8' } },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category' as const, data: trends.map(t => t.date), axisLine: { lineStyle: { color: 'rgba(64,128,255,0.2)' } }, axisLabel: { color: '#a0a0a8' } },
    yAxis: [
      { type: 'value' as const, name: '评分', axisLabel: { color: '#a0a0a8' }, splitLine: { lineStyle: { color: 'rgba(64,128,255,0.06)' } } },
      { type: 'value' as const, name: '数量', axisLabel: { color: '#a0a0a8' }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '风险评分', type: 'line', data: trends.map(t => t.avg_risk_score),
        smooth: true, symbol: 'circle', symbolSize: 7,
        lineStyle: { color: '#4096ff', width: 2.5, shadowBlur: 10, shadowColor: 'rgba(64,150,255,0.5)' },
        itemStyle: { color: '#4096ff', shadowBlur: 8, shadowColor: 'rgba(64,150,255,0.6)' },
        areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(64,150,255,0.28)' }, { offset: 1, color: 'rgba(64,150,255,0.01)' }] } },
      },
      {
        name: '预警数', type: 'line', yAxisIndex: 1, data: trends.map(t => t.alert_count),
        smooth: true, symbol: 'diamond', symbolSize: 7,
        lineStyle: { color: '#ff3b30', width: 2.5, type: 'dashed', shadowBlur: 10, shadowColor: 'rgba(255,59,48,0.5)' },
        itemStyle: { color: '#ff3b30', shadowBlur: 8, shadowColor: 'rgba(255,59,48,0.5)' },
      },
    ],
  };

  const popOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: popStats.map(p => disasterLabels[p.disaster_type] || p.disaster_type),
      axisLabel: { color: '#a0a0a8' },
      axisLine: { lineStyle: { color: 'rgba(64,128,255,0.2)' } },
    },
    yAxis: {
      type: 'value' as const, name: '影响人口',
      axisLabel: { color: '#a0a0a8', formatter: (v: number) => v >= 10000 ? `${(v/10000).toFixed(1)}万` : String(v) },
      splitLine: { lineStyle: { color: 'rgba(64,128,255,0.06)' } },
    },
    series: [{
      type: 'bar', barWidth: '50%',
      data: popStats.map((p, i) => ({
        value: p.affected_population,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: disasterColors[i % disasterColors.length],
          shadowBlur: 8,
          shadowColor: disasterColors[i % disasterColors.length],
        },
      })),
    }],
  };

  const columnDefs = [
    { title: '区域', dataIndex: 'zone_name', key: 'zone_name' },
    { title: '灾害类型', dataIndex: 'disaster_type', key: 'disaster_type' },
    { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level',
      render: (v: string) => <Tag color={severityHex[v]}>{v.toUpperCase()}</Tag> },
    { title: '风险评分', dataIndex: 'risk_score', key: 'risk_score', sorter: (a: any, b: any) => a.risk_score - b.risk_score },
    { title: '影响人口', dataIndex: 'population_total', key: 'population_total', render: (v: number) => v.toLocaleString() },
    { title: '预估损失(万元)', dataIndex: 'estimated_loss', key: 'estimated_loss', render: (v: number) => v.toLocaleString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

      <Row gutter={[16, 16]}>
        {[
          { title: '区域总人数', value: stats.total_population, icon: <TeamOutlined style={{color:'#4096ff'}} />, fmt: (v: number) => v.toLocaleString() },
          { title: '预警次数', value: stats.total_alerts, icon: <AlertOutlined style={{color:'#ff3b30'}} />, color: 'var(--risk-critical)' },
          { title: '活跃灾害', value: stats.active_disasters, icon: <ThunderboltOutlined style={{color:'#ff9500'}} />, color: 'var(--risk-high)' },
          { title: '在线服务器', value: `${stats.online_servers}/${stats.total_servers}`, icon: <CloudServerOutlined style={{color:'#34c759'}} />, color: 'var(--risk-low)' },
        ].map((item, idx) => (
          <Col span={6} key={idx}>
            <Card className="stat-card" style={{ borderRadius: 'var(--radius-card)' }}>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={item.icon}
                valueStyle={{ color: (item as any).color || '#f0f0f0', fontSize: 28, fontWeight: 700, textShadow: '0 0 10px rgba(64,128,255,0.15)' }}
                formatter={item.fmt ? (v: any) => item.fmt!(v) : undefined}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {[
          { title: '人员密度(人/km²)', value: stats.avg_population_density, precision: 0 },
          { title: '情绪指数', value: stats.avg_emotion_index, precision: 2, suffix: '/1.0', color: (stats.avg_emotion_index || 0) < 0.4 ? 'var(--risk-critical)' : 'var(--risk-low)' },
          { title: '指导人员', value: stats.total_guides, prefix: <SafetyOutlined style={{color:'#4096ff'}} /> },
          { title: '预估总损失(万元)', value: stats.estimated_total_loss, precision: 1, prefix: <DollarOutlined style={{color:'#ff3b30'}} />, color: 'var(--risk-critical)' },
        ].map((item, idx) => (
          <Col span={6} key={idx}>
            <Card className="stat-card" style={{ borderRadius: 'var(--radius-card)' }}>
              <Statistic
                title={item.title}
                value={item.value}
                precision={(item as any).precision}
                prefix={(item as any).prefix}
                suffix={(item as any).suffix}
                valueStyle={{ color: (item as any).color || '#f0f0f0', fontSize: 24, fontWeight: 700, textShadow: '0 0 10px rgba(64,128,255,0.12)' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card className="glass-card" title={<span style={{ color: '#f0f0f0' }}>近{period === 'today' ? '24小时' : period === 'week' ? '7天' : '30天'}风险趋势</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={trendOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="glass-card" title={<span style={{ color: '#f0f0f0' }}>各灾害类型影响人口</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={popOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card className="glass-card" title={<span style={{ color: '#f0f0f0' }}>风险等级分布</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={{
              tooltip: { trigger: 'item' },
              series: [{
                type: 'pie', radius: ['42%', '72%'],
                data: pieData,
                label: { color: '#c0c0c8', fontSize: 12 },
                emphasis: { label: { fontSize: 16, fontWeight: 'bold' }, scaleSize: 8 },
              }],
            }} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="glass-card" title={<span style={{ color: '#f0f0f0' }}>灾害类型分布</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={{
              tooltip: { trigger: 'item' },
              series: [{
                type: 'pie', radius: ['42%', '72%'],
                data: disasterPieData,
                label: { color: '#c0c0c8', fontSize: 12 },
                itemStyle: { color: (p: any) => disasterColors[p.dataIndex % disasterColors.length] },
                emphasis: { label: { fontSize: 16, fontWeight: 'bold' }, scaleSize: 8 },
              }],
            }} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card className="glass-card" title={<span style={{ color: '#f0f0f0' }}>风险评估数据</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            <Table dataSource={assessments} columns={columnDefs} rowKey="id" size="small" pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card className="glass-card" title={<span style={{ color: '#f0f0f0' }}>活跃预警</span>} style={{ borderRadius: 'var(--radius-card)' }}>
            {alerts.slice(0, 5).map(a => (
              <Card key={a.id} size="small" className="stat-card" style={{ marginBottom: 10, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Tag color={severityHex[a.severity]}>{a.severity.toUpperCase()}</Tag>
                    <strong style={{ color: '#f0f0f0', marginLeft: 4 }}>{a.title}</strong>
                  </div>
                  {a.latitude && a.longitude && (
                    <Button size="small" type="primary" ghost icon={<EnvironmentOutlined />}
                      onClick={() => navigate(`/map?lat=${a.latitude}&lng=${a.longitude}&zoom=14`)}
                      style={{ borderRadius: 6, borderColor: 'var(--border-active)' }}>
                      地图定位
                    </Button>
                  )}
                </div>
                <p style={{ margin: '6px 0 0', color: '#a0a0a8', fontSize: 12 }}>{a.content}</p>
              </Card>
            ))}
            {alerts.length === 0 && <p style={{ color: '#606068', textAlign: 'center', padding: 20 }}>暂无活跃预警</p>}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
