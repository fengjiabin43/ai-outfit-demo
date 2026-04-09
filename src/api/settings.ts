import { request } from './client';

// ========== 设置 API ==========
export const settingsApi = {
  // 获取风格偏好
  getStylePreference: async () => {
    return request('/settings/style');
  },

  // 更新风格偏好
  updateStylePreference: async (styles: string[]) => {
    return request('/settings/style', {
      method: 'PUT',
      body: JSON.stringify({ styles }),
    });
  },

  // 获取当前激活的专属模特
  getAvatarModel: async () => {
    return request('/settings/model');
  },

  // 获取所有用户模特列表
  getAllModels: async () => {
    return request('/settings/models');
  },

  // 上传/更新专属模特（支持额外参数）
  uploadAvatarModel: async (imageUrl: string, options?: {
    processBackground?: boolean;
    name?: string;
    gender?: string;
    isBuiltin?: boolean;
  }) => {
    return request('/settings/model', {
      method: 'POST',
      body: JSON.stringify({ imageUrl, ...options }),
    });
  },

  // 激活指定模特
  activateModel: async (id: string) => {
    return request(`/settings/model/${id}/activate`, {
      method: 'PUT',
    });
  },

  // 删除专属模特
  deleteAvatarModel: async (id: string) => {
    return request(`/settings/model/${id}`, {
      method: 'DELETE',
    });
  },
};
