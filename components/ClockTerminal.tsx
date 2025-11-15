
import React, { useState } from 'react';
import { ArrowLeft, Camera, VideoOff, Check, RotateCcw } from 'lucide-react';
import { Employee, AttendanceRecord } from '../types';
import { useWebcam } from '../hooks/useWebcam';
import Spinner from './ui/Spinner';

interface ClockTerminalProps {
  employee: Employee;
  onBack: () => void;
  onClockAction: (employee: Employee, action: 'clock-in' | 'clock-out', photoDataUrl: string) => Promise<void>;
  attendance: AttendanceRecord[];
}

const ClockTerminal: React.FC<ClockTerminalProps> = ({ employee, onBack, onClockAction, attendance }) => {
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const { videoRef, captureSnapshot, error, isCameraOn } = useWebcam(!photoPreviewUrl);
  const [isLoading, setIsLoading] = useState(false);

  const openShift = attendance.find((att) => att.status === 'clocked-in');
  const action = openShift ? 'clock-out' : 'clock-in';
  const actionButtonText = openShift ? 'Завершить смену' : 'Начать смену';
  const actionButtonColor = openShift
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-green-600 hover:bg-green-700';

  const handleCaptureClick = () => {
    if (!isCameraOn || error) {
      console.error('Камера не готова, действие отменено.');
      return;
    }
    const photoDataUrl = captureSnapshot();
    if (!photoDataUrl) {
      console.error('Не удалось сделать снимок.');
      return;
    }
    setPhotoPreviewUrl(photoDataUrl);
  };

  const handleConfirmClick = async () => {
    if (!photoPreviewUrl) return;
    setIsLoading(true);
    await onClockAction(employee, action, photoPreviewUrl);
    setIsLoading(false);
    onBack();
  };

  const handleRetakeClick = () => {
    setPhotoPreviewUrl(null);
  };


  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 rounded-lg bg-gray-300 dark:bg-gray-700 px-4 py-2 font-semibold text-gray-800 dark:text-gray-200 transition-all hover:bg-gray-400 dark:hover:bg-gray-600"
      >
        <ArrowLeft size={20} />
        Назад к списку
      </button>
      <div className="rounded-lg bg-white dark:bg-gray-800 p-4 text-center shadow-lg md:p-8">
        <h2 className="mb-6 text-4xl font-bold">{employee.name}</h2>
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
          {photoPreviewUrl ? (
            <img src={photoPreviewUrl} alt="Предпросмотр фото" className="h-full w-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {!isCameraOn && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
                  <Spinner />
                  <span className="mt-4 text-lg">Камера загружается...</span>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-80 p-4 text-white">
                  <VideoOff size={48} className="mb-4" />
                  <h3 className="text-xl font-semibold">Ошибка камеры</h3>
                  <p className="text-center text-sm">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {photoPreviewUrl ? (
            <div className="flex flex-col gap-4 sm:flex-row">
                 <button
                    onClick={handleRetakeClick}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-500 px-6 py-4 text-xl font-bold text-white shadow-lg transition-all hover:bg-gray-600 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                    <RotateCcw size={24} />
                    <span>Переснять</span>
                </button>
                <button
                    onClick={handleConfirmClick}
                    disabled={isLoading}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-xl font-bold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:bg-gray-400 ${actionButtonColor}`}
                >
                    {isLoading ? <Spinner /> : <><Check size={28} /> <span>Подтвердить</span></>}
                </button>
            </div>
        ) : (
            <button
              onClick={handleCaptureClick}
              disabled={isLoading || !isCameraOn || !!error}
              className={`flex w-full items-center justify-center gap-4 rounded-lg p-6 text-2xl font-bold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:bg-gray-400 ${actionButtonColor}`}
            >
              {isLoading ? <Spinner /> : <><Camera size={30} /> <span>{actionButtonText}</span></>}
            </button>
        )}
      </div>
    </div>
  );
};

export default ClockTerminal;
