import { request } from './client';

// ========== 衣柜 API ==========
export const wardrobeApi = {
  // 获取衣服列表
  getClothes: async (params?: { category?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    
    const queryStr = query.toString();
    return request(`/wardrobe/clothes${queryStr ? `?${queryStr}` : ''}`);
  },

  // 添加衣服
  addClothes: async (data: {
    name: string;
    imageUrl: string;
    category: string;
    subCategory?: string;
    color?: string;
    style?: string;
    tags?: string[];
  }) => {
    return request('/wardrobe/clothes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 获取单件衣服
  getClothesById: async (id: string) => {
    return request(`/wardrobe/clothes/${id}`);
  },

  // 更新衣服
  updateClothes: async (id: string, data: Partial<{
    name: string;
    category: string;
    subCategory: string;
    color: string;
    style: string;
    tags: string[];
    marks: string[];
    isFavorite: boolean;
  }>) => {
    return request(`/wardrobe/clothes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 标记衣服（已穿/喜欢/不喜欢）
  markClothes: async (id: string, mark: string, action: 'add' | 'remove') => {
    return request(`/wardrobe/clothes/${id}/mark`, {
      method: 'POST',
      body: JSON.stringify({ mark, action }),
    });
  },

  // 删除衣服
  deleteClothes: async (id: string) => {
    return request(`/wardrobe/clothes/${id}`, {
      method: 'DELETE',
    });
  },

  // 获取统计
  getStats: async () => {
    return request('/wardrobe/stats');
  },

  // AI 分析衣服图片（Qwen VL，替代 Gemini）
  // 可传 imageUrl 或 base64Image
  analyzeClothing: async (data: { imageUrl?: string; base64Image?: string }) => {
    return request('/wardrobe/analyze-clothing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 一键处理：AI 分析 + 白底图生成（qwen-image-edit-plus）
  // 返回 { name, category, tags, whiteBgImageUrl }
  processClothing: async (data: { base64Image: string }) => {
    return request('/wardrobe/process-clothing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 电商级衣服抠图（百炼）
  segmentProduct: async (data: {
    imageUrl: string;
    garmentType: 'upper' | 'lower' | 'dress';
    clothesId?: string;
  }) => {
    return request('/wardrobe/segment-product', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
