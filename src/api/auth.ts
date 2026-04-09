import { request, setToken, AUTH_TIMEOUT_MS } from './client';

// ========== 认证 API ==========
export const authApi = {
  // 发送验证码（认证类请求使用更长超时，避免后端冷启动时误报超时）
  sendCode: async (phone: string) => {
    return request('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      timeout: AUTH_TIMEOUT_MS,
    });
  },

  // 登录
  login: async (phone: string, code: string) => {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
      timeout: AUTH_TIMEOUT_MS,
    });
    if (result.data?.token) {
      setToken(result.data.token);
    }
    return result;
  },

  // 登出
  logout: () => {
    setToken(null);
  },
};
