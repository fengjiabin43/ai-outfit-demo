import { request } from './client';

// ========== 穿搭记录 API ==========
export const recordApi = {
  // 创建穿搭记录
  create: async (data: {
    date?: string;
    outfitData: {
      id?: string;
      title: string;
      desc?: string;
      fittedImage?: string;
      items: Array<{ name: string; img?: string; clothesId?: string }>;
    };
    tryonImageUrl?: string;
    source?: 'ai-recommend' | 'weekly-plan' | 'manual';
  }) => {
    return request('/record', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 获取穿搭记录列表
  getRecords: async (params?: {
    startDate?: string;
    endDate?: string;
    source?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.source) query.set('source', params.source);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    
    const queryStr = query.toString();
    return request(`/record${queryStr ? `?${queryStr}` : ''}`);
  },

  // 获取衣服使用统计
  getClothesStats: async (clothesId: string) => {
    return request(`/record/clothes/${clothesId}/stats`);
  },

  // 删除记录
  delete: async (id: string) => {
    return request(`/record/${id}`, {
      method: 'DELETE',
    });
  },
};
