// src/context/AppContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';

// === ТИПЫ ===

export type User = {
  fullName: string;
  email: string;
  phone: string;
};

export type Employee = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
};

export type Vacation = {
  id: string;
  employeeName: string;
  startDate: string;
  endDate: string;
};

export type Company = {
  id: string;
  name: string;
  industry: string;
  inn: string;
  description: string;
  employees: Employee[];
  vacations: Vacation[];
};

// Календарь
export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
};

// Чат
export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  isFavorite?: boolean;
};

export type ChatSession = {
  id: string;
  createdAt: string;
  messages: ChatMessage[];
};

// === КОНТЕКСТ ===

type AppContextType = {
  // пользователь / профиль
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (fields: Partial<User>) => void;
  resetApp: () => void;

  // компании
  companies: Company[];
  setCompanies: (companies: Company[]) => void;
  addCompany: (company: Company) => void;

  // календарь
  calendarEvents: CalendarEvent[];
  setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  addCalendarEvent: (event: CalendarEvent) => void;

  // чаты
  chatSessions: ChatSession[];
  setChatSessions: (sessions: ChatSession[]) => void;
  createChatSession: () => string;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  toggleFavoriteMessage: (sessionId: string, messageId: string) => void;

  // онбординг
  isOnboardingCompleted: boolean;
  setIsOnboardingCompleted: (value: boolean) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// простая генерация id без crypto/randomUUID
const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  // профиль
  const updateUser = (fields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  };

  const resetApp = () => {
    // ПОЛНЫЙ сброс приложения + выход из аккаунта
    localStorage.removeItem('auth_token');
    setUser(null);
    setCompanies([]);
    setCalendarEvents([]);
    setChatSessions([]);
    setIsOnboardingCompleted(false);
  };

  // компании
  const addCompany = (company: Company) => {
    setCompanies((prev) => [...prev, company]);
  };

  // календарь
  const addCalendarEvent = (event: CalendarEvent) => {
    setCalendarEvents((prev) => [...prev, event]);
  };

  // чаты
  const createChatSession = useCallback((): string => {
    const id = generateId();
    const newSession: ChatSession = {
      id,
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setChatSessions((prev) => [...prev, newSession]);
    return id;
  }, []);

  const addMessageToSession = useCallback(
    (sessionId: string, message: ChatMessage) => {
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, message] }
            : s,
        ),
      );
    },
    [],
  );

  const toggleFavoriteMessage = useCallback(
    (sessionId: string, messageId: string) => {
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === messageId
                    ? { ...m, isFavorite: !m.isFavorite }
                    : m,
                ),
              }
            : s,
        ),
      );
    },
    [],
  );

  const value: AppContextType = {
    user,
    setUser,
    updateUser,
    resetApp,
    companies,
    setCompanies,
    addCompany,
    calendarEvents,
    setCalendarEvents,
    addCalendarEvent,
    chatSessions,
    setChatSessions,
    createChatSession,
    addMessageToSession,
    toggleFavoriteMessage,
    isOnboardingCompleted,
    setIsOnboardingCompleted,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
};
