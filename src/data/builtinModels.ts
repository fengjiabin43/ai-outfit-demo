import { BuiltinModel } from '../types';

// 内置模特数据
export const BUILTIN_MODELS: BuiltinModel[] = [
  {
    id: 'builtin-women-1',
    name: '女模特 01',
    image: '/models/women1.png',
    gender: 'female',
  },
  {
    id: 'builtin-women-2',
    name: '女模特 02',
    image: '/models/women101.png',
    gender: 'female',
  },
  {
    id: 'builtin-women-3',
    name: '女模特 03',
    image: '/models/women102.png',
    gender: 'female',
  },
  {
    id: 'builtin-man-1',
    name: '男模特 01',
    image: '/models/man04.png',
    gender: 'male',
  },
  {
    id: 'builtin-man-2',
    name: '男模特 02',
    image: '/models/man05.png',
    gender: 'male',
  },
];

// 按性别筛选
export const getModelsByGender = (gender: 'female' | 'male') =>
  BUILTIN_MODELS.filter(m => m.gender === gender);

// 根据 ID 查找内置模特
export const findBuiltinModel = (id: string) =>
  BUILTIN_MODELS.find(m => m.id === id);

// 判断是否为内置模特（通过图片URL判断）
export const isBuiltinModelImage = (imageUrl: string) =>
  BUILTIN_MODELS.some(m => m.image === imageUrl);
