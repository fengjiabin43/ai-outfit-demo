import React, { useState, useCallback, useEffect } from 'react';
import { CloudSun, Sparkles, Wand2, ArrowRight, CloudRain, RefreshCw } from 'lucide-react';
import { WeatherData, ClothingItem } from '../../types';
import { aiApi, isLoggedIn } from '../../api';

export interface InspirationItem {
  name: string;
  img?: string;
  category?: string;
}

const FEMALE_ONLY_KEYWORDS = ['裙', '吊带', '蕾丝', '蝴蝶结', '碎花连衣'];
const MALE_ONLY_KEYWORDS = ['西装领带'];

const filterByGender = (items: ClothingItem[], gender?: 'male' | 'female' | null): ClothingItem[] => {
  if (!gender) return items;
  return items.filter(item => {
    const text = `${item.name} ${item.subCategory || ''} ${item.style || ''}`;
    if (gender === 'male') return !FEMALE_ONLY_KEYWORDS.some(kw => text.includes(kw));
    if (gender === 'female') return !MALE_ONLY_KEYWORDS.some(kw => text.includes(kw));
    return true;
  });
};

const pickRandomFromCloset = (items: ClothingItem[], gender?: 'male' | 'female' | null): InspirationItem[] => {
  const filtered = filterByGender(items, gender);
  const tops = filtered.filter(i => i.category === '上衣');
  const bottoms = filtered.filter(i => i.category === '下装');
  const shoes = filtered.filter(i => i.category === '鞋子');
  const pick = (arr: ClothingItem[]) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
  const result: InspirationItem[] = [];
  const t = pick(tops);
  if (t) result.push({ name: t.name, img: t.image, category: t.category });
  const b = pick(bottoms);
  if (b) result.push({ name: b.name, img: b.image, category: b.category });
  const s = pick(shoes);
  if (s) result.push({ name: s.name, img: s.image, category: s.category });
  return result;
};

