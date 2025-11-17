import React, { useState } from 'react';
import {
  useAppContext,
  type Employee,
  type Company,
} from '../../context/AppContext';

type Props = {
  onFinish: () => void;
};

type Mode = 'manual' | 'csv';

const EmployeesStep: React.FC<Props> = ({ onFinish }) => {
  const { companies, setCompanies } = useAppContext();
  const [mode, setMode] = useState<Mode>('manual');

  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      fullName: '',
      phone: '',
      email: '',
      position: '',
    },
  ]);

  const lastCompanyIndex = companies.length - 1;
  const lastCompany = companies[lastCompanyIndex];

  const handleChangeEmployee = (
    id: string,
    field: keyof Omit<Employee, 'id'>,
    value: string,
  ) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const handleAddRow = () => {
    setEmployees((prev) => [
      ...prev,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        fullName: '',
        phone: '',
        email: '',
        position: '',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseCsv(text);
      if (parsed.length) {
        setEmployees(
          parsed.map((row, index) => ({
            id:
              crypto.randomUUID?.() ??
              `${Date.now().toString()}-${index.toString()}`,
            fullName: row.fullName ?? '',
            phone: row.phone ?? '',
            email: row.email ?? '',
            position: row.position ?? '',
          })),
        );
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleFinish = () => {
    if (!lastCompany) {
      onFinish();
      return;
    }

    const cleanedEmployees = employees.filter(
      (e) => e.fullName.trim() || e.phone.trim() || e.email.trim(),
    );

    const updatedCompany: Company = {
      ...lastCompany,
      employees: cleanedEmployees,
    };

    const updatedCompanies = [...companies];
    updatedCompanies[lastCompanyIndex] = updatedCompany;
    setCompanies(updatedCompanies);

    onFinish();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Добавить сотрудников</h2>
        <p className="card-subtitle">
          Шаг 3 из 3 — список сотрудников (по желанию)
        </p>
      </div>

      <div className="card-body">
        <div className="tabs">
          <button
            type="button"
            className={`tab-button ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
          >
            Вручную
          </button>
          <button
            type="button"
            className={`tab-button ${mode === 'csv' ? 'active' : ''}`}
            onClick={() => setMode('csv')}
          >
            Импорт CSV
          </button>
        </div>

        {mode === 'manual' && (
          <>
            <p className="hint">
              Заполните таблицу сотрудников. Можно оставить пустой и продолжить.
            </p>

            <EmployeesTable
              employees={employees}
              onChange={handleChangeEmployee}
              onRemove={handleRemoveRow}
              showRemove
            />

            <button
              type="button"
              className="secondary-button"
              onClick={handleAddRow}
            >
              <img src="/src/assets/plus.png" className="icon" alt="plus" /> Добавить сотрудника
            </button>
          </>
        )}

        {mode === 'csv' && (
          <>
            <p className="hint">
              Загрузите CSV-файл с колонками:{' '}
              <code>fullName,phone,email,position</code>. Первый ряд — заголовки.
            </p>
            <input type="file" accept=".csv" onChange={handleFileChange} />

            {employees.length > 0 && (
              <>
                <p className="hint" style={{ marginTop: 10 }}>
                  Предпросмотр данных из файла. Можно отредактировать перед
                  сохранением.
                </p>
                <EmployeesTable
                  employees={employees}
                  onChange={handleChangeEmployee}
                  onRemove={handleRemoveRow}
                  showRemove
                />
              </>
            )}
          </>
        )}
      </div>

      <div className="card-footer">
        <button className="primary-button" onClick={handleFinish}>
          Завершить
        </button>
      </div>
    </div>
  );
};

export default EmployeesStep;

//компонент таблицы

type EmployeesTableProps = {
  employees: Employee[];
  onChange: (
    id: string,
    field: keyof Omit<Employee, 'id'>,
    value: string,
  ) => void;
  onRemove: (id: string) => void;
  showRemove?: boolean;
};

const EmployeesTable: React.FC<EmployeesTableProps> = ({
  employees,
  onChange,
  onRemove,
  showRemove = true,
}) => {
  return (
    <div className="table-wrapper">
      <table className="employees-table">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Телефон</th>
            <th>Почта</th>
            <th>Должность</th>
            {showRemove && <th style={{ width: 32 }}></th>}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>
                <input
                  type="text"
                  value={emp.fullName}
                  onChange={(e) =>
                    onChange(emp.id, 'fullName', e.target.value)
                  }
                  placeholder="Иванов Иван"
                />
              </td>
              <td>
                <input
                  type="tel"
                  value={emp.phone}
                  onChange={(e) => onChange(emp.id, 'phone', e.target.value)}
                  placeholder="+7 999 123-45-67"
                />
              </td>
              <td>
                <input
                  type="email"
                  value={emp.email}
                  onChange={(e) => onChange(emp.id, 'email', e.target.value)}
                  placeholder="user@mail.ru"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={emp.position}
                  onChange={(e) =>
                    onChange(emp.id, 'position', e.target.value)
                  }
                  placeholder="Менеджер"
                />
              </td>
              {showRemove && (
                <td>
                  <button
                    type="button"
                    className="icon-button icon-button--danger"
                    onClick={() => onRemove(emp.id)}
                    aria-label="Удалить сотрудника"
                    >
                    <img src="/src/assets/cross.png" className="icon" alt="delete" />
                </button>

                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// CSV-парсер

function parseCsv(text: string): Array<{
  fullName?: string;
  phone?: string;
  email?: string;
  position?: string;
}> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];

  const firstLine = lines[0].replace(/^\uFEFF/, '');

  const delimiter = detectDelimiter(firstLine);

  const headerRaw = firstLine.split(delimiter).map((h) => h.trim());
  const header = headerRaw.map((h) => h.toLowerCase());

  const idx = {
    fullName: header.indexOf('fullname'),
    phone: header.indexOf('phone'),
    email: header.indexOf('email'),
    position: header.indexOf('position'),
  };

  return lines.slice(1).map((line) => {
    const cols = line.split(delimiter).map((c) => c.trim());

    return {
      fullName: idx.fullName >= 0 ? cols[idx.fullName] : undefined,
      phone: idx.phone >= 0 ? cols[idx.phone] : undefined,
      email: idx.email >= 0 ? cols[idx.email] : undefined,
      position: idx.position >= 0 ? cols[idx.position] : undefined,
    };
  });
}

function detectDelimiter(line: string): string {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  if (semicolonCount > commaCount) return ';';
  return ',';
}

