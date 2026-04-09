// Demo 模式 - 模拟数据
// 基于测试账号 13800138000 的真实衣物数据

export const DEMO_USER = {
  id: 'demo-user-001',
  phone: '13800138000',
  nickname: '穿搭达人',
  avatar: null,
  gender: 'female' as const,
  bio: 'AI 穿搭助手 Demo 用户',
  height: 165,
  weight: 52,
};

export const DEMO_TOKEN = 'demo-token-static-preview';

// 21 件衣物（与测试账号一致）
export const DEMO_CLOTHES = [
  {
    id: 'demo-c01', name: '灰色V领纽扣宽松针织衫', imageUrl: '/demo/clothes/wps (1).png',
    category: '上衣', subCategory: '毛衣/针织衫', color: '灰色', style: '休闲',
    tags: ['针织衫', '灰色', '休闲', '秋冬'], marks: [], wearCount: 5, isFavorite: true,
    addedDate: '2026-03-01', createdAt: '2026-03-01',
  },
  {
    id: 'demo-c02', name: '浅色渐变纹理阔腿休闲裤', imageUrl: '/demo/clothes/wps (2).png',
    category: '下装', subCategory: '长裤', color: '米白色', style: '休闲',
    tags: ['长裤', '米白色', '休闲', '春夏'], marks: [], wearCount: 3, isFavorite: false,
    addedDate: '2026-03-01', createdAt: '2026-03-01',
  },
  {
    id: 'demo-c03', name: '米色LIVING印花圆领短袖T恤', imageUrl: '/demo/clothes/wps (3).png',
    category: '上衣', subCategory: '短袖T恤', color: '米色', style: '休闲',
    tags: ['短袖T恤', '米色', '休闲', '春夏'], marks: [], wearCount: 8, isFavorite: true,
    addedDate: '2026-03-02', createdAt: '2026-03-02',
  },
  {
    id: 'demo-c04', name: '白色LIVING印花圆领短袖T恤', imageUrl: '/demo/clothes/wps (4).png',
    category: '上衣', subCategory: '短袖T恤', color: '白色', style: '休闲',
    tags: ['短袖T恤', '白色', '休闲', '春夏'], marks: [], wearCount: 6, isFavorite: false,
    addedDate: '2026-03-02', createdAt: '2026-03-02',
  },
  {
    id: 'demo-c05', name: '黑色波点圆领针织开衫', imageUrl: '/demo/clothes/wps (5).png',
    category: '上衣', subCategory: '毛衣/针织衫', color: '黑色', style: '甜美',
    tags: ['针织衫', '黑色', '甜美', '秋冬'], marks: [], wearCount: 4, isFavorite: true,
    addedDate: '2026-03-03', createdAt: '2026-03-03',
  },
  {
    id: 'demo-c06', name: '米白色蓝领麻花纹针织开衫', imageUrl: '/demo/clothes/wps (6).png',
    category: '上衣', subCategory: '毛衣/针织衫', color: '米白色', style: '学院',
    tags: ['针织衫', '米白色', '学院', '秋冬'], marks: [], wearCount: 3, isFavorite: false,
    addedDate: '2026-03-03', createdAt: '2026-03-03',
  },
  {
    id: 'demo-c07', name: '灰色圆领修身长袖打底衫', imageUrl: '/demo/clothes/wps (7).png',
    category: '上衣', subCategory: '长袖T恤', color: '灰色', style: '简约',
    tags: ['长袖T恤', '灰色', '简约', '四季'], marks: [], wearCount: 12, isFavorite: false,
    addedDate: '2026-03-04', createdAt: '2026-03-04',
  },
  {
    id: 'demo-c08', name: '黑色Mardi卡通小马印花T恤', imageUrl: '/demo/clothes/wps (8).png',
    category: '上衣', subCategory: '短袖T恤', color: '黑色', style: '潮流',
    tags: ['短袖T恤', '黑色', '潮流', '春夏'], marks: [], wearCount: 7, isFavorite: false,
    addedDate: '2026-03-05', createdAt: '2026-03-05',
  },
  {
    id: 'demo-c09', name: '白色Mardi卡通小马印花T恤', imageUrl: '/demo/clothes/wps (9).png',
    category: '上衣', subCategory: '短袖T恤', color: '白色', style: '潮流',
    tags: ['短袖T恤', '白色', '潮流', '春夏'], marks: [], wearCount: 5, isFavorite: true,
    addedDate: '2026-03-05', createdAt: '2026-03-05',
  },
  {
    id: 'demo-c10', name: '深灰色蝴蝶结百褶蕾丝短裙', imageUrl: '/demo/clothes/wps (10).png',
    category: '下装', subCategory: '短裙', color: '深灰色', style: '甜美',
    tags: ['短裙', '深灰色', '甜美', '四季'], marks: [], wearCount: 4, isFavorite: true,
    addedDate: '2026-03-06', createdAt: '2026-03-06',
  },
  {
    id: 'demo-c11', name: '深灰色百褶A字半身裙', imageUrl: '/demo/clothes/wps (11).png',
    category: '下装', subCategory: '短裙', color: '深灰色', style: '学院',
    tags: ['短裙', '深灰色', '学院', '四季'], marks: [], wearCount: 6, isFavorite: false,
    addedDate: '2026-03-06', createdAt: '2026-03-06',
  },
  {
    id: 'demo-c12', name: '灰色宽松阔腿裤', imageUrl: '/demo/clothes/wps (12).png',
    category: '下装', subCategory: '长裤', color: '灰色', style: '休闲',
    tags: ['长裤', '灰色', '休闲', '四季'], marks: [], wearCount: 9, isFavorite: false,
    addedDate: '2026-03-07', createdAt: '2026-03-07',
  },
  {
    id: 'demo-c13', name: '棕色厚底系带皮鞋', imageUrl: '/demo/clothes/wps (13).png',
    category: '鞋子', subCategory: '皮鞋/正装鞋', color: '棕色', style: '复古',
    tags: ['皮鞋', '棕色', '复古', '四季'], marks: [], wearCount: 15, isFavorite: true,
    addedDate: '2026-03-07', createdAt: '2026-03-07',
  },
  {
    id: 'demo-c14', name: '黑色宽松阔腿裤', imageUrl: '/demo/clothes/wps (14).png',
    category: '下装', subCategory: '长裤', color: '黑色', style: '休闲',
    tags: ['长裤', '黑色', '休闲', '四季'], marks: [], wearCount: 11, isFavorite: false,
    addedDate: '2026-03-08', createdAt: '2026-03-08',
  },
  {
    id: 'demo-c15', name: '黑色松紧腰休闲直筒裤', imageUrl: '/demo/clothes/wps (15).png',
    category: '下装', subCategory: '长裤', color: '黑色', style: '休闲',
    tags: ['长裤', '黑色', '休闲', '四季'], marks: [], wearCount: 8, isFavorite: false,
    addedDate: '2026-03-08', createdAt: '2026-03-08',
  },
  {
    id: 'demo-c16', name: '蓝灰色格纹A字短裙', imageUrl: '/demo/clothes/wps (16).png',
    category: '下装', subCategory: '短裙', color: '蓝灰色', style: '学院',
    tags: ['短裙', '蓝灰色', '学院', '秋冬'], marks: [], wearCount: 3, isFavorite: true,
    addedDate: '2026-03-09', createdAt: '2026-03-09',
  },
  {
    id: 'demo-c17', name: '棕色格纹系带半身长裙', imageUrl: '/demo/clothes/wps (17).png',
    category: '下装', subCategory: '长裙', color: '棕色', style: '复古',
    tags: ['半身裙', '棕色', '复古', '秋冬'], marks: [], wearCount: 2, isFavorite: false,
    addedDate: '2026-03-09', createdAt: '2026-03-09',
  },
  {
    id: 'demo-c18', name: '深棕色厚底褶皱中筒靴', imageUrl: '/demo/clothes/wps (18).png',
    category: '鞋子', subCategory: '靴子', color: '深棕色', style: '复古',
    tags: ['靴子', '深棕色', '复古', '秋冬'], marks: [], wearCount: 6, isFavorite: false,
    addedDate: '2026-03-10', createdAt: '2026-03-10',
  },
  {
    id: 'demo-c19', name: '棕色印花大容量托特包', imageUrl: '/demo/clothes/wps (19).png',
    category: '配饰', subCategory: '包包', color: '棕色', style: '复古',
    tags: ['包包', '棕色', '复古', '四季'], marks: [], wearCount: 10, isFavorite: true,
    addedDate: '2026-03-10', createdAt: '2026-03-10',
  },
  {
    id: 'demo-c20', name: '米灰色翻领拉链工装夹克', imageUrl: '/demo/clothes/wps.png',
    category: '上衣', subCategory: '外套', color: '米灰色', style: '工装',
    tags: ['外套', '米灰色', '工装', '秋冬'], marks: [], wearCount: 4, isFavorite: false,
    addedDate: '2026-03-11', createdAt: '2026-03-11',
  },
  {
    id: 'demo-c21', name: '白色LEEFOEN运动短袖T恤', imageUrl: '/demo/clothes/wps (4).png',
    category: '上衣', subCategory: '短袖T恤', color: '白色', style: '运动',
    tags: ['短袖T恤', '白色', '运动', '春夏'], marks: [], wearCount: 3, isFavorite: false,
    addedDate: '2026-03-12', createdAt: '2026-03-12',
  },
];

// 天气数据
export const DEMO_WEATHER = {
  temp: 18,
  condition: '多云',
  range: '14°~22°',
  date: new Date().toISOString().split('T')[0],
  wind: '东南风 2级',
  humidity: '55%',
  uv: '4',
  tip: '气温舒适，适合薄外套搭配T恤，出门带把伞以防万一',
};

const getWeekDates = () => {
  const days = [];
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const conditions = ['晴', '多云', '阴', '小雨', '晴', '多云', '晴'];
  const temps = [
    { temp: 20, tempMax: 24, tempMin: 16 },
    { temp: 18, tempMax: 22, tempMin: 14 },
    { temp: 16, tempMax: 19, tempMin: 13 },
    { temp: 14, tempMax: 17, tempMin: 11 },
    { temp: 19, tempMax: 23, tempMin: 15 },
    { temp: 21, tempMax: 25, tempMin: 17 },
    { temp: 22, tempMax: 26, tempMin: 18 },
  ];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().split('T')[0],
      weekday: weekdays[d.getDay()],
      condition: conditions[i],
      ...temps[i],
    });
  }
  return days;
};

export const DEMO_WEEK_WEATHER = getWeekDates();

// 风格偏好
export const DEMO_STYLES = ['简约', '学院', '复古'];

// AI 推荐搭配结果
export const DEMO_OUTFITS = [
  {
    id: 'demo-outfit-1',
    title: '学院风日常穿搭',
    desc: '米白色针织开衫搭配深灰色百褶裙，经典学院风搭配，知性优雅又不失活力。棕色皮鞋点缀复古气息，整体色调和谐统一。',
    fittedImage: '/demo/clothes/wps (6).png',
    items: [
      { name: '米白色蓝领麻花纹针织开衫', img: '/demo/clothes/wps (6).png', category: '上衣', clothesId: 'demo-c06' },
      { name: '深灰色百褶A字半身裙', img: '/demo/clothes/wps (11).png', category: '下装', clothesId: 'demo-c11' },
      { name: '棕色厚底系带皮鞋', img: '/demo/clothes/wps (13).png', category: '鞋子', clothesId: 'demo-c13' },
      { name: '棕色印花大容量托特包', img: '/demo/clothes/wps (19).png', category: '配饰', clothesId: 'demo-c19' },
    ],
  },
  {
    id: 'demo-outfit-2',
    title: '休闲舒适出街',
    desc: '黑色Mardi印花T恤搭配灰色阔腿裤，轻松随性的街头风格。深棕色中筒靴增添层次感，整体造型潮流又舒适。',
    fittedImage: '/demo/clothes/wps (8).png',
    items: [
      { name: '黑色Mardi卡通小马印花T恤', img: '/demo/clothes/wps (8).png', category: '上衣', clothesId: 'demo-c08' },
      { name: '灰色宽松阔腿裤', img: '/demo/clothes/wps (12).png', category: '下装', clothesId: 'demo-c12' },
      { name: '深棕色厚底褶皱中筒靴', img: '/demo/clothes/wps (18).png', category: '鞋子', clothesId: 'demo-c18' },
    ],
  },
  {
    id: 'demo-outfit-3',
    title: '甜美约会穿搭',
    desc: '黑色波点针织衫搭配蝴蝶结蕾丝短裙，甜美气质满分。棕色皮鞋与复古托特包完美呼应，既精致又有质感。',
    fittedImage: '/demo/clothes/wps (5).png',
    items: [
      { name: '黑色波点圆领针织开衫', img: '/demo/clothes/wps (5).png', category: '上衣', clothesId: 'demo-c05' },
      { name: '深灰色蝴蝶结百褶蕾丝短裙', img: '/demo/clothes/wps (10).png', category: '下装', clothesId: 'demo-c10' },
      { name: '棕色厚底系带皮鞋', img: '/demo/clothes/wps (13).png', category: '鞋子', clothesId: 'demo-c13' },
      { name: '棕色印花大容量托特包', img: '/demo/clothes/wps (19).png', category: '配饰', clothesId: 'demo-c19' },
    ],
  },
];

