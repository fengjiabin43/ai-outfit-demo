import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { CalendarRange, CloudSun, CloudRain, Sun, Cloud, Snowflake, CloudDrizzle, CloudLightning, Wind, Palette, ChevronDown, Shirt, ChevronLeft, ChevronRight } from 'lucide-react';
import { OutfitRecord, ClothingItem, WeatherData, WeekWeatherDay, CityInfo } from '../../types';
import { aiApi, recordApi } from '../../api';
import { Lunar } from 'lunar-javascript';
import OutfitRecordDetail from './OutfitRecordDetail';

interface CalendarTabProps {
  outfitRecords?: OutfitRecord[];
  closetItems?: ClothingItem[];
  weather?: WeatherData;
  weekWeather?: WeekWeatherDay[];
  onDeleteRecord?: (id: string) => Promise<void>;
  onOpenDIY?: (date: string) => void;
  /** 从「我的」页点击某条记录跳转时传入，定位到该日期后由父组件清除 */
  initialDate?: string | null;
  onInitialDateConsumed?: () => void;
}

const WeatherIcon: React.FC<{ condition: string; size?: number; className?: string }> = ({ condition, size = 16, className = '' }) => {
  if (condition.includes('雷')) return <CloudLightning size={size} className={className || 'text-purple-500'} />;
  if (condition.includes('雪')) return <Snowflake size={size} className={className || 'text-blue-300'} />;
  if (condition.includes('大雨') || condition.includes('暴雨')) return <CloudRain size={size} className={className || 'text-blue-500'} />;
  if (condition.includes('雨')) return <CloudDrizzle size={size} className={className || 'text-blue-400'} />;
  if (condition.includes('阴')) return <Cloud size={size} className={className || 'text-gray-400'} />;
  if (condition.includes('云') || condition.includes('多云')) return <CloudSun size={size} className={className || 'text-gray-500'} />;
  if (condition.includes('风')) return <Wind size={size} className={className || 'text-teal-400'} />;
  return <Sun size={size} className={className || 'text-orange-400'} />;
};

const SOURCE_LABEL: Record<string, string> = {
  'ai-recommend': 'AI 推荐',
  'manual': 'DIY 搭配',
};

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (dateStr: string, n: number) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

const VISIBLE_DAYS = 7;
const PAST_LIMIT = 90;

