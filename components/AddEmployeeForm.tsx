
import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Spinner from './ui/Spinner';

interface AddEmployeeFormProps {
  onSubmit: (name: string, rate: string) => Promise<void>;
}

const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rate) return;
    setIsLoading(true);
    await onSubmit(name, rate);
    setName('');
    setRate('');
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="employee-name" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Имя</label>
        <input
          type="text"
          id="employee-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Иван Иванов"
        />
      </div>
      <div>
        <label htmlFor="employee-rate" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Ставка (руб./час)</label>
        <input
          type="number"
          id="employee-rate"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          required
          min="0"
          step="0.01"
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="300.50"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? <Spinner /> : <><UserPlus size={20} /> Добавить</>}
      </button>
    </form>
  );
};

export default AddEmployeeForm;
