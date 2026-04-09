import { request } from './client';

// ========== 用户 API ==========
export const userApi = {
  // 获取用户信息
  getInfo: async () => {
    return request('/user/info');
  },

  // 更新用户信息
  updateInfo: async (data: { nickname?: string; avatar?: string; gender?: 'male' | 'female' | null; bio?: string; height?: number; weight?: number }) => {
    return request('/user/info', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
