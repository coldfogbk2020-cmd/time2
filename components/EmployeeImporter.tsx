import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import Spinner from './ui/Spinner';
import { Message } from '../types';

interface EmployeeImporterProps {
  onAddEmployee: (name: string, rate: string) => Promise<void>;
  isScriptLoaded: boolean;
}

const EmployeeImporter: React.FC<EmployeeImporterProps> = ({ onAddEmployee, isScriptLoaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setFile(selectedFile);
      setMessage(null);
    } else {
      setFile(null);
      setMessage({ type: 'error', text: 'Пожалуйста, выберите файл .xlsx' });
    }
  };

  const handleImport = () => {
    // Fix: Cast window.XLSX to any to avoid TypeScript errors and remove ts-ignore.
    if (!file || !isScriptLoaded || !(window as any).XLSX) {
      setMessage({ type: 'error', text: 'Файл не готов или библиотека не загружена.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    
    // Fix: Cast window.XLSX to any to avoid TypeScript errors and remove ts-ignore.
    const XLSX = (window as any).XLSX;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          setMessage({ type: 'error', text: 'Файл пуст.' });
          setIsLoading(false);
          return;
        }

        const firstRow: any = json[0];
        if (!('Имя' in firstRow && 'Ставка' in firstRow)) {
            setMessage({ type: 'error', text: 'Неверный формат. Убедитесь, что колонки называются "Имя" и "Ставка".' });
            setIsLoading(false);
            return;
        }

        let importedCount = 0;
        let failedCount = 0;
        for (const row of json as any[]) {
          const name = row['Имя'];
          const rate = parseFloat(row['Ставка']);
          if (name && !isNaN(rate)) {
            await onAddEmployee(String(name), String(rate));
            importedCount++;
          } else {
            failedCount++;
          }
        }
        setMessage({ type: 'success', text: `Импорт завершен. Добавлено: ${importedCount}. Ошибок: ${failedCount}.` });
      } catch (err) {
        setMessage({ type: 'error', text: 'Ошибка при чтении файла.' });
      } finally {
        setIsLoading(false);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Загрузите .xlsx файл с колонками "Имя" и "Ставка".</p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx"
        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-200 dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50"
      />
      {message && (
        <p className={`rounded-md p-3 text-center text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
          {message.text}
        </p>
      )}
      <button onClick={handleImport} disabled={!file || !isScriptLoaded || isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400">
        {isLoading ? <Spinner /> : <><Upload size={20} />{isScriptLoaded ? 'Импортировать' : 'Загрузка...'}</>}
      </button>
    </div>
  );
};

export default EmployeeImporter;