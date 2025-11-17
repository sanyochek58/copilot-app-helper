// src/services/api.ts
import axios from 'axios';

// ===== БАЗОВЫЕ КЛИЕНТЫ =====
// Для auth-service: /api/auth/... и /api/business/...
const AUTH_API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_SERVICE_URL || '/api',
});

// Для ai-service: /api/chat
const AI_API = axios.create({
  baseURL: import.meta.env.VITE_AI_SERVICE_URL || '/api',
});

// Интерцепторы — добавляем токен из localStorage
AUTH_API.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

AI_API.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// === ТИПЫ ПОД БИЗНЕС-КОНТЕКСТ ===
export type BusinessEmployeeDTO = {
  name: string;
  email: string;
  position: string;
};

export type BusinessContextResponse = {
  businessId: string;
  businessName: string;
  area: string;
  ownerName: string;
  profit: string;
  employees: BusinessEmployeeDTO[];
};

// === ТИПЫ ДЛЯ AI-ЧАТА ===
export type ChatRequestDTO = {
  message: string;
  mode?: string;
};

export type ChatResponseDTO = {
  reply: string;
};

// === API-ОБЁРТКИ ===
// Бэкенд-авторизация: @RequestMapping("/api/auth")
// и бизнес-контекст: @GetMapping("/api/business/{id}")
export const authAPI = {
  registerCompany: (data: any) =>
    AUTH_API.post('/auth/register-company', data),

  login: (data: any) =>
    AUTH_API.post('/auth/login', data),

  getBusinessInfo: (businessId: string) =>
    AUTH_API.get<BusinessContextResponse>(`/business/${businessId}`),
};

// AI сервис: @RequestMapping("/api") + @PostMapping("/chat")
export const aiAPI = {
  chat: (data: ChatRequestDTO) =>
    AI_API.post<ChatResponseDTO>('/chat', data),
};
