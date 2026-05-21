import { useState } from 'react';
import { Card, Form, Input, Button, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onLogin = async (values: any) => {
    setLoading(true);
    try {
      const res = await authAPI.login(values.username, values.password);
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('role', res.role);
      message.success('登录成功');
      navigate('/');
    } catch {
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: any) => {
    setLoading(true);
    try {
      await authAPI.register(values.username, values.email, values.password);
      message.success('注册成功，请登录');
    } catch {
      message.error('注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      background: '#080b14',
      backgroundImage: `
        radial-gradient(ellipse at 30% 20%, rgba(64,128,255,0.08) 0%, transparent 60%),
        radial-gradient(ellipse at 70% 60%, rgba(0,180,255,0.05) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(64,150,255,0.04) 0%, transparent 50%)
      `,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated tech lines background */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(64,128,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(64,128,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        opacity: 0.5,
        pointerEvents: 'none',
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '10%', width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(64,128,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
        animation: 'critical-pulse 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '15%', width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(0,200,255,0.04) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
        animation: 'critical-pulse 8s ease-in-out infinite reverse',
      }} />

      {/* Login card */}
      <Card style={{
        width: 420, zIndex: 1,
        background: 'rgba(13,19,34,0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(64,128,255,0.18)',
        borderRadius: 16,
        boxShadow: '0 0 40px rgba(64,128,255,0.08), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}>
        {/* Brand section */}
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
          {/* Decorative top line */}
          <div style={{
            width: 60, height: 2, margin: '0 auto 16px',
            background: 'linear-gradient(90deg, transparent, rgba(64,150,255,0.6), transparent)',
            borderRadius: 1,
          }} />

          <div style={{
            fontSize: 36, fontWeight: 800, marginBottom: 6,
            background: 'linear-gradient(135deg, #4096ff 0%, #00d4ff 50%, #4096ff 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(64,150,255,0.4)',
            letterSpacing: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <ThunderboltOutlined style={{ fontSize: 28, color: '#00d4ff', filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.5))' }} />
            险析
          </div>
          <div style={{ fontSize: 12, color: '#606080', letterSpacing: 2, fontWeight: 500 }}>
            智能灾害风险评估与应急决策系统
          </div>

          {/* Decorative bottom line */}
          <div style={{
            width: 120, height: 1, margin: '12px auto 0',
            background: 'linear-gradient(90deg, transparent, rgba(64,150,255,0.3), transparent)',
            borderRadius: 1,
          }} />
        </div>

        <Tabs
          centered
          items={[
            {
              key: 'login',
              label: <span style={{ color: '#c0c0c8' }}>登录</span>,
              children: (
                <Form onFinish={onLogin} size="large">
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input
                      prefix={<UserOutlined style={{ color: '#606080' }} />}
                      placeholder="用户名"
                      style={{
                        background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(64,128,255,0.15)',
                        color: '#f0f0f0', borderRadius: 8, height: 44,
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(64,150,255,0.4)'; e.target.style.boxShadow = '0 0 12px rgba(64,150,255,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(64,128,255,0.15)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#606080' }} />}
                      placeholder="密码"
                      style={{
                        background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(64,128,255,0.15)',
                        color: '#f0f0f0', borderRadius: 8, height: 44,
                      }}
                      onFocus={e => { const el = e.target as HTMLElement; const wrapper = el.closest('.ant-input-affix-wrapper') as HTMLElement; if (wrapper) { wrapper.style.borderColor = 'rgba(64,150,255,0.4)'; wrapper.style.boxShadow = '0 0 12px rgba(64,150,255,0.1)'; } }}
                      onBlur={e => { const el = e.target as HTMLElement; const wrapper = el.closest('.ant-input-affix-wrapper') as HTMLElement; if (wrapper) { wrapper.style.borderColor = 'rgba(64,128,255,0.15)'; wrapper.style.boxShadow = 'none'; } }}
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 8 }}>
                    <Button type="primary" htmlType="submit" block loading={loading}
                      style={{
                        height: 44, borderRadius: 8, fontWeight: 600, fontSize: 15,
                        background: 'linear-gradient(135deg, #4096ff 0%, #1677ff 100%)',
                        border: 'none',
                        boxShadow: '0 0 16px rgba(64,150,255,0.25)',
                      }}>
                      登录
                    </Button>
                  </Form.Item>
                  <div style={{ textAlign: 'center', marginTop: 4 }}>
                    <a style={{ color: '#606080', fontSize: 12, cursor: 'pointer' }}
                      onClick={() => message.info('请联系管理员重置密码')}>
                      忘记密码？
                    </a>
                  </div>
                  <div style={{
                    textAlign: 'center', marginTop: 12,
                    padding: '8px 12px', borderRadius: 6,
                    background: 'rgba(64,128,255,0.04)',
                    border: '1px solid rgba(64,128,255,0.1)',
                    color: '#606080', fontSize: 11,
                  }}>
                    演示账号: admin / admin123
                  </div>
                </Form>
              ),
            },
            {
              key: 'register',
              label: <span style={{ color: '#c0c0c8' }}>注册</span>,
              children: (
                <Form onFinish={onRegister} size="large">
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input
                      prefix={<UserOutlined style={{ color: '#606080' }} />}
                      placeholder="用户名"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(64,128,255,0.15)', color: '#f0f0f0', borderRadius: 8, height: 44 }}
                    />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                    <Input
                      prefix={<MailOutlined style={{ color: '#606080' }} />}
                      placeholder="邮箱"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(64,128,255,0.15)', color: '#f0f0f0', borderRadius: 8, height: 44 }}
                    />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#606080' }} />}
                      placeholder="密码"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(64,128,255,0.15)', color: '#f0f0f0', borderRadius: 8, height: 44 }}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}
                      style={{
                        height: 44, borderRadius: 8, fontWeight: 600, fontSize: 15,
                        background: 'linear-gradient(135deg, #4096ff 0%, #1677ff 100%)',
                        border: 'none',
                        boxShadow: '0 0 16px rgba(64,150,255,0.25)',
                      }}>
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>

      <style>{`
        @keyframes critical-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
