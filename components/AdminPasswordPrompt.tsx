import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import Spinner from './ui/Spinner';

interface AdminPasswordPromptProps {
  onClose: () => void;
  onSuccess: () => void;
  db: Firestore;
  settingsPath: string;
}

const ADMIN_PASSWORD_DEFAULT = 'admin123';

const AdminPasswordPrompt: React.FC<AdminPasswordPromptProps> = ({ onClose, onSuccess, db, settingsPath }) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    let correctPassword = ADMIN_PASSWORD_DEFAULT;

    try {
      const docRef = doc(db, settingsPath, 'admin');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data()?.password) {
        correctPassword = docSnap.data()?.password;
      }
    } catch (err) {
      console.warn('Could not load password from DB, using default.', err);
    }

    if (passwordInput === correctPassword) {
      onSuccess();
    } else {
      setError('Неверный пароль. Попробуйте еще раз.');
      setPasswordInput('');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 transition-opacity">
      <div className="relative w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <X size={24} />
        </button>
        <h3 className="mb-6 text-center text-2xl font-semibold">
          Доступ к Панели Админа
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="admin-password" className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
              Введите пароль
            </label>
            <input
              ref={inputRef}
              type="password"
              id="admin-password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          {error && (
            <p className="rounded-md bg-red-100 p-3 text-center text-sm font-medium text-red-700 dark:bg-red-900/50 dark:text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isLoading ? <Spinner /> : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPasswordPrompt;