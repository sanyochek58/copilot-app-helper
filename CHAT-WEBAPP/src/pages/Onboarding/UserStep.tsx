import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

type Props = {
  onNext: () => void;
};

const fullNameRegex = /^[A-Za-zА-Яа-яЁё\s-]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(\+7|8)\d{10}$/;

const UserStep: React.FC<Props> = ({ onNext }) => {
  const { user, setUser } = useAppContext();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [touched, setTouched] = useState(false);

  // Попытка взять имя из Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const tgUser = tg?.initDataUnsafe?.user;
    if (tgUser && !user) {
      if (!fullName) {
        setFullName(
          [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
        );
      }
    }
  }, []);

  const isFullNameValid = fullNameRegex.test(fullName);
  const isEmailValid = emailRegex.test(email);
  const isPhoneValid = phoneRegex.test(phone);

  const isValid = isFullNameValid && isEmailValid && isPhoneValid;

  const handleNext = () => {
    setTouched(true);
    if (!isValid) return;

    setUser({ fullName, email, phone });
    onNext();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Авторизация</h2>
        <p className="card-subtitle">Шаг 1 из 3 — данные пользователя</p>
      </div>

      <div className="card-body">

        {/* ФИО */}
        <div className="form-group">
          <label>ФИО</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Иванов Иван Иванович"
          />
          {touched && !isFullNameValid && (
            <span className="field-error">
              ФИО может содержать только буквы, пробелы и дефисы
            </span>
          )}
        </div>

        {/* Почта */}
        <div className="form-group">
          <label>Почта</label>
          <input
            type="email"
            value={email}
            inputMode="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.ru"
          />
          {touched && !isEmailValid && (
            <span className="field-error">Введите корректный email</span>
          )}
        </div>

        {/* Телефон */}
        <div className="form-group">
          <label>Телефон</label>
          <input
            type="tel"
            value={phone}
            inputMode="tel"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+79991234567"
          />
          {touched && !isPhoneValid && (
            <span className="field-error">
              Телефон должен быть формата +7XXXXXXXXXX
            </span>
          )}
        </div>

      </div>

      <div className="card-footer">
        <button
          className="primary-button"
          onClick={handleNext}
          disabled={!isValid}
        >
          Далее
        </button>
      </div>
    </div>
  );
};

export default UserStep;
