import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useAppContext,
  type CalendarEvent,
} from '../../context/AppContext';
import plusIcon from '../../assets/plus.png';

type CalendarEventWithMeta = CalendarEvent & {
  _source?: 'manual' | 'vacation';
};

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0–23

const dayNamesShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const formatMonthYear = (date: Date) =>
  date.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

const toISO = (d: Date) => d.toISOString();

const parseICalDate = (value: string): Date | null => {
  const v = value.replace('Z', '');
  const m = v.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?$/,
  );
  if (!m) return null;
  const [_, y, mo, d, hh = '0', mm = '0', ss = '0'] = m;
  return new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
  );
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0=Пн ... 6=Вс
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isSameDateStringDay = (iso: string, date: Date) =>
  isSameDay(new Date(iso), date);

const CalendarPage: React.FC = () => {
  const {
    calendarEvents,
    setCalendarEvents,
    addCalendarEvent,
    companies,
  } = useAppContext();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newDescription, setNewDescription] = useState('');

  const [activeEvent, setActiveEvent] = useState<CalendarEventWithMeta | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const weekGridRef = useRef<HTMLDivElement | null>(null);

  //События из отпусков
  const vacationEvents: CalendarEventWithMeta[] = useMemo(() => {
    const result: CalendarEventWithMeta[] = [];

    companies.forEach((company) => {
      company.vacations.forEach((vac) => {
        if (!vac.startDate || !vac.endDate) return;

        const startDate = new Date(vac.startDate);
        const endDate = new Date(vac.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const oneDayStart = new Date(d);
          oneDayStart.setHours(7, 0, 0, 0);

          const oneDayEnd = new Date(d);
          oneDayEnd.setHours(8, 0, 0, 0);

          result.push({
            id: `vac-${company.id}-${vac.id}-${oneDayStart
              .toISOString()
              .slice(0, 10)}`,
            title: 'Отпуск',
            start: oneDayStart.toISOString(),
            end: oneDayEnd.toISOString(),
            description:
              `Сотрудник: ${vac.employeeName || 'Не указан'}` +
              `\nПериод: ${vac.startDate} – ${vac.endDate}` +
              `\nКомпания: ${company.name}`,
            _source: 'vacation',
          });
        }
      });
    });

    return result;
  }, [companies]);

  const manualEventsWithMeta: CalendarEventWithMeta[] = useMemo(
    () => calendarEvents.map((ev) => ({ ...ev, _source: 'manual' })),
    [calendarEvents],
  );

  const allEvents: CalendarEventWithMeta[] = useMemo(
    () => [...manualEventsWithMeta, ...vacationEvents],
    [manualEventsWithMeta, vacationEvents],
  );

  //Месяц

  const daysOfMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    const days: Date[] = [];
    for (let d = first.getDate(); d <= last.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [currentMonth]);

  // точки под днями
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventWithMeta[]>();
    allEvents.forEach((ev) => {
      const key = new Date(ev.start).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return map;
  }, [allEvents]);

  const selectedWeek = useMemo(() => {
    if (!selectedDate) return null;
    const start = getStartOfWeek(selectedDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return { start, days };
  }, [selectedDate]);

  const eventsForWeek = useMemo(() => {
    if (!selectedWeek) return [];
    const { start } = selectedWeek;
    const end = addDays(start, 7);
    return allEvents.filter((ev) => {
      const s = new Date(ev.start);
      return s >= start && s < end;
    });
  }, [allEvents, selectedWeek]);

  useEffect(() => {
    if (!selectedWeek || !weekGridRef.current) return;
    const slot = weekGridRef.current.querySelector(
      '.calendar-week__slot-cell',
    ) as HTMLElement | null;

    const slotHeight = slot?.offsetHeight ?? 32;
    weekGridRef.current.scrollTop = slotHeight * 7;
  }, [selectedWeek]);

  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
    setSelectedDate(null);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  //Создание нового события

  const openAddModal = () => {
    const date = selectedDate ?? new Date();
    const iso = date.toISOString().slice(0, 10);
    setNewTitle('');
    setNewDate(iso);
    setNewStartTime('09:00');
    setNewEndTime('10:00');
    setNewDescription('');
    setShowAddModal(true);
  };

  const handleAddEventSave = () => {
    if (!newTitle.trim() || !newDate || !newStartTime || !newEndTime) {
      return;
    }

    const [sh, sm] = newStartTime.split(':').map(Number);
    const [eh, em] = newEndTime.split(':').map(Number);

    const start = new Date(newDate);
    start.setHours(sh, sm, 0, 0);

    const end = new Date(newDate);
    end.setHours(eh, em, 0, 0);

    const ev: CalendarEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title: newTitle.trim(),
      start: toISO(start),
      end: toISO(end),
      description: newDescription.trim() || undefined,
    };

    addCalendarEvent(ev);
    setShowAddModal(false);
  };

  //Импорт .ics

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const imported = parseICS(text);
      if (imported.length) {
        setCalendarEvents((prev) => [...prev, ...imported]);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleEventClick = (ev: CalendarEventWithMeta) => {
    setActiveEvent(ev);
  };

  const handleDeleteActiveEvent = () => {
    if (!activeEvent) return;
    if (activeEvent._source === 'vacation') return;

    setCalendarEvents((prev) =>
      prev.filter((e) => e.id !== activeEvent.id),
    );
    setActiveEvent(null);
  };

  const isActiveVacation = activeEvent?._source === 'vacation';

  //Рендер

  return (
    <div className="page-container">
      <div className="calendar-page">
        <div className="calendar-header">
          <div className="calendar-header__left">
            <button
              type="button"
              className="secondary-button calendar-nav-button"
              onClick={handlePrevMonth}
            >
              ←
            </button>
            <h2 className="calendar-title">
              {formatMonthYear(currentMonth)}
            </h2>
            <button
              type="button"
              className="secondary-button calendar-nav-button"
              onClick={handleNextMonth}
            >
              →
            </button>
          </div>
          <div className="calendar-header__right">
            <button
              type="button"
              className="secondary-button"
              onClick={handleImportClick}
            >
              Импорт .ics
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={openAddModal}
            >
              <img src={plusIcon} className="icon" alt="plus" /> Добавить
            </button>
          </div>
        </div>

        {/* Месяц */}
        <div className="calendar-month">
          <div className="calendar-month__weekdays">
            {dayNamesShort.map((name) => (
              <div key={name} className="calendar-month__weekday">
                {name}
              </div>
            ))}
          </div>
          <div className="calendar-month__grid">
            {renderMonthGrid(
              daysOfMonth,
              eventsByDay,
              selectedDate,
              handleDayClick,
            )}
          </div>
        </div>

        {/* Неделя */}
        {selectedWeek && (
          <div className="calendar-week">
            <div className="calendar-week__header">
              <div className="calendar-week__time-spacer" />
              {selectedWeek.days.map((d, idx) => (
                <div key={idx} className="calendar-week__day-header">
                  <div className="calendar-week__day-name">
                    {dayNamesShort[idx]}
                  </div>
                  <div className="calendar-week__day-date">
                    {d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>

            <div className="calendar-week__grid" ref={weekGridRef}>
              <div className="calendar-week__time-column">
                {HOURS.map((h) => (
                  <div key={h} className="calendar-week__time-cell">
                    {h}:00
                  </div>
                ))}
              </div>

              {selectedWeek.days.map((day, dayIndex) => {
                const dayEvents = eventsForWeek.filter((ev) =>
                  isSameDateStringDay(ev.start, day),
                );
                return (
                  <div
                    key={dayIndex}
                    className="calendar-week__day-column"
                  >
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className="calendar-week__slot-cell"
                      />
                    ))}

                    {dayEvents.map((ev) => {
                      const s = new Date(ev.start);
                      const e = new Date(ev.end);
                      const startHour =
                        s.getHours() + s.getMinutes() / 60;
                      const endHour =
                        e.getHours() + e.getMinutes() / 60;
                      const totalHours =
                        HOURS[HOURS.length - 1] + 1 - HOURS[0]; // 24
                      const top =
                        ((startHour - HOURS[0]) / totalHours) * 100;
                      const height =
                        ((endHour - startHour) / totalHours) * 100;

                      const isVacation = ev._source === 'vacation';
                      const displayTitle = isVacation
                        ? 'Отпуск'
                        : ev.title;

                      return (
                        <div
                          key={ev.id}
                          className={
                            'calendar-event-block' +
                            (isVacation
                              ? ' calendar-event-block--vacation'
                              : '')
                          }
                          style={{ top: `${top}%`, height: `${height}%` }}
                          onClick={() => handleEventClick(ev)}
                        >
                          <div className="calendar-event-title">
                            {displayTitle}
                          </div>
                          {!isVacation && (
                            <div className="calendar-event-time">
                              {evTimeRange(ev)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* input для .ics */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ics,.ical"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Модалка добавления события */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Новое событие</h3>
            <div className="form-group">
              <label>Название</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Встреча, звонок..."
              />
            </div>
            <div className="form-group">
              <label>Дата</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Время начала</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Время окончания</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Комментарий (необязательно)</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="modal__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowAddModal(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleAddEventSave}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка просмотра/удаления события */}
      {activeEvent && (
        <div
          className="modal-overlay"
          onClick={() => setActiveEvent(null)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{isActiveVacation ? 'Отпуск' : activeEvent.title}</h3>

            {!isActiveVacation && (
              <p className="calendar-event-modal-time">
                {evTimeRange(activeEvent)}
              </p>
            )}

            {activeEvent.description && (
              <p
                className={
                  isActiveVacation
                    ? 'calendar-event-modal-description vacation-big'
                    : 'calendar-event-modal-description'
                }
              >
                {activeEvent.description}
              </p>
            )}
            {!activeEvent.description && (
              <p className="calendar-event-modal-description empty">
                Комментарий не указан.
              </p>
            )}

            {isActiveVacation && (
              <p className="calendar-event-modal-note">
                Это событие создано на основе графика отпусков.
                Чтобы изменить или удалить его, отредактируйте отпуск
                в карточке компании.
              </p>
            )}

            <div className="modal__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveEvent(null)}
              >
                Закрыть
              </button>
              {!isActiveVacation && (
                <button
                  type="button"
                  className="primary-button modal__delete-button"
                  onClick={handleDeleteActiveEvent}
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// отрисовка сетки месяца
function renderMonthGrid(
  daysOfMonth: Date[],
  eventsByDay: Map<string, CalendarEventWithMeta[]>,
  selectedDate: Date | null,
  onDayClick: (d: Date) => void,
) {
  if (daysOfMonth.length === 0) return null;
  const first = daysOfMonth[0];
  const firstWeekday = (first.getDay() + 6) % 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  cells.push(...daysOfMonth);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells.map((day, idx) => {
    if (!day) {
      return <div key={idx} className="calendar-month__cell empty" />;
    }
    const key = day.toDateString();
    const hasEvents = eventsByDay.has(key);
    const isSelected = selectedDate && isSameDay(selectedDate, day);
    return (
      <button
        key={idx}
        type="button"
        className={
          'calendar-month__cell day' + (isSelected ? ' selected' : '')
        }
        onClick={() => onDayClick(day)}
      >
        <span className="calendar-month__day-number">{day.getDate()}</span>
        {hasEvents && <span className="calendar-month__dot" />}
      </button>
    );
  });
}

// ICS parser (упрощённый)
function parseICS(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const blocks = text.split('BEGIN:VEVENT').slice(1);

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    let summary = '';
    let dtStart = '';
    let dtEnd = '';
    let description = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith('SUMMARY')) {
        const [, value] = line.split(':', 2);
        summary = value ?? '';
      } else if (line.startsWith('DTSTART')) {
        const [, value] = line.split(':', 2);
        dtStart = value ?? '';
      } else if (line.startsWith('DTEND')) {
        const [, value] = line.split(':', 2);
        dtEnd = value ?? '';
      } else if (line.startsWith('DESCRIPTION')) {
        const [, value] = line.split(':', 2);
        description = value ?? '';
      }
    }

    const startDate = parseICalDate(dtStart);
    const endDate = parseICalDate(dtEnd || dtStart);

    if (!startDate || !endDate) continue;

    events.push({
      id:
        crypto.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: summary || 'Событие',
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      description: description || undefined,
    });
  }

  return events;
}

function evTimeRange(ev: CalendarEvent): string {
  const s = new Date(ev.start);
  const e = new Date(ev.end);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes(),
    ).padStart(2, '0')}`;
  return `${fmt(s)}–${fmt(e)}`;
}

export default CalendarPage;
