import { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Table, Tag, Statistic, Spin, Select, Button, Space } from 'antd';
import {
  HistoryOutlined, AlertOutlined, ThunderboltOutlined, SafetyOutlined,
  DownloadOutlined, WarningOutlined, FilterOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { riskAPI } from '../../services/api';
import type { DisasterEvent, AlertRecord, RiskAssessment } from '../../services/api';
import dayjs from 'dayjs';

const severityHex: Record<string, string> = { critical: '#ff3b30', high: '#ff9500', medium: '#ffcc00', low: '#34c759' };
const disasterLabels: Record<string, string> = { earthquake: '地震', flood: '洪水', typhoon: '台风', landslide: '滑坡', fire: '火灾' };

type FilterPeriod = '7d' | '30d' | '90d' | 'all';

export default function HistoryRecords() {
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('30d');
  const [disasterTypeFilter, setDisasterTypeFilter] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      riskAPI.getDisasters(),
      riskAPI.getAlerts(false),
      riskAPI.getAssessments(),
    ]).then(([d, a, as]) => {
      setDisasters(d); setAlerts(a); setAssessments(as);
    }).finally(() => setLoading(false));
  }, []);

  const cutoffDate = useMemo(() => {
    if (filterPeriod === 'all') return null;
    const days = filterPeriod === '7d' ? 7 : filterPeriod === '30d' ? 30 : 90;
    return dayjs().subtract(days, 'day').format('YYYY-MM-DD');
  }, [filterPeriod]);

  const filteredDisasters = useMemo(() => {
    let list = disasters;
    if (cutoffDate) list = list.filter(d => (d.created_at || '') >= cutoffDate);
    if (disasterTypeFilter.length > 0) list = list.filter(d => disasterTypeFilter.includes(d.disaster_type));
    return [...list].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [disasters, cutoffDate, disasterTypeFilter]);

  const filteredAlerts = useMemo(() => {
    let list = alerts;
    if (cutoffDate) list = list.filter(a => (a.created_at || '') >= cutoffDate);
    return [...list].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [alerts, cutoffDate]);

  const filteredAssessments = useMemo(() => {
    if (cutoffDate) return assessments; // assessments don't have date, skip filtering
    return assessments;
  }, [assessments, cutoffDate]);

  // Stats
  const totalDisasters = filteredDisasters.length;
  const criticalCount = filteredDisasters.filter(d => d.severity === 'critical').length;
  const totalAffected = filteredDisasters.reduce((s, d) => s + (d.affected_population || 0), 0);
  const totalAlerts = filteredAlerts.length;
  const avgRiskScore = filteredAssessments.length > 0
    ? Math.round(filteredAssessments.reduce((s, a) => s + a.risk_score, 0) / filteredAssessments.length)
    : 0;

  // Historical trend chart - disasters by month
  const monthBuckets = useMemo(() => {
    const buckets: Record<string, number> = {};
    filteredDisasters.forEach(d => {
      const m = (d.created_at || '').substring(0, 7);
      if (m) buckets[m] = (buckets[m] || 0) + 1;
    });
    return Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredDisasters]);

  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category' as const, data: monthBuckets.map(([m]) => m), axisLabel: { color: '#a0a0a8' }, axisLine: { lineStyle: { color: 'rgba(64,128,255,0.2)' } } },
    yAxis: { type: 'value' as const, name: '次数', axisLabel: { color: '#a0a0a8' }, splitLine: { lineStyle: { color: 'rgba(64,128,255,0.06)' } } },
    series: [{
      type: 'bar', data: monthBuckets.map(([, c]) => ({ value: c, itemStyle: { borderRadius: [6,6,0,0], color: '#4096ff', shadowBlur: 8, shadowColor: 'rgba(64,150,255,0.3)' } })),
      barWidth: '50%',
    }],
  };

  const disasterColumns = [
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'disaster_type', key: 'type', render: (v: string) => disasterLabels[v] || v },
    { title: '严重程度', dataIndex: 'severity', key: 'severity',
      render: (v: string) => <Tag style={{ background: `${severityHex[v]}22`, color: severityHex[v], fontWeight: 700, border: `1px solid ${severityHex[v]}33` }}>{v.toUpperCase()}</Tag> },
    { title: '影响范围', dataIndex: 'radius_km', key: 'radius', render: (v: number) => `${v} km` },
    { title: '影响人口', dataIndex: 'affected_population', key: 'pop', render: (v: number) => v.toLocaleString() },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => {
        const colors: Record<string, string> = { active: 'red', monitoring: 'orange', resolved: 'green', archived: 'default' };
        return <Tag color={colors[v] || 'default'}>{v === 'active' ? '活跃' : v === 'monitoring' ? '监控中' : v === 'resolved' ? '已解决' : '已归档'}</Tag>;
      }},
  ];

  const alertColumns = [
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'alert_type', key: 'type',
      render: (v: string) => v === 'early_warning' ? '预警' : v === 'evacuation' ? '疏散' : '通知' },
    { title: '严重程度', dataIndex: 'severity', key: 'severity',
      render: (v: string) => <Tag style={{ background: `${severityHex[v]}22`, color: severityHex[v], fontWeight: 700, border: `1px solid ${severityHex[v]}33` }}>{v.toUpperCase()}</Tag> },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '状态', dataIndex: 'is_active', key: 'active',
      render: (v: boolean) => v ? <Tag color="red">活跃</Tag> : <Tag>已解除</Tag> },
  ];

  const assessmentColumns = [
    { title: '区域', dataIndex: 'zone_name', key: 'zone' },
    { title: '灾害类型', dataIndex: 'disaster_type', key: 'type', render: (v: string) => disasterLabels[v] || v },
    { title: '风险等级', dataIndex: 'risk_level', key: 'level',
      render: (v: string) => <Tag style={{ background: `${severityHex[v]}22`, color: severityHex[v], fontWeight: 700 }}>{v.toUpperCase()}</Tag> },
    { title: '风险评分', dataIndex: 'risk_score', key: 'score', sorter: (a: any, b: any) => a.risk_score - b.risk_score },
    { title: '影响人口', dataIndex: 'population_total', key: 'pop', render: (v: number) => v.toLocaleString() },
    { title: '预估损失(万元)', dataIndex: 'estimated_loss', key: 'loss', render: (v: number) => v.toLocaleString() },
  ];

  const handleExport = () => {
    const data = {
      灾害事件: filteredDisasters,
      预警记录: filteredAlerts,
      风险评估: filteredAssessments,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `历史记录导出_${dayjs().format('YYYY-MM-DD')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <Row gutter={16} align="middle">
        <Col>
          <Space>
            <FilterOutlined style={{ color: '#4096ff' }} />
            <span style={{ color: '#a0a0a8', fontSize: 13 }}>时间范围:</span>
            <Select value={filterPeriod} onChange={setFilterPeriod} style={{ width: 120 }}
              options={[
                { value: '7d', label: '最近7天' }, { value: '30d', label: '最近30天' },
                { value: '90d', label: '最近90天' }, { value: 'all', label: '全部' },
              ]} />
            <span style={{ color: '#a0a0a8', fontSize: 13 }}>灾害类型:</span>
            <Select mode="multiple" style={{ width: 220 }} placeholder="全部类型" allowClear
              value={disasterTypeFilter} onChange={setDisasterTypeFilter}
              options={Object.entries(disasterLabels).map(([k, v]) => ({ value: k, label: v }))} />
          </Space>
        </Col>
        <Col flex="auto" style={{ textAlign: 'right' }}>
          <Button icon={<DownloadOutlined />} onClick={handleExport}
            style={{ borderRadius: 8, borderColor: 'var(--border-active)', color: '#4096ff' }}>
            导出数据
          </Button>
        </Col>
      </Row>

      {/* Summary stats */}
      <Row gutter={[16, 16]}>
        {[
          { title: '灾害事件', value: totalDisasters, icon: <ThunderboltOutlined style={{ color: '#ff3b30' }} />, color: '#ff3b30' },
          { title: '高危事件', value: criticalCount, icon: <WarningOutlined style={{ color: '#ff9500' }} />, color: '#ff9500' },
          { title: '影响总人口', value: totalAffected, icon: <AlertOutlined style={{ color: '#4096ff' }} />, color: '#4096ff', fmt: (v: number) => v.toLocaleString() },
          { title: '预警总数', value: totalAlerts, icon: <HistoryOutlined style={{ color: '#34c759' }} />, color: '#34c759' },
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

      {/* Trend chart */}
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card className="glass-card"
            title={<Space><HistoryOutlined style={{ color: '#4096ff' }} /><span style={{ color: '#f0f0f0' }}>灾害事件趋势</span></Space>}
            style={{ borderRadius: 'var(--radius-card)' }}>
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="glass-card"
            title={<Space><SafetyOutlined style={{ color: '#34c759' }} /><span style={{ color: '#f0f0f0' }}>历史概览</span></Space>}
            style={{ borderRadius: 'var(--radius-card)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#a0a0a8' }}>平均风险评分</span>
                <strong style={{ color: avgRiskScore > 70 ? '#ff3b30' : avgRiskScore > 40 ? '#ff9500' : '#34c759', fontSize: 18 }}>{avgRiskScore}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#a0a0a8' }}>高危灾害占比</span>
                <strong style={{ color: '#ff3b30', fontSize: 18 }}>{totalDisasters > 0 ? Math.round((criticalCount / totalDisasters) * 100) : 0}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#a0a0a8' }}>已解决灾害</span>
                <strong style={{ color: '#34c759', fontSize: 18 }}>{filteredDisasters.filter(d => d.status === 'resolved').length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: '#a0a0a8' }}>时间范围</span>
                <strong style={{ color: '#f0f0f0' }}>{filterPeriod === 'all' ? '全部' : `最近${filterPeriod === '7d' ? '7' : filterPeriod === '30d' ? '30' : '90'}天`}</strong>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Data tables */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card className="glass-card"
            title={<Space><ThunderboltOutlined style={{ color: '#ff3b30' }} /><span style={{ color: '#f0f0f0' }}>灾害历史</span></Space>}
            style={{ borderRadius: 'var(--radius-card)' }}>
            <Table dataSource={filteredDisasters} columns={disasterColumns} rowKey="id" size="small" pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="glass-card"
            title={<Space><AlertOutlined style={{ color: '#ff9500' }} /><span style={{ color: '#f0f0f0' }}>预警历史</span></Space>}
            style={{ borderRadius: 'var(--radius-card)' }}>
            <Table dataSource={filteredAlerts} columns={alertColumns} rowKey="id" size="small" pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card className="glass-card"
            title={<Space><SafetyOutlined style={{ color: '#4096ff' }} /><span style={{ color: '#f0f0f0' }}>风险评估历史</span></Space>}
            style={{ borderRadius: 'var(--radius-card)' }}>
            <Table dataSource={filteredAssessments} columns={assessmentColumns} rowKey="id" size="small" pagination={{ pageSize: 10 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
