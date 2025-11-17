import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const ProfilePage: React.FC = () => {
  const { user, updateUser, resetApp } = useAppContext();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [touched, setTouched] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName ?? '');
    setTouched(false);
  }, [user?.fullName]);

  const initialFullName = user?.fullName ?? '';
  const isDirty = fullName !== initialFullName;
  const isValid = fullName.trim().length > 0;

  const handleSave = () => {
    setTouched(true);
    if (!isValid) return;
    updateUser({ fullName: fullName.trim() });
  };

  const handleReset = () => {
    setFullName(initialFullName);
    setTouched(false);
  };

  const confirmReset = () => {
    // полный logout
    localStorage.removeItem('auth_token');
    resetApp();
    window.location.href = '/'; // App → ProtectedRoutes → AuthPage
  };

  return (
    <div className="page-container">
      <div className="profile-page">
        <div className="card profile-card">
          <div className="card-header">
            <h2>Профиль</h2>
            <p className="card-subtitle">
              Ваши данные в сервисе Chat для бизнеса
            </p>
          </div>

          <div className="card-body">
            {/* ФИО */}
            <div className="form-group">
              <label>ФИО</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (!touched) setTouched(true);
                }}
                placeholder="Иванов Иван Иванович"
              />
              {touched && !isValid && (
                <span className="field-error">Введите ФИО</span>
              )}
            </div>

            {/* Почта */}
            <div className="form-group">
              <label>Почта</label>
              <div className="profile-readonly">
                <span className="profile-readonly-value">
                  {user?.email || 'Не указано'}
                </span>
              </div>
            </div>

            <p className="profile-hint">
              Почта и телефон указываются при регистрации и не изменяются
              через приложение.
            </p>
          </div>

          {/* кнопки сохранить/отмена */}
          <div className="card-footer profile-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={handleReset}
              disabled={!isDirty}
            >
              Отмена
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleSave}
              disabled={!isDirty || !isValid}
            >
              Сохранить
            </button>
          </div>

          {/* сброс профиля (logout) */}
          <button
            type="button"
            className="danger-button profile-reset-button"
            onClick={() => setShowResetConfirm(true)}
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Модалка подтверждения сброса */}
      {showResetConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Сбросить профиль?</h3>
            <p>
              Все данные будут удалены: профиль, компании, сотрудники,
              история чатов. Вы вернётесь на экран авторизации.
            </p>

            <div className="modal__actions">
              <button
                className="secondary-button"
                onClick={() => setShowResetConfirm(false)}
              >
                Отмена
              </button>
              <button
                className="primary-button modal__delete-button"
                onClick={confirmReset}
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
