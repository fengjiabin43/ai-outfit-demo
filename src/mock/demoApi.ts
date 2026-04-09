// Demo 模式 - API 拦截器
// 当 VITE_DEMO_MODE=true 时，所有 API 调用返回模拟数据

import {
  DEMO_USER, DEMO_TOKEN, DEMO_CLOTHES, DEMO_WEATHER,
  DEMO_WEEK_WEATHER, DEMO_STYLES, DEMO_OUTFITS, DEMO_RECORDS,
  DEMO_STATS, DEMO_WARDROBE_ANALYSIS,
} from './demoData';

export const isDemoMode = (): boolean =>
  import.meta.env.VITE_DEMO_MODE === 'true';

const ok = (data: any) => ({ success: true, data });

const delay = (ms: number = 300) =>
  new Promise(resolve => setTimeout(resolve, ms + Math.random() * 200));

type RouteHandler = (params: {
  body?: any;
  query?: URLSearchParams;
  pathParts: string[];
}) => any;

// 内存中可变状态，让 Demo 交互更真实
let demoClothes = [...DEMO_CLOTHES];
let demoRecords = [...DEMO_RECORDS];
let demoStyles = [...DEMO_STYLES];
let demoFavorites = new Set(DEMO_CLOTHES.filter(c => c.isFavorite).map(c => c.id));

const routes: Record<string, Record<string, RouteHandler>> = {
  // ---- Auth ----
  'POST /auth/send-code': {
    handler: () => ok({ message: '验证码已发送' }),
  },
  'POST /auth/login': {
    handler: () => ok({ token: DEMO_TOKEN, user: DEMO_USER, isNewUser: false }),
  },

  // ---- User ----
  'GET /user/info': {
    handler: () => ok(DEMO_USER),
  },
  'PUT /user/info': {
    handler: ({ body }) => ok({ ...DEMO_USER, ...body }),
  },

  // ---- Wardrobe ----
  'GET /wardrobe/clothes': {
    handler: ({ query }) => {
      let items = [...demoClothes];
      const cat = query?.get('category');
      if (cat && cat !== '全部') items = items.filter(c => c.category === cat);
      return ok(items);
    },
  },
  'POST /wardrobe/clothes': {
    handler: ({ body }) => {
      const newItem = { id: `demo-new-${Date.now()}`, ...body, wearCount: 0, isFavorite: false, marks: [], tags: body.tags || [], createdAt: new Date().toISOString() };
      demoClothes = [newItem, ...demoClothes];
      return ok(newItem);
    },
  },
  'GET /wardrobe/stats': {
    handler: () => ok(DEMO_STATS),
  },
  'POST /wardrobe/analyze-clothing': {
    handler: () => ok({ name: 'Demo 单品', category: '上衣', subCategory: '短袖T恤', color: '白色', style: '休闲', tags: ['短袖T恤', '白色'] }),
  },
  'POST /wardrobe/process-clothing': {
    handler: () => ok({ name: 'Demo 单品', category: '上衣', subCategory: '短袖T恤', color: '白色', tags: ['短袖T恤'], whiteBgImageUrl: '/demo/clothes/wps (4).png' }),
  },
  'POST /wardrobe/segment-product': {
    handler: ({ body }) => ok({ imageUrl: body?.imageUrl || '/demo/clothes/wps (4).png' }),
  },

  // ---- AI ----
  'GET /ai/weather': {
    handler: () => ok(DEMO_WEATHER),
  },
  'GET /ai/weather/week': {
    handler: () => ok(DEMO_WEEK_WEATHER),
  },
  'GET /ai/geo/lookup': {
    handler: () => ok({ name: '上海', id: '101020100' }),
  },
  'POST /ai/recommend': {
    handler: () => {
      const shuffled = [...DEMO_OUTFITS].sort(() => Math.random() - 0.5);
      return ok({ outfits: shuffled.slice(0, 2) });
    },
  },
  'POST /ai/recommend/regenerate': {
    handler: () => {
      const shuffled = [...DEMO_OUTFITS].sort(() => Math.random() - 0.5);
      return ok({ outfits: shuffled.slice(0, 2) });
    },
  },
  'POST /ai/recommend/adjust': {
    handler: () => ok({ outfit: DEMO_OUTFITS[Math.floor(Math.random() * DEMO_OUTFITS.length)] }),
  },
  'POST /ai/analyze-wardrobe': {
    handler: () => ok(DEMO_WARDROBE_ANALYSIS),
  },

  // ---- Try-on ----
  'POST /tryon/generate': {
    handler: () => ok({ taskId: 'demo-tryon-001', status: 'succeeded' }),
  },

  // ---- Upload ----
  'POST /upload/image': {
    handler: () => ok({ url: '/demo/clothes/wps (4).png', path: 'demo/placeholder.png' }),
  },
  'POST /upload/images': {
    handler: () => ok({ files: [{ url: '/demo/clothes/wps (4).png', path: 'demo/placeholder.png' }], count: 1 }),
  },

  // ---- Record ----
  'GET /record': {
    handler: () => ok(demoRecords),
  },
  'POST /record': {
    handler: ({ body }) => {
      const rec = { id: `demo-rec-${Date.now()}`, ...body, createdAt: new Date().toISOString() };
      demoRecords = [rec, ...demoRecords];
      return ok(rec);
    },
  },

  // ---- Settings ----
  'GET /settings/style': {
    handler: () => ok({ styles: demoStyles }),
  },
  'PUT /settings/style': {
    handler: ({ body }) => { demoStyles = body?.styles || demoStyles; return ok({ styles: demoStyles }); },
  },
  'GET /settings/model': {
    handler: () => ok({ id: 'demo-model-1', imageUrl: '/models/women1.png', name: '女模特 01', gender: 'female', isBuiltin: true, createdAt: '2026-03-01', isActive: true }),
  },
  'GET /settings/models': {
    handler: () => ok([
      { id: 'demo-model-1', imageUrl: '/models/women1.png', name: '女模特 01', gender: 'female', isBuiltin: true, isActive: true, createdAt: '2026-03-01' },
    ]),
  },
  'POST /settings/model': {
    handler: ({ body }) => ok({ id: `demo-model-${Date.now()}`, imageUrl: body?.imageUrl || '/models/women1.png', createdAt: new Date().toISOString(), isActive: true, backgroundProcessed: false }),
  },

  // ---- Week Plan ----
  'POST /weekplan/generate': {
    handler: () => {
      const days = DEMO_WEEK_WEATHER.map((w, i) => ({
        date: w.date,
        weekday: w.weekday,
        weather: w.condition,
        outfit: DEMO_OUTFITS[i % DEMO_OUTFITS.length],
      }));
      return ok({ id: 'demo-plan-1', name: '本周穿搭方案', days, createdAt: new Date().toISOString(), isActive: true });
    },
  },
  'GET /weekplan/current': {
    handler: () => ok(null),
  },
  'GET /weekplan/list': {
    handler: () => ok([]),
  },
  'POST /weekplan/save': {
    handler: () => ok({ id: 'demo-plan-saved', name: '已保存方案' }),
  },
};

