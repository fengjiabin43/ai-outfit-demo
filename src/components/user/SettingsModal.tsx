import React, { useState, useRef, useEffect } from 'react';
import { X, User, Bell, Shield, Trash2, LogOut, ChevronRight, ChevronLeft, Moon, Globe, Ruler, Smartphone, Lock, Mail, Tag, Camera, UserCircle, Upload, Loader2, Check, AlertTriangle, Image } from 'lucide-react';

const APP_VERSION = '1.0.0';

interface AvatarModelData {
  id: string;
  imageUrl: string;
  isActive: boolean;
  createdAt?: string;
}

interface UserProfile {
  nickname: string;
  gender: 'male' | 'female' | null;
  bio: string;
  avatar: string;
  height: number | null;
  weight: number | null;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  userStyles?: string[];
  onToggleStyle?: (style: string) => void;
  avatarModel?: AvatarModelData | null;
  onUploadAvatarModel?: (imageUrl: string) => Promise<void>;
  onDeleteAvatarModel?: (id: string) => Promise<void>;
  onSaveStyles?: () => Promise<void>;
  isSavingStyles?: boolean;
  onOpenModelManage?: () => void;
  userProfile?: UserProfile;
  onSaveProfile?: (data: Partial<UserProfile>) => Promise<void>;
  userPhone?: string;
  showToast?: (msg: string) => void;
}

type SettingsSection = 'main' | 'profile' | 'notifications' | 'security' | 'preferences' | 'stylePreferences' | 'avatarModel';

const STYLE_OPTIONS = ['简约', '法式', '日系工装', '美式复古', '辣妹', '运动休闲', '老钱风', '极简'];

