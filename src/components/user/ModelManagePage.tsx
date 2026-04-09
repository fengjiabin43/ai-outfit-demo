import React, { useState, useRef } from 'react';
import { ChevronLeft, Upload, Loader2, Trash2, Check, Camera, User } from 'lucide-react';
import { AvatarModel, ModelGender } from '../../types';
import { BUILTIN_MODELS, getModelsByGender, isBuiltinModelImage } from '../../data/builtinModels';

interface UserModel {
  id: string;
  imageUrl: string;
  isActive: boolean;
  createdAt?: string;
}

interface ModelManagePageProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: AvatarModel | null;
  userModels: UserModel[];
  onSelectBuiltinModel: (model: typeof BUILTIN_MODELS[0]) => Promise<void>;
  onUploadModel: (file: File) => Promise<void>;
  onActivateModel: (id: string) => Promise<void>;
  onDeleteModel: (id: string) => Promise<void>;
  showToast?: (msg: string) => void;
}

const ModelManagePage: React.FC<ModelManagePageProps> = ({
  isOpen,
  onClose,
  activeModel,
  userModels,
  onSelectBuiltinModel,
  onUploadModel,
  onActivateModel,
  onDeleteModel,
  showToast,
}) => {
  const [genderFilter, setGenderFilter] = useState<ModelGender>('female');
  const [isUploading, setIsUploading] = useState(false);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredBuiltins = getModelsByGender(genderFilter);

  // 判断当前激活的模特是否为某个内置模特
  const isActiveBuiltin = (builtinId: string) => {
    if (!activeModel) return false;
    const builtin = BUILTIN_MODELS.find(m => m.id === builtinId);
    return builtin && activeModel.image === builtin.image;
  };

  // 判断当前激活的模特是否为某个用户上传的模特
  const isActiveUser = (userModelId: string) => {
    if (!activeModel) return false;
    const userModel = userModels.find(m => m.id === userModelId);
    return userModel && activeModel.image === userModel.imageUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast?.('图片大小不能超过10MB');
        return;
      }
      setIsUploading(true);
      try {
        await onUploadModel(file);
        showToast?.('全身照上传成功！');
      } catch (err) {
        console.error('上传失败:', err);
        showToast?.('上传失败，请重试');
      } finally {
        setIsUploading(false);
        // 清空 input，允许重复选择同一文件
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectBuiltin = async (model: typeof BUILTIN_MODELS[0]) => {
    if (isActiveBuiltin(model.id)) return;
    setIsSelecting(model.id);
    try {
      await onSelectBuiltinModel(model);
    } finally {
      setIsSelecting(null);
    }
  };

  const handleActivateUser = async (id: string) => {
    if (isActiveUser(id)) return;
    setIsSelecting(id);
    try {
      await onActivateModel(id);
    } finally {
      setIsSelecting(null);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      await onDeleteModel(id);
      showToast?.('已删除该模特');
    } catch {
      showToast?.('删除失败');
    } finally {
      setIsDeletingId(null);
    }
  };

  // 找出当前激活模特的显示名称和标签
  const getActiveModelInfo = () => {
    if (!activeModel) return null;
    // 检查是否为内置模特
    const builtin = BUILTIN_MODELS.find(m => m.image === activeModel.image);
    if (builtin) {
      return { name: builtin.name, tag: '内置模特', gender: builtin.gender };
    }
    return { name: activeModel.name || '我的模特', tag: '自定义', gender: activeModel.gender };
  };

  const activeInfo = getActiveModelInfo();

  return (
    <div className="absolute inset-0 z-[70] bg-background-light flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-primary text-sm font-medium active:opacity-60"
          >
            <ChevronLeft size={18} />
            返回
          </button>
          <h1 className="text-base font-bold text-text-primary">模特管理</h1>
          <div className="w-14" /> {/* spacer */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-16">
          
          {/* 当前模特展示 */}
          <div className="px-4 py-3">
            <h2 className="text-xs font-bold text-text-primary mb-2">当前模特</h2>
            {activeModel ? (
              <div className="bg-white rounded-xl p-3 flex gap-3 items-center shadow-sm border border-gray-50">
                <div className="w-14 h-[72px] rounded-lg overflow-hidden bg-gray-100 border-2 border-primary/30 flex-shrink-0">
                  <img
                    src={activeModel.image}
                    alt="当前模特"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-text-primary">
                    {activeInfo?.name || '模特'}
                  </h3>
                  {activeInfo?.tag && (
                    <span className="inline-flex items-center self-start px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
                      {activeInfo.tag}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-green-600 font-medium">
                      使用中（首页 + AI试穿）
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm border border-gray-50">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={22} className="text-gray-300" />
                </div>
                <p className="text-[11px] text-text-secondary">尚未选择模特，请从下方选择</p>
              </div>
            )}
          </div>

          {/* 内置模特 */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-text-primary">内置模特</h2>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setGenderFilter('female')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    genderFilter === 'female'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary'
                  }`}
                >
                  女
                </button>
                <button
                  onClick={() => setGenderFilter('male')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    genderFilter === 'male'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary'
                  }`}
                >
                  男
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {filteredBuiltins.map(model => {
                const isActive = isActiveBuiltin(model.id);
                const isLoading = isSelecting === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelectBuiltin(model)}
                    disabled={isActive || isLoading}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                      isActive
                        ? 'border-primary shadow-md shadow-primary/20'
                        : 'border-gray-100 hover:border-primary/30'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                      <img
                        src={model.image}
                        alt={model.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="px-2 py-1.5 bg-white">
                      <p className="text-[10px] font-bold text-text-primary truncate">{model.name}</p>
                    </div>
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    {isLoading && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <Loader2 size={20} className="text-primary animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 我的模特 */}
          <div className="px-4 pb-3">
            <h2 className="text-xs font-bold text-text-primary mb-2">我的模特</h2>

            {/* 隐藏文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="grid grid-cols-3 gap-2.5">
              {/* 上传按钮 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/40 transition-colors active:scale-95"
              >
                <div className="aspect-[3/4] flex flex-col items-center justify-center gap-1.5 bg-gray-50/50">
                  {isUploading ? (
                    <Loader2 size={22} className="text-primary animate-spin" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera size={16} className="text-primary" />
                    </div>
                  )}
                  <span className="text-[10px] text-text-secondary font-bold">
                    {isUploading ? '上传中...' : '上传全身照'}
                  </span>
                </div>
              </button>

              {/* 用户上传的模特列表 */}
              {userModels
                .filter(m => !isBuiltinModelImage(m.imageUrl))
                .map(model => {
                  const isActive = isActiveUser(model.id);
                  const isLoading = isSelecting === model.id;
                  const isDeleting = isDeletingId === model.id;
                  return (
                    <div
                      key={model.id}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                        isActive
                          ? 'border-primary shadow-md shadow-primary/20'
                          : 'border-gray-100'
                      }`}
                    >
                      <button
                        onClick={() => handleActivateUser(model.id)}
                        disabled={isActive || isLoading}
                        className="w-full active:scale-95 transition-transform"
                      >
                        <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                          <img
                            src={model.imageUrl}
                            alt="我的模特"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </button>
                      <div className="px-2 py-1.5 bg-white flex items-center justify-between">
                        <p className="text-[10px] font-bold text-text-primary truncate">
                          {isActive ? '使用中' : '我的模特'}
                        </p>
                        {!isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(model.id);
                            }}
                            disabled={isDeleting}
                            className="text-gray-300 hover:text-red-400 transition-colors p-0.5"
                          >
                            {isDeleting ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        )}
                      </div>
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow">
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                      {isLoading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <Loader2 size={20} className="text-primary animate-spin" />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 拍摄建议 */}
          <div className="px-4 pb-6">
            <div className="bg-primary/5 rounded-2xl p-3 space-y-1.5 border border-primary/10">
              <p className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                <Camera size={12} />
                上传全身照建议
              </p>
              <ul className="text-[9px] text-primary/70 space-y-0.5 pl-1">
                <li>• 选择光线充足的环境，避免强逆光</li>
                <li>• 穿着贴身衣物，方便 AI 识别身形</li>
                <li>• 正面站立，双手自然下垂</li>
                <li>• 纯色背景效果更佳（白墙等）</li>
              </ul>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ModelManagePage;
