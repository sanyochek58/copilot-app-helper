import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider, useAppContext, type Company } from './context/AppContext';
import MainLayout from './components/MainLayout';
import ChatPage from './pages/Chat/ChatPage';
import ProfilePage from './pages/Profile/ProfilePage';
import CompaniesListPage from './pages/Companies/CompaniesListPage';
import CompanyDetailPage from './pages/Companies/CompanyDetailPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import FavoritesPage from './pages/Favorites/FavoritesPage';
import Onboarding from './pages/Onboarding/Onboarding';
import { AuthPage } from './pages/Auth/AuthPage';
import { authAPI, type BusinessEmployeeDTO } from './services/api'; // 👈 добавили тип
import { decodeJwt } from './utils/jwt';

// ===== Защищённые маршруты =====
const ProtectedRoutes: React.FC = () => {
  const {
    user,
    setUser,
    setCompanies,
    isOnboardingCompleted,
    setIsOnboardingCompleted,
  } = useAppContext();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const tg = (window as any).Telegram?.WebApp;

      try {
        const token = localStorage.getItem('auth_token');

        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        const decoded = decodeJwt(token);
        const businessId = decoded?.businessId;

        if (!decoded || !businessId) {
          console.warn('Invalid or empty JWT, clearing auth_token');
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
          return;
        }

        try {
          const res = await authAPI.getBusinessInfo(businessId);
          const data = res.data;

          const company: Company = {
            id: data.businessId,
            name: data.businessName,
            industry: data.area,
            inn: '',
            description: '',
            employees: data.employees.map(
              (e: BusinessEmployeeDTO, index: number) => ({
                id:
                  crypto.randomUUID?.() ??
                  `${Date.now()}-${index.toString()}`,
                fullName: e.name,
                email: e.email,
                phone: '',
                position: e.position,
              }),
            ),
            vacations: [],
          };

          setCompanies([company]);

          setUser({
            fullName: data.ownerName,
            email: decoded.sub ?? '',
            phone: '',
          });

          setIsOnboardingCompleted(true);
          setIsAuthenticated(true);
        } catch (err: any) {
          console.error('Failed to load business context', err);

          const status = err?.response?.status as number | undefined;
          if (status === 401 || status === 403) {
            localStorage.removeItem('auth_token');
          }

          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);

        if (tg) {
          tg.ready();
          tg.expand();
        }
      }
    };

    void init();
  }, [setCompanies, setIsOnboardingCompleted, setUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (!isOnboardingCompleted && user) {
    return <Onboarding />;
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<ChatPage />} />
        <Route path="chat/:id?" element={<ChatPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="companies" element={<CompaniesListPage />} />
        <Route path="companies/:id" element={<CompanyDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
      </Route>

      <Route path="/onboarding/*" element={<Onboarding />} />
    </Routes>
  );
};

// ===== Главный компонент приложения =====
function App() {
  return (
    <AppProvider>
      <ProtectedRoutes />
    </AppProvider>
  );
}

export default App;
