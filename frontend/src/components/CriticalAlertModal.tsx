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
        <Button key="map" type="primary" danger icon={<EnvironmentOutlined />} onClick={handleViewMap} style={{ borderRadius: 6 }}>
          查看地图位置
        </Button>,
      ]}
      centered
      width={460}
      styles={{
        content: {
          background: '#1a0a0a',
          border: '1px solid rgba(255, 77, 79, 0.4)',
          boxShadow: '0 0 40px rgba(255, 77, 79, 0.3), 0 0 80px rgba(255, 77, 79, 0.1)',
          borderRadius: 16,
          animation: 'critical-pulse 2s ease-in-out infinite',
        },
        header: { background: 'transparent' },
        body: { background: 'transparent' },
      }}
      title={
        <Space>
          <WarningFilled style={{ color: '#ff4d4f', fontSize: 22, animation: 'critical-pulse 2s ease-in-out infinite' }} />
          <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 700 }}>高危预警</span>
        </Space>
      }
    >
      <div style={{ color: '#e8e8e8', marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <Tag color="red" style={{ fontSize: 13, padding: '2px 10px' }}>{alert.severity.toUpperCase()}</Tag>
          <strong style={{ fontSize: 16, marginLeft: 8 }}>{alert.title}</strong>
        </div>
        <p style={{ color: '#8c8c8c', lineHeight: 1.6 }}>{alert.content}</p>
        {alert.latitude && alert.longitude && (
          <p style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
            位置: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
          </p>
        )}
      </div>
    </Modal>
  );
}
