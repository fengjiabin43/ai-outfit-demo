
import React, { useState, useEffect, useRef } from 'react';
import TabBar from './components/common/TabBar';
import HomeTab from './components/home/HomeTab';
import ClosetTab from './components/closet/ClosetTab';
import UserTab from './components/user/UserTab';
import ModelManagePage from './components/user/ModelManagePage';
import GenderGuideModal from './components/user/GenderGuideModal';
import ScanModal from './components/closet/ScanModal';
import DIYOutfitPage from './components/closet/DIYOutfitPage';
import AIOutfitModal from './components/ai/AIOutfitModal';
import WeeklyPlanModal from './components/ai/WeeklyPlanModal';
import CalendarTab from './components/calendar/CalendarTab';
import AuthScreen from './components/auth/AuthScreen';
import { TabType, ClothingItem, Outfit, WeatherData, WeekWeatherDay, AvatarModel, OutfitRecord, BuiltinModel } from './types';
import { Signal, Wifi, BatteryFull, CheckCircle2, Sparkles, User, LogIn } from 'lucide-react';
import { isLoggedIn as checkLoggedIn, authApi, userApi, wardrobeApi, aiApi, settingsApi, uploadApi, recordApi, setToken } from './api';
import { isDemoMode } from './mock/demoApi';
import { DEMO_USER, DEMO_TOKEN } from './mock/demoData';

// 默认天气数据（API 获取失败时使用）
const DEFAULT_WEATHER: WeatherData = {
  temp: 16,
  condition: "晴",
  range: "12°~18°",
  date: new Date().toISOString().split('T')[0],
  wind: "微风",
  humidity: "50%",
  uv: "3",
  tip: "舒适温暖，长袖T恤或薄衬衫搭配休闲裤/半裙，轻松出门"
};

// 默认模特图片（男模特全身照 - 白色背景站立）
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=600&h=900&fit=crop";

