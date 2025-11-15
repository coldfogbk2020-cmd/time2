
import React, { useState } from 'react';
import { Employee } from '../types';
import { Check, X, Edit, Trash2 } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  onUpdate: (id: string, newName: string, newRate: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EmployeeListItem: React.FC<{ employee: Employee; onUpdate: EmployeeListProps['onUpdate']; onDelete: EmployeeListProps['onDelete'] }> = ({ employee, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(employee.name);
  const [editRate, setEditRate] = useState(String(employee.rate));
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleSave = () => {
    onUpdate(employee.id, editName, parseFloat(editRate));
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditName(employee.name);
    setEditRate(String(employee.rate));
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (isConfirmingDelete) {
      onDelete(employee.id);
    } else {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000);
    }
  };

  if (isEditing) {
    return (
      <li className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Имя</label>
          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Ставка (руб./час)</label>
          <input type="number" min="0" step="0.01" value={editRate} onChange={(e) => setEditRate(e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex items-center gap-1 rounded-md bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600"><Check size={16} /> Сохранить</button>
          <button onClick={handleCancel} className="flex items-center gap-1 rounded-md bg-gray-500 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600"><X size={16} /> Отмена</button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col items-start gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <span className="text-lg font-medium">{employee.name}</span>
        <span className="ml-4 text-lg text-gray-600 dark:text-gray-400">{employee.rate} руб./час</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600"><Edit size={16} /> Редакт.</button>
        <button onClick={handleDelete} className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium text-white transition-colors ${isConfirmingDelete ? 'bg-red-700 hover:bg-red-800' : 'bg-red-500 hover:bg-red-600'}`}>
          <Trash2 size={16} /> {isConfirmingDelete ? 'Подтвердить?' : 'Удалить'}
        </button>
      </div>
    </li>
  );
};

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onUpdate, onDelete }) => {
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {employees.length === 0 ? (
        <li className="py-3 text-center text-gray-500 dark:text-gray-400">Сотрудники не найдены.</li>
      ) : (
        employees.map((emp) => <EmployeeListItem key={emp.id} employee={emp} onUpdate={onUpdate} onDelete={onDelete} />)
      )}
    </ul>
  );
};

export default EmployeeList;
