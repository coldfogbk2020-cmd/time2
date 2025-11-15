import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { Download, X } from 'lucide-react';

interface PayrollReportProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  isScriptLoaded: boolean;
}

const PayrollReport: React.FC<PayrollReportProps> = ({ employees, attendance, isScriptLoaded }) => {
  const [startDate, setStartDate] = useState(() => new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  const reportData = useMemo(() => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    return employees.map((emp) => {
      let totalHours = 0;
      const empShifts = attendance.filter(att =>
        att.employeeId === emp.id &&
        att.status === 'clocked-out' &&
        att.clockInTime >= start &&
        att.clockOutTime && att.clockOutTime <= end
      );

      empShifts.forEach((shift) => {
        if (shift.clockOutTime) {
          const durationMs = shift.clockOutTime.getTime() - shift.clockInTime.getTime();
          totalHours += durationMs / (1000 * 60 * 60);
        }
      });

      return {
        ...emp,
        totalHours,
        totalPay: totalHours * emp.rate,
        shifts: empShifts.sort((a, b) => a.clockInTime.getTime() - b.clockInTime.getTime()),
      };
    });
  }, [employees, attendance, startDate, endDate]);

  const handleExport = () => {
    // Fix: Cast window.XLSX to any to avoid TypeScript errors and remove ts-ignore.
    if (!isScriptLoaded || !(window as any).XLSX) return;
    const XLSX = (window as any).XLSX;

    const wb = XLSX.utils.book_new();
    const summaryData = reportData.map(row => ({
      'Сотрудник': row.name, 'Ставка': row.rate, 'Всего Часы': row.totalHours.toFixed(2), 'Всего Зарплата (руб.)': row.totalPay.toFixed(2)
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка');

    const allShiftsData: any[] = [];
    reportData.forEach(emp => {
      emp.shifts.forEach(shift => {
        if (shift.clockOutTime) {
          const durationHours = (shift.clockOutTime.getTime() - shift.clockInTime.getTime()) / (1000 * 60 * 60);
          allShiftsData.push({
            'Сотрудник': emp.name,
            'Дата Прихода': shift.clockInTime.toLocaleDateString('ru-RU'),
            'Время Прихода': shift.clockInTime.toLocaleTimeString('ru-RU'),
            'Дата Ухода': shift.clockOutTime.toLocaleDateString('ru-RU'),
            'Время Ухода': shift.clockOutTime.toLocaleTimeString('ru-RU'),
            'Часы за смену': durationHours.toFixed(2),
          });
        }
      });
    });
    const wsAllShifts = XLSX.utils.json_to_sheet(allShiftsData);
    XLSX.utils.book_append_sheet(wb, wsAllShifts, 'Все смены');

    XLSX.writeFile(wb, `payroll_report_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1"><label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">С</label><input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/></div>
        <div className="flex-1"><label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">По</label><input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/></div>
      </div>
      <div className="mt-2"><button onClick={handleExport} disabled={!isScriptLoaded} className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"><Download size={20} />{isScriptLoaded ? 'Экспорт в Excel' : 'Загрузка экспорта...'}</button></div>
      <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700"><tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Сотрудник</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Всего Часы</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Всего Зарплата</th>
        </tr></thead>
        {reportData.map((row) => (
          <tbody key={row.id} className="divide-y divide-gray-200 dark:divide-gray-700 border-b-4 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <tr className="bg-gray-100 dark:bg-gray-700"><td className="px-4 py-3 text-lg font-medium">{row.name}</td><td className="px-4 py-3 text-lg font-semibold">{row.totalHours.toFixed(2)}</td><td className="px-4 py-3 text-lg font-semibold text-green-700 dark:text-green-400">{row.totalPay.toFixed(2)} руб.</td></tr>
            {row.shifts.length > 0 && (<tr className="text-sm font-medium text-gray-500 dark:text-gray-400"><td className="pl-8 px-4 py-2">Приход</td><td className="px-4 py-2">Фото (Приход)</td><td className="px-4 py-2">Уход</td><td className="px-4 py-2">Фото (Уход)</td></tr>)}
            {row.shifts.map((shift) => (
              <tr key={shift.id} className="text-sm"><td className="pl-8 px-4 py-2 text-gray-700 dark:text-gray-300">{shift.clockInTime.toLocaleString('ru-RU')}</td><td className="px-4 py-2"><img src={shift.clockInPhoto} alt="Приход" className="h-16 w-16 cursor-pointer rounded-md object-cover transition-transform hover:scale-110" onClick={() => setPhotoModalUrl(shift.clockInPhoto)}/></td><td className="px-4 py-2 text-gray-700 dark:text-gray-300">{shift.clockOutTime?.toLocaleString('ru-RU')}</td><td className="px-4 py-2">{shift.clockOutPhoto && <img src={shift.clockOutPhoto} alt="Уход" className="h-16 w-16 cursor-pointer rounded-md object-cover transition-transform hover:scale-110" onClick={() => setPhotoModalUrl(shift.clockOutPhoto)}/>}</td></tr>
            ))}
            {row.shifts.length === 0 && (<tr><td colSpan={4} className="pl-8 px-4 py-2 text-center text-gray-400">Нет завершенных смен в этот период.</td></tr>)}
          </tbody>
        ))}
      </table></div>
      {photoModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={() => setPhotoModalUrl(null)}>
          <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            <img src={photoModalUrl} alt="Увеличенное фото" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"/>
            <button onClick={() => setPhotoModalUrl(null)} className="absolute -top-4 -right-4 rounded-full bg-white dark:bg-gray-700 dark:text-gray-200 p-2 text-black"><X size={24} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollReport;