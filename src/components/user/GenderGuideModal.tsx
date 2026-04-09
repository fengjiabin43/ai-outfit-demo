import React, { useState } from 'react';
import { X } from 'lucide-react';

interface GenderGuideModalProps {
  isOpen: boolean;
  onConfirm: (gender: 'male' | 'female') => void;
  onSkip: () => void;
}

const GenderGuideModal: React.FC<GenderGuideModalProps> = ({ isOpen, onConfirm, onSkip }) => {
  const [selected, setSelected] = useState<'male' | 'female' | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-3xl w-[320px] mx-4 p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-gray-900">完善个人信息</h3>
          <button onClick={onSkip} className="p-1 text-gray-300 hover:text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-5">选择性别可以让 AI 推荐更精准的穿搭方案</p>

        <div className="flex gap-3 mb-6">
          {([['female', '女生', '♀'] as const, ['male', '男生', '♂'] as const]).map(([val, label, icon]) => (
            <button
              key={val}
              onClick={() => setSelected(val)}
              className={`flex-1 py-4 rounded-2xl text-center transition-all font-bold ${
                selected === val
                  ? val === 'female'
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-200 scale-105'
                    : 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-sm">{label}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gray-900 text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          确认
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2 mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          稍后再说
        </button>
      </div>
    </div>
  );
};

export default GenderGuideModal;