// 穿搭记录
const makeRecordDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const DEMO_RECORDS = [
  {
    id: 'demo-rec-1',
    date: makeRecordDate(0),
    outfitData: DEMO_OUTFITS[0],
    tryonImageUrl: DEMO_OUTFITS[0].fittedImage,
    source: 'ai-recommend' as const,
  },
  {
    id: 'demo-rec-2',
    date: makeRecordDate(1),
    outfitData: DEMO_OUTFITS[1],
    tryonImageUrl: DEMO_OUTFITS[1].fittedImage,
    source: 'ai-recommend' as const,
  },
  {
    id: 'demo-rec-3',
    date: makeRecordDate(3),
    outfitData: DEMO_OUTFITS[2],
    tryonImageUrl: DEMO_OUTFITS[2].fittedImage,
    source: 'manual' as const,
  },
];

// 衣橱统计
export const DEMO_STATS = {
  total: 21,
  byCategory: { '上衣': 10, '下装': 8, '鞋子': 2, '配饰': 1 },
  favoriteCount: 8,
  recentlyWorn: 5,
};

// 衣橱分析
export const DEMO_WARDROBE_ANALYSIS = {
  summary: '您的衣橱共有 21 件单品，以上衣和下装为主。色系偏向黑灰白等中性色调，风格涵盖休闲、学院和复古。建议适当增加亮色系单品，丰富搭配可能性。',
  colorDistribution: [
    { color: '黑色', count: 5, percentage: 24 },
    { color: '灰色', count: 4, percentage: 19 },
    { color: '白色/米色', count: 5, percentage: 24 },
    { color: '棕色', count: 5, percentage: 24 },
    { color: '蓝灰色', count: 1, percentage: 5 },
    { color: '深灰色', count: 1, percentage: 5 },
  ],
  styleDistribution: [
    { style: '休闲', count: 8 },
    { style: '复古', count: 4 },
    { style: '学院', count: 3 },
    { style: '潮流', count: 2 },
    { style: '甜美', count: 2 },
    { style: '其他', count: 2 },
  ],
  suggestions: [
    '您的衣橱中性色较多，可以考虑添加一两件亮色单品（如红色、蓝色）作为点缀',
    '下装种类丰富，但缺少牛仔裤这一百搭单品',
    '配饰仅有一件包包，建议补充围巾、帽子等配饰增加搭配层次',
    '鞋子数量较少，可以考虑添加一双运动鞋满足日常需求',
  ],
};
