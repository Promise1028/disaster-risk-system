import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Table, Tag, Timeline, Switch, Space, Button, Modal, Input, Select, message } from 'antd';
import { AlertOutlined, WarningOutlined, InfoCircleOutlined, EnvironmentOutlined, SendOutlined, InboxOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { riskAPI } from '../../services/api';
import type { AlertRecord } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import CriticalAlertModal from '../../components/CriticalAlertModal';

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const severityHex: Record<string, string> = { critical: '#ff3b30', high: '#ff9500', medium: '#ffcc00', low: '#34c759' };
const typeIcons: Record<string, any> = { early_warning: <WarningOutlined />, evacuation: <AlertOutlined />, info: <InfoCircleOutlined /> };
const statusMap: Record<string, { color: string; label: string }> = {
  active: { color: 'red', label: '活跃' },
  processing: { color: 'blue', label: '处置中' },
  archived: { color: 'default', label: '已归档' },
  resolved: { color: 'green', label: '已解除' },
};

interface AlertWithStatus extends AlertRecord {
  workflow_status?: 'active' | 'processing' | 'archived';
  disposition_note?: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [criticalAlert, setCriticalAlert] = useState<AlertRecord | null>(null);
  const criticalQueue = useRef<AlertRecord[]>([]);
  const showingModal = useRef(false);
  const [dispositionModal, setDispositionModal] = useState<AlertWithStatus | null>(null);
  const [dispositionNote, setDispositionNote] = useState('');
  const [dispositionStatus, setDispositionStatus] = useState<string>('processing');
  const navigate = useNavigate();

  const sortAlerts = (list: AlertWithStatus[]) => {
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
      setAlerts(prev => sortAlerts([{ ...newAlert, workflow_status: 'active' }, ...prev]).slice(0, 50));
    }
  }, [showNextCritical]);

  useWebSocket('/ws/alerts', handleWsMessage);

  useEffect(() => {
    riskAPI.getAlerts(activeOnly)
      .then(data => setAlerts(sortAlerts(data.map(a => ({ ...a, workflow_status: 'active' as const })))))
      .finally(() => setLoading(false));
  }, [activeOnly]);

  const handleViewOnMap = (alert: AlertWithStatus) => {
    if (alert.latitude && alert.longitude) {
      navigate(`/map?lat=${alert.latitude}&lng=${alert.longitude}&zoom=14`);
    }
  };

  const handleDisposition = (alert: AlertWithStatus) => {
    setDispositionModal(alert);
    setDispositionNote(alert.disposition_note || '');
    setDispositionStatus(alert.workflow_status || 'processing');
  };

  const submitDisposition = () => {
    if (!dispositionModal) return;
    setAlerts(prev => prev.map(a =>
      a.id === dispositionModal.id
        ? { ...a, workflow_status: dispositionStatus as AlertWithStatus['workflow_status'], disposition_note: dispositionNote }
        : a
    ));
    message.success('处置记录已保存');
    setDispositionModal(null);
  };

  const handleSimulateNotification = (alert: AlertWithStatus) => {
    message.success(`已模拟向市民发送「${alert.title}」预警通知 (Push + 短信)`);
  };

  const tagStyle = (severity: string) => {
    const base: React.CSSProperties = { fontWeight: 700, fontSize: 12, textShadow: '0 0 6px currentColor' };
    switch (severity) {
      case 'critical': return { ...base, background: 'rgba(255,59,48,0.22)', color: '#ff3b30', border: '1px solid rgba(255,59,48,0.3)' };
      case 'high': return { ...base, background: 'rgba(255,149,0,0.2)', color: '#ff9500', border: '1px solid rgba(255,149,0,0.25)' };
      case 'medium': return { ...base, background: 'rgba(255,204,0,0.16)', color: '#ffcc00', border: '1px solid rgba(255,204,0,0.2)' };
      case 'low': return { ...base, background: 'rgba(52,199,89,0.16)', color: '#34c759', border: '1px solid rgba(52,199,89,0.2)' };
      default: return base;
    }
  };

  const timelineBorderColor = (severity: string) => {
    return severityHex[severity] || '#606068';
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', width: 180,
      render: (v: string, r: AlertWithStatus) => (
        <Space>
          {r.severity === 'critical' && <WarningOutlined style={{ color: '#ff3b30', animation: 'critical-pulse 2s ease-in-out infinite' }} />}
          <span style={{ color: '#f0f0f0', fontWeight: r.severity === 'critical' ? 700 : 400 }}>{v}</span>
        </Space>
      ),
    },
    {
      title: '类型', dataIndex: 'alert_type', key: 'alert_type',
      render: (v: string) => <Space>{typeIcons[v]}{v === 'early_warning' ? '预警' : v === 'evacuation' ? '疏散' : '通知'}</Space>,
    },
    {
      title: '严重程度', dataIndex: 'severity', key: 'severity',
      render: (v: string) => (
        <Tag style={tagStyle(v)}>{v.toUpperCase()}</Tag>
      ),
    },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '状态', dataIndex: 'workflow_status', key: 'workflow_status',
      render: (v: string) => {
        const s = statusMap[v || 'active'];
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 170 },
    {
      title: '操作', key: 'actions', width: 220,
      render: (_: any, record: AlertWithStatus) => (
        <Space size={4} wrap>
          {record.latitude && record.longitude && (
            <Button size="small" type="primary" ghost icon={<EnvironmentOutlined />}
              onClick={() => handleViewOnMap(record)} style={{ borderRadius: 6, borderColor: 'var(--border-active)' }}>
              地图
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />}
            onClick={() => handleDisposition(record)} style={{ borderRadius: 6 }}>
            处置
          </Button>
          <Button size="small" icon={<SendOutlined />}
            onClick={() => handleSimulateNotification(record)} style={{ borderRadius: 6 }}>
            通知
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CriticalAlertModal alert={criticalAlert} onClose={closeCriticalModal} />

      <Card className="glass-card"
        title={<Space><AlertOutlined style={{ color: '#ff3b30' }} /><span style={{ color: '#f0f0f0' }}>预警中心</span></Space>}
        extra={<Space><span style={{ color: '#a0a0a8', fontSize: 13 }}>仅活跃</span><Switch checked={activeOnly} onChange={setActiveOnly} /></Space>}
        style={{ borderRadius: 'var(--radius-card)' }}>
        <Table dataSource={alerts} columns={columns} rowKey="id" size="small"
          loading={loading} pagination={{ pageSize: 10 }}
          rowClassName={(record) => record.severity === 'critical' ? 'critical-row' : ''} />
      </Card>

      <Card className="glass-card"
        title={<Space><InboxOutlined style={{ color: '#4096ff' }} /><span style={{ color: '#f0f0f0' }}>预警时间线</span></Space>}
        style={{ borderRadius: 'var(--radius-card)' }}>
        <Timeline
          items={alerts.slice(0, 10).map(a => ({
            color: severityHex[a.severity],
            dot: a.severity === 'critical'
              ? <WarningOutlined style={{ color: '#ff3b30', fontSize: 16, animation: 'critical-pulse 2s ease-in-out infinite' }} />
              : a.severity === 'high' ? <AlertOutlined style={{ color: '#ff9500', fontSize: 14 }} />
              : undefined,
            children: (
              <div style={{ borderLeft: `3px solid ${timelineBorderColor(a.severity)}`, paddingLeft: 12, borderRadius: '0 4px 4px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#f0f0f0' }}>{a.title}</strong>
                  <Tag style={tagStyle(a.severity)}>{a.severity.toUpperCase()}</Tag>
                </div>
                <p style={{ color: '#a0a0a8', fontSize: 12, margin: '4px 0' }}>{a.content}</p>
                <span style={{ fontSize: 11, color: '#606068' }}>{a.created_at}</span>
              </div>
            ),
          }))} />
      </Card>

      {/* Disposition modal */}
      <Modal
        open={!!dispositionModal}
        title={<span style={{ color: '#f0f0f0' }}>处置记录 — {dispositionModal?.title}</span>}
        onCancel={() => setDispositionModal(null)}
        onOk={submitDisposition}
        okText="保存"
        width={480}
        styles={{
          header: { background: 'transparent' },
          body: { background: '#0d1322', borderRadius: 12 },
        }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ color: '#a0a0a8', display: 'block', marginBottom: 6 }}>处置状态</label>
            <Select
              value={dispositionStatus}
              onChange={setDispositionStatus}
              style={{ width: '100%' }}
              options={[
                { value: 'processing', label: '处置中' },
                { value: 'archived', label: '已归档' },
                { value: 'resolved', label: '已解除' },
              ]} />
          </div>
          <div>
            <label style={{ color: '#a0a0a8', display: 'block', marginBottom: 6 }}>处置备注</label>
            <Input.TextArea
              value={dispositionNote}
              onChange={e => setDispositionNote(e.target.value)}
              rows={4}
              placeholder="记录处置措施、人员安排等信息…" />
          </div>
        </div>
      </Modal>

      <style>{`
        .critical-row { background: rgba(255,59,48,0.04) !important; }
        .critical-row:hover { background: rgba(255,59,48,0.08) !important; }
        @keyframes critical-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,59,48,0.3), 0 0 60px rgba(255,59,48,0.1); }
          50% { box-shadow: 0 0 40px rgba(255,59,48,0.5), 0 0 100px rgba(255,59,48,0.2); }
        }
      `}</style>
    </div>
  );
}
