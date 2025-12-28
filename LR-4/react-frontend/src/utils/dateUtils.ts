/**
 * Утилиты для работы с датами в формате ДД.ММ.ГГГГ
 */

/**
 * Форматирует дату из ISO формата (YYYY-MM-DD) в российский формат (ДД.ММ.ГГГГ)
 * @param isoDate - дата в формате YYYY-MM-DD
 * @returns дата в формате ДД.ММ.ГГГГ
 */
export function formatDateToRU(isoDate: string): string {
  if (!isoDate) return '';
  
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

/**
 * Конвертирует дату из российского формата (ДД.ММ.ГГГГ) в ISO формат (YYYY-MM-DD)
 * @param ruDate - дата в формате ДД.ММ.ГГГГ
 * @returns дата в формате YYYY-MM-DD
 */
export function formatDateToISO(ruDate: string): string {
  if (!ruDate) return '';
  
  const [day, month, year] = ruDate.split('.');
  return `${year}-${month}-${day}`;
}

/**
 * Получает текущую дату в формате ДД.ММ.ГГГГ
 * @returns текущая дата в формате ДД.ММ.ГГГГ
 */
export function getTodayRU(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  
  return `${day}.${month}.${year}`;
}

/**
 * Получает текущую дату в формате YYYY-MM-DD
 * @returns текущая дата в формате YYYY-MM-DD
 */
export function getTodayISO(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  
  return `${year}-${month}-${day}`;
}

/**
 * Валидирует дату в формате ДД.ММ.ГГГГ
 * @param ruDate - дата в формате ДД.ММ.ГГГГ
 * @returns true если дата валидна
 */
export function isValidRUDate(ruDate: string): boolean {
  if (!ruDate) return false;
  
  const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const match = ruDate.match(regex);
  
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Проверка на корректность дня в месяце
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}
