
import { useState, useRef, useCallback, useEffect } from 'react';

export const useWebcam = (isActive: boolean) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Веб-камера не поддерживается этим браузером.');
        }
      return;
    }

    const videoElement = videoRef.current;
    
    videoElement.onplaying = () => {
      setIsCameraOn(true);
      setError(null);
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoElement.srcObject = stream;
      await videoElement.play();

      if (!videoElement.paused) {
        setIsCameraOn(true);
        setError(null);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Ошибка доступа к камере:', err);
        setError('Не удалось получить доступ к камере. Проверьте разрешения.');
      } else {
        console.log('Запрос play() прерван (очистка), это нормально.');
      }
      setIsCameraOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.onplaying = null;
      }
      setIsCameraOn(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  const captureSnapshot = (): string | null => {
    if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.readyState >= 3) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    }
    console.warn('Снимок не удался: видео не готово.');
    return null;
  };

  return { videoRef, captureSnapshot, error, isCameraOn };
};
