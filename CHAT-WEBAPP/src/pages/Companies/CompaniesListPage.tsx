import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import plusIcon from '../../assets/plus.png';

const CompaniesListPage: React.FC = () => {
  const { companies } = useAppContext();
  const navigate = useNavigate();

  const handleOpenCompany = (id: string) => {
    navigate(`/companies/${id}`);
  };

  const handleAddCompany = () => {
    navigate('/companies/new');
  };

  return (
    <div className="companies-page">
      <div className="companies-header">
        <h2 className="companies-title">Мои компании</h2>
        <button
          type="button"
          className="primary-button companies-add-button"
          onClick={handleAddCompany}
        >
          <img src={plusIcon} className="icon" alt="plus" /> Добавить компанию
        </button>
      </div>

      {companies.length === 0 ? (
        <p className="companies-empty">
          У вас пока нет компаний. Нажмите «Добавить компанию», чтобы создать
          первую.
        </p>
      ) : (
        <div className="companies-list">
          {companies.map((c) => (
            <button
              key={c.id}
              type="button"
              className="company-card"
              onClick={() => handleOpenCompany(c.id)}
            >
              <div className="company-card__title">{c.name}</div>
              <div className="company-card__subtitle">{c.industry}</div>
              <div className="company-card__meta">
                <span>ИНН: {c.inn || '—'}</span>
                <span>
                  Сотрудников: {c.employees?.length ?? 0}
                  {c.vacations?.length
                    ? ` • отпусков: ${c.vacations.length}`
                    : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompaniesListPage;
