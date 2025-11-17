import React, { useState } from 'react';
import { useAppContext, type Company } from '../../context/AppContext';

type Props = {
  onNext: () => void;
};

const innRegex = /^\d{10}(\d{2})?$/; // 10 или 12 цифр

const CompanyStep: React.FC<Props> = ({ onNext }) => {
  const { addCompany } = useAppContext();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [inn, setInn] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  const isInnValid = innRegex.test(inn);
  const isValid = name.trim() && industry.trim() && isInnValid;

  const handleNext = () => {
    setTouched(true);
    if (!isValid) return;

    const company: Company = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      name,
      industry,
      inn,
      description,
      employees: [],
      vacations: [],
    };

    addCompany(company);
    onNext();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Добавить компанию</h2>
        <p className="card-subtitle">Шаг 2 из 3 — данные компании</p>
      </div>

      <div className="card-body">

        {/* Название компании */}
        <div className="form-group">
          <label>Название компании</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ООО «Ромашка»"
          />
          {touched && !name && (
            <span className="field-error">Введите название компании</span>
          )}
        </div>

        {/* Сфера деятельности */}
        <div className="form-group">
          <label>Сфера деятельности</label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Розничная торговля, услуги и т.п."
          />
          {touched && !industry && (
            <span className="field-error">Укажите сферу деятельности</span>
          )}
        </div>

        {/* ИНН */}
        <div className="form-group">
          <label>ИНН</label>
          <input
            type="text"
            value={inn}
            onChange={(e) => setInn(e.target.value)}
            placeholder="1234567890"
          />
          {touched && !isInnValid && (
            <span className="field-error">
              ИНН должен содержать 10 или 12 цифр
            </span>
          )}
        </div>

        {/* Описание */}
        <div className="form-group">
          <label>Описание (необязательно)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Кратко опишите бизнес..."
            rows={3}
          />
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

export default CompanyStep;
