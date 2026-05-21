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
      axisLabel: { color: '#8c8c8c', formatter: (v: number) => v >= 10000 ? `${(v/10000).toFixed(1)}万` : String(v) },
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
