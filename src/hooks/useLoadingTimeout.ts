import { useEffect, useState } from 'react';

/**
 * Хук для защиты от бесконечной загрузки
 * Показывает ошибку если загрузка длится слишком долго
 */
export function useLoadingTimeout(isLoading: boolean, timeoutMs: number = 10000) {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      if (isLoading) {
        console.error('⏱️ Loading timeout exceeded:', timeoutMs, 'ms');
        setHasTimedOut(true);
      }
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [isLoading, timeoutMs]);

  return hasTimedOut;
}