interface HomeTabProps {
  onOpenAI: () => void;
  onOpenWeeklyPlan?: () => void;
  userAvatar: string;
  onUpdateAvatar: (img: string) => void;
  weather: WeatherData;
  showToast?: (msg: string) => void;
  closetItems?: ClothingItem[];
  isLoggedIn?: boolean;
  onRequestLogin?: () => void;
  nickname?: string;
  userGender?: 'male' | 'female' | null;
  onOpenModelManage?: () => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  onOpenAI, 
  onOpenWeeklyPlan,
  userAvatar, 
  onUpdateAvatar, 
  weather, 
  showToast, 
  closetItems = [],
  isLoggedIn: userLoggedIn = false,
  onRequestLogin,
  nickname,
  userGender,
  onOpenModelManage,
}) => {
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([]);
  const [inspirationLoading, setInspirationLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    if (closetItems.length === 0) return;

    if (closetItems.length >= 6 && userLoggedIn && !initialLoaded) {
      setInitialLoaded(true);
      (async () => {
        try {
          const res = await aiApi.recommend({ count: 1 });
          const outfit = res.data?.outfits?.[0];
          if (outfit?.items?.length) {
            const items: InspirationItem[] = outfit.items.map((it: any) => {
              const closet = closetItems.find(c => c.id === it.clothesId);
              return {
                name: it.name,
                img: closet?.image || it.img,
                category: closet?.category || '推荐',
              };
            });
            setInspirationItems(items);
            return;
          }
        } catch (error) {
          console.log('初始加载灵感失败，使用衣橱数据');
        }
        setInspirationItems(pickRandomFromCloset(closetItems, userGender));
      })();
    } else if (inspirationItems.length === 0) {
      setInspirationItems(pickRandomFromCloset(closetItems, userGender));
    }
  }, [closetItems, userLoggedIn]);

  const handleRefreshInspiration = useCallback(async () => {
    // 检查登录状态
    if (!isLoggedIn()) {
      showToast?.('请先登录后使用 AI 推荐功能');
      onRequestLogin?.();
      return;
    }

    // 检查衣橱数量
    if (closetItems.length < 6) {
      showToast?.('衣橱至少需要 6 件单品才能使用 AI 推荐');
      return;
    }

    setInspirationLoading(true);
    
    try {
      // 调用后端 Gemini AI 推荐接口
      const res = await aiApi.recommend({ count: 1 });
      const outfit = res.data?.outfits?.[0];
      
      if (outfit?.items?.length) {
        const items: InspirationItem[] = outfit.items.map((it: any) => {
          const closet = closetItems.find(c => c.id === it.clothesId);
          return {
            name: it.name,
            img: closet?.image || it.img,
            category: closet?.category || '推荐',
          };
        });
        setInspirationItems(items);
        showToast?.('AI 已根据天气与风格偏好为您推荐搭配');
      } else {
        fallbackToLocal();
      }
    } catch (error: any) {
      console.error('AI 推荐失败:', error);
      
      // 处理特定错误
      if (error?.response?.data?.message) {
        showToast?.(error.response.data.message);
      } else {
        showToast?.('AI 推荐失败，已切换备选方案');
      }
      
      // 失败时使用本地灵感
      fallbackToLocal();
    } finally {
      setInspirationLoading(false);
    }
  }, [closetItems, showToast, onRequestLogin]);

  const fallbackToLocal = useCallback(() => {
    setInspirationItems(pickRandomFromCloset(closetItems, userGender));
  }, [closetItems]);

  return (
    <div className="h-full overflow-hidden pb-20 animate-fade-in relative flex flex-col">

      {/* Header - 紧凑，减少留白 */}
      <div className="px-4 pt-2 pb-1 flex-shrink-0">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-lg font-bold text-text-primary">{(() => { const h = new Date().getHours(); return h < 12 ? '早安' : h < 18 ? '午好' : '晚好'; })()}, {nickname || '穿搭达人'}</h1>
                <p className="text-[10px] text-text-secondary mt-0.5">今日宜：{weather.condition.includes('雨') ? '带伞出行，' : ''}保持好心情</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm border border-primary/10">
                {weather.condition.includes('雨') ? <CloudRain size={12} className="text-blue-400" /> : <CloudSun size={12} className="text-primary" />}
                <span className="text-[10px] font-bold text-text-primary">{weather.temp}° {weather.condition}</span>
            </div>
        </div>
      </div>

      {/* 主区域：模拟试衣效果 - 铺满 */}
      <div className="px-3 mb-2 flex-1 min-h-0 flex-shrink-0">
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg group">
             {/* Background */}
             <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200"></div>
             
             {/* The User Figure - 点击跳转模特管理 */}
             <img 
               src={userAvatar} 
               className="absolute inset-0 w-full h-full object-cover object-top z-10 transition-transform duration-500 group-hover:scale-105 cursor-pointer"
               alt="My Digital Figure"
               onClick={onOpenModelManage}
             />

             {/* Interactive Floating Button */}
             <div className="absolute bottom-3 left-3 right-3 z-20">
                <button 
                  onClick={onOpenAI}
                  className="w-full bg-white/95 backdrop-blur-xl border border-white/50 p-2.5 rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-all"
                >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-primary-deep flex items-center justify-center text-white flex-shrink-0">
                        <Wand2 size={14} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <h3 className="text-[10px] font-bold text-text-primary truncate">AI 智能搭配</h3>
                        <p className="text-[8px] text-text-secondary truncate">基于天气和你的衣橱，生成今日穿搭</p>
                    </div>
                </button>
             </div>
        </div>
      </div>

      {/* 辅区域：今日搭配灵感 - 与推荐衣服图片尺寸一致，紧凑横向滚动 */}
      <div className="px-4 pb-2 flex-shrink-0">
        <div className="bg-white rounded-xl p-2 shadow-sm border border-primary/10">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="text-primary" size={12} />
              <h3 className="font-bold text-text-primary text-xs">今日搭配灵感</h3>
            </div>
            <button
              type="button"
              onClick={handleRefreshInspiration}
              disabled={inspirationLoading}
              className="text-[9px] text-primary font-bold bg-primary/5 px-1.5 py-0.5 rounded-full disabled:opacity-60 flex items-center gap-0.5"
            >
              {inspirationLoading ? <RefreshCw size={10} className="animate-spin" /> : null}
              换一换
            </button>
          </div>
          <p className="text-[9px] text-text-secondary line-clamp-1 mb-2 px-1.5 py-1 bg-primary/5 rounded border border-primary/5">{weather.tip}</p>
          {/* 与衣橱/推荐单品一致：统一小方卡尺寸，横向滚动；换一换由 AI 根据天气与偏好推荐，不拟合上身 */}
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            {inspirationItems.map((item, i) => (
              <div
                key={`${item.name}-${i}`}
                onClick={onOpenAI}
                className="flex-shrink-0 w-[72px] bg-background-light rounded-lg p-1.5 border border-primary/5 text-center cursor-pointer hover:border-primary/20 active:scale-[0.97] transition-all"
              >
                <div className="w-full aspect-square rounded overflow-hidden mb-1 bg-gray-100">
                  {item.img ? (
                    <img src={item.img} className="w-full h-full object-cover" alt={item.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-text-secondary">图</div>
                  )}
                </div>
                <p className="text-[8px] font-bold text-text-primary truncate">{item.name}</p>
                <p className="text-[7px] text-text-secondary">{item.category || '推荐'}</p>
              </div>
            ))}
            <button
              type="button"
              onClick={onOpenAI}
              className="flex-shrink-0 w-[72px] bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-1.5 flex flex-col justify-center items-center border border-primary/10 cursor-pointer min-h-[72px] hover:from-primary/10 hover:to-primary/20 active:scale-[0.98] transition"
            >
              <Sparkles size={14} className="text-primary mb-1" />
              <span className="text-[8px] font-bold text-primary">AI 搭配</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
