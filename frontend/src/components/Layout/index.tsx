import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, theme } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  CloudServerOutlined,
  AlertOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = AntLayout;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '数据仪表盘' },
    { key: '/map', icon: <EnvironmentOutlined />, label: '风险地图' },
    { key: '/servers', icon: <CloudServerOutlined />, label: '服务器管理' },
    { key: '/alerts', icon: <AlertOutlined />, label: '预警中心' },
  ];

  const menuKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: collapsed ? 14 : 16, whiteSpace: 'nowrap' }}>
          {collapsed ? '灾评' : '灾害风险评估系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[menuKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: '0 24px', background: themeToken.colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Button icon={<LogoutOutlined />} onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>
            退出登录
          </Button>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: themeToken.colorBgContainer, borderRadius: 8, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
