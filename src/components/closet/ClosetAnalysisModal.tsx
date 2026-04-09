import React, { useMemo } from 'react';
import { X, BarChart3, TrendingUp, Info, Shirt, AlertTriangle } from 'lucide-react';
import { ClothingItem, OutfitRecord } from '../../types';

interface ClosetAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  closetItems: ClothingItem[];
  outfitRecords?: OutfitRecord[];
  userStyles?: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  '上衣': 'bg-blue-500',
  '下装': 'bg-green-500',
  '鞋子': 'bg-orange-500',
  '配饰': 'bg-purple-500',
};

const ClosetAnalysisModal: React.FC<ClosetAnalysisModalProps> = ({ isOpen, onClose, closetItems, outfitRecords = [], userStyles = [] }) => {
  // 分类统计
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    closetItems.forEach(item => {
      const cat = item.category || '未分类';
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category,
        count,
        percentage: closetItems.length > 0 ? Math.round((count / closetItems.length) * 100) : 0,
        color: CATEGORY_COLORS[category] || 'bg-gray-400',
      }));
  }, [closetItems]);

  // 二级分类统计
  const subCategoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    closetItems.forEach(item => {
      if (item.subCategory) {
        stats[item.subCategory] = (stats[item.subCategory] || 0) + 1;
      }
    });
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [closetItems]);

  // 标签分析
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    closetItems.forEach(item => {
      // 防御性检查：确保 tags 是数组
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            stats[tag] = (stats[tag] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [closetItems]);

  // 收藏统计
  const favoriteCount = useMemo(() => closetItems.filter(i => i.isFavorite).length, [closetItems]);

  // 使用频率低的单品
  const lowUsageItems = useMemo(() => {
    return closetItems
      .filter(i => (i.wearCount || 0) === 0)
      .slice(0, 5);
  }, [closetItems]);

  // 生成 AI 建议
  const aiTips = useMemo(() => {
    const tips: string[] = [];
    
    if (closetItems.length === 0) {
      return ['快去录入您的第一件单品吧！'];
    }
    
    const topCategory = categoryStats[0];
    if (topCategory && topCategory.percentage > 50) {
      tips.push(`您的「${topCategory.category}」类目占比 ${topCategory.percentage}%，建议适当补充其他类目以丰富搭配选择。`);
    }
    
    const shoeCount = categoryStats.find(s => s.category === '鞋子')?.count || 0;
    if (shoeCount < 2 && closetItems.length > 5) {
      tips.push('鞋子数量偏少，建议补充不同场合的鞋履以提升搭配灵活性。');
    }
    
    if (lowUsageItems.length > 3) {
      tips.push(`有 ${lowUsageItems.length} 件单品尚未穿着，建议考虑尝试搭配或进行断舍离。`);
    }
    
    if (outfitRecords.length === 0 && closetItems.length >= 6) {
      tips.push('您还没有穿搭记录，快试试 AI 智能搭配功能吧！');
    }
    
    if (tips.length === 0) {
      tips.push('您的衣橱配置很均衡，继续保持良好的穿搭习惯！');
    }
    
    return tips;
  }, [closetItems, categoryStats, lowUsageItems, outfitRecords]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[375px] h-[90vh] bg-background-light rounded-t-[40px] flex flex-col animate-slide-up shadow-2xl overflow-hidden">
        <div className="p-6 bg-white flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-orange-500" size={20} />
            <h2 className="text-lg font-bold text-gray-800">衣橱分析报告</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 text-center">
              <p className="text-xl font-black text-gray-800">{closetItems.length}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">单品总量</p>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 text-center">
              <p className="text-xl font-black text-red-500">{favoriteCount}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">收藏单品</p>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 text-center">
              <p className="text-xl font-black text-purple-500">{outfitRecords.length}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">穿搭记录</p>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-orange-400 rounded-full"></div>
              分类分布
            </h3>
            {categoryStats.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {categoryStats.map(stat => (
                  <div key={stat.category}>
                    <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                      <span>{stat.category}</span>
                      <span>{stat.count} 件 ({stat.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div className={`${stat.color} h-full rounded-full transition-all`} style={{ width: `${stat.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Category Top 5 */}
          {subCategoryStats.length > 0 && (
            <div className="bg-white p-5 rounded-[24px] shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Shirt className="text-blue-500" size={16} />
                细分类目 TOP 5
              </h3>
              <div className="flex flex-wrap gap-2">
                {subCategoryStats.map(([sub, count]) => (
                  <span key={sub} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg">
                    {sub} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tag Cloud */}
          {tagStats.length > 0 && (
            <div className="bg-white p-5 rounded-[24px] shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="text-green-500" size={16} />
                常见标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {tagStats.map(([tag, count]) => (
                  <span key={tag} className="text-[10px] font-bold bg-green-50 text-green-600 px-2.5 py-1 rounded-lg">
                    #{tag} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Style Preferences */}
          {userStyles.length > 0 && (
            <div className="bg-white p-5 rounded-[24px] shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="text-indigo-500" size={16} />
                我的风格偏好
              </h3>
              <div className="flex flex-wrap gap-2">
                {userStyles.map(style => (
                  <span key={style} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">
                    {style}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Low Usage Items */}
          {lowUsageItems.length > 0 && (
            <div className="bg-white p-5 rounded-[24px] shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={16} />
                闲置单品 ({lowUsageItems.length})
              </h3>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {lowUsageItems.map(item => (
                  <div key={item.id} className="flex-shrink-0 w-16 text-center">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 mb-1">
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <p className="text-[8px] text-gray-500 truncate">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Tips */}
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-2">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-orange-500" />
              <p className="text-[11px] font-bold text-gray-800">AI 优化建议</p>
            </div>
            {aiTips.map((tip, idx) => (
              <p key={idx} className="text-[10px] text-gray-600 leading-relaxed pl-6">{'\u2022'} {tip}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosetAnalysisModal;
