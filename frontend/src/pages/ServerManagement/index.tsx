import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Progress, Statistic, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { riskAPI } from '../../services/api';
import type { ServerStatus } from '../../services/api';

const statusIcons: Record<string, any> = { online: <CheckCircleOutlined style={{ color: '#52c41a' }} />, offline: <CloseCircleOutlined style={{ color: '#f5222d' }} />, degraded: <ExclamationCircleOutlined style={{ color: '#fa8c16' }} /> };
const riskColors: Record<string, string> = { critical: '#f5222d', high: '#fa8c16', medium: '#faad14', low: '#52c41a' };

export default function ServerManagement() {
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    riskAPI.getServers().then(setServers).finally(() => setLoading(false));
    const interval = setInterval(() => { riskAPI.getServers().then(setServers); }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;

  const columns = [
    { title: '服务器名称', dataIndex: 'name', key: 'name' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => <Tag icon={statusIcons[v]}>{v.toUpperCase()}</Tag>,
    },
    {
      title: 'CPU使用率', dataIndex: 'cpu_usage', key: 'cpu_usage',
      render: (v: number) => <Progress percent={v} size="small" status={v > 80 ? 'exception' : v > 60 ? 'active' : 'normal'} />,
    },
    {
      title: '内存使用率', dataIndex: 'memory_usage', key: 'memory_usage',
      render: (v: number) => <Progress percent={v} size="small" status={v > 80 ? 'exception' : v > 60 ? 'active' : 'normal'} />,
    },
    { title: '传感器数', dataIndex: 'sensor_count', key: 'sensor_count' },
    {
      title: '区域风险', dataIndex: 'region_risk_level', key: 'region_risk_level',
      render: (v: string) => <Tag color={riskColors[v]}>{v.toUpperCase()}</Tag>,
    },
  ];

  const serverGaugeOption = {
    series: [
      { type: 'gauge', startAngle: 210, endAngle: -30, center: ['50%', '60%'], radius: '80%',
        min: 0, max: 100,
        axisLine: { lineStyle: { width: 20, color: [[0.4, '#52c41a'], [0.7, '#faad14'], [1, '#f5222d']] } },
        pointer: { length: '70%', width: 8 },
        detail: { fontSize: 20, formatter: '{value}%' },
        data: [{ value: servers.length > 0 ? servers[0].cpu_usage : 0, name: '平均CPU使用率' }],
      },
    ],
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card><Statistic title="服务器总数" value={servers.length} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="在线" value={servers.filter(s => s.status === 'online').length} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="降级" value={servers.filter(s => s.status === 'degraded').length} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="离线" value={servers.filter(s => s.status === 'offline').length} valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title="CPU负载">
            <ReactECharts option={serverGaugeOption} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col span={16}>
          <Card title="服务器详情">
            <Table dataSource={servers} columns={columns} rowKey="id" size="small" pagination={false} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
