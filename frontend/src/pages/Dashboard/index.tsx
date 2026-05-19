import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin } from 'antd';
import {
  TeamOutlined, AlertOutlined, ThunderboltOutlined, SafetyOutlined,
  CloudServerOutlined, DollarOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { riskAPI } from '../../services/api';
import type { DashboardStats, RiskAssessment, AlertRecord } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';

const riskColors: Record<string, string> = { critical: '#f5222d', high: '#fa8c16', medium: '#faad14', low: '#52c41a' };
const severityColors: Record<string, string> = { critical: 'red', high: 'orange', medium: 'gold', low: 'green' };

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
    ]).then(([s, a, al]) => {
      setStats(s);
      setAssessments(a);
      setAlerts(al);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;

  const pieData = Object.entries(stats.risk_level_distribution).map(([name, value]) => ({
    name, value, itemStyle: { color: riskColors[name] || '#999' },
  }));

  const disasterPieData = Object.entries(stats.disaster_type_distribution).map(([name, value]) => ({
    name, value,
  }));

  const columnDefs = [
    { title: '区域', dataIndex: 'zone_name', key: 'zone_name' },
    { title: '灾害类型', dataIndex: 'disaster_type', key: 'disaster_type' },
    {
      title: '风险等级', dataIndex: 'risk_level', key: 'risk_level',
      render: (v: string) => <Tag color={riskColors[v]}>{v.toUpperCase()}</Tag>,
    },
    { title: '风险评分', dataIndex: 'risk_score', key: 'risk_score', sorter: (a: any, b: any) => a.risk_score - b.risk_score },
    { title: '影响人口', dataIndex: 'population_total', key: 'population_total', render: (v: number) => v.toLocaleString() },
    { title: '预估损失(万元)', dataIndex: 'estimated_loss', key: 'estimated_loss', render: (v: number) => v.toLocaleString() },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card><Statistic title="区域总人数" value={stats.total_population} prefix={<TeamOutlined />} formatter={v => (v as number).toLocaleString()} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="预警次数" value={stats.total_alerts} prefix={<AlertOutlined />} valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="活跃灾害" value={stats.active_disasters} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="在线服务器" value={`${stats.online_servers}/${stats.total_servers}`} prefix={<CloudServerOutlined />} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card><Statistic title="人员密度(人/km²)" value={stats.avg_population_density} precision={0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="情绪指数" value={stats.avg_emotion_index} precision={2} suffix="/1.0" valueStyle={{ color: (stats.avg_emotion_index || 0) < 0.4 ? '#cf1322' : '#3f8600' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="指导人员" value={stats.total_guides} prefix={<SafetyOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="预估总损失(万元)" value={stats.estimated_total_loss} prefix={<DollarOutlined />} precision={1} valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="风险等级分布">
            <ReactECharts option={{
              tooltip: { trigger: 'item' },
              series: [{ type: 'pie', radius: ['40%', '70%'], data: pieData, label: { formatter: '{b}: {c}' } }],
            }} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="灾害类型分布">
            <ReactECharts option={{
              tooltip: { trigger: 'item' },
              series: [{ type: 'pie', radius: ['40%', '70%'], data: disasterPieData, label: { formatter: '{b}: {c}' }, itemStyle: { color: (p: any) => ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de'][p.dataIndex] } }],
            }} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="风险评估数据">
            <Table dataSource={assessments} columns={columnDefs} rowKey="id" size="small" pagination={{ pageSize: 5 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="活跃预警">
            {alerts.map(a => (
              <Card key={a.id} size="small" style={{ marginBottom: 8 }}>
                <Tag color={severityColors[a.severity]}>{a.severity.toUpperCase()}</Tag>
                <strong>{a.title}</strong>
                <p style={{ margin: '4px 0 0', color: '#666', fontSize: 12 }}>{a.content}</p>
              </Card>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
