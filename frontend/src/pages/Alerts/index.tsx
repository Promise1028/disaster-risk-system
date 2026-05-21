import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Table, Tag, Timeline, Spin, Switch, Space, Button } from 'antd';
import { AlertOutlined, WarningOutlined, InfoCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { riskAPI } from '../../services/api';
import type { AlertRecord } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import CriticalAlertModal from '../../components/CriticalAlertModal';

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const severityTags: Record<string, string> = { critical: 'red', high: 'orange', medium: 'gold', low: 'green' };
const typeIcons: Record<string, any> = { early_warning: <WarningOutlined />, evacuation: <AlertOutlined />, info: <InfoCircleOutlined /> };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState<AlertRecord | null>(null);
  const criticalQueue = useRef<AlertRecord[]>([]);
  const showingModal = useRef(false);
  const navigate = useNavigate();

  const sortAlerts = (list: AlertRecord[]) => {
    return [...list].sort((a, b) => {
      const sa = severityOrder[a.severity] ?? 99;
      const sb = severityOrder[b.severity] ?? 99;
      if (sa !== sb) return sa - sb;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  };

  const showNextCritical = useCallback(() => {
    if (criticalQueue.current.length > 0 && !showingModal.current) {
      const next = criticalQueue.current.shift()!;
      showingModal.current = true;
      setCriticalAlert(next);
    }
  }, []);

  const closeCriticalModal = useCallback(() => {
    showingModal.current = false;
    setCriticalAlert(null);
    setTimeout(() => showNextCritical(), 300);
  }, [showNextCritical]);

  const handleWsMessage = useCallback((data: any) => {
    if (data.type === 'alert') {
      const newAlert: AlertRecord = data.data;
      if (newAlert.severity === 'critical') {
        criticalQueue.current.push(newAlert);
        showNextCritical();
      }
      setAlerts(prev => sortAlerts([newAlert, ...prev]).slice(0, 50));
    }
  }, [showNextCritical]);

  useWebSocket('/ws/alerts', handleWsMessage);

  useEffect(() => {
    riskAPI.getAlerts(activeOnly).then(data => setAlerts(sortAlerts(data))).finally(() => setLoading(false));
  }, [activeOnly]);

  const handleViewOnMap = (alert: AlertRecord) => {
    if (alert.latitude && alert.longitude) {
      navigate(`/map?lat=${alert.latitude}&lng=${alert.longitude}&zoom=14`);
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', width: 200 },
    {
      title: '类型', dataIndex: 'alert_type', key: 'alert_type',
      render: (v: string) => <Space>{typeIcons[v]}{v === 'early_warning' ? '预警' : v === 'evacuation' ? '疏散' : '通知'}</Space>,
    },
    {
      title: '严重程度', dataIndex: 'severity', key: 'severity',
      render: (v: string) => <Tag color={severityTags[v]} style={{ fontWeight: v === 'critical' ? 700 : 400 }}>{v.toUpperCase()}</Tag>,
    },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active',
      render: (v: boolean) => v ? <Tag color="red">活跃</Tag> : <Tag color="default">已解除</Tag>,
    },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: AlertRecord) =>
        record.latitude && record.longitude ? (
          <Button size="small" icon={<EnvironmentOutlined />} onClick={() => handleViewOnMap(record)} style={{ borderRadius: 6 }}>
            查看地图位置
          </Button>
        ) : null,
    },
    { title: '时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CriticalAlertModal alert={criticalAlert} onClose={closeCriticalModal} />

      <Card
        className="glass-card"
        title={<span style={{ color: 'var(--text-primary)' }}>预警中心</span>}
        extra={<Space><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>仅活跃</span><Switch checked={activeOnly} onChange={setActiveOnly} /></Space>}
        style={{ borderRadius: 'var(--radius-card)' }}
      >
        <Table
          dataSource={alerts}
          columns={columns}
          rowKey="id"
          size="small"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card className="glass-card" title={<span style={{ color: 'var(--text-primary)' }}>预警时间线</span>} style={{ borderRadius: 'var(--radius-card)' }}>
        <Timeline
          items={alerts.slice(0, 10).map(a => ({
            color: severityTags[a.severity],
            dot: a.severity === 'critical' ? <WarningOutlined style={{ color: '#ff4d4f', fontSize: 16 }} /> : undefined,
            children: (
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>{a.title}</strong>
                <Tag color={severityTags[a.severity]} style={{ marginLeft: 8 }}>{a.severity}</Tag>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{a.content}</p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.created_at}</span>
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
}
