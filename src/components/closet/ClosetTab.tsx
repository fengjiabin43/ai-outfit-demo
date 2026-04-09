import React, { useState, useMemo } from 'react';
import { Plus, Palette, Sparkles } from 'lucide-react';
import { ClothingItem } from '../../types';
import ItemDetailModal from './ItemDetailModal';

interface ClosetTabProps {
  items: ClothingItem[];
  favoriteItemIds?: string[];
  onToggleFavorite?: (id: string) => void;
  onOpenScan: () => void;
  onOpenDIY?: () => void;
  onOpenAI?: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (item: ClothingItem) => void;
}

/** 分类顺序：上衣、下装、鞋子、配饰、其他（侧边栏仅保留文字，无图标） */
const CATEGORY_ORDER = ['上衣', '下装', '鞋子', '配饰', '其他'] as const;

const ClosetTab: React.FC<ClosetTabProps> = ({ items, favoriteItemIds = [], onToggleFavorite, onOpenScan, onOpenDIY, onOpenAI, onDelete, onUpdate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('上衣');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  // 防御性检查：确保 items 是数组
  const safeItems = useMemo(() => {
    if (!items) return [];
    if (!Array.isArray(items)) {
      console.error('ClosetTab: items 不是数组', items);
      return [];
    }
    return items;
  }, [items]);

  // 按一级分类分组；后端/数据中「未分类」统一展示为「其他」
  const { groupedByCategory, categoryCounts } = useMemo(() => {
    const groups: Record<string, ClothingItem[]> = {};
    CATEGORY_ORDER.forEach(cat => groups[cat] = []);
    safeItems.forEach(item => {
      const raw = item.category || '其他';
      const cat = raw === '未分类' ? '其他' : raw;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    const counts: Record<string, number> = {};
    Object.entries(groups).forEach(([k, v]) => { if (v.length > 0) counts[k] = v.length; });
    return {
      groupedByCategory: Object.entries(groups).filter(([, list]) => list.length > 0),
      categoryCounts: counts,
    };
  }, [safeItems]);

  const currentItems = useMemo(() => {
    return groupedByCategory.find(([cat]) => cat === selectedCategory)?.[1] ?? [];
  }, [groupedByCategory, selectedCategory]);

  return (
    <>
      <div className="h-full flex flex-col pb-24 animate-fade-in bg-white">
        {/* 顶部标题与操作区 */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0">
          <h1 className="text-lg font-bold text-text-primary mb-3">我的衣橱</h1>
          <div className="flex gap-2">
            <button
              onClick={onOpenScan}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-primary to-primary-deep rounded-full shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="text-white" size={14} strokeWidth={3} />
              <span className="text-[11px] font-bold text-white whitespace-nowrap">导入衣橱</span>
            </button>
            <button
              onClick={onOpenDIY}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full shadow-sm active:scale-95 transition-transform"
            >
              <Palette className="text-white" size={14} />
              <span className="text-[11px] font-bold text-white whitespace-nowrap">DIY 搭配</span>
            </button>
            <button
              onClick={onOpenAI}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-sm active:scale-95 transition-transform"
            >
              <Sparkles className="text-white" size={14} />
              <span className="text-[11px] font-bold text-white whitespace-nowrap">AI 搭配</span>
            </button>
          </div>
        </div>

        {/* 分类侧边导航栏 + 主内容区 */}
        <div className="flex-1 min-h-0 flex">
          <nav className="w-16 flex-shrink-0 flex flex-col items-stretch py-1 px-1.5 overflow-y-auto no-scrollbar">
            {CATEGORY_ORDER.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-2.5 px-2 rounded-xl mb-0.5 transition-all text-center ${
                    isActive
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'text-gray-400 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <span className="text-xs block truncate">{cat}</span>
                </button>
              );
            })}
          </nav>

          {/* 右侧：固定标题 + 可滚动卡片区 */}
          <div className="flex-1 min-w-0 flex flex-col bg-gray-50/60 rounded-tl-2xl">
            <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0">
              <h2 className="text-sm font-bold text-text-primary">{selectedCategory}</h2>
              <span className="text-xs text-gray-400">{currentItems.length} 件</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-3">
              {currentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-gray-400 mb-1">暂无{selectedCategory}</p>
                  <p className="text-xs text-gray-300">点击上方「导入衣橱」添加衣物</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {currentItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer active:scale-[0.97] transition-transform ${item.isNew ? 'ring-2 ring-primary/20' : ''}`}
                    >
                      <div className="relative pt-[100%] bg-gray-50">
                        <img
                          src={item.image}
                          className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          alt={item.name}
                        />
                      </div>
                      <div className="p-2">
                        <div className="text-[10px] font-bold text-text-primary truncate mb-1">{item.name}</div>
                        <div className="flex flex-wrap gap-1 items-center">
                          {item.subCategory && (
                            <span className="text-[8px] text-primary bg-primary/5 px-1.5 py-0.5 rounded-md font-bold">{item.subCategory}</span>
                          )}
                          {Array.isArray(item.tags) && item.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-[8px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">{tag}</span>
                          ))}
                        </div>
                      </div>
                      {item.isNew && (
                        <div className="absolute top-1.5 right-1.5 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold">NEW</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onDelete={onDelete || (() => {})}
        onUpdate={onUpdate || (() => {})}
        isFavorite={selectedItem ? favoriteItemIds.includes(selectedItem.id) : false}
        onToggleFavorite={onToggleFavorite}
      />
    </>
  );
};

export default ClosetTab;
