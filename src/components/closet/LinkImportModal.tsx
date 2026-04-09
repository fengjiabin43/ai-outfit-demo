import React, { useState, useEffect } from 'react';
import { Zap, Bot, X } from 'lucide-react';
import { ClothingItem } from '../../types';

interface LinkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (item: ClothingItem) => void;
}

const LinkImportModal: React.FC<LinkImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState<'input' | 'analyzing' | 'result'>('input');
  const [linkText, setLinkText] = useState('');
  const [progress, setProgress] = useState(0);
  const [analysisText, setAnalysisText] = useState('初始化...');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTimeout(() => {
        setStep('input');
        setLinkText('');
        setProgress(0);
      }, 300);
    }
  }, [isOpen]);

  const handleMockPaste = () => {
    setLinkText("【淘宝】https://m.tb.cn/h.5xyz 美式复古重磅连帽卫衣春秋宽松灰色");
  };

  const startAnalysis = () => {
    if (!linkText) return;
    setStep('analyzing');
    
    // Simulate Analysis Process
    setTimeout(() => {
      setProgress(40);
      setAnalysisText("提取商品图中... 正在通过 VLM 识别衣服材质");
    }, 800);

    setTimeout(() => {
      setProgress(80);
      setAnalysisText("智能标注标签... 确定分类：上装 > 卫衣");
    }, 2000);

    setTimeout(() => {
      setProgress(100);
      setAnalysisText("解析完成！已自动匹配所有属性标签");
      setTimeout(() => setStep('result'), 500);
    }, 3000);
  };

  const handleConfirm = () => {
    onImport({
      id: Date.now().toString(),
      name: '美式复古重磅连帽卫衣 - 灰色',
      image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop',
      tags: ['连帽卫衣', '重磅棉', '美式复古', '宽松版型'],
      isNew: true
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      
      {/* Modal Content */}
      {step === 'analyzing' ? (
         <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 bg-white/95 backdrop-blur-sm rounded-[45px]">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-6 relative overflow-hidden ring-4 ring-orange-100">
              <Zap className="text-orange-500 animate-pulse" size={32} fill="currentColor" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2 text-lg">正在解析链接...</h3>
            <p className="text-xs text-gray-400 mb-8 text-center max-w-[200px] leading-relaxed">{analysisText}</p>
            
            <div className="w-full max-w-[240px] bg-gray-100 h-1.5 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
         </div>
      ) : step === 'result' ? (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white rounded-t-[40px] p-8 animate-slide-up max-w-[375px] mx-auto right-0">
           <div className="w-full bg-gray-50 rounded-3xl p-4 border border-gray-100">
              <div className="flex gap-4 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200" 
                  className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                  alt="Result"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold line-clamp-2 text-gray-800 mb-2">美式复古重磅连帽卫衣 - 灰色</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['连帽卫衣', '重磅棉', '美式复古', '宽松版型'].map(tag => (
                      <span key={tag} className="bg-gray-100 px-2 py-1 rounded-md text-[9px] text-gray-500 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl text-[10px] text-orange-600 italic border border-orange-100 flex items-start gap-2">
                <Bot size={14} className="mt-0.5" />
                <span>AI匹配：该单品适配您衣橱中3套已有方案，可尝试与工装裤搭配。</span>
              </div>
              <button 
                onClick={handleConfirm}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-200 active:scale-95 transition-transform"
              >
                确认入库
              </button>
            </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white rounded-t-[40px] p-8 animate-slide-up max-w-[375px] mx-auto right-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-gray-800">电商导入</h3>
            <button onClick={onClose} className="p-1 bg-gray-50 rounded-full text-gray-400">
                <X size={16} />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mb-6">粘贴淘宝、拼多多、京东链接，AI 自动抓取属性</p>
          
          <div className="relative mb-6">
            <textarea 
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs h-28 outline-none focus:ring-2 focus:ring-orange-100 resize-none text-gray-600"
              placeholder="粘贴分享链接到这里..."
            />
            {!linkText && (
              <button 
                onClick={handleMockPaste}
                className="absolute bottom-3 right-3 text-[10px] bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-500 font-medium hover:bg-gray-50 transition-colors"
              >
                一键粘贴
              </button>
            )}
          </div>

          <button 
            onClick={startAnalysis}
            disabled={!linkText}
            className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all ${
              linkText 
                ? 'bg-gradient-to-r from-orange-400 to-red-400 shadow-orange-200 active:scale-95' 
                : 'bg-gray-300 shadow-none cursor-not-allowed'
            }`}
          >
            智能解析入库
          </button>
        </div>
      )}
    </>
  );
};

export default LinkImportModal;