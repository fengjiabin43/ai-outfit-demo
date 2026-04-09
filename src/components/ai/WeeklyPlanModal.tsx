
import React, { useState, useEffect } from 'react';
import { X, CalendarRange, RefreshCcw, Save, CloudSun, CloudRain, Sun, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { ClothingItem, WeatherData, OutfitItem, Outfit, WeeklyPlanDay, WeeklyPlan } from '../../types';
import { weekPlanApi, isLoggedIn } from '../../api';

interface WeeklyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  closetItems: ClothingItem[];
  weather: WeatherData;
  onSavePlan: (plan: WeeklyPlanDay[]) => void;
}

const WeeklyPlanModal: React.FC<WeeklyPlanModalProps> = ({ isOpen, onClose, closetItems, weather, onSavePlan }) => {
  const [plan, setPlan] = useState<WeeklyPlanDay[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedPlans, setSavedPlans] = useState<WeeklyPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [refiningDayIdx, setRefiningDayIdx] = useState<number | null>(null);
  const [refineCandidates, setRefineCandidates] = useState<OutfitItem[][]>([]);
  const [backendPlanId, setBackendPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOrGeneratePlan();
    }
  }, [isOpen]);

  // 将后端返回的 outfit items 匹配到本地 closetItems 获取图片
  const resolveOutfitImages = (items: OutfitItem[]): OutfitItem[] => {
    return items.map(item => {
      if (item.img) return item;
      if (item.clothesId) {
        const local = closetItems.find(c => c.id === item.clothesId);
        if (local) return { ...item, img: local.image, category: local.category };
      }
      const byName = closetItems.find(c => c.name === item.name);
      if (byName) return { ...item, img: byName.image, category: byName.category, clothesId: byName.id };
      return { ...item, isMissing: true };
    });
  };

  // 本地随机降级方案
  const pickOutfit = (): OutfitItem[] => {
      const tops = closetItems.filter(i => i.category === '上衣');
      const bottoms = closetItems.filter(i => i.category === '下装');
      const shoes = closetItems.filter(i => i.category === '鞋子');

      const top = tops[Math.floor(Math.random() * tops.length)];
      const shoe = shoes[Math.floor(Math.random() * shoes.length)];
      const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];

      const items: OutfitItem[] = [];
      if (top) items.push({ name: top.name, img: top.image, category: top.category, clothesId: top.id });
      if (bottom) items.push({ name: bottom.name, img: bottom.image, category: bottom.category, clothesId: bottom.id });
      if (shoe) items.push({ name: shoe.name, img: shoe.image, category: shoe.category, clothesId: shoe.id });

      return items;
  };

  // 先尝试加载已有方案，没有则生成新方案
  const loadOrGeneratePlan = async () => {
    setIsGenerating(true);

    try {
      if (!isLoggedIn()) throw new Error('未登录');

      const currentResult = await weekPlanApi.getCurrent() as { data?: { id: string; weekData: WeeklyPlanDay[] } | null };
      if (currentResult.data?.weekData?.length) {
        const resolvedPlan = currentResult.data.weekData.map(day => ({
          ...day,
          outfit: {
            ...day.outfit,
            items: resolveOutfitImages(day.outfit.items),
            fittedImage: day.outfit.items[0]?.img || '',
          },
        }));
        setPlan(resolvedPlan);
        setBackendPlanId(currentResult.data.id);
        setIsGenerating(false);
        return;
      }
    } catch {
      // 没有已有方案，继续生成
    }

    await generatePlan();
  };

  const generatePlan = async () => {
    setIsGenerating(true);

    try {
      if (!isLoggedIn()) throw new Error('未登录');

      const result = await weekPlanApi.generate() as {
        data?: { id: string; weekData: WeeklyPlanDay[] };
      };
      const weekData = result.data?.weekData || [];

      if (weekData.length > 0) {
        const resolvedPlan = weekData.map(day => ({
          ...day,
          outfit: {
            ...day.outfit,
            items: resolveOutfitImages(day.outfit.items),
            fittedImage: day.outfit.items[0]?.img || '',
          },
        }));
        setPlan(resolvedPlan);
        setBackendPlanId(result.data?.id || null);
        setIsGenerating(false);
        return;
      }
      throw new Error('AI 未返回规划结果');
    } catch (error: any) {
      console.warn('一周规划 API 失败，降级为本地随机:', error?.message);
      const today = new Date();
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weathers = ['晴', '多云', '小雨', '阴', '晴', '晴', '多云'];

      const newPlan: WeeklyPlanDay[] = Array.from({ length: 7 }, (_, idx) => {
        const d = new Date(today);
        d.setDate(today.getDate() + idx);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const items = pickOutfit();
        return {
          date: `${mm}.${dd}`,
          weekday: dayNames[d.getDay()],
          weather: weathers[idx],
          outfit: {
            id: `week-${idx}-${Date.now()}`,
            title: `${dayNames[d.getDay()]}穿搭`,
            desc: 'AI 推荐',
            fittedImage: items[0]?.img || '',
            items,
          },
        };
      });

      setPlan(newPlan);
      setBackendPlanId(null);
      setIsGenerating(false);
    }
  };

  // 抽卡式换一换：调用后端 API 生成3套备选
  const handleRefineDay = async (idx: number) => {
      setRefiningDayIdx(idx);

      try {
        if (isLoggedIn() && backendPlanId) {
          const result = await weekPlanApi.replaceDay(idx) as {
            data?: { alternatives?: { items: OutfitItem[] }[] };
          };
          const alternatives = result.data?.alternatives || [];
          if (alternatives.length > 0) {
            setRefineCandidates(alternatives.map(a => resolveOutfitImages(a.items)));
            return;
          }
        }
      } catch (error) {
        console.warn('换一换 API 失败，降级为本地随机:', error);
      }

      const localCandidates: OutfitItem[][] = [];
      for (let i = 0; i < 3; i++) {
          localCandidates.push(pickOutfit());
      }
      setRefineCandidates(localCandidates);
  };

  // 选择微调后的方案
  const handleSelectRefined = (candidateIdx: number) => {
      if (refiningDayIdx === null) return;
      const newPlan = [...plan];
      newPlan[refiningDayIdx].outfit = {
          ...newPlan[refiningDayIdx].outfit,
          items: refineCandidates[candidateIdx],
          fittedImage: refineCandidates[candidateIdx][0]?.img || ''
      };
      setPlan(newPlan);
      setRefiningDayIdx(null);
      setRefineCandidates([]);
  };

  // 保存方案
  const handleSavePlan = async () => {
      try {
        if (isLoggedIn()) {
          await weekPlanApi.save(`方案 ${savedPlans.length + 1}`);
        }
      } catch (error) {
        console.warn('保存方案到后端失败:', error);
      }

      const newPlan: WeeklyPlan = {
          id: Date.now().toString(),
          name: `方案 ${savedPlans.length + 1}`,
          days: plan,
          createdAt: new Date().toISOString(),
          isActive: true
      };
      setSavedPlans(prev => [...prev.map(p => ({ ...p, isActive: false })), newPlan]);
      setActivePlanId(newPlan.id);
      onSavePlan(plan);
      onClose();
  };

  // 切换方案
  const switchPlan = async (planId: string) => {
      const selectedPlan = savedPlans.find(p => p.id === planId);
      if (selectedPlan) {
          setPlan(selectedPlan.days);
          setActivePlanId(planId);
          setSavedPlans(prev => prev.map(p => ({ ...p, isActive: p.id === planId })));

          try {
            if (isLoggedIn()) {
              await weekPlanApi.switchPlan(planId);
            }
          } catch {
            // 后端切换失败不影响前端展示
          }
      }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
      <div className="bg-background-light w-full max-w-[375px] h-[90vh] sm:h-[800px] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col relative animate-slide-up shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-6 flex justify-between items-center bg-white z-10 border-b border-gray-50">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <CalendarRange className="text-blue-500" size={20} />
                一周穿搭规划
            </h2>
            <button onClick={onClose} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100">
                <X size={18} className="text-gray-500" />
            </button>
        </div>

        {/* Saved Plans Selector */}
        {savedPlans.length > 0 && !isGenerating && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {savedPlans.map(p => (
                        <button
                            key={p.id}
                            onClick={() => switchPlan(p.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                p.id === activePlanId 
                                ? 'bg-blue-500 text-white shadow-md' 
                                : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-gray-500 font-bold">AI 正在规划本周穿搭...</p>
                    <p className="text-xs text-gray-400 mt-2">考虑天气、场合与衣物轮换</p>
                </div>
            ) : refiningDayIdx !== null && refineCandidates.length > 0 ? (
                // 微调界面：显示3套备选
                <div className="space-y-4 pb-24">
                    <div className="flex items-center gap-2 mb-4">
                        <button 
                            onClick={() => {
                                setRefiningDayIdx(null);
                                setRefineCandidates([]);
                            }}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                        >
                            <ChevronUp size={16} />
                        </button>
                        <h3 className="text-sm font-bold text-gray-800">为 {plan[refiningDayIdx].weekday} 推荐 3 套备选</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto snap-x">
                        {refineCandidates.map((candidate, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleSelectRefined(idx)}
                                className="min-w-[200px] snap-center bg-white rounded-2xl p-4 border-2 border-blue-200 shadow-lg cursor-pointer hover:border-blue-500 transition-all"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </div>
                                    <span className="text-xs font-bold text-gray-600">备选方案 {String.fromCharCode(65 + idx)}</span>
                                </div>
                                <div className="flex gap-2">
                                    {candidate.map((item, i) => (
                                        <div key={i} className="flex-shrink-0 w-16 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                            <img src={item.img} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-3 pb-24">
                    {plan.map((day, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 relative group">
                            <div className="flex flex-col items-center justify-center w-12 border-r border-gray-50 pr-4">
                                <span className="text-xs font-bold text-gray-800">{day.weekday}</span>
                                <span className="text-[10px] text-gray-400 mb-2">{day.date}</span>
                                {day.weather.includes('雨') ? <CloudRain size={16} className="text-blue-400" /> : 
                                 day.weather.includes('云') ? <CloudSun size={16} className="text-gray-400" /> :
                                 <Sun size={16} className="text-orange-400" />}
                            </div>
                            
                            <div className="flex-1 overflow-hidden">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {day.outfit.items.map((item, i) => (
                                        <div key={i} className="flex-shrink-0 w-16 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                            <img src={item.img} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={() => handleRefineDay(idx)}
                                className="absolute top-2 right-2 p-1.5 bg-white shadow-sm border border-gray-100 rounded-full text-gray-400 hover:text-blue-500 active:scale-95 transition-all"
                                title="换一换（生成3套备选）"
                            >
                                <RefreshCcw size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Footer */}
        {!isGenerating && refiningDayIdx === null && (
            <div className="p-6 bg-white border-t border-gray-50 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] flex gap-4">
                <button 
                    onClick={generatePlan}
                    className="w-14 h-14 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50"
                    title="重新生成"
                >
                    <RefreshCcw size={20} />
                </button>
                <button 
                    onClick={handleSavePlan}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <Save size={18} />
                    {savedPlans.length > 0 ? '保存新方案' : '确认并存入日历'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyPlanModal;
