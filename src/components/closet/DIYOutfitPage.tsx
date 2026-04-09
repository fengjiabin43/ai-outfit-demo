import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { ChevronLeft, Trash2, RotateCw, ZoomIn, ZoomOut, X, Plus, Check } from 'lucide-react';
import { ClothingItem, OutfitRecord } from '../../types';
import { recordApi } from '../../api';

// ==================== 类型 ====================

interface CanvasItem {
  uid: string; // 画布内唯一 id（同一件衣服可多次加入）
  clothesId: string;
  name: string;
  img: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

// 预设场合标签
const PRESET_OCCASIONS = ['通勤', '休闲', '约会', '运动', '其他', '旅行', '商务'];

// 分类顺序
const CATEGORIES = ['全部', '上衣', '下装', '鞋子', '配饰', '其他'] as const;

// ==================== Props ====================

interface DIYOutfitPageProps {
  isOpen: boolean;
  onClose: () => void;
  closetItems: ClothingItem[];
  showToast?: (msg: string) => void;
  /** 保存成功后回调，用于把新记录加入穿搭记录列表（与 AI 推荐保存一致） */
  onSaveSuccess?: (record: OutfitRecord) => void;
  /** 跳转到日历页查看记录 */
  onGoToCalendar?: () => void;
  /** 目标日期（从日历页打开时传入选中日期），不传则默认今天 */
  targetDate?: string;
}

// ==================== 组件 ====================

const DIYOutfitPage: React.FC<DIYOutfitPageProps> = ({
  isOpen,
  onClose,
  closetItems,
  showToast,
  onSaveSuccess,
  onGoToCalendar,
  targetDate,
}) => {
  // ---- 画布状态 ----
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ---- 底部选择区状态 ----
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  // ---- 保存弹窗状态 ----
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [occasionTags, setOccasionTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedTip, setShowSavedTip] = useState(false);

  // ---- 底部面板展开 ----
  const [bottomExpanded, setBottomExpanded] = useState(false);

  // 关闭弹窗并重置画布
  const handleClose = useCallback(() => {
    setCanvasItems([]);
    setSelectedUid(null);
    setOccasionTags([]);
    setNextZIndex(1);
    setShowSaveModal(false);
    setShowSavedTip(false);
    setBottomExpanded(false);
    onClose();
  }, [onClose]);

  // 安全衣橱数据
  const safeItems = useMemo(() => {
    if (!closetItems || !Array.isArray(closetItems)) return [];
    return closetItems;
  }, [closetItems]);

  // 按分类分组并计数
  const { filteredItems, categoryCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach(c => { counts[c] = 0; });

    safeItems.forEach(item => {
      const raw = item.category || '其他';
      const cat = raw === '未分类' ? '其他' : raw;
      counts[cat] = (counts[cat] || 0) + 1;
      counts['全部']++;
    });

    const filtered = selectedCategory === '全部'
      ? safeItems
      : safeItems.filter(item => {
          const raw = item.category || '其他';
          const cat = raw === '未分类' ? '其他' : raw;
          return cat === selectedCategory;
        });

    return { filteredItems: filtered, categoryCounts: counts };
  }, [safeItems, selectedCategory]);

  // ==================== 画布操作 ====================

  /** 切换衣物：已在画布则移除，不在则添加 */
  const toggleCanvasItem = useCallback((item: ClothingItem) => {
    const existing = canvasItems.find(ci => ci.clothesId === item.id);
    if (existing) {
      // 已在画布 → 移除
      setCanvasItems(prev => prev.filter(ci => ci.clothesId !== item.id));
      if (selectedUid === existing.uid) {
        setSelectedUid(null);
      }
    } else {
      // 不在画布 → 添加
      const uid = `${item.id}_${Date.now()}`;
      const newItem: CanvasItem = {
        uid,
        clothesId: item.id,
        name: item.name,
        img: item.image,
        x: 60 + Math.random() * 40,
        y: 40 + Math.random() * 40,
        width: 120,
        height: 120,
        rotation: 0,
        zIndex: nextZIndex,
      };
      setCanvasItems(prev => [...prev, newItem]);
      setSelectedUid(uid);
      setNextZIndex(prev => prev + 1);
    }
  }, [canvasItems, selectedUid, nextZIndex]);

