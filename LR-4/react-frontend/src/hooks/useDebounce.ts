import { useEffect, useState } from 'react';

/**
 * Custom hook для debounce значений
 * @param value - значение для debounce
 * @param delay - задержка в миллисекундах
 * @returns debounced значение
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Устанавливаем таймер для обновления debounced значения
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищаем таймер при изменении value или размонтировании
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
