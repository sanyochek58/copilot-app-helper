// src/pages/Companies/CompanyDetailPage.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useAppContext,
  type Company,
  type Employee,
} from '../../context/AppContext';
import plusIcon from '../../assets/plus.png';
import crossIcon from '../../assets/cross.png';

const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companies, setCompanies, addCompany } = useAppContext();

  const isNew = id === 'new';
  const existingCompany = !isNew
    ? companies.find((c) => c.id === id)
    : undefined;

  useEffect(() => {
    if (!isNew && !existingCompany) {
      navigate('/companies', { replace: true });
    }
  }, [isNew, existingCompany, navigate]);

  const [form, setForm] = useState<Company>(() => {
    if (existingCompany) return existingCompany;
    return {
      id: '',
      name: '',
      industry: '',
      inn: '',
      description: '',
      employees: [],
      vacations: [], // поле оставляем в модели, но UI для него больше нет
    };
  });

  const [touched, setTouched] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ref для скрытого инпута сотрудников (CSV)
  const employeeFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChangeField = (
    field: keyof Omit<Company, 'id' | 'employees' | 'vacations'>,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ===== сотрудники =====

  const handleEmployeeChange = (
    empId: string,
    field: keyof Omit<Employee, 'id'>,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === empId ? { ...e, [field]: value } : e,
      ),
    }));
  };

  const handleAddEmployee = () => {
    const newEmp: Employee = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      fullName: '',
      phone: '', // поле есть в типе, но не выводим в таблицу
      email: '',
      position: '',
    };
    setForm((prev) => ({
      ...prev,
      employees: [...prev.employees, newEmp],
    }));
  };

  const handleRemoveEmployee = (empId: string) => {
    setForm((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== empId),
    }));
  };

  const handleImportEmployeesClick = () => {
    employeeFileInputRef.current?.click();
  };

  const handleEmployeesFileChange: React.ChangeEventHandler<HTMLInputElement> =
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        const parsed = parseEmployeesCsv(text);
        if (!parsed.length) return;

        setForm((prev) => ({
          ...prev,
          employees: [
            ...prev.employees,
            ...parsed.map((row) => ({
              id: crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString() + Math.random(),
              fullName: row.fullName ?? '',
              phone: '', // телефон не импортируем / не показываем
              email: row.email ?? '',
              position: row.position ?? '',
            })),
          ],
        }));
      };
      reader.readAsText(file, 'utf-8');
      e.target.value = '';
    };

  // ===== сохранение / отмена / удаление =====

  const isValid =
    form.name.trim() && form.industry.trim() && form.inn.trim();

  const handleSave = () => {
    setTouched(true);
    if (!isValid) return;

    if (isNew) {
      const newCompany: Company = {
        ...form,
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      };
      addCompany(newCompany);
      navigate(`/companies/${newCompany.id}`, { replace: true });
    } else {
      const updated = companies.map((c) =>
        c.id === form.id ? form : c,
      );
      setCompanies(updated);
      navigate('/companies');
    }
  };

  const handleCancel = () => {
    navigate('/companies');
  };

  const handleDeleteConfirmed = () => {
    if (!form.id) return;
    const updated = companies.filter((c) => c.id !== form.id);
    setCompanies(updated);
    setShowDeleteConfirm(false);
    navigate('/companies');
  };

  if (!isNew && !existingCompany) {
    return null;
  }

  return (
    <>
      <div className="company-detail">
        <h2 className="company-detail__title">
          {isNew ? 'Новая компания' : form.name || 'Карточка компании'}
        </h2>

        <div className="card company-detail__card">
          <div className="card-body">
            <div className="form-group">
              <label>Название компании</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChangeField('name', e.target.value)}
                placeholder="ООО «Ромашка»"
              />
              {touched && !form.name && (
                <span className="field-error">
                  Введите название компании
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Сфера деятельности</label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) =>
                  handleChangeField('industry', e.target.value)
                }
                placeholder="Розничная торговля, услуги..."
              />
              {touched && !form.industry && (
                <span className="field-error">
                  Укажите сферу деятельности
                </span>
              )}
            </div>

            <div className="form-group">
              <label>ИНН</label>
              <input
                type="text"
                value={form.inn}
                onChange={(e) => handleChangeField('inn', e.target.value)}
                placeholder="1234567890"
              />
              {touched && !form.inn && (
                <span className="field-error">Введите ИНН</span>
              )}
            </div>

            <div className="form-group">
              <label>Описание (необязательно)</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  handleChangeField('description', e.target.value)
                }
                placeholder="Кратко опишите бизнес, чем занимаетесь..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* ===== Сотрудники (без телефона) ===== */}
        <div className="company-section company-section--employees">
          <div className="company-section__header">
            <h3 className="company-section__title">Сотрудники</h3>
            <div className="company-section__buttons">
              <button
                type="button"
                className="secondary-button"
                onClick={handleAddEmployee}
              >
                <img src={plusIcon} className="icon" alt="plus" />{' '}
                Добавить сотрудника
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleImportEmployeesClick}
              >
                Импорт CSV
              </button>
            </div>
          </div>

          <div className="table-wrapper company-table-wrapper">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Почта</th>
                  <th>Должность</th>
                  <th style={{ width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {form.employees.length === 0 ? (
                  <tr className="table-placeholder-row">
                    <td colSpan={4}>Сотрудники не добавлены.</td>
                  </tr>
                ) : (
                  form.employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <input
                          type="text"
                          value={emp.fullName}
                          onChange={(e) =>
                            handleEmployeeChange(
                              emp.id,
                              'fullName',
                              e.target.value,
                            )
                          }
                          placeholder="Иванов Иван"
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          value={emp.email}
                          onChange={(e) =>
                            handleEmployeeChange(
                              emp.id,
                              'email',
                              e.target.value,
                            )
                          }
                          placeholder="user@mail.ru"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={emp.position}
                          onChange={(e) =>
                            handleEmployeeChange(
                              emp.id,
                              'position',
                              e.target.value,
                            )
                          }
                          placeholder="Менеджер"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          onClick={() => handleRemoveEmployee(emp.id)}
                          aria-label="Удалить сотрудника"
                        >
                          <img
                            src={crossIcon}
                            className="icon"
                            alt="delete"
                          />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="csv-hint">
            Импорт сотрудников из CSV с колонками:
            <code> fullName,email,position</code>
          </p>
        </div>

        {/* футер карточки компании */}
        <div className="company-detail__footer">
          {!isNew && (
            <button
              type="button"
              className="secondary-button company-delete-button"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Удалить компанию
            </button>
          )}

          <div className="company-detail__footer-right">
            <button
              type="button"
              className="secondary-button"
              onClick={handleCancel}
            >
              Отмена
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleSave}
              disabled={!isValid}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>

      {/* скрытый инпут для CSV сотрудников */}
      <input
        ref={employeeFileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleEmployeesFileChange}
      />

      {/* поп-ап удаления компании */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Удалить компанию?</h3>
            <p>
              Компания <b>{form.name || 'без названия'}</b> и связанные с ней
              данные будут удалены из приложения.
            </p>
            <div className="modal__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="primary-button modal__delete-button"
                onClick={handleDeleteConfirmed}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyDetailPage;

/* ===== CSV helpers (только fullName, email, position) ===== */

function detectDelimiter(line: string): string {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

function parseEmployeesCsv(text: string): Array<{
  fullName?: string;
  email?: string;
  position?: string;
}> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];

  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(firstLine);

  const header = firstLine
    .split(delimiter)
    .map((h) => h.trim().toLowerCase());

  const idx = {
    fullName: header.indexOf('fullname'),
    email: header.indexOf('email'),
    position: header.indexOf('position'),
  };

  return lines.slice(1).map((line) => {
    const cols = line.split(delimiter).map((c) => c.trim());
    return {
      fullName: idx.fullName >= 0 ? cols[idx.fullName] : undefined,
      email: idx.email >= 0 ? cols[idx.email] : undefined,
      position: idx.position >= 0 ? cols[idx.position] : undefined,
    };
  });
}
