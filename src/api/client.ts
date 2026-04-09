// API 客户端 - 请求封装、Token 管理
import { isDemoMode, demoRequest, demoUpload } from '../mock/demoApi';

const API_BASE_WITH_PATH = '/api';

// Token 管理
let authToken: string | null = localStorage.getItem('auth_token');

export const setToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getToken = () => authToken;

const DEFAULT_TIMEOUT_MS = 15000;
/** 登录/验证码等认证请求使用更长超时（后端冷启动或 DB 可能较慢） */
export const AUTH_TIMEOUT_MS = 30000;
/** 试衣/AI 推荐等重计算请求（需上传多张图到 OSS + 调用百炼 API） */
export const AI_TIMEOUT_MS = 120000;

// 用 XMLHttpRequest 发送请求（绕过 fetch 在部分 Windows 环境下 POST 挂起的问题）
const xhrRequest = (method: string, url: string, body?: string, headers?: Record<string, string>, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<{ status: number; body: string }> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.timeout = timeoutMs;
    if (headers) {
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    }
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText });
    xhr.onerror = () => reject(new Error('网络异常，请检查连接后重试'));
    xhr.ontimeout = () => reject(new Error('请求超时，请确认后端服务已启动（端口 3001）后重试'));
    xhr.send(body ?? null);
  });
};

// 支持自定义超时：options 中可传 timeout?: number（毫秒）
type RequestOptions = RequestInit & { timeout?: number };

// 请求封装
export const request = async (endpoint: string, options: RequestOptions = {}) => {
  if (isDemoMode()) {
    return demoRequest(endpoint, options);
  }

  const { timeout: timeoutMs = DEFAULT_TIMEOUT_MS, ...initOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((initOptions.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const method = (initOptions.method || 'GET').toUpperCase();
  const url = `${API_BASE_WITH_PATH}${endpoint}`;

  let status: number;
  let rawBody: string;

  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
    const result = await xhrRequest(method, url, initOptions.body as string | undefined, headers, timeoutMs);
    status = result.status;
    rawBody = result.body;
  } else {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...initOptions, headers, signal: controller.signal });
      status = response.status;
      rawBody = await response.text();
    } catch (error: any) {
      if (error?.name === 'AbortError') throw new Error('请求超时，请确认后端服务已启动（端口 3001）后重试');
      throw new Error('网络异常，请检查连接后重试');
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  let data: any;
  try {
    data = JSON.parse(rawBody);
  } catch {
    if (status >= 400) {
      throw new Error(status === 401 ? '请先登录' : `请求失败(${status})`);
    }
    throw new Error('请求失败');
  }

  if (status >= 400) {
    throw new Error(data.message || (status === 401 ? '请先登录' : '请求失败'));
  }

  return data;
};

// 检查是否已登录
export const isLoggedIn = () => !!authToken;

// 获取 API 基础路径
export const getApiBasePath = () => API_BASE_WITH_PATH;
