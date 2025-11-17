// src/pages/Auth/AuthPage.tsx

import React, { useState } from 'react';
import { authAPI } from '../../services/api';

type EmployeeForm = {
  name: string;
  email: string;
  position: string;
};

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
  });

  const [employees, setEmployees] = useState<EmployeeForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const addEmployeeRow = () => {
    setEmployees((prev) => [
      ...prev,
      { name: '', email: '', position: '' },
    ]);
  };

  const updateEmployeeRow = (
    index: number,
    field: keyof EmployeeForm,
    value: string,
  ) => {
    setEmployees((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    );
  };

  const removeEmployeeRow = (index: number) => {
    setEmployees((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorText(null);

    try {
      let response;

      if (isLogin) {
        // ВХОД
        response = await authAPI.login({
          email: form.email,
          password: form.password,
        });
      } else {
        // РЕГИСТРАЦИЯ КОМПАНИИ + СОТРУДНИКИ
        const employeesPayload = employees
          .filter(
            (e) =>
              e.name.trim() &&
              e.email.trim() &&
              e.position.trim(),
          )
          .map((e) => ({
            name: e.name,
            email: e.email,
            position: e.position,
          }));

        response = await authAPI.registerCompany({
          ownerEmail: form.email,
          ownerPassword: form.password,
          ownerName: form.name,
          companyName: form.companyName,
          area: 'Business',
          profit: 0,
          employees: employeesPayload,
        });
      }

      const token = response.data.token;
      localStorage.setItem('auth_token', token);

      // перезагружаем приложение – ProtectedRoutes подхватит токен
      window.location.href = '/';
    } catch (error: any) {
      console.error('Auth error:', error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        null;

      setErrorText(
        backendMessage ??
          'Не удалось выполнить запрос. Проверьте данные и попробуйте ещё раз.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsLogin((prev) => !prev);
    setErrorText(null);
    setEmployees([]);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? 'Вход' : 'Регистрация компании'}
        </h2>

        <p className="auth-subtitle">
          {isLogin
            ? 'Войдите, чтобы продолжить работу с вашим бизнесом.'
            : 'Создадим владельца, компанию и при необходимости сотрудников.'}
        </p>

        {errorText && <div className="auth-error">{errorText}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Ваше имя</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Иван Иванов"
                  required
                />
              </div>

              <div className="form-group">
                <label>Название компании</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      companyName: e.target.value,
                    })
                  }
                  placeholder="ООО «Ромашка»"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="you@mail.ru"
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              placeholder="••••••••"
              required
            />
          </div>

          {/* Блок сотрудников только в режиме регистрации */}
          {!isLogin && (
            <div className="auth-employees-section">
              <h3 className="auth-employees-title">
                Сотрудники (опционально)
              </h3>
              <p className="auth-employees-subtitle">
                Можно сразу добавить ключевых сотрудников. Остальных –
                через раздел «Мои компании» после входа.
              </p>

              {employees.map((emp, index) => (
                <div key={index} className="auth-employee-row">
                  <input
                    type="text"
                    placeholder="ФИО"
                    value={emp.name}
                    onChange={(e) =>
                      updateEmployeeRow(index, 'name', e.target.value)
                    }
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={emp.email}
                    onChange={(e) =>
                      updateEmployeeRow(
                        index,
                        'email',
                        e.target.value,
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="Должность"
                    value={emp.position}
                    onChange={(e) =>
                      updateEmployeeRow(
                        index,
                        'position',
                        e.target.value,
                      )
                    }
                  />
                  <button
                    type="button"
                    className="icon-button icon-button--danger"
                    onClick={() => removeEmployeeRow(index)}
                    aria-label="Удалить сотрудника"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="secondary-button"
                onClick={addEmployeeRow}
              >
                + Добавить сотрудника
              </button>
            </div>
          )}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Отправляем...'
              : isLogin
              ? 'Войти'
              : 'Зарегистрироваться'}
          </button>
        </form>

        <button
          type="button"
          className="secondary-button auth-switch"
          onClick={handleSwitchMode}
        >
          {isLogin
            ? 'Нет аккаунта? Зарегистрироваться'
            : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
};
