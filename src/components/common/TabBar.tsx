
import React from 'react';
import { Home, User, Calendar as CalendarIcon } from 'lucide-react';
import { TabType } from '../../types';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAddClick: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, onAddClick }) => {
  const getTabClass = (tab: TabType) => {
    const isActive = activeTab === tab;
    return `flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative ${
      isActive 
        ? 'text-primary scale-105' 
        : 'text-text-secondary hover:text-text-primary'
    }`;
  };

  const getIconClass = (tab: TabType) => {
    const isActive = activeTab === tab;
    return `transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`;
  };

  return (
    <div className="absolute bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-primary/10 z-30 safe-area-inset-bottom">
      {/* 安全区域适配 */}
      <div className="h-20 pb-2 pt-2 flex items-center justify-center">
        
        {/* 四个导航项 - 使用 grid 布局确保均匀分布 */}
        <div className="w-full max-w-[375px] grid grid-cols-4 gap-0 items-center justify-items-center px-2">
          
          {/* 首页 */}
          <button 
            onClick={() => onTabChange('home')} 
            className={getTabClass('home')}
          >
            <div className={`relative ${getIconClass('home')}`}>
              <Home 
                size={22} 
                strokeWidth={activeTab === 'home' ? 2.5 : 2}
                className={activeTab === 'home' ? 'drop-shadow-sm' : ''}
              />
              {activeTab === 'home' && (
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
              )}
            </div>
            <span className={`text-[10px] font-semibold transition-all duration-300 ${
              activeTab === 'home' ? 'text-primary' : 'text-text-secondary'
            }`}>
              首页
            </span>
            {activeTab === 'home' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
            )}
          </button>

          {/* 衣橱（与小程序 Tab 一致的圆领短袖轮廓） */}
          <button 
            onClick={() => onTabChange('closet')} 
            className={getTabClass('closet')}
          >
            <div className={`relative ${getIconClass('closet')}`}>
              <svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill="none"
                className={activeTab === 'closet' ? 'drop-shadow-sm' : ''}
                aria-hidden
              >
                <path
                  d="M8 7.5Q12 3.5 16 7.5L19.5 11L19.5 22L4.5 22L4.5 11L8 7.5Z"
                  stroke="currentColor"
                  strokeWidth={activeTab === 'closet' ? 2.5 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 8Q12 5.5 14.5 8"
                  stroke="currentColor"
                  strokeWidth={activeTab === 'closet' ? 2.5 : 2}
                  strokeLinecap="round"
                />
                <path
                  d="M6 15.5h12"
                  stroke="currentColor"
                  strokeWidth={activeTab === 'closet' ? 2.35 : 1.85}
                  strokeLinecap="round"
                />
              </svg>
              {activeTab === 'closet' && (
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
              )}
            </div>
            <span className={`text-[10px] font-semibold transition-all duration-300 ${
              activeTab === 'closet' ? 'text-primary' : 'text-text-secondary'
            }`}>
              衣橱
            </span>
            {activeTab === 'closet' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
            )}
          </button>

          {/* 穿搭日历 - 第三个功能 */}
          <button 
            onClick={() => onTabChange('calendar')}
            className={getTabClass('calendar')}
          >
            <div className={`relative ${getIconClass('calendar')}`}>
              <CalendarIcon 
                size={22} 
                strokeWidth={activeTab === 'calendar' ? 2.5 : 2}
                className={activeTab === 'calendar' ? 'drop-shadow-sm' : ''}
              />
              {activeTab === 'calendar' && (
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
              )}
            </div>
            <span className={`text-[10px] font-semibold transition-all duration-300 ${
              activeTab === 'calendar' ? 'text-primary' : 'text-text-secondary'
            }`}>
              日历
            </span>
            {activeTab === 'calendar' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
            )}
          </button>

          {/* 我的 */}
          <button 
            onClick={() => onTabChange('user')} 
            className={getTabClass('user')}
          >
            <div className={`relative ${getIconClass('user')}`}>
              <User 
                size={22} 
                strokeWidth={activeTab === 'user' ? 2.5 : 2}
                className={activeTab === 'user' ? 'drop-shadow-sm' : ''}
              />
              {activeTab === 'user' && (
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
              )}
            </div>
            <span className={`text-[10px] font-semibold transition-all duration-300 ${
              activeTab === 'user' ? 'text-primary' : 'text-text-secondary'
            }`}>
              我的
            </span>
            {activeTab === 'user' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabBar;