const CalendarTab: React.FC<CalendarTabProps> = ({ outfitRecords = [], closetItems = [], weather, weekWeather = [], onDeleteRecord, onOpenDIY, initialDate, onInitialDateConsumed }) => {
  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<OutfitRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 当前日历条的起始偏移（相对于今天，负数 = 过去）
  // 默认 -3，让今天在中间
  const [startOffset, setStartOffset] = useState(-3);

  // 从「我的」页跳转过来时定位到指定日期
  useEffect(() => {
    if (!initialDate || !onInitialDateConsumed) return;
    setSelectedDate(initialDate);
    const d = new Date(initialDate + 'T00:00:00');
    const t = new Date(todayStr + 'T00:00:00');
    const diffDays = Math.round((d.getTime() - t.getTime()) / 86400000);
    const offset = Math.max(-PAST_LIMIT, Math.min(0, diffDays - 3));
    setStartOffset(offset);
    onInitialDateConsumed();
  }, [initialDate, todayStr, onInitialDateConsumed]);

  const [cityInfo, setCityInfo] = useState<CityInfo>({ name: '定位中...', id: '' });
  const [isLocating, setIsLocating] = useState(false);

  // 已加载的远程历史记录（合并到 outfitRecords 之外）
  const [extraRecords, setExtraRecords] = useState<OutfitRecord[]>([]);
  const loadedRangesRef = useRef<Set<string>>(new Set());

  const allRecords = useMemo(() => {
    const map = new Map<string, OutfitRecord>();
    [...outfitRecords, ...extraRecords].forEach(r => map.set(r.id, r));
    return Array.from(map.values());
  }, [outfitRecords, extraRecords]);

  const recordDatesSet = useMemo(() => {
    const s = new Set<string>();
    allRecords.forEach(r => s.add(r.date));
    return s;
  }, [allRecords]);

  // 生成当前可见的日期列表
  const visibleDays = useMemo(() => {
    return Array.from({ length: VISIBLE_DAYS }, (_, i) => {
      const offset = startOffset + i;
      const dateStr = addDays(todayStr, offset);
      const d = new Date(dateStr + 'T00:00:00');
      return {
        dateStr,
        dayNum: d.getDate(),
        weekday: dateStr === todayStr ? '今天' : WEEKDAY_NAMES[d.getDay()],
        isPast: dateStr < todayStr,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      };
    });
  }, [startOffset, todayStr]);

  // 月份标签
  const monthLabel = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }, [selectedDate]);

  // 向左滑（看过去）
  const canGoLeft = startOffset > -PAST_LIMIT;
  const canGoRight = startOffset < 0; // 最右到未来7天范围

  const goLeft = useCallback(() => {
    if (!canGoLeft) return;
    setStartOffset(prev => Math.max(prev - VISIBLE_DAYS, -PAST_LIMIT));
  }, [canGoLeft]);

  const goRight = useCallback(() => {
    if (!canGoRight) return;
    setStartOffset(prev => Math.min(prev + VISIBLE_DAYS, 0));
  }, [canGoRight]);

  // 回到今天
  const goToToday = useCallback(() => {
    setStartOffset(-3);
    setSelectedDate(todayStr);
  }, [todayStr]);

  // 懒加载：当日历滑到过去时，按需请求历史记录
  useEffect(() => {
    const firstDate = visibleDays[0]?.dateStr;
    const lastDate = visibleDays[visibleDays.length - 1]?.dateStr;
    if (!firstDate || !lastDate) return;

    const rangeKey = `${firstDate}_${lastDate}`;
    if (loadedRangesRef.current.has(rangeKey)) return;

    if (firstDate < todayStr) {
      loadedRangesRef.current.add(rangeKey);
      recordApi.getRecords({ startDate: firstDate, endDate: lastDate, pageSize: 50 })
        .then((res: any) => {
          if (res?.data && Array.isArray(res.data)) {
            const records: OutfitRecord[] = res.data.map((item: any) => ({
              id: item.id,
              date: item.date,
              outfit: {
                id: item.outfitData?.id || item.id,
                title: item.outfitData?.title || '穿搭记录',
                desc: item.outfitData?.desc || '',
                fittedImage: item.tryonImageUrl || item.outfitData?.fittedImage || '',
                items: item.outfitData?.items || [],
              },
              source: item.source || 'manual',
            }));
            if (records.length > 0) {
              setExtraRecords(prev => [...prev, ...records]);
            }
          }
        })
        .catch(() => {});
    }
  }, [visibleDays, todayStr]);

  // 天气数据
  const parsedRange = useMemo(() => {
    if (!weather?.range) return { min: weather?.temp || 16, max: (weather?.temp || 16) + 5 };
    const match = weather.range.match(/(-?\d+).*?(-?\d+)/);
    if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
    return { min: weather.temp || 16, max: (weather.temp || 16) + 5 };
  }, [weather]);

  const weatherMap = useMemo(() => {
    const map = new Map<string, WeekWeatherDay>();
    if (weekWeather.length > 0) {
      weekWeather.forEach((w, i) => {
        const entry = i === 0 && weather
          ? { ...w, condition: weather.condition || w.condition, tempMin: parsedRange.min, tempMax: parsedRange.max }
          : w;
        map.set(w.date, entry);
      });
    } else if (weather) {
      map.set(todayStr, {
        date: todayStr,
        weekday: '今天',
        condition: weather.condition || '晴',
        tempMin: parsedRange.min,
        tempMax: parsedRange.max,
      });
    }
    return map;
  }, [weekWeather, weather, parsedRange, todayStr]);

  const selectedDayWeather = weatherMap.get(selectedDate) || null;

  const lunarDateStr = useMemo(() => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      const lunar = Lunar.fromDate(d);
      return `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`;
    } catch { return ''; }
  }, [selectedDate]);

  const dayRecords = useMemo(() => {
    return allRecords.filter(r => r.date === selectedDate);
  }, [allRecords, selectedDate]);

  const isPastDate = selectedDate < todayStr;
  const isTodaySelected = selectedDate === todayStr;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // 城市定位
  useEffect(() => {
    const fetchCity = async () => {
      setIsLocating(true);
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const result = await aiApi.getCityByLocation(position.coords.latitude, position.coords.longitude);
                if (result.data) setCityInfo({ name: result.data.name, id: result.data.id });
              } catch { setCityInfo({ name: '北京', id: '101010100' }); }
              finally { setIsLocating(false); }
            },
            () => { setCityInfo({ name: '北京', id: '101010100' }); setIsLocating(false); },
            { timeout: 5000 }
          );
        } else { setCityInfo({ name: '北京', id: '101010100' }); setIsLocating(false); }
      } catch { setCityInfo({ name: '北京', id: '101010100' }); setIsLocating(false); }
    };
    fetchCity();
  }, []);

  const handleRelocate = () => {
    setIsLocating(true);
    setCityInfo({ name: '定位中...', id: '' });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const result = await aiApi.getCityByLocation(position.coords.latitude, position.coords.longitude);
            if (result.data) setCityInfo({ name: result.data.name, id: result.data.id });
          } catch { setCityInfo({ name: '北京', id: '101010100' }); }
          finally { setIsLocating(false); }
        },
        () => { setCityInfo({ name: '北京', id: '101010100' }); setIsLocating(false); },
        { timeout: 5000 }
      );
    } else { setCityInfo({ name: '北京', id: '101010100' }); setIsLocating(false); }
  };

  // 触摸滑动支持
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx > 0) goLeft();  // 右滑 → 看过去
      else goRight();        // 左滑 → 看未来
    }
  };

  return (
    <div className="h-full flex flex-col pb-20 animate-fade-in">
      <div className="px-4 pt-2 pb-2 flex-1 flex flex-col overflow-hidden">

        {/* 标题 + 月份 */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <h1 className="text-sm font-bold text-text-primary">每日穿搭</h1>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-medium">{monthLabel}</span>
            {!isTodaySelected && (
              <button onClick={goToToday} className="text-[10px] text-primary font-bold ml-2 px-2 py-0.5 bg-primary/10 rounded-full">
                回到今天
              </button>
            )}
          </div>
        </div>

        {/* 可滑动日历条 */}
        <div className="flex items-center gap-1 mb-3 flex-shrink-0">
          <button
            onClick={goLeft}
            disabled={!canGoLeft}
            className="p-1 text-gray-300 hover:text-primary disabled:opacity-20 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            className="flex-1 flex justify-between px-0.5"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {visibleDays.map(day => {
              const isSelected = day.dateStr === selectedDate;
              const hasRecord = recordDatesSet.has(day.dateStr);
              const hasWeather = weatherMap.has(day.dateStr);

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`flex flex-col items-center rounded-[18px] py-1.5 px-0.5 transition-all w-[40px] relative ${
                    isSelected
                      ? 'bg-primary shadow-lg shadow-primary/30'
                      : day.isPast
                      ? 'bg-gray-50'
                      : 'bg-white shadow-sm'
                  }`}
                >
                  <span className={`text-[9px] font-bold mb-0.5 ${
                    isSelected ? 'text-white/90'
                    : day.isPast ? 'text-gray-300'
                    : day.isToday ? 'text-primary'
                    : 'text-gray-400'
                  }`}>
                    {day.weekday}
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                    isSelected ? 'bg-white/20'
                    : day.isToday ? 'bg-primary/10'
                    : ''
                  }`}>
                    <span className={`text-xs font-bold ${
                      isSelected ? 'text-white'
                      : day.isPast ? 'text-gray-300'
                      : day.isToday ? 'text-primary'
                      : 'text-gray-800'
                    }`}>
                      {day.dayNum}
                    </span>
                  </div>
                  {hasWeather && !day.isPast ? (
                    <WeatherIcon
                      condition={weatherMap.get(day.dateStr)!.condition}
                      size={14}
                      className={isSelected ? 'text-white' : ''}
                    />
                  ) : (
                    <div className="h-[14px]" />
                  )}
                  {/* 有记录的小圆点标记 */}
                  {hasRecord && (
                    <div className={`absolute -bottom-0.5 w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-primary'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={goRight}
            disabled={!canGoRight}
            className="p-1 text-gray-300 hover:text-primary disabled:opacity-20 transition-colors flex-shrink-0"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 内容区（可滚动） */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">

          {/* 天气卡片：只在今天或有天气数据的未来日期显示 */}
          {selectedDayWeather && !isPastDate && (
            <div className="bg-white rounded-3xl shadow-sm p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-baseline">
                    <span className="text-[36px] font-extrabold text-gray-800 leading-none tracking-tight">
                      {selectedDayWeather.tempMin}
                    </span>
                    <span className="text-xl text-gray-300 font-bold mx-0.5">/</span>
                    <span className="text-[36px] font-extrabold text-gray-800 leading-none tracking-tight">
                      {selectedDayWeather.tempMax}
                    </span>
                    <span className="text-base text-gray-400 font-bold ml-0.5">°C</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-1.5">{selectedDayWeather.condition}</p>
                </div>
                <div className="w-16 h-16 flex items-center justify-center">
                  <WeatherIcon condition={selectedDayWeather.condition} size={48} />
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={handleRelocate}
                  disabled={isLocating}
                  className="flex items-center gap-1.5 text-xs text-gray-600 font-medium hover:text-primary transition-colors"
                >
                  <span className="text-primary text-sm">●</span>
                  <span>{cityInfo.name}</span>
                  <ChevronDown size={12} className="text-gray-400" />
                </button>
                {lunarDateStr && (
                  <span className="text-[10px] text-gray-400 font-medium">{lunarDateStr}</span>
                )}
              </div>

              <div className="mb-3" style={{ borderTop: '2px dashed #c4b5fd' }} />

              {weather?.tip && isTodaySelected && (
                <>
                  <h2 className="text-sm font-bold text-primary mb-1.5">今日穿搭建议</h2>
                  <p className="text-xs text-gray-500 leading-relaxed">{weather.tip}</p>
                </>
              )}
            </div>
          )}

          {/* 过去日期的日期头 */}
          {isPastDate && (
            <div className="bg-white rounded-3xl shadow-sm p-4 mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">{selectedDate}</p>
                {lunarDateStr && <p className="text-[10px] text-gray-400 mt-0.5">{lunarDateStr}</p>}
              </div>
              <span className="text-[10px] text-gray-300 font-medium">
                {dayRecords.length > 0 ? `${dayRecords.length} 套搭配` : '无记录'}
              </span>
            </div>
          )}

          {/* 穿搭记录 */}
          {dayRecords.length > 0 && (
            <div className="mb-3">
              <h2 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                <Shirt size={12} />
                {isTodaySelected ? '今日穿搭' : isPastDate ? '当日穿搭' : '已安排穿搭'}
                <span className="text-primary ml-1">{dayRecords.length}</span>
              </h2>
              <div className="space-y-2">
                {dayRecords.map(record => (
                  <button
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className="w-full bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-3 items-center text-left active:scale-[0.98] transition-all"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      {record.outfit.fittedImage ? (
                        <img src={record.outfit.fittedImage} alt="" className="w-full h-full object-cover" />
                      ) : record.outfit.items?.[0]?.img ? (
                        <img src={record.outfit.items[0].img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Shirt size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{record.outfit.title || 'DIY搭配'}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{record.outfit.desc || ''}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                          {SOURCE_LABEL[record.source] || record.source}
                        </span>
                        <span className="text-[9px] text-gray-300">{record.outfit.items?.length || 0} 件单品</span>
                      </div>
                    </div>
                    <div className="flex -space-x-2 flex-shrink-0">
                      {(record.outfit.items || []).slice(0, 3).map((item, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white bg-gray-50">
                          {item.img ? <img src={item.img} alt="" className="w-full h-full object-cover" /> : null}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {dayRecords.length === 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-center items-center min-h-[200px]">
              <CalendarRange className="text-gray-200 mb-3" size={40} />
              <p className="text-sm font-bold text-gray-500 mb-1">
                {isPastDate ? '当天没有穿搭记录' : '还没有穿搭记录'}
              </p>
              <p className="text-[10px] text-gray-300 mb-5">
                {isPastDate ? '过去的日子没有留下搭配' : '为这天搭配一套，记录你的穿搭日常'}
              </p>
              {!isPastDate && onOpenDIY && (
                <button
                  onClick={() => onOpenDIY(selectedDate)}
                  className="flex items-center justify-center gap-1.5 py-3 px-8 bg-primary text-white rounded-2xl text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  <Palette size={14} />
                  DIY 搭配
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-xs font-bold z-50 animate-slide-up">
          {toast}
        </div>
      )}

      {selectedRecord && (
        <OutfitRecordDetail
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onDelete={onDeleteRecord}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default CalendarTab;
