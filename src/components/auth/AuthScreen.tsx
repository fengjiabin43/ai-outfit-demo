import React, { useState } from 'react';
import { Phone, ArrowRight, Sparkles, ChevronLeft, CheckCircle2, X } from 'lucide-react';
import { authApi } from '../../api';
import { isDemoMode } from '../../mock/demoApi';
import { DEMO_USER } from '../../mock/demoData';

interface AuthScreenProps {
  onLogin: (user: { id: string; phone: string; nickname: string; avatar: string | null }) => void;
  onClose?: () => void;
}

type AuthStep = 'phone' | 'sending' | 'code';

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onClose }) => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // 发送验证码
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length !== 11) {
      setError('请输入11位手机号');
      return;
    }

    setError('');

    // Demo 模式直接登录
    if (isDemoMode()) {
      onLogin(DEMO_USER as any);
      return;
    }

    // 开发环境直接跳到验证码输入（万能码 123456，无需网络请求）
    if (import.meta.env.DEV) {
      setStep('code');
      return;
    }

    setStep('sending');
    try {
      await authApi.sendCode(phone);
      setStep('code');
    } catch (err: any) {
      setError(err.message || '发送验证码失败');
      setStep('phone');
    }
  };

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      const result = await authApi.login(phone, code);
      onLogin(result.data.user);
    } catch (err: any) {
      setError(err.message || '登录失败');
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[100] bg-background-light overflow-hidden flex flex-col items-center justify-end animate-fade-in">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1200&fit=crop" 
          className="w-full h-full object-cover opacity-20"
          alt="Auth Background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white"></div>
      </div>

      {/* Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-12 right-6 w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center text-gray-500 hover:text-gray-800 active:scale-90 transition-all z-20 shadow-sm border border-white/50"
        >
          <X size={20} />
        </button>
      )}

      {/* Content Container */}
      <div className="relative z-10 w-full px-8 pb-12 animate-slide-up">
        
        {/* Branding & Logo */}
        <div className="mb-8 text-center transition-all duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-primary to-primary-deep rounded-3xl shadow-xl shadow-primary/20 mb-4 animate-pulse">
            <Sparkles className="text-white" size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">AI OOTD</h1>
          <p className="text-text-secondary text-[10px] mt-2 tracking-[0.2em] uppercase font-medium">开启您的数字衣橱</p>
        </div>

        {/* Dynamic Auth Card */}
        <div className="bg-white/80 backdrop-blur-3xl border border-white/50 rounded-[40px] p-6 shadow-2xl min-h-[300px] flex flex-col">
          
          {step === 'phone' && (
            <div className="animate-fade-in flex flex-col flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-2">欢迎登录</h2>
              <p className="text-gray-400 text-xs mb-6">输入手机号，开启智能穿搭之旅</p>
              
              <form onSubmit={handleSendCode} className="space-y-4 flex-1">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="tel" 
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-300"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="min-h-[2rem] flex items-center px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-red-600 text-sm leading-snug break-words">{error}</p>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/30 hover:bg-primary-deep"
                >
                  获取验证码
                  <ArrowRight size={18} />
                </button>
              </form>

              {/* 测试提示 */}
              <div className="mt-6 p-3 bg-blue-50 rounded-xl">
                <p className="text-blue-600 text-xs text-center">
                  💡 测试模式：任意手机号 + 验证码 <span className="font-bold">123456</span>
                </p>
              </div>
            </div>
          )}

          {step === 'sending' && (
            <div className="flex flex-col items-center justify-center flex-1 animate-fade-in">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
              <p className="text-gray-800 font-bold text-sm">正在发送验证码...</p>
              <p className="text-gray-400 text-[10px] mt-2">{phone}</p>
            </div>
          )}

          {step === 'code' && (
            <div className="animate-fade-in flex flex-col flex-1">
              <button onClick={() => { setStep('phone'); setCode(''); setError(''); }} className="flex items-center gap-1 text-gray-400 text-[10px] mb-4 hover:text-gray-600 transition-colors">
                <ChevronLeft size={12} /> 返回修改
              </button>
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 size={20} />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-gray-800 leading-tight">验证码已发送</h2>
                    <p className="text-gray-400 text-[10px]">{phone}</p>
                 </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 flex-1">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="请输入6位验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 text-gray-800 text-lg text-center tracking-[0.5em] outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-300 placeholder:tracking-normal placeholder:text-sm"
                    required
                    autoFocus
                    maxLength={6}
                  />
                </div>

                {error && (
                  <div className="min-h-[2.5rem] flex items-center justify-center px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-red-600 text-sm text-center leading-snug break-words">{error}</p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="w-full py-4 bg-gradient-to-r from-primary to-primary-deep text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '立即登录'}
                </button>
              </form>

              {/* 测试提示 */}
              <div className="mt-4 p-3 bg-green-50 rounded-xl">
                <p className="text-green-600 text-xs text-center">
                  ✅ 万能验证码: <span className="font-bold">123456</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-8">
          继续使用即代表同意 <span className="text-primary underline">服务协议</span> 与 <span className="text-primary underline">隐私政策</span>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