  /** 删除选中 */
  const removeSelected = useCallback(() => {
    if (!selectedUid) return;
    setCanvasItems(prev => prev.filter(i => i.uid !== selectedUid));
    setSelectedUid(null);
  }, [selectedUid]);

  /** 旋转选中 +15° */
  const rotateSelected = useCallback((delta: number = 15) => {
    if (!selectedUid) return;
    setCanvasItems(prev =>
      prev.map(i => i.uid === selectedUid ? { ...i, rotation: i.rotation + delta } : i)
    );
  }, [selectedUid]);

  /** 缩放选中 */
  const scaleSelected = useCallback((factor: number) => {
    if (!selectedUid) return;
    setCanvasItems(prev =>
      prev.map(i => {
        if (i.uid !== selectedUid) return i;
        const newW = Math.max(40, Math.min(280, i.width * factor));
        const newH = Math.max(40, Math.min(280, i.height * factor));
        return { ...i, width: newW, height: newH };
      })
    );
  }, [selectedUid]);

  /** 置顶选中 */
  const bringToFront = useCallback((uid: string) => {
    setSelectedUid(uid);
    setCanvasItems(prev =>
      prev.map(i => i.uid === uid ? { ...i, zIndex: nextZIndex } : i)
    );
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  /** 点击画布空白取消选中 */
  const handleCanvasBgClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedUid(null);
    }
  }, []);

  // ==================== 保存流程 ====================

  const handleSave = useCallback(() => {
    if (canvasItems.length === 0) {
      showToast?.('请先将衣服添加到画布');
      return;
    }
    setShowSaveModal(true);
  }, [canvasItems, showToast]);

  const toggleOccasion = useCallback((tag: string) => {
    setOccasionTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const addCustomTag = useCallback(() => {
    const tag = customTagInput.trim();
    if (!tag) return;
    if (!occasionTags.includes(tag)) {
      setOccasionTags(prev => [...prev, tag]);
    }
    setCustomTagInput('');
    setShowCustomInput(false);
  }, [customTagInput, occasionTags]);

  const clearAllTags = useCallback(() => {
    setOccasionTags([]);
  }, []);

  const doSaveOutfit = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // 1. 组装数据（先不截图，保证保存不阻塞）
      const outfitData = {
        id: `diy_${Date.now()}`,
        title: 'DIY搭配',
        desc: occasionTags.length > 0 ? `适合场景：${occasionTags.join('、')}` : 'DIY手动搭配',
        fittedImage: '',
        items: canvasItems.map(ci => ({
          name: ci.name,
          img: ci.img,
          clothesId: ci.clothesId,
        })),
        occasionTags,
      };

      // 2. 调用接口保存（使用目标日期，未传则默认今天）
      const saveDate = targetDate || new Date().toISOString().split('T')[0];
      const result = await recordApi.create({
        date: saveDate,
        outfitData,
        source: 'manual',
      });

      // 3. 若有回调，把新记录加入穿搭记录列表
      const resData = result?.data;
      if (onSaveSuccess && resData) {
        const newRecord: OutfitRecord = {
          id: resData.id,
          date: resData.date,
          outfit: {
            id: resData.outfitData?.id || resData.id,
            title: resData.outfitData?.title || 'DIY搭配',
            desc: resData.outfitData?.desc || '',
            fittedImage: resData.tryonImageUrl || resData.outfitData?.fittedImage || '',
            items: resData.outfitData?.items || [],
          },
          source: (resData.source as OutfitRecord['source']) || 'manual',
        };
        onSaveSuccess(newRecord);
      }

      setShowSaveModal(false);
      setSelectedUid(null);
      setOccasionTags([]);
      setShowSavedTip(true);
      setTimeout(() => setShowSavedTip(false), 4000);
    } catch (err) {
      console.error('保存搭配失败:', err);
      let msg = '保存失败，请重试';
      if (err instanceof Error) {
        msg = err.message;
        // 兜底：英文或过短的错误信息换成友好提示
        if (/failed to fetch|network error|networkrequestfailed/i.test(msg)) {
          msg = '网络异常，请检查连接后重试';
        } else if (msg.length < 2) {
          msg = '保存失败，请重试';
        }
      }
      showToast?.(msg);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, canvasItems, occasionTags, showToast, onSaveSuccess, targetDate]);

  // ==================== 渲染 ====================

  if (!isOpen) return null;

  const selectedItem = canvasItems.find(i => i.uid === selectedUid);

  return (
    <div className="absolute inset-0 z-50 bg-background-light flex flex-col animate-fade-in">
      {/* ===== 顶部 Header ===== */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-2 pb-2 bg-background-light">
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
        >
          <ChevronLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="text-base font-bold text-text-primary">DIY搭配</h1>
        <button
          onClick={handleSave}
          className="text-sm font-bold text-primary active:scale-95 transition-transform"
        >
          保存
        </button>
      </div>

      {/* ===== 画布区域 ===== */}
      <div className="flex-1 min-h-0 px-4 pb-2">
        <div
          ref={canvasRef}
          className="relative w-full h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          onClick={handleCanvasBgClick}
          onTouchEnd={handleCanvasBgClick}
        >
          {canvasItems.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
              <p className="text-sm">从下方选择衣服添加到画布</p>
            </div>
          )}

          {canvasItems.map(item => (
            <Rnd
              key={item.uid}
              size={{ width: item.width, height: item.height }}
              position={{ x: item.x, y: item.y }}
              onDragStop={(_e, d) => {
                setCanvasItems(prev =>
                  prev.map(i => i.uid === item.uid ? { ...i, x: d.x, y: d.y } : i)
                );
              }}
              onResizeStop={(_e, _dir, ref, _delta, pos) => {
                setCanvasItems(prev =>
                  prev.map(i =>
                    i.uid === item.uid
                      ? { ...i, width: parseInt(ref.style.width), height: parseInt(ref.style.height), x: pos.x, y: pos.y }
                      : i
                  )
                );
              }}
              onDragStart={() => bringToFront(item.uid)}
              style={{ zIndex: item.zIndex }}
              bounds="parent"
              enableResizing={selectedUid === item.uid}
              minWidth={40}
              minHeight={40}
              maxWidth={280}
              maxHeight={280}
              lockAspectRatio
              cancel=".canvas-delete-btn"
              className="touch-none"
            >
              <div
                className={`w-full h-full relative cursor-move ${
                  selectedUid === item.uid ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
                style={{ transform: `rotate(${item.rotation}deg)` }}
                onClick={(e) => {
                  e.stopPropagation();
                  bringToFront(item.uid);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                }}
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
                {/* 选中时的删除按钮 */}
                {selectedUid === item.uid && (
                  <button
                    className="canvas-delete-btn absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md z-10"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelected();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      removeSelected();
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </Rnd>
          ))}
        </div>
      </div>

      {/* ===== 选中工具栏 ===== */}
      {selectedItem && (
        <div className="flex-shrink-0 flex items-center justify-center gap-4 px-4 py-1.5 bg-white border-t border-gray-100">
          <button
            onClick={() => rotateSelected(-15)}
            className="flex flex-col items-center gap-0.5 text-text-secondary active:text-primary transition-colors"
          >
            <RotateCw size={18} className="scale-x-[-1]" />
            <span className="text-[9px]">左转</span>
          </button>
          <button
            onClick={() => rotateSelected(15)}
            className="flex flex-col items-center gap-0.5 text-text-secondary active:text-primary transition-colors"
          >
            <RotateCw size={18} />
            <span className="text-[9px]">右转</span>
          </button>
          <button
            onClick={() => scaleSelected(1.15)}
            className="flex flex-col items-center gap-0.5 text-text-secondary active:text-primary transition-colors"
          >
            <ZoomIn size={18} />
            <span className="text-[9px]">放大</span>
          </button>
          <button
            onClick={() => scaleSelected(0.85)}
            className="flex flex-col items-center gap-0.5 text-text-secondary active:text-primary transition-colors"
          >
            <ZoomOut size={18} />
            <span className="text-[9px]">缩小</span>
          </button>
          <button
            onClick={removeSelected}
            className="flex flex-col items-center gap-0.5 text-red-400 active:text-red-600 transition-colors"
          >
            <Trash2 size={18} />
            <span className="text-[9px]">删除</span>
          </button>
        </div>
      )}

      {/* ===== 底部拖拽手柄 ===== */}
      <div
        className="flex-shrink-0 flex justify-center py-1.5 cursor-pointer"
        onClick={() => setBottomExpanded(prev => !prev)}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* ===== 底部单品选择区 ===== */}
      <div
        className={`flex-shrink-0 bg-white border-t border-gray-100 transition-all duration-300 ${
          bottomExpanded ? 'max-h-[55%]' : 'max-h-[35%]'
        } flex flex-col`}
      >
        {/* 分类标签行 */}
        <div className="flex-shrink-0 flex items-center gap-1 px-3 py-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => {
            const count = categoryCounts[cat] || 0;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-text-primary text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {cat}({count})
              </button>
            );
          })}
        </div>

        {/* 单品网格 */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 pb-3">
          {filteredItems.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-300">
              暂无{selectedCategory === '全部' ? '' : selectedCategory}单品
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredItems.map(item => {
                const isOnCanvas = canvasItems.some(ci => ci.clothesId === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCanvasItem(item)}
                    className={`relative bg-gray-50 rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform border ${
                      isOnCanvas ? 'border-primary/40' : 'border-transparent'
                    }`}
                  >
                    <div className="pt-[100%] relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    {/* 已加入画布标记 */}
                    {isOnCanvas && (
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center shadow">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== 保存成功提示条 ===== */}
      {showSavedTip && (
        <div className="absolute bottom-4 left-4 right-4 z-[60] animate-slide-up">
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Check size={16} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">保存成功</p>
              <p className="text-[10px] text-gray-400">已保存到穿搭记录</p>
            </div>
            {onGoToCalendar && (
              <button
                onClick={() => {
                  setShowSavedTip(false);
                  handleClose();
                  onGoToCalendar();
                }}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full active:scale-95 transition-all flex-shrink-0"
              >
                去查看
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== 保存场合弹窗 ===== */}
      {showSaveModal && (
        <div
          className="absolute inset-0 z-[60] bg-black/40 flex items-end justify-center animate-fade-in"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl px-5 pt-5 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题行 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text-primary">这套搭配适合什么场合？</h3>
              <button
                onClick={clearAllTags}
                className="flex items-center gap-1 text-xs text-text-secondary active:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
                <span>删除标签</span>
              </button>
            </div>

            {/* 标签列表 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_OCCASIONS.map(tag => {
                const isSelected = occasionTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleOccasion(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
              {/* 自定义标签 */}
              {occasionTags
                .filter(t => !PRESET_OCCASIONS.includes(t))
                .map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleOccasion(tag)}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-white shadow-sm"
                  >
                    {tag}
                  </button>
                ))}
            </div>

            {/* 添加自定义标签 */}
            {showCustomInput ? (
              <div className="flex items-center gap-2 mb-5">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addCustomTag();
                  }}
                  placeholder="输入自定义场合"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-primary"
                  autoFocus
                />
                <button
                  onClick={addCustomTag}
                  className="px-3 py-2 bg-primary text-white text-sm rounded-full"
                >
                  添加
                </button>
                <button
                  onClick={() => { setShowCustomInput(false); setCustomTagInput(''); }}
                  className="text-text-secondary"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="flex items-center gap-1 text-sm text-primary font-medium mb-5"
              >
                <Plus size={16} />
                <span>添加标签</span>
              </button>
            )}

            {/* 保存搭配按钮 */}
            <button
              onClick={doSaveOutfit}
              disabled={isSaving}
              className="w-full py-3.5 rounded-full text-white text-sm font-bold bg-gradient-to-r from-primary via-pink-400 to-blue-400 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {isSaving ? '保存中...' : '保存搭配'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DIYOutfitPage;
