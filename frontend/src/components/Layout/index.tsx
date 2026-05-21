import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  CloudServerOutlined,
  AlertOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HistoryOutlined,
  AimOutlined,
} from '@ant-design/icons';

const { Sider, Content } = AntLayout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据仪表盘' },
  { key: '/map', icon: <EnvironmentOutlined />, label: '风险地图' },
  { key: '/alerts', icon: <AlertOutlined />, label: '预警中心' },
  { key: '/servers', icon: <CloudServerOutlined />, label: '服务器管理' },
  { key: '/command', icon: <AimOutlined />, label: '应急指挥', disabled: true },
  { key: '/history', icon: <HistoryOutlined />, label: '历史记录', disabled: true },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;

  return (
    <AntLayout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: 'rgba(17, 22, 32, 0.95)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo area */}
        <div style={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid var(--border-subtle)',
          gap: 12,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-end))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            险
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>险析</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, whiteSpace: 'nowrap' }}>
                智能灾害风险评估与应急决策系统
              </div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[menuKey]}
          items={menuItems}
          onClick={({ key }) => { if (key !== '/command' && key !== '/history') navigate(key); }}
          style={{
            background: 'transparent',
            borderInlineEnd: 'none',
            marginTop: 8,
          }}
        />
      </Sider>

      <AntLayout style={{ background: 'transparent' }}>
        {/* Top header bar */}
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(17, 22, 32, 0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: 'var(--text-secondary)' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--risk-low)',
                boxShadow: '0 0 6px var(--risk-low)',
              }} />
              系统运行中
            </div>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
              style={{ color: 'var(--text-secondary)' }}
            >
              退出
            </Button>
          </div>
        </div>

        {/* Content */}
        <Content style={{ margin: 20, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
