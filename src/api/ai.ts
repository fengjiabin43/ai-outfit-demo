import { request, AI_TIMEOUT_MS } from './client';

// ========== AI API ==========
export const aiApi = {
  getWeather: async (location?: string) => {
    const params = location ? `?location=${encodeURIComponent(location)}` : '';
    return request(`/ai/weather${params}`);
  },

  getWeekWeather: async (location?: string) => {
    const params = location ? `?location=${encodeURIComponent(location)}` : '';
    return request(`/ai/weather/week${params}`);
  },

  getCityByLocation: async (lat: number, lng: number) => {
    return request(`/ai/geo/lookup?lat=${lat}&lng=${lng}`);
  },

  recommend: async (params?: {
    scene?: string;
    singleItemId?: string;
    message?: string;
    count?: number;
  }) => {
    return request('/ai/recommend', {
      method: 'POST',
      body: JSON.stringify(params || {}),
      timeout: AI_TIMEOUT_MS,
    });
  },

  regenerate: async (params?: {
    previousOutfitIds?: string[];
    scene?: string;
    count?: number;
  }) => {
    return request('/ai/recommend/regenerate', {
      method: 'POST',
      body: JSON.stringify(params || {}),
      timeout: AI_TIMEOUT_MS,
    });
  },

  adjust: async (params: {
    outfitId: string;
    replaceItemId?: string;
    replaceCategory?: string;
    instruction?: string;
  }) => {
    return request('/ai/recommend/adjust', {
      method: 'POST',
      body: JSON.stringify(params),
      timeout: AI_TIMEOUT_MS,
    });
  },

  analyzeWardrobe: async () => {
    return request('/ai/analyze-wardrobe', {
      method: 'POST',
      timeout: AI_TIMEOUT_MS,
    });
  },
};
