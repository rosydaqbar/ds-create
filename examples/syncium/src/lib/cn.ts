import { clsx, type ClassValue } from 'clsx';

/** Join class names. No class merging: system utilities never conflict by design. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