const resolveRelativeDate = (label: string): string => {
  const today = new Date();
  if (label.includes('明天')) {
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  }
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const nextWeek = label.includes('下周');
  const cleanLabel = label.replace('下周', '').trim();
  const targetDay = weekdays.indexOf(cleanLabel);
  if (targetDay >= 0) {
    const currentDay = today.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    if (nextWeek) diff += 7;
    today.setDate(today.getDate() + diff);
    return today.toISOString().split('T')[0];
  }
  return today.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(checkLoggedIn());
  const [currentUser, setCurrentUser] = useState<{ id: string; phone: string; nickname: string; avatar: string | null; gender?: 'male' | 'female' | null; bio?: string | null; height?: number | null; weight?: number | null } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER);
  const [userAvatar, setUserAvatar] = useState<string>(DEFAULT_AVATAR);
  const [avatarModel, setAvatarModel] = useState<AvatarModel | null>(null);
  const [lastOutfitResult, setLastOutfitResult] = useState<Outfit | null>(null);
  const [showGenderGuide, setShowGenderGuide] = useState(false);
  
  const [userStyles, setUserStyles] = useState<string[]>(['简约', '法式', '舒适']);
  const [favoriteItemIds, setFavoriteItemIds] = useState<string[]>([]);
  const [weekWeather, setWeekWeather] = useState<WeekWeatherDay[]>([]);
  const [outfitRecords, setOutfitRecords] = useState<OutfitRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isDIYModalOpen, setIsDIYModalOpen] = useState(false);
  const [diyTargetDate, setDiyTargetDate] = useState<string | undefined>(undefined);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isWeeklyPlanOpen, setIsWeeklyPlanOpen] = useState(false);
  const [isModelManageOpen, setIsModelManageOpen] = useState(false);
  const [userModels, setUserModels] = useState<Array<{ id: string; imageUrl: string; isActive: boolean; createdAt?: string }>>([]);
  const [isSavingStyles, setIsSavingStyles] = useState(false);
  /** 从「我的」页点击穿搭记录跳转日历时要定位的日期，消费后清空 */
  const [calendarInitialDate, setCalendarInitialDate] = useState<string | null>(null);

  // Demo 模式：自动登录
  useEffect(() => {
    if (isDemoMode() && !isLoggedIn) {
      setToken(DEMO_TOKEN);
      setCurrentUser(DEMO_USER as any);
      setIsLoggedIn(true);
    }
  }, []);

  // 初始化：获取天气数据 + 一周天气
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const [currentResult, weekResult] = await Promise.all([
          aiApi.getWeather(),
          aiApi.getWeekWeather(),
        ]);
        if (currentResult.data) {
          setWeather(currentResult.data);
        }
        if (weekResult.data && Array.isArray(weekResult.data)) {
          setWeekWeather(weekResult.data);
        }
      } catch (error) {
        console.log('获取天气失败，使用默认数据');
      }
    };
    fetchWeather();
  }, []);

  // 登录后加载用户数据
  useEffect(() => {
    if (isLoggedIn) {
      loadUserData();
    }
  }, [isLoggedIn]);

  // 加载用户衣柜数据
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // 并行加载衣柜、风格偏好、专属模特、穿搭记录
      const [clothesResult, styleResult, modelResult, recordsResult] = await Promise.all([
        wardrobeApi.getClothes({ pageSize: 100 }),
        settingsApi.getStylePreference().catch(() => null),
        settingsApi.getAvatarModel().catch(() => null),
        recordApi.getRecords({ pageSize: 50 }).catch(() => null),
      ]);

      // 处理衣柜数据
      if (clothesResult.data) {
        const safeParse = (val: any): string[] => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
          return [];
        };
        const clothingItems: ClothingItem[] = clothesResult.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          image: item.imageUrl,
          category: item.category,
          subCategory: item.subCategory,
          tags: safeParse(item.tags),
          marks: safeParse(item.marks),
          wearCount: item.wearCount || 0,
          isFavorite: item.isFavorite || false,
          addedDate: item.addedDate || item.createdAt,
        }));
        setItems(clothingItems);
        setFavoriteItemIds(clothingItems.filter(i => i.isFavorite).map(i => i.id));
      }

      // 处理风格偏好
      if (styleResult?.data?.styles) {
        setUserStyles(styleResult.data.styles);
      }

      // 处理专属模特
      if (modelResult?.data) {
        const model: AvatarModel = {
          id: modelResult.data.id,
          image: modelResult.data.imageUrl,
          name: modelResult.data.name,
          gender: modelResult.data.gender,
          isBuiltin: modelResult.data.isBuiltin,
          createdAt: modelResult.data.createdAt,
          isActive: modelResult.data.isActive,
        };
        setAvatarModel(model);
        if (model.image) {
          setUserAvatar(model.image);
        }
      }

      // 加载所有用户模特列表
      try {
        const allModelsResult = await settingsApi.getAllModels();
        if (allModelsResult?.data && Array.isArray(allModelsResult.data)) {
          setUserModels(allModelsResult.data.map((m: any) => ({
            id: m.id,
            imageUrl: m.imageUrl,
            isActive: m.isActive,
            createdAt: m.createdAt,
          })));
        }
      } catch {
        // 可能后端尚未支持 getAllModels，静默失败
      }

      // 处理穿搭记录
      if (recordsResult?.data) {
        const records: OutfitRecord[] = recordsResult.data.map((item: any) => ({
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
        setOutfitRecords(records);
      }
    } catch (error) {
      console.error('加载衣柜数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  const ensureLogin = (callback: () => void) => {
    if (isLoggedIn) {
      callback();
    } else {
      pendingActionRef.current = callback;
      setIsAuthModalOpen(true);
    }
  };

  // 登录成功处理
  const handleAuthSuccess = (user: { id: string; phone: string; nickname: string; avatar: string | null }) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setIsAuthModalOpen(false);
    if (user.avatar) {
      setUserAvatar(user.avatar);
    }
    showToast(`欢迎回来，${user.nickname}！`);
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  };

  // 登录后拉取完整用户信息（含 bio/height/weight）
  useEffect(() => {
    if (isLoggedIn) {
      userApi.getInfo().then((res: any) => {
        if (res?.data) {
          setCurrentUser(prev => prev ? { ...prev, ...res.data } : res.data);
          if (!res.data.gender) {
            setShowGenderGuide(true);
          }
        }
      }).catch(() => {});
    }
  }, [isLoggedIn]);

  // 保存个人资料
  const handleSaveProfile = async (data: { nickname?: string; gender?: 'male' | 'female' | null; bio?: string; height?: number | null; weight?: number | null }) => {
    const res = await userApi.updateInfo(data as any);
    if (res?.data) {
      setCurrentUser(prev => prev ? { ...prev, ...res.data } : prev);
      showToast('个人资料已保存');
    }
  };

  const handleGenderConfirm = async (gender: 'male' | 'female') => {
    setShowGenderGuide(false);
    try {
      const res = await userApi.updateInfo({ gender });
      if (res?.data) {
        setCurrentUser(prev => prev ? { ...prev, gender } : prev);
        showToast(gender === 'female' ? '已设置为女生，推荐将更精准' : '已设置为男生，推荐将更精准');
      }
    } catch {}
  };

  const handleLogout = () => {
    authApi.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setItems([]);
    setFavoriteItemIds([]);
    setAvatarModel(null);
    setUserAvatar(DEFAULT_AVATAR);
    setUserModels([]);
    setLastOutfitResult(null);
    setOutfitRecords([]);
    setUserStyles(['简约', '法式', '舒适']);
    setActiveTab('home');
    showToast('已安全退出');
  };

  const handleImportItem = (newItem: ClothingItem) => {
    setItems(prev => [newItem, ...prev]);
    setActiveTab('closet'); 
    showToast('导入成功！已加入衣橱');
  };

  // 批量导入处理
  const handleBatchImportItems = (newItems: ClothingItem[]) => {
    setItems(prev => [...newItems, ...prev]);
    setActiveTab('closet');
    showToast(`批量导入成功！已加入 ${newItems.length} 件单品`);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await wardrobeApi.deleteClothes(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setFavoriteItemIds(prev => prev.filter(x => x !== id));
      showToast('已删除该单品');
    } catch (e) {
      console.error(e);
      showToast('删除失败，请重试');
    }
  };

  const handleUpdateItem = (updatedItem: ClothingItem) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    showToast('单品信息已更新');
  };

  const handleAddToCalendar = async (outfit: Outfit, date: string) => {
    const resolvedDate = resolveRelativeDate(date);
    const tempId = Date.now().toString();
    const record: OutfitRecord = {
      id: tempId,
      date: resolvedDate,
      outfit,
      source: 'ai-recommend',
    };
    setOutfitRecords(prev => [record, ...prev]);
    showToast(`已安排！"${outfit.title}" 添加到${date}`);

    if (isLoggedIn) {
      try {
        const result = await recordApi.create({
          date: resolvedDate,
          outfitData: {
            id: outfit.id,
            title: outfit.title,
            desc: outfit.desc,
            fittedImage: outfit.fittedImage,
            items: outfit.items.map(item => ({
              name: item.name,
              img: item.img,
              clothesId: (item as any).clothesId,
            })),
          },
          tryonImageUrl: outfit.fittedImage,
          source: 'ai-recommend',
        });
        if (result.data?.id) {
          setOutfitRecords(prev =>
            prev.map(r => r.id === tempId ? { ...r, id: result.data.id } : r)
          );
        }
      } catch (e) {
        console.error('保存穿搭记录失败:', e);
      }
    }
  };


  const handleDeleteRecord = async (id: string) => {
    await recordApi.delete(id);
    setOutfitRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateAvatar = (img: string) => {
    setUserAvatar(img);
    showToast('OOTD 已更新至首页！');
  };

  // 处理专属模特上传（首次上传全身照，自动处理成白底图）
  const handleAvatarModelUpload = (img: string) => {
    // 模拟白底图处理（实际应该调用API进行背景移除）
    const model: AvatarModel = {
      id: Date.now().toString(),
      image: img, // 实际应该是处理后的白底图
      createdAt: new Date().toISOString(),
      isActive: true
    };
    setAvatarModel(model);
    setUserAvatar(img); // 暂时使用原图，实际应该使用处理后的白底图
    showToast('专属模特已保存！');
  };

  // 处理AI推荐完成后的试衣效果
  const handleOutfitResult = async (outfit: Outfit) => {
    setLastOutfitResult(outfit);
    setUserAvatar(outfit.fittedImage); // 更新首页显示
    
    const today = new Date().toISOString().split('T')[0];
    
    // 先添加到本地状态
    const record: OutfitRecord = {
      id: Date.now().toString(),
      date: today,
      outfit: outfit,
      source: 'ai-recommend'
    };
    setOutfitRecords(prev => [record, ...prev]);
    
    // 同步保存到后端
    if (isLoggedIn) {
      try {
        const result = await recordApi.create({
          date: today,
          outfitData: {
            id: outfit.id,
            title: outfit.title,
            desc: outfit.desc,
            fittedImage: outfit.fittedImage,
            items: outfit.items.map(item => ({
              name: item.name,
              img: item.img,
              clothesId: (item as any).clothesId,
            })),
          },
          tryonImageUrl: outfit.fittedImage,
          source: 'ai-recommend',
        });
        
        // 更新本地记录的 ID
        if (result.data?.id) {
          setOutfitRecords(prev => 
            prev.map(r => r.id === record.id ? { ...r, id: result.data.id } : r)
          );
        }
      } catch (error) {
        console.error('保存穿搭记录失败:', error);
        // 不阻断用户体验，只打印错误
      }
    }
  };

  const toggleUserStyle = (style: string) => {
    setUserStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  // 保存风格偏好到后端
  const saveUserStyles = async () => {
    setIsSavingStyles(true);
    try {
      await settingsApi.updateStylePreference(userStyles);
      showToast('风格偏好已保存');
    } catch (error) {
      console.error('保存风格偏好失败:', error);
      showToast('保存失败，请重试');
    } finally {
      setIsSavingStyles(false);
    }
  };

  // 上传专属模特（持久化到后端）
  const uploadAvatarModelToServer = async (imageData: string) => {
    try {
      let imageUrl = imageData;
      
      // 如果是 base64，先上传到 OSS
      if (imageData.startsWith('data:')) {
        showToast('正在上传图片...');
        const uploadResult = await uploadApi.uploadImage(imageData, 'model');
        imageUrl = uploadResult.url;
      }
      
      // 调用后端保存接口（后端会尝试进行背景移除）
      showToast('正在处理专属模特...');
      const result = await settingsApi.uploadAvatarModel(imageUrl);
      
      if (result.data) {
        const model: AvatarModel = {
          id: result.data.id,
          image: result.data.imageUrl,
          createdAt: result.data.createdAt,
          isActive: result.data.isActive,
        };
        setAvatarModel(model);
        setUserAvatar(result.data.imageUrl); // 使用后端返回的 URL（可能是处理后的白底图）
        
        if (result.data.backgroundProcessed) {
          showToast('专属模特已保存（已自动移除背景）');
        } else {
          showToast('专属模特已保存');
        }
      }
    } catch (error) {
      console.error('上传专属模特失败:', error);
      showToast('上传失败，请重试');
      throw error;
    }
  };

  // 删除专属模特
  const deleteAvatarModelFromServer = async (id: string) => {
    try {
      await settingsApi.deleteAvatarModel(id);
      setAvatarModel(null);
      setUserAvatar(DEFAULT_AVATAR);
      showToast('专属模特已删除');
    } catch (error) {
      console.error('删除专属模特失败:', error);
      showToast('删除失败，请重试');
      throw error;
    }
  };

  // 选择内置模特
  const selectBuiltinModel = async (builtinModel: BuiltinModel) => {
    try {
      showToast('正在切换模特...');
      // 通过后端保存内置模特为当前激活模特
      const result = await settingsApi.uploadAvatarModel(builtinModel.image, {
        processBackground: false,
        name: builtinModel.name,
        gender: builtinModel.gender,
        isBuiltin: true,
      });
      
      if (result.data) {
        const model: AvatarModel = {
          id: result.data.id,
          image: result.data.imageUrl,
          name: builtinModel.name,
          gender: builtinModel.gender,
          isBuiltin: true,
          createdAt: result.data.createdAt,
          isActive: true,
        };
        setAvatarModel(model);
        setUserAvatar(result.data.imageUrl);
        
        // 更新用户模特列表
        setUserModels(prev => prev.map(m => ({ ...m, isActive: false })));
        setUserModels(prev => [{ id: model.id, imageUrl: model.image, isActive: true, createdAt: model.createdAt }, ...prev.filter(m => m.id !== model.id)]);
        
        showToast(`已切换为 ${builtinModel.name}`);
      }
    } catch (error) {
      console.error('选择内置模特失败:', error);
      showToast('切换失败，请重试');
      throw error;
    }
  };

  // 激活指定模特
  const activateModel = async (modelId: string) => {
    try {
      showToast('正在切换模特...');
      await settingsApi.activateModel(modelId);
      
      // 更新本地状态
      const targetModel = userModels.find(m => m.id === modelId);
      if (targetModel) {
        const model: AvatarModel = {
          id: targetModel.id,
          image: targetModel.imageUrl,
          createdAt: targetModel.createdAt || new Date().toISOString(),
          isActive: true,
        };
        setAvatarModel(model);
        setUserAvatar(targetModel.imageUrl);
        setUserModels(prev => prev.map(m => ({ ...m, isActive: m.id === modelId })));
        showToast('模特切换成功');
      }
    } catch (error) {
      console.error('激活模特失败:', error);
      showToast('切换失败，请重试');
      throw error;
    }
  };

  // 上传新模特（从模特管理页面）
  const uploadNewModel = async (fileOrData: File | string) => {
    try {
      let imageUrl: string;
      
      if (fileOrData instanceof File) {
        // 直接上传 File 对象（推荐，避免 base64 内存问题）
        showToast('正在上传图片...');
        const uploadResult = await uploadApi.uploadFile(fileOrData, 'model');
        imageUrl = uploadResult.url;
      } else if (fileOrData.startsWith('data:')) {
        // 兼容旧的 base64 调用
        showToast('正在上传图片...');
        const uploadResult = await uploadApi.uploadImage(fileOrData, 'model');
        imageUrl = uploadResult.url;
      } else {
        imageUrl = fileOrData;
      }
      
      showToast('正在处理模特...');
      const result = await settingsApi.uploadAvatarModel(imageUrl);
      
      if (result.data) {
        const model: AvatarModel = {
          id: result.data.id,
          image: result.data.imageUrl,
          createdAt: result.data.createdAt,
          isActive: true,
        };
        setAvatarModel(model);
        setUserAvatar(result.data.imageUrl);
        
        // 更新模特列表
        setUserModels(prev => {
          const updated = prev.map(m => ({ ...m, isActive: false }));
          return [{ id: model.id, imageUrl: model.image, isActive: true, createdAt: model.createdAt }, ...updated];
        });
      }
    } catch (error) {
      console.error('上传模特失败:', error);
      showToast('上传失败，请重试');
      throw error;
    }
  };

  // 删除模特（从管理页面）
  const deleteModelFromManage = async (id: string) => {
    try {
      await settingsApi.deleteAvatarModel(id);
      setUserModels(prev => prev.filter(m => m.id !== id));
      
      // 如果删除的是当前激活的模特，清空状态
      if (avatarModel?.id === id) {
        setAvatarModel(null);
        setUserAvatar(DEFAULT_AVATAR);
      }
    } catch (error) {
      console.error('删除模特失败:', error);
      throw error;
    }
  };

  const toggleFavoriteItem = async (id: string) => {
    const willBeFav = !favoriteItemIds.includes(id);
    try {
      await wardrobeApi.updateClothes(id, { isFavorite: willBeFav });
      setFavoriteItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
      setItems(prev => prev.map(item => item.id === id ? { ...item, isFavorite: willBeFav } : item));
      showToast(willBeFav ? '已加入收藏' : '已取消收藏');
    } catch (e) {
      console.error(e);
      showToast('操作失败，请重试');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            onOpenAI={() => ensureLogin(() => setIsAIModalOpen(true))}
            onOpenWeeklyPlan={() => ensureLogin(() => setIsWeeklyPlanOpen(true))}
            userAvatar={userAvatar}
            onUpdateAvatar={handleUpdateAvatar}
            weather={weather}
            showToast={showToast}
            closetItems={items}
            isLoggedIn={isLoggedIn}
            onRequestLogin={() => setIsAuthModalOpen(true)}
            nickname={currentUser?.nickname}
            userGender={currentUser?.gender}
            onOpenModelManage={() => ensureLogin(() => setIsModelManageOpen(true))}
          />
        );
      case 'closet':
        return (
          <ClosetTab 
            items={Array.isArray(items) ? items : []} 
            favoriteItemIds={favoriteItemIds}
            onToggleFavorite={toggleFavoriteItem}
            onOpenScan={() => ensureLogin(() => setIsScanModalOpen(true))}
            onOpenDIY={() => ensureLogin(() => setIsDIYModalOpen(true))}
            onOpenAI={() => ensureLogin(() => setIsAIModalOpen(true))}
            onDelete={handleDeleteItem}
            onUpdate={handleUpdateItem}
          />
        );
      case 'calendar':
        return (
          <CalendarTab
            outfitRecords={outfitRecords}
            closetItems={items}
            weather={weather}
            weekWeather={weekWeather}
            onDeleteRecord={handleDeleteRecord}
            onOpenDIY={(date) => ensureLogin(() => { setDiyTargetDate(date); setIsDIYModalOpen(true); })}
            initialDate={calendarInitialDate}
            onInitialDateConsumed={() => setCalendarInitialDate(null)}
          />
        );
      case 'user':
        return isLoggedIn ? (
          <UserTab 
            userStyles={userStyles}
            onToggleStyle={toggleUserStyle}
            favoriteItemIds={favoriteItemIds}
            closetItems={items}
            outfitRecords={outfitRecords}
            onLogout={handleLogout}
            onToggleFavorite={toggleFavoriteItem}
            avatarModel={avatarModel ? { id: avatarModel.id, imageUrl: avatarModel.image, isActive: avatarModel.isActive, createdAt: avatarModel.createdAt } : null}
            onUploadAvatarModel={uploadAvatarModelToServer}
            onDeleteAvatarModel={deleteAvatarModelFromServer}
            onSaveStyles={saveUserStyles}
            isSavingStyles={isSavingStyles}
            onOpenModelManage={() => setIsModelManageOpen(true)}
            userProfile={currentUser ? { nickname: currentUser.nickname, gender: currentUser.gender ?? null, bio: currentUser.bio || '', avatar: currentUser.avatar || '', height: currentUser.height ?? null, weight: currentUser.weight ?? null } : undefined}
            onSaveProfile={handleSaveProfile}
            userPhone={currentUser?.phone}
            showToast={showToast}
            onGoToCalendarDate={(date) => { setCalendarInitialDate(date); setActiveTab('calendar'); }}
          />
        ) : (
          <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar animate-fade-in">
            {/* Guest Profile Header */}
            <div className="relative pb-6">
              <div className="h-32 bg-gray-100 rounded-b-[40px]"></div>
              <div className="px-6 -mt-12 flex justify-between items-end">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-50 flex items-center justify-center text-gray-200">
                   <User size={48} />
                </div>
              </div>
              <div className="px-6 mt-4">
                <h2 className="text-xl font-bold text-gray-800">游客用户</h2>
                <p className="text-xs text-gray-400 mt-1">登录开启您的智能时尚之旅 ✨</p>
              </div>
            </div>

            <div className="px-6 py-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 animate-bounce shadow-sm">
                 <Sparkles size={32} fill="currentColor" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">欢迎来到数字衣橱</h3>
              <p className="text-xs text-text-secondary mb-8 leading-relaxed max-w-[240px]">登录后即可同步您的穿搭日历、查看衣橱分析并收藏心仪单品</p>
              
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full max-w-[280px] py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                立即登录 / 注册
              </button>
            </div>

            {/* Teaser Sections for Guest */}
            <div className="mt-8 px-6 space-y-4 opacity-40 pointer-events-none grayscale">
               <div className="h-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center px-4 justify-between">
                  <span className="text-xs font-bold text-gray-400">穿搭日历</span>
                  <div className="w-4 h-4 rounded-full bg-gray-200"></div>
               </div>
               <div className="h-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center px-4 justify-between">
                  <span className="text-xs font-bold text-gray-400">我的收藏</span>
                  <div className="w-4 h-4 rounded-full bg-gray-200"></div>
               </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background-light">
      <div className="relative w-[375px] h-[812px] bg-background-light rounded-[45px] shadow-2xl overflow-hidden border-[8px] border-[#1a1a1a]">
        
        {/* Status Bar */}
        <div className="h-12 w-full flex justify-between items-center px-8 pt-4 text-xs font-bold text-[#140d1b] bg-background-light z-20 absolute top-0 left-0 right-0">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <Signal size={14} fill="currentColor" />
            <Wifi size={14} />
            <BatteryFull size={16} fill="currentColor" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="h-full pt-12 relative bg-background-light">
          {renderContent()}
        </div>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-4 py-3 rounded-full shadow-xl z-[60] flex items-center gap-2 animate-slide-up whitespace-nowrap">
             <CheckCircle2 size={16} className="text-green-400" />
             <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        {/* Auth Screen Overlay */}
        {isAuthModalOpen && (
          <AuthScreen 
            onLogin={(user) => handleAuthSuccess(user)} 
            onClose={() => setIsAuthModalOpen(false)} 
          />
        )}

        {/* Bottom Navigation */}
        <TabBar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            // Updated: clicking user tab always changes tab, 
            // the logic inside renderContent handles the guest vs logged view
            setActiveTab(tab);
          }}
          onAddClick={() => ensureLogin(() => setIsScanModalOpen(true))} 
        />

        {/* Modals */}
        <ScanModal 
          isOpen={isScanModalOpen} 
          onClose={() => setIsScanModalOpen(false)}
          onImport={handleImportItem}
          onBatchImport={handleBatchImportItems}
        />

        <DIYOutfitPage
          isOpen={isDIYModalOpen}
          onClose={() => { setIsDIYModalOpen(false); setDiyTargetDate(undefined); }}
          closetItems={items}
          showToast={showToast}
          onSaveSuccess={(record) => setOutfitRecords(prev => [record, ...prev])}
          onGoToCalendar={() => setActiveTab('calendar')}
          targetDate={diyTargetDate}
        />

        <AIOutfitModal 
          isOpen={isAIModalOpen} 
          onClose={() => setIsAIModalOpen(false)} 
          closetItems={items}
          userAvatar={avatarModel?.image || userAvatar}
          userGender={currentUser?.gender}
          weather={weather}
          userStyles={userStyles}
          onToggleStyle={toggleUserStyle}
          onAddToCalendar={handleAddToCalendar}
          onUpdateAvatar={handleOutfitResult}
          onAvatarModelUpload={handleAvatarModelUpload}
          onGoToCloset={() => setActiveTab('closet')}
        />

        <WeeklyPlanModal
          isOpen={isWeeklyPlanOpen}
          onClose={() => setIsWeeklyPlanOpen(false)}
          closetItems={items}
          weather={weather}
          onSavePlan={(plan) => {
            showToast('一周规划已保存');
          }}
        />

        <ModelManagePage
          isOpen={isModelManageOpen}
          onClose={() => setIsModelManageOpen(false)}
          activeModel={avatarModel}
          userModels={userModels}
          onSelectBuiltinModel={selectBuiltinModel}
          onUploadModel={uploadNewModel}
          onActivateModel={activateModel}
          onDeleteModel={deleteModelFromManage}
          showToast={showToast}
        />

        <GenderGuideModal
          isOpen={showGenderGuide}
          onConfirm={handleGenderConfirm}
          onSkip={() => setShowGenderGuide(false)}
        />

        {/* Demo Mode Badge */}
        {isDemoMode() && (
          <div className="absolute top-[52px] left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-400/90 text-[9px] font-bold text-amber-900 shadow-sm backdrop-blur-sm">
              <Sparkles size={10} /> DEMO 演示模式
            </span>
          </div>
        )}
      </div>

      {/* Demo Mode: GitHub link */}
      {isDemoMode() && (
        <div className="fixed bottom-4 right-4 z-50">
          <a
            href="https://github.com/fengjiabin43/ai-outfit-demo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-medium shadow-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            查看源码
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
