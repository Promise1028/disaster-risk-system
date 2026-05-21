import { Modal, Tag, Space, Button } from 'antd';
import { WarningFilled, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { AlertRecord } from '../services/api';

interface Props {
  alert: AlertRecord | null;
  onClose: () => void;
}

export default function CriticalAlertModal({ alert, onClose }: Props) {
  const navigate = useNavigate();
  if (!alert) return null;

  const handleViewMap = () => {
    navigate(`/map?lat=${alert.latitude}&lng=${alert.longitude}&zoom=14`);
    onClose();
  };

  return (
    <Modal
      open={!!alert}
      onCancel={onClose}
      footer={[
        <Button key="dismiss" onClick={onClose} style={{ borderRadius: 6 }}>忽略</Button>,
        <Button key="map" type="primary" danger icon={<EnvironmentOutlined />} onClick={handleViewMap}
          style={{ borderRadius: 6, boxShadow: '0 0 16px rgba(255,59,48,0.3)' }}>
          查看地图位置
        </Button>,
      ]}
      centered
      width={480}
      styles={{
        header: { background: 'transparent' },
        body: {
          background: 'linear-gradient(135deg, #1a0808 0%, #0d0a14 100%)',
          border: '1px solid rgba(255, 59, 48, 0.5)',
          boxShadow: '0 0 40px rgba(255, 59, 48, 0.35), 0 0 80px rgba(255, 59, 48, 0.12), inset 0 0 30px rgba(255, 59, 48, 0.03)',
          borderRadius: 16,
          animation: 'critical-pulse 2s ease-in-out infinite',
        },
      }}
      title={
        <Space>
          <WarningFilled style={{ color: '#ff3b30', fontSize: 24, animation: 'critical-pulse 2s ease-in-out infinite', filter: 'drop-shadow(0 0 10px rgba(255,59,48,0.5))' }} />
          <span style={{ color: '#ff3b30', fontSize: 18, fontWeight: 700, textShadow: '0 0 10px rgba(255,59,48,0.3)' }}>高危预警 · 立即关注</span>
        </Space>
      }
    >
      <div style={{ color: '#f0f0f0', marginBottom: 12 }}>
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag style={{ background: 'rgba(255,59,48,0.25)', color: '#ff3b30', border: '1px solid rgba(255,59,48,0.4)', fontWeight: 700, fontSize: 13, padding: '2px 10px' }}>
            {alert.severity.toUpperCase()}
          </Tag>
          <strong style={{ fontSize: 16, color: '#f0f0f0' }}>{alert.title}</strong>
        </div>
        <p style={{ color: '#c0c0c8', lineHeight: 1.7, fontSize: 14 }}>{alert.content}</p>
        {alert.latitude && alert.longitude && (
          <p style={{ color: '#a0a0a8', fontSize: 12, marginTop: 10 }}>
            🎯 位置: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
          </p>
        )}
      </div>
    </Modal>
  );
}
