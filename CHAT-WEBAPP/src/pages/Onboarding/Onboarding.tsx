import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import UserStep from './UserStep';
import CompanyStep from './CompanyStep';
import EmployeesStep from './EmployeesStep';
import { useAppContext } from '../../context/AppContext';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { setIsOnboardingCompleted } = useAppContext();

  const handleUserCompleted = () => {
    navigate('/onboarding/company');
  };

  const handleCompanyCompleted = () => {
    navigate('/onboarding/employees');
  };

  const handleEmployeesCompleted = () => {
    setIsOnboardingCompleted(true);
    navigate('/'); // на экран чата
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/onboarding/user" replace />} />
      <Route path="/user" element={<UserStep onNext={handleUserCompleted} />} />
      <Route
        path="/company"
        element={<CompanyStep onNext={handleCompanyCompleted} />}
      />
      <Route
        path="/employees"
        element={<EmployeesStep onFinish={handleEmployeesCompleted} />}
      />
    </Routes>
  );
};

export default Onboarding;
