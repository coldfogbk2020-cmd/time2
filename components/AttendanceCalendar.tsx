import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckSquare, Square, X } from 'lucide-react';
import { AttendanceRecord, Schedule, Employee } from '../types';
import Spinner from './ui/Spinner';

interface AttendanceCalendarProps {
  attendance: AttendanceRecord[];
  schedules: Schedule;
  employees: Employee[];
  onUpdateSchedule: (date: Date, employeeIds: string[]) => Promise<void>;
}

const toLocalDateISOString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ScheduleModal: React.FC<{
    isOpen: boolean;
    date: Date | null;
    employees: Employee[];
    initialSelectedIds: Set<string>;
    onClose: () => void;
    onSave: (selectedIds: string[]) => Promise<void>;
}> = ({ isOpen, date, employees, initialSelectedIds, onClose, onSave }) => {
    const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen || !date) return null;

    const handleToggle = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(Array.from(selectedIds));
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="relative w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                    <X size={24} />
                </button>
                <h3 className="text-xl font-semibold mb-4">Планирование смены</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {date.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                    {employees.map(emp => (
                        <label key={emp.id} className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={selectedIds.has(emp.id)}
                                onChange={() => handleToggle(emp.id)}
                            />
                            {selectedIds.has(emp.id) ? <CheckSquare size={20} className="text-indigo-600 dark:text-indigo-400" /> : <Square size={20} className="text-gray-400 dark:text-gray-500" />}
                            <span className="ml-3 text-lg">{emp.name}</span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Отмена</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center w-28 disabled:bg-gray-400">
                        {isSaving ? <Spinner /> : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ attendance, schedules, employees, onUpdateSchedule }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleModal, setScheduleModal] = useState<{ open: boolean; date: Date | null }>({ open: false, date: null });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: Date) => {
    setScheduleModal({ open: true, date: day });
  };
  
  const handleScheduleSave = async (selectedIds: string[]) => {
      if(scheduleModal.date){
        await onUpdateSchedule(scheduleModal.date, selectedIds);
        setScheduleModal({ open: false, date: null });
      }
  };

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    attendance.forEach(record => {
      const dateKey = toLocalDateISOString(record.clockInTime);
      if (!map.has(dateKey)) {
        map.set(dateKey, new Set());
      }
      map.get(dateKey)!.add(record.employeeName.split(' ')[0]);
    });
    return map;
  }, [attendance]);
  
  const scheduledNamesByDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    Object.entries(schedules).forEach(([dateKey, employeeIds]) => {
        const names = new Set<string>();
        // FIX: Added Array.isArray check to prevent error on `unknown` type.
        if (Array.isArray(employeeIds)) {
          employeeIds.forEach(id => {
              const employee = employees.find(e => e.id === id);
              if (employee) {
                  names.add(employee.name.split(' ')[0]);
              }
          });
        }
        map.set(dateKey, names);
    });
    return map;
  }, [schedules, employees]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday is 0

  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  const initialSelectedIdsForModal = useMemo(() => {
    const dateKey = scheduleModal.date ? toLocalDateISOString(scheduleModal.date) : '';
    return new Set(schedules[dateKey] || []);
  }, [scheduleModal.date, schedules]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ChevronLeft size={24} />
        </button>
        <h4 className="text-xl font-semibold">
          {currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
        </h4>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ChevronRight size={24} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        {daysOfWeek.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="border rounded-lg border-transparent"></div>;
          }
          const dateKey = toLocalDateISOString(day);
          const attendedNames = attendanceByDate.get(dateKey) || new Set();
          const scheduledNames = scheduledNamesByDate.get(dateKey) || new Set();
          const allNames = Array.from(new Set([...scheduledNames, ...attendedNames]));

          const isToday = day.getTime() === today.getTime();
          
          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={`h-32 p-2 rounded-lg flex flex-col items-start relative transition-colors bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer ${
                isToday ? 'ring-2 ring-brand-indigo' : 'border border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="font-semibold text-sm self-end text-gray-700 dark:text-gray-300">{day.getDate()}</span>
              <div className="w-full mt-1 text-left overflow-y-auto text-xs space-y-1">
                {allNames.map(name => {
                    const hasAttended = attendedNames.has(name);
                    return (
                        <div key={name} className={`truncate flex items-center ${hasAttended ? 'font-semibold text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                           {hasAttended && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 flex-shrink-0"></div>}
                           {name}
                        </div>
                    );
                })}
              </div>
            </div>
          );
        })}
      </div>
       <ScheduleModal 
        key={scheduleModal.date?.toISOString()}
        isOpen={scheduleModal.open}
        date={scheduleModal.date}
        employees={employees}
        initialSelectedIds={initialSelectedIdsForModal}
        onClose={() => setScheduleModal({ open: false, date: null })}
        onSave={handleScheduleSave}
       />
    </div>
  );
};

export default AttendanceCalendar;
