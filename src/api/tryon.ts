import { request, AI_TIMEOUT_MS } from './client';

// ========== 试衣 API ==========
export const tryonApi = {
  // 创建试衣任务（人物图 + 上衣/下装图，需上传 3 张图到 OSS，耗时较长）
  generate: async (data: {
    personImageUrl: string;
    topGarmentUrl?: string;
    bottomGarmentUrl?: string;
    outfitId?: string;
    model?: 'aitryon' | 'aitryon-plus';
  }) => {
    return request('/tryon/generate', {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: AI_TIMEOUT_MS,
    });
  },

  getStatus: async (taskId: string) => {
    return request(`/tryon/status/${taskId}`, { timeout: AI_TIMEOUT_MS });
  },

  getResult: async (taskId: string) => {
    return request(`/tryon/result/${taskId}`, { timeout: AI_TIMEOUT_MS });
  },
};