const maskPhone = (phone?: string) => {
  if (!phone || phone.length < 7) return phone || '未绑定';
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, onLogout, userStyles = [], onToggleStyle,
  avatarModel, onUploadAvatarModel, onDeleteAvatarModel, onSaveStyles, isSavingStyles,
  onOpenModelManage, userProfile, onSaveProfile, userPhone, showToast
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editNickname, setEditNickname] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | null>(null);
  const [editBio, setEditBio] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('settings_notifications');
      return saved ? JSON.parse(saved) : { weather: true, social: true, priceAlert: false, weeklyReport: true };
    } catch { return { weather: true, social: true, priceAlert: false, weeklyReport: true }; }
  });

  const [prefUnit, setPrefUnit] = useState<'metric' | 'imperial'>(() => {
    try { return (localStorage.getItem('settings_unit') as 'metric' | 'imperial') || 'metric'; } catch { return 'metric'; }
  });

  useEffect(() => {
    if (userProfile && activeSection === 'profile') {
      setEditNickname(userProfile.nickname || '');
      setEditGender(userProfile.gender ?? null);
      setEditBio(userProfile.bio || '');
      setEditHeight(userProfile.height != null ? String(userProfile.height) : '');
      setEditWeight(userProfile.weight != null ? String(userProfile.weight) : '');
      setProfileSaved(false);
    }
  }, [userProfile, activeSection]);

  const handleSaveProfile = async () => {
    if (!onSaveProfile || isSavingProfile) return;
    setIsSavingProfile(true);
    try {
      await onSaveProfile({
        nickname: editNickname.trim() || undefined,
        gender: editGender,
        bio: editBio.trim(),
        height: editHeight ? Number(editHeight) : null,
        weight: editWeight ? Number(editWeight) : null,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (e) {
      console.error('保存个人资料失败:', e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onSaveProfile) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          try {
            await onSaveProfile({ avatar: reader.result });
          } catch {
            showToast?.('头像上传失败');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      showToast?.('缓存已清除');
    } catch {
      showToast?.('清除缓存失败');
    }
  };

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string' && onUploadAvatarModel) {
          setIsUploading(true);
          try {
            await onUploadAvatarModel(reader.result);
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteModel = async () => {
    if (avatarModel && onDeleteAvatarModel) {
      setIsDeleting(true);
      try {
        await onDeleteAvatarModel(avatarModel.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getCacheSize = () => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) total += (localStorage.getItem(key)?.length || 0) * 2;
      }
      if (total < 1024) return `${total} B`;
      if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
      return `${(total / 1024 / 1024).toFixed(1)} MB`;
    } catch {
      return '未知';
    }
  };

  const renderMain = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-2 animate-fade-in">
      {[
        { id: 'profile', icon: <User size={18} />, label: '个人信息设置', detail: '头像、昵称、身材数据' },
        { id: 'avatarModel', icon: <UserCircle size={18} />, label: '专属模特', detail: '选择内置模特或上传全身照', badge: avatarModel ? '已设置' : null },
        { id: 'stylePreferences', icon: <Tag size={18} />, label: '风格偏好', detail: '简约、法式、日系等，AI 将据此推荐' },
        { id: 'notifications', icon: <Bell size={18} />, label: '通知提醒', detail: '天气提醒、广场动态' },
        { id: 'security', icon: <Shield size={18} />, label: '账号与安全', detail: '密码、手机绑定' },
        { id: 'preferences', icon: <Ruler size={18} />, label: '通用偏好', detail: '单位、深色模式' },
      ].map((item) => (
        <button 
          key={item.id} 
          onClick={() => {
            if (item.id === 'avatarModel' && onOpenModelManage) {
              onClose();
              onOpenModelManage();
            } else {
              setActiveSection(item.id as SettingsSection);
            }
          }}
          className="w-full flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors shadow-sm">
              {item.icon}
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-gray-800 block">{item.label}</span>
              <span className="text-[10px] text-gray-400">{item.detail}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {'badge' in item && item.badge && (
              <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{item.badge}</span>
            )}
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </button>
      ))}

      <div className="pt-4 space-y-2">
        <button 
          onClick={handleClearCache}
          className="w-full flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-400">
                <Trash2 size={18} />
             </div>
             <div className="text-left">
              <span className="text-sm font-bold text-gray-800 block">清除缓存</span>
              <span className="text-[10px] text-gray-400">当前占用 {getCacheSize()}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-200/50 px-2 py-1 rounded-lg group-active:scale-90 transition-transform">立即清理</span>
        </button>
      </div>

      <button 
        onClick={onLogout}
        className="w-full mt-8 p-4 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-transform"
      >
        <LogOut size={18} />
        退出当前账号
      </button>
    </div>
  );

  const renderProfile = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <div className="flex flex-col items-center gap-2 mb-4">
        <div className="relative cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
          <img src={userProfile?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"} className="w-20 h-20 rounded-full object-cover border-4 border-gray-50" />
          <button className="absolute bottom-0 right-0 bg-white shadow-md p-1.5 rounded-full text-orange-500 border border-gray-100">
             <Image size={12} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">点击更换头像</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">昵称</label>
          <input type="text" value={editNickname} onChange={e => setEditNickname(e.target.value)} placeholder="请输入昵称" className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-100 transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">性别 <span className="text-orange-400 normal-case">（影响穿搭推荐与试穿效果）</span></label>
          <div className="flex gap-3">
            {([['female', '女'] as const, ['male', '男'] as const]).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setEditGender(val)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  editGender === val
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {val === 'female' ? '♀ ' : '♂ '}{label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">个性签名</label>
          <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="写点什么介绍自己吧" className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-100 transition-all h-20 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">身高 (cm)</label>
            <input type="number" value={editHeight} onChange={e => setEditHeight(e.target.value)} placeholder="如 168" className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-100" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">体重 (kg)</label>
            <input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} placeholder="如 52" className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-100" />
          </div>
        </div>
      </div>
      
      <button
        onClick={handleSaveProfile}
        disabled={isSavingProfile || !editNickname.trim()}
        className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 ${
          profileSaved
            ? 'bg-green-500 text-white shadow-green-200'
            : 'bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {isSavingProfile ? (
          <><Loader2 size={16} className="animate-spin" /> 保存中...</>
        ) : profileSaved ? (
          <><Check size={16} /> 已保存</>
        ) : '保存个人资料'}
      </button>
    </div>
  );

  const notificationItems: { key: keyof typeof notifications; label: string; desc: string }[] = [
    { key: 'weather', label: '每日天气提醒', desc: '早晨 8:00 为您推送今日穿搭建议' },
    { key: 'social', label: '广场点赞评论', desc: '即时获取您的动态互动消息' },
    { key: 'priceAlert', label: '单品降价通知', desc: '收藏的单品有价格变动时通知我' },
    { key: 'weeklyReport', label: '衣橱分析周报', desc: '每周日为您总结衣橱使用情况' },
  ];

  const renderNotifications = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-2 animate-fade-in">
      {notificationItems.map((item) => {
        const active = notifications[item.key];
        return (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-gray-800">{item.label}</p>
              <p className="text-[10px] text-gray-400">{item.desc}</p>
            </div>
            <div 
              onClick={() => {
                const next = { ...notifications, [item.key]: !notifications[item.key] };
                setNotifications(next);
                try { localStorage.setItem('settings_notifications', JSON.stringify(next)); } catch {}
                showToast?.(`${item.label}已${active ? '关闭' : '开启'}`);
              }}
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${active ? 'bg-orange-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'right-1' : 'left-1'}`}></div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSecurity = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-3 animate-fade-in">
      {[
        { icon: <Smartphone size={16} />, label: '绑定手机', value: maskPhone(userPhone), verified: !!userPhone, action: userPhone ? '更换' : '绑定' },
        { icon: <Mail size={16} />, label: '绑定邮箱', value: '未绑定', verified: false, action: '绑定' },
        { icon: <Lock size={16} />, label: '登录密码', value: '定期更换更安全', verified: false, action: '设置' },
      ].map((item, idx) => (
        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="text-gray-400">{item.icon}</div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs font-bold text-gray-800">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.value}</p>
              </div>
              {item.verified && (
                <span className="text-[8px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">已验证</span>
              )}
            </div>
          </div>
          <button 
            onClick={() => showToast?.('该功能即将推出，敬请期待')}
            className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg active:scale-95"
          >
            {item.action}
          </button>
        </div>
      ))}
      <div className="mt-8 p-4 bg-red-50/50 rounded-2xl border border-red-100">
         <p className="text-[10px] font-bold text-red-500 mb-1 uppercase tracking-widest">危险区域</p>
         {!showDeleteConfirm ? (
           <button 
             onClick={() => setShowDeleteConfirm(true)}
             className="text-xs font-bold text-red-500 underline"
           >
             永久注销账号
           </button>
         ) : (
           <div className="space-y-2 animate-fade-in">
             <div className="flex items-center gap-2 text-red-500">
               <AlertTriangle size={14} />
               <p className="text-[10px] font-bold">注销后所有数据将被清除且不可恢复，确定继续？</p>
             </div>
             <div className="flex gap-2">
               <button 
                 onClick={() => setShowDeleteConfirm(false)}
                 className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-100 rounded-lg active:scale-95"
               >
                 取消
               </button>
               <button 
                 onClick={() => { showToast?.('该功能将在后续版本中开放'); setShowDeleteConfirm(false); }}
                 className="flex-1 py-2 text-xs font-bold text-white bg-red-500 rounded-lg active:scale-95"
               >
                 确认注销
               </button>
             </div>
           </div>
         )}
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-2 animate-fade-in">
      <div 
        onClick={() => showToast?.('深色模式即将推出')}
        className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
           <div className="text-gray-400 group-hover:text-orange-500"><Moon size={16} /></div>
           <div>
             <p className="text-xs font-bold text-gray-800">深色模式</p>
             <p className="text-[10px] text-gray-400">跟随系统</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-bold">系统默认</span>
          <span className="text-[8px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">即将推出</span>
        </div>
      </div>

      <div 
        onClick={() => showToast?.('当前仅支持简体中文')}
        className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
           <div className="text-gray-400 group-hover:text-orange-500"><Globe size={16} /></div>
           <div>
             <p className="text-xs font-bold text-gray-800">语言设置</p>
             <p className="text-[10px] text-gray-400">应用显示语言</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-bold">简体中文</span>
          <span className="text-[8px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">即将推出</span>
        </div>
      </div>

      <div 
        onClick={() => {
          const next = prefUnit === 'metric' ? 'imperial' : 'metric';
          setPrefUnit(next);
          try { localStorage.setItem('settings_unit', next); } catch {}
          showToast?.(prefUnit === 'metric' ? '已切换为英制' : '已切换为公制');
        }}
        className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
           <div className="text-gray-400 group-hover:text-orange-500"><Ruler size={16} /></div>
           <div>
             <p className="text-xs font-bold text-gray-800">度量单位</p>
             <p className="text-[10px] text-gray-400">身高、体重显示</p>
           </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 font-bold">{prefUnit === 'metric' ? '公制 (cm/kg)' : '英制 (ft/lb)'}</span>
          <ChevronRight size={14} className="text-gray-300" />
        </div>
      </div>
    </div>
  );

  const renderStylePreferences = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 animate-fade-in">
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">选择您喜欢的风格，AI 推荐时会优先考虑</p>
      <div className="flex flex-wrap gap-2">
        {STYLE_OPTIONS.map(style => {
          const isActive = userStyles.includes(style);
          return (
            <button
              key={style}
              onClick={() => onToggleStyle?.(style)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                isActive ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-orange-200'
              }`}
            >
              {style}
            </button>
          );
        })}
      </div>
      {onSaveStyles && (
        <button 
          onClick={onSaveStyles}
          disabled={isSavingStyles}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-transform mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSavingStyles ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              保存中...
            </>
          ) : '保存风格偏好'}
        </button>
      )}
    </div>
  );

  const renderAvatarModel = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">上传一张全身照，AI 将用它进行虚拟试衣</p>
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 当前专属模特展示 */}
      <div className="flex flex-col items-center gap-4">
        {avatarModel ? (
          <div className="relative">
            <div className="w-48 h-64 rounded-2xl overflow-hidden border-4 border-orange-100 shadow-lg">
              <img 
                src={avatarModel.imageUrl} 
                alt="专属模特" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
              已激活
            </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-48 h-64 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Camera size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-600">上传全身照</p>
              <p className="text-[10px] text-gray-400 mt-1">建议正面站立、光线充足</p>
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="space-y-3">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              上传中...
            </>
          ) : (
            <>
              <Upload size={16} />
              {avatarModel ? '更换专属模特' : '上传专属模特'}
            </>
          )}
        </button>

        {avatarModel && (
          <button 
            onClick={handleDeleteModel}
            disabled={isDeleting}
            className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                删除中...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                删除当前模特
              </>
            )}
          </button>
        )}
      </div>

      {/* 提示信息 */}
      <div className="bg-orange-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-orange-600">拍摄建议</p>
        <ul className="text-[10px] text-orange-500 space-y-1">
          <li>• 选择光线充足的环境</li>
          <li>• 穿着贴身的衣物，方便 AI 识别身形</li>
          <li>• 正面站立，双手自然下垂</li>
          <li>• 避免复杂背景，纯色背景更佳</li>
        </ul>
      </div>
    </div>
  );

  const getTitle = () => {
    switch(activeSection) {
      case 'profile': return '个人信息';
      case 'avatarModel': return '专属模特';
      case 'stylePreferences': return '风格偏好';
      case 'notifications': return '通知管理';
      case 'security': return '账号安全';
      case 'preferences': return '偏好设置';
      default: return '设置';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[375px] h-[85vh] bg-white rounded-t-[40px] flex flex-col animate-slide-up shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-6 flex justify-between items-center border-b border-gray-50 bg-white">
          <div className="flex items-center gap-3">
            {activeSection !== 'main' && (
              <button 
                onClick={() => setActiveSection('main')}
                className="p-1.5 bg-gray-50 rounded-lg text-gray-400 active:scale-90 transition-transform"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">{getTitle()}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 active:rotate-90 transition-transform">
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Section Content */}
        {activeSection === 'main' && renderMain()}
        {activeSection === 'profile' && renderProfile()}
        {activeSection === 'avatarModel' && renderAvatarModel()}
        {activeSection === 'stylePreferences' && renderStylePreferences()}
        {activeSection === 'notifications' && renderNotifications()}
        {activeSection === 'security' && renderSecurity()}
        {activeSection === 'preferences' && renderPreferences()}
        
        {/* Fixed Version Info */}
        {activeSection === 'main' && (
          <div className="p-6 text-center">
            <p className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.2em]">AI 穿搭助手 v{APP_VERSION}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;