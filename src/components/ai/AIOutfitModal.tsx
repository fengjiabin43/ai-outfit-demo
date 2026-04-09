import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Shirt, Sparkles, Check, RefreshCcw, Download, CalendarPlus, ArrowRight, Zap, AlertCircle, Camera, Share2 } from 'lucide-react';
import { ClothingItem, WeatherData, Outfit, OutfitItem } from '../../types';
import { uploadApi, tryonApi, aiApi, isLoggedIn } from '../../api';
import { getModelsByGender } from '../../data/builtinModels';
import { isDemoMode } from '../../mock/demoApi';

// 辅助函数：检查图片是否是 base64 格式
const isBase64Image = (url: string | undefined): boolean => {
  return !!url && url.startsWith('data:');
};

// 辅助函数：确保图片是可访问的 URL（如果是 base64 则上传到服务器）
const ensureImageUrl = async (imageData: string | undefined, type: 'clothes' | 'model' = 'clothes'): Promise<string | undefined> => {
  if (!imageData) return undefined;
  
  // 如果已经是 HTTP/HTTPS URL，直接返回
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return imageData;
  }
  
  // 如果是服务器相对路径（/uploads/... 或 /models/... 等），直接返回
  if (imageData.startsWith('/')) {
    return imageData;
  }
  
  // 如果是 base64，上传到 OSS
  if (isBase64Image(imageData) && isLoggedIn()) {
    try {
      const result = await uploadApi.uploadImage(imageData, type);
      return result.url;
    } catch (error) {
      console.error('上传图片失败:', error);
      return undefined;
    }
  }
  
  return undefined;
};

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1550614000-4b9519871b9a?w=600&h=800&fit=crop";

interface AIOutfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  closetItems: ClothingItem[];
  userAvatar: string;
  userGender?: 'male' | 'female' | null;
  weather: WeatherData;
  userStyles: string[];
  onToggleStyle: (style: string) => void;
  onAddToCalendar: (outfit: Outfit, date: string) => void;
  onUpdateAvatar: (outfit: Outfit) => void;
  onAvatarModelUpload?: (img: string) => void;
  onGoToCloset?: () => void;
}

type Mode = 'inspiration' | 'match';
type Step = 'input' | 'candidates' | 'try-on' | 'result' | 'refine'; // 添加refine步骤用于微调

const AIOutfitModal: React.FC<AIOutfitModalProps> = ({ 
    isOpen, onClose, closetItems, userAvatar, userGender, weather, userStyles, onToggleStyle, onAddToCalendar, onUpdateAvatar, onAvatarModelUpload, onGoToCloset 
}) => {
  const [mode, setMode] = useState<Mode>('inspiration');
  const [step, setStep] = useState<Step>('input');
  
  const [inputText, setInputText] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // Candidates State
  const [candidates, setCandidates] = useState<OutfitItem[][]>([]);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<number>(0);
  
  // Refine State (微调功能)
  const [refiningItemIdx, setRefiningItemIdx] = useState<number | null>(null); // 要替换的单品索引
  const [refineCandidates, setRefineCandidates] = useState<OutfitItem[][]>([]); // 微调后的3套备选

  const [result, setResult] = useState<Outfit | null>(null);
  
  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 记录当前推荐的 outfitId 列表（用于重新生成时排除）
  const [currentOutfitIds, setCurrentOutfitIds] = useState<string[]>([]);
  
  // Avatar Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
        setStep('input');
        setResult(null);
        setCandidates([]);
        setRefineCandidates([]);
        setRefiningItemIdx(null);
        setMode('inspiration');
        setShowDatePicker(false);
        setInputText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Constraint Check
  const canGenerate = closetItems.length >= 6;

  // 分类排序权重：连衣裙/套装与上装同级，其他依次排
  const categoryOrder: Record<string, number> = { '上衣': 0, '连衣裙': 0, '套装': 0, '下装': 1, '鞋子': 2, '配饰': 3 };

  // 本地随机降级（API 失败时使用）
  // 连衣裙/套装视为"全身服装"，等同上装处理，不需再补底装
  const FULL_BODY_CATS = ['连衣裙', '套装'];
  const isTopType = (item: { category?: string | null }) =>
    item.category === '上衣' || FULL_BODY_CATS.includes(item.category || '');

  const pickRandomOutfit = (contextItem?: ClothingItem, usedBottomIds: Set<string> = new Set()): OutfitItem[] => {
      const femaleKeywords = ['吊带', '蕾丝', '蝴蝶结', '碎花连衣'];
      const maleKeywords = ['西装领带'];
      const genderFilter = (item: ClothingItem) => {
        if (!userGender) return true;
        const text = `${item.name} ${item.subCategory || ''} ${item.style || ''}`;
        if (userGender === 'male') return !femaleKeywords.some(kw => text.includes(kw));
        if (userGender === 'female') return !maleKeywords.some(kw => text.includes(kw));
        return true;
      };
      const genderFiltered = closetItems.filter(genderFilter);
      const fixedId = contextItem?.id;
      // 上装池：含连衣裙/套装
      const tops       = genderFiltered.filter(i => isTopType(i) && i.id !== fixedId);
      const bottoms    = genderFiltered.filter(i => i.category === '下装'  && i.id !== fixedId);
      const shoes      = genderFiltered.filter(i => i.category === '鞋子'  && i.id !== fixedId);
      const accessories = genderFiltered.filter(i => i.category === '配饰' && i.id !== fixedId);

      let outfit: ClothingItem[] = [];
      if (contextItem) outfit.push(contextItem);

      // 已有上装类（含连衣裙/套装）则不再补
      if (!outfit.some(i => isTopType(i)) && tops.length > 0)
        outfit.push(tops[Math.floor(Math.random() * tops.length)]);

      // 连衣裙/套装本身覆盖下半身，不再补底装
      const hasFullBodyItem = outfit.some(i => FULL_BODY_CATS.includes(i.category || ''));
      if (!hasFullBodyItem) {
        // 下装优先选未用过的，避免多套方案重复
        const freshBottoms = bottoms.filter(b => !usedBottomIds.has(b.id));
        const bottomPool = freshBottoms.length > 0 ? freshBottoms : bottoms;
        if (!outfit.some(i => i.category === '下装') && bottomPool.length > 0) {
          const pick = bottomPool[Math.floor(Math.random() * bottomPool.length)];
          outfit.push(pick);
          usedBottomIds.add(pick.id);
        }
      }

      if (!outfit.some(i => i.category === '鞋子') && shoes.length > 0)
        outfit.push(shoes[Math.floor(Math.random() * shoes.length)]);
      if (accessories.length > 0 && Math.random() > 0.6)
        outfit.push(accessories[Math.floor(Math.random() * accessories.length)]);

      // 按 上装→下装→鞋子→配饰 排序后返回
      outfit.sort((a, b) => (categoryOrder[a.category || ''] ?? 9) - (categoryOrder[b.category || ''] ?? 9));
      return outfit.map(i => ({ name: i.name, img: i.image, category: i.category, clothesId: i.id }));
  };

  // 将后端返回的 outfit 数据中的图片匹配到本地 closetItems
  const resolveOutfitImages = (items: OutfitItem[]): OutfitItem[] => {
    const resolved = items
      .map(item => {
        if (item.img) return item;
        if (item.clothesId) {
          const local = closetItems.find(c => c.id === item.clothesId);
          if (local) return { ...item, img: local.image, category: local.category };
        }
        const byName = closetItems.find(c => c.name === item.name);
        if (byName) return { ...item, img: byName.image, category: byName.category, clothesId: byName.id };
        const byPartialName = closetItems.find(c =>
          item.name && (c.name.includes(item.name) || item.name.includes(c.name))
        );
        if (byPartialName) return { ...item, img: byPartialName.image, category: byPartialName.category, clothesId: byPartialName.id };
        return item;
      })
      .filter(item => item.img);

    // 按 上装→下装→鞋子→配饰 排序
    resolved.sort((a, b) => (categoryOrder[a.category || ''] ?? 9) - (categoryOrder[b.category || ''] ?? 9));

    return resolved;
  };

  // 前端去重：确保多套方案不完全一致（fingerprint 基于 clothesId 或 name）
  const deduplicateCandidates = (candidatesList: OutfitItem[][], fixedId?: string | null): OutfitItem[][] => {
    const fingerprint = (outfit: OutfitItem[]) =>
      outfit.map(i => i.clothesId || i.name).sort().join(',');

    const usedFps = new Set<string>();
    return candidatesList.map(outfit => {
      const fp = fingerprint(outfit);
      if (!usedFps.has(fp)) {
        usedFps.add(fp);
        return outfit;
      }
      // 尝试替换一件非固定单品来打破重复
      const newOutfit = [...outfit];
      for (let i = 0; i < newOutfit.length; i++) {
        const item = newOutfit[i];
        if (fixedId && item.clothesId === fixedId) continue;
        const cat = item.category;
        const alternatives = closetItems.filter(c =>
          c.category === cat &&
          c.id !== item.clothesId &&
          !newOutfit.some(o => o.clothesId === c.id)
        );
        if (alternatives.length > 0) {
          const pick = alternatives[Math.floor(Math.random() * alternatives.length)];
          newOutfit[i] = { name: pick.name, img: pick.image, category: pick.category, clothesId: pick.id };
          const newFp = fingerprint(newOutfit);
          if (!usedFps.has(newFp)) {
            usedFps.add(newFp);
            return newOutfit;
          }
        }
      }
      usedFps.add(fp);
      return outfit;
    });
  };

  const generateCandidates = async () => {
    setIsGenerating(true);
    setLoadingText("AI 正在分析您的衣橱...");
    setStep('candidates');

    try {
      if (!isLoggedIn()) {
        throw new Error('请先登录');
      }

      const params: { scene?: string; singleItemId?: string; message?: string; count?: number } = { count: 3 };
      if (mode === 'match' && selectedItemId) {
        params.singleItemId = selectedItemId;
      }
      if (inputText) {
        params.message = inputText;
        const sceneMap: Record<string, string> = { '约会': 'date', '通勤': 'commute', '运动': 'sports', '派对': 'party', '居家': 'home' };
        for (const [cn, en] of Object.entries(sceneMap)) {
          if (inputText.includes(cn)) { params.scene = en; break; }
        }
      }

      const result = await aiApi.recommend(params) as { data?: { outfits?: { id: string; items: OutfitItem[] }[] } };
      const outfits = result.data?.outfits || [];

      console.log('[AI搭配] 后端返回 outfits:', outfits.length, '套');
      outfits.forEach((o, i) => {
        console.log(`[AI搭配] 方案${i + 1}: ${o.items?.length || 0} 件`, o.items?.map(it => `${it.name}(img:${it.img ? '有' : '无'}, id:${it.clothesId || '无'})`));
      });
      console.log('[AI搭配] 前端 closetItems:', closetItems.length, '件');

      if (outfits.length > 0) {
        const resolved = outfits.map(o => resolveOutfitImages(o.items));
        console.log('[AI搭配] resolve 后有效单品:', resolved.map(c => c.length));
        
        // 如果 AI 返回了方案但解析后全部为空（ID 不匹配），降级为本地随机
        const hasValidOutfit = resolved.some(c => c.length > 0);
        if (!hasValidOutfit) {
          console.warn('[AI搭配] AI 返回的方案全部无法匹配衣柜，降级为本地随机');
          throw new Error('AI 返回的单品无法匹配衣柜');
        }

        // 前端去重，防止多套方案完全相同
        const newCandidates = deduplicateCandidates(resolved, mode === 'match' ? selectedItemId : null);
        console.log('[AI搭配] 去重后方案 fingerprint:', newCandidates.map(c => c.map(i => i.clothesId || i.name).sort().join(',')));
        
        const ids = outfits.map(o => o.id).filter(Boolean);
        setCandidates(newCandidates);
        setCurrentOutfitIds(ids);
        setSelectedCandidateIdx(0);
      } else {
        throw new Error('AI 未返回推荐结果');
      }
    } catch (error: any) {
      console.warn("AI 推荐失败，降级为本地随机:", error?.message);
      const fallback: OutfitItem[][] = [];
      const usedBottomIds = new Set<string>();
      for (let i = 0; i < 3; i++) {
        if (mode === 'match' && selectedItemId) {
          const item = closetItems.find(it => it.id === selectedItemId);
          fallback.push(pickRandomOutfit(item, usedBottomIds));
        } else {
          fallback.push(pickRandomOutfit(undefined, usedBottomIds));
        }
      }
      setCandidates(fallback);
      setCurrentOutfitIds([]);
      setSelectedCandidateIdx(0);
    } finally {
      setIsGenerating(false);
    }
  };

  // 微调功能：换掉某件单品，调用后端 AI 生成3套备选
  const handleRefineItem = async (itemIdx: number) => {
    setRefiningItemIdx(itemIdx);
    setIsGenerating(true);
    setLoadingText("AI 正在生成备选方案...");
    setStep('refine');

    try {
        const currentOutfit = candidates[selectedCandidateIdx];
        const itemToReplace = currentOutfit[itemIdx];
        const outfitId = currentOutfitIds[selectedCandidateIdx];
        const itemCategory = closetItems.find(it => it.name === itemToReplace.name)?.category || itemToReplace.category;

        if (isLoggedIn() && outfitId) {
          const result = await aiApi.adjust({
            outfitId,
            replaceItemId: itemToReplace.clothesId,
            replaceCategory: itemCategory,
            instruction: `替换掉"${itemToReplace.name}"，推荐其他同类型单品`,
          }) as { data?: { alternatives?: { items: OutfitItem[] }[] } };

          const alternatives = result.data?.alternatives || [];
          if (alternatives.length > 0) {
            setRefineCandidates(alternatives.map(a => resolveOutfitImages(a.items)));
            setIsGenerating(false);
            return;
          }
        }

        // 降级：本地随机替换
        const newRefineCandidates: OutfitItem[][] = [];
        for (let i = 0; i < 3; i++) {
            const newOutfit = [...currentOutfit];
            const replacements = closetItems.filter(it =>
                it.category === itemCategory && it.name !== itemToReplace.name
            );
            if (replacements.length > 0) {
                const replacement = replacements[Math.floor(Math.random() * replacements.length)];
                newOutfit[itemIdx] = { name: replacement.name, img: replacement.image, category: replacement.category, clothesId: replacement.id };
            }
            newRefineCandidates.push(newOutfit);
        }
        setRefineCandidates(newRefineCandidates);
    } catch (error) {
        console.warn("AI 微调失败，降级为本地随机:", error);
        const currentOutfit = candidates[selectedCandidateIdx];
        const itemToReplace = currentOutfit[itemIdx];
        const itemCategory = closetItems.find(it => it.name === itemToReplace.name)?.category;
        const newRefineCandidates: OutfitItem[][] = [];
        for (let i = 0; i < 3; i++) {
            const newOutfit = [...currentOutfit];
            const replacements = closetItems.filter(it =>
                it.category === itemCategory && it.name !== itemToReplace.name
            );
            if (replacements.length > 0) {
                const replacement = replacements[Math.floor(Math.random() * replacements.length)];
                newOutfit[itemIdx] = { name: replacement.name, img: replacement.image, category: replacement.category, clothesId: replacement.id };
            }
            newRefineCandidates.push(newOutfit);
        }
        setRefineCandidates(newRefineCandidates);
    } finally {
        setIsGenerating(false);
    }
  };

  // 选择微调后的方案
  const handleSelectRefined = (refineIdx: number) => {
    const selectedRefined = refineCandidates[refineIdx];
    const newCandidates = [...candidates];
    newCandidates[selectedCandidateIdx] = selectedRefined;
    setCandidates(newCandidates);
    setRefiningItemIdx(null);
    setRefineCandidates([]);
    setStep('candidates');
  };

  const performVirtualTryOn = async () => {
    setIsGenerating(true);
    setLoadingText("正在准备图片...");
    setStep('try-on');

    const selectedOutfitItems = candidates[selectedCandidateIdx];
    const itemNames = selectedOutfitItems.map(i => i.name).join(', ');
    const promptContext = mode === 'inspiration' ? `搭配 ${itemNames}` : inputText || userStyles.join(', ');

    // Demo 模式：跳过真实 AI 试衣，直接展示模拟结果
    if (isDemoMode()) {
      setLoadingText("AI 正在为您换装...");
      await new Promise(r => setTimeout(r, 1500));
      const topItem = selectedOutfitItems.find(i => i.category === '上衣');
      setResult({
        id: Date.now().toString(),
        title: mode === 'inspiration' ? 'AI 灵感生成' : 'AI 智能搭配',
        desc: `AI 根据"${promptContext}"为您生成了这套 Look。\n\n⚠️ 当前为 Demo 演示模式，虚拟试衣仅提供占位图展示。实际版本将通过阿里云百炼 AI 试衣 API 生成真实的上身效果图。`,
        fittedImage: topItem?.img || selectedOutfitItems[0]?.img || '/models/women1.png',
        items: selectedOutfitItems,
      });
      setStep('result');
      setIsGenerating(false);
      return;
    }

    const getGarmentInfo = () => {
      const garments: { image: string; name: string; category: string }[] = [];
      for (const o of selectedOutfitItems) {
        const closetItem = closetItems.find(c => c.name === o.name);
        const image = closetItem?.image || o.img;
        const category = o.category || closetItem?.category || '服装';
        if (image) {
          garments.push({ image, name: o.name, category });
        }
      }
      return garments;
    };

    try {
      // 检查是否已登录（后端试衣 API 需要认证）
      if (!isLoggedIn()) {
        setLoadingText("请先登录");
        await new Promise(r => setTimeout(r, 1500));
        setResult({
          id: Date.now().toString(),
          title: "需要登录",
          desc: "虚拟试衣功能需要登录后使用，请先登录。",
          fittedImage: "",
          items: selectedOutfitItems,
        });
        setStep('result');
        setIsGenerating(false);
        return;
      }

      setLoadingText("正在上传图片...");

      let avatarToUse = userAvatar;
      if (!avatarToUse || avatarToUse === DEFAULT_AVATAR) {
        const gender = userGender || 'female';
        const genderModels = getModelsByGender(gender);
        if (genderModels.length > 0) {
          avatarToUse = genderModels[Math.floor(Math.random() * genderModels.length)].image;
        }
      }

      const personImageUrl = await ensureImageUrl(avatarToUse, 'model');
      
      if (!personImageUrl) {
        setLoadingText("请先在设置中选择模特或上传全身照");
        await new Promise(r => setTimeout(r, 1500));
        setResult({
          id: Date.now().toString(),
          title: "需要选择模特",
          desc: "请先在个人设置中选择模特或上传您的全身照，再进行虚拟试衣。",
          fittedImage: "",
          items: selectedOutfitItems,
        });
        setStep('result');
        setIsGenerating(false);
        return;
      }

      const garments = getGarmentInfo();
      if (garments.length === 0) {
        setLoadingText("没有找到服装图片");
        await new Promise(r => setTimeout(r, 1000));
        setResult({
          id: Date.now().toString(),
          title: "虚拟试穿失败",
          desc: "请确保推荐的服装有对应的图片。",
          fittedImage: "",
          items: selectedOutfitItems,
        });
        setStep('result');
        setIsGenerating(false);
        return;
      }

      // 准备服装图片 URL
      // 上装：上衣、外套、连衣裙等
      // 下装：裤子、裙子等
      let topGarmentUrl: string | undefined;
      let bottomGarmentUrl: string | undefined;

      for (const g of garments) {
        const cat = g.category;
        // 连衣裙/套装/上衣类 → 作为上装（top_garment_url）
        if (!topGarmentUrl && (cat === '上衣' || cat === '外套' || cat === '连衣裙' || cat === '套装')) {
          topGarmentUrl = await ensureImageUrl(g.image, 'clothes');
        // 普通下装（裤/半裙等）→ 作为下装（bottom_garment_url）
        } else if (!bottomGarmentUrl && (cat === '下装' || cat === '裤子' || cat === '裙子')) {
          bottomGarmentUrl = await ensureImageUrl(g.image, 'clothes');
        }
      }

      // 兜底：全部单品均无法按分类匹配时，第1件→上装，第2件→下装
      if (!topGarmentUrl && !bottomGarmentUrl && garments.length > 0) {
        topGarmentUrl = await ensureImageUrl(garments[0].image, 'clothes');
        if (garments.length > 1) {
          bottomGarmentUrl = await ensureImageUrl(garments[1].image, 'clothes');
        }
      }

      // 仅有连衣裙（topGarmentUrl 有值，bottomGarmentUrl 为空）→ 单件试穿，不需要强制补底

      if (!topGarmentUrl && !bottomGarmentUrl) {
        setLoadingText("无法获取服装图片 URL");
        await new Promise(r => setTimeout(r, 1500));
        setResult({
          id: Date.now().toString(),
          title: "虚拟试穿失败",
          desc: "服装图片需要上传到服务器才能进行试衣，请确保图片已正确上传。",
          fittedImage: "",
          items: selectedOutfitItems,
        });
        setStep('result');
        setIsGenerating(false);
        return;
      }

      // 调用后端百炼 AI 试衣 API
      setLoadingText("AI 正在为您换装...");
      console.log('调用阿里云百炼 AI 试衣 (基础版)...');
      console.log('人物图:', personImageUrl);
      console.log('上装:', topGarmentUrl);
      console.log('下装:', bottomGarmentUrl);

      const createResult = await tryonApi.generate({
        personImageUrl,
        topGarmentUrl,
        bottomGarmentUrl,
        model: 'aitryon', // 基础试衣版
      });

      const taskId = createResult.data?.taskId;
      if (!taskId) {
        throw new Error('创建试衣任务失败：未返回任务 ID');
      }

      console.log('试衣任务已创建，taskId:', taskId);
      setLoadingText("AI 正在生成试衣效果（约 15-30 秒）...");

      // 轮询任务状态（每 3 秒查询一次，最多等 120 秒）
      const MAX_POLL_TIME = 120 * 1000; // 120 秒超时
      const POLL_INTERVAL = 3000; // 3 秒间隔
      const startTime = Date.now();
      let finalImageUrl: string | undefined;

      while (Date.now() - startTime < MAX_POLL_TIME) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
        
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        setLoadingText(`AI 正在生成试衣效果（已等待 ${elapsed} 秒）...`);

        const statusResult = await tryonApi.getStatus(taskId);
        const taskData = statusResult.data;

        if (taskData?.status === 'succeeded') {
          finalImageUrl = taskData.resultImageUrl;
          console.log('试衣任务完成！结果图:', finalImageUrl);
          break;
        } else if (taskData?.status === 'failed') {
          throw new Error(taskData.errorMessage || '试衣任务处理失败');
        }
        // pending 或 processing 继续轮询
      }

      if (!finalImageUrl) {
        throw new Error('试衣任务超时，请稍后重试');
      }

      // 展示结果
      setResult({
        id: Date.now().toString(),
        title: mode === 'inspiration' ? 'AI 灵感生成' : 'AI 智能搭配',
        desc: `AI 根据"${promptContext}"为您生成了这套 Look（阿里云百炼 AI 试衣）。`,
        fittedImage: finalImageUrl,
        items: selectedOutfitItems,
      });
      setStep('result');

    } catch (error: any) {
      console.error("阿里云百炼试衣失败:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "AI 试衣处理失败，请检查网络和 API 配置。";
      setResult({
        id: Date.now().toString(),
        title: "虚拟试穿失败",
        desc: `试穿未成功：${errorMsg}`,
        fittedImage: "", // 不使用占位图，明确展示失败
        items: selectedOutfitItems,
      });
      setStep('result');
    } finally {
      setIsGenerating(false);
    }
  };


  const handleDateSelect = (date: string) => {
      if (result) {
          onAddToCalendar(result, date);
          setShowDatePicker(false);
      }
  };

  const handleInstantWear = () => {
      if (result) {
          onUpdateAvatar(result); // 传递完整的Outfit对象
          onClose();
      }
  };

  const quickTags = ["约会", "通勤", "运动", "派对", "居家"];
  const styleTags = ['简约', '法式', '日系工装', '美式复古', '辣妹', '运动休闲'];

  // Not Enough Clothes View
  if (!canGenerate) {
      return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white w-[85%] max-w-[320px] rounded-[32px] p-6 text-center animate-slide-up relative">
                {/* 关闭按钮 */}
                <button 
                  onClick={onClose} 
                  className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">衣橱需要更多单品</h2>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    为了提供高质量的 AI 搭配建议，您的电子衣柜至少需要 6 件单品。<br/>
                    (当前: {closetItems.length} 件)
                </p>
                <button 
                  onClick={() => {
                    onClose();
                    onGoToCloset?.();
                  }} 
                  className="w-full py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold active:scale-95 transition-transform"
                >
                    去录入单品
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
      <div className="bg-background-light w-full max-w-[375px] h-[95vh] sm:h-[800px] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col relative animate-slide-up shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-6 flex justify-between items-center bg-white z-10 border-b border-gray-50">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Wand2 className="text-primary" size={20} />
                {step === 'result' ? '虚拟试穿完成' : 'AI 智能搭配'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100">
                <X size={18} className="text-gray-500" />
            </button>
        </div>

        {/* Hidden File Input for Avatar Upload */}
        {onAvatarModelUpload && (
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            if (typeof reader.result === 'string' && onAvatarModelUpload) {
                                onAvatarModelUpload(reader.result);
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                }}
            />
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 relative no-scrollbar">
            
            {/* STEP 1: INPUT */}
            {step === 'input' && !isGenerating && (
                 <div className="animate-fade-in">
                    <div className="flex bg-white p-1.5 rounded-2xl mb-6 border border-gray-100 shadow-sm">
                        <button 
                            onClick={() => { setMode('inspiration'); setSelectedItemId(null); }}
                            className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'inspiration' ? 'bg-purple-50 text-purple-600 shadow-inner' : 'text-gray-400'}`}
                        >
                            <Sparkles size={14} /> 场景灵感
                        </button>
                        <button 
                            onClick={() => { setMode('match'); }}
                            className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'match' ? 'bg-purple-50 text-purple-600 shadow-inner' : 'text-gray-400'}`}
                        >
                            <Shirt size={14} /> 单品匹配
                        </button>
                    </div>

                    {mode === 'inspiration' ? (
                        <>
                            <div className="mb-4 bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                                <div 
                                    className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-100 shadow-sm flex-shrink-0 relative cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <img src={userAvatar} className="w-full h-full object-cover" />
                                    {(!userAvatar || userAvatar === DEFAULT_AVATAR) && onAvatarModelUpload ? (
                                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <Camera size={20} className="text-primary" />
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-bold text-gray-800 mb-1.5">
                                        {(!userAvatar || userAvatar === DEFAULT_AVATAR) && onAvatarModelUpload 
                                            ? '首次使用请上传全身照' 
                                            : '专属模特已就绪'}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {userStyles.map(style => (
                                            <button 
                                                key={style}
                                                onClick={() => onToggleStyle(style)}
                                                className={`text-[9px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                                                    userStyles.includes(style) 
                                                    ? 'bg-purple-600 text-white shadow-md' 
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                            >
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm font-bold text-gray-700 mb-3 ml-1">您想穿搭什么场合？</p>
                            <textarea 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-xs h-32 outline-none focus:ring-2 focus:ring-purple-200 resize-none shadow-sm text-gray-700 leading-relaxed transition-all"
                                placeholder={`例如：今天有个重要的会议...`}
                            />
                            <div className="flex gap-2 mt-4 flex-wrap">
                                {quickTags.map(tag => (
                                    <button 
                                        key={tag}
                                        onClick={() => setInputText(prev => prev ? prev + " " + tag : tag)}
                                        className="px-4 py-2 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-500 hover:border-purple-200 hover:text-purple-600 active:scale-95 transition-all shadow-sm"
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="pb-20">
                            <p className="text-sm font-bold text-gray-700 mb-4 ml-1">从衣橱选择一件“主角”单品</p>
                            <div className="grid grid-cols-2 gap-4">
                                {closetItems.map(item => (
                                    <div 
                                        key={item.id}
                                        onClick={() => setSelectedItemId(item.id)}
                                        className={`group relative bg-white p-2 rounded-2xl border-2 transition-all cursor-pointer ${selectedItemId === item.id ? 'border-primary bg-primary/10 ring-4 ring-primary/20' : 'border-transparent shadow-sm hover:border-gray-200'}`}
                                    >
                                        <div className="aspect-square rounded-xl overflow-hidden mb-2">
                                            <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="px-1 flex justify-between items-center">
                                             <p className="text-[10px] font-bold truncate text-gray-700 max-w-[70%]">{item.name}</p>
                                             <span className="text-[8px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{item.category}</span>
                                        </div>
                                        {selectedItemId === item.id && (
                                            <div className="absolute top-3 right-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg animate-fade-in">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 2: LOADING */}
            {isGenerating && (
                <div className="flex flex-col items-center justify-center h-full pb-10 animate-fade-in">
                    <div className="relative w-56 h-72 mb-10 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
                         <img src={userAvatar} className="w-full h-full object-cover opacity-80" />
                         <div className="absolute inset-0 bg-primary/10 z-10"></div>
                         <div className="absolute top-0 left-0 w-full h-[3px] bg-primary shadow-[0_0_25px_var(--color-primary),0_0_10px_var(--color-primary)] animate-scan z-20"></div>
                         <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 animate-pulse">
                                <Sparkles className="text-white" size={32} />
                            </div>
                         </div>
                    </div>
                    <p className="text-lg font-bold text-gray-800 tracking-tight">{loadingText}</p>
                    <p className="text-xs text-gray-400 mt-2 text-center max-w-[200px] leading-relaxed">AI 正在处理您的请求，请稍候...</p>
                </div>
            )}

            {/* STEP 3: CANDIDATES SELECTION — 纵向列表 */}
            {step === 'candidates' && !isGenerating && (() => {
                 const validCandidates = candidates.map(outfit => outfit.filter(item => item.img)).filter(outfit => outfit.length > 0);
                 
                 if (validCandidates.length === 0) {
                   return (
                     <div className="animate-fade-in flex flex-col items-center justify-center py-20">
                       <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4">
                         <AlertCircle size={32} />
                       </div>
                       <h3 className="text-base font-bold text-gray-800 mb-2">暂无搭配结果</h3>
                       <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed max-w-[240px]">
                         AI 推荐的单品未能匹配衣柜，请尝试重新生成
                       </p>
                       <button
                         onClick={generateCandidates}
                         className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                       >
                         <RefreshCcw size={16} /> 重新生成
                       </button>
                     </div>
                   );
                 }

                 return (
                   <div className="animate-slide-up pb-20">
                     <h3 className="text-lg font-bold text-gray-800 mb-2">为您推荐 {validCandidates.length} 套搭配</h3>
                     <p className="text-xs text-gray-400 mb-4">点击选择一套进行虚拟试穿，或点击单品进行微调</p>
                     
                     <div className="flex flex-col gap-4">
                        {validCandidates.map((validItems, idx) => (
                              <div 
                                  key={idx}
                                  onClick={() => setSelectedCandidateIdx(idx)}
                                  className={`w-full bg-white rounded-3xl p-4 border-2 transition-all cursor-pointer relative ${selectedCandidateIdx === idx ? 'border-primary shadow-xl shadow-primary/20' : 'border-gray-100 shadow-sm'}`}
                              >
                                  <div className="flex items-center gap-2 mb-4">
                                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${selectedCandidateIdx === idx ? 'bg-purple-600' : 'bg-gray-300'}`}>
                                           {idx + 1}
                                       </div>
                                       <span className="text-xs font-bold text-gray-600">搭配方案 {String.fromCharCode(65 + idx)}</span>
                                       {selectedCandidateIdx === idx && (
                                           <span className="ml-auto bg-purple-100 text-purple-600 text-[9px] px-2 py-0.5 rounded-full font-bold">已选择</span>
                                       )}
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-2">
                                      {validItems.map((item, itemIdx) => {
                                        const isFixed = mode === 'match' && selectedItemId && item.clothesId === selectedItemId;
                                        return (
                                          <div 
                                              key={itemIdx} 
                                              className={`rounded-xl p-2 relative group ${isFixed ? 'bg-purple-50 ring-2 ring-purple-300' : 'bg-gray-50'}`}
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (selectedCandidateIdx === idx && !isFixed) {
                                                      handleRefineItem(itemIdx);
                                                  }
                                              }}
                                          >
                                              <div className="aspect-square rounded-lg overflow-hidden mb-1.5 bg-white relative">
                                                <img src={item.img} className="w-full h-full object-cover" />
                                                {isFixed && (
                                                  <div className="absolute top-1 left-1 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                                                    固定
                                                  </div>
                                                )}
                                              </div>
                                              <p className="text-[9px] text-gray-600 truncate text-center">{item.name}</p>
                                              {item.category && (
                                                <p className="text-[8px] text-gray-400 truncate text-center">{item.category}</p>
                                              )}
                                              {selectedCandidateIdx === idx && !isFixed && (
                                                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity">
                                                      <RefreshCcw size={10} className="text-white" />
                                                  </div>
                                              )}
                                          </div>
                                        );
                                      })}
                                  </div>
                              </div>
                        ))}
                     </div>
                   </div>
                 );
            })()}

            {/* STEP 3.5: REFINE CANDIDATES (微调) */}
            {step === 'refine' && !isGenerating && refiningItemIdx !== null && (
                <div className="animate-slide-up pb-20">
                    <div className="flex items-center gap-2 mb-4">
                        <button 
                            onClick={() => {
                                setStep('candidates');
                                setRefiningItemIdx(null);
                                setRefineCandidates([]);
                            }}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                        >
                            <ArrowRight size={16} className="rotate-180" />
                        </button>
                        <h3 className="text-lg font-bold text-gray-800">换掉这件单品</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-6">为您推荐 3 套备选方案（其他单品不变）</p>
                    
                    <div className="flex flex-col gap-4">
                        {refineCandidates.map((outfit, idx) => {
                            const validItems = outfit.filter(item => item.img);
                            if (validItems.length === 0) return null;
                            return (
                              <div 
                                  key={idx}
                                  onClick={() => handleSelectRefined(idx)}
                                  className="w-full bg-white rounded-3xl p-4 border-2 border-primary/20 shadow-lg cursor-pointer hover:border-primary transition-all"
                              >
                                  <div className="flex items-center gap-2 mb-4">
                                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-purple-600">
                                          {idx + 1}
                                      </div>
                                      <span className="text-xs font-bold text-gray-600">备选方案 {String.fromCharCode(65 + idx)}</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-2">
                                      {validItems.map((item, itemIdx) => {
                                          const originalIdx = outfit.indexOf(item);
                                          return (
                                            <div 
                                                key={itemIdx} 
                                                className={`bg-gray-50 rounded-xl p-2 ${originalIdx === refiningItemIdx ? 'ring-2 ring-primary' : ''}`}
                                            >
                                                <div className="aspect-square rounded-lg overflow-hidden mb-1.5 bg-white">
                                                  <img src={item.img} className="w-full h-full object-cover" />
                                                </div>
                                                <p className="text-[9px] text-gray-600 truncate text-center">{item.name}</p>
                                                {originalIdx === refiningItemIdx && (
                                                    <p className="text-[8px] text-purple-600 font-bold text-center">已替换</p>
                                                )}
                                            </div>
                                          );
                                      })}
                                  </div>
                              </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* STEP 4: FINAL RESULT */}
            {step === 'result' && result && (
                <div className="animate-slide-up pb-10">
                    <div className="relative w-full aspect-[3/4.2] rounded-[40px] overflow-hidden shadow-2xl mb-6 bg-gray-200 group border-4 border-white">
                        {result.fittedImage ? (
                          <img 
                            src={result.fittedImage} 
                            className="w-full h-full object-cover"
                            alt="AI Fitted Result"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-6">
                            <AlertCircle size={48} className="text-orange-400 mb-4" />
                            <p className="text-sm font-bold text-gray-700 mb-2">{result.title}</p>
                            <p className="text-xs text-gray-500 text-center leading-relaxed">{result.desc}</p>
                          </div>
                        )}
                         {/* Virtual Try-On Badge */}
                        <div className="absolute top-6 left-6 z-20">
                            <div className="bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-[10px] font-bold shadow-lg flex items-center gap-1.5">
                                <Wand2 size={12} className="text-purple-300" />
                                AI 虚拟试穿效果
                            </div>
                        </div>
                        
                        <div className="absolute top-6 right-6 flex flex-col gap-2">
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch(result.fittedImage);
                                        const blob = await res.blob();
                                        const file = new File([blob], '试衣效果.png', { type: blob.type || 'image/png' });
                                        if (navigator.share && navigator.canShare?.({ files: [file] })) {
                                            await navigator.share({ title: 'AI 试衣效果', files: [file] });
                                        } else {
                                            const a = document.createElement('a');
                                            a.href = result.fittedImage;
                                            a.download = '试衣效果.png';
                                            a.click();
                                        }
                                    } catch (e) {
                                        const a = document.createElement('a');
                                        a.href = result.fittedImage;
                                        a.download = '试衣效果.png';
                                        a.click();
                                    }
                                }}
                                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors shadow-lg active:scale-90"
                            >
                                <Share2 size={20} />
                            </button>
                            <button
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = result.fittedImage;
                                    a.download = '试衣效果.png';
                                    a.click();
                                }}
                                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors shadow-lg active:scale-90"
                            >
                                <Download size={20} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleInstantWear}
                        className="w-full mb-4 py-4 bg-gray-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-3 transition-all hover:bg-black"
                    >
                        <Shirt size={18} />
                        保存并上身 (更新首页)
                    </button>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => { setStep('candidates'); }} 
                            className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                        >
                            <ArrowRight size={16} className="rotate-180" /> 返回重选
                        </button>
                        
                        <div className="flex-1 relative">
                            <button 
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="w-full py-4 bg-white border border-purple-200 text-purple-600 rounded-2xl text-xs font-bold hover:bg-purple-50 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                            >
                                <CalendarPlus size={16} />
                                加入日历
                            </button>
                            
                            {showDatePicker && (
                                <div className="absolute bottom-full mb-3 left-0 right-0 bg-white rounded-3xl shadow-2xl border border-gray-100 p-3 animate-slide-up z-20">
                                    <div className="flex items-center justify-between mb-3 px-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">选择日期</p>
                                        <X size={12} className="text-gray-300" onClick={() => setShowDatePicker(false)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['明天 (周四)', '周五', '周六', '下周一'].map(d => (
                                            <button 
                                                key={d}
                                                onClick={() => handleDateSelect(d)}
                                                className="w-full py-3 text-[10px] font-bold text-gray-700 bg-gray-50 hover:bg-purple-600 hover:text-white rounded-xl transition-all"
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>

        {/* Footer Action Button */}
        {step === 'input' && (
            <div className="p-8 bg-white border-t border-gray-50 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                <button 
                    onClick={generateCandidates}
                    disabled={mode === 'match' && !selectedItemId}
                    className={`w-full py-4 rounded-2xl text-sm font-bold shadow-2xl flex items-center justify-center gap-3 transition-all ${
                        (mode === 'inspiration' || selectedItemId) 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-purple-200 hover:scale-[1.02] active:scale-95' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                >
                    <Wand2 size={18} />
                    {mode === 'inspiration' ? 'AI 推荐搭配' : '生成搭配方案'}
                </button>
            </div>
        )}

        {step === 'candidates' && !isGenerating && (
             <div className="p-8 bg-white border-t border-gray-50 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] flex gap-4">
                <button 
                    onClick={() => { setStep('input'); setCandidates([]); }}
                    className="w-14 h-14 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50"
                >
                    <RefreshCcw size={20} />
                </button>
                <button 
                    onClick={generateCandidates}
                    className="w-14 h-14 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50"
                    title="重新生成"
                >
                    <RefreshCcw size={20} />
                </button>
                <button 
                    onClick={performVirtualTryOn}
                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-2xl shadow-purple-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <Wand2 size={18} />
                    一键虚拟试穿
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default AIOutfitModal;
