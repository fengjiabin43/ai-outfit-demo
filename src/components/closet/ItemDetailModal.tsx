import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Save, Tag, Grid, Check, Heart, ThumbsDown, Shirt, Loader2 } from 'lucide-react';
import { ClothingItem, PrimaryCategory, SecondaryCategory, ItemMark } from '../../types';
import { wardrobeApi } from '../../api';

interface ItemDetailModalProps {
  item: ClothingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (item: ClothingItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, isOpen, onClose, onDelete, onUpdate, isFavorite, onToggleFavorite }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<ClothingItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isMarkLoading, setIsMarkLoading] = useState<ItemMark | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      setEditedItem({ ...item, isFavorite: item.isFavorite ?? isFavorite });
      setIsEditing(false);
      setConfirmDelete(false);
    }
  }, [isOpen, item, isFavorite]);

  if (!isOpen || !item || !editedItem) return null;

  const handleSave = () => {
    onUpdate(editedItem);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(item.id);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  const toggleTag = (tag: string) => {
    if (!editedItem.tags) return;
    const newTags = editedItem.tags.includes(tag)
      ? editedItem.tags.filter(t => t !== tag)
      : [...editedItem.tags, tag];
    setEditedItem({ ...editedItem, tags: newTags });
  };

  // 切换标记（已穿/喜欢/不喜欢）并保存到后端
  const toggleMark = async (mark: ItemMark) => {
    const currentMarks = editedItem.marks || [];
    const isAdding = !currentMarks.includes(mark);
    const newMarks = isAdding
      ? [...currentMarks, mark]
      : currentMarks.filter(m => m !== mark);
    
    // 先更新本地状态
    setEditedItem({ ...editedItem, marks: newMarks });
    
    // 调用后端 API 保存
    setIsMarkLoading(mark);
    try {
      await wardrobeApi.markClothes(item.id, mark, isAdding ? 'add' : 'remove');
      // 更新父组件的数据
      onUpdate({ ...editedItem, marks: newMarks });
    } catch (error) {
      console.error('标记保存失败:', error);
      // 回滚状态
      setEditedItem({ ...editedItem, marks: currentMarks });
    } finally {
      setIsMarkLoading(null);
    }
  };

  // 二级分类选项
  const getSubCategories = (category?: PrimaryCategory): SecondaryCategory[] => {
    if (!category) return [];
    const subCategories: Record<PrimaryCategory, SecondaryCategory[]> = {
      '上衣': ['短袖T恤', '长袖T恤', '衬衫', '卫衣', '毛衣/针织衫', '外套', '西装/正装', '背心/吊带', '其他'],
      '下装': ['短裤', '长裤', '运动裤', '短裙', '长裙', '其他'],
      '鞋子': ['运动鞋', '休闲鞋', '皮鞋/正装鞋', '靴子', '凉鞋/拖鞋', '其他'],
      '配饰': ['帽子', '包包', '腰带', '手表/手链', '项链/配饰', '其他']
    };
    return subCategories[category] || [];
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-[340px] max-h-[85vh] bg-white rounded-[32px] overflow-y-auto no-scrollbar shadow-2xl relative animate-slide-up mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Image */}
        <div className="relative h-64 w-full bg-gray-100 group flex-shrink-0">
          <img 
            src={editedItem.image} 
            className="w-full h-full object-cover" 
            alt={editedItem.name} 
          />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {onToggleFavorite && (
              <button 
                onClick={() => onToggleFavorite(item.id)}
                className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${
                  isFavorite ? 'bg-red-500/90 text-white' : 'bg-black/20 text-white hover:bg-black/40'
                }`}
              >
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-gray-800 shadow-sm flex items-center gap-1.5">
             <Grid size={12} className="text-orange-500" />
             {editedItem.category}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            {isEditing ? (
              <div className="flex-1 mr-4">
                 <input 
                   type="text" 
                   value={editedItem.name}
                   onChange={(e) => setEditedItem({...editedItem, name: e.target.value})}
                   className="w-full text-lg font-bold text-gray-800 border-b border-gray-200 focus:border-orange-500 outline-none pb-1 bg-transparent"
                 />
                 <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-2">一级分类</p>
                      <div className="flex gap-2 flex-wrap">
                        {(['上衣', '下装', '鞋子', '配饰'] as PrimaryCategory[]).map(cat => (
                          <button 
                            key={cat}
                            onClick={() => {
                              setEditedItem({...editedItem, category: cat, subCategory: undefined});
                            }}
                            className={`text-[9px] px-2 py-1 rounded-lg border transition-colors ${editedItem.category === cat ? 'bg-gray-800 text-white border-gray-800' : 'text-gray-400 border-gray-200 hover:border-gray-300'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    {editedItem.category && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 mb-2">二级分类</p>
                        <div className="flex gap-2 flex-wrap">
                          {getSubCategories(editedItem.category).map(subCat => (
                            <button 
                              key={subCat}
                              onClick={() => setEditedItem({...editedItem, subCategory: subCat})}
                              className={`text-[9px] px-2 py-1 rounded-lg border transition-colors ${editedItem.subCategory === subCat ? 'bg-purple-600 text-white border-purple-600' : 'text-gray-400 border-gray-200 hover:border-gray-300'}`}
                            >
                              {subCat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1">{item.name}</h3>
                <p className="text-xs text-gray-400">
                  {item.addedDate ? `添加于 ${new Date(item.addedDate).toLocaleDateString('zh-CN')}` : ''}
                </p>
              </div>
            )}

            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isEditing ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {isEditing ? <Check size={18} /> : <Edit2 size={16} />}
            </button>
          </div>

          <div className="h-px bg-gray-100 my-4"></div>

          {/* Marks Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
               <Shirt size={14} className="text-gray-400" />
               <span className="text-xs font-bold text-gray-500">标记状态</span>
            </div>
            <div className="flex gap-2">
              {(['已穿', '喜欢', '不喜欢'] as ItemMark[]).map(mark => {
                const isActive = editedItem.marks?.includes(mark);
                const isLoading = isMarkLoading === mark;
                const icons = {
                  '已穿': <Shirt size={14} />,
                  '喜欢': <Heart size={14} />,
                  '不喜欢': <ThumbsDown size={14} />
                };
                const colors = {
                  '已穿': 'bg-blue-100 text-blue-600 border-blue-200',
                  '喜欢': 'bg-red-100 text-red-600 border-red-200',
                  '不喜欢': 'bg-gray-100 text-gray-600 border-gray-200'
                };
                return (
                  <button
                    key={mark}
                    onClick={() => toggleMark(mark)}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border disabled:opacity-60 ${
                      isActive ? colors[mark] : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : icons[mark]}
                    {mark}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
               <Tag size={14} className="text-gray-400" />
               <span className="text-xs font-bold text-gray-500">风格标签</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                  // Edit Mode Tags (Click to toggle commonly used tags or simple input)
                  ['休闲', '复古', '通勤', '约会', '保暖', '法式', '酷飒', '简约'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-[10px] px-3 py-1.5 rounded-full font-bold transition-all ${editedItem.tags?.includes(tag) ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'}`}
                      >
                          {tag}
                      </button>
                  ))
              ) : (
                  // View Mode Tags
                  item.tags?.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full text-[10px] font-bold border border-gray-100">
                        #{tag}
                    </span>
                  ))
              )}
            </div>
          </div>

          {/* Footer Actions */}
          {!isEditing && (
              <button 
                onClick={handleDelete}
                className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    confirmDelete 
                    ? 'bg-red-500 text-white shadow-xl shadow-red-200' 
                    : 'bg-red-50 text-red-500 hover:bg-red-100'
                }`}
              >
                <Trash2 size={18} />
                {confirmDelete ? '确认删除？' : '删除单品'}
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;