import React, { useState } from 'react';
import { X, Trash2, Calendar, Tag, Shirt } from 'lucide-react';
import { OutfitRecord } from '../../types';

interface OutfitRecordDetailProps {
  record: OutfitRecord;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
  showToast?: (msg: string) => void;
}

const SOURCE_LABEL: Record<string, string> = {
  'ai-recommend': 'AI 推荐',
  'weekly-plan': '一周规划',
  'manual': 'DIY 搭配',
};

const OutfitRecordDetail: React.FC<OutfitRecordDetailProps> = ({
  record,
  onClose,
  onDelete,
  showToast,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete?.(record.id);
      showToast?.('记录已删除');
      onClose();
    } catch {
      showToast?.('删除失败，请重试');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const outfit = record.outfit;
  const occasionTags = outfit.occasionTags || [];

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 flex items-end justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h3 className="text-base font-bold text-text-primary">搭配详情</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 可滚动内容 */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
          {/* 搭配大图 */}
          {outfit.fittedImage && (
            <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-4 border border-gray-100">
              <img
                src={outfit.fittedImage}
                alt={outfit.title}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* 标题与描述 */}
          <h4 className="text-sm font-bold text-gray-800 mb-1">{outfit.title || 'DIY搭配'}</h4>
          {outfit.desc && (
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">{outfit.desc}</p>
          )}

          {/* 信息标签 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold">
              <Calendar size={10} />
              {record.date}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-500 rounded-full text-[10px] font-bold">
              <Tag size={10} />
              {SOURCE_LABEL[record.source] || record.source}
            </span>
          </div>

          {/* 场合标签 */}
          {occasionTags.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">适合场合</p>
              <div className="flex flex-wrap gap-1.5">
                {occasionTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 单品列表 */}
          {outfit.items && outfit.items.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                <Shirt size={10} />
                包含单品 ({outfit.items.length})
              </p>
              <div className="grid grid-cols-4 gap-2">
                {outfit.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 mb-1">
                      {item.img ? (
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Shirt size={20} />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500 text-center truncate w-full">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        {onDelete && (
          <div className="flex-shrink-0 px-5 pb-6 pt-3 border-t border-gray-100">
            {showConfirm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100 active:scale-[0.98] transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-red-500 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {isDeleting ? '删除中...' : '确认删除'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-3 rounded-2xl text-sm font-bold text-red-500 bg-red-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Trash2 size={16} />
                删除此记录
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitRecordDetail;
