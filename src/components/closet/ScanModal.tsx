import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Sparkles, Zap, Loader2, Images, CheckCircle } from 'lucide-react';
import { ClothingItem } from '../../types';
import { wardrobeApi, isLoggedIn } from '../../api';

// 图片分析和白底图生成全部通过后端百炼 API 完成
interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (item: ClothingItem) => void;
  onBatchImport?: (items: ClothingItem[]) => void;
}

const ScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose, onImport, onBatchImport }) => {
  const [step, setStep] = useState<'select' | 'processing' | 'result' | 'batch-select' | 'batch-processing' | 'batch-result'>('select');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [whiteBgImageUrl, setWhiteBgImageUrl] = useState<string | null>(null);  // 本地持久化 URL
  const [whiteBgCdnUrl, setWhiteBgCdnUrl] = useState<string | null>(null);    // CDN 即时显示 URL
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // 批量导入状态
  const [batchImages, setBatchImages] = useState<string[]>([]);
  const [batchProcessingIndex, setBatchProcessingIndex] = useState(0);
  const [batchResults, setBatchResults] = useState<ClothingItem[]>([]);
  const [batchErrors, setBatchErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedImage(null);
      setAnalysisResult(null);
      setWhiteBgImageUrl(null);
      setWhiteBgCdnUrl(null);
      setApiError(null);
      setIsSaving(false);
      setBatchImages([]);
      setBatchProcessingIndex(0);
      setBatchResults([]);
      setBatchErrors([]);
    }
  }, [isOpen]);

  // 批量文件选择处理
  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const readers: Promise<string>[] = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(readers).then(base64Images => {
        setBatchImages(base64Images);
        setStep('batch-select');
      });
    }
  };

  // 单张图片：一键处理（AI 分析 + 白底图生成，后端并行）
  const processImage = async (base64Image: string) => {
    setStep('processing');
    setApiError(null);

    try {
      if (!isLoggedIn()) {
        // 未登录 - 用默认数据
        setAnalysisResult({
          name: '未登录单品',
          category: '上衣',
          tags: ['待识别'],
        });
        setWhiteBgImageUrl(null);
        setStep('result');
        return;
      }

      // 调用后端一键处理接口（AI 分析 + 白底图生成并行执行）
      const result = await wardrobeApi.processClothing({
        base64Image: base64Image,
      });
      const data = result.data;

      setAnalysisResult({
        name: data?.name || 'AI识别单品',
        category: data?.category || '其他',
        tags: data?.tags || [],
        subCategory: data?.subCategory || undefined,
      });
      setWhiteBgImageUrl(data?.whiteBgImageUrl || null);
      setWhiteBgCdnUrl(data?.whiteBgCdnUrl || null);
      setStep('result');
    } catch (error: any) {
      console.error('处理失败:', error);
      const msg = error?.message || String(error);
      
      // 提供更友好的错误提示
      let errorMsg = '处理失败，请重试';
      if (msg.includes('白底图生成失败')) {
        errorMsg = '白底图生成失败，请确保图片清晰且包含完整的衣服';
      } else if (msg.includes('超时') || msg.includes('timeout')) {
        errorMsg = '处理超时，请稍后重试';
      } else if (msg.includes('网络') || msg.includes('network')) {
        errorMsg = '网络连接失败，请检查网络后重试';
      }
      
      setApiError(errorMsg);
      // 即使失败也显示结果页，让用户可以重试
      setAnalysisResult({
        name: '处理失败 (请重试)',
        category: '上衣',
        tags: ['处理失败'],
      });
      setWhiteBgImageUrl(null);
      setWhiteBgCdnUrl(null);
      setStep('result');
    }
  };

  // 单张文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        processImage(base64); // 直接开始处理，无需二次确认
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 确认保存到衣柜（此时白底图已经生成好了，只需保存到 DB）
  const handleConfirm = async () => {
    if (!analysisResult) return;

    setIsSaving(true);
    setApiError(null);

    try {
      if (isLoggedIn() && whiteBgImageUrl) {
        // 直接用已生成的白底图保存到数据库
        const clothesResult = await wardrobeApi.addClothes({
          name: analysisResult.name,
          imageUrl: whiteBgImageUrl,
          category: analysisResult.category,
          tags: analysisResult.tags || [],
        });

        if (onImport && clothesResult.data) {
          onImport({
            id: clothesResult.data._id || Date.now().toString(),
            name: clothesResult.data.name || analysisResult.name,
            category: clothesResult.data.category || analysisResult.category,
            tags: clothesResult.data.tags || analysisResult.tags,
            image: clothesResult.data.imageUrl || whiteBgImageUrl,
            isNew: true,
          });
        }
        onClose();
      } else if (!isLoggedIn()) {
        // 未登录 - 使用本地数据
        if (onImport) {
          onImport({
            id: Date.now().toString(),
            name: analysisResult.name,
            category: analysisResult.category,
            tags: analysisResult.tags,
            image: selectedImage || '',
            isNew: true,
          });
        }
        onClose();
      } else {
        setApiError('白底图未生成，请重新上传');
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      setApiError(error.message || '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 批量处理单张图片
  const processSingleImage = async (base64Image: string, index: number): Promise<ClothingItem | null> => {
    try {
      if (!isLoggedIn()) {
        return {
          id: Date.now().toString() + '_' + index,
          name: `单品 ${index + 1}`,
          category: '其他',
          tags: [],
          image: base64Image,
          isNew: true,
        };
      }

      // 调用后端一键处理
      const result = await wardrobeApi.processClothing({ base64Image });
      const data = result.data;

      if (!data?.whiteBgImageUrl) {
        throw new Error('白底图生成失败');
      }

      // 保存到数据库
      const clothesResult = await wardrobeApi.addClothes({
        name: data.name || `单品 ${index + 1}`,
        imageUrl: data.whiteBgImageUrl,
        category: data.category || '其他',
        tags: data.tags || [],
      });

      return {
        id: clothesResult.data?._id || Date.now().toString(),
        name: clothesResult.data?.name || data.name,
        category: clothesResult.data?.category || data.category,
        tags: clothesResult.data?.tags || data.tags,
        image: clothesResult.data?.imageUrl || data.whiteBgImageUrl,
        isNew: true,
      };
    } catch (error) {
      console.error('处理图片失败:', error);
      return null;
    }
  };

  // 开始批量处理
  const startBatchProcessing = async () => {
    setStep('batch-processing');
    setBatchProcessingIndex(0);
    setBatchResults([]);
    setBatchErrors([]);

    const results: ClothingItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < batchImages.length; i++) {
      setBatchProcessingIndex(i);
      
      const result = await processSingleImage(batchImages[i], i);
      if (result) {
        results.push(result);
      } else {
        errors.push(`图片 ${i + 1} 处理失败`);
      }
      
      setBatchResults([...results]);
      setBatchErrors([...errors]);
    }

    setStep('batch-result');
  };

  // 确认批量导入
  const confirmBatchImport = () => {
    if (onBatchImport && batchResults.length > 0) {
      onBatchImport(batchResults);
    } else if (onImport) {
      batchResults.forEach(item => onImport(item));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />

      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-20"
      >
        <X size={20} />
      </button>

      {/* 选择上传方式 */}
      {step === 'select' && (
        <div className="w-full max-w-xs p-6 animate-slide-up">
            <h2 className="text-2xl font-bold text-white text-center mb-2">录入新单品</h2>
            <p className="text-white/60 text-center text-xs mb-10">AI 自动识别并生成白底商品图</p>
            
            <input 
              type="file" 
              ref={batchFileInputRef} 
              className="hidden" 
              accept="image/*"
              multiple
              onChange={handleBatchFileChange}
            />
            
            <div className="space-y-4">
                <button 
                    onClick={triggerFileInput} 
                    className="w-full bg-gradient-to-r from-primary to-indigo-600 p-5 rounded-3xl flex items-center justify-between group active:scale-95 transition-all shadow-lg shadow-purple-900/40"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                            <Camera size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-white font-bold text-sm">拍摄 / 上传照片</h3>
                            <p className="text-white/80 text-[10px]">AI 自动生成白底图</p>
                        </div>
                    </div>
                    <Sparkles className="text-white/50" size={20} />
                </button>
                
                <button 
                    onClick={() => batchFileInputRef.current?.click()} 
                    className="w-full bg-white/10 border border-white/20 p-5 rounded-3xl flex items-center justify-between group active:scale-95 transition-all hover:bg-white/15"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                            <Images size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-white font-bold text-sm">批量导入</h3>
                            <p className="text-white/60 text-[10px]">一次选择多张图片</p>
                        </div>
                    </div>
                    <Sparkles className="text-white/30" size={20} />
                </button>
            </div>
        </div>
      )}

      {/* 处理中动画 */}
      {step === 'processing' && (
        <div className="relative w-72 h-96 border-2 border-white/20 rounded-[32px] overflow-hidden shadow-2xl bg-gray-900 mx-auto">
             {selectedImage && (
                <img 
                    src={selectedImage} 
                    className="w-full h-full object-cover opacity-60"
                    alt="Processing"
                />
             )}
             
             {/* Scanning Laser Line */}
             <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_20px_var(--color-primary),0_0_10px_var(--color-primary)] z-10 animate-scan"></div>
             
             {/* Grid Overlay */}
             <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-20 pointer-events-none">
                {[...Array(16)].map((_, i) => (
                    <div key={i} className="border-[0.5px] border-white/30"></div>
                ))}
             </div>

             <div className="absolute bottom-20 w-full flex flex-col items-center gap-2 px-4">
                  <span className="bg-purple-600/80 backdrop-blur text-white text-[10px] px-3 py-1.5 rounded-full animate-pulse flex items-center gap-2 shadow-lg">
                      <Zap size={10} fill="currentColor" />
                      AI 正在生成白底商品图...
                  </span>
                  <span className="bg-white/10 backdrop-blur text-white/70 text-[9px] px-2 py-1 rounded-full">
                      支持平铺/穿着/悬挂等多种场景
                  </span>
             </div>
        </div>
      )}

      {/* 结果展示 */}
      {step === 'result' && analysisResult && (
           <div className="w-full max-w-[340px] bg-white rounded-3xl p-6 animate-slide-up relative shadow-2xl">
                {/* 白底商品图展示 */}
                <div className="w-full aspect-[3/4] bg-white rounded-2xl overflow-hidden mb-5 border border-gray-100 relative flex items-center justify-center">
                    <img 
                      src={whiteBgCdnUrl || whiteBgImageUrl || selectedImage || ''} 
                      className="w-full h-full object-contain bg-white"
                      alt="白底商品图"
                      crossOrigin="anonymous"
                    />
                    {(whiteBgCdnUrl || whiteBgImageUrl) && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1">
                        <Sparkles size={8} fill="currentColor" />
                        AI 白底图
                      </div>
                    )}
                </div>
                
                <div className="mb-4 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 mb-1 block">名称</label>
                      <input
                        type="text"
                        value={analysisResult.name}
                        onChange={(e) => setAnalysisResult({ ...analysisResult, name: e.target.value })}
                        className="w-full text-sm font-bold text-gray-800 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 focus:border-primary focus:bg-white focus:outline-none transition-colors"
                        placeholder="输入衣物名称"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 mb-1 block">分类</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {['上衣', '下装', '鞋子', '配饰', '其他'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setAnalysisResult({ ...analysisResult, category: cat })}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                              analysisResult.category === cat
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-start mb-5">
                    {(analysisResult.tags || []).map((tag: string, idx: number) => (
                        <span key={idx} className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-bold">#{tag}</span>
                    ))}
                </div>

                {apiError && (
                  <p className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    {apiError}
                  </p>
                )}

                <button 
                    onClick={handleConfirm}
                    disabled={isSaving || (!whiteBgImageUrl && !whiteBgCdnUrl)}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/30 active:scale-95 transition-all hover:bg-primary-deep disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        正在保存...
                      </>
                    ) : (!whiteBgImageUrl && !whiteBgCdnUrl) ? (
                      '白底图生成失败，请重新上传'
                    ) : (
                      '确认录入衣橱'
                    )}
                </button>
           </div>
      )}

      {/* 批量导入 - 预览选中的图片 */}
      {step === 'batch-select' && batchImages.length > 0 && (
        <div className="w-full max-w-[340px] bg-white rounded-3xl p-6 animate-slide-up relative shadow-2xl max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">批量导入</h2>
          <p className="text-gray-400 text-center text-xs mb-6">已选择 {batchImages.length} 张图片</p>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            {batchImages.map((img, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-100">
                <img src={img} className="w-full h-full object-cover" alt={`预览 ${idx + 1}`} />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button 
              onClick={startBatchProcessing}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/30 active:scale-95 transition-all"
            >
              开始处理 ({batchImages.length} 张)
            </button>
            <button 
              onClick={() => { setStep('select'); setBatchImages([]); }}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 批量导入 - 处理中 */}
      {step === 'batch-processing' && (
        <div className="w-full max-w-xs p-6 animate-slide-up text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-600/20 flex items-center justify-center">
            <Loader2 size={40} className="text-purple-500 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">正在批量处理</h2>
          <p className="text-white/60 text-sm mb-4">
            {batchProcessingIndex + 1} / {batchImages.length}
          </p>
          
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((batchProcessingIndex + 1) / batchImages.length) * 100}%` }}
            />
          </div>
          
          {batchImages[batchProcessingIndex] && (
            <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden border-2 border-white/30">
              <img 
                src={batchImages[batchProcessingIndex]} 
                className="w-full h-full object-cover"
                alt="处理中"
              />
            </div>
          )}
        </div>
      )}

      {/* 批量导入 - 结果 */}
      {step === 'batch-result' && (
        <div className="w-full max-w-[340px] bg-white rounded-3xl p-6 animate-slide-up relative shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">处理完成</h2>
            <p className="text-gray-400 text-sm mt-1">
              成功 {batchResults.length} 件，失败 {batchErrors.length} 件
            </p>
          </div>
          
          {batchResults.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 mb-3">已导入单品</p>
              <div className="grid grid-cols-3 gap-2">
                {batchResults.map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className="aspect-square rounded-xl overflow-hidden border border-gray-100">
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <p className="text-[9px] text-gray-600 truncate mt-1 text-center">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {batchErrors.length > 0 && (
            <div className="mb-6 p-3 bg-red-50 rounded-xl">
              <p className="text-xs font-bold text-red-500 mb-1">处理失败</p>
              <ul className="text-[10px] text-red-400">
                {batchErrors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          <button 
            onClick={confirmBatchImport}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/30 active:scale-95 transition-all"
          >
            确认导入 ({batchResults.length} 件)
          </button>
        </div>
      )}

    </div>
  );
};

export default ScanModal;
