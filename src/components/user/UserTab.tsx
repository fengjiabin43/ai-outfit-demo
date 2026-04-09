import React, { useState, useMemo, useRef } from 'react';
import { Settings, ChevronRight, Heart, ShoppingBag, Clock, Star, Calendar, Tag, Circle, BarChart2, Plus, X, UserCircle } from 'lucide-react';
import { ClothingItem, OutfitRecord } from '../../types';
import { BUILTIN_MODELS } from '../../data/builtinModels';
import FavoritesModal from './FavoritesModal';
import ClosetAnalysisModal from '../closet/ClosetAnalysisModal';
import SettingsModal from './SettingsModal';

interface AvatarModelData {
  id: string;
  imageUrl: string;
  isActive: boolean;
  createdAt?: string;
}

interface UserTabProps {
  userStyles: string[];
  onToggleStyle: (style: string) => void;
  favoriteItemIds: string[];
  closetItems: ClothingItem[];
  outfitRecords?: OutfitRecord[];
  onLogout: () => void;
  onToggleFavorite?: (id: string) => void; // 切换收藏
  // P1 功能：设置相关
  avatarModel?: AvatarModelData | null;
  onUploadAvatarModel?: (imageUrl: string) => Promise<void>;
  onDeleteAvatarModel?: (id: string) => Promise<void>;
  onSaveStyles?: () => Promise<void>;
  isSavingStyles?: boolean;
  onOpenModelManage?: () => void;
  userProfile?: { nickname: string; bio: string; avatar: string; height: number | null; weight: number | null };
  onSaveProfile?: (data: any) => Promise<void>;
  userPhone?: string;
  showToast?: (msg: string) => void;
  /** 点击穿搭日历中的某条记录时，跳转到日历 Tab 并定位到该日期 */
  onGoToCalendarDate?: (date: string) => void;
}

const SOURCE_LABEL: Record<string, string> = {
  'ai-recommend': 'AI 推荐',
  'manual': 'DIY 搭配',
  'weekly-plan': '一周规划',
};

