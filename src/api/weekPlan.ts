import { request } from './client';

// ========== 一周规划 API ==========
export const weekPlanApi = {
  generate: async () => request('/weekplan/generate', { method: 'POST' }),
  getCurrent: async () => request('/weekplan/current'),
  replaceDay: async (dayIndex: number) =>
    request('/weekplan/day/replace', { method: 'POST', body: JSON.stringify({ dayIndex }) }),
  manualAdjust: async (dayIndex: number, outfit: object) =>
    request('/weekplan/day/manual', { method: 'POST', body: JSON.stringify({ dayIndex, outfit }) }),
  save: async (name?: string) =>
    request('/weekplan/save', { method: 'POST', body: JSON.stringify({ name }) }),
  getList: async () => request('/weekplan/list'),
  switchPlan: async (id: string) => request(`/weekplan/switch/${id}`, { method: 'POST' }),
  deletePlan: async (id: string) => request(`/weekplan/${id}`, { method: 'DELETE' }),
};
