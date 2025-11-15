import React from 'react';
import { X, Info } from 'lucide-react';

interface DemoInfoModalProps {
  onClose: () => void;
  onClearConfig: () => void;
}

const DemoInfoModal: React.FC<DemoInfoModalProps> = ({ onClose, onClearConfig }) => {
  const handleClear = () => {
    if (window.confirm("Это очистит сохраненную конфигурацию и перезагрузит приложение, чтобы вы могли ввести новую. Вы уверены?")) {
      onClearConfig();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 transition-opacity" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="Закрыть"
        >
          <X size={24} />
        </button>
        <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                <Info size={28} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Что такое Режим Демонстрации?
            </h3>
        </div>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
                <h4 className="font-semibold text-lg mb-1">Почему я это вижу?</h4>
                <p>Вы находитесь в демонстрационном режиме, потому что приложение не подключено к базе данных. Это позволяет вам безопасно исследовать все функции.</p>
            </div>
             <div>
                <h4 className="font-semibold text-lg mb-1">Что я могу делать?</h4>
                <p>Вы можете использовать все части приложения: добавлять и редактировать сотрудников, отмечать приход/уход и создавать отчеты по зарплате. Приложение заполнено образцами данных для вашего удобства.</p>
            </div>
             <div>
                <h4 className="font-semibold text-lg mb-1">Важное ограничение</h4>
                <p>Любые изменения, которые вы вносите (например, добавление нового сотрудника), <strong className="text-red-600 dark:text-red-400">не будут сохранены</strong>. Данные сбросяся к исходным при обновлении страницы.</p>
            </div>
             <div className="border-t dark:border-gray-700 pt-4 mt-4">
                <h4 className="font-semibold text-lg mb-2">Выйти из Демо-режима</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Если вы хотите подключить базу данных, вы можете очистить текущие настройки и вернуться к экрану конфигурации.
                </p>
                <button
                    onClick={handleClear}
                    className="w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white shadow transition-colors hover:bg-red-700"
                >
                    Очистить конфигурацию и перезапустить
                </button>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white shadow transition-colors hover:bg-indigo-700"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoInfoModal;