import React, { useState, useEffect } from 'react';
import { Firestore } from 'firebase/firestore';
import { Employee, AttendanceRecord } from '../types';
import PayrollReport from './PayrollReport';
import EmployeeList from './EmployeeList';
import AddEmployeeForm from './AddEmployeeForm';
import EmployeeImporter from './EmployeeImporter';
import ChangePasswordForm from './ChangePasswordForm';
import { Download } from 'lucide-react';
import { DatabaseBackup as DatabaseBackupIcon } from './ui/Icons';


interface AdminViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  onAddEmployee: (name: string, rate: string) => Promise<void>;
  onUpdateEmployee: (id: string, newName: string, newRate: number) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  db: Firestore | null;
  settingsPath: string;
}

const AdminView: React.FC<AdminViewProps> = ({
  employees,
  attendance,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  db,
  settingsPath
}) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if ((window as any).XLSX) {
      setIsScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => console.error('Failed to load SheetJS script.');
    document.body.appendChild(script);
  }, []);

  const handleExportEmployeeList = () => {
    if (!isScriptLoaded || !(window as any).XLSX) return;
    const XLSX = (window as any).XLSX;
    const wb = XLSX.utils.book_new();
    const employeeData = employees.map(emp => ({ 'Имя': emp.name, 'Ставка': emp.rate, 'ID_в_базе': emp.id }));
    const ws = XLSX.utils.json_to_sheet(employeeData);
    XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники');
    XLSX.writeFile(wb, `employee_list_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportFullBackup = () => {
    if (!isScriptLoaded || !(window as any).XLSX) return;
    const XLSX = (window as any).XLSX;
    const wb = XLSX.utils.book_new();

    const employeeData = employees.map(emp => ({ 'Имя': emp.name, 'Ставка': emp.rate, 'ID_в_базе': emp.id }));
    const wsEmployees = XLSX.utils.json_to_sheet(employeeData);
    XLSX.utils.book_append_sheet(wb, wsEmployees, 'Все Сотрудники');

    const attendanceData = attendance.map(att => ({
      'Имя_Сотрудника': att.employeeName,
      'ID_Сотрудника': att.employeeId,
      'Дата Прихода': att.clockInTime?.toLocaleDateString('ru-RU'),
      'Время Прихода': att.clockInTime?.toLocaleTimeString('ru-RU'),
      'Дата Ухода': att.clockOutTime?.toLocaleDateString('ru-RU'),
      'Время Ухода': att.clockOutTime?.toLocaleTimeString('ru-RU'),
      'Статус': att.status,
      'ID_Смены': att.id,
    }));
    const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(wb, wsAttendance, 'Вся Посещаемость');

    XLSX.writeFile(wb, `full_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg lg:col-span-2">
        <h3 className="mb-6 text-2xl font-semibold">Расчет зарплаты</h3>
        <PayrollReport employees={employees} attendance={attendance} isScriptLoaded={isScriptLoaded} />
      </div>

      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg lg:col-span-2">
        <h3 className="mb-6 text-2xl font-semibold">Список сотрудников</h3>
        <EmployeeList employees={employees} onUpdate={onUpdateEmployee} onDelete={onDeleteEmployee} />
      </div>

      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-2xl font-semibold">Добавить сотрудника</h3>
        <AddEmployeeForm onSubmit={onAddEmployee} />
      </div>
      
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-2xl font-semibold">Импорт / Бэкап / Настройки</h3>
        <div className="space-y-6">
            <EmployeeImporter onAddEmployee={onAddEmployee} isScriptLoaded={isScriptLoaded} />
            
            <div className="border-t dark:border-gray-700 pt-6">
                 <h4 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Экспорт списка сотрудников</h4>
                 <button onClick={handleExportEmployeeList} disabled={!isScriptLoaded} className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400">
                    <Download size={20} />
                    {isScriptLoaded ? 'Экспорт списка в Excel' : 'Загрузка...'}
                </button>
            </div>
            
            <div className="border-t dark:border-gray-700 pt-6">
                <h4 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Скачать полный бэкап</h4>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Скачать .xlsx файл, содержащий ВСЕХ сотрудников и ВСЕ записи о посещаемости.
                </p>
                <button onClick={handleExportFullBackup} disabled={!isScriptLoaded} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400">
                    <DatabaseBackupIcon width={20} height={20} />
                    {isScriptLoaded ? 'Скачать полный бэкап' : 'Загрузка...'}
                </button>
            </div>

            {db && settingsPath && (
              <div className="border-t dark:border-gray-700 pt-6">
                  <h4 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Смена пароля</h4>
                  <ChangePasswordForm db={db} settingsPath={settingsPath} />
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminView;