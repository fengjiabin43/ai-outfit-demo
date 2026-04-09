import { getToken, getApiBasePath } from './client';
import { isDemoMode, demoUpload } from '../mock/demoApi';

// ========== 上传 API ==========
export const uploadApi = {
  // 上传单个 File 对象（推荐：直接传文件，避免 base64 转换的内存问题）
  uploadFile: async (file: File, type: 'clothes' | 'avatar' | 'model' = 'clothes'): Promise<{ url: string; path: string }> => {
    if (isDemoMode()) return demoUpload();
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('type', type);

    const headers: Record<string, string> = {};
    const authToken = getToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${getApiBasePath()}/upload/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || '上传失败');
    }

    return data.data;
  },

  // 上传单张图片（base64 转 Blob 上传 - 兼容旧调用）
  uploadImage: async (base64Data: string, type: 'clothes' | 'avatar' | 'model' = 'clothes'): Promise<{ url: string; path: string }> => {
    if (isDemoMode()) return demoUpload();
    // 使用 fetch API 高效地将 data URL 转换为 Blob（比手动 atob 循环快得多）
    let blob: Blob;
    try {
      const response = await fetch(base64Data);
      blob = await response.blob();
    } catch {
      // fallback: 手动转换
      const base64 = base64Data.split(',')[1] || base64Data;
      const mimeMatch = base64Data.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      blob = new Blob([ab], { type: mimeType });
    }

    // 构建 FormData
    const formData = new FormData();
    const ext = blob.type.split('/')[1] || 'jpg';
    formData.append('file', blob, `image_${Date.now()}.${ext}`);
    formData.append('type', type);

    // 发送请求（不设置 Content-Type，让浏览器自动设置 multipart/form-data）
    const headers: Record<string, string> = {};
    const authToken = getToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${getApiBasePath()}/upload/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || '上传失败');
    }

    return data.data;
  },

  // 批量上传图片
  uploadImages: async (base64DataArray: string[], type: 'clothes' | 'avatar' | 'model' = 'clothes'): Promise<{ files: Array<{ url: string; path: string }>; count: number }> => {
    if (isDemoMode()) {
      const result = await demoUpload();
      return { files: base64DataArray.map(() => result), count: base64DataArray.length };
    }
    const formData = new FormData();
    
    for (let i = 0; i < base64DataArray.length; i++) {
      const base64Data = base64DataArray[i];
      const base64 = base64Data.split(',')[1] || base64Data;
      const mimeMatch = base64Data.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let j = 0; j < byteCharacters.length; j++) {
        byteNumbers[j] = byteCharacters.charCodeAt(j);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      const ext = mimeType.split('/')[1] || 'jpg';
      formData.append('files', blob, `image_${Date.now()}_${i}.${ext}`);
    }
    
    formData.append('type', type);

    const headers: Record<string, string> = {};
    const authToken = getToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${getApiBasePath()}/upload/images`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || '上传失败');
    }

    return data.data;
  },
};