const UserTab: React.FC<UserTabProps> = ({ 
  userStyles, onToggleStyle, favoriteItemIds, closetItems, outfitRecords = [], onLogout, onToggleFavorite,
  avatarModel, onUploadAvatarModel, onDeleteAvatarModel, onSaveStyles, isSavingStyles,
  onOpenModelManage, userProfile, onSaveProfile, userPhone, showToast, onGoToCalendarDate
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [lastSeenRecordCount, setLastSeenRecordCount] = useState(() => {
    try {
      return Number(localStorage.getItem('lastSeenRecordCount') || '0');
    } catch { return 0; }
  });
  const [showModel, setShowModel] = useState(false);
  const [activeModal, setActiveModal] = useState<'favorites' | 'analysis' | 'settings' | 'wearFrequency' | null>(null);
  const [analysisRead, setAnalysisRead] = useState(() => {
    try { return localStorage.getItem('analysisReportRead') === '1'; } catch { return false; }
  });
  const [isAddingCustomStyle, setIsAddingCustomStyle] = useState(false);
  const [customStyleInput, setCustomStyleInput] = useState('');
  const customStyleInputRef = useRef<HTMLInputElement>(null);
  
  const defaultStyles = ['简约', '法式', '日系工装', '美式复古', '辣妹', '运动休闲', '老钱风', '极简'];
  // 合并默认风格与用户自定义风格（去重）
  const availableStyles = [...new Set([...defaultStyles, ...userStyles])];

  // 收藏的单品（根据 favoriteItemIds 从衣柜中筛选）
  const favoriteItems = closetItems.filter(i => favoriteItemIds.includes(i.id));

  // 计算每件衣服的使用频率
  const itemWearFrequency = useMemo(() => {
    const frequency: Record<string, number> = {};
    
    // 防御性检查：确保 outfitRecords 是数组
    if (Array.isArray(outfitRecords)) {
      outfitRecords.forEach(record => {
        if (record?.outfit?.items && Array.isArray(record.outfit.items)) {
          record.outfit.items.forEach(item => {
            if (item?.name) {
              frequency[item.name] = (frequency[item.name] || 0) + 1;
            }
          });
        }
      });
    }
    
    return frequency;
  }, [outfitRecords]);

  // 获取使用频率最高的衣服
  const topWornItems = useMemo(() => {
    return Object.entries(itemWearFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        item: closetItems.find(item => item.name === name)
      }))
      .filter(entry => entry.item);
  }, [itemWearFrequency, closetItems]);

  return (
    <div className="h-full flex flex-col overflow-hidden pb-24 animate-fade-in bg-background-light">
      {/* Header Profile Area - 收紧上方留白，一屏呈现 */}
      <div className="relative pb-3 flex-shrink-0">
        <div className="h-20 bg-gradient-to-br from-primary to-primary-deep rounded-b-2xl"></div>
        <div className="px-4 -mt-10 flex justify-between items-end">
          <div className="relative">
             <div className="w-16 h-16 rounded-full border-3 border-white shadow-md overflow-hidden bg-gray-100">
               <img 
                 src={userProfile?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"} 
                 alt="Profile" 
                 className="w-full h-full object-cover"
               />
             </div>
             <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
               <span className="text-[6px] font-bold text-white">V</span>
             </div>
          </div>
          <button 
            onClick={() => setActiveModal('settings')}
            className="mb-1 w-8 h-8 bg-white rounded-full flex items-center justify-center text-text-secondary border border-gray-200 active:rotate-45 transition-transform"
          >
            <Settings size={16} />
          </button>
        </div>
        <div className="px-4 mt-2">
          <h2 className="text-base font-bold text-text-primary">{userProfile?.nickname || '穿搭达人'}</h2>
          <p className="text-[10px] text-text-secondary mt-0.5">{userProfile?.bio || '还没有个性签名，去设置中添加吧'}</p>
        </div>
        {/* 仅保留穿搭、衣单品（已去掉粉丝） */}
        <div className="flex justify-around mt-3 px-4 divide-x divide-gray-100">
          <div className="flex flex-col items-center flex-1">
            <span className="text-base font-bold text-text-primary">{(outfitRecords || []).length}</span>
            <span className="text-[10px] text-text-secondary">穿搭</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-base font-bold text-text-primary">{closetItems.length}</span>
            <span className="text-[10px] text-text-secondary">衣单品</span>
          </div>
        </div>
      </div>

      <div className="h-1 bg-gray-50 flex-shrink-0"></div>

      {/* 风格偏好 - 支持自定义 */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
            <Tag size={14} className="text-primary" />
            <h3 className="font-bold text-xs text-text-primary">我的风格偏好</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
            {availableStyles.map(style => (
                <button 
                    key={style}
                    onClick={() => onToggleStyle(style)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors flex items-center gap-1 ${
                        userStyles.includes(style) 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'bg-background-light text-text-secondary hover:bg-gray-200'
                    }`}
                >
                    {style}
                    {/* 用户自定义的标签：选中状态下可删除 */}
                    {!defaultStyles.includes(style) && userStyles.includes(style) && (
                      <X 
                        size={10} 
                        className="ml-0.5 opacity-70 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStyle(style);
                        }}
                      />
                    )}
                </button>
            ))}
            {/* 自定义风格输入 */}
            {isAddingCustomStyle ? (
              <div className="flex items-center gap-1">
                <input 
                  ref={customStyleInputRef}
                  type="text"
                  value={customStyleInput}
                  onChange={(e) => setCustomStyleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customStyleInput.trim()) {
                      const newStyle = customStyleInput.trim();
                      if (!availableStyles.includes(newStyle)) {
                        onToggleStyle(newStyle);
                      }
                      setCustomStyleInput('');
                      setIsAddingCustomStyle(false);
                    } else if (e.key === 'Escape') {
                      setCustomStyleInput('');
                      setIsAddingCustomStyle(false);
                    }
                  }}
                  placeholder="输入风格名称"
                  className="px-2 py-1 rounded-full text-[10px] border border-primary/30 outline-none focus:ring-1 focus:ring-primary/50 w-24 bg-white"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    if (customStyleInput.trim()) {
                      const newStyle = customStyleInput.trim();
                      if (!availableStyles.includes(newStyle)) {
                        onToggleStyle(newStyle);
                      }
                      setCustomStyleInput('');
                    }
                    setIsAddingCustomStyle(false);
                  }}
                  className="text-[10px] text-primary font-bold"
                >
                  确定
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsAddingCustomStyle(true);
                  setTimeout(() => customStyleInputRef.current?.focus(), 100);
                }}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-dashed border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-0.5"
              >
                <Plus size={10} />
                自定义
              </button>
            )}
        </div>
      </div>

      <div className="h-1 bg-gray-50 flex-shrink-0"></div>

      {/* 菜单列表 - 紧凑，一屏内展示 */}
      <div className="px-4 py-2 flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-1.5">

        {/* 专属模特 - 可折叠，与穿搭日历风格一致 */}
        <div className="overflow-hidden rounded-xl border border-primary/10 shadow-sm bg-white">
            <div 
                className="flex items-center justify-between p-3 bg-white active:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => setShowModel(!showModel)}
            >
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                      <UserCircle size={14} />
                    </div>
                    <span className="text-xs font-bold text-text-primary">专属模特</span>
                </div>
                <ChevronRight size={14} className={`text-gray-300 transition-transform ${showModel ? 'rotate-90' : ''}`} />
            </div>
            {showModel && (
                <div className="bg-background-light px-3 py-2 border-t border-primary/10 animate-slide-up">
                    {avatarModel ? (
                      <div className="flex items-center gap-3 py-1">
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-100 border-2 border-primary/20 flex-shrink-0">
                          <img 
                            src={avatarModel.imageUrl} 
                            alt="模特" 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-text-primary truncate">
                            {(() => {
                              const builtin = BUILTIN_MODELS.find(m => m.image === avatarModel.imageUrl);
                              return builtin ? `${builtin.name} · 使用中` : '我的模特 · 使用中';
                            })()}
                          </p>
                          <p className="text-[9px] text-text-secondary mt-0.5">
                            {(() => {
                              const builtin = BUILTIN_MODELS.find(m => m.image === avatarModel.imageUrl);
                              return builtin ? '内置模特 · 用于首页和AI试穿' : '自定义模特 · 用于首页和AI试穿';
                            })()}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onOpenModelManage?.(); }}
                          className="flex-shrink-0 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md active:scale-95 transition-transform"
                        >
                          切换
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenModelManage?.(); }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white rounded-lg border border-dashed border-primary/20 active:bg-primary/10 transition-colors"
                      >
                        <Plus size={14} className="text-primary" />
                        <span className="text-[11px] text-primary font-bold">选择或上传模特</span>
                      </button>
                    )}
                </div>
            )}
        </div>
        
        {/* 穿搭日历 - 紧凑 */}
        <div className="overflow-hidden rounded-xl border border-primary/10 shadow-sm bg-white">
            <div 
                className="flex items-center justify-between p-3 bg-white active:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => {
                  const next = !showCalendar;
                  setShowCalendar(next);
                  if (next) {
                    setLastSeenRecordCount(outfitRecords.length);
                    try { localStorage.setItem('lastSeenRecordCount', String(outfitRecords.length)); } catch {}
                  }
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                      <Clock size={14} />
                    </div>
                    <span className="text-xs font-bold text-text-primary">穿搭日历</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {outfitRecords.length > lastSeenRecordCount && (
                        <span className="bg-red-500 text-white text-[8px] px-1.5 rounded-full">{outfitRecords.length - lastSeenRecordCount}</span>
                    )}
                    <ChevronRight size={14} className={`text-gray-300 transition-transform ${showCalendar ? 'rotate-90' : ''}`} />
                </div>
            </div>
            {showCalendar && (
                <div className="bg-background-light px-3 py-1.5 border-t border-primary/10 animate-slide-up max-h-40 overflow-y-auto no-scrollbar">
                    {outfitRecords.length === 0 ? (
                        <p className="text-[10px] text-text-secondary text-center py-3">暂无记录，快去生成穿搭吧！</p>
                    ) : (
                        <div className="py-1 pl-1.5">
                            {outfitRecords.slice(0, 10).map((record, idx) => (
                                <div key={record.id} className="flex gap-2 relative pb-3 last:pb-0 group">
                                    {idx !== Math.min(outfitRecords.length, 10) - 1 && (
                                        <div className="absolute left-[4px] top-2 bottom-0 w-[2px] bg-gray-200"></div>
                                    )}
                                    <div className="mt-1 z-10">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary border border-white shadow-sm ring ring-primary/20"></div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onGoToCalendarDate?.(record.date); }}
                                        className="flex-1 bg-white p-2 rounded-lg border border-primary/10 flex gap-2 shadow-sm min-w-0 text-left active:scale-[0.99] transition-transform cursor-pointer"
                                    >
                                        <div className="w-8 h-11 rounded bg-gray-50 flex-shrink-0 overflow-hidden">
                                          {(record.outfit.fittedImage || record.outfit.items?.[0]?.img) ? (
                                            <img src={record.outfit.fittedImage || record.outfit.items[0].img} className="w-full h-full object-cover" alt="" />
                                          ) : null}
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <span className="text-[9px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">{record.date}</span>
                                                <span className="text-[8px] text-gray-400">{SOURCE_LABEL[record.source] || record.source}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-text-primary truncate">{record.outfit.title || 'DIY搭配'}</p>
                                            <p className="text-[9px] text-text-secondary truncate">{record.outfit.desc || `${record.outfit.items?.length || 0} 件单品`}</p>
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        <button 
          onClick={() => setActiveModal('favorites')}
          className="w-full flex items-center justify-between p-3 bg-white border border-primary/10 shadow-sm rounded-xl active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <Heart size={14} />
            </div>
            <span className="text-xs font-bold text-text-primary">我的收藏</span>
          </div>
          <ChevronRight size={14} className="text-gray-300" />
        </button>

        <button 
          onClick={() => {
            setActiveModal('analysis');
            if (!analysisRead) {
              setAnalysisRead(true);
              try { localStorage.setItem('analysisReportRead', '1'); } catch {}
            }
          }}
          className="w-full flex items-center justify-between p-3 bg-white border border-primary/10 shadow-sm rounded-xl active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center text-primary">
              <ShoppingBag size={14} />
            </div>
            <span className="text-xs font-bold text-text-primary">衣橱分析报告</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!analysisRead && <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 rounded font-bold">NEW</span>}
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>

        <button 
          onClick={() => setActiveModal('wearFrequency')}
          className="w-full flex items-center justify-between p-3 bg-white border border-gray-50 shadow-sm rounded-xl active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <BarChart2 size={14} />
            </div>
            <span className="text-xs font-bold text-gray-700">衣服使用频率</span>
          </div>
          <ChevronRight size={14} className="text-gray-300" />
        </button>
      </div>

      {/* Modals Integration */}
      <FavoritesModal
        isOpen={activeModal === 'favorites'}
        onClose={() => setActiveModal(null)}
        favorites={favoriteItems}
        outfitRecords={outfitRecords}
        closetItems={closetItems}
        onToggleFavorite={onToggleFavorite}
      />
      
      <ClosetAnalysisModal 
        isOpen={activeModal === 'analysis'} 
        onClose={() => setActiveModal(null)} 
        closetItems={closetItems}
        outfitRecords={outfitRecords}
        userStyles={userStyles}
      />

      <SettingsModal 
        isOpen={activeModal === 'settings'} 
        onClose={() => setActiveModal(null)} 
        onLogout={onLogout}
        userStyles={userStyles}
        onToggleStyle={onToggleStyle}
        avatarModel={avatarModel}
        onUploadAvatarModel={onUploadAvatarModel}
        onOpenModelManage={onOpenModelManage}
        onDeleteAvatarModel={onDeleteAvatarModel}
        onSaveStyles={onSaveStyles}
        isSavingStyles={isSavingStyles}
        userProfile={userProfile}
        onSaveProfile={onSaveProfile}
        userPhone={userPhone}
        showToast={showToast}
      />

      {/* 衣服使用频率Modal */}
      {activeModal === 'wearFrequency' && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-[375px] h-[85vh] bg-white rounded-t-[40px] flex flex-col animate-slide-up shadow-2xl">
            <div className="p-6 flex justify-between items-center border-b border-gray-50">
              <div className="flex items-center gap-2">
                <BarChart2 className="text-green-500" size={20} />
                <h2 className="text-lg font-bold text-gray-800">衣服使用频率</h2>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 bg-gray-50 rounded-full text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {/* 概要统计 */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-green-50 p-3 rounded-xl text-center">
                  <p className="text-lg font-black text-green-600">{closetItems.length}</p>
                  <p className="text-[8px] text-gray-400">总单品</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl text-center">
                  <p className="text-lg font-black text-blue-600">{closetItems.filter(i => (i.wearCount || 0) > 0).length}</p>
                  <p className="text-[8px] text-gray-400">已穿过</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl text-center">
                  <p className="text-lg font-black text-amber-600">{closetItems.filter(i => (i.wearCount || 0) === 0).length}</p>
                  <p className="text-[8px] text-gray-400">未穿过</p>
                </div>
              </div>

              {topWornItems.length === 0 && closetItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BarChart2 size={48} className="text-gray-300 mb-4" />
                  <p className="text-sm text-gray-400">暂无使用记录</p>
                  <p className="text-xs text-gray-300 mt-2">开始使用 AI 推荐后，这里会显示您的衣服使用频率</p>
                </div>
              ) : (
                <>
                  {/* 高频使用排行 */}
                  {topWornItems.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                        <Star size={12} className="text-yellow-500" />
                        高频穿着排行
                      </h3>
                      <div className="space-y-2">
                        {topWornItems.map((entry, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div className="w-12 h-14 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                              {entry.item?.image && (
                                <img src={entry.item.image} className="w-full h-full object-cover" alt={entry.name} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-gray-800 truncate">{entry.name}</p>
                              <p className="text-[9px] text-gray-400">{entry.item?.category}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-full transition-all"
                                  style={{ width: `${Math.min((entry.count / Math.max(...topWornItems.map(t => t.count))) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-green-600 min-w-[28px] text-right">
                                {entry.count}次
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 未穿过的单品 */}
                  {closetItems.filter(i => (i.wearCount || 0) === 0).length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                        <Clock size={12} className="text-amber-500" />
                        尚未穿着的单品
                      </h3>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {closetItems.filter(i => (i.wearCount || 0) === 0).slice(0, 10).map(item => (
                          <div key={item.id} className="flex-shrink-0 w-16 text-center">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 mb-1 border border-amber-200">
                              <img src={item.image} className="w-full h-full object-cover opacity-80" alt={item.name} />
                            </div>
                            <p className="text-[8px] text-gray-500 truncate">{item.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTab;