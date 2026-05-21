import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AdminLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RiskMapPage from './pages/RiskMap';
import ServerManagement from './pages/ServerManagement';
import AlertsPage from './pages/Alerts';
import EmergencyCommand from './pages/EmergencyCommand';
import HistoryRecords from './pages/HistoryRecords';
import Login from './pages/Login';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter basename="/disaster-risk-system">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<RiskMapPage />} />
            <Route path="/servers" element={<ServerManagement />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/command" element={<EmergencyCommand />} />
            <Route path="/history" element={<HistoryRecords />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