// 动态路由匹配
const dynamicRoutes: Array<{
  pattern: RegExp;
  method: string;
  handler: RouteHandler;
}> = [
  {
    pattern: /^\/wardrobe\/clothes\/([^/]+)$/,
    method: 'GET',
    handler: ({ pathParts }) => {
      const id = pathParts[pathParts.length - 1];
      const item = demoClothes.find(c => c.id === id);
      return item ? ok(item) : ok(null);
    },
  },
  {
    pattern: /^\/wardrobe\/clothes\/([^/]+)$/,
    method: 'PUT',
    handler: ({ pathParts, body }) => {
      const id = pathParts[pathParts.length - 1];
      demoClothes = demoClothes.map(c => c.id === id ? { ...c, ...body } : c);
      if (body?.isFavorite !== undefined) {
        if (body.isFavorite) demoFavorites.add(id); else demoFavorites.delete(id);
      }
      return ok(demoClothes.find(c => c.id === id));
    },
  },
  {
    pattern: /^\/wardrobe\/clothes\/([^/]+)$/,
    method: 'DELETE',
    handler: ({ pathParts }) => {
      const id = pathParts[pathParts.length - 1];
      demoClothes = demoClothes.filter(c => c.id !== id);
      return ok({ deleted: true });
    },
  },
  {
    pattern: /^\/wardrobe\/clothes\/([^/]+)\/mark$/,
    method: 'POST',
    handler: ({ pathParts, body }) => {
      const id = pathParts[pathParts.length - 2];
      demoClothes = demoClothes.map(c => {
        if (c.id !== id) return c;
        let marks = [...(c.marks || [])];
        if (body?.action === 'add') marks.push(body.mark);
        else marks = marks.filter((m: string) => m !== body?.mark);
        return { ...c, marks };
      });
      return ok(demoClothes.find(c => c.id === id));
    },
  },
  {
    pattern: /^\/tryon\/status\/(.+)$/,
    method: 'GET',
    handler: () => ok({ status: 'succeeded', progress: 100, resultImageUrl: '/models/women1.png' }),
  },
  {
    pattern: /^\/tryon\/result\/(.+)$/,
    method: 'GET',
    handler: () => ok({ imageUrl: '/models/women1.png', status: 'succeeded' }),
  },
  {
    pattern: /^\/record\/clothes\/([^/]+)\/stats$/,
    method: 'GET',
    handler: () => ok({ wearCount: 3, lastWornDate: new Date().toISOString().split('T')[0] }),
  },
  {
    pattern: /^\/record\/([^/]+)$/,
    method: 'DELETE',
    handler: ({ pathParts }) => {
      const id = pathParts[pathParts.length - 1];
      demoRecords = demoRecords.filter(r => r.id !== id);
      return ok({ deleted: true });
    },
  },
  {
    pattern: /^\/settings\/model\/([^/]+)\/activate$/,
    method: 'PUT',
    handler: () => ok({ activated: true }),
  },
  {
    pattern: /^\/settings\/model\/([^/]+)$/,
    method: 'DELETE',
    handler: () => ok({ deleted: true }),
  },
  {
    pattern: /^\/weekplan\/switch\/(.+)$/,
    method: 'POST',
    handler: () => ok({ switched: true }),
  },
  {
    pattern: /^\/weekplan\/day\/replace$/,
    method: 'POST',
    handler: () => ok({ outfit: DEMO_OUTFITS[Math.floor(Math.random() * DEMO_OUTFITS.length)] }),
  },
  {
    pattern: /^\/weekplan\/day\/manual$/,
    method: 'POST',
    handler: ({ body }) => ok({ outfit: body?.outfit }),
  },
  {
    pattern: /^\/weekplan\/([^/]+)$/,
    method: 'DELETE',
    handler: () => ok({ deleted: true }),
  },
];

/**
 * Demo 模式的核心请求拦截器
 * 替代真实的 HTTP 请求，返回模拟数据
 */
export const demoRequest = async (
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<any> => {
  const method = (options.method || 'GET').toUpperCase();
  const [path, queryStr] = endpoint.split('?');
  const query = new URLSearchParams(queryStr || '');
  const pathParts = path.split('/').filter(Boolean);

  let body: any = undefined;
  if (options.body) {
    try { body = JSON.parse(options.body as string); } catch { body = options.body; }
  }

  const params = { body, query, pathParts };

  // 模拟网络延迟
  await delay();

  // 精确匹配静态路由
  const routeKey = `${method} ${path}`;
  if (routes[routeKey]) {
    return routes[routeKey].handler(params);
  }

  // 正则匹配动态路由
  for (const route of dynamicRoutes) {
    if (route.method === method && route.pattern.test(path)) {
      return route.handler(params);
    }
  }

  // 未匹配的路由返回空数据
  console.warn(`[Demo] Unhandled route: ${method} ${path}`);
  return ok(null);
};

/**
 * Demo 模式的上传拦截器
 */
export const demoUpload = async (): Promise<{ url: string; path: string }> => {
  await delay();
  return { url: '/demo/clothes/wps (4).png', path: 'demo/placeholder.png' };
};
