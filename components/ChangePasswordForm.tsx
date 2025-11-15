import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Firestore, doc, setDoc } from 'firebase/firestore';
import Spinner from './ui/Spinner';
import { Message } from '../types';

interface ChangePasswordFormProps {
  db: Firestore;
  settingsPath: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ db, settingsPath }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length === 0) {
      setMessage({ type: 'error', text: 'Пароль не может быть пустым.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Пароли не совпадают.' });
      return;
    }

    setIsLoading(true);
    try {
      const docRef = doc(db, settingsPath, 'admin');
      await setDoc(docRef, { password: newPassword }, { merge: true });
      setMessage({ type: 'success', text: 'Пароль успешно обновлен!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Не удалось обновить пароль.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="new-password" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Новый пароль</label>
        <input
          type="password"
          id="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Подтвердите пароль</label>
        <input
          type="password"
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      {message && (
        <p className={`rounded-md p-3 text-center text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={isLoading} className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-indigo-700 disabled:bg-gray-400">
        {isLoading ? <Spinner /> : <><KeyRound size={20} /> Сохранить пароль</>}
      </button>
    </form>
  );
};

export default ChangePasswordForm;