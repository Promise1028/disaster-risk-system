import { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Timeline, Spin, Switch, Space } from 'antd';
import { AlertOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { riskAPI } from '../../services/api';
import type { AlertRecord } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';

const severityColors: Record<string, string> = { critical: 'red', high: 'orange', medium: 'gold', low: 'green' };
const typeIcons: Record<string, any> = { early_warning: <WarningOutlined />, evacuation: <AlertOutlined />, info: <InfoCircleOutlined /> };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);

  const handleWsMessage = useCallback((data: any) => {
    if (data.type === 'alert') {
      setAlerts(prev => [data.data, ...prev].slice(0, 50));
    }
  }, []);

  useWebSocket('/ws/alerts', handleWsMessage);

  useEffect(() => {
    riskAPI.getAlerts(activeOnly).then(setAlerts).finally(() => setLoading(false));
  }, [activeOnly]);

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', width: 200 },
    {
      title: '类型', dataIndex: 'alert_type', key: 'alert_type',
      render: (v: string) => <Space>{typeIcons[v]}{v === 'early_warning' ? '预警' : v === 'evacuation' ? '疏散' : '通知'}</Space>,
    },
    {
      title: '严重程度', dataIndex: 'severity', key: 'severity',
      render: (v: string) => <Tag color={severityColors[v]}>{v.toUpperCase()}</Tag>,
    },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active',
      render: (v: boolean) => v ? <Tag color="red">活跃</Tag> : <Tag color="default">已解除</Tag>,
    },
    { title: '时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  return (
    <div>
      <Card
        title="预警中心"
        extra={<Space>仅活跃<Switch checked={activeOnly} onChange={setActiveOnly} /></Space>}
      >
        <Table dataSource={alerts} columns={columns} rowKey="id" size="small" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
      <Card title="预警时间线" style={{ marginTop: 16 }}>
        <Timeline
          items={alerts.slice(0, 10).map(a => ({
            color: severityColors[a.severity],
            children: (
              <div>
                <strong>{a.title}</strong>
                <Tag color={severityColors[a.severity]} style={{ marginLeft: 8 }}>{a.severity}</Tag>
                <p style={{ color: '#666', fontSize: 12 }}>{a.content}</p>
                <span style={{ fontSize: 11, color: '#999' }}>{a.created_at}</span>
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
}
