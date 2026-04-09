
export type TabType = 'home' | 'closet' | 'calendar' | 'user';

// 一级分类
export type PrimaryCategory = '上衣' | '下装' | '鞋子' | '配饰';

// 二级分类
export type SecondaryCategory = 
  // 上衣
  | '短袖T恤' | '长袖T恤' | '衬衫' | '卫衣' | '毛衣/针织衫' | '外套' | '西装/正装' | '背心/吊带' | '其他'
  // 下装
  | '短裤' | '长裤' | '运动裤' | '短裙' | '长裙' | '其他'
  // 鞋子
  | '运动鞋' | '休闲鞋' | '皮鞋/正装鞋' | '靴子' | '凉鞋/拖鞋' | '其他'
  // 配饰
  | '帽子' | '包包' | '腰带' | '手表/手链' | '项链/配饰' | '其他';

// 标记状态
export type ItemMark = '已穿' | '喜欢' | '不喜欢';

export interface ClothingItem {
  id: string;
  name: string;
  image: string;
  category?: PrimaryCategory; // 一级分类
  subCategory?: SecondaryCategory; // 二级分类
  tags?: string[]; // 用户自定义标签
  marks?: ItemMark[]; // 标记（已穿/喜欢/不喜欢）
  isFavorite?: boolean; // 收藏（与后端同步）
  isNew?: boolean;
  addedDate?: string; // 添加日期
  wearCount?: number; // 穿着次数
}

export interface WeatherData {
  temp: number;
  condition: string;
  range: string;
  date: string;
  wind: string;
  humidity: string;
  uv: string;
  tip: string;
}

export interface OutfitItem {
  name: string;
  img?: string;
  category?: string;
  clothesId?: string;
  isMissing?: boolean;
}

export interface Outfit {
  id: string;
  title: string;
  desc: string;
  fittedImage: string;
  items: OutfitItem[];
  date?: string;
  occasionTags?: string[]; // DIY 搭配场合标签
}

// 一周天气单日数据
export interface WeekWeatherDay {
  date: string;      // YYYY-MM-DD
  weekday: string;   // 周一~周日
  temp: number;      // 均温
  tempMax: number;   // 最高温
  tempMin: number;   // 最低温
  condition: string; // 晴/多云/雨...
}

// 城市信息
export interface CityInfo {
  name: string;
  id: string;
}

export interface WeeklyPlanDay {
  date: string;
  weekday: string;
  weather: string;
  outfit: Outfit;
}

// 模特性别
export type ModelGender = 'female' | 'male';

// 内置模特
export interface BuiltinModel {
  id: string;
  name: string;
  image: string; // 静态资源路径，如 /models/women1.png
  gender: ModelGender;
}

// 专属模特（含内置和用户上传）
export interface AvatarModel {
  id: string;
  image: string; // 白底图
  name?: string;
  gender?: ModelGender;
  isBuiltin?: boolean; // 是否为内置模特
  createdAt: string;
  isActive: boolean;
}

// 一周方案
export interface WeeklyPlan {
  id: string;
  name: string; // 方案名称
  days: WeeklyPlanDay[];
  createdAt: string;
  isActive: boolean;
}

// 穿搭记录
export interface OutfitRecord {
  id: string;
  date: string;
  outfit: Outfit;
  source: 'ai-recommend' | 'weekly-plan' | 'manual'; // 来源
}
