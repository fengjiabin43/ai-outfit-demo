import React, { useState, useMemo } from 'react';
import { X, Heart, Shirt, Calendar, Sparkles } from 'lucide-react';
import { ClothingItem, OutfitRecord } from '../../types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: ClothingItem[];
  outfitRecords?: OutfitRecord[];
  closetItems?: ClothingItem[];
  onToggleFavorite?: (id: string) => void;
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({ isOpen, onClose, favorites, outfitRecords = [], closetItems = [], onToggleFavorite }) => {
  const [tab, setTab] = useState<'items' | 'outfits'>('items');

  const resolveItemImage = (item: { name: string; img?: string; clothesId?: string }): string | undefined => {
    if (item.img) return item.img;
    if (item.clothesId) {
      const match = closetItems.find(c => c.id === item.clothesId);
      if (match) return match.image;
    }
    return undefined;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[375px] h-[85vh] bg-white rounded-t-[40px] flex flex-col animate-slide-up shadow-2xl">
        <div className="p-6 flex justify-between items-center border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Heart className="text-red-500 fill-current" size={20} />
            <h2 className="text-lg font-bold text-gray-800">我的收藏</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex p-4 gap-2">
          <button
            onClick={() => setTab('items')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${tab === 'items' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400'}`}
          >
            单品 ({favorites.length})
          </button>
          <button
            onClick={() => setTab('outfits')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${tab === 'outfits' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400'}`}
          >
            穿搭 ({outfitRecords.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {tab === 'items' ? (
            favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Heart className="text-gray-200 mb-4" size={48} />
                <p className="text-sm font-bold text-gray-500 mb-1">暂无收藏单品</p>
                <p className="text-[10px] text-gray-400">在衣橱中打开单品详情，点击爱心即可收藏</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {favorites.map(item => (
                  <div key={item.id} className="relative group">
                    <div className="relative">
                      <img src={item.image} className="w-full aspect-square object-cover rounded-2xl shadow-sm bg-gray-50" alt={item.name} />
                      {onToggleFavorite && (
                        <button
                          onClick={() => onToggleFavorite(item.id)}
                          className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                        >
                          <Heart size={14} className="text-red-500 fill-current" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-[10px] font-bold text-gray-800 truncate">{item.name}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-[8px] text-gray-400">{item.category}</p>
                        {item.tags && item.tags.length > 0 && (
                          <span className="text-[7px] bg-primary/10 text-primary px-1 py-0.5 rounded">{item.tags[0]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            outfitRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Shirt className="text-gray-200 mb-4" size={48} />
                <p className="text-sm font-bold text-gray-500 mb-1">暂无穿搭记录</p>
                <p className="text-[10px] text-gray-400">使用 AI 推荐或 DIY 搭配后，记录会在这里显示</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outfitRecords.map(record => (
                  <div key={record.id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      {record.outfit.fittedImage ? (
                        <img src={record.outfit.fittedImage} className="w-14 h-16 object-cover rounded-xl flex-shrink-0 bg-white border border-gray-100" alt="" />
                      ) : (
                        <div className="w-14 h-16 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Sparkles size={18} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{record.outfit.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Calendar size={10} className="text-gray-400" />
                          <p className="text-[10px] text-gray-400">{record.date}</p>
                        </div>
                        <div className="mt-1">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                            record.source === 'ai-recommend' ? 'bg-purple-50 text-purple-500' :
                            record.source === 'weekly-plan' ? 'bg-blue-50 text-blue-500' :
                            'bg-orange-50 text-orange-500'
                          }`}>
                            {record.source === 'ai-recommend' ? 'AI 推荐' :
                             record.source === 'weekly-plan' ? '一周规划' : 'DIY 搭配'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {Array.isArray(record.outfit.items) && record.outfit.items.length > 0 && (
                      <div className="px-3 pb-3">
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                          {record.outfit.items.map((item, idx) => {
                            const img = resolveItemImage(item);
                            return (
                              <div key={idx} className="flex-shrink-0 w-12">
                                {img ? (
                                  <img src={img} className="w-12 h-12 object-cover rounded-lg bg-white border border-gray-100" alt={item.name} />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                                    <Shirt size={14} className="text-gray-300" />
                                  </div>
                                )}
                                <p className="text-[7px] text-gray-400 mt-0.5 text-center truncate">{item.name}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesModal;