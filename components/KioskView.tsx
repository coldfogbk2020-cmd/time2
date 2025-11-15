
import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord, Schedule } from '../types';
import AttendanceCalendar from './AttendanceCalendar';

interface KioskViewProps {
  employees: Employee[];
  onSelect: (employee: Employee) => void;
  attendance: AttendanceRecord[];
  schedules: Schedule;
  onUpdateSchedule: (date: Date, employeeIds: string[]) => Promise<void>;
}

const formatDuration = (ms: number): string => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (num: number) => String(num).padStart(2, '0');
  if (hours > 0) return `${hours}ч ${pad(minutes)}м ${pad(seconds)}с`;
  if (minutes > 0) return `${minutes}м ${pad(seconds)}с`;
  return `${seconds}с`;
};

const formatShiftDuration = (ms: number): string => {
    if (ms < 0) ms = 0;
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}ч ${minutes}м`;
    return `${minutes}м`;
};

const toLocalDateISOString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const KioskView: React.FC<KioskViewProps> = ({ employees, onSelect, attendance, schedules, onUpdateSchedule }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-6 text-center shadow-lg">
        <h2 className="text-5xl font-bold text-gray-800 dark:text-gray-100">
          {time.toLocaleTimeString('ru-RU')}
        </h2>
        <p className="text-xl text-gray-500 dark:text-gray-400">
          {time.toLocaleDateString('ru-RU', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-center text-3xl font-semibold">
          Пожалуйста, выберите свое имя
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {employees.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
              Сотрудники не найдены. Добавьте их в админ-панели.
            </p>
          ) : (
            employees.map((emp) => {
              const openShift = attendance.find(
                (att) => att.employeeId === emp.id && att.status === 'clocked-in'
              );

              const todayKey = toLocalDateISOString(time);
              const isScheduled = !openShift && schedules[todayKey]?.includes(emp.id);

              let buttonColor = 'bg-blue-600 hover:bg-blue-700';
              let textColor = 'text-white';
              let subTextColor = 'text-white/80';
              let scheduledText: string | null = null;

              if (openShift) {
                  buttonColor = 'bg-green-600 hover:bg-green-700';
              } else if (isScheduled) {
                  buttonColor = 'bg-amber-300 hover:bg-amber-400 dark:bg-amber-600 dark:hover:bg-amber-700';
                  textColor = 'text-white';
                  subTextColor = 'text-white/80';
                  scheduledText = 'Запланирован(а)';
              }
              
              let totalHoursTodayMs = 0;
              if (openShift) {
                  const todayStart = new Date();
                  todayStart.setHours(0, 0, 0, 0);

                  attendance
                      .filter(a => 
                          a.employeeId === emp.id && 
                          a.status === 'clocked-out' && 
                          a.clockOutTime && 
                          a.clockInTime >= todayStart
                      )
                      .forEach(shift => {
                          totalHoursTodayMs += shift.clockOutTime!.getTime() - shift.clockInTime.getTime();
                      });
                  
                  totalHoursTodayMs += time.getTime() - openShift.clockInTime.getTime();
              }

              const lastShift = !openShift
                ? attendance
                    .filter((att) => att.employeeId === emp.id && att.status === 'clocked-out' && att.clockOutTime)
                    .sort((a, b) => b.clockOutTime!.getTime() - a.clockOutTime!.getTime())[0]
                : null;

              return (
                <button
                  key={emp.id}
                  onClick={() => onSelect(emp)}
                  className={`flex h-40 flex-col justify-center rounded-lg p-4 text-center text-2xl font-medium ${textColor} shadow transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl ${buttonColor}`}
                >
                  {emp.name}
                   {scheduledText && (
                    <span className={`mt-2 block text-base font-semibold ${subTextColor}`}>
                      {scheduledText}
                    </span>
                  )}
                  {openShift && (
                    <>
                      <span className={`mt-2 block text-sm font-normal ${subTextColor}`}>
                        На работе с {openShift.clockInTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`mt-1 block text-lg font-bold ${textColor}`}>
                        {formatDuration(time.getTime() - openShift.clockInTime.getTime())}
                      </span>
                      <span className={`mt-1 block text-xs font-normal ${subTextColor}`}>
                        Всего сегодня: {formatShiftDuration(totalHoursTodayMs)}
                      </span>
                    </>
                  )}
                  {!openShift && lastShift && lastShift.clockOutTime && (
                    <span className={`mt-2 block text-xs font-normal ${subTextColor}`}>
                      Посл. смена: {lastShift.clockInTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - {lastShift.clockOutTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      <br />
                      (Всего: {formatShiftDuration(lastShift.clockOutTime.getTime() - lastShift.clockInTime.getTime())})
                    </span>
                  )}
                  {!openShift && !lastShift && !isScheduled && (
                    <span className={`mt-2 block text-xs font-normal ${subTextColor}`}>
                      Нет завершенных смен
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-center text-3xl font-semibold">Календарь смен</h3>
        <AttendanceCalendar 
            attendance={attendance}
            schedules={schedules}
            employees={employees}
            onUpdateSchedule={onUpdateSchedule}
        />
      </div>
    </div>
  );
};

export default KioskView;
